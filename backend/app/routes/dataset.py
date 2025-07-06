from fastapi.responses import JSONResponse
from fastapi import Body
import pandas as pd
import io
import pandas as pd
import re
from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from motor.motor_asyncio import AsyncIOMotorGridFSBucket
from pydantic import BaseModel
from typing import List
from app.db import dataset_collection, grid_fs, get_database
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



def parse_target_audience(target_str: str):
    """
    Parse the target audience string into a dictionary.
    Example input:
    "Category: Footwear | Location: California | Gender: both | Ages: 11-18, 19-25"
    """
    parsed = {}

    match_category = re.search(r"Category:\s*([^|]+)", target_str)
    match_location = re.search(r"Location:\s*([^|]+)", target_str)
    match_gender = re.search(r"Gender:\s*([^|]+)", target_str)
    match_ages = re.search(r"Ages:\s*(.*)$", target_str)

    if match_category:
        parsed["Category"] = match_category.group(1).strip()
    if match_location:
        parsed["Location"] = match_location.group(1).strip()
    if match_gender:
        gender = match_gender.group(1).strip().lower()
        if gender == "both":
            parsed["Gender"] = ["male", "female"]
        else:
            parsed["Gender"] = [gender]
    if match_ages:
        age_str = match_ages.group(1).strip()
        if "ALL" in age_str:
            parsed["Ages"] = "ALL"
        else:
            parsed["Ages"] = [x.strip() for x in age_str.split(",")]

    return parsed


def age_in_range(age: int, target_ranges: list):
    for range_str in target_ranges:
        if "+" in range_str:
            min_age = int(range_str.replace("+", "").strip())
            if age >= min_age:
                return True
        else:
            try:
                start, end = map(int, range_str.split("-"))
                if start <= age <= end:
                    return True
            except:
                continue
    return False



@router.get("/", response_model=List[DatasetOut])
async def get_datasets():
    datasets = []
    async for dataset in dataset_collection.find():
        datasets.append(dataset_helper(dataset))
    return datasets


@router.get("/check-filtered-exists")
async def check_filtered_exists(user_id: str, project_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    user_obj_id = ObjectId(user_id)
    project_obj_id = ObjectId(project_id)

    result = await db["FilteredDataset"].find_one({
        "user_id": user_obj_id,
        "project_id": project_obj_id
    })

    return {"exists": result is not None}




@router.post("/filter-audience")
async def filter_dataset_by_target_audience(
    user_id: str = Body(...),
    project_id: str = Body(...),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    user_obj_id = ObjectId(user_id)
    project_obj_id = ObjectId(project_id)

    # ✅ If already exists, skip processing
    filtered = await db["FilteredDataset"].find_one({
        "user_id": user_obj_id,
        "project_id": project_obj_id 
    })
    if filtered:
        return {
            "detail": "Filtered dataset already exists.",
            "filtered_count": filtered.get("filtered_count", 0)
        }

    project = await db["Projects"].find_one({"_id": project_obj_id, "user_id": user_obj_id})
    if not project or "selected_dataset" not in project:
        raise HTTPException(status_code=404, detail="Project or dataset not found")

    target_string = project["target_audience"]
    dataset_name = project["selected_dataset"]
    dataset = await dataset_collection.find_one({
        "user_id": user_obj_id,
        "dataset_name": dataset_name
    })
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    file_id = dataset.get("file_id")
    if not file_id:
        raise HTTPException(status_code=400, detail="File not found")

    # Load the original CSV
    grid_in = await grid_fs.open_download_stream(file_id)
    content = await grid_in.read()
    df = pd.read_csv(io.StringIO(content.decode("utf-8")))

    # Parse the target string
    parsed = parse_target_audience(target_string)
    print("Parsed filter:", parsed)

    # Apply filters
    if "Category" in parsed:
        df = df[df["Category"].str.lower() == parsed["Category"].lower()]

    if "Location" in parsed:
        df = df[df["Location"].str.lower() == parsed["Location"].lower()]

    if "Gender" in parsed:
        df = df[df["Gender"].str.lower().isin(parsed["Gender"])]

    if "Ages" in parsed and parsed["Ages"] != "ALL":
        df = df[df["Age"].apply(lambda x: age_in_range(int(x), parsed["Ages"]))]

    # Save filtered CSV to memory
    buffer = io.StringIO()
    df.to_csv(buffer, index=False)
    buffer.seek(0)

    # Upload to GridFS in a separate bucket
    filtered_fs = AsyncIOMotorGridFSBucket(db, bucket_name="FilteredDatasetBucket")
    filtered_file_id = await filtered_fs.upload_from_stream(
        f"{dataset_name}_filtered.csv",
        io.BytesIO(buffer.getvalue().encode("utf-8")),
        metadata={"filtered_for": target_string}
    )

    # Store metadata in a new collection
    await db["FilteredDataset"].insert_one({
        "user_id": user_obj_id,
        "project_id": project_obj_id,
        "file_id": filtered_file_id,
        "target": parsed,
        "original_dataset": dataset_name,
        "filtered_count": len(df)
    })

    return {"detail": "Stored in GridFS", "filtered_count": len(df)}


@router.get("/filtered-data")
async def get_filtered_dataset(user_id: str, project_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    user_obj_id = to_object_id(user_id, "user_id")
    project_obj_id = to_object_id(project_id, "project_id")

    filtered_doc = await db["FilteredDataset"].find_one({
        "user_id": user_obj_id,
        "project_id": project_obj_id
    })
    if not filtered_doc:
        raise HTTPException(status_code=404, detail="Filtered dataset not found")

    file_id = filtered_doc.get("file_id")
    if not file_id:
        raise HTTPException(status_code=404, detail="File ID missing")

    filtered_fs = AsyncIOMotorGridFSBucket(db, bucket_name="FilteredDatasetBucket")
    grid_in = await filtered_fs.open_download_stream(file_id)
    content = await grid_in.read()

    df = pd.read_csv(io.StringIO(content.decode("utf-8")))
    return JSONResponse(content=df.to_dict(orient="records"))



@router.post("/save-filtered-head")
async def save_filtered_dataset_head(
    user_id: str = Body(...),
    project_id: str = Body(...),
    rows: List[dict] = Body(...),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    user_obj_id = to_object_id(user_id, "user_id")
    project_obj_id = to_object_id(project_id, "project_id")

    # Find the filtered dataset document
    filtered_doc = await db["FilteredDataset"].find_one({
        "user_id": user_obj_id,
        "project_id": project_obj_id
    })
    if not filtered_doc:
        raise HTTPException(status_code=404, detail="Filtered dataset not found")

    file_id = filtered_doc.get("file_id")
    if not file_id:
        raise HTTPException(status_code=400, detail="File ID missing")

    # Load the filtered dataset from GridFS
    filtered_fs = AsyncIOMotorGridFSBucket(db, bucket_name="FilteredDatasetBucket")
    grid_in = await filtered_fs.open_download_stream(file_id)
    content = await grid_in.read()

    df = pd.read_csv(io.StringIO(content.decode("utf-8")))

    # Update Email values in the DataFrame
    for i, row in enumerate(rows):
        if i < len(df) and "Email" in row:
            df.at[i, "Email"] = row["Email"]

    # Delete the old file
    await filtered_fs.delete(file_id)

    # Upload the modified CSV back to GridFS
    buffer = io.StringIO()
    df.to_csv(buffer, index=False)
    buffer.seek(0)

    new_file_id = await filtered_fs.upload_from_stream(
        f"{filtered_doc['original_dataset']}_filtered.csv",
        io.BytesIO(buffer.getvalue().encode("utf-8")),
        metadata={"updated": True}
    )

    # Update the document with the new file_id
    await db["FilteredDataset"].update_one(
        {"_id": filtered_doc["_id"]},
        {"$set": {"file_id": new_file_id}}
    )

    return {"detail": "Filtered dataset updated successfully."}


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
    
    categories = sorted(categories)
    locations = sorted(locations)
    
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
