# Standard library
import json
from typing import Optional

# FastAPI
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

# Pydantic
from pydantic import BaseModel

# Internal — auth & services
from backend.middleware.auth_middleware import get_current_user
from backend.services.clip_service import get_text_embedding
from backend.services.pinecone_service import query_vectors
from backend.services.gemini_service import (
    answer_image_question,
    rag_chat,
    semantic_search_query_expansion,
)

# MongoDB (used inline inside the route, but better to import at the top)
from bson import ObjectId
from backend.services.mongodb_service import images_col

# Import your existing pinecone search function — adjust import path as needed
# from services.pinecone_service import search_similar_images

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class TextChatRequest(BaseModel):
    query: str
    history: Optional[list[ChatMessage]] = []
    image_id: Optional[str] = None  # optional: if user is asking about a specific stored image


@router.post("/text")
async def text_chat(
    request: TextChatRequest,
    user_id: str = Depends(get_current_user),
):
    try:
        expanded_query = await semantic_search_query_expansion_async(request.query)

        embedding = get_text_embedding(expanded_query)
        raw_matches = query_vectors(embedding=embedding, user_id=user_id)

        # Fetch full image docs from MongoDB to build context
        from services.mongodb_service import images_col
        from bson import ObjectId
        pinecone_results = []
        for match in raw_matches[:5]:
            doc = images_col.find_one({"_id": ObjectId(match["image_id"]), "deleted": False})
            if doc:
                pinecone_results.append({
                    "image_id": match["image_id"],
                    "score": match["score"],
                    "description": doc.get("ai_description", ""),
                    "filename": doc.get("image_url", ""),
                    "tags": [],
                })

        history = [{"role": m.role, "content": m.content} for m in (request.history or [])]
        answer = rag_chat(
            user_query=request.query,
            pinecone_chunks=pinecone_results,
            chat_history=history,
        )
        return {"answer": answer, "sources": pinecone_results[:3]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.post("/image")
async def image_chat(
    question: str = Form(...),
    image: UploadFile = File(...),
    history: str = Form(default="[]"),
    user_id: str = Depends(get_current_user),
):

    """
    Image-specific chat — user uploads or references an image and asks a question.
    Returns Gemini's detailed answer (breed, species, location, etc.)
    """
    try:
        image_bytes = await image.read()
        mime_type = image.content_type or "image/jpeg"
        history_list = json.loads(history)

        answer = answer_image_question(
            image_bytes=image_bytes,
            question=question,
            mime_type=mime_type,
        )

        return {"answer": answer}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/image-rag")
async def image_rag_chat(
    question: str = Form(...),
    image: Optional[UploadFile] = File(default=None),
    history: str = Form(default="[]"),
    user_id: str = Depends(get_current_user),
):

    """
    Full RAG chat with optional image context.
    Searches Pinecone + uses image if provided + generates Gemini answer.
    """
    try:
        image_bytes = None
        mime_type = "image/jpeg"

        if image:
            image_bytes = await image.read()
            mime_type = image.content_type or "image/jpeg"

        history_list = json.loads(history)

        # Pinecone search
        # pinecone_results = search_similar_images(question, top_k=5)
        pinecone_results = []  # replace with real search

        answer = rag_chat(
            user_query=question,
            pinecone_chunks=pinecone_results,
            image_bytes=image_bytes,
            mime_type=mime_type,
            chat_history=history_list,
        )

        return {"answer": answer, "sources": pinecone_results[:3]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Helper to call sync function — if you use async pinecone client, adjust accordingly
async def semantic_search_query_expansion_async(query: str) -> str:
    return semantic_search_query_expansion(query)