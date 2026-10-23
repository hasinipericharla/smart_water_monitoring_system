

# """Smart Water Monitoring API. Data (users, readings, recipients, alerts) is stored in MongoDB.
# SMS provider is chosen by env var SMS_PROVIDER: console (default, test only) | circuitdigest | fast2sms | twilio."""
# import asyncio
# import os
# import time
# from contextlib import asynccontextmanager
# from datetime import datetime, timezone

# import requests
# from fastapi import Depends, FastAPI, Header, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel

# from db import db, init_indexes  # db.py loads backend/.env
# from auth import current_user, router as auth_router


# # ---------------------------------------------------------------------------
# # Configuration
# # ---------------------------------------------------------------------------

# # None = limit not set. TDS/turbidity values below are DEMO placeholders: confirm them for your sensors.
# THRESHOLDS = {"level_low": 20, "level_high": 80, "tds_upper": 500, "tds_lower": None, "turb_upper": 5, "turb_lower": None}
# PROVIDER = os.getenv("SMS_PROVIDER", "console")
# DEVICE_KEY = os.getenv("DEVICE_KEY")  # if set, devices must send it in the X-API-Key header
# LAST_STUDENT_SMS: dict[str, float] = {}
# CATEGORY = {"high_level": "highLevel", "low_level": "lowLevel", "tds_high": "tds", "tds_low": "tds", "turb_high": "turb", "turb_low": "turb"}

# HOSTEL_IDS = ["LH1", "LH2", "LH3", "LH4", "MH1", "MH2", "MH3", "MH4", "MH5", "MH6", "MH7"]
# OFFLINE_MINUTES = 60  # no reading for this long -> "sensor offline" alert
# OFFLINE_CHECK_SECONDS = 300  # how often the watchdog runs


# # ---------------------------------------------------------------------------
# # App setup
# # ---------------------------------------------------------------------------

# @asynccontextmanager
# async def lifespan(app):
#     init_indexes()
#     watchdog = asyncio.create_task(offline_loop())  # background sensor-offline check
#     try:
#         yield
#     finally:
#         watchdog.cancel()


# app = FastAPI(title="Smart Water Monitoring API", lifespan=lifespan)
# app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["*"], allow_headers=["*"])
# app.include_router(auth_router)


# # ---------------------------------------------------------------------------
# # Models
# # ---------------------------------------------------------------------------

# class Reading(BaseModel):
#     device_id: str
#     hostel_id: str
#     tank_id: str
#     distance_cm: float | None = None  # sensor-to-water-surface distance
#     tank_height_cm: float = 200  # sensor face to tank bottom
#     full_offset_cm: float = 0  # distance from sensor face down to the full-water line
#     tds_ppm: float | None = None
#     turbidity_ntu: float | None = None

#     # Raw analog readings from ESP32
#     tds_adc: int | None = None
#     turbidity_adc: int | None = None

#     # Raw sensor voltages
#     tds_voltage: float | None = None
#     turbidity_voltage: float | None = None


# class Person(BaseModel):
#     id: str
#     type: str
#     name: str
#     phone: str
#     hostelId: str
#     role: str | None = None
#     alerts: list[str] = []
#     active: bool = True


# # ---------------------------------------------------------------------------
# # Helpers
# # ---------------------------------------------------------------------------

# def load_people() -> list[dict]:
#     return list(db.recipients.find({}, {"_id": 0}))


# def level_pct(h: float, d: float | None, off: float = 0):
#     if d is None or d < 0 or d > h * 1.05:
#         return None  # impossible reading: flag it, never treat as a real level
#     return max(0.0, min(100.0, (h - d) / (h - off) * 100))


# def send_sms(phone: str, text: str) -> tuple[bool, str]:
#     """Send an SMS with the provider selected by SMS_PROVIDER."""
#     digits = "".join(c for c in phone if c.isdigit())

#     if PROVIDER == "circuitdigest":
#         api_key = os.getenv("CIRCUIT_DIGEST_API_KEY")

#         if not api_key:
#             return False, "CIRCUIT_DIGEST_API_KEY is missing"

#         if len(digits) == 10:
#             digits = "91" + digits

#         if len(digits) != 12 or not digits.startswith("91"):
#             return False, "Invalid Indian mobile number"

#         # Circuit Digest requires predefined templates.
#         # Template 113: Maintenance Needed.
#         template_id = "113"

#         # Keep the template variables alphanumeric.
#         var1 = "WaterMonitoringSystem"
#         var2 = "CheckWaterQuality"

#         if "Offline" in text:
#             var2 = "SensorOffline"

#         elif "Low Water Alert" in text:
#             var2 = "LowWaterLevel"

#         elif "Water Alert" in text:
#             var2 = "HighWaterLevel"

#         elif "TDS" in text:
#             var2 = "CheckTDS"

#         elif "Turbidity" in text:
#             var2 = "CheckTurbidity"

#         url = "https://www.circuitdigest.cloud/api/v1/send_sms"

#         payload = {
#             "mobiles": digits,
#             "var1": var1,
#             "var2": var2,
#         }

#         headers = {
#             "Authorization": api_key,
#             "Content-Type": "application/json",
#         }

#         try:
#             response = requests.post(
#                 url,
#                 params={"ID": template_id},
#                 headers=headers,
#                 json=payload,
#                 timeout=15,
#             )

#             if not response.ok:
#                 return (
#                     False,
#                     f"Circuit Digest HTTP {response.status_code}: "
#                     f"{response.text[:200]}",
#                 )

#             try:
#                 body = response.json()
#             except ValueError:
#                 return False, "Circuit Digest returned an invalid response"

#             # if body.get("status") == "error":
#             #     return False, str(body)[:200]

#             # return True, str(body)[:200]
#             if body.get("status") != "success":
#                 return False, f"Circuit Digest rejected request: {body}"

#             return True, f"Circuit Digest response: {body}"



#         except Exception as error:
#             return False, f"{type(error).__name__}: {str(error)[:200]}"

#     if PROVIDER == "console":
#         print(f"[SMS TEST MODE -> {phone}] {text}")
#         return True, "console"

#     if PROVIDER == "twilio":
#         try:
#             sid = os.environ["TWILIO_SID"]
#             token = os.environ["TWILIO_TOKEN"]

#             to_number = "+" + (digits if len(digits) > 10 else "91" + digits)

#             response = requests.post(
#                 f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json",
#                 data={
#                     "To": to_number,
#                     "From": os.environ["TWILIO_FROM"],
#                     "Body": text,
#                 },
#                 auth=(sid, token),
#                 timeout=15,
#             )

#             return response.ok, response.text[:200]

#         except Exception as error:
#             return False, str(error)[:200]

#     if PROVIDER == "fast2sms":
#         try:
#             response = requests.post(
#                 "https://www.fast2sms.com/dev/bulkV2",
#                 headers={"authorization": os.environ["FAST2SMS_KEY"]},
#                 data={
#                     "route": os.getenv("FAST2SMS_ROUTE", "q"),
#                     "message": text,
#                     "numbers": digits[-10:],
#                 },
#                 timeout=15,
#             )

#             try:
#                 body = response.json()
#             except ValueError:
#                 body = {}

#             return (
#                 response.ok and body.get("return") is True,
#                 response.text[:200],
#             )

#         except Exception as error:
#             return False, str(error)[:200]

#     return False, f"Unsupported SMS provider: {PROVIDER}"


# # ---------------------------------------------------------------------------
# # Alert logic (level / TDS / turbidity)
# # ---------------------------------------------------------------------------

# def conditions(r: dict) -> dict[str, bool]:
#     T, c = THRESHOLDS, {}
#     if r["level"] is not None:
#         c["low_level"] = r["level"] < T["level_low"]
#         c["high_level"] = r["level"] > T["level_high"]
#     for k in ("tds", "turb"):
#         v = r[k]
#         if v is None:
#             continue
#         if T[f"{k}_upper"] is not None:
#             c[f"{k}_high"] = v > T[f"{k}_upper"]
#         if T[f"{k}_lower"] is not None:
#             c[f"{k}_low"] = v < T[f"{k}_lower"]
#     return c


# def alert_text(kind: str, r: dict) -> str:
#     T, where, t = THRESHOLDS, f"{r['hostel_id']}, {r['tank_id']}", datetime.now().strftime("%d %b %H:%M")
#     return {
#         "high_level": f"Water Alert: Water level in {where} is {r['level']:.0f}% (above {T['level_high']}%). Please check the tank for overflow risk. Time: {t}",
#         "low_level": f"Low Water Alert: Water level in {where} has fallen to {r['level']:.0f}% (below {T['level_low']}%). Please check the supply and arrange refilling. Time: {t}",
#         "tds_high": f"Water Quality Alert: TDS in {where} is {r['tds']:.0f} ppm, above the limit of {T['tds_upper']} ppm. Please arrange verification. Time: {t}",
#         "tds_low": f"Water Quality Alert: TDS in {where} is {r['tds']:.0f} ppm, below the limit of {T['tds_lower']} ppm. Please arrange verification. Time: {t}",
#         "turb_high": f"Water Quality Alert: Turbidity in {where} is {r['turb']} NTU, above the limit of {T['turb_upper']} NTU. Please inspect the water. Time: {t}",
#         "turb_low": f"Water Quality Alert: Turbidity in {where} is {r['turb']} NTU, below the limit of {T['turb_lower']} NTU. Please inspect the water. Time: {t}",
#     }[kind]


# def is_active(key: str) -> bool:
#     d = db.alert_state.find_one({"_id": key})
#     return bool(d and d.get("active"))


# def set_active(key: str, v: bool):
#     db.alert_state.update_one({"_id": key}, {"$set": {"active": v}}, upsert=True)


# def evaluate(r: dict) -> list[str]:
#     fired = []
#     for kind, bad in conditions(r).items():
#         key = f"{r['hostel_id']}|{r['tank_id']}|{kind}"  # state is kept in MongoDB, so a restart does not repeat SMS
#         if not bad:
#             if is_active(key):
#                 set_active(key, False)  # recovered: re-arm
#         elif not is_active(key):
#             set_active(key, True)
#             fired.append(kind)
#             text = alert_text(kind, r)
#             to = [p for p in load_people() if p["active"] and p["type"] == "warden" and p["hostelId"] == r["hostel_id"] and CATEGORY[kind] in p["alerts"]]
#             if not to:
#                 print(f"[ALERT {kind}] no active warden for {r['hostel_id']} with this alert enabled; nothing sent")
#                 db.alerts.insert_one({"ts": r["ts"], "hostel_id": r["hostel_id"], "kind": kind, "recipient": None, "ok": False, "detail": "no recipients"})
#             for p in to:
#                 ok, detail = send_sms(p["phone"], text)
#                 db.alerts.insert_one({"ts": r["ts"], "hostel_id": r["hostel_id"], "kind": kind, "recipient": p["name"], "ok": ok, "detail": detail})
#     return fired


# # ---------------------------------------------------------------------------
# # Sensor-offline watchdog
# # ---------------------------------------------------------------------------

# def check_offline():
#     """SMS wardens (with the 'Sensor offline' alert ticked) when a hostel has sent no reading for OFFLINE_MINUTES."""
#     now = datetime.now(timezone.utc)
#     for h in HOSTEL_IDS:
#         last = db.readings.find_one({"hostel_id": h}, {"ts": 1}, sort=[("ts", -1)])
#         if not last:
#             continue  # never reported: skip
#         key = f"{h}|offline"
#         stale = (now - last["ts"]).total_seconds() > OFFLINE_MINUTES * 60
#         if not stale:
#             if is_active(key):
#                 set_active(key, False)  # data is back: re-arm
#             continue
#         if is_active(key):
#             continue  # already alerted for this outage
#         set_active(key, True)
#         text = (
#             f"Sensor Offline Alert: No readings from {h} since "
#             f"{last['ts'].astimezone().strftime('%d %b %H:%M')}. Please check the ESP32 and network."
#         )
#         to = [p for p in load_people() if p["active"] and p["type"] == "warden" and p["hostelId"] == h and "offline" in p["alerts"]]
#         if not to:
#             db.alerts.insert_one({"ts": now, "hostel_id": h, "kind": "offline", "recipient": None, "ok": False, "detail": "no recipients"})
#         for p in to:
#             ok, detail = send_sms(p["phone"], text)
#             db.alerts.insert_one({"ts": now, "hostel_id": h, "kind": "offline", "recipient": p["name"], "ok": ok, "detail": detail})


# async def offline_loop():
#     while True:
#         try:
#             await asyncio.to_thread(check_offline)
#         except Exception as error:  # never let the watchdog die
#             print(f"[offline watchdog] {type(error).__name__}: {error}")
#         await asyncio.sleep(OFFLINE_CHECK_SECONDS)


# # ---------------------------------------------------------------------------
# # Routes
# # ---------------------------------------------------------------------------

# def with_iso(doc: dict) -> dict:
#     return {**doc, "ts": doc["ts"].isoformat()}


# @app.get("/")
# def root():
#     return {"status": "ok", "docs": "/docs", "sms_provider": PROVIDER}


# @app.put("/api/recipients")
# def put_recipients(people: list[Person], user: dict = Depends(current_user)):
#     db.recipients.delete_many({})
#     if people:
#         db.recipients.insert_many([p.model_dump() for p in people])
#     return {"saved": len(people)}


# @app.post("/api/readings")  # called by the dashboard / ESP board: protected by the device key if DEVICE_KEY is set
# def ingest(p: Reading, x_api_key: str | None = Header(None)):
#     if DEVICE_KEY and x_api_key != DEVICE_KEY:
#         raise HTTPException(401, "Invalid device key")

#     r = {
#         "ts": datetime.now(timezone.utc),
#         "hostel_id": p.hostel_id,
#         "tank_id": p.tank_id,
#         "device_id": p.device_id,
#         "distance_cm": p.distance_cm,
#         "level": level_pct(p.tank_height_cm, p.distance_cm, p.full_offset_cm),
#         "tds": p.tds_ppm,
#         "turb": p.turbidity_ntu,
#         "tds_adc": p.tds_adc,
#         "turbidity_adc": p.turbidity_adc,
#         "tds_voltage": p.tds_voltage,
#         "turbidity_voltage": p.turbidity_voltage,
#     }

#     r["valid"] = r["level"] is not None

#     db.readings.insert_one(dict(r))  # copy: insert_one adds _id to the dict it receives

#     return {**with_iso(r), "alerts_triggered": evaluate(r)}


# @app.get("/api/hostels/{hostel_id}/readings")
# def list_readings(hostel_id: str, limit: int = 5000, user: dict = Depends(current_user)):
#     rows = db.readings.find({"hostel_id": hostel_id}, {"_id": 0}).sort("ts", -1).limit(min(limit, 50000))
#     return [with_iso(x) for x in rows][::-1]  # oldest first


# @app.get("/api/alerts")
# def alerts(limit: int = 100, user: dict = Depends(current_user)):
#     return [with_iso(x) for x in db.alerts.find({}, {"_id": 0}).sort("ts", -1).limit(min(limit, 1000))]


# @app.post("/api/hostels/{hostel_id}/notify-students")
# def notify_students(hostel_id: str, user: dict = Depends(current_user)):
    
#     to = [p for p in load_people() if p["active"] and p["type"] == "student" and p["hostelId"] == hostel_id and {"lowLevel", "conservation"} & set(p["alerts"])]
#     if not to:
#         raise HTTPException(404, "No active students with low-water or conservation alerts enabled for this hostel.")
#     text = f"Water Conservation Notice: The water level in your hostel ({hostel_id}) tank is low, so please use water moderately and avoid wastage until the supply returns to normal."
#     # results = [send_sms(p["phone"], text) for p in to]
#     # sent = sum(ok for ok, _ in results)
#     results = []

#     for i, p in enumerate(to):
#       ok, detail = send_sms(p["phone"], text)
#       results.append((ok, detail))

#     print(
#         f"[STUDENT SMS] Recipient: {p['name']} | "
#         f"Success: {ok} | Provider response: {detail}"
#     )

#     if i < len(to) - 1:
#         time.sleep(10)

#     sent = sum(ok for ok, _ in results)
#     if sent:
#         LAST_STUDENT_SMS[hostel_id] = time.time()
#     for p, (ok, detail) in zip(to, results):
#       print(
#         f"[STUDENT SMS] Recipient: {p['name']} | "
#         f"Success: {ok} | Provider response: {detail}"
#     )

#     db.alerts.insert_one({
#         "ts": datetime.now(timezone.utc),
#         "hostel_id": hostel_id,
#         "kind": "student_notice",
#         "recipient": p["name"],
#         "ok": ok,
#         "detail": detail,
#         "sent_by": user["email"]
#     })

#     return {
#     "provider": PROVIDER,
#     "total": len(to),
#     "sent": sent,
#     "failed": len(to) - sent
# }

"""Smart Water Monitoring API. Data (users, readings, recipients, alerts) is stored in MongoDB.
SMS provider is chosen by env var SMS_PROVIDER: console (default, test only) | circuitdigest | fast2sms | twilio."""
import asyncio
import os
import threading
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone

import requests
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from db import db, init_indexes  # db.py loads backend/.env
from auth import current_user, router as auth_router


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# None = limit not set. TDS/turbidity values below are DEMO placeholders: confirm them for your sensors.
THRESHOLDS = {"level_low": 20, "level_high": 80, "tds_upper": 500, "tds_lower": None, "turb_upper": 5, "turb_lower": None}
PROVIDER = os.getenv("SMS_PROVIDER", "console")
DEVICE_KEY = os.getenv("DEVICE_KEY")  # if set, devices must send it in the X-API-Key header
LAST_STUDENT_SMS: dict[str, float] = {}
CATEGORY = {"high_level": "highLevel", "low_level": "lowLevel", "tds_high": "tds", "tds_low": "tds", "turb_high": "turb", "turb_low": "turb"}

HOSTEL_IDS = ["LH1", "LH2", "LH3", "LH4", "MH1", "MH2", "MH3", "MH4", "MH5", "MH6", "MH7"]
OFFLINE_MINUTES = 60  # no reading for this long -> "sensor offline" alert
OFFLINE_CHECK_SECONDS = 300  # how often the watchdog runs

# Circuit Digest allows only one SMS per ~7.5 seconds: space the calls out.
_cd_lock = threading.Lock()
_cd_last_call = 0.0
CD_MIN_GAP = 8.0


# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app):
    init_indexes()
    watchdog = asyncio.create_task(offline_loop())  # background sensor-offline check
    try:
        yield
    finally:
        watchdog.cancel()


app = FastAPI(title="Smart Water Monitoring API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["*"], allow_headers=["*"])
app.include_router(auth_router)


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_people() -> list[dict]:
    return list(db.recipients.find({}, {"_id": 0}))


def level_pct(h: float, d: float | None, off: float = 0):
    if d is None or d < 0 or d > h * 1.05:
        return None  # impossible reading: flag it, never treat as a real level
    return max(0.0, min(100.0, (h - d) / (h - off) * 100))


def send_sms(phone: str, text: str) -> tuple[bool, str]:
    """Send an SMS with the provider selected by SMS_PROVIDER."""
    global _cd_last_call
    digits = "".join(c for c in phone if c.isdigit())

    if PROVIDER == "circuitdigest":
        api_key = os.getenv("CIRCUIT_DIGEST_API_KEY")

        if not api_key:
            return False, "CIRCUIT_DIGEST_API_KEY is missing"

        if len(digits) == 10:
            digits = "91" + digits

        if len(digits) != 12 or not digits.startswith("91"):
            return False, "Invalid Indian mobile number"

        # Circuit Digest requires predefined templates.
        # Template 113: Maintenance Needed.
        template_id = "113"

        # Keep the template variables alphanumeric.
        var1 = "WaterMonitoringSystem"
        var2 = "CheckWaterQuality"

        if "Offline" in text:
            var2 = "SensorOffline"

        elif "Low Water Alert" in text:
            var2 = "LowWaterLevel"

        elif "Water Alert" in text:
            var2 = "HighWaterLevel"

        elif "TDS" in text:
            var2 = "CheckTDS"

        elif "Turbidity" in text:
            var2 = "CheckTurbidity"

        url = "https://www.circuitdigest.cloud/api/v1/send_sms"

        payload = {
            "mobiles": digits,
            "var1": var1,
            "var2": var2,
        }

        headers = {
            "Authorization": api_key,
            "Content-Type": "application/json",
        }

        try:
            with _cd_lock:  # one request at a time, spaced CD_MIN_GAP apart
                for _attempt in range(2):  # retry once if rate-limited
                    wait = CD_MIN_GAP - (time.time() - _cd_last_call)
                    if wait > 0:
                        time.sleep(wait)
                    response = requests.post(
                        url,
                        params={"ID": template_id},
                        headers=headers,
                        json=payload,
                        timeout=15,
                    )
                    _cd_last_call = time.time()
                    if response.status_code != 429:
                        break

            if not response.ok:
                return (
                    False,
                    f"Circuit Digest HTTP {response.status_code}: "
                    f"{response.text[:200]}",
                )

            try:
                body = response.json()
            except ValueError:
                return False, "Circuit Digest returned an invalid response"

            if body.get("status") == "error":
                return False, str(body)[:200]

            return True, str(body)[:200]

        except Exception as error:
            return False, f"{type(error).__name__}: {str(error)[:200]}"

    if PROVIDER == "console":
        print(f"[SMS TEST MODE -> {phone}] {text}")
        return True, "console"

    if PROVIDER == "twilio":
        try:
            sid = os.environ["TWILIO_SID"]
            token = os.environ["TWILIO_TOKEN"]

            to_number = "+" + (digits if len(digits) > 10 else "91" + digits)

            response = requests.post(
                f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json",
                data={
                    "To": to_number,
                    "From": os.environ["TWILIO_FROM"],
                    "Body": text,
                },
                auth=(sid, token),
                timeout=15,
            )

            return response.ok, response.text[:200]

        except Exception as error:
            return False, str(error)[:200]

    if PROVIDER == "fast2sms":
        try:
            response = requests.post(
                "https://www.fast2sms.com/dev/bulkV2",
                headers={"authorization": os.environ["FAST2SMS_KEY"]},
                data={
                    "route": os.getenv("FAST2SMS_ROUTE", "q"),
                    "message": text,
                    "numbers": digits[-10:],
                },
                timeout=15,
            )

            try:
                body = response.json()
            except ValueError:
                body = {}

            return (
                response.ok and body.get("return") is True,
                response.text[:200],
            )

        except Exception as error:
            return False, str(error)[:200]

    return False, f"Unsupported SMS provider: {PROVIDER}"


# ---------------------------------------------------------------------------
# Alert logic (level / TDS / turbidity)
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Sensor-offline watchdog
# ---------------------------------------------------------------------------

def check_offline():
    """SMS wardens (with the 'Sensor offline' alert ticked) when a hostel has sent no reading for OFFLINE_MINUTES."""
    now = datetime.now(timezone.utc)
    for h in HOSTEL_IDS:
        last = db.readings.find_one({"hostel_id": h}, {"ts": 1}, sort=[("ts", -1)])
        if not last:
            continue  # never reported: skip
        key = f"{h}|offline"
        stale = (now - last["ts"]).total_seconds() > OFFLINE_MINUTES * 60
        if not stale:
            if is_active(key):
                set_active(key, False)  # data is back: re-arm
            continue
        if is_active(key):
            continue  # already alerted for this outage
        set_active(key, True)
        text = (
            f"Sensor Offline Alert: No readings from {h} since "
            f"{last['ts'].astimezone().strftime('%d %b %H:%M')}. Please check the ESP32 and network."
        )
        to = [p for p in load_people() if p["active"] and p["type"] == "warden" and p["hostelId"] == h and "offline" in p["alerts"]]
        if not to:
            db.alerts.insert_one({"ts": now, "hostel_id": h, "kind": "offline", "recipient": None, "ok": False, "detail": "no recipients"})
        for p in to:
            ok, detail = send_sms(p["phone"], text)
            db.alerts.insert_one({"ts": now, "hostel_id": h, "kind": "offline", "recipient": p["name"], "ok": ok, "detail": detail})


async def offline_loop():
    while True:
        try:
            await asyncio.to_thread(check_offline)
        except Exception as error:  # never let the watchdog die
            print(f"[offline watchdog] {type(error).__name__}: {error}")
        await asyncio.sleep(OFFLINE_CHECK_SECONDS)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

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


@app.post("/api/readings")  # called by the dashboard / ESP board: protected by the device key if DEVICE_KEY is set
def ingest(p: Reading, x_api_key: str | None = Header(None)):
    if DEVICE_KEY and x_api_key != DEVICE_KEY:
        raise HTTPException(401, "Invalid device key")

    r = {
        "ts": datetime.now(timezone.utc),
        "hostel_id": p.hostel_id,
        "tank_id": p.tank_id,
        "device_id": p.device_id,
        "distance_cm": p.distance_cm,
        "level": level_pct(p.tank_height_cm, p.distance_cm, p.full_offset_cm),
        "tds": p.tds_ppm,
        "turb": p.turbidity_ntu,
        "tds_adc": p.tds_adc,
        "turbidity_adc": p.turbidity_adc,
        "tds_voltage": p.tds_voltage,
        "turbidity_voltage": p.turbidity_voltage,
    }

    r["valid"] = r["level"] is not None

    db.readings.insert_one(dict(r))  # copy: insert_one adds _id to the dict it receives

    return {**with_iso(r), "alerts_triggered": evaluate(r)}


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