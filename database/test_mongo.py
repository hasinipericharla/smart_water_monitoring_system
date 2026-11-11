# from pymongo import MongoClient
# import certifi, os

# url = os.environ["MONGO_URL"]
# c = MongoClient(url, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
# print(c.admin.command("ping"))

from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient
import certifi, os

load_dotenv(Path(__file__).resolve().parent.parent / "backend" / ".env")
url = os.environ["MONGO_URL"]
c = MongoClient(url, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
print(c.admin.command("ping"))