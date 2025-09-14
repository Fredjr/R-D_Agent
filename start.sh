#!/bin/bash

# Railway startup script - simplified and robust
echo "=== R&D Agent Backend Startup ==="
echo "Environment check:"
echo "PORT=${PORT:-'not set'}"
echo "RAILWAY_ENVIRONMENT=${RAILWAY_ENVIRONMENT:-'not set'}"

# Set port with fallback
PORT=${PORT:-8080}
echo "Using PORT: $PORT"

# Validate port is numeric
if ! [[ "$PORT" =~ ^[0-9]+$ ]]; then
    echo "ERROR: PORT '$PORT' is not numeric, using 8080"
    PORT=8080
fi

echo "Starting FastAPI server on 0.0.0.0:$PORT"

# Use exec to replace shell process and handle signals properly
exec python -m uvicorn main:app \
    --host 0.0.0.0 \
    --port "$PORT" \
    --log-level info \
    --access-log
