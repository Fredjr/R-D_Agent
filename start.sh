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

# Run database migrations (Week 22)
echo "Running database migrations..."
if [ -f "backend/run_migration_011.py" ]; then
    python backend/run_migration_011.py || echo "⚠️ Migration 011 failed or already applied"
else
    echo "⚠️ Migration script not found, skipping"
fi

# Use Railway's PORT environment variable or default to 3000
PORT=${PORT:-3000}
echo "Using PORT: $PORT for Railway deployment"
echo "Starting FastAPI application on 0.0.0.0:$PORT..."

# Start the application with Railway's PORT variable
exec python -m uvicorn main:app --host 0.0.0.0 --port $PORT --log-level info
