from fastapi import APIRouter, HTTPException, Depends, Response, status, Request
from pydantic import BaseModel, EmailStr, validator
from motor.motor_asyncio import AsyncIOMotorDatabase
from passlib.context import CryptContext
from typing import Optional, List
from bson import ObjectId
from jose import jwt, JWTError
from datetime import datetime, timedelta
import os
from app.db import get_database

router = APIRouter(prefix="/api/user", tags=["User"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60



def clean_mongo_doc(doc):
    cleaned = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            cleaned[key] = str(value)
        elif isinstance(value, datetime):
            cleaned[key] = value.isoformat()
        elif key == "shared" and isinstance(value, list):
            # Convert ObjectId list to string list
            cleaned[key] = [str(uid) for uid in value]
        else:
            cleaned[key] = value
    return cleaned

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_username_from_token(token: str):
    if not token:
        raise HTTPException(status_code=401, detail="No token provided")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


class SharedUsersRequest(BaseModel):
    selected_users: List[str]

class RegisterUser(BaseModel):
    username: str
    email: EmailStr
    password: str
    
    @validator('username')
    def validate_username(cls, v):
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters long')
        if len(v) > 30:
            raise ValueError('Username must be less than 30 characters')
        return v.strip()
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

class LoginPayload(BaseModel):
    identifier: str
    password: str

class UpdateUsername(BaseModel):
    username: str
    
    @validator('username')
    def validate_username(cls, v):
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters long')
        if len(v) > 30:
            raise ValueError('Username must be less than 30 characters')
        return v.strip()

class ChangePassword(BaseModel):
    current_password: str
    new_password: str
    
    @validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 6:
            raise ValueError('New password must be at least 6 characters long')
        return v

class TokenData(BaseModel):
    sub: Optional[str] = None


@router.get("/profile")
async def get_profile(request: Request, db: AsyncIOMotorDatabase = Depends(get_database)):
    token = request.cookies.get("access_token")
    username = get_username_from_token(token)
    user = await db["Users"].find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Return user data with ID included
    return {
        "id": str(user["_id"]),  # Include user ID
        "username": user["username"], 
        "email": user["email"],
        "created_at": user.get("created_at", "").isoformat() if user.get("created_at") else None
    }

@router.get("/{user_id}")
async def get_all_usernames(user_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    try:
        object_id = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    # Exclude the user with the given _id and include both _id and username
    cursor = db["Users"].find(
        {"_id": {"$ne": object_id}},
        {"username": 1}  # keep _id included by default
    )
    users = await cursor.to_list(length=None)

    # Return list of {username, user_id}
    return [
        {"username": user["username"], "user_id": str(user["_id"])}
        for user in users if "username" in user
    ]


@router.post("/register")
async def register_user(payload: RegisterUser, db: AsyncIOMotorDatabase = Depends(get_database)):
    existing_user = await db["Users"].find_one({
        "$or": [{"username": payload.username}, {"email": payload.email}]
    })
    if existing_user:
        if existing_user.get("username") == payload.username:
            raise HTTPException(status_code=400, detail="Username already taken")
        else:
            raise HTTPException(status_code=400, detail="Email already registered")

    user_dict = {
        "username": payload.username,
        "email": payload.email,
        "password": pwd_context.hash(payload.password),
        "created_at": datetime.utcnow(),
        "shared_projects": []
    }

    result = await db["Users"].insert_one(user_dict)
    return {"message": "User registered successfully", "user_id": str(result.inserted_id)}

@router.post("/login")
async def login_user(payload: LoginPayload, response: Response, db: AsyncIOMotorDatabase = Depends(get_database)):
    user = await db["Users"].find_one({
        "$or": [{"username": payload.identifier}, {"email": payload.identifier}]
    })
    if not user or not pwd_context.verify(payload.password, user["password"]):
        raise HTTPException(status_code=400, detail="Invalid username/email or password")

    access_token = create_access_token(data={"sub": user["username"]})

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="None",
        max_age=60 * 60 * 24 * 7, 
        path="/"
    )


    # Return consistent user data structure
    return {
        "access_token": access_token,
        "user": {
            "id": str(user["_id"]),  # Include user ID
            "username": user["username"],
            "email": user["email"],  # Include email for consistency
            "created_at": user.get("created_at", "").isoformat() if user.get("created_at") else None
        }
    }

@router.get("/userdetails/by-username")
async def get_userdetails_by_username(username: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    user = await db["Users"].find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found by username")
    user["id"] = str(user.pop("_id", ""))
    user.pop("password", None)
    if "created_at" in user:
        user["created_at"] = user["created_at"].isoformat()
    return user

@router.get("/userdetails/by-email")
async def get_userdetails_by_email(email: EmailStr, db: AsyncIOMotorDatabase = Depends(get_database)):
    user = await db["Users"].find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found by email")
    user["id"] = str(user.pop("_id", ""))
    user.pop("password", None)
    if "created_at" in user:
        user["created_at"] = user["created_at"].isoformat()
    return user



@router.post("/update-username")
async def update_username(payload: UpdateUsername, request: Request, db: AsyncIOMotorDatabase = Depends(get_database)):
    token = request.cookies.get("access_token")
    current_username = get_username_from_token(token)
    
    # Check if new username is different from current
    if payload.username == current_username:
        raise HTTPException(status_code=400, detail="New username must be different from current username")
    
    # Check if new username is already taken
    existing_user = await db["Users"].find_one({"username": payload.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Update the username
    result = await db["Users"].update_one(
        {"username": current_username}, 
        {"$set": {"username": payload.username, "updated_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create new token with updated username
    new_token = create_access_token(data={"sub": payload.username})
    
    return {
        "message": "Username updated successfully",
        "new_token": new_token,
        "username": payload.username
    }

@router.post("/change-password")
async def change_password(payload: ChangePassword, request: Request, db: AsyncIOMotorDatabase = Depends(get_database)):
    token = request.cookies.get("access_token")
    username = get_username_from_token(token)
    user = await db["Users"].find_one({"username": username})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Verify current password
    if not pwd_context.verify(payload.current_password, user["password"]):
        raise HTTPException(status_code=403, detail="Current password is incorrect")
    
    # Check if new password is different from current
    if pwd_context.verify(payload.new_password, user["password"]):
        raise HTTPException(status_code=400, detail="New password must be different from current password")

    # Hash and update new password
    hashed_new_password = pwd_context.hash(payload.new_password)
    result = await db["Users"].update_one(
        {"username": username}, 
        {"$set": {"password": hashed_new_password, "updated_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Password updated successfully"}

@router.post("/shared/{project_id}")
async def update_users_shared_projects(
    request: SharedUsersRequest,
    project_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    selected_users = request.selected_users  # This contains user_ids (as strings)
    print("Selected Users:", selected_users)

    print("Finding Projects")
    project = await db["Projects"].find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    print("Found Project\n")



    filtered_dataset_id = project.get("filtered_dataset_id")    
    if filtered_dataset_id is None:
        raise HTTPException(status_code=404, detail = "Filtered Dataset ID not Found")
    
    print("Finding Filtered Dataset")
    filtered_dataset = await db["FilteredDataset"].find_one({"_id": filtered_dataset_id})
    if not filtered_dataset:
        raise HTTPException(status_code=404, detail="Filtered Dataset not found")
    

    existing_filtereddataset_shared_users = filtered_dataset.get("shared", [])


    # Get existing shared users list once
    existing_project_shared_users = project.get("shared", [])

    already_shared_users = []
    newly_shared_users = []

    for user_id_str in selected_users:
        try:
            user_id = ObjectId(user_id_str)
        except Exception:
            continue  # Skip invalid ObjectId

        user = await db["Users"].find_one({"_id": user_id})
        if not user:
            continue  # Skip if user doesn't exist

        print("User with ID", user_id_str, "found")

        user_shared_projects = user.get("shared_projects", [])

        # Update Users Collection
        if ObjectId(project_id) not in user_shared_projects:
            user_shared_projects.append(ObjectId(project_id))
            await db["Users"].update_one(
                {"_id": user_id},
                {"$set": {"shared_projects": user_shared_projects}}
            )

        # Update Projects Collection only if not already shared
        if user_id not in existing_project_shared_users:
            await db["Projects"].update_one(
                {"_id": ObjectId(project_id)},
                {"$addToSet": {"shared": user_id}}  # Mongo handles uniqueness
            )
            newly_shared_users.append(str(user_id))
        else:
            already_shared_users.append(str(user_id))

        # Update Filtered Dataset Collection only if not already shared
        if user_id not in existing_filtereddataset_shared_users:
            await db["FilteredDataset"].update_one(
                {"project_id": ObjectId(project_id)},
                {"$addToSet": {"shared": user_id}}  # Mongo handles uniqueness
            )
        

    return {
        "message": "Processed shared users",
        "added": newly_shared_users,
        "already_shared": already_shared_users
    }



@router.get("/shared/{user_id}")
async def get_shared_project_ids(user_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    user = await db["Users"].find_one({
        "_id" : ObjectId(user_id)
    })

    if not user:
        raise HTTPException(status_code=404, detail="User Not Found")
    
    project_ids = user.get("shared_projects")
    projects = []

    for project_id in project_ids:
        project = await db["Projects"].find_one({
            "_id" : project_id
        })

        if not project:
            raise HTTPException(status_code=404, detail="Project not found from shared projects")
        
        projects.append(clean_mongo_doc(project))

    return projects

@router.post("/logout")
async def logout_user(response: Response):
    response.delete_cookie(key="access_token", httponly=True, secure=True, samesite="None")
    return {"message": "Logged out successfully"}