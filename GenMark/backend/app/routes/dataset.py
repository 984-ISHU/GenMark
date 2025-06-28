from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from pydantic import BaseModel
from typing import List
from app.db import dataset_collection, grid_fs
from app.model import Dataset
from bson import ObjectId

router = APIRouter(prefix="/api/datasets", tags=["Datasets"])

class DatasetOut(BaseModel):
    id: str  
    user_id: str
    project_id: str
    dataset_name: str

def dataset_helper(dataset) -> dict:
    return {
        "id": str(dataset["_id"]),
        "user_id": str(dataset["user_id"]),
        "project_id": str(dataset["project_id"]),
        "dataset_name": dataset["dataset_name"],
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
    result = await dataset_collection.delete_one({"_id": obj_id})
    if result.deleted_count == 1:
        return {"detail": "Dataset deleted"}
    raise HTTPException(status_code=404, detail="Dataset not found")


@router.post("/upload")
async def upload_dataset(
    user_id: str = Form(...),
    project_id: str = Form(...),
    dataset_name: str = Form(...),
    file: UploadFile = File(...)
):
    user_obj_id = to_object_id(user_id, "user_id")
    project_obj_id = to_object_id(project_id, "project_id")

    # Store file in GridFS (async)
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
        "project_id": project_obj_id,
        "dataset_name": dataset_name,
        "file_id": file_id
    }

    result = await dataset_collection.insert_one(dataset_doc)

    return {
        "dataset_id": str(result.inserted_id),
        "file_id": str(file_id),
        "message": "Dataset uploaded successfully"
    }