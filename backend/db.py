# """MongoDB connection. Settings come from backend/.env (see .env.example)."""
# import os

# from dotenv import load_dotenv
# from pymongo import ASCENDING, MongoClient

# load_dotenv()
# MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
# client = MongoClient(MONGO_URL, tz_aware=True, serverSelectionTimeoutMS=5000)
# db = client[os.getenv("MONGO_DB", "swm")]


# def init_indexes():
#     try:
#         client.admin.command("ping")
#     except Exception as e:
#         raise SystemExit(f"\nMongoDB is not reachable at {MONGO_URL}\n({e})\nStart MongoDB (or fix MONGO_URL in .env) and run again.\n")
#     db.users.create_index("email", unique=True)
#     db.pending.create_index("expiresAt", expireAfterSeconds=0)  # unfinished signups delete themselves
#     db.readings.create_index([("hostel_id", ASCENDING), ("ts", ASCENDING)])
#     db.alerts.create_index("ts")

"""MongoDB connection. Settings come from backend/.env (see .env.example)."""
import os

import certifi
from dotenv import load_dotenv
from pymongo import ASCENDING, MongoClient

load_dotenv()
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = MongoClient(
    MONGO_URL,
    tz_aware=True,
    serverSelectionTimeoutMS=5000,
    tlsCAFile=certifi.where(),
)
db = client[os.getenv("MONGO_DB", "swm")]


def init_indexes():
    try:
        client.admin.command("ping")
    except Exception as e:
        # Don't print MONGO_URL: it contains the database password.
        raise SystemExit(f"\nMongoDB is not reachable.\n({type(e).__name__})\nCheck MONGO_URL in .env and your Atlas IP access list, then run again.\n")
    db.users.create_index("email", unique=True)
    db.pending.create_index("expiresAt", expireAfterSeconds=0)  # unfinished signups delete themselves
    db.readings.create_index([("hostel_id", ASCENDING), ("ts", ASCENDING)])
    db.alerts.create_index("ts")