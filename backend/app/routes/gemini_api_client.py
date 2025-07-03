import os
import httpx
import base64
from fastapi import HTTPException
from typing import Union

# It's good practice to get API keys from environment variables
# outside of the functions if they are used globally, or pass them in.
# For a library, it's often best to pass them or have a configuration method.
# Here, we'll keep them fetched per call for simplicity as per your original code.

class GeminiAPIClient:
    """
    A client for interacting with the Google Gemini API for text and image editing.
    """

    def __init__(self, api_key: str = None):
        """
        Initializes the GeminiAPIClient.

        Args:
            api_key: Your Google Gemini API key. If not provided, it will
                     attempt to fetch it from the GOOGLE_API_KEY environment variable.
        """
        self._api_key = api_key or os.getenv("GOOGLE_API_KEY")
        if not self._api_key:
            raise ValueError("Google API key not configured. Set GOOGLE_API_KEY "
                             "environment variable or pass it to the constructor.")

    async def edit_text(self, instruction: str, original_text: str) -> str:
        """
        Calls the Gemini API (gemini-2.5-flash) to edit text based on instructions.

        Args:
            instruction: The editing instructions for the text.
            original_text: The original text to be edited.

        Returns:
            The edited text from the Gemini API.

        Raises:
            HTTPException: If there's an error calling the Gemini API.
        """
        url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{
                "parts": [{
                    "text": f"Edit the following text based on these instructions: {instruction}\n\nOriginal text: {original_text}"
                }]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "topP": 0.9,
                "maxOutputTokens": 1000
            }
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(f"{url}?key={self._api_key}", json=payload)
                response.raise_for_status()
                data = response.json()
                
                # Check if candidates and content exist before accessing
                if data and "candidates" in data and len(data["candidates"]) > 0 and \
                   "content" in data["candidates"][0] and "parts" in data["candidates"][0]["content"] and \
                   len(data["candidates"][0]["content"]["parts"]) > 0 and \
                   "text" in data["candidates"][0]["content"]["parts"][0]:
                    return data["candidates"][0]["content"]["parts"][0]["text"]
                else:
                    raise HTTPException(status_code=500, detail=f"Unexpected Gemini API response structure: {data}")

            except httpx.HTTPStatusError as e:
                # Re-raise as HTTPException for FastAPI to handle
                raise HTTPException(status_code=e.response.status_code, detail=f"Gemini API error: {e.response.text}")
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error calling Gemini API for text: {str(e)}")

    async def describe_image_for_editing(self, instruction: str, image_data: bytes) -> str:
        """
        Calls the Gemini API (gemini-2.5-flash) to get a text description or
        editing instructions for an image.

        NOTE: The gemini-2.5-flash model, when used with `generateContent`,
        takes image input but primarily generates *text* output (e.g., a description
        of the image, or instructions for how to edit it, or a prompt for an
        image generation model). It does NOT directly return an edited image
        in base64 format as part of its `generateContent` response.

        If you need to *generate* an image based on instructions, you would typically
        use a dedicated image generation model (like Imagen 3.0) and its
        corresponding API endpoint, often in a separate step after getting
        textual instructions from Gemini.

        Args:
            instruction: The instruction for how to "edit" or describe the image.
            image_data: The raw bytes of the image (e.g., JPEG, PNG).

        Returns:
            A text string describing the image or the proposed edit.

        Raises:
            HTTPException: If there's an error calling the Gemini API.
        """
        url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
        headers = {"Content-Type": "application/json"}
        
        # Convert image to base64
        image_base64 = base64.b64encode(image_data).decode("utf-8")
        
        payload = {
            "contents": [{
                "parts": [
                    {"text": f"Based on this image, and considering these instructions: {instruction}, describe the ideal edited image or provide detailed steps to achieve the edit."},
                    {
                        "inlineData": {
                            "mimeType": "image/jpeg", # Assuming JPEG; adjust if you handle other types
                            "data": image_base64
                        }
                    }
                ]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "topP": 0.9
            }
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(f"{url}?key={self._api_key}", json=payload)
                response.raise_for_status()
                data = response.json()
                
                # Expecting text output from Gemini-2.5-flash for image input
                if data and "candidates" in data and len(data["candidates"]) > 0 and \
                   "content" in data["candidates"][0] and "parts" in data["candidates"][0]["content"] and \
                   len(data["candidates"][0]["content"]["parts"]) > 0 and \
                   "text" in data["candidates"][0]["content"]["parts"][0]:
                    return data["candidates"][0]["content"]["parts"][0]["text"]
                else:
                    raise HTTPException(status_code=500, detail=f"Unexpected Gemini API response structure for image: {data}")

            except httpx.HTTPStatusError as e:
                raise HTTPException(status_code=e.response.status_code, detail=f"Gemini API error for image: {e.response.text}")
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error calling Gemini API for image: {str(e)}")

