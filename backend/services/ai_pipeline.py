from services.groq_service import generate_image_description as groq_describe
from services.gemini_service import generate_image_description as gemini_describe
from services.embedding_service import embed_text
from services.description_parser import parse_description
from utils.prompt_utils import sanitise_caption, validate_search_query


def process_uploaded_image(image_bytes: bytes, user_description: str = "") -> dict:

    # Step 1: Groq → Gemini fallback chain (BLIP removed — not Vercel compatible)
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
            print(f"[AI Pipeline] All AI services failed: {e2}")
            ai_description = None

    # Step 2: Merge user description + AI description
    parts = []
    if user_description and user_description.strip():
        parts.append(user_description.strip())
    if ai_description and ai_description.strip():
        parts.append(ai_description.strip())
    combined_description = " | ".join(parts) if parts else None

    # Step 3: Parse for metadata + embed FULL description
    embedding = []
    embed_summary = None
    parsed_meta = {}

    if combined_description:
        parsed = parse_description(combined_description)
        embed_summary = parsed["embed_summary"]
        parsed_meta = {
            "mood":    parsed["mood"],
            "colors":  parsed["colors"],
            "setting": parsed["setting"],
            "rating":  parsed["technical"].get("rating", ""),
        }
        try:
            embed_input = combined_description[:512]
            embedding = embed_text(embed_input)
            print("[AI Pipeline] Gemini embedding generated.")
        except Exception as e:
            print(f"[AI Pipeline] Embedding failed: {e}")
            embedding = []

    return {
        "ai_description": combined_description,
        "embed_summary":  embed_summary,
        "embedding":      embedding,
        "parsed_meta":    parsed_meta,
    }


def embed_search_query(query: str) -> tuple[list[float], str | None]:
    is_valid, result = validate_search_query(query)
    if not is_valid:
        return [], result

    try:
        embedding = embed_text(result)
        if not embedding:
            return [], "Failed to generate embedding. Please try again."
        return embedding, None
    except Exception as e:
        print(f"[AI Pipeline] Search embedding error: {e}")
        return [], "Embedding service is unavailable. Please try again later."