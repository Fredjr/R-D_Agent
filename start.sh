#!/bin/bash

# Railway startup script with robust port handling
echo "Environment variables:"
echo "PORT=$PORT"
echo "All env vars:"
env | grep -E "(PORT|RAILWAY)" || echo "No PORT/RAILWAY vars found"

# Set default port if not provided
if [ -z "$PORT" ]; then
    echo "PORT not set, using default 8080"
    export PORT=8080
else
    echo "Using PORT=$PORT"
fi

# Validate port is numeric
if ! [[ "$PORT" =~ ^[0-9]+$ ]]; then
    echo "ERROR: PORT '$PORT' is not a valid integer, using 8080"
    export PORT=8080
fi

echo "Starting R&D Agent Backend on port $PORT"

# Start the application with explicit port
exec python -m uvicorn main:app --host 0.0.0.0 --port "$PORT"
