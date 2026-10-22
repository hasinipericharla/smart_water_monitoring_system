"""
Test script to verify backend integration is working correctly.
Run this before starting the full application.
"""
import sys
from dotenv import load_dotenv
import os

print("=" * 60)
print("Backend Integration Test")
print("=" * 60)

# Test 1: Environment file
print("\n1. Testing .env configuration...")
load_dotenv()
required_vars = ["MONGO_URL", "MONGO_DB", "JWT_SECRET"]
for var in required_vars:
    value = os.getenv(var)
    if value:
        # Mask sensitive values
        display = value if var == "MONGO_DB" else (value[:10] + "..." if len(value) > 10 else "***")
        print(f"   ✓ {var} = {display}")
    else:
        print(f"   ✗ {var} is not set")
        sys.exit(1)

# Test 2: Python packages
print("\n2. Testing Python packages...")
packages = [
    ("fastapi", "FastAPI"),
    ("uvicorn", "Uvicorn"),
    ("pymongo", "PyMongo"),
    ("bcrypt", "bcrypt"),
    ("jwt", "PyJWT"),
    ("requests", "requests"),
    ("certifi", "certifi"),
]

for module_name, display_name in packages:
    try:
        __import__(module_name)
        print(f"   ✓ {display_name}")
    except ImportError:
        print(f"   ✗ {display_name} not installed")
        print(f"\n   Run: pip install -r requirements.txt")
        sys.exit(1)

# Test 3: MongoDB connection
print("\n3. Testing MongoDB connection...")
try:
    import pymongo
    import certifi

    mongo_url = os.getenv("MONGO_URL")
    client = pymongo.MongoClient(
        mongo_url,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=5000
    )

    # Try to ping
    result = client.admin.command("ping")
    print(f"   ✓ MongoDB connected: {result}")

    # Test database access
    db_name = os.getenv("MONGO_DB", "swm")
    db = client[db_name]
    collections = db.list_collection_names()
    print(f"   ✓ Database '{db_name}' accessible")
    if collections:
        print(f"   ✓ Collections found: {', '.join(collections)}")
    else:
        print(f"   ℹ No collections yet (will be created automatically)")

except Exception as e:
    print(f"   ✗ MongoDB connection failed: {type(e).__name__}: {e}")
    print("\n   Troubleshooting:")
    print("   - For local MongoDB: Ensure MongoDB service is running")
    print("   - For MongoDB Atlas:")
    print("     • Check connection string in .env")
    print("     • Verify IP address is whitelisted")
    print("     • Confirm database credentials are correct")
    sys.exit(1)

# Test 4: FastAPI imports
print("\n4. Testing FastAPI application...")
try:
    sys.path.insert(0, os.path.dirname(__file__))
    from main import app
    from auth import router
    print(f"   ✓ FastAPI app loaded successfully")
    print(f"   ✓ Authentication routes loaded")
except Exception as e:
    print(f"   ✗ Failed to load FastAPI app: {e}")
    sys.exit(1)

# Summary
print("\n" + "=" * 60)
print("✓ All tests passed! Backend is ready.")
print("=" * 60)
print("\nNext steps:")
print("1. Start backend:")
print("   cd backend")
print("   uvicorn main:app --reload --port 8001")
print("\n2. In another terminal, start frontend:")
print("   npm run dev")
print("\n3. Open http://localhost:5173")
print("=" * 60)
