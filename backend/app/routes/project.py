from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Body, Form, Request
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorGridFSBucket
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
import asyncio
from typing import List
from app.db import get_database
from GenAI.middle import run_langgraph_for_project


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

def convert_object_ids(doc):
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            doc[key] = str(value)
    return doc

async def fetch_product_image_ids(product_id: str, db: AsyncIOMotorDatabase) -> list:
    product = await db["Products"].find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return product.get("images", [])

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


# ----------- Routes ----------- #
# Creation of Project and Product
@router.post("/create")
async def create_project_and_product(
    user_id: str = Form(...),
    name: str = Form(...),
    target_audience: str = Form(...),
    selected_dataset: str = Form(...),
    output_format: str = Form(...),
    product_name: str = Form(...),
    description: str = Form(...),
    product_url: str = Form(...),
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
        "product_url": product_url,
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
        "selected_dataset": selected_dataset,
        "output_format": output_format,
        "product_id": ObjectId(product_result.inserted_id),
        "generated_outputs_id": None,
        "status": "in_progress",
        "created_at": datetime.utcnow()
    }
    
    project_result = await db["Projects"].insert_one(project_doc)
    project_id = project_result.inserted_id 
    print("\n\nProject ID After inserting : ", project_id)

    # Update product with project_id
    await db["Products"].update_one(
        {"_id": product_result.inserted_id},
        {"$set": {"project_id": ObjectId(project_id)}}
    )

    generated_output = await db["GeneratedOutput"].find_one({"project_id": ObjectId(project_id)})
    
    if not generated_output:
        await db["GeneratedOutput"].insert_one({
            "project_id": ObjectId(project_id)
        })
    
    project_input_data = {
        "user_id": user_id,
        "project_id": str(project_id),
        "product_id":str(product_result.inserted_id),
        "name": name,
        "product_name": product_name,
        "description": description,
        "product_url": product_url,
        "price": price,
        "discount": discount,
        "image_ids": image_ids,
        "target_audience": target_audience,
        "output_format": output_format,
        "status": "initiated",
        "generationDone": "NotStarted",
        "generated_outputs_id": None,
        "automate_campaign": None,
        "text_prompt": "",
        "image_prompt": "",
        "video_prompt": "",
        "text_output": None,
        "image_output": None,
        "video_output": None
    }

    # Call langgraph
    asyncio.create_task(run_langgraph_for_project(project_input_data))

    return {"message": "Project and Product created", "project_id": str(project_result.inserted_id)}






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






@router.get("/{user_id}/{project_id}")
async def get_specific_project(user_id: str, project_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    print("User ID:", user_id)
    print("Project ID:", project_id)
    project = await db["Projects"].find_one({
        "user_id": ObjectId(user_id),
        "_id": ObjectId(project_id)
    })

    if not project:
        raise HTTPException(status_code=404, detail="Project not Found")

    return convert_object_ids(project)



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
        {"$set": {"generated_outputs_id": generated_output["_id"]}}
    )
    return {"message": "Generated Data linked"}




# Upload of Generated Image
@router.put("/upload-generated-image/{project_id}")
async def upload_generated_image(
    project_id: str,
    image_output: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    print("Reached Upload")
    bucket = AsyncIOMotorGridFSBucket(db, bucket_name="GeneratedOutputsBucket")
    print("Inside upload generated image")
    content = await image_output.read()
    print("Read Uploaded Inside upload generated image")
    image_id = await bucket.upload_from_stream(image_output.filename, content)
    print("Uploaded Inside upload generated image")
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



# Upload of Generated Video (via URL)
@router.put("/upload-generated-video/{project_id}")
async def upload_generated_video(
    project_id: str,
    video_output: str = Form(...),  # Accept video URL as form field
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    await upsert_generated_output(db, project_id, {"video": video_output})
    return {"message": "Video URL uploaded", "video_url": video_output}


# Stream Product Image
@router.get("/uploaded/image/{file_id}")
async def stream_image(file_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    try:
        bucket = AsyncIOMotorGridFSBucket(db, bucket_name="ProductImageBucket")
        stream = await bucket.open_download_stream(ObjectId(file_id))
        return StreamingResponse(stream, media_type="image/jpeg")
    except:
        raise HTTPException(status_code=404, detail="Image not found")
    

@router.get("/uploaded/image/ids/{product_id}")
async def get_image_ids(product_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    product = await db["Products"].find_one({
        "_id": ObjectId(product_id)
    })

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    image_ids = product.get("images", [])

    return image_ids


# Delete Product-Project
@router.delete("/delete/{project_id}")
async def delete_project(project_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    project = await db["Projects"].find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Delete generated outputs from GridFS
    bucket = AsyncIOMotorGridFSBucket(db, bucket_name="GeneratedOutputsBucket")
    
    print("Generated Output ID:", project.get("generated_outputs_id"))

    generated_output_id = project.get("generated_outputs_id")

    if generated_output_id:
        print("Inside delete of generated output")
        try:
            # Safely convert to ObjectId
            output_oid = ObjectId(generated_output_id)
            
            # Fetch the document first
            generated_output = await db["GeneratedOutput"].find_one({"_id": output_oid})

            if not generated_output:
                print("GeneratedOutput not found.")
            else:
                # Delete image if present
                if "image" in generated_output and generated_output["image"]:
                    try:
                        await bucket.delete(ObjectId(generated_output["image"]))
                        print("Deleted image from GridFS.")
                    except Exception as e:
                        print(f"Error deleting image: {e}")

                # Delete the document itself
                result = await db["GeneratedOutput"].delete_one({"_id": output_oid})
                if result.deleted_count:
                    print("Successfully deleted GeneratedOutput document.")
                else:
                    print("Failed to delete GeneratedOutput document.")

        except Exception as e:
            print(f"Exception occurred during delete: {e}")

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