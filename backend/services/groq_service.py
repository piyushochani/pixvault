import os
import base64
from groq import Groq

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

PROMPT = """Analyze this image in detail. Describe:
1. Main subjects and objects visible
2. Colors, textures, and visual style
3. Setting, background, and environment
4. Any text, logos, or brands visible
5. Mood, lighting, and overall atmosphere
6. Any notable activity or action happening

Be specific and descriptive. Write at least 8-9 sentences."""


def generate_image_description(image_bytes: bytes) -> str:
    try:
        base64_image = base64.b64encode(image_bytes).decode("utf-8")
        response = client.chat.completions.create(
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