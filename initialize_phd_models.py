#!/usr/bin/env python3
"""
PhD Model Initialization Script for Railway Deployment

This script downloads and caches HuggingFace models required for PhD analysis.
Run this during Railway deployment to ensure models are available.
"""

import os
import sys
import logging
from pathlib import Path

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def download_models():
    """Download and cache all required HuggingFace models"""
    
    logger.info("🚀 Starting PhD model initialization...")
    
    try:
        # Import required libraries
        logger.info("📦 Importing HuggingFace libraries...")
        from transformers import AutoModel, AutoTokenizer, pipeline
        from sentence_transformers import SentenceTransformer
        import torch
        
        logger.info(f"✅ PyTorch version: {torch.__version__}")
        logger.info(f"✅ CUDA available: {torch.cuda.is_available()}")
        
        # Set cache directory
        cache_dir = os.environ.get('TRANSFORMERS_CACHE', './models_cache')
        os.makedirs(cache_dir, exist_ok=True)
        logger.info(f"📁 Using cache directory: {cache_dir}")
        
        # Model 1: SPECTER for paper embeddings
        logger.info("📄 Downloading SPECTER model for paper embeddings...")
        try:
            specter_model = AutoModel.from_pretrained(
                'allenai/specter',
                cache_dir=cache_dir,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
            )
            specter_tokenizer = AutoTokenizer.from_pretrained(
                'allenai/specter',
                cache_dir=cache_dir
            )
            logger.info("✅ SPECTER model downloaded successfully")
        except Exception as e:
            logger.error(f"❌ Failed to download SPECTER: {e}")
            # Continue with other models
        
        # Model 2: SciBERT for scientific text classification
        logger.info("🧬 Downloading SciBERT model for scientific text...")
        try:
            scibert_model = AutoModel.from_pretrained(
                'allenai/scibert_scivocab_uncased',
                cache_dir=cache_dir,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
            )
            scibert_tokenizer = AutoTokenizer.from_pretrained(
                'allenai/scibert_scivocab_uncased',
                cache_dir=cache_dir
            )
            logger.info("✅ SciBERT model downloaded successfully")
        except Exception as e:
            logger.error(f"❌ Failed to download SciBERT: {e}")
        
        # Model 3: Sentence Transformers for semantic similarity
        logger.info("🔗 Downloading Sentence Transformer for semantic analysis...")
        try:
            sentence_model = SentenceTransformer(
                'sentence-transformers/all-MiniLM-L6-v2',
                cache_folder=cache_dir
            )
            logger.info("✅ Sentence Transformer downloaded successfully")
        except Exception as e:
            logger.error(f"❌ Failed to download Sentence Transformer: {e}")
        
        # Model 4: BART for summarization
        logger.info("📝 Downloading BART model for summarization...")
        try:
            bart_pipeline = pipeline(
                "summarization",
                model="facebook/bart-large-cnn",
                cache_dir=cache_dir,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
            )
            logger.info("✅ BART model downloaded successfully")
        except Exception as e:
            logger.error(f"❌ Failed to download BART: {e}")
        
        # Model 5: Lightweight classification model
        logger.info("🏷️ Downloading classification model...")
        try:
            classifier = pipeline(
                "text-classification",
                model="microsoft/DialoGPT-medium",
                cache_dir=cache_dir,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
            )
            logger.info("✅ Classification model downloaded successfully")
        except Exception as e:
            logger.error(f"❌ Failed to download classification model: {e}")
        
        logger.info("🎉 PhD model initialization completed!")
        
        # Test model loading
        logger.info("🧪 Testing model loading...")
        test_text = "This is a test paper about machine learning applications in healthcare."
        
        try:
            # Test sentence transformer
            embeddings = sentence_model.encode([test_text])
            logger.info(f"✅ Sentence embedding test successful: shape {embeddings.shape}")
        except Exception as e:
            logger.error(f"❌ Sentence embedding test failed: {e}")
        
        try:
            # Test BART summarization
            summary = bart_pipeline(test_text, max_length=50, min_length=10)
            logger.info(f"✅ Summarization test successful: {summary}")
        except Exception as e:
            logger.error(f"❌ Summarization test failed: {e}")
        
        return True
        
    except ImportError as e:
        logger.error(f"❌ Failed to import required libraries: {e}")
        logger.error("💡 Make sure transformers, torch, and sentence-transformers are installed")
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error during model initialization: {e}")
        return False

def check_disk_space():
    """Check available disk space"""
    try:
        import shutil
        total, used, free = shutil.disk_usage('/')
        free_gb = free // (1024**3)
        logger.info(f"💾 Available disk space: {free_gb} GB")
        
        if free_gb < 5:
            logger.warning("⚠️ Low disk space! Models may fail to download.")
            return False
        return True
    except Exception as e:
        logger.error(f"❌ Failed to check disk space: {e}")
        return True  # Continue anyway

def main():
    """Main initialization function"""
    logger.info("🎓 PhD Enhancement Model Initialization Starting...")
    
    # Check system requirements
    logger.info(f"🐍 Python version: {sys.version}")
    logger.info(f"💻 Platform: {sys.platform}")
    
    # Check disk space
    if not check_disk_space():
        logger.warning("⚠️ Continuing despite low disk space...")
    
    # Download models
    success = download_models()
    
    if success:
        logger.info("🎉 PhD model initialization completed successfully!")
        logger.info("🎓 PhD analysis features are now ready for use!")
        return 0
    else:
        logger.error("❌ PhD model initialization failed!")
        logger.error("🔧 PhD features will use graceful degradation (503 responses)")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
