from fastapi import APIRouter, HTTPException, Depends, Response, status, Request
from pydantic import BaseModel, EmailStr, validator
from motor.motor_asyncio import AsyncIOMotorDatabase
from passlib.context import CryptContext
from typing import Optional
from jose import jwt, JWTError
from datetime import datetime, timedelta
import os
from app.db import get_database

router = APIRouter(prefix="/api/user", tags=["User"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

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
        "created_at": datetime.utcnow()
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

    token = create_access_token(data={"sub": user["username"]})
    response.set_cookie(
        key="access_token", 
        value=token, 
        httponly=True, 
        secure=True, 
        samesite="Lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

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

@router.get("/profile")
async def get_profile(request: Request, db: AsyncIOMotorDatabase = Depends(get_database)):
    token = request.cookies.get("access_token")
    username = get_username_from_token(token)
    user = await db["Users"].find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "username": user["username"], 
        "email": user["email"],
        "created_at": user.get("created_at", "").isoformat() if user.get("created_at") else None
    }

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

@router.post("/logout")
async def logout_user(response: Response):
    response.delete_cookie(key="access_token", httponly=True, secure=True, samesite="Lax")
    return {"message": "Logged out successfully"}