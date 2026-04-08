import os
import base64
from groq import Groq

_client = None
MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

PROMPT = """Analyze this image thoroughly and write a detailed, flowing paragraph description. Cover the following naturally in your prose without using bullet points or numbered lists:

Describe the main subjects, objects, and their colors, shapes, and textures in detail. Mention the setting, environment, and background context. Describe the mood, emotions evoked, and overall atmosphere. Note any people (their appearance, expression, age, clothing, activity), animals, food, nature, or architecture visible. Mention any visible text, logos, brands, or symbols. Describe the lighting — whether it is natural or artificial, soft or harsh, warm or cool. Comment on the composition — framing, rule of thirds, symmetry, leading lines, or perspective. Note the depth of field — whether the background is blurred (bokeh) or sharp throughout. Describe each object's color individually and specifically. Describe the emotions the image evokes in the viewer.

At the very end of your paragraph, in parentheses, append the following technical photo properties in this exact format:
(Exposure: [value], Contrast: [low/medium/high], Colors: [dominant colors], White Balance: [warm/neutral/cool], Sharpness: [soft/medium/sharp], Noise: [low/medium/high], Depth of Field: [shallow/medium/deep], Estimated ISO: [value], Estimated Shutter Speed: [value], Estimated Aperture: [f/value], Composition: [rule of thirds/centered/symmetrical/leading lines/other], Overall Rating: [X/10])

Write at least 10 sentences in a single flowing paragraph. Do not use bullet points, headers, or numbered lists anywhere.

Try to include everything in short.
"""


def get_groq_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _client


def generate_image_description(image_bytes: bytes) -> str:
    try:
        base64_image = base64.b64encode(image_bytes).decode("utf-8")
        response = get_groq_client().chat.completions.create(
            model=MODEL,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": PROMPT},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            }],
            max_tokens=600,
        )
        description = response.choices[0].message.content.strip()
        print(f"[Groq] Description generated ({len(description)} chars)")
        return description
    except Exception as e:
        print(f"[Groq] Description failed: {e}")
        raise