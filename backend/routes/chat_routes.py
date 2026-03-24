from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
import json

from services.gemini_service import (
    answer_image_question,
    rag_chat,
    semantic_search_query_expansion,
)
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
async def text_chat(request: TextChatRequest):
    """
    Semantic search chat — user types a query, we search Pinecone and reply via Gemini.
    Optionally focused on a specific image_id.
    """
    try:
        # 1. Expand query for better vector search
        expanded_query = await semantic_search_query_expansion_async(request.query)

        # 2. Search Pinecone — uncomment and adapt to your pinecone_service
        # pinecone_results = search_similar_images(expanded_query, top_k=5, image_id=request.image_id)
        pinecone_results = []  # placeholder — replace with real search

        # 3. Format history
        history = [{"role": m.role, "content": m.content} for m in (request.history or [])]

        # 4. Generate Gemini response
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
    history: str = Form(default="[]"),  # JSON string of chat history
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