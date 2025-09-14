#!/bin/bash

# Railway startup script with explicit port 3000
echo "=== R&D Agent Backend Startup ==="
echo "Using fixed PORT: 3000 for Railway health checks"
echo "Starting FastAPI application on 0.0.0.0:3000..."

# Start the application with explicit port and logging
exec python -m uvicorn main:app --host 0.0.0.0 --port 3000 --log-level info
