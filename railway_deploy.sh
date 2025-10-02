#!/bin/bash

# Railway Deployment Script with PhD Model Initialization
# This script runs during Railway deployment to set up PhD models

echo "🚀 Starting Railway deployment with PhD model initialization..."

# Set environment variables for model caching
export TRANSFORMERS_CACHE="/app/models_cache"
export HF_HOME="/app/models_cache"
export TORCH_HOME="/app/models_cache"

# Create cache directory
mkdir -p /app/models_cache

echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

echo "🎓 Initializing PhD models..."
python initialize_phd_models.py

if [ $? -eq 0 ]; then
    echo "✅ PhD models initialized successfully!"
else
    echo "⚠️ PhD model initialization failed - continuing with graceful degradation"
fi

echo "🚀 Starting FastAPI server..."
exec uvicorn main:app --host 0.0.0.0 --port $PORT
