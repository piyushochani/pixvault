from pinecone import Pinecone, ServerlessSpec
from config import PINECONE_API_KEY, PINECONE_INDEX_NAME, PINECONE_DIMENSION

# Initialise Pinecone client
pc = Pinecone(api_key=PINECONE_API_KEY)


def init_pinecone_index():
    """Create index if it does not exist yet."""
    existing = [idx.name for idx in pc.list_indexes()]
    if PINECONE_INDEX_NAME not in existing:
        pc.create_index(
            name=PINECONE_INDEX_NAME,
            dimension=PINECONE_DIMENSION,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )
        print(f"[Pinecone] Created index '{PINECONE_INDEX_NAME}'")
    else:
        print(f"[Pinecone] Index '{PINECONE_INDEX_NAME}' already exists")


def get_index():
    return pc.Index(PINECONE_INDEX_NAME)


def upsert_vector(image_id: str, embedding: list[float], metadata: dict):
    """Store or update a vector for an image."""
    index = get_index()
    index.upsert(vectors=[{"id": image_id, "values": embedding, "metadata": metadata}])


def query_vectors(embedding: list[float], user_id: str, top_k: int = 20) -> list[dict]:
    """
    Find the most similar images for a given embedding.
    Filters strictly to the requesting user's images only.
    Returns list of {image_id, score}.
    """
    index = get_index()
    results = index.query(
        vector=embedding,
        top_k=top_k,
        filter={"user_id": {"$eq": user_id}},
        include_metadata=True,
    )
    matches = results.get("matches", [])
    return [{"image_id": m["id"], "score": m["score"]} for m in matches if m["score"] > 0.25]


def delete_vector(image_id: str):
    """Remove a vector from Pinecone when an image is permanently deleted."""
    index = get_index()
    index.delete(ids=[image_id])