#!/bin/bash

# Railway startup script with proper port handling
PORT=${PORT:-8080}
echo "=== R&D Agent Backend Startup ==="
echo "PORT: $PORT"
echo "Starting FastAPI application..."

# Start the application with logging
python -m uvicorn main:app --host 0.0.0.0 --port $PORT --log-level info
