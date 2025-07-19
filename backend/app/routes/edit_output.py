
import httpx 
from fastapi.responses import FileResponse,JSONResponse
from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from pydantic import BaseModel
from pathlib import Path
from typing import Optional
from google import genai
from google.genai import types
from dotenv import load_dotenv
import os
from io import BytesIO
from PIL import Image
from app.db import get_database

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
client = genai.Client(api_key=GOOGLE_API_KEY)
EDIT_IMAGE_PATH = Path(__file__).parent / "../../GenAI/Edit/EditImage.jpg"
EDIT_IMAGE_PATH = EDIT_IMAGE_PATH.resolve()
print("📁 Checking for image at:", EDIT_IMAGE_PATH)


router = APIRouter(prefix="/api/edit", tags=["EditOutput"])

class EditTextRequest(BaseModel):
    instruction: str
    original_text: Optional[str] = None

class EditImageRequest(BaseModel):
    instruction: str
    original_image_id: Optional[str] = None

class SaveRequest(BaseModel):
    project_id: str
    text: str
    image_id: str


@router.get("/edited/image")
async def serve_edited_image():
    print(f"📁 Checking for image at: {EDIT_IMAGE_PATH}")
    if not EDIT_IMAGE_PATH.exists():
        raise HTTPException(status_code=404, detail="Edited image not found")
    
    headers = {
        "Access-Control-Allow-Origin": "*",  # Replace * with actual Vercel URL in production
        "Cache-Control": "no-cache, no-store, must-revalidate",  # Optional, disable caching
    }
    
    return FileResponse(
        EDIT_IMAGE_PATH,
        media_type="image/jpeg",
        headers=headers,
    )

@router.delete("/delete/edited/image")
async def delete_edited_image():
    if EDIT_IMAGE_PATH.exists():
        EDIT_IMAGE_PATH.unlink()  # Deletes the file
        return JSONResponse(status_code=200, content={"message": "Edited image deleted"})
    else:
        return JSONResponse(status_code=404, content={"message": "Edited image not found"})


@router.post("/edit_text_output/{project_id}")
async def edit_text_output(
    project_id: str,
    request: EditTextRequest,
):
    if not request.instruction or not request.original_text:
        raise HTTPException(status_code=404, detail="Missing instruction or original text")

    try:
        print("✍️  Generating edited text...")

        # Define the system prompt (from your text_agent logic)
        system_prompt = (
            "You are a senior marketing copywriter for a global brand.\n"
            "Your job is to revise and improve existing marketing text based on editing instructions.\n\n"
            "Instructions will describe what to change — tone, structure, emphasis, clarity, etc.\n\n"
            "You must:\n"
            "- Follow the instruction strictly while keeping the text concise and emotionally compelling.\n"
            "- Preserve the original marketing intent unless asked to change it.\n"
            "- Maintain a persuasive, modern, and brand-aligned voice suitable for digital campaigns.\n"
            "- Always return final, ready-to-publish text — never options, outlines, or meta comments.\n"
            "- Do not explain your edits — return only the revised marketing copy.\n"
            "- Avoid using bullet points or formatting — keep it fluid, social-media-friendly prose.\n"
            "- Limit the response to **2 short, engaging paragraphs max**, unless otherwise instructed.\n\n"
            "Return only the edited marketing copy — no headers, quotes, or explanations."
        )


        # Build content for Gemini API
        full_prompt = (
            f"{request.instruction.strip()}\n\n"
            f"Original Text:\n{request.original_text.strip()}"
        )

        # Call Gemini API
        response = client.models.generate_content(
            model="models/gemini-2.5-flash",
            config = types.GenerateContentConfig(
                system_instruction = system_prompt,
                temperature=0.7,
                top_p=0.9
            ),
            contents=full_prompt,
        )

        generated_text = response.text.strip()
        print("✅ Generated Text:\n", generated_text)

        return {"text": generated_text}

    except Exception as e:
        print("❌ Gemini API Error:", str(e))
        raise HTTPException(status_code=500, detail=f"Gemini error: {str(e)}")




@router.post("/edit_image_output/{project_id}")
async def edit_image_output(
    project_id: str,
    request: EditImageRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    try:
        instruction = request.instruction.strip()
        if not instruction:
            raise HTTPException(status_code=400, detail="Missing instruction")

        # Use EditImage.jpg if it exists
        if EDIT_IMAGE_PATH.exists():
            print("✅ Using existing EditImage.jpg")
            with open(EDIT_IMAGE_PATH, "rb") as f:
                image_bytes = f.read()
        else:
            print("🌐 Fetching image via internal HTTP from /api/image/{id}")
            image_url = f"http://127.0.0.1:8000/api/generated_output/image/{request.original_image_id}"

            async with httpx.AsyncClient() as http_client:
                response = await http_client.get(image_url)

            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to fetch image via HTTP")

            image_bytes = response.content

            with open(EDIT_IMAGE_PATH, "wb") as f:
                f.write(image_bytes)

            print("📝 Saved image to EditImage.jpg via HTTP")

        # Generate image from instruction + image
        image = Image.open(BytesIO(image_bytes))
        text_input = (
            "You are an expert marketing image generator.\n"
            "Always preserve the product's exact appearance as seen in the image.\n"
            "Only generate the background, context, or marketing setting based on the prompt below:\n\n"
            f"{instruction}"
        )

        response = client.models.generate_content(  # make sure this is not conflicting with httpx client
            model="gemini-2.0-flash-preview-image-generation",
            contents=[text_input, image],
            config=types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"]
            ),
        )

        generated_image_bytes = None
        for part in response.candidates[0].content.parts:
            if part.inline_data:
                generated_image_bytes = part.inline_data.data
                break

        if not generated_image_bytes:
            raise HTTPException(status_code=500, detail="Image generation failed")

        # Overwrite EditImage.jpg
        with open(EDIT_IMAGE_PATH, "wb") as f:
            f.write(generated_image_bytes)
        print("✅ Edited image saved")

        return {"status": "success"}

    except Exception as e:
        print("❌ Image editing error:", str(e))
        raise HTTPException(status_code=500, detail=f"Image editing failed: {e}")
    


@router.post("/save_output")
async def save_output(request: SaveRequest, db: AsyncIOMotorDatabase = Depends(get_database)):
    try:
        # Ensure project_id is a valid ObjectId
        try:
            project_oid = ObjectId(request.project_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid project_id format.")

        result = await db["GeneratedOutput"].update_one(
            {"project_id": project_oid},
            {"$set": {
                "text": request.text,
                "image": request.image_id
            }},
            upsert=True
        )
        # Check if a new document was inserted or an existing one was modified
        if result.upserted_id:
            message = "Output saved successfully (new document created)."
        elif result.modified_count > 0:
            message = "Output saved successfully (existing document updated)."
        else:
            message = "Output save operation completed, but no changes were made (data might be identical)."
            
        return {"message": message, "modified_count": result.modified_count, "upserted_id": str(result.upserted_id) if result.upserted_id else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving output: {str(e)}")

