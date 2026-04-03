"""
reindex_images.py — PixVault
------------------------------
One-time script to re-index all existing images into the new
384-dim sentence-transformer Pinecone index.

Run from backend folder:
    python scripts/reindex_images.py
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from services.mongodb_service import images_col
from services.pinecone_service import init_pinecone_index, upsert_vector
from services.embedding_service import embed_text
from services.description_parser import parse_description

def reindex():
    init_pinecone_index()

    images = list(images_col.find({"deleted": False}))
    print(f"[Reindex] Found {len(images)} images to reindex.")

    success, skipped = 0, 0

    for img in images:
        image_id  = str(img["_id"])
        user_id   = str(img["user_id"])
        image_url = img.get("image_url", "")

        ai_description = img.get("ai_description") or img.get("user_description") or ""

        if not ai_description.strip():
            print(f"[Reindex] SKIP {image_id} — no description found.")
            skipped += 1
            continue

        # Parse + embed
        parsed  = parse_description(ai_description)
        vector  = embed_text(parsed["embed_summary"])

        # Upsert into new Pinecone index
        upsert_vector(
            image_id=image_id,
            embedding=vector,
            metadata={
                "image_id":      image_id,
                "user_id":       user_id,
                "image_url":     image_url,
                "embed_summary": parsed["embed_summary"],
                "mood":          parsed["mood"],
                "colors":        parsed["colors"],
                "rating":        parsed["technical"].get("rating", ""),
            },
        )

        # Also save embed_summary back to MongoDB
        images_col.update_one(
            {"_id": img["_id"]},
            {"$set": {"embed_summary": parsed["embed_summary"]}},
        )

        print(f"[Reindex] ✅ {image_id} — {parsed['embed_summary'][:60]}...")
        success += 1

    print(f"\n[Reindex] Done. ✅ {success} indexed, ⏭ {skipped} skipped.")

if __name__ == "__main__":
    reindex()