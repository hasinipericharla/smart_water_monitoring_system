# Complete Installation & Testing Guide
**Smart Water Monitoring System - Backend Integration**

This guide will walk you through installing everything from scratch and testing that it works.

---

## Part 1: Install Required Software

### 1.1 Install Python (if not already installed)

**Check if Python is installed:**
```bash
python --version
```

If you see `Python 3.8` or higher, you're good! If not:

**Windows:**
1. Download Python from https://www.python.org/downloads/
2. Run installer
3. ✅ **IMPORTANT**: Check "Add Python to PATH" during installation
4. Click "Install Now"

**Mac:**
```bash
brew install python3
```

**Linux:**
```bash
sudo apt update
sudo apt install python3 python3-pip
```

---

### 1.2 Install Node.js & npm (if not already installed)

**Check if Node.js is installed:**
```bash
node --version
npm --version
```

If both show versions, you're good! If not:

**Download & Install:**
- Go to https://nodejs.org/
- Download LTS version (recommended)
- Run installer
- Accept defaults

**Verify installation:**
```bash
node --version  # Should show v18 or higher
npm --version   # Should show version number
```

---

### 1.3 Install MongoDB

You have TWO options. **MongoDB Atlas (Option B) is easier and recommended.**

#### **Option A: Local MongoDB (Traditional)**

**Windows:**
1. Go to https://www.mongodb.com/try/download/community
2. Download MongoDB Community Server
3. Run installer, accept defaults
4. MongoDB will start automatically as a service

**Verify it's running:**
```bash
# Check if MongoDB service is running
net start | findstr MongoDB
```

**Mac:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### **Option B: MongoDB Atlas (Cloud - RECOMMENDED)**

This is easier and doesn't require installing anything!

1. **Create Account:**
   - Go to https://www.mongodb.com/cloud/atlas
   - Click "Try Free"
   - Sign up with Google/GitHub or email

2. **Create Cluster:**
   - Choose "M0 FREE" tier
   - Select a region close to you
   - Click "Create Cluster" (takes 3-5 minutes)

3. **Setup Access:**
   
   **A. Add Your IP Address:**
   - Click "Network Access" (left sidebar)
   - Click "Add IP Address"
   - Click "Add Current IP Address"
   - Click "Confirm"

   **B. Create Database User:**
   - Click "Database Access" (left sidebar)
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Username: `swm_user` (or anything you want)
   - Password: Click "Autogenerate Secure Password" and **COPY IT**
   - User Privileges: "Read and write to any database"
   - Click "Add User"

4. **Get Connection String:**
   - Click "Database" (left sidebar)
   - Click "Connect" button on your cluster
   - Click "Connect your application"
   - **Copy the connection string** (looks like: `mongodb+srv://swm_user:<password>@cluster0.xxxxx.mongodb.net/...`)
   - **Replace `<password>`** with the password you copied earlier

**Example connection string:**
```
mongodb+srv://swm_user:MySecurePassword123@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
```

---

## Part 2: Setup the Project

### 2.1 Clone/Navigate to Project

If you haven't cloned yet:
```bash
git clone https://github.com/hasinipericharla/smart_water_monitoring_system.git
cd smart_water_monitoring_system
```

**Switch to the fixes branch:**
```bash
git checkout backend-integration-fixes
```

---

### 2.2 Install Backend Dependencies

```bash
cd backend

# Install Python packages
pip install -r requirements.txt
```

**You should see:**
```
Successfully installed fastapi uvicorn pymongo bcrypt PyJWT python-dotenv certifi
```

---

### 2.3 Configure Backend Environment

**Check if .env exists:**
```bash
ls .env
```

**If it doesn't exist, copy from example:**
```bash
cp .env.example .env
```

**Edit the .env file:**

**Windows:**
```bash
notepad .env
```

**Mac/Linux:**
```bash
nano .env
```

**Configuration:**

**For Local MongoDB (Option A):**
```env
MONGO_URL=mongodb://localhost:27017
MONGO_DB=swm
JWT_SECRET=change-this-to-random-secret-key-abc123xyz
SMS_PROVIDER=console
```

**For MongoDB Atlas (Option B):**
```env
MONGO_URL=mongodb+srv://swm_user:YourPassword123@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
MONGO_DB=swm
JWT_SECRET=change-this-to-random-secret-key-abc123xyz
SMS_PROVIDER=console
```

**Save and close** (Ctrl+S, Ctrl+X for nano)

---

### 2.4 Install Frontend Dependencies

```bash
# Go back to project root
cd ..

# Install npm packages
npm install
```

This will take 1-2 minutes. You should see:
```
added XXX packages
```

---

## Part 3: Test Everything

### 3.1 Test Backend (Most Important!)

```bash
cd backend
python test_backend.py
```

**✅ EXPECTED OUTPUT (Success):**
```
============================================================
Backend Integration Test
============================================================

1. Testing .env configuration...
   ✓ MONGO_URL = mongodb://...
   ✓ MONGO_DB = swm
   ✓ JWT_SECRET = change-this...

2. Testing Python packages...
   ✓ FastAPI
   ✓ Uvicorn
   ✓ PyMongo
   ✓ bcrypt
   ✓ PyJWT
   ✓ requests
   ✓ certifi

3. Testing MongoDB connection...
   ✓ MongoDB connected: {'ok': 1.0}
   ✓ Database 'swm' accessible
   ℹ No collections yet (will be created automatically)

4. Testing FastAPI application...
   ✓ FastAPI app loaded successfully
   ✓ Authentication routes loaded

============================================================
✓ All tests passed! Backend is ready.
============================================================
```

**❌ IF YOU SEE ERRORS:**

**Error: "ModuleNotFoundError: No module named 'pymongo'"**
```bash
pip install -r requirements.txt
```

**Error: "MongoDB is not reachable"**

For **Local MongoDB**:
```bash
# Windows - Check if service is running
net start MongoDB

# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

For **MongoDB Atlas**:
- Check connection string in `.env`
- Make sure you replaced `<password>` with actual password
- Verify IP address is whitelisted in Atlas

**Error: "MONGO_URL is not set"**
- Make sure `.env` file exists in `backend/` directory
- Open `.env` and verify MONGO_URL is there

---

### 3.2 Start Backend Server

```bash
# Make sure you're in backend directory
cd backend

# Start the server
uvicorn main:app --reload --port 8001
```

**✅ EXPECTED OUTPUT:**
```
INFO:     Uvicorn running on http://127.0.0.1:8001 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Test it's working:**

Open your browser and go to:
- **http://127.0.0.1:8001/** 
  
  Should show:
  ```json
  {"status":"ok","docs":"/docs","sms_provider":"console"}
  ```

- **http://127.0.0.1:8001/docs**
  
  Should show interactive API documentation (Swagger UI)

**Keep this terminal open!** The backend needs to stay running.

---

### 3.3 Start Frontend (New Terminal)

**Open a NEW terminal window/tab**

```bash
# Navigate to project root
cd C:\Users\pujar\ECS_Project

# Or on Mac/Linux
cd ~/path/to/ECS_Project

# Start frontend
npm run dev
```

**✅ EXPECTED OUTPUT:**
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

**The frontend is now running at http://localhost:5173**

---

## Part 4: Test Complete Integration

Now both backend and frontend are running. Time to test the full flow!

### 4.1 Open the Application

1. Open browser: **http://localhost:5173**
2. You should see the Smart Water Monitoring login page

---

### 4.2 Create an Account

1. Click **"Sign Up"**
2. Fill in the form:
   - Name: `Test User`
   - Email: `test@example.com`
   - Phone: `9876543210`
   - Password: `testpass123`
3. Click **"Sign Up"**

---

### 4.3 Verify Email (Test Mode)

Since we're in test mode, OTP codes print to the **backend console**.

1. **Go to the backend terminal** (where uvicorn is running)
2. Look for output like:
   ```
   [EMAIL TEST MODE -> test@example.com]
   Your Smart Water Monitoring verification code
   Hello Test User,

   Your verification code is 123456.
   ...
   ```
3. **Copy the 6-digit code** (e.g., `123456`)
4. **Go back to browser**
5. Enter the OTP code
6. Click **"Verify"**

---

### 4.4 Login

After verification, you should be automatically logged in.

If not:
1. Click **"Login"**
2. Enter email: `test@example.com`
3. Enter password: `testpass123`
4. Click **"Login"**

---

### 4.5 Select a Hostel

1. You'll see a list of hostels
2. Click on any hostel (e.g., **"MH1"**)
3. Dashboard will load

---

### 4.6 Check Dashboard Status

**Look at the top of the dashboard:**

**Scenario A: ESP32 Connected** ✅
```
ESP32 status: Connected
```
- You'll see live water level updates
- Cards show current readings
- Graphs start populating

**Scenario B: ESP32 Disconnected** (Expected if you don't have hardware)
```
ESP32 status: Disconnected
```
- This is NORMAL if you don't have ESP32 connected
- Dashboard still works!
- No live data yet, but backend integration can still be tested

---

### 4.7 Test Backend Integration (Critical!)

Even without ESP32, you can test backend integration:

#### **Test 1: Check Browser Console**

1. Press **F12** to open Developer Tools
2. Click **"Console"** tab
3. You should see:
   ```
   Loaded 0 historical readings from backend
   ```
   *(0 is normal - database is empty initially)*

**If you see an ERROR:**
```
Failed to load historical data: Cannot reach the backend
```
- Make sure backend is running on port 8001
- Check `VITE_API_URL` in root `.env` file

---

#### **Test 2: Test API Directly**

Open a new browser tab and test these URLs:

**1. Root endpoint:**
```
http://127.0.0.1:8001/
```
Should return:
```json
{"status":"ok","docs":"/docs","sms_provider":"console"}
```

**2. API documentation:**
```
http://127.0.0.1:8001/docs
```
Should show Swagger UI with all API endpoints

**3. Test authenticated endpoint** (needs token, so might fail - that's OK)
```
http://127.0.0.1:8001/api/hostels/MH1/readings
```
Should return:
```json
{"detail":"Login required."}
```
*(This is correct - it means the endpoint exists!)*

---

#### **Test 3: Check MongoDB Data**

**For MongoDB Atlas:**
1. Go to https://cloud.mongodb.com
2. Login to your account
3. Click "Browse Collections" on your cluster
4. You should see database: `swm`
5. Collections should include:
   - `users` (with your test account)
   - `pending` (might be empty)
   - `readings` (empty initially)

**For Local MongoDB:**
```bash
# Open MongoDB shell
mongosh

# Switch to database
use swm

# Check collections
show collections

# Check users (should see your account)
db.users.find()

# Exit
exit
```

---

### 4.8 Test With Mock ESP32 Data (Optional)

If you want to test with sample data without ESP32:

**Option 1: Use Backend API Directly**

1. Go to http://127.0.0.1:8001/docs
2. Find **POST /api/readings**
3. Click "Try it out"
4. Paste this sample data:
```json
{
  "device_id": "ESP32_TEST",
  "hostel_id": "MH1",
  "tank_id": "T1",
  "distance_cm": 50,
  "tank_height_cm": 200,
  "full_offset_cm": 0,
  "tds_ppm": 250,
  "turbidity_ntu": 2.5,
  "tds_adc": 1500,
  "turbidity_adc": 3200,
  "tds_voltage": 2.1,
  "turbidity_voltage": 2.8
}
```
5. Click "Execute"
6. Should return success with reading data

**Option 2: Create Test Script**

Create `backend/test_add_reading.py`:
```python
import requests

url = "http://127.0.0.1:8001/api/readings"
data = {
    "device_id": "ESP32_TEST",
    "hostel_id": "MH1",
    "tank_id": "T1",
    "distance_cm": 50,
    "tank_height_cm": 200,
    "full_offset_cm": 0,
    "tds_adc": 1500,
    "turbidity_adc": 3200,
    "tds_voltage": 2.1,
    "turbidity_voltage": 2.8
}

response = requests.post(url, json=data)
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")
```

Run it:
```bash
cd backend
python test_add_reading.py
```

---

## Part 5: Verify Everything Works

### ✅ Checklist

Run through this checklist:

- [ ] Backend test script passes: `python backend/test_backend.py`
- [ ] Backend starts without errors: `uvicorn main:app --reload --port 8001`
- [ ] Backend root URL works: http://127.0.0.1:8001/
- [ ] Backend docs load: http://127.0.0.1:8001/docs
- [ ] Frontend starts: `npm run dev`
- [ ] Frontend loads: http://localhost:5173
- [ ] Can sign up with new account
- [ ] Receive OTP in backend console
- [ ] Can verify OTP and login
- [ ] Can select a hostel
- [ ] Dashboard loads without errors
- [ ] Browser console shows "Loaded X historical readings"
- [ ] MongoDB contains user data

---

## Part 6: Troubleshooting Common Issues

### Issue 1: "pip: command not found"

**Windows:**
```bash
python -m pip install -r requirements.txt
```

**Mac/Linux:**
```bash
pip3 install -r requirements.txt
```

---

### Issue 2: "uvicorn: command not found"

```bash
python -m uvicorn main:app --reload --port 8001
```

---

### Issue 3: Port 8001 already in use

**Windows:**
```bash
netstat -ano | findstr :8001
taskkill /PID <PID_NUMBER> /F
```

**Mac/Linux:**
```bash
lsof -ti:8001 | xargs kill -9
```

Or use a different port:
```bash
uvicorn main:app --reload --port 8002
```
*(Don't forget to update frontend `.env`: `VITE_API_URL=http://127.0.0.1:8002`)*

---

### Issue 4: Port 5173 already in use

```bash
# Kill the process
# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID_NUMBER> /F

# Mac/Linux:
lsof -ti:5173 | xargs kill -9

# Then restart
npm run dev
```

---

### Issue 5: MongoDB connection fails

**For Local MongoDB:**
```bash
# Windows
net start MongoDB

# Mac
brew services restart mongodb-community

# Linux
sudo systemctl restart mongod
sudo systemctl status mongod
```

**For MongoDB Atlas:**
1. Check connection string format
2. Verify password doesn't have special characters (if it does, URL-encode them)
3. Check IP whitelist includes your current IP
4. Try pinging: `mongosh "your-connection-string"`

---

### Issue 6: "Cannot reach the backend"

1. **Check backend is running:**
   ```bash
   curl http://127.0.0.1:8001/
   ```
   
2. **Check firewall:**
   - Windows: Allow Python through Windows Firewall
   - Mac: System Preferences → Security & Privacy → Firewall

3. **Check CORS:**
   - Backend should allow `http://localhost:5173`
   - Check `main.py` line 23

---

### Issue 7: OTP not showing in console

1. Check backend terminal (not frontend!)
2. Should see `[EMAIL TEST MODE -> ...]`
3. If not, check:
   - Backend started correctly
   - No SMTP settings in `.env` (should be commented out for test mode)

---

## Part 7: What Success Looks Like

### Backend Console (uvicorn terminal):
```
INFO:     Uvicorn running on http://127.0.0.1:8001
INFO:     Application startup complete.
INFO:     127.0.0.1:XXXXX - "GET / HTTP/1.1" 200 OK
INFO:     127.0.0.1:XXXXX - "POST /api/auth/signup HTTP/1.1" 200 OK

[EMAIL TEST MODE -> test@example.com]
Your Smart Water Monitoring verification code
...
Your verification code is 123456.
...

INFO:     127.0.0.1:XXXXX - "POST /api/auth/verify-otp HTTP/1.1" 200 OK
INFO:     127.0.0.1:XXXXX - "POST /api/auth/login HTTP/1.1" 200 OK
INFO:     127.0.0.1:XXXXX - "GET /api/hostels/MH1/readings HTTP/1.1" 200 OK
```

### Browser Console (F12):
```
Loaded 0 historical readings from backend
ESP32 connection error: Error: ESP32 returned HTTP 404  // Normal if no ESP32
```

### MongoDB (Atlas or local):
```javascript
// Database: swm
// Collection: users
{
  "_id": ObjectId("..."),
  "email": "test@example.com",
  "name": "Test User",
  "phone": "9876543210",
  "role": "warden",
  "active": true,
  "createdAt": ISODate("2026-10-22T...")
}
```

---

## Quick Reference Commands

### Start Everything (2 Terminals)

**Terminal 1 - Backend:**
```bash
cd backend
python test_backend.py    # Test first
uvicorn main:app --reload --port 8001
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### Stop Everything
- Press **Ctrl+C** in both terminals

### Check Status
```bash
# Backend
curl http://127.0.0.1:8001/

# Frontend
curl http://localhost:5173/
```

---

## Summary

1. ✅ Install Python, Node.js, MongoDB
2. ✅ Install project dependencies (pip & npm)
3. ✅ Configure `.env` with MongoDB connection
4. ✅ Test backend: `python test_backend.py`
5. ✅ Start backend: `uvicorn main:app --reload --port 8001`
6. ✅ Start frontend: `npm run dev`
7. ✅ Test signup → OTP → login → dashboard

**Need help?** Check:
- Backend console for errors
- Browser console (F12) for errors
- MongoDB Atlas dashboard for data
- Run `python backend/test_backend.py` to diagnose

---

**You're all set!** 🎉
