from services.blip_service import generate_caption
from services.clip_service import get_image_embedding, get_text_embedding
from services.groq_service import generate_image_description as groq_describe
from services.gemini_service import generate_image_description as gemini_describe
from utils.prompt_utils import sanitise_caption, validate_search_query


def process_uploaded_image(image_bytes: bytes, user_description: str = "") -> dict:
    # Step 1: CLIP embedding
    embedding = get_image_embedding(image_bytes)

    # Step 2: Groq → Gemini → BLIP fallback chain
    ai_description = None
    try:
        ai_description = groq_describe(image_bytes)
        print("[AI Pipeline] Groq description generated.")
    except Exception as e:
        print(f"[AI Pipeline] Groq failed, trying Gemini: {e}")
        try:
            ai_description = gemini_describe(image_bytes)
            print("[AI Pipeline] Gemini description generated.")
        except Exception as e2:
            print(f"[AI Pipeline] Gemini failed, falling back to BLIP: {e2}")
            try:
                blip_caption = generate_caption(image_bytes)
                ai_description = sanitise_caption(blip_caption)
                print("[AI Pipeline] BLIP caption generated.")
            except Exception as e3:
                print(f"[AI Pipeline] All AI services failed: {e3}")
                ai_description = None

    # Step 3: Merge user description + AI description
    parts = []
    if user_description and user_description.strip():
        parts.append(user_description.strip())
    if ai_description and ai_description.strip():
        parts.append(ai_description.strip())
    combined_description = " | ".join(parts) if parts else None

    return {
        "ai_description": combined_description,
        "embedding": embedding,
    }


def embed_search_query(query: str) -> tuple[list[float], str | None]:
    is_valid, result = validate_search_query(query)
    if not is_valid:
        return [], result

    try:
        embedding = get_text_embedding(result)
        if not embedding:
            return [], "Failed to generate embedding. Please try again."
        return embedding, None
    except Exception as e:
        print(f"[AI Pipeline] Search embedding error: {e}")
        return [], "Embedding service is unavailable. Please try again later."