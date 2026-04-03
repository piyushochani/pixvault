"""
pinecone_service.py — PixVault
--------------------------------
Pinecone index using 384-dim sentence-transformer vectors.
"""

from pinecone import Pinecone, ServerlessSpec
import os

_index = None
INDEX_NAME = "pixvault-descriptions"
EMBED_DIM  = 384


def init_pinecone_index():
    global _index
    pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])

    existing = [i.name for i in pc.list_indexes()]
    if INDEX_NAME not in existing:
        pc.create_index(
            name=INDEX_NAME,
            dimension=EMBED_DIM,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )
        print(f"[Pinecone] Created index '{INDEX_NAME}' (dim={EMBED_DIM})")

    _index = pc.Index(INDEX_NAME)
    print(f"[Pinecone] Connected to '{INDEX_NAME}'")


def get_index():
    if _index is None:
        raise RuntimeError("Pinecone not initialised. Call init_pinecone_index() first.")
    return _index


# ── used in image_routes.py ────────────────────────────────────────────────────
def upsert_vector(image_id: str, embedding: list[float], metadata: dict):
    get_index().upsert(vectors=[{
        "id":       image_id,
        "values":   embedding,
        "metadata": metadata,
    }])


def query_vectors(embedding: list[float], user_id: str, top_k: int = 20) -> list[dict]:
    results = get_index().query(
        vector=embedding,
        top_k=top_k,
        include_metadata=True,
        filter={"user_id": {"$eq": user_id}},
    )
    matches = results.get("matches", [])
    return [
        {
            "image_id": m["id"],
            "score":    m["score"],
            "metadata": m.get("metadata", {}),
        }
        for m in matches
        if m["score"] >= 0.3   # ✅ filter weak matches at source
    ]


def delete_image_vector(image_id: str):
    get_index().delete(ids=[image_id])