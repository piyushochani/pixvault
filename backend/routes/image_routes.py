from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from bson import ObjectId
from datetime import datetime, timezone
from typing import Optional

from middleware.auth_middleware import get_current_user
from services.mongodb_service import images_col
from services.cloudinary_service import upload_image
from services.pinecone_service import upsert_vector
from services.ai_pipeline import process_uploaded_image
from models.image_model import UpdateDescriptionRequest, MoveToFolderRequest
from utils.prompt_utils import sanitise_user_description, build_empty_library_response

router = APIRouter(prefix="/images", tags=["images"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def _serialize(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    doc["user_id"] = str(doc["user_id"])
    if doc.get("folder_id"):
        doc["folder_id"] = str(doc["folder_id"])
    return doc


# ── Upload ────────────────────────────────────────────────────────────────────
@router.post("/upload", status_code=201)
async def upload(
    file: UploadFile = File(...),
    user_description: Optional[str] = Form(None),
    user_id: str = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "Unsupported file type. Use JPEG, PNG, WEBP, or GIF.")

    image_bytes = await file.read()
    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(400, "File too large. Maximum size is 10 MB.")

    clean_desc = sanitise_user_description(user_description or "")

    image_id = str(ObjectId())
    cloud_result = upload_image(image_bytes, public_id=image_id)

    ai_result = process_uploaded_image(image_bytes)

    doc = {
        "_id": ObjectId(image_id),
        "user_id": ObjectId(user_id),
        "folder_id": None,
        "image_url": cloud_result["url"],
        "cloudinary_public_id": cloud_result["public_id"],
        "user_description": clean_desc,
        "ai_description": ai_result["ai_description"],
        "deleted": False,
        "deleted_at": None,
        "created_at": datetime.now(timezone.utc),
    }
    images_col.insert_one(doc)

    if ai_result["ai_ok"] and ai_result["embedding"]:
        upsert_vector(
            image_id=image_id,
            embedding=ai_result["embedding"],
            metadata={
                "user_id": user_id,
                "image_url": cloud_result["url"],
                "user_description": clean_desc,
            },
        )

    return _serialize(doc)


# ── List all active images ────────────────────────────────────────────────────
@router.get("/")
def list_images(
    sort: str = "desc",
    user_id: str = Depends(get_current_user),
):
    sort_dir = -1 if sort == "desc" else 1
    docs = list(
        images_col.find(
            {"user_id": ObjectId(user_id), "deleted": False},
            sort=[("created_at", sort_dir)],
        )
    )
    if not docs:
        return build_empty_library_response()

    return {"results": [_serialize(d) for d in docs], "count": len(docs)}


# ── Recent 10 images for overview ─────────────────────────────────────────────
# ⚠️ MUST be before /{image_id} to avoid route conflict
@router.get("/recent")
def recent_images(user_id: str = Depends(get_current_user)):
    docs = list(
        images_col.find(
            {"user_id": ObjectId(user_id), "deleted": False},
            sort=[("created_at", -1)],
            limit=10,
        )
    )
    if not docs:
        return build_empty_library_response()

    return {"results": [_serialize(d) for d in docs], "count": len(docs)}


# ── Overview stats ─────────────────────────────────────────────────────────────
# ⚠️ MUST be before /{image_id} to avoid route conflict
@router.get("/stats/overview")
def overview(user_id: str = Depends(get_current_user)):
    total_images = images_col.count_documents(
        {"user_id": ObjectId(user_id), "deleted": False}
    )
    return {"total_images": total_images}


# ── Single image ──────────────────────────────────────────────────────────────
@router.get("/{image_id}")
def get_image(image_id: str, user_id: str = Depends(get_current_user)):
    doc = images_col.find_one(
        {"_id": ObjectId(image_id), "user_id": ObjectId(user_id), "deleted": False}
    )
    if not doc:
        raise HTTPException(404, "Image not found.")
    return _serialize(doc)


# ── Update user description ───────────────────────────────────────────────────
@router.patch("/{image_id}/description")
def update_description(
    image_id: str,
    body: UpdateDescriptionRequest,
    user_id: str = Depends(get_current_user),
):
    clean = sanitise_user_description(body.user_description)
    result = images_col.update_one(
        {"_id": ObjectId(image_id), "user_id": ObjectId(user_id), "deleted": False},
        {"$set": {"user_description": clean}},
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Image not found.")
    return {"message": "Description updated.", "user_description": clean}


# ── Move to folder ────────────────────────────────────────────────────────────
@router.patch("/{image_id}/folder")
def move_to_folder(
    image_id: str,
    body: MoveToFolderRequest,
    user_id: str = Depends(get_current_user),
):
    folder_oid = ObjectId(body.folder_id) if body.folder_id else None
    result = images_col.update_one(
        {"_id": ObjectId(image_id), "user_id": ObjectId(user_id), "deleted": False},
        {"$set": {"folder_id": folder_oid}},
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Image not found.")
    return {"message": "Image moved."}


# ── Soft delete → recycle bin ─────────────────────────────────────────────────
@router.delete("/{image_id}")
def soft_delete(image_id: str, user_id: str = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    result = images_col.update_one(
        {"_id": ObjectId(image_id), "user_id": ObjectId(user_id), "deleted": False},
        {"$set": {"deleted": True, "deleted_at": now}},
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Image not found.")
    return {"message": "Image moved to recycle bin. It will be permanently deleted after 24 hours."}