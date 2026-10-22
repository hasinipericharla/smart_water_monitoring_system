from pymongo import MongoClient
from dotenv import load_dotenv
import certifi, os

load_dotenv()  # Load .env file
url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
print(f"Testing connection to: {url.split('@')[-1] if '@' in url else url}")

try:
    c = MongoClient(url, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
    result = c.admin.command("ping")
    print(f"✓ MongoDB connection successful: {result}")
    print(f"✓ Database: {os.getenv('MONGO_DB', 'swm')}")
except Exception as e:
    print(f"✗ MongoDB connection failed: {type(e).__name__}: {e}")
    print("\nTroubleshooting:")
    print("1. For local MongoDB: Ensure MongoDB service is running")
    print("2. For MongoDB Atlas: Check connection string, IP whitelist, and credentials")
    print("3. Verify MONGO_URL in backend/.env file")