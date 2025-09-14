#!/bin/bash

# Railway startup script with explicit port 3000
export PORT=3000
echo "=== R&D Agent Backend Startup ==="
echo "PORT: $PORT (fixed for Railway health checks)"
echo "Starting FastAPI application on 0.0.0.0:$PORT..."

# Start the application with explicit port and logging
python -m uvicorn main:app --host 0.0.0.0 --port 3000 --log-level info
