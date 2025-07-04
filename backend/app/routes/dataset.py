import io
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Request, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from typing import List
from app.db import dataset_collection, grid_fs, get_database
from app.model import Dataset
from bson import ObjectId

router = APIRouter(prefix="/api/datasets", tags=["Datasets"])

class DatasetOut(BaseModel):
    id: str  
    user_id: str
    dataset_name: str
    categories: List[str]
    locations: List[str]

def dataset_helper(dataset) -> dict:
    return {
        "id": str(dataset["_id"]),
        "user_id": str(dataset["user_id"]),
        "dataset_name": dataset["dataset_name"],
        "categories": dataset["categories"],
        "locations": dataset["locations"]
    }


def to_object_id(id_str: str, field: str):
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid {field} format")

@router.get("/", response_model=List[DatasetOut])
async def get_datasets():
    datasets = []
    async for dataset in dataset_collection.find():
        datasets.append(dataset_helper(dataset))
    return datasets

@router.get("/{user_id}", response_model = List[DatasetOut])
async def get_user_datasets(user_id: str):
    datasets = []
    async for dataset in dataset_collection.find({"user_id": ObjectId(user_id)}):
        datasets.append(dataset_helper(dataset))
    return datasets


@router.get("/{dataset_id}", response_model=DatasetOut)
async def get_dataset(dataset_id: str):
    obj_id = to_object_id(dataset_id, "dataset_id")
    dataset = await dataset_collection.find_one({"_id": obj_id})
    if dataset:
        return dataset_helper(dataset)
    raise HTTPException(status_code=404, detail="Dataset not found")


@router.delete("/{dataset_id}")
async def delete_dataset(dataset_id: str):
    obj_id = to_object_id(dataset_id, "dataset_id")

    dataset = await dataset_collection.find_one({"_id": obj_id})
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    file_id = dataset.get("file_id")

    result = await dataset_collection.delete_one({"_id": obj_id})

    if result.deleted_count == 1:
        if file_id:
            await grid_fs.delete(file_id)
        return {"detail": "Dataset deleted"}
    raise HTTPException(status_code=404, detail="Dataset not found")


@router.post("/upload")
async def upload_dataset(
    user_id: str = Form(...),
    dataset_name: str = Form(...),
    file: UploadFile = File(...)
):
    user_obj_id = to_object_id(user_id, "user_id")

    # 🔍 Check for existing dataset with same name for the same user
    existing = await dataset_collection.find_one({
        "user_id": user_obj_id,
        "dataset_name": dataset_name
    })
    if existing:
        raise HTTPException(
            status_code=400,
            detail="A dataset with this name already exists for this user."
        )

    content = await file.read()
    df = pd.read_csv(io.StringIO(content.decode('utf-8')))

    categories = df["Category"].dropna().unique().tolist() if "Category" in df.columns else []
    locations = df["Location"].dropna().unique().tolist() if "Category" in df.columns else []

    # Store file in GridFS (async)
    await file.seek(0)
    grid_out = await grid_fs.upload_from_stream(
        file.filename,
        file.file,
        metadata={
            "content_type": file.content_type
        }
    )
    file_id = grid_out

    # Create metadata document
    dataset_doc = {
        "user_id": user_obj_id,
        "dataset_name": dataset_name,
        "file_id": file_id,
        "categories": categories,
        "locations": locations
    }

    result = await dataset_collection.insert_one(dataset_doc)

    return {
        "dataset_id": str(result.inserted_id),
        "file_id": str(file_id),
        "message": "Dataset uploaded successfully"
    }

