from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import torch
import io

print("[CLIP] Loading model — this may take a minute on first run...")

_processor = None
_model = None


def _load():
    global _processor, _model
    if _processor is None:
        _processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        _model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        _model.eval()
        print("[CLIP] Model loaded.")


def get_image_embedding(image_bytes: bytes) -> list[float]:
    """
    Generate a 512-dim CLIP embedding for an image.
    Returns a plain Python list of floats.
    """
    _load()
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        inputs = _processor(images=image, return_tensors="pt")
        with torch.no_grad():
            features = _model.get_image_features(**inputs)
            features = features / features.norm(p=2, dim=-1, keepdim=True)
        return features[0].tolist()
    except Exception as e:
        print(f"[CLIP] Image embedding error: {e}")
        return []


def get_text_embedding(text: str) -> list[float]:
    """
    Generate a 512-dim CLIP embedding for a text query.
    Returns a plain Python list of floats.
    """
    _load()
    try:
        inputs = _processor(text=[text], return_tensors="pt", padding=True, truncation=True)
        with torch.no_grad():
            features = _model.get_image_features(**inputs)
            features = features / features.norm(p=2, dim=-1, keepdim=True)
        return features[0].tolist()
    except Exception as e:
        print(f"[CLIP] Text embedding error: {e}")
        return []