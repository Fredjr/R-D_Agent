#!/usr/bin/env python3
"""
Phase 2A.1: NLP Infrastructure Setup Script
Installs and configures BERT/SciBERT models and NLP dependencies
"""

import subprocess
import sys
import os
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_command(command: str, description: str) -> bool:
    """Run a shell command and return success status"""
    logger.info(f"🔧 {description}")
    logger.info(f"Running: {command}")
    
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        logger.info(f"✅ {description} - Success")
        if result.stdout:
            logger.info(f"Output: {result.stdout.strip()}")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ {description} - Failed")
        logger.error(f"Error: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    logger.info(f"🐍 Python version: {version.major}.{version.minor}.{version.micro}")
    
    if version.major != 3 or version.minor < 8:
        logger.error("❌ Python 3.8+ required for NLP dependencies")
        return False
    
    logger.info("✅ Python version compatible")
    return True

def install_base_nlp_dependencies():
    """Install base NLP dependencies"""
    logger.info("📦 Installing base NLP dependencies...")
    
    # Install PyTorch (CPU version for compatibility)
    commands = [
        ("pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu", 
         "Installing PyTorch (CPU version)"),
        ("pip install transformers>=4.35.0", "Installing Transformers"),
        ("pip install sentence-transformers>=2.2.2", "Installing Sentence Transformers"),
        ("pip install nltk>=3.8.1", "Installing NLTK"),
        ("pip install spacy>=3.7.0", "Installing spaCy"),
    ]
    
    success_count = 0
    for command, description in commands:
        if run_command(command, description):
            success_count += 1
    
    return success_count == len(commands)

def download_spacy_model():
    """Download spaCy English model"""
    logger.info("📥 Downloading spaCy English model...")
    return run_command("python -m spacy download en_core_web_sm", "Downloading spaCy en_core_web_sm model")

def download_nltk_data():
    """Download required NLTK data"""
    logger.info("📥 Downloading NLTK data...")
    
    nltk_script = """
import nltk
import ssl

try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

nltk.download('punkt', quiet=True)
nltk.download('stopwords', quiet=True)
nltk.download('wordnet', quiet=True)
nltk.download('averaged_perceptron_tagger', quiet=True)
print("NLTK data downloaded successfully")
"""
    
    try:
        exec(nltk_script)
        logger.info("✅ NLTK data downloaded successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to download NLTK data: {e}")
        return False

def test_nlp_imports():
    """Test if all NLP libraries can be imported"""
    logger.info("🧪 Testing NLP library imports...")
    
    test_script = """
try:
    import torch
    print(f"✅ PyTorch {torch.__version__}")
    
    from transformers import AutoTokenizer, AutoModel
    print("✅ Transformers imported")
    
    from sentence_transformers import SentenceTransformer
    print("✅ Sentence Transformers imported")
    
    import nltk
    print(f"✅ NLTK {nltk.__version__}")
    
    import spacy
    print(f"✅ spaCy {spacy.__version__}")
    
    # Test spaCy model
    try:
        nlp = spacy.load("en_core_web_sm")
        print("✅ spaCy English model loaded")
    except OSError:
        print("⚠️  spaCy English model not found")
    
    print("🎉 All NLP libraries imported successfully!")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    exit(1)
"""
    
    try:
        exec(test_script)
        return True
    except Exception as e:
        logger.error(f"❌ NLP import test failed: {e}")
        return False

def create_model_cache_directory():
    """Create directory for caching models"""
    cache_dir = Path("models/cache")
    cache_dir.mkdir(parents=True, exist_ok=True)
    logger.info(f"📁 Created model cache directory: {cache_dir}")
    return True

def test_semantic_analysis_service():
    """Test the semantic analysis service"""
    logger.info("🧪 Testing semantic analysis service...")
    
    test_script = """
import asyncio
import sys
sys.path.append('.')

from services.semantic_analysis_service import semantic_analysis_service

async def test_service():
    # Initialize service
    success = await semantic_analysis_service.initialize()
    if not success:
        print("❌ Failed to initialize semantic analysis service")
        return False
    
    # Test paper analysis
    title = "Machine Learning Approaches to Drug Discovery"
    abstract = "This paper presents novel machine learning methods for drug discovery, using deep neural networks to predict molecular properties and identify potential therapeutic compounds."
    
    features = await semantic_analysis_service.analyze_paper(title, abstract)
    
    print(f"✅ Methodology detected: {features.methodology}")
    print(f"✅ Complexity score: {features.complexity_score:.2f}")
    print(f"✅ Novelty type: {features.novelty_type}")
    print(f"✅ Research domains: {features.research_domains}")
    print(f"✅ Embeddings shape: {features.embeddings.shape}")
    
    print("🎉 Semantic analysis service test passed!")
    return True

# Run the test
result = asyncio.run(test_service())
if not result:
    exit(1)
"""
    
    try:
        exec(test_script)
        return True
    except Exception as e:
        logger.error(f"❌ Semantic analysis service test failed: {e}")
        return False

def main():
    """Main setup function"""
    logger.info("🚀 Starting Phase 2A.1: NLP Infrastructure Setup")
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Create model cache directory
    create_model_cache_directory()
    
    # Install base NLP dependencies
    if not install_base_nlp_dependencies():
        logger.error("❌ Failed to install base NLP dependencies")
        sys.exit(1)
    
    # Download spaCy model
    download_spacy_model()  # Non-critical if it fails
    
    # Download NLTK data
    download_nltk_data()  # Non-critical if it fails
    
    # Test imports
    if not test_nlp_imports():
        logger.error("❌ NLP import test failed")
        sys.exit(1)
    
    # Test semantic analysis service
    if not test_semantic_analysis_service():
        logger.error("❌ Semantic analysis service test failed")
        sys.exit(1)
    
    logger.info("🎉 Phase 2A.1: NLP Infrastructure Setup Complete!")
    logger.info("✅ All NLP dependencies installed and tested successfully")
    logger.info("✅ Semantic analysis service is ready for use")

if __name__ == "__main__":
    main()
