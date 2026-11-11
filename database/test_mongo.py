# # # from pymongo import MongoClient
# # # import certifi, os

# # # url = os.environ["MONGO_URL"]
# # # c = MongoClient(url, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
# # # print(c.admin.command("ping"))

# # from pathlib import Path
# # from dotenv import load_dotenv
# # from pymongo import MongoClient
# # import certifi, os

# # load_dotenv(Path(__file__).resolve().parent.parent / "backend" / ".env")
# # url = os.environ["MONGO_URL"]
# # c = MongoClient(url, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
# # print(c.admin.command("ping"))

# import os
# from pymongo import MongoClient
# from dotenv import load_dotenv

# load_dotenv()

# MONGO_URI = os.getenv("MONGO_URI")

# client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=10000)

# try:
#     client.admin.command("ping")
#     print("MongoDB connected successfully!")

#     db = client["WaterMonitoring"]
#     collection = db["readings"]

# except Exception as e:
#     print("MongoDB connection failed:", e)

from db import client, db

try:
    client.admin.command("ping")
    print("MongoDB connected successfully!")
    print("Database name:", db.name)

except Exception as e:
    print("MongoDB connection failed:", e)

finally:
    client.close()