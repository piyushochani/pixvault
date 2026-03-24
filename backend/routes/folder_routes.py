from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime, timezone

from middleware.auth_middleware import get_current_user
from services.mongodb_service import folders_col, images_col
from models.folder_model import CreateFolderRequest, RenameFolderRequest

router = APIRouter(prefix="/folders", tags=["folders"])


def _serialize(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    doc["user_id"] = str(doc["user_id"])
    return doc


@router.post("/", status_code=201)
def create_folder(body: CreateFolderRequest, user_id: str = Depends(get_current_user)):
    name = body.name.strip()
    if not name:
        raise HTTPException(400, "Folder name cannot be empty.")
    if len(name) > 100:
        raise HTTPException(400, "Folder name too long.")

    doc = {
        "_id": ObjectId(),
        "user_id": ObjectId(user_id),
        "name": name,
        "created_at": datetime.now(timezone.utc),
    }
    folders_col.insert_one(doc)
    return _serialize(doc)


@router.get("/")
def list_folders(user_id: str = Depends(get_current_user)):
    docs = list(
        folders_col.find({"user_id": ObjectId(user_id)}, sort=[("created_at", -1)])
    )
    # Attach image count per folder
    result = []
    for d in docs:
        count = images_col.count_documents(
            {"folder_id": d["_id"], "deleted": False}
        )
        folder = _serialize(d)
        folder["image_count"] = count
        result.append(folder)
    return {"folders": result, "count": len(result)}


@router.patch("/{folder_id}")
def rename_folder(
    folder_id: str,
    body: RenameFolderRequest,
    user_id: str = Depends(get_current_user),
):
    name = body.name.strip()
    if not name:
        raise HTTPException(400, "Folder name cannot be empty.")
    result = folders_col.update_one(
        {"_id": ObjectId(folder_id), "user_id": ObjectId(user_id)},
        {"$set": {"name": name}},
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Folder not found.")
    return {"message": "Folder renamed.", "name": name}


@router.delete("/{folder_id}")
def delete_folder(folder_id: str, user_id: str = Depends(get_current_user)):
    result = folders_col.delete_one(
        {"_id": ObjectId(folder_id), "user_id": ObjectId(user_id)}
    )
    if result.deleted_count == 0:
        raise HTTPException(404, "Folder not found.")
    # Unlink images from this folder (images stay, just removed from folder)
    images_col.update_many(
        {"folder_id": ObjectId(folder_id), "user_id": ObjectId(user_id)},
        {"$set": {"folder_id": None}},
    )
    return {"message": "Folder deleted. Images are still in your library."}


@router.get("/{folder_id}/images")
def folder_images(folder_id: str, user_id: str = Depends(get_current_user)):
    docs = list(
        images_col.find(
            {
                "folder_id": ObjectId(folder_id),
                "user_id": ObjectId(user_id),
                "deleted": False,
            },
            sort=[("created_at", -1)],
        )
    )
    if not docs:
        return {"results": [], "count": 0, "message": "This folder has no images yet."}

    def ser(d):
        d["id"] = str(d.pop("_id"))
        d["user_id"] = str(d["user_id"])
        if d.get("folder_id"):
            d["folder_id"] = str(d["folder_id"])
        return d

    return {"results": [ser(d) for d in docs], "count": len(docs)}