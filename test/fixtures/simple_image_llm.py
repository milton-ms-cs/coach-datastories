import os
import time
import base64
import requests

# Codio-injected environment variables
BASE_URL = os.getenv("GEMINI_CUSTOM_URL")
API_KEY = os.getenv("GEMINI_CUSTOM_KEY")

MODEL_NAME = "gemini-2.5-flash-image"


def generate_image(system_prompt, user_message, filename=None):
    """
    Generate an image using Gemini.

    - system_prompt: string describing how the AI should behave
    - user_message: the user's request (what to draw)
    - filename (optional): save path for the PNG file

    Returns the filename used.
    """

    if filename is None:
        # named from the clock, so a new picture never replaces an old one
        filename = "image_" + time.strftime("%H%M%S") + ".png"

    # Build full Gemini REST endpoint
    url = f"{BASE_URL}/v1beta/models/{MODEL_NAME}:generateContent"

    # Merge prompts
    prompt = f"{system_prompt}\nUser request: {user_message}"

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ]
    }

    headers = {"Content-Type": "application/json", "x-goog-api-key": API_KEY}

    response = requests.post(url, headers=headers, json=payload)

    if response.status_code != 200:
        raise RuntimeError(f"Gemini API error: {response.text}")

    data = response.json()

    # find the first inline image
    parts = data["candidates"][0]["content"]["parts"]

    for part in parts:
        if "inlineData" in part:
            b64_data = part["inlineData"]["data"]
            with open(filename, "wb") as f:
                f.write(base64.b64decode(b64_data))
            return filename

    # if no image found
    raise RuntimeError("No image returned by Gemini.")
