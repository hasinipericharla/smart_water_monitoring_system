#!/bin/bash
# Backend Integration Startup Script
# This script helps you start the backend and verify everything is working

echo "=========================================="
echo "Smart Water Monitoring - Backend Startup"
echo "=========================================="

cd backend

# Check if virtual environment exists
if [ -d "venv" ]; then
    echo "✓ Virtual environment found"
    echo "  Activating virtual environment..."
    source venv/Scripts/activate 2>/dev/null || source venv/bin/activate 2>/dev/null
else
    echo "ℹ No virtual environment found"
    echo "  It's recommended to use a virtual environment"
    echo "  To create one: python -m venv venv"
fi

# Check if dependencies are installed
echo ""
echo "Checking dependencies..."
python -c "import fastapi, uvicorn, pymongo, bcrypt, jwt" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "✗ Some dependencies are missing"
    echo "  Installing dependencies..."
    pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "✗ Failed to install dependencies"
        exit 1
    fi
else
    echo "✓ All dependencies installed"
fi

# Check .env file
echo ""
if [ ! -f ".env" ]; then
    echo "✗ .env file not found"
    echo "  Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠ Please edit backend/.env and update MONGO_URL if needed"
    echo "  Press Enter to continue..."
    read
fi

# Run backend tests
echo ""
echo "Running backend tests..."
python test_backend.py
if [ $? -ne 0 ]; then
    echo ""
    echo "✗ Backend tests failed. Please fix the issues above."
    exit 1
fi

# Start the server
echo ""
echo "Starting backend server..."
echo "Backend will be available at: http://127.0.0.1:8001"
echo "API docs will be available at: http://127.0.0.1:8001/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

uvicorn main:app --reload --port 8001
