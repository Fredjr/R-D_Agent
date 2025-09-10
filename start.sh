#!/bin/bash

# Railway startup script with proper port handling
PORT=${PORT:-8000}
echo "Starting R&D Agent Backend on port $PORT"

# Start the application
python -m uvicorn main:app --host 0.0.0.0 --port $PORT
