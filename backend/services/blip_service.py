from transformers import BlipProcessor, BlipForConditionalGeneration
from PIL import Image
import torch
import io

print("[BLIP] Loading model — this may take a minute on first run...")

_processor = None
_model = None


def _load():
    global _processor, _model
    if _processor is None:
        _processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
        _model = BlipForConditionalGeneration.from_pretrained(
            "Salesforce/blip-image-captioning-base"
        )
        _model.eval()
        print("[BLIP] Model loaded.")


def generate_caption(image_bytes: bytes) -> str:
    """
    Generate a descriptive caption for an image using BLIP.
    Returns a clean string caption.
    """
    _load()
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        inputs = _processor(images=image, return_tensors="pt")
        with torch.no_grad():
            output = _model.generate(
                **inputs,
                max_new_tokens=60,
                num_beams=5,
                no_repeat_ngram_size=2,
                early_stopping=True,
            )
        caption = _processor.decode(output[0], skip_special_tokens=True).strip()
        return caption if caption else ""
    except Exception as e:
        print(f"[BLIP] Caption error: {e}")
        return ""