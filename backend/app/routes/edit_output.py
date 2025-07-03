from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorGridFSBucket
from bson import ObjectId
from pydantic import BaseModel
from typing import Optional
import os
import io
from PIL import Image # PIL is used for image processing, not strictly for API calls
import base64 # Used for base64 encoding/decoding image data

# Import the new GeminiAPIClient
from .gemini_api_client import GeminiAPIClient # Assuming gemini_api_client.py is in the same directory or accessible via app.

# Assuming app.db exists and provides get_database
from app.db import get_database

router = APIRouter(prefix="/api", tags=["EditOutput"])

# Initialize the GeminiAPIClient globally or within a dependency if needed.
# For simplicity, we'll initialize it here. It will attempt to read GOOGLE_API_KEY
# from environment variables.
try:
    gemini_client = GeminiAPIClient()
except ValueError as e:
    # Handle the case where the API key is not configured at startup
    print(f"Error initializing GeminiAPIClient: {e}. Ensure GOOGLE_API_KEY is set.")
    # You might want to raise an exception, exit, or have a fallback
    gemini_client = None # Or a mock client for testing without API key

class EditRequest(BaseModel):
    project_id: str
    content_type: str
    instruction: str
    original_text: Optional[str] = None
    original_image_id: Optional[str] = None

class SaveRequest(BaseModel):
    project_id: str
    text: str
    image_id: str

@router.post("/edit_output")
async def edit_output(request: EditRequest, db: AsyncIOMotorDatabase = Depends(get_database)):
    if not gemini_client:
        raise HTTPException(status_code=500, detail="Gemini API client not initialized. API key might be missing.")

    try:
        if request.content_type == "text":
            if not request.original_text:
                raise HTTPException(status_code=400, detail="Original text required for text editing")
            
            new_text = await gemini_client.edit_text(request.instruction, request.original_text)
            return {"text": new_text}
        
        elif request.content_type == "image":
            if not request.original_image_id:
                raise HTTPException(status_code=400, detail="Original image ID required for image editing")
            
            # Get original image from GridFS
            bucket = AsyncIOMotorGridFSBucket(db, bucket_name="GeneratedOutputsBucket")
            try:
                file = await bucket.open_download_stream(ObjectId(request.original_image_id))
                image_data = await file.read()
            except Exception as e:
                raise HTTPException(status_code=404, detail=f"Image with ID {request.original_image_id} not found: {e}")
            
            # Call Gemini API for image description/editing instructions
            # As noted in gemini_api_client.py, gemini-2.5-flash returns text for image input.
            # If you need actual image generation, you'd integrate an image generation model here.
            image_description_or_instruction = await gemini_client.describe_image_for_editing(request.instruction, image_data)
            
            # For demonstration, we'll return the text description.
            # In a real application, you might use this text to call an image generation API.
            return {"image_description_or_instruction": image_description_or_instruction}
            
        else:
            raise HTTPException(status_code=400, detail="Invalid content type. Must be 'text' or 'image'.")
            
    except HTTPException as e:
        # Re-raise HTTPExceptions directly
        raise e
    except Exception as e:
        # Catch any other unexpected errors
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

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

