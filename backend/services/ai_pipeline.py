from services.blip_service import generate_caption
from services.clip_service import get_image_embedding, get_text_embedding
from services.gemini_service import generate_image_description
from utils.prompt_utils import sanitise_caption, validate_search_query


def process_uploaded_image(image_bytes: bytes) -> dict:
    """
    Full AI pipeline for a newly uploaded image.

    Returns a dict:
    {
        "ai_description": str | None,   # best available caption/description
        "embedding":       list[float], # 512-dim CLIP vector
        "ai_ok":           bool,        # False if embedding failed
    }
    """

    # ── Step 1: BLIP caption ──────────────────────────────────────────────────
    raw_caption = None
    try:
        raw_caption = generate_caption(image_bytes)
    except Exception as e:
        print(f"[AI Pipeline] BLIP caption failed: {e}")

    clean_caption = sanitise_caption(raw_caption) if raw_caption else None

    # ── Step 2: Gemini fallback (only if BLIP returned nothing usable) ────────
    ai_description = clean_caption  # prefer BLIP — it's local and free
    if not ai_description:
        try:
            gemini_desc = generate_image_description(image_bytes)
            ai_description = gemini_desc if gemini_desc else None
            print("[AI Pipeline] Used Gemini fallback for description.")
        except Exception as e:
            print(f"[AI Pipeline] Gemini description failed: {e}")
            ai_description = None

    # ── Step 3: CLIP embedding ────────────────────────────────────────────────
    embedding = []
    try:
        embedding = get_image_embedding(image_bytes)
    except Exception as e:
        print(f"[AI Pipeline] CLIP embedding failed: {e}")

    ai_ok = bool(embedding)  # pipeline is usable as long as embedding succeeded

    return {
        "ai_description": ai_description,
        "embedding": embedding,
        "ai_ok": ai_ok,
    }


def embed_search_query(query: str) -> tuple[list[float], str | None]:
    """
    Validate and embed a user's semantic search query using CLIP text encoder.

    Used by search_routes.py for the /search/semantic endpoint.

    Returns:
        (embedding, None)          on success
        ([], error_message_str)    on failure
    """
    is_valid, result = validate_search_query(query)
    if not is_valid:
        return [], result  # result is the error message when invalid

    try:
        embedding = get_text_embedding(result)  # result is the cleaned query string
        if not embedding:
            return [], "Failed to generate embedding. Please try again."
        return embedding, None
    except Exception as e:
        print(f"[AI Pipeline] Search embedding error: {e}")
        return [], "Embedding service is unavailable. Please try again later."
