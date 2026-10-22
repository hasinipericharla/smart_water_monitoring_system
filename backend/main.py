"""Smart Water Monitoring API. Data (users, readings, recipients, alerts) is stored in MongoDB.
SMS provider is chosen by env var SMS_PROVIDER: console (default, test only) | fast2sms | twilio."""
import os, time
from contextlib import asynccontextmanager
from datetime import datetime, timezone

import requests
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from db import db, init_indexes  # db.py loads backend/.env
from auth import current_user, router as auth_router


@asynccontextmanager
async def lifespan(app):
    init_indexes()
    yield


app = FastAPI(title="Smart Water Monitoring API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["*"], allow_headers=["*"])
app.include_router(auth_router)

# None = limit not set. TDS/turbidity values below are DEMO placeholders: confirm them for your sensors.
THRESHOLDS = {"level_low": 20, "level_high": 80, "tds_upper": 500, "tds_lower": None, "turb_upper": 5, "turb_lower": None}
PROVIDER = os.getenv("SMS_PROVIDER", "console")
DEVICE_KEY = os.getenv("DEVICE_KEY")  # if set, devices must send it in the X-API-Key header
LAST_STUDENT_SMS: dict[str, float] = {}
CATEGORY = {"high_level": "highLevel", "low_level": "lowLevel", "tds_high": "tds", "tds_low": "tds", "turb_high": "turb", "turb_low": "turb"}


class Reading(BaseModel):
    device_id: str
    hostel_id: str
    tank_id: str
    distance_cm: float | None = None  # sensor-to-water-surface distance
    tank_height_cm: float = 200  # sensor face to tank bottom
    full_offset_cm: float = 0  # distance from sensor face down to the full-water line
    tds_ppm: float | None = None
    turbidity_ntu: float | None = None

    # Raw analog readings from ESP32
    tds_adc: int | None = None 
    turbidity_adc: int | None = None

    # Raw sensor voltages
    tds_voltage: float | None = None 
    turbidity_voltage: float | None = None


class Person(BaseModel):
    id: str
    type: str
    name: str
    phone: str
    hostelId: str
    role: str | None = None
    alerts: list[str] = []
    active: bool = True


def load_people() -> list[dict]:
    return list(db.recipients.find({}, {"_id": 0}))


def level_pct(h: float, d: float | None, off: float = 0):
    if d is None or d < 0 or d > h * 1.05:
        return None  # impossible reading: flag it, never treat as a real level
    return max(0.0, min(100.0, (h - d) / (h - off) * 100))


def send_sms(phone: str, text: str) -> tuple[bool, str]:
    digits = "".join(c for c in phone if c.isdigit())
    try:
        if PROVIDER == "twilio":
            sid = os.environ["TWILIO_SID"]
            to = "+" + (digits if len(digits) > 10 else "91" + digits)
            r = requests.post(f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json",
                              data={"To": to, "From": os.environ["TWILIO_FROM"], "Body": text},
                              auth=(sid, os.environ["TWILIO_TOKEN"]), timeout=15)
            return r.ok, r.text[:200]
        if PROVIDER == "fast2sms":
            r = requests.post("https://www.fast2sms.com/dev/bulkV2", headers={"authorization": os.environ["FAST2SMS_KEY"]},
                              data={"route": os.getenv("FAST2SMS_ROUTE", "q"), "message": text, "numbers": digits[-10:]}, timeout=15)
            return (r.ok and r.json().get("return") is True), r.text[:200]
        print(f"[SMS TEST MODE -> {phone}] {text}")
        return True, "console"
    except Exception as e:  # missing env var, network error, bad response
        return False, f"{type(e).__name__}: {e}"[:200]


def conditions(r: dict) -> dict[str, bool]:
    T, c = THRESHOLDS, {}
    if r["level"] is not None:
        c["low_level"] = r["level"] < T["level_low"]
        c["high_level"] = r["level"] > T["level_high"]
    for k in ("tds", "turb"):
        v = r[k]
        if v is None:
            continue
        if T[f"{k}_upper"] is not None:
            c[f"{k}_high"] = v > T[f"{k}_upper"]
        if T[f"{k}_lower"] is not None:
            c[f"{k}_low"] = v < T[f"{k}_lower"]
    return c


def alert_text(kind: str, r: dict) -> str:
    T, where, t = THRESHOLDS, f"{r['hostel_id']}, {r['tank_id']}", datetime.now().strftime("%d %b %H:%M")
    return {
        "high_level": f"Water Alert: Water level in {where} is {r['level']:.0f}% (above {T['level_high']}%). Please check the tank for overflow risk. Time: {t}",
        "low_level": f"Low Water Alert: Water level in {where} has fallen to {r['level']:.0f}% (below {T['level_low']}%). Please check the supply and arrange refilling. Time: {t}",
        "tds_high": f"Water Quality Alert: TDS in {where} is {r['tds']:.0f} ppm, above the limit of {T['tds_upper']} ppm. Please arrange verification. Time: {t}",
        "tds_low": f"Water Quality Alert: TDS in {where} is {r['tds']:.0f} ppm, below the limit of {T['tds_lower']} ppm. Please arrange verification. Time: {t}",
        "turb_high": f"Water Quality Alert: Turbidity in {where} is {r['turb']} NTU, above the limit of {T['turb_upper']} NTU. Please inspect the water. Time: {t}",
        "turb_low": f"Water Quality Alert: Turbidity in {where} is {r['turb']} NTU, below the limit of {T['turb_lower']} NTU. Please inspect the water. Time: {t}",
    }[kind]


def is_active(key: str) -> bool:
    d = db.alert_state.find_one({"_id": key})
    return bool(d and d.get("active"))


def set_active(key: str, v: bool):
    db.alert_state.update_one({"_id": key}, {"$set": {"active": v}}, upsert=True)


def evaluate(r: dict) -> list[str]:
    fired = []
    for kind, bad in conditions(r).items():
        key = f"{r['hostel_id']}|{r['tank_id']}|{kind}"  # state is kept in MongoDB, so a restart does not repeat SMS
        if not bad:
            if is_active(key):
                set_active(key, False)  # recovered: re-arm
        elif not is_active(key):
            set_active(key, True)
            fired.append(kind)
            text = alert_text(kind, r)
            to = [p for p in load_people() if p["active"] and p["type"] == "warden" and p["hostelId"] == r["hostel_id"] and CATEGORY[kind] in p["alerts"]]
            if not to:
                print(f"[ALERT {kind}] no active warden for {r['hostel_id']} with this alert enabled; nothing sent")
                db.alerts.insert_one({"ts": r["ts"], "hostel_id": r["hostel_id"], "kind": kind, "recipient": None, "ok": False, "detail": "no recipients"})
            for p in to:
                ok, detail = send_sms(p["phone"], text)
                db.alerts.insert_one({"ts": r["ts"], "hostel_id": r["hostel_id"], "kind": kind, "recipient": p["name"], "ok": ok, "detail": detail})
    return fired


def with_iso(doc: dict) -> dict:
    return {**doc, "ts": doc["ts"].isoformat()}


@app.get("/")
def root():
    return {"status": "ok", "docs": "/docs", "sms_provider": PROVIDER}


@app.put("/api/recipients")
def put_recipients(people: list[Person], user: dict = Depends(current_user)):
    db.recipients.delete_many({})
    if people:
        db.recipients.insert_many([p.model_dump() for p in people])
    return {"saved": len(people)}


# @app.post("/api/readings")  # called by the ESP board, not by users: protected by the device key
# def ingest(p: Reading, x_api_key: str | None = Header(None)):
#     if DEVICE_KEY and x_api_key != DEVICE_KEY:
#         raise HTTPException(401, "Invalid device key")
#     r = {"ts": datetime.now(timezone.utc), "hostel_id": p.hostel_id, "tank_id": p.tank_id, "device_id": p.device_id,
#          "level": level_pct(p.tank_height_cm, p.distance_cm, p.full_offset_cm), "tds": p.tds_ppm, "turb": p.turbidity_ntu}
#     r["valid"] = r["level"] is not None
#     db.readings.insert_one(dict(r))  # copy: insert_one adds _id to the dict it receives
#     return {**with_iso(r), "alerts_triggered": evaluate(r)}

@app.post("/api/readings")
def ingest(p: Reading, x_api_key: str | None = Header(None)):
    if DEVICE_KEY and x_api_key != DEVICE_KEY:
        raise HTTPException(401, "Invalid device key")

    r = {
        "ts": datetime.now(timezone.utc),
        "hostel_id": p.hostel_id,
        "tank_id": p.tank_id,
        "device_id": p.device_id,
        "distance_cm": p.distance_cm,
        "level": level_pct(
            p.tank_height_cm,
            p.distance_cm,
            p.full_offset_cm
        ),
        "tds": p.tds_ppm,
        "turb": p.turbidity_ntu,
        "tds_adc": p.tds_adc,
        "turbidity_adc": p.turbidity_adc,
        "tds_voltage": p.tds_voltage,
        "turbidity_voltage": p.turbidity_voltage,
    }

    r["valid"] = r["level"] is not None

    db.readings.insert_one(dict(r))

    return {
        **with_iso(r),
        "alerts_triggered": evaluate(r)
    }




@app.get("/api/hostels/{hostel_id}/readings")
def list_readings(hostel_id: str, limit: int = 5000, user: dict = Depends(current_user)):
    rows = db.readings.find({"hostel_id": hostel_id}, {"_id": 0}).sort("ts", -1).limit(min(limit, 50000))
    return [with_iso(x) for x in rows][::-1]  # oldest first


@app.get("/api/alerts")
def alerts(limit: int = 100, user: dict = Depends(current_user)):
    return [with_iso(x) for x in db.alerts.find({}, {"_id": 0}).sort("ts", -1).limit(min(limit, 1000))]


@app.post("/api/hostels/{hostel_id}/notify-students")
def notify_students(hostel_id: str, user: dict = Depends(current_user)):
    if time.time() - LAST_STUDENT_SMS.get(hostel_id, 0) < 600:
        raise HTTPException(429, "A student notice was already sent in the last 10 minutes. Try again later.")
    to = [p for p in load_people() if p["active"] and p["type"] == "student" and p["hostelId"] == hostel_id and {"lowLevel", "conservation"} & set(p["alerts"])]
    if not to:
        raise HTTPException(404, "No active students with low-water or conservation alerts enabled for this hostel.")
    text = f"Water Conservation Notice: The water level in your hostel ({hostel_id}) tank is low, so please use water moderately and avoid wastage until the supply returns to normal."
    results = [send_sms(p["phone"], text) for p in to]
    sent = sum(ok for ok, _ in results)
    if sent:
        LAST_STUDENT_SMS[hostel_id] = time.time()
    for p, (ok, detail) in zip(to, results):
        db.alerts.insert_one({"ts": datetime.now(timezone.utc), "hostel_id": hostel_id, "kind": "student_notice", "recipient": p["name"], "ok": ok, "detail": detail, "sent_by": user["email"]})
    return {"provider": PROVIDER, "total": len(to), "sent": sent, "failed": len(to) - sent}