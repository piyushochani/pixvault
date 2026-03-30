import cloudinary
import cloudinary.uploader
from config import CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET,
)

def upload_image(image_bytes: bytes, public_id: str) -> dict:
    """
    Upload image bytes to Cloudinary.
    Returns dict with 'url' and 'public_id'.
    """
    result = cloudinary.uploader.upload(
        image_bytes,
        public_id=public_id,
        overwrite=True,
        resource_type="image",
    )
    return {
        "url": result["secure_url"],
        "public_id": result["public_id"],
    }

def delete_image(public_id: str) -> None:
    """
    Permanently delete an image from Cloudinary by its public_id.
    """
    cloudinary.uploader.destroy(public_id, resource_type="image")