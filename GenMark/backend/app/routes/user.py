from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from motor.motor_asyncio import AsyncIOMotorDatabase
from passlib.context import CryptContext
from app.db import get_database

router = APIRouter(prefix="/api/user", tags=["User"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Pydantic models
class RegisterUser(BaseModel):
    username: str
    email: EmailStr
    password: str

class LoginPayload(BaseModel):
    identifier: str  # can be email or username
    password: str

# Register new user
@router.post("/register")
async def register_user(payload: RegisterUser, db: AsyncIOMotorDatabase = Depends(get_database)):
    existing_user = await db["Users"].find_one({
        "$or": [{"username": payload.username}, {"email": payload.email}]
    })
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")

    user_dict = {
        "username": payload.username,
        "email": payload.email,
        "password": pwd_context.hash(payload.password),
    }

    result = await db["Users"].insert_one(user_dict)
    return {"message": "User registered successfully", "user_id": str(result.inserted_id)}

# Login user
@router.post("/login")
async def login_user(payload: LoginPayload, db: AsyncIOMotorDatabase = Depends(get_database)):
    user = await db["Users"].find_one({
        "$or": [{"username": payload.identifier}, {"email": payload.identifier}]
    })
    if not user or not pwd_context.verify(payload.password, user["password"]):
        raise HTTPException(status_code=400, detail="Invalid username/email or password")

    return {
        "message": "Login successful",
        "username": user["username"],
        "email": user["email"]
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

@router.delete("/delete/by-username")
async def delete_by_username(username: str, db: AsyncIOMotorDatabase = Depends(get_database)):

    existing_user = await db["Users"].find_one(
        {"username": username}
    )

    if not existing_user:
        raise HTTPException(status_code=404, detail = "User not found")
    
    result = await db['Users'].delete_one({"username": username})

    if result.deleted_count == 0:
        raise HTTPException(status_code=500, detail="Failed to delete user")
    
    return {"message": f"Successfully deleted {username}"}


@router.delete("/delete/by-email")
async def delete_by_email(email: EmailStr, db: AsyncIOMotorDatabase = Depends(get_database)):

    existing_user = await db["Users"].find_one(
        {"email": email}
    )

    if not existing_user:
        raise HTTPException(status_code=404, detail = "User not found")
    
    result = await db['Users'].delete_one({"email": email})

    if result.deleted_count == 0:
        raise HTTPException(status_code=500, detail="Failed to delete user")
    
    return {"message": f"Successfully deleted {email}"}