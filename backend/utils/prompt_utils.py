"""
prompt_utils.py
---------------
Prompt-level optimisation utilities that sit between raw AI output
and what gets stored / returned to the user.

Goals:
  1. Reduce hallucination in BLIP captions.
  2. Normalise and sanitise AI descriptions.
  3. Validate semantic search queries before embedding.
  4. Provide honest "no results" signals instead of fabricated answers.
"""

import re
from typing import Optional

# ── Phrases BLIP sometimes hallucinates even on blank/simple images ──────────
_HALLUCINATION_PHRASES = [
    "there is no",
    "i don't see",
    "i cannot",
    "i can't",
    "image of a image",
    "a image of a image",
    "arafed",          # BLIP artefact token
    "arafed image",
    "araffe",          # another BLIP artefact
    "null",
    "none",
    "n/a",
]

# ── Minimum meaningful caption length (chars) ────────────────────────────────
_MIN_CAPTION_LENGTH = 8

# ── Maximum stored description length ────────────────────────────────────────
_MAX_DESCRIPTION_LENGTH = 1000


def sanitise_caption(raw_caption: str) -> Optional[str]:
    """
    Clean and validate a BLIP-generated caption.

    Steps:
      1. Strip whitespace, lowercase for checks.
      2. Reject captions that contain known hallucination phrases.
      3. Reject captions shorter than the minimum meaningful length.
      4. Remove repeated words/phrases (BLIP sometimes loops).
      5. Capitalise first letter, strip trailing punctuation noise.

    Returns the cleaned caption string, or None if the caption is
    considered unreliable and should not be stored.
    """
    if not raw_caption:
        return None

    stripped = raw_caption.strip()
    lowered = stripped.lower()

    # Reject hallucinated phrases
    for phrase in _HALLUCINATION_PHRASES:
        if phrase in lowered:
            return None

    # Reject too-short captions
    if len(stripped) < _MIN_CAPTION_LENGTH:
        return None

    # Remove consecutive duplicate words (e.g. "a dog dog sitting")
    words = stripped.split()
    deduped = [words[0]] if words else []
    for word in words[1:]:
        if word.lower() != deduped[-1].lower():
            deduped.append(word)
    cleaned = " ".join(deduped)

    # Remove trailing punctuation noise (commas, semicolons)
    cleaned = re.sub(r"[,;]+$", "", cleaned).strip()

    # Sentence-case
    if cleaned:
        cleaned = cleaned[0].upper() + cleaned[1:]

    # Truncate to max length
    if len(cleaned) > _MAX_DESCRIPTION_LENGTH:
        cleaned = cleaned[:_MAX_DESCRIPTION_LENGTH].rsplit(" ", 1)[0] + "…"

    return cleaned if len(cleaned) >= _MIN_CAPTION_LENGTH else None


def sanitise_user_description(text: str) -> str:
    """
    Clean user-provided image description.
    Strips excess whitespace, limits length, removes control characters.
    """
    if not text:
        return ""
    cleaned = re.sub(r"[\x00-\x1f\x7f]", "", text)   # control chars
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    if len(cleaned) > _MAX_DESCRIPTION_LENGTH:
        cleaned = cleaned[:_MAX_DESCRIPTION_LENGTH].rsplit(" ", 1)[0] + "…"
    return cleaned


def validate_search_query(query: str) -> tuple[bool, str]:
    """
    Validate a semantic search query before generating an embedding.

    Returns (is_valid: bool, reason: str).
    Invalid queries should not be sent to CLIP — they produce
    noisy embeddings that match almost everything.
    """
    if not query or not query.strip():
        return False, "Query is empty."

    q = query.strip()

    if len(q) < 3:
        return False, "Query is too short. Please describe your image in more detail."

    if len(q) > 500:
        return False, "Query is too long. Please keep it under 500 characters."

    # Reject purely numeric or symbol-only queries
    if re.fullmatch(r"[\d\W]+", q):
        return False, "Query must contain descriptive words."

    return True, q.strip()


def build_no_results_response(search_type: str, query: str) -> dict:
    """
    Return a structured 'no results' payload.
    Used to prevent the frontend from showing blank states that could
    be misread as errors, and to prevent any upstream hallucination.

    search_type: "keyword" | "semantic"
    """
    messages = {
        "keyword": (
            f"No images found matching '{query}'. "
            "Try different words from your image descriptions."
        ),
        "semantic": (
            f"No images found that visually match '{query}'. "
            "Try rephrasing — describe colours, objects, or scenes in the image."
        ),
    }
    return {
        "results": [],
        "count": 0,
        "message": messages.get(search_type, "No images found."),
    }


def build_empty_library_response() -> dict:
    """
    Explicit response when a user has zero images uploaded.
    Prevents any downstream code from fabricating placeholder data.
    """
    return {
        "results": [],
        "count": 0,
        "message": "You have not uploaded any images yet. Upload your first image to get started.",
    }