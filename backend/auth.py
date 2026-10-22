"""Signup with email OTP, login, and JWT sessions. Users are stored in MongoDB."""
import hashlib, hmac, os, secrets, smtplib, ssl, time
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage

import bcrypt
import jwt
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field
from pymongo.errors import DuplicateKeyError

from db import db

router = APIRouter(prefix="/api/auth", tags=["auth"])

SECRET = os.getenv("JWT_SECRET") or secrets.token_hex(32)
if not os.getenv("JWT_SECRET"):
    print("[WARN] JWT_SECRET is not set: using a random one, so everyone is logged out on each restart.")
OTP_MINUTES, OTP_MAX_TRIES, RESEND_SECONDS, TOKEN_HOURS = 10, 5, 60, 8
SMTP_HOST, SMTP_PORT = os.getenv("SMTP_HOST", "smtp.gmail.com"), int(os.getenv("SMTP_PORT", "587"))
SMTP_USER, SMTP_PASS = os.getenv("SMTP_USER"), os.getenv("SMTP_PASS")
ALLOWED_DOMAIN = os.getenv("ALLOWED_EMAIL_DOMAIN", "").lower().lstrip("@")  # e.g. college.edu ; empty = any email
EMAIL_RE = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
FAILS: dict[str, list[float]] = {}  # failed logins per email (in memory)


class Signup(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: str = Field(pattern=EMAIL_RE)
    phone: str = Field(pattern=r"^\+?\d{10,13}$")
    password: str = Field(min_length=8, max_length=72)


class EmailOnly(BaseModel):
    email: str = Field(pattern=EMAIL_RE)


class Verify(BaseModel):
    email: str = Field(pattern=EMAIL_RE)
    otp: str = Field(pattern=r"^\d{6}$")


class Login(BaseModel):
    email: str = Field(pattern=EMAIL_RE)
    password: str = Field(min_length=1, max_length=72)


def now() -> datetime:
    return datetime.now(timezone.utc)


def otp_hash(email: str, otp: str) -> str:
    return hmac.new(SECRET.encode(), f"{email}:{otp}".encode(), hashlib.sha256).hexdigest()


def hash_pw(p: str) -> str:
    return bcrypt.hashpw(p.encode()[:72], bcrypt.gensalt()).decode()


def check_pw(p: str, h: str) -> bool:
    return bcrypt.checkpw(p.encode()[:72], h.encode())


def send_email(to: str, subject: str, body: str):
    if not SMTP_USER:  # test mode: no email settings, print instead
        print(f"\n[EMAIL TEST MODE -> {to}]\n{subject}\n{body}\n")
        return
    msg = EmailMessage()
    msg["From"], msg["To"], msg["Subject"] = os.getenv("SMTP_FROM") or SMTP_USER, to, subject
    msg.set_content(body)
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as s:
        s.starttls(context=ssl.create_default_context())
        s.login(SMTP_USER, SMTP_PASS)
        s.send_message(msg)


def mail_otp(email: str, name: str, otp: str):
    send_email(email, "Your Smart Water Monitoring verification code",
               f"Hello {name},\n\nYour verification code is {otp}.\nIt expires in {OTP_MINUTES} minutes.\n\nIf you did not sign up, ignore this email.")


def session(u: dict) -> dict:
    token = jwt.encode({"sub": u["email"], "role": u["role"], "exp": now() + timedelta(hours=TOKEN_HOURS)}, SECRET, algorithm="HS256")
    return {"token": token, "user": {"name": u["name"], "email": u["email"], "role": u["role"]}}


@router.post("/signup")
def signup(b: Signup):
    email = b.email.lower()
    if ALLOWED_DOMAIN and not email.endswith("@" + ALLOWED_DOMAIN):
        raise HTTPException(400, f"Use your @{ALLOWED_DOMAIN} email address.")
    if db.users.find_one({"email": email}):
        raise HTTPException(409, "An account with this email already exists. Log in instead.")
    old = db.pending.find_one({"_id": email})
    if old and old["resendAt"] > now():
        raise HTTPException(429, f"Please wait {int((old['resendAt'] - now()).total_seconds()) + 1} seconds before asking for another code.")
    otp = f"{secrets.randbelow(10**6):06d}"
    db.pending.replace_one({"_id": email}, {
        "_id": email, "name": b.name.strip(), "phone": b.phone, "pwHash": hash_pw(b.password),
        "otpHash": otp_hash(email, otp), "tries": 0,
        "resendAt": now() + timedelta(seconds=RESEND_SECONDS), "expiresAt": now() + timedelta(minutes=OTP_MINUTES)}, upsert=True)
    try:
        mail_otp(email, b.name.strip(), otp)
    except Exception as e:
        db.pending.delete_one({"_id": email})
        print(f"[EMAIL ERROR] {type(e).__name__}: {e}")
        raise HTTPException(502, "Could not send the verification email. Check the email settings on the server.")
    return {"message": "Verification code sent. Check your email (and the spam folder)."}


@router.post("/resend-otp")
def resend(b: EmailOnly):
    email = b.email.lower()
    p = db.pending.find_one({"_id": email})
    if not p or p["expiresAt"] < now():
        raise HTTPException(400, "No signup in progress for this email. Please sign up again.")
    if p["resendAt"] > now():
        raise HTTPException(429, f"Please wait {int((p['resendAt'] - now()).total_seconds()) + 1} seconds before asking for another code.")
    otp = f"{secrets.randbelow(10**6):06d}"
    db.pending.update_one({"_id": email}, {"$set": {"otpHash": otp_hash(email, otp), "tries": 0,
                          "resendAt": now() + timedelta(seconds=RESEND_SECONDS), "expiresAt": now() + timedelta(minutes=OTP_MINUTES)}})
    try:
        mail_otp(email, p["name"], otp)
    except Exception as e:
        print(f"[EMAIL ERROR] {type(e).__name__}: {e}")
        raise HTTPException(502, "Could not send the verification email. Check the email settings on the server.")
    return {"message": "A new code was sent."}


@router.post("/verify-otp")
def verify(b: Verify):
    email = b.email.lower()
    p = db.pending.find_one({"_id": email})
    if not p or p["expiresAt"] < now():
        raise HTTPException(400, "The code expired or was not found. Please sign up again.")
    if p["tries"] >= OTP_MAX_TRIES:
        db.pending.delete_one({"_id": email})
        raise HTTPException(429, "Too many wrong codes. Please sign up again.")
    if not hmac.compare_digest(p["otpHash"], otp_hash(email, b.otp)):
        db.pending.update_one({"_id": email}, {"$inc": {"tries": 1}})
        raise HTTPException(400, "Incorrect code.")
    user = {"email": email, "name": p["name"], "phone": p["phone"], "pwHash": p["pwHash"], "role": "warden", "active": True, "createdAt": now()}
    try:
        db.users.insert_one(user)
    except DuplicateKeyError:
        raise HTTPException(409, "An account with this email already exists. Log in instead.")
    db.pending.delete_one({"_id": email})
    return session(user)


@router.post("/login")
def login(b: Login):
    email = b.email.lower()
    recent = [t for t in FAILS.get(email, []) if time.time() - t < 900]
    if len(recent) >= 5:
        raise HTTPException(429, "Too many failed attempts. Try again in 15 minutes.")
    u = db.users.find_one({"email": email})
    if not u or not u.get("active", True) or not check_pw(b.password, u["pwHash"]):
        FAILS[email] = recent + [time.time()]
        raise HTTPException(401, "Incorrect email or password.")
    FAILS.pop(email, None)
    return session(u)


def current_user(authorization: str | None = Header(None)) -> dict:
    """Use as Depends(current_user) on any route that needs a logged-in user."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Login required.")
    try:
        data = jwt.decode(authorization[7:], SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(401, "Session expired. Please log in again.")
    u = db.users.find_one({"email": data["sub"]}, {"pwHash": 0})
    if not u or not u.get("active", True):
        raise HTTPException(401, "Account not found or disabled.")
    return u