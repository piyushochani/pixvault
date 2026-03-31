import os
from typing import Optional
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")


def _image_part(image_bytes: bytes, mime_type: str = "image/jpeg"):
    return types.Part.from_bytes(data=image_bytes, mime_type=mime_type)


def generate_image_description(image_bytes: bytes, mime_type: str = "image/jpeg") -> str:
    prompt = (
        "You are analyzing an image for a photo library. "
        "Provide a rich, detailed description covering: "
        "1) Main subject (what/who is in the image), "
        "2) Brand names, model names, logos, or text visible, "
        "3) Colors, materials, finish (matte/glossy etc), "
        "4) Key components, parts, or features visible, "
        "5) Setting or background context, "
        "6) All colors present in the image in detail, "
        "7) Genre of the image, for example sports, cricket, football, wildlife, birds, cars, sky, water body, lake, beach, cycling, etc. "
        "Be specific — mention exact details like brand names, colors, and components. "
        "Write 5-6 sentences. Do not use bullet points."
    )
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=[_image_part(image_bytes, mime_type), prompt],
    )
    return response.text.strip()


def answer_image_question(
    image_bytes: bytes,
    question: str,
    mime_type: str = "image/jpeg",
) -> str:
    prompt = (
        f"The user is asking about this image: '{question}'\n\n"
        "Answer thoroughly and helpfully. If it's an animal, include: "
        "species/breed, habitat, diet, interesting facts, and conservation status if relevant. "
        "If it's a place, include name, location, and history. "
        "If it's an object, include what it is, its use, and any notable details. "
        "Be conversational and engaging."
    )
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=[_image_part(image_bytes, mime_type), prompt],
    )
    return response.text.strip()


def rag_chat(
    user_query: str,
    pinecone_chunks: list[dict],
    image_bytes: Optional[bytes] = None,
    mime_type: str = "image/jpeg",
    chat_history: Optional[list[dict]] = None,
) -> str:
    context_lines = []
    for i, chunk in enumerate(pinecone_chunks[:5], 1):
        desc  = chunk.get("description", "")
        fname = chunk.get("filename", f"image_{i}")
        score = chunk.get("score", 0)
        context_lines.append(f"[Result {i}] File: {fname} | Score: {score:.2f}\n{desc}")

    context_block = "\n\n".join(context_lines) if context_lines else "No matching images found."

    history_block = ""
    if chat_history:
        for msg in chat_history[-6:]:
            role = "User" if msg["role"] == "user" else "Assistant"
            history_block += f"{role}: {msg['content']}\n"

    system_prompt = (
        "You are PixVault's AI assistant — a helpful, knowledgeable guide for a photo library app. "
        "You help users search their image collection semantically and answer questions about images. "
        "Be conversational, accurate, and concise.\n\n"
        f"--- Relevant images from the vault ---\n{context_block}\n\n"
        f"--- Conversation so far ---\n{history_block}"
        f"User: {user_query}\nAssistant:"
    )

    contents = [_image_part(image_bytes, mime_type), system_prompt] if image_bytes else [system_prompt]

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=contents,
    )
    return response.text.strip()


def semantic_search_query_expansion(user_query: str) -> str:
    prompt = (
        f"A user is searching a photo library with this query: '{user_query}'\n"
        "Expand this into a detailed 2-3 sentence description of what they're likely looking for, "
        "including colors, mood, setting, and visual elements. "
        "Write only the expanded description, nothing else."
    )
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=[prompt],
    )
    return response.text.strip()