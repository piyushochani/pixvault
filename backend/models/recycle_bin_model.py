from pydantic import BaseModel
from typing import Optional

class RecycleBinItem(BaseModel):
    image_id: str
    image_url: str
    user_description: Optional[str] = None
    ai_description: Optional[str] = None
    deleted_at: str
    auto_delete_at: str
    hours_remaining: float

class RestoreRequest(BaseModel):
    image_id: str

class PermanentDeleteRequest(BaseModel):
    image_id: str