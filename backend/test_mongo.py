from pymongo import MongoClient
import certifi, os

url = os.environ["MONGO_URL"]
c = MongoClient(url, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
print(c.admin.command("ping"))