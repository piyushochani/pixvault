"""
regenerate_descriptions.py — PixVault
---------------------------------------
Fetches existing images from Cloudinary URL, generates AI description,
parses embed_summary, re-embeds and upserts to Pinecone.

Run: python scripts/regenerate_descriptions.py
"""

import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

import requests
from services.mongodb_service import images_col
from services.pinecone_service import init_pinecone_index, upsert_vector
from services.ai_pipeline import process_uploaded_image

def regenerate():
    init_pinecone_index()

    # Only process images that have no ai_description yet
    images = list(images_col.find({
        "deleted": False,
        "$or": [
            {"ai_description": None},
            {"ai_description": {"$exists": False}},
            {"ai_description": ""},
        ]
    }))

    print(f"[Regen] Found {len(images)} images with no AI description.")

    success, failed = 0, 0

    for img in images:
        image_id  = str(img["_id"])
        image_url = img.get("image_url", "")
        user_desc = img.get("user_description", "")

        if not image_url:
            print(f"[Regen] SKIP {image_id} — no image_url.")
            failed += 1
            continue

        try:
            # Fetch image bytes from Cloudinary URL
            response = requests.get(image_url, timeout=15)
            response.raise_for_status()
            image_bytes = response.content

            # Run full AI pipeline
            result = process_uploaded_image(image_bytes, user_description=user_desc)

            # Update MongoDB
            images_col.update_one(
                {"_id": img["_id"]},
                {"$set": {
                    "ai_description": result["ai_description"],
                    "embed_summary":  result["embed_summary"],
                }}
            )

            # Upsert new rich vector to Pinecone
            if result.get("embedding"):
                upsert_vector(
                    image_id=image_id,
                    embedding=result["embedding"],
                    metadata={
                        "image_id":      image_id,
                        "user_id":       str(img["user_id"]),
                        "image_url":     image_url,
                        "embed_summary": result.get("embed_summary", ""),
                        **result.get("parsed_meta", {}),
                    },
                )

            print(f"[Regen] ✅ {image_id} — {result['ai_description'][:80]}...")
            success += 1

        except Exception as e:
            print(f"[Regen] ❌ {image_id} failed: {e}")
            failed += 1

    print(f"\n[Regen] Done. ✅ {success} updated, ❌ {failed} failed.")

if __name__ == "__main__":
    regenerate()