#!/bin/bash

# Railway Startup Script - Download models at runtime to avoid slug size limits
echo "🚀 Starting Railway deployment with runtime model initialization..."

# Set environment variables for model caching
if [ -n "$RAILWAY_VOLUME_MOUNT_PATH" ]; then
    export TRANSFORMERS_CACHE="$RAILWAY_VOLUME_MOUNT_PATH/models_cache"
    export HF_HOME="$RAILWAY_VOLUME_MOUNT_PATH/models_cache"
    export TORCH_HOME="$RAILWAY_VOLUME_MOUNT_PATH/models_cache"
    echo "📁 Using Railway Volume for model cache: $RAILWAY_VOLUME_MOUNT_PATH/models_cache"
else
    export TRANSFORMERS_CACHE="/tmp/models_cache"
    export HF_HOME="/tmp/models_cache"
    export TORCH_HOME="/tmp/models_cache"
    echo "📁 Using temporary directory for model cache: /tmp/models_cache"
fi

# Create cache directory
mkdir -p "$TRANSFORMERS_CACHE"

echo "🎓 Checking if models need to be downloaded..."

# Check if models are already cached
if [ -d "$TRANSFORMERS_CACHE" ] && [ "$(ls -A $TRANSFORMERS_CACHE)" ]; then
    echo "✅ Models found in cache, skipping download"
else
    echo "📥 Models not found, downloading at runtime..."
    python -c "
import os
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from transformers import AutoModel, AutoTokenizer, pipeline
    from sentence_transformers import SentenceTransformer
    import torch
    
    cache_dir = os.environ.get('TRANSFORMERS_CACHE', '/tmp/models_cache')
    logger.info(f'Downloading models to: {cache_dir}')
    
    # Download lightweight models only
    logger.info('📄 Downloading Sentence Transformer...')
    SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2', cache_folder=cache_dir)
    
    logger.info('✅ Essential models downloaded successfully')
    
except Exception as e:
    logger.error(f'❌ Model download failed: {e}')
    logger.info('⚠️ Continuing with graceful degradation')
"
fi

echo "🚀 Starting FastAPI server..."
exec python -m uvicorn main:app --host 0.0.0.0 --port $PORT --log-level info
