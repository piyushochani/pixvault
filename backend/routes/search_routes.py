from fastapi import APIRouter, Depends, Query, HTTPException
from bson import ObjectId
import re

from middleware.auth_middleware import get_current_user
from services.mongodb_service import images_col
from services.pinecone_service import query_vectors
from services.ai_pipeline import embed_search_query
from utils.prompt_utils import build_no_results_response, build_empty_library_response


router = APIRouter(prefix="/search", tags=["search"])


def _serialize(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    doc["user_id"] = str(doc["user_id"])
    if doc.get("folder_id"):
        doc["folder_id"] = str(doc["folder_id"])
    return doc


# ── Keyword Search ─────────────────────────────────────────────────────────────
@router.get("/keyword")
def keyword_search(
    q: str       = Query(..., min_length=1),
    user_id: str = Depends(get_current_user),
):
    # Guard: check user has any images first
    total = images_col.count_documents({"user_id": ObjectId(user_id), "deleted": False})
    if total == 0:
        return build_empty_library_response()

    pattern = re.compile(re.escape(q.strip()), re.IGNORECASE)

    # Search across user_description AND ai_description ← NEW (ai_description added)
    docs = list(
        images_col.find(
            {
                "user_id": ObjectId(user_id),
                "deleted": False,
                "$or": [
                    {"user_description": {"$regex": pattern}},
                    {"ai_description":   {"$regex": pattern}},
                ],
            },
            sort=[("created_at", -1)],
        )
    )

    if not docs:
        return build_no_results_response("keyword", q)

    return {"results": [_serialize(d) for d in docs], "count": len(docs), "query": q}


# ── Semantic Search ────────────────────────────────────────────────────────────
@router.get("/semantic")
def semantic_search(
    q: str       = Query(..., min_length=3),
    user_id: str = Depends(get_current_user),
):
    total = images_col.count_documents({"user_id": ObjectId(user_id), "deleted": False})
    if total == 0:
        return build_empty_library_response()

    embedding, error = embed_search_query(q)
    if error:
        raise HTTPException(400, error)

    matches = query_vectors(embedding=embedding, user_id=user_id)
    if not matches:
        return build_no_results_response("semantic", q)

    # ✅ Filter by minimum similarity score — only return strong matches
    MIN_SCORE = 0.35   # tune this: 0.3 = loose, 0.4 = strict, 0.5 = very strict
    matches = [m for m in matches if m["score"] >= MIN_SCORE]

    if not matches:
        return build_no_results_response("semantic", q)

    matched_ids = [ObjectId(m["image_id"]) for m in matches]
    score_map   = {m["image_id"]: m["score"] for m in matches}

    docs = list(images_col.find({
        "_id":     {"$in": matched_ids},
        "user_id": ObjectId(user_id),
        "deleted": False,
    }))

    if not docs:
        return build_no_results_response("semantic", q)

    results = []
    for d in docs:
        serialized = _serialize(d)
        serialized["similarity_score"] = round(score_map.get(serialized["id"], 0), 4)
        results.append(serialized)

    results.sort(key=lambda x: x["similarity_score"], reverse=True)
    return {"results": results, "count": len(results), "query": q}