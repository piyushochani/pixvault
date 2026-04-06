"""
embedding_service.py — PixVault
--------------------------------
Gemini-based text embedder.
Replaces sentence-transformers (all-MiniLM-L6-v2) for Vercel compatibility.
Output dimension: 768 (text-embedding-004)
"""

import os
import google.generativeai as genai

EMBED_DIM = 768  # text-embedding-004 output dimension

genai.configure(api_key=os.environ["GEMINI_API_KEY"])


def embed_text(text: str) -> list[float]:
    """
    Embed any text string into a 768-dim vector.
    Used for BOTH description embed_summary (upload) AND user query (search).
    """
    result = genai.embed_content(
        model="models/text-embedding-004",
        content=text,
        task_type="RETRIEVAL_DOCUMENT"
    )
    return result["embedding"]