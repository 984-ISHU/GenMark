from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Body, Form
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorGridFSBucket
from bson import ObjectId
from datetime import datetime
from typing import List
from app.db import get_database

router = APIRouter(prefix="/api/project", tags = ["Projects"])

# ----------- Routes ----------- #

@router.post("/create")
async def create_project_and_product(
        user_id: str = Form(...),
    name: str = Form(...),
    target_audience: str = Form(...),
    output_format: str = Form(...),
    product_name: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    discount: float = Form(...),
    product_images: List[UploadFile] = File(...),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    exists = await db["Projects"].find_one({"name": name})
    exists2 = await db["Products"].find_one({"product_name": product_name})
    if exists or exists2:
        raise HTTPException(status_code=404, detail="Product or Project already exists")

    # Upload images
    product_bucket = AsyncIOMotorGridFSBucket(db, bucket_name="ProductImageBucket")
    image_ids = []
    for img in product_images:
        content = await img.read()
        file_id = await product_bucket.upload_from_stream(img.filename, content)
        image_ids.append(str(file_id))

    # Insert product
    product_doc = {
        "name": product_name,
        "description": description,
        "price": price,
        "discount": discount,
        "images": image_ids,
        "project_id": None
    }
    product_result = await db["Products"].insert_one(product_doc)

    # Insert project
    project_doc = {
        "user_id": user_id,
        "name": name,
        "target_audience": target_audience,
        "output_format": output_format,
        "product_id": str(product_result.inserted_id),
        "generated_outputs": None,
        "status": "in_progress",
        "created_at": datetime.utcnow()
    }
    
    project_result = await db["Projects"].insert_one(project_doc)

    # Update product with project_id
    await db["Products"].update_one(
        {"_id": product_result.inserted_id},
        {"$set": {"project_id": str(project_result.inserted_id)}}
    )

    return {"message": "Project and Product created", "project_id": str(project_result.inserted_id)}


@router.put("/upload-generated-outputs/{project_id}")
async def upload_generated_outputs(
    project_id: str,
    text: str = Form(...),
    image_outputs: List[UploadFile] = File(...),
    video_output: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    project = await db["Projects"].find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    bucket = AsyncIOMotorGridFSBucket(db, bucket_name="GeneratedOutputsBucket")

    image_ids = []
    for img in image_outputs:
        content = await img.read()
        img_id = await bucket.upload_from_stream(img.filename, content)
        image_ids.append(str(img_id))

    video_content = await video_output.read()
    video_id = await bucket.upload_from_stream(video_output.filename, video_content)

    outputs = {
        "text": text,
        "video": str(video_id),
        "image_urls": image_ids
    }

    await db["Projects"].update_one(
        {"_id": ObjectId(project_id)},
        {"$set": {"generated_outputs": outputs, "status": "completed"}}
    )

    return {"message": "Generated outputs uploaded successfully"}


@router.get("/stream/image/{file_id}")
async def stream_image(file_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    try:
        bucket = AsyncIOMotorGridFSBucket(db, bucket_name="GeneratedOutputsBucket")
        stream = await bucket.open_download_stream(ObjectId(file_id))
        return StreamingResponse(stream, media_type="image/jpeg")
    except:
        raise HTTPException(status_code=404, detail="Image not found")

@router.get("/uploaded/image/{file_id}")
async def stream_image(file_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    try:
        bucket = AsyncIOMotorGridFSBucket(db, bucket_name="ProductImageBucket")
        stream = await bucket.open_download_stream(ObjectId(file_id))
        return StreamingResponse(stream, media_type="image/jpeg")
    except:
        raise HTTPException(status_code=404, detail="Image not found")


@router.delete("/delete/{project_id}")
async def delete_project(project_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    project = await db["Projects"].find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Delete generated outputs from GridFS
    bucket = AsyncIOMotorGridFSBucket(db, bucket_name="GeneratedOutputsBucket")
    if project.get("generated_outputs"):
        try:
            await bucket.delete(ObjectId(project["generated_outputs"]["video"]))
            for img_id in project["generated_outputs"]["image_urls"]:
                await bucket.delete(ObjectId(img_id))
        except Exception:
            pass

    # Delete associated product and its images
    product = await db["Products"].find_one({"_id": ObjectId(project["product_id"])})
    if product:
        product_bucket = AsyncIOMotorGridFSBucket(db, bucket_name="ProductImageBucket")
        for img_id in product.get("images", []):
            try:
                await product_bucket.delete(ObjectId(img_id))
            except Exception:
                pass
        await db["Products"].delete_one({"_id": ObjectId(project["product_id"])})

    await db["Projects"].delete_one({"_id": ObjectId(project_id)})

    return {"message": "Project and associated data deleted successfully"}
