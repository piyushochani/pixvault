"""
embedding_service.py — PixVault
--------------------------------
Sentence-transformer based text embedder.
Replaces CLIP for all semantic search operations.
"""

from sentence_transformers import SentenceTransformer

_model: SentenceTransformer | None = None
EMBED_DIM = 384   # all-MiniLM-L6-v2 output dimension


def _load() -> SentenceTransformer:
    global _model
    if _model is None:
        print("[EmbeddingService] Loading all-MiniLM-L6-v2...")
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        print("[EmbeddingService] Model ready.")
    return _model


def embed_text(text: str) -> list[float]:
    """
    Embed any text string into a 384-dim vector.
    Used for BOTH description embed_summary (upload) AND user query (search).
    """
    model = _load()
    vector = model.encode(text, normalize_embeddings=True)
    return vector.tolist()