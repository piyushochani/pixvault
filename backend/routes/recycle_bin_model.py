from pydantic import BaseModel
from typing import Optional


class RecycleBinItem(BaseModel):
    image_id: str
    image_url: str
    user_description: Optional[str] = None
    ai_description: Optional[str] = None
    deleted_at: str          # ISO datetime string
    auto_delete_at: str      # deleted_at + 24 hrs, ISO datetime string
    hours_remaining: float   # how many hours before permanent deletion


class RestoreRequest(BaseModel):
    image_id: str


class PermanentDeleteRequest(BaseModel):
    image_id: str