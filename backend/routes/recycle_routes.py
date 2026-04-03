from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime, timezone, timedelta

from middleware.auth_middleware import get_current_user
from services.mongodb_service import images_col
from services.pinecone_service import delete_image_vector
from services.cloudinary_service import delete_image as delete_cloudinary_image
from models.recycle_bin_model import RecycleBinItem, RestoreRequest, PermanentDeleteRequest


router = APIRouter(prefix="/recycle", tags=["recycle-bin"])

AUTO_DELETE_HOURS = 24


def _build_item(doc: dict) -> dict:
    deleted_at: datetime = doc["deleted_at"]
    if deleted_at.tzinfo is None:
        deleted_at = deleted_at.replace(tzinfo=timezone.utc)

    auto_delete_at = deleted_at + timedelta(hours=AUTO_DELETE_HOURS)
    now = datetime.now(timezone.utc)
    hours_remaining = max(0.0, (auto_delete_at - now).total_seconds() / 3600)

    return {
        "image_id":             str(doc["_id"]),
        "image_url":            doc.get("image_url", ""),
        "cloudinary_public_id": doc.get("cloudinary_public_id", ""),
        "user_description":     doc.get("user_description") or None,
        "ai_description":       doc.get("ai_description") or None,
        "deleted_at":           deleted_at.isoformat(),
        "auto_delete_at":       auto_delete_at.isoformat(),
        "hours_remaining":      round(hours_remaining, 2),
    }


def _purge_expired(user_id: str):
    cutoff = datetime.now(timezone.utc) - timedelta(hours=AUTO_DELETE_HOURS)
    expired = list(images_col.find({
        "user_id":    ObjectId(user_id),
        "deleted":    True,
        "deleted_at": {"$lt": cutoff},
    }))
    for img in expired:
        try:
            delete_image_vector(str(img["_id"]))
        except Exception as e:
            print(f"[Recycle] Pinecone delete skipped: {e}")
        try:
            delete_cloudinary_image(img.get("cloudinary_public_id", ""))
        except Exception as e:
            print(f"[Recycle] Cloudinary delete skipped: {e}")
        images_col.delete_one({"_id": img["_id"]})


@router.get("/bin")
def get_recycle_bin(user_id: str = Depends(get_current_user)):
    _purge_expired(user_id)

    cutoff = datetime.now(timezone.utc) - timedelta(hours=AUTO_DELETE_HOURS)
    docs = list(
        images_col.find(
            {
                "user_id":    ObjectId(user_id),
                "deleted":    True,
                "deleted_at": {"$gte": cutoff},
            },
            sort=[("deleted_at", -1)],
        )
    )

    if not docs:
        return {"results": [], "count": 0, "message": "Recycle bin is empty."}

    return {"results": [_build_item(d) for d in docs], "count": len(docs)}


@router.patch("/restore/{image_id}")
def restore_image(image_id: str, user_id: str = Depends(get_current_user)):
    cutoff = datetime.now(timezone.utc) - timedelta(hours=AUTO_DELETE_HOURS)
    result = images_col.update_one(
        {
            "_id":        ObjectId(image_id),
            "user_id":    ObjectId(user_id),
            "deleted":    True,
            "deleted_at": {"$gte": cutoff},
        },
        {"$set": {"deleted": False, "deleted_at": None}},
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Image not found in recycle bin or restore window has expired.")
    return {"message": "Image restored successfully."}


@router.delete("/permanent/{image_id}")
def permanent_delete(image_id: str, user_id: str = Depends(get_current_user)):
    doc = images_col.find_one(
        {"_id": ObjectId(image_id), "user_id": ObjectId(user_id), "deleted": True}
    )
    if not doc:
        raise HTTPException(404, "Image not found in recycle bin.")

    # ── Delete from Pinecone ───────────────────────────────────────────────
    try:
        delete_image_vector(image_id)
    except Exception as e:
        print(f"[Recycle] Pinecone delete skipped: {e}")

    # ── Delete from Cloudinary ─────────────────────────────────────────────
    try:
        delete_cloudinary_image(doc.get("cloudinary_public_id", ""))
    except Exception as e:
        print(f"[Recycle] Cloudinary delete skipped: {e}")

    # ── Delete from MongoDB ────────────────────────────────────────────────
    images_col.delete_one({"_id": ObjectId(image_id)})

    return {"message": "Image permanently deleted."}