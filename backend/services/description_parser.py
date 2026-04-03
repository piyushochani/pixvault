"""
description_parser.py — PixVault
---------------------------------
Extracts ALL meaningful keywords from AI description into a compact
embed_summary (≤77 CLIP tokens / ~400 chars) for Pinecone metadata.
"""

import re
from typing import TypedDict


class ParsedDescription(TypedDict):
    full_description: str
    embed_summary: str
    subjects: list[str]
    mood: str
    setting: str
    colors: str
    technical: dict


# ── Regex patterns ─────────────────────────────────────────────────────────────

_TECH_BLOCK_RE = re.compile(
    r"\(Exposure:\s*(?P<exposure>[\w/]+).*?"
    r"Contrast:\s*(?P<contrast>[\w]+).*?"
    r"Colors:\s*(?P<colors>[^,]+).*?"
    r"White Balance:\s*(?P<wb>[^,]+).*?"
    r"Sharpness:\s*(?P<sharpness>[\w]+).*?"
    r"Noise:\s*(?P<noise>[\w]+).*?"
    r"Depth of Field:\s*(?P<dof>[\w]+).*?"
    r"Estimated ISO:\s*(?P<iso>\d+).*?"
    r"Estimated Shutter Speed:\s*(?P<shutter>[^,]+).*?"
    r"Estimated Aperture:\s*(?P<aperture>[^,]+).*?"
    r"Composition:\s*(?P<composition>[^,]+).*?"
    r"Overall Rating:\s*(?P<rating>[^)]+)\)",
    re.DOTALL | re.IGNORECASE,
)

_MOOD_RE = re.compile(
    r"(?:mood|atmosphere|feeling)[^\.\n]*?(?:is one of|is|:|suggests?)\s*([^\.]+)\.",
    re.IGNORECASE,
)

_SETTING_RE = re.compile(
    r"(?:set against|background of|scene of|depicts? a?)\s*([^,\.]+)",
    re.IGNORECASE,
)


# ── Stopwords ──────────────────────────────────────────────────────────────────

STOPWORDS = {
    # articles / determiners
    "the", "a", "an", "this", "that", "these", "those", "its", "their",
    "his", "her", "our", "your", "my", "which", "whose",
    # prepositions
    "of", "in", "on", "at", "to", "for", "from", "by", "with",
    "into", "onto", "over", "under", "along", "against", "around",
    "through", "between", "within", "toward", "towards", "behind",
    "beside", "below", "above", "across", "near", "out", "off",
    # conjunctions
    "and", "or", "but", "nor", "so", "yet", "both", "either",
    "neither", "while", "as", "if", "than", "although", "though",
    # verbs / aux
    "is", "are", "was", "were", "be", "been", "being", "has", "have",
    "had", "do", "does", "did", "will", "would", "could", "should",
    "may", "might", "shall", "can", "appears", "seem", "seems",
    # generic image/description words (no semantic value for search)
    "image", "photo", "picture", "depicts", "shows", "scene",
    "viewer", "composition", "background", "foreground", "overall",
    "suggest", "suggests", "suggesting", "evoking", "inviting",
    "placed", "drawn", "drawing", "noted", "indicated",
    # pronouns / misc
    "it", "he", "she", "they", "we", "one", "each", "all", "both",
    "also", "well", "just", "very", "more", "most", "such", "same",
    "other", "another", "further", "there", "here", "where", "when",
    "how", "what", "who", "not", "no", "any", "some", "few",
}


# ── Helpers ────────────────────────────────────────────────────────────────────

def _extract_technical(text: str) -> dict:
    match = _TECH_BLOCK_RE.search(text)
    if not match:
        return {}
    return {k: v.strip() for k, v in match.groupdict().items()}


def _extract_mood(text: str) -> str:
    match = _MOOD_RE.search(text)
    if match:
        return match.group(1).strip().rstrip(".")
    evok = re.search(r"evoking feelings? of ([^\.]+)\.", text, re.IGNORECASE)
    return evok.group(1).strip() if evok else ""


def _extract_setting(text: str) -> str:
    match = _SETTING_RE.search(text)
    return match.group(1).strip() if match else ""


def _strip_technical_block(text: str) -> str:
    return _TECH_BLOCK_RE.sub("", text).strip()


def _extract_all_keywords(text: str) -> list[str]:
    """
    Extract EVERY meaningful keyword from the narrative portion of
    the description. Deduplicates while preserving first-seen order.
    """
    # Remove the technical metadata block — handled separately
    narrative = _strip_technical_block(text)

    # Tokenise: only keep alpha words, length ≥ 3
    tokens = re.findall(r"\b[a-zA-Z]{3,}\b", narrative)

    seen: set[str] = set()
    keywords: list[str] = []

    for token in tokens:
        lower = token.lower()
        if lower not in STOPWORDS and lower not in seen:
            keywords.append(lower)   # store lowercase for consistency
            seen.add(lower)

    return keywords


def _build_embed_summary(
    keywords: list[str],
    technical: dict,
) -> str:
    """
    Build embed_summary from ALL extracted keywords + key technical fields.
    Format: comma-separated keyword list, then technical tags.
    Hard cap at 400 chars (~77 CLIP tokens).
    """
    # Technical tags worth including in the embed
    tech_tags = []
    for field in ("colors", "composition", "contrast", "dof", "wb", "rating"):
        val = technical.get(field, "").strip()
        if val:
            tech_tags.append(val)

    keyword_str = ", ".join(keywords)
    tech_str    = ", ".join(tech_tags)

    summary = f"{keyword_str}. {tech_str}" if tech_str else keyword_str

    # Hard truncation safety net
    return summary[:400]

def parse_query(user_query: str) -> str:
    """
    Clean the user query the same way we clean descriptions.
    Removes stopwords, keeps meaningful keywords.
    
    Usage:
        cleaned = parse_query("show me photos of cyclists on mountain roads")
        vector  = embed_text(cleaned)
    """
    tokens = re.findall(r"\b[a-zA-Z]{3,}\b", user_query)
    keywords = [
        t.lower() for t in tokens
        if t.lower() not in STOPWORDS
    ]
    return ", ".join(keywords)  # → "photos, cyclists, mountain, roads"


# ── Public API ─────────────────────────────────────────────────────────────────

def parse_description(ai_description: str) -> ParsedDescription:
    """
    Main entry point.

    Usage:
        parsed = parse_description(image_doc["ai_description"])
        embed_text = parsed["embed_summary"]  # → Pinecone metadata
    """
    text = ai_description.strip()

    technical = _extract_technical(text)
    mood      = _extract_mood(text)
    setting   = _extract_setting(text)
    keywords  = _extract_all_keywords(text)

    embed_summary = _build_embed_summary(keywords, technical)

    return ParsedDescription(
        full_description=text,
        embed_summary=embed_summary,
        subjects=keywords[:10],   # first 10 as "subjects" for quick access
        mood=mood,
        setting=setting,
        colors=technical.get("colors", ""),
        technical=technical,
    )