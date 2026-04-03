from services.blip_service import generate_caption
from services.groq_service import generate_image_description as groq_describe
from services.gemini_service import generate_image_description as gemini_describe
from services.embedding_service import embed_text
from services.description_parser import parse_description
from utils.prompt_utils import sanitise_caption, validate_search_query


def process_uploaded_image(image_bytes: bytes, user_description: str = "") -> dict:

    # Step 1: Groq → Gemini → BLIP fallback chain
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

    # Step 2: Merge user description + AI description
    parts = []
    if user_description and user_description.strip():
        parts.append(user_description.strip())
    if ai_description and ai_description.strip():
        parts.append(ai_description.strip())
    combined_description = " | ".join(parts) if parts else None

    # Step 3: Parse for metadata + embed FULL description (not just keywords)
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
            # ✅ Embed full description — preserves meaning, not just keywords
            # Cap at 512 chars to stay within token limits safely
            embed_input = combined_description[:512]
            embedding = embed_text(embed_input)
            print("[AI Pipeline] Sentence-transformer embedding generated.")
        except Exception as e:
            print(f"[AI Pipeline] Embedding failed: {e}")
            embedding = []

    return {
        "ai_description": combined_description,   # full text → MongoDB
        "embed_summary":  embed_summary,           # keywords → Pinecone metadata
        "embedding":      embedding,               # 384-dim vector → Pinecone
        "parsed_meta":    parsed_meta,             # mood, colors, rating etc.
    }


def embed_search_query(query: str) -> tuple[list[float], str | None]:
    is_valid, result = validate_search_query(query)
    if not is_valid:
        return [], result

    try:
        # ✅ Embed full natural language query — no stripping, preserves meaning
        # "show me someone who fell" correctly matches "dropped", "crashed" etc.
        embedding = embed_text(result)
        if not embedding:
            return [], "Failed to generate embedding. Please try again."
        return embedding, None
    except Exception as e:
        print(f"[AI Pipeline] Search embedding error: {e}")
        return [], "Embedding service is unavailable. Please try again later."