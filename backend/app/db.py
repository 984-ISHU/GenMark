from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from dotenv import load_dotenv
import os

load_dotenv()
MONGO_URL = os.getenv("MONGO_URL")

# Motor client + database
client = AsyncIOMotorClient(MONGO_URL)
db = client["GenMark"]

def get_database():
    return  db

# Collections
dataset_collection = db["Datasets"]

# GridFS bucket
grid_fs = AsyncIOMotorGridFSBucket(db, "CSVDatasetBucket")
