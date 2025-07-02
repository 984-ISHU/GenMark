from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Body, Form, Request
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorGridFSBucket
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
from typing import List
from app.db import get_database
# from GenMark.backend.GenAI.middle import run_langgraph_for_project 



router = APIRouter(prefix="/api/project", tags = ["Projects"])

async def upsert_generated_output(db, project_id, update_fields):
    collection = db["GeneratedOutput"]
    existing = await collection.find_one({"project_id": ObjectId(project_id)})
    if existing:
        await collection.update_one(
            {"project_id": ObjectId(project_id)},
            {"$set": update_fields}
        )
    else:
        await collection.insert_one({
            "project_id": ObjectId(project_id),
            **update_fields
        })




# ----------- Routes ----------- #
# Creation of Project and Product
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
        "user_id": ObjectId(user_id),
        "name": name,
        "target_audience": target_audience,
        "output_format": output_format,
        "product_id": str(product_result.inserted_id),
        "generated_outputs_id": None,
        "status": "in_progress",
        "created_at": datetime.utcnow()
    }
    
    project_result = await db["Projects"].insert_one(project_doc)
    project_id = product_result.inserted_id

    # Update product with project_id
    await db["Products"].update_one(
        {"_id": project_id},
        {"$set": {"project_id": str(project_result.inserted_id)}}
    )

    generated_output = await db["GeneratedOutput"].find_one({"project_id": ObjectId(project_id)})
    
    if not generated_output:
        await db["GeneratedOutput"].insert_one({
            "project_id": ObjectId(project_id)
        })

    # await run_langgraph_for_project({
    #     "user_id": user_id,
    #     "project_id": str(project_result.inserted_id),
    #     "project_name": name,
    #     "target_audience": target_audience,
    #     "output_format": output_format,
    #     "product_name": product_name,
    #     "description": description,
    #     "price": price,
    #     "discount": discount,
    #     "image_ids": image_ids
    # })

    return {"message": "Project and Product created", "project_id": str(project_result.inserted_id)}

def clean_mongo_doc(doc):
    cleaned = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            cleaned[key] = str(value)
        elif isinstance(value, datetime):
            cleaned[key] = value.isoformat()
        else:
            cleaned[key] = value
    return cleaned

@router.get("/all")
async def get_all_projects(db: AsyncIOMotorDatabase = Depends(get_database)):
    projects = []
    async for p in db["Projects"].find():
        projects.append(clean_mongo_doc(p))
    return projects

@router.get("/all/{user_id}")
async def get_all_user_projects(user_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    projects = []
    async for p in db["Projects"].find({"user_id":ObjectId(user_id)}):
        projects.append(clean_mongo_doc(p))
    return projects

@router.put("/update/generated-output/{project_id}")
async def upload_generated_text(
    project_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    generated_output = await db["GeneratedOutput"].find_one({"project_id": ObjectId(project_id)})
    
    if not generated_output:
        raise HTTPException(status_code=404, detail="GeneratedOutput not found")

    # Update the project with reference to generated_output._id
    await db["Projects"].update_one(
        {"_id": ObjectId(project_id)},
        {"$set": {"generated_output_id": generated_output["_id"]}}
    )
    return {"message": "Generated Data linked"}




# Upload of Generated Image
@router.put("/upload-generated-image/{project_id}")
async def upload_generated_image(
    project_id: str,
    image_output: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    bucket = AsyncIOMotorGridFSBucket(db, bucket_name="GeneratedOutputsBucket")
    content = await image_output.read()
    image_id = await bucket.upload_from_stream(image_output.filename, content)

    await upsert_generated_output(db, project_id, {"image": str(image_id)})
    return {"message": "Image uploaded", "image_id": str(image_id)}





# Upload of Generated Text
@router.put("/upload-generated-text/{project_id}")
async def upload_generated_text(
    project_id: str,
    text: str = Form(...),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    await upsert_generated_output(db, project_id, {"text": text})
    return {"message": "Text uploaded"}




# Upload of Generated Video
@router.put("/upload-generated-video/{project_id}")
async def upload_generated_video(
    project_id: str,
    video_output: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    bucket = AsyncIOMotorGridFSBucket(db, bucket_name="GeneratedOutputsBucket")
    content = await video_output.read()
    video_id = await bucket.upload_from_stream(video_output.filename, content)

    await upsert_generated_output(db, project_id, {"video": str(video_id)})
    return {"message": "Video uploaded", "video_id": str(video_id)}





# Stream Generated Image
@router.get("/stream/image/{file_id}")
async def stream_image(file_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    try:
        bucket = AsyncIOMotorGridFSBucket(db, bucket_name="GeneratedOutputsBucket")
        stream = await bucket.open_download_stream(ObjectId(file_id))
        return StreamingResponse(stream, media_type="image/jpeg")
    except:
        raise HTTPException(status_code=404, detail="Image not found")




# Stream Product Image
@router.get("/uploaded/image/{file_id}")
async def stream_image(file_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    try:
        bucket = AsyncIOMotorGridFSBucket(db, bucket_name="ProductImageBucket")
        stream = await bucket.open_download_stream(ObjectId(file_id))
        return StreamingResponse(stream, media_type="image/jpeg")
    except:
        raise HTTPException(status_code=404, detail="Image not found")





# Delete Product-Project
@router.delete("/delete/{project_id}")
async def delete_project(project_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    project = await db["Projects"].find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Delete generated outputs from GridFS
    bucket = AsyncIOMotorGridFSBucket(db, bucket_name="GeneratedOutputsBucket")
    
    if project.get("generated_outputs_id"):
        try:
            generated_output = await db["GeneratedOutput"].find_one({"_id": ObjectId(project.get("generated_outputs_id"))})
            await bucket.delete(ObjectId(generated_output["image"]))
            await bucket.delete(ObjectId(generated_output["video"]))
            await db["GeneratedOutput"].delete_one({"_id": project.get("generated_outputs_id")})
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
