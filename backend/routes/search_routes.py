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


# ── Keyword search (on user_description only) ─────────────────────────────────
@router.get("/keyword")
def keyword_search(
    q: str = Query(..., min_length=1),
    user_id: str = Depends(get_current_user),
):
    # Guard: check user has any images first
    total = images_col.count_documents({"user_id": ObjectId(user_id), "deleted": False})
    if total == 0:
        return build_empty_library_response()

    # Case-insensitive regex search on user_description
    pattern = re.compile(re.escape(q.strip()), re.IGNORECASE)
    docs = list(
        images_col.find(
            {
                "user_id": ObjectId(user_id),
                "deleted": False,
                "user_description": {"$regex": pattern},
            },
            sort=[("created_at", -1)],
        )
    )

    if not docs:
        return build_no_results_response("keyword", q)

    return {"results": [_serialize(d) for d in docs], "count": len(docs)}


# ── Semantic search (CLIP embedding → Pinecone) ───────────────────────────────
@router.get("/semantic")
def semantic_search(
    q: str = Query(..., min_length=3),
    user_id: str = Depends(get_current_user),
):
    # Guard: check user has any images first
    total = images_col.count_documents({"user_id": ObjectId(user_id), "deleted": False})
    if total == 0:
        return build_empty_library_response()

    # Validate query and get embedding
    embedding, error = embed_search_query(q)
    if error:
        raise HTTPException(400, error)

    # Query Pinecone (filtered to this user's vectors only)
    matches = query_vectors(embedding=embedding, user_id=user_id)

    if not matches:
        return build_no_results_response("semantic", q)

    # Fetch full image documents from MongoDB for matched IDs
    matched_ids = [ObjectId(m["image_id"]) for m in matches]
    score_map = {m["image_id"]: m["score"] for m in matches}

    docs = list(
        images_col.find(
            {
                "_id": {"$in": matched_ids},
                "user_id": ObjectId(user_id),
                "deleted": False,
            }
        )
    )

    if not docs:
        return build_no_results_response("semantic", q)

    # Attach similarity score and sort by it descending
    results = []
    for d in docs:
        serialized = _serialize(d)
        serialized["similarity_score"] = round(score_map.get(serialized["id"], 0), 4)
        results.append(serialized)

    results.sort(key=lambda x: x["similarity_score"], reverse=True)
    return {"results": results, "count": len(results)}