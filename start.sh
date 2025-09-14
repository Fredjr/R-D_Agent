#!/bin/bash

# Railway startup script with virtual environment and explicit port 3000
echo "=== R&D Agent Backend Startup ==="
echo "Activating virtual environment..."

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "✅ Virtual environment activated"
elif [ -d "/opt/venv" ]; then
    source /opt/venv/bin/activate
    echo "✅ Virtual environment activated"
else
    echo "⚠️ Virtual environment not found, using system Python"
fi

echo "Using fixed PORT: 3000 for Railway health checks"
echo "Starting FastAPI application on 0.0.0.0:3000..."

# Start the application with explicit port and logging
exec python -m uvicorn main:app --host 0.0.0.0 --port 3000 --log-level info
