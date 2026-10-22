# Backend Integration Setup Guide

This guide will help you set up the complete Smart Water Monitoring system with backend integration.

## Prerequisites

- **Node.js** 18+ (for frontend)
- **Python** 3.8+ (for backend)
- **MongoDB** (local installation or MongoDB Atlas account)

## Quick Start

### 1. Install MongoDB

#### Option A: Local MongoDB
Download and install from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)

#### Option B: MongoDB Atlas (Cloud - Free Tier Available)
1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Add your IP address to the IP Access List
4. Create a database user
5. Get your connection string

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Copy .env.example to .env and update values
cp .env.example .env
```

**Edit `backend/.env`:**
```env
# For local MongoDB:
MONGO_URL=mongodb://localhost:27017

# For MongoDB Atlas:
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority

MONGO_DB=swm
JWT_SECRET=change-this-to-a-random-secret-key
SMS_PROVIDER=console
```

**Start the backend:**
```bash
uvicorn main:app --reload --port 8001
```

Backend will run at: http://127.0.0.1:8001
API docs available at: http://127.0.0.1:8001/docs

### 3. Frontend Setup

```bash
# From project root directory
npm install

# Start development server
npm run dev
```

Frontend will run at: http://localhost:5173

### 4. First Time Usage

1. Open http://localhost:5173
2. Click "Sign Up" 
3. Enter your details (email OTP will show in backend console in test mode)
4. Enter the 6-digit OTP from console
5. Login and select a hostel
6. Dashboard will show live ESP32 readings (if connected) or mock data

## Configuration Files

### Backend Configuration (`backend/.env`)

```env
# Required
MONGO_URL=mongodb://localhost:27017  # or your Atlas connection string
MONGO_DB=swm
JWT_SECRET=your-secret-key-here

# Optional - Email (leave blank for console test mode)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Optional - SMS Provider
SMS_PROVIDER=console  # or 'twilio' or 'fast2sms'

# Optional - Device Security
DEVICE_KEY=your-device-api-key
```

### Frontend Configuration (`.env`)

```env
VITE_API_URL=http://127.0.0.1:8001
# VITE_DEVICE_KEY=your-device-key  # if using device authentication
```

### ESP32 Configuration (`src/esp32Service.js`)

Update the ESP32 URL to match your device:
```javascript
const ESP32_URL = 'http://YOUR_ESP32_IP_ADDRESS';
```

## Testing the Integration

### 1. Check Backend Status
Visit http://127.0.0.1:8001/ - should return:
```json
{
  "status": "ok",
  "docs": "/docs",
  "sms_provider": "console"
}
```

### 2. Check MongoDB Connection
Backend should start without errors. If MongoDB is not reachable, you'll see an error message.

### 3. Test Authentication
1. Sign up with any email
2. Check backend console for OTP code
3. Verify and login

### 4. Test Reading Storage
Once logged in:
1. Select a hostel
2. Readings from ESP32 are saved to MongoDB every 5 minutes
3. View stored readings in the graphs and calendar

## Troubleshooting

### Backend won't start
- **"MongoDB is not reachable"**: Check MONGO_URL in `backend/.env`
  - For local: Ensure MongoDB service is running
  - For Atlas: Check IP whitelist and credentials

- **Module not found**: Reinstall dependencies
  ```bash
  pip install -r requirements.txt
  ```

### Frontend can't connect to backend
- Ensure backend is running on port 8001
- Check `VITE_API_URL` in `.env` file
- Check browser console for CORS errors

### ESP32 connection issues
- Verify ESP32 IP address in `src/esp32Service.js`
- Ensure ESP32 and computer are on same network
- Check ESP32 is returning data at `/data` endpoint

### No readings being saved
- Check browser console for errors
- Verify user is authenticated (token in localStorage)
- Check backend logs for save errors
- Readings save every 5 minutes (configurable in Overview.jsx)

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   ESP32     │ ──────> │   Frontend   │ ──────> │   Backend    │
│   Sensors   │         │  (React)     │         │  (FastAPI)   │
└─────────────┘         └──────────────┘         └──────────────┘
                              │                          │
                              │                          │
                              └──────────────────────────┘
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │   MongoDB    │
                                  │   Database   │
                                  └──────────────┘
```

### Data Flow

1. **ESP32** → Frontend: Real-time sensor readings every 5 seconds
2. **Frontend** → Backend: Saves readings to database every 5 minutes
3. **Frontend** → Backend: User authentication, recipient management, alerts
4. **Backend** → MongoDB: Stores users, readings, alerts, recipients
5. **Backend** → SMS Provider: Sends alerts to wardens/students

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/verify-otp` - Verify email with OTP
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/resend-otp` - Resend OTP code

### Readings
- `POST /api/readings` - Save reading from ESP32 (requires DEVICE_KEY)
- `GET /api/hostels/{hostel_id}/readings` - Get stored readings

### Recipients & Alerts
- `PUT /api/recipients` - Update alert recipients
- `GET /api/alerts` - Get alert history
- `POST /api/hostels/{hostel_id}/notify-students` - Send student notifications

Full API documentation: http://127.0.0.1:8001/docs

## Production Deployment

### Security Checklist
- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Set up real SMTP for email OTP
- [ ] Configure SMS provider (Twilio/Fast2SMS)
- [ ] Set `DEVICE_KEY` for ESP32 authentication
- [ ] Use MongoDB Atlas with IP whitelist
- [ ] Enable HTTPS for frontend and backend
- [ ] Set proper CORS origins in `main.py`
- [ ] Review and adjust water quality thresholds in `config.js`

### Environment Variables
Never commit `.env` files to git. Use environment-specific configuration for development, staging, and production.

## Support

For issues or questions:
1. Check backend logs (console output)
2. Check browser console (F12)
3. Visit API docs at http://127.0.0.1:8001/docs
4. Review MongoDB collections using MongoDB Compass

## Next Steps

1. **Calibrate Sensors**: Update TDS/turbidity conversion formulas
2. **Configure Thresholds**: Set appropriate limits in `src/config.js`
3. **Test Alerts**: Configure recipients and test alert notifications
4. **Deploy**: Set up production environment with proper security
