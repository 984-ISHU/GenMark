from pydantic import BaseModel, EmailStr, Field, HttpUrl
from typing import List
from datetime import datetime

# ---------- USER ----------
class User(BaseModel):
    username: str
    email: EmailStr
    password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ---------- GENERATED OUTPUTS ----------
class GeneratedOutputs(BaseModel):
    text: str
    video: HttpUrl
    image_urls: List[HttpUrl]

# ---------- PROJECT ----------
class Project(BaseModel):
    user_id: str
    dataset_id: str
    name: str
    target_audience: str
    output_format: str  # "image", "text", "video"
    product_id: str
    generated_outputs: GeneratedOutputs
    status: str  # e.g. "in_progress", "completed"
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ---------- PRODUCT ----------
class Product(BaseModel):
    project_id: str
    name: str
    description: str
    price: float
    discount: float
    images: List[HttpUrl]



# ---------- DATASET ----------
class Dataset(BaseModel):
    user_id: str
    dataset_name: str
    file_id: str
    categories: List[str]
    locations: List[str]

# ---------- PRODUCTS DATASET ----------
class ProductsDataset(BaseModel):
    user_id: str
    dataset_name: str
    file_id: str