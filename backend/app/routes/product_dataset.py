from fastapi.responses import JSONResponse
from fastapi import Body
from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from motor.motor_asyncio import AsyncIOMotorGridFSBucket
from pydantic import BaseModel
from typing import List
from app.db import product_dataset_collection, grid_fs, get_database
from bson import ObjectId
import io
import pandas as pd

router = APIRouter(prefix="/api/products_datasets", tags=["Products Datasets"])

# CHANGED: Added row_count to the output model
class DatasetOut(BaseModel):
    id: str
    user_id: str
    dataset_name: str
    row_count: int = 0

# CHANGED: Updated helper to include row_count
def dataset_helper(dataset) -> dict:
    return {
        "id": str(dataset["_id"]),
        "user_id": str(dataset["user_id"]),
        "dataset_name": dataset["dataset_name"],
        "row_count": dataset.get("row_count", 0) # Safely get row_count
    }

def to_object_id(id_str: str, field: str):
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid {field} format")

@router.get("/", response_model=List[DatasetOut])
async def get_datasets():
    datasets = []
    async for dataset in product_dataset_collection.find():
        datasets.append(dataset_helper(dataset))
    return datasets

@router.post("/upload")
async def upload_dataset(
    user_id: str = Form(...),
    dataset_name: str = Form(...),
    file: UploadFile = File(...)
):
    user_obj_id = to_object_id(user_id, "user_id")

    existing = await product_dataset_collection.find_one({
        "user_id": user_obj_id,
        "dataset_name": dataset_name
    })
    if existing:
        raise HTTPException(
            status_code=400,
            detail="A dataset with this name already exists for this user."
        )
    
    content = await file.read()
    try:
        df = pd.read_csv(io.StringIO(content.decode('utf-8')))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {e}")

    row_count = len(df)
    
    await file.seek(0)
    grid_out = await grid_fs.upload_from_stream(
        file.filename,
        file.file,
        metadata={"content_type": file.content_type}
    )
    file_id = grid_out

    dataset_doc = {
        "user_id": user_obj_id,
        "dataset_name": dataset_name,
        "file_id": file_id,
        "row_count": row_count,
    }

    result = await product_dataset_collection.insert_one(dataset_doc)

    return {
        "dataset_id": str(result.inserted_id),
        "file_id": str(file_id),
        "message": "Dataset uploaded successfully"
    }

@router.get("/{user_id}", response_model=List[DatasetOut])
async def get_user_datasets(user_id: str):
    datasets = []
    user_obj_id = to_object_id(user_id, "user_id")
    async for dataset in product_dataset_collection.find({"user_id": user_obj_id}):
        datasets.append(dataset_helper(dataset))
    return datasets

# NEW: Endpoint to get the actual content of the dataset
@router.get("/{dataset_id}/content")
async def get_dataset_content(dataset_id: str):
    """
    Retrieves and returns the content of a dataset file from GridFS, parsed as JSON.
    """
    obj_id = to_object_id(dataset_id, "dataset_id")
    
    # Find the dataset metadata document
    dataset_meta = await product_dataset_collection.find_one({"_id": obj_id})
    if not dataset_meta:
        raise HTTPException(status_code=404, detail="Dataset metadata not found")

    file_id = dataset_meta.get("file_id")
    if not file_id:
        raise HTTPException(status_code=404, detail="File ID not found for this dataset")

    # Retrieve the file from GridFS
    try:
        grid_in = await grid_fs.open_download_stream(file_id)
        content_bytes = await grid_in.read()
    except Exception:
        raise HTTPException(status_code=404, detail="Could not retrieve file from storage.")

    # Parse the CSV content and return as JSON
    try:
        df = pd.read_csv(io.BytesIO(content_bytes))
        # Replace NaN with None for proper JSON conversion (null)
        df = df.where(pd.notna(df), None)
        return JSONResponse(content=df.to_dict(orient="records"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse file content: {e}")

@router.get("/{dataset_id}", response_model=DatasetOut)
async def get_dataset(dataset_id: str):
    obj_id = to_object_id(dataset_id, "dataset_id")
    dataset = await product_dataset_collection.find_one({"_id": obj_id})
    if dataset:
        return dataset_helper(dataset)
    raise HTTPException(status_code=404, detail="Dataset not found")

@router.delete("/{dataset_id}")
async def delete_dataset(dataset_id: str):
    obj_id = to_object_id(dataset_id, "dataset_id")

    dataset = await product_dataset_collection.find_one({"_id": obj_id})
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    file_id = dataset.get("file_id")

    result = await product_dataset_collection.delete_one({"_id": obj_id})

    if result.deleted_count == 1:
        if file_id:
            try:
                await grid_fs.delete(file_id)
            except Exception:
                # Log this error but don't fail the request,
                # as the primary metadata has been deleted.
                pass
        return {"detail": "Dataset deleted"}
    raise HTTPException(status_code=404, detail="Dataset not found")