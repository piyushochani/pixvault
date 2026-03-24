import os
import base64
from typing import Optional
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

model = genai.GenerativeModel(GEMINI_MODEL)


def _image_to_part(image_bytes: bytes, mime_type: str = "image/jpeg"):
    """Convert raw image bytes to a Gemini-compatible part."""
    return {
        "inline_data": {
            "mime_type": mime_type,
            "data": base64.b64encode(image_bytes).decode("utf-8"),
        }
    }


def generate_image_description(image_bytes: bytes, mime_type: str = "image/jpeg") -> str:
    """
    Generate a rich text description of an image for embedding & indexing.
    Called when a user uploads an image to PixVault.
    """
    prompt = (
        "Describe this image in rich detail for semantic search indexing. "
        "Include: subject matter, colors, mood, setting, objects, people (if any), "
        "style, and any text visible. If it's an animal, include species, breed, "
        "and distinguishing features. Be thorough but concise (3-5 sentences)."
    )
    response = model.generate_content([_image_to_part(image_bytes, mime_type), prompt])
    return response.text.strip()


def answer_image_question(
    image_bytes: bytes,
    question: str,
    mime_type: str = "image/jpeg",
) -> str:
    """
    Answer a specific user question about an image.
    E.g. 'What bird is this?', 'What breed is this dog?'
    """
    prompt = (
        f"The user is asking about this image: '{question}'\n\n"
        "Answer thoroughly and helpfully. If it's an animal, include: "
        "species/breed, habitat, diet, interesting facts, and conservation status if relevant. "
        "If it's a place, include name, location, and history. "
        "If it's an object, include what it is, its use, and any notable details. "
        "Be conversational and engaging."
    )
    response = model.generate_content([_image_to_part(image_bytes, mime_type), prompt])
    return response.text.strip()


def rag_chat(
    user_query: str,
    pinecone_chunks: list[dict],
    image_bytes: Optional[bytes] = None,
    mime_type: str = "image/jpeg",
    chat_history: Optional[list[dict]] = None,
) -> str:
    """
    RAG-style chat: takes Pinecone search results + optional image + user query
    and returns a Gemini-generated answer.

    pinecone_chunks: list of dicts with keys like 'description', 'filename', 'tags', 'score'
    chat_history: list of {'role': 'user'|'assistant', 'content': str}
    """
    # Build context from Pinecone results
    context_lines = []
    for i, chunk in enumerate(pinecone_chunks[:5], 1):  # top 5 results
        desc = chunk.get("description", "")
        fname = chunk.get("filename", f"image_{i}")
        tags = ", ".join(chunk.get("tags", []))
        score = chunk.get("score", 0)
        context_lines.append(
            f"[Result {i}] File: {fname} | Tags: {tags} | Score: {score:.2f}\n{desc}"
        )

    context_block = "\n\n".join(context_lines) if context_lines else "No matching images found."

    # Build history string
    history_block = ""
    if chat_history:
        for msg in chat_history[-6:]:  # last 3 turns
            role = "User" if msg["role"] == "user" else "Assistant"
            history_block += f"{role}: {msg['content']}\n"

    system_prompt = (
        "You are PixVault's AI assistant — a helpful, knowledgeable guide for a photo library app. "
        "You help users search their image collection semantically and answer questions about images. "
        "Be conversational, accurate, and concise. "
        "When referencing search results, mention the relevant image filenames naturally.\n\n"
        f"--- Relevant images from the vault ---\n{context_block}\n\n"
        f"--- Conversation so far ---\n{history_block}"
        f"User: {user_query}\nAssistant:"
    )

    parts = [system_prompt]
    if image_bytes:
        parts = [_image_to_part(image_bytes, mime_type), system_prompt]

    response = model.generate_content(parts)
    return response.text.strip()


def semantic_search_query_expansion(user_query: str) -> str:
    """
    Expand a short user query into a richer description for better Pinecone vector search.
    E.g. 'sunset beach' → detailed description useful for embedding similarity.
    """
    prompt = (
        f"A user is searching a photo library with this query: '{user_query}'\n"
        "Expand this into a detailed 2-3 sentence description of what they're likely looking for, "
        "including colors, mood, setting, and visual elements. "
        "Write only the expanded description, nothing else."
    )
    response = model.generate_content(prompt)
    return response.text.strip()