from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Body, Form, Request
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorGridFSBucket
from bson import ObjectId
import asyncio
from typing import List
from app.db import get_database


router = APIRouter(prefix="/api/generated_output", tags = ["GeneratedOutput"])



# Gets a specific generated output 
@router.get("/{generated_output_id}")
async def get_generated_output(generated_output_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    try:
        doc = await db["GeneratedOutput"].find_one({"_id": ObjectId(generated_output_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Generated output not found")
        
        # Convert ObjectId fields to string
        doc["_id"] = str(doc["_id"])
        doc["project_id"] = str(doc["project_id"])
        
        return doc
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# Stream Generated Image
@router.get("/image/{image_id}")
async def get_image(image_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    try:
        bucket = AsyncIOMotorGridFSBucket(db, bucket_name="GeneratedOutputsBucket")
        file = await bucket.open_download_stream(ObjectId(image_id))
        return StreamingResponse(file, media_type="image/jpeg")
    except Exception as e:
        raise HTTPException(status_code=404, detail="Image not found")





