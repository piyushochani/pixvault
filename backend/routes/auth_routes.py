from fastapi import APIRouter, HTTPException, status
from passlib.context import CryptContext
from bson import ObjectId
from datetime import datetime, timezone

from models.user_model import RegisterRequest, LoginRequest
from services.mongodb_service import users_col
from utils.jwt_utils import create_token

router = APIRouter(prefix="/auth", tags=["auth"])
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/register", status_code=201)
def register(body: RegisterRequest):
    if users_col.find_one({"email": body.email}):
        raise HTTPException(status_code=400, detail="Email already registered.")

    user = {
        "_id": ObjectId(),
        "email": body.email,
        "password": pwd_ctx.hash(body.password),
        "created_at": datetime.now(timezone.utc),
    }
    users_col.insert_one(user)
    token = create_token(str(user["_id"]))
    return {"token": token, "email": user["email"]}


@router.post("/login")
def login(body: LoginRequest):
    user = users_col.find_one({"email": body.email})
    if not user or not pwd_ctx.verify(body.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_token(str(user["_id"]))
    return {"token": token, "email": user["email"]}