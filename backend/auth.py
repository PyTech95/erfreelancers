import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel

from store import db
from rate_limit import limiter

router = APIRouter(prefix="/api/auth")
ALGO = "HS256"
MAX_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()


def verify_password(p: str, h: str) -> bool:
    return bcrypt.checkpw(p.encode(), h.encode())


def create_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "type": "access",
               "exp": datetime.now(timezone.utc) + timedelta(hours=24)}
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=ALGO)


async def seed_admin():
    email = os.environ["ADMIN_EMAIL"].lower()
    password = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": email})
    if existing is None:
        await db.users.insert_one({"id": "usr-admin-001", "email": email, "password_hash": hash_password(password),
                                   "name": "Rajeev", "role": "admin", "createdAt": datetime.now(timezone.utc).isoformat()})
    elif not verify_password(password, existing["password_hash"]):
        await db.users.update_one({"email": email}, {"$set": {"password_hash": hash_password(password)}})


async def get_current_admin(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(auth[7:], os.environ["JWT_SECRET"], algorithms=[ALGO])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")
    user = await db.users.find_one({"id": payload.get("sub"), "role": "admin"}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user


class LoginBody(BaseModel):
    email: str
    password: str


@router.post("/login")
@limiter.limit("10/minute")
async def login(body: LoginBody, request: Request):
    email = body.email.strip().lower()
    identifier = f"{request.client.host if request.client else 'unknown'}:{email}"
    now = datetime.now(timezone.utc)
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("count", 0) >= MAX_ATTEMPTS:
        locked_until = datetime.fromisoformat(attempt["lastAttempt"]) + timedelta(minutes=LOCKOUT_MINUTES)
        if now < locked_until:
            raise HTTPException(429, f"Too many failed attempts. Try again in {int((locked_until - now).total_seconds() // 60) + 1} min.")
        await db.login_attempts.delete_one({"identifier": identifier})

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        await db.login_attempts.update_one({"identifier": identifier},
                                           {"$inc": {"count": 1}, "$set": {"lastAttempt": now.isoformat()}}, upsert=True)
        raise HTTPException(401, "Invalid email or password")

    await db.login_attempts.delete_one({"identifier": identifier})
    return {"token": create_token(user["id"], user["email"]),
            "user": {"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]}}


@router.get("/me")
async def me(user=Depends(get_current_admin)):
    return {"user": user}
