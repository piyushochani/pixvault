"""
embedding_service.py — PixVault
--------------------------------
Gemini-based text embedder.
Output dimension: 768 (text-embedding-004)
"""

import os
from google import genai

EMBED_DIM = 768

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])


def embed_text(text: str) -> list[float]:
    """
    Embed any text string into a 768-dim vector.
    Used for BOTH description embed_summary (upload) AND user query (search).
    """
    result = client.models.embed_content(
        model="models/text-embedding-004",
        contents=text,
    )
    return result.embeddings[0].values