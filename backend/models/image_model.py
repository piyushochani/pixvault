from pydantic import BaseModel
from typing import Optional


class UpdateDescriptionRequest(BaseModel):
    user_description: str


class MoveToFolderRequest(BaseModel):
    folder_id: Optional[str] = None   # None = remove from folder