#!/usr/bin/env python3
"""
Railway Diagnostic Script
Simple FastAPI app to diagnose Railway deployment issues
"""

from fastapi import FastAPI
import os
import sys
import importlib

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Railway Diagnostic App Running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "message": "Railway diagnostic working"}

@app.get("/environment")
async def environment():
    """Check Railway environment"""
    return {
        "python_version": sys.version,
        "current_directory": os.getcwd(),
        "is_railway": bool(os.getenv('RAILWAY_ENVIRONMENT')),
        "port": os.getenv('PORT'),
        "openai_key_set": bool(os.getenv('OPENAI_API_KEY')),
        "google_key_set": bool(os.getenv('GOOGLE_GENAI_API_KEY')),
        "database_url_set": bool(os.getenv('DATABASE_URL'))
    }

@app.get("/test-imports")
async def test_imports():
    """Test PhD analysis module imports"""
    results = {}
    
    modules_to_test = [
        "fastapi",
        "langchain",
        "langchain_openai",
        "scientific_model_analyst",
        "experimental_methods_analyst", 
        "results_interpretation_analyst",
        "phd_thesis_agents",
        "cutting_edge_model_manager"
    ]
    
    for module_name in modules_to_test:
        try:
            importlib.import_module(module_name)
            results[module_name] = "SUCCESS"
        except Exception as e:
            results[module_name] = f"FAILED: {str(e)}"
    
    return {
        "import_results": results,
        "timestamp": "2025-10-10"
    }

@app.get("/file-check")
async def file_check():
    """Check if PhD analysis files exist"""
    import os
    from pathlib import Path
    
    current_dir = Path.cwd()
    files_to_check = [
        "scientific_model_analyst.py",
        "experimental_methods_analyst.py",
        "results_interpretation_analyst.py", 
        "phd_thesis_agents.py",
        "cutting_edge_model_manager.py",
        "main.py"
    ]
    
    results = {}
    for filename in files_to_check:
        file_path = current_dir / filename
        results[filename] = {
            "exists": file_path.exists(),
            "size": file_path.stat().st_size if file_path.exists() else 0
        }
    
    return {
        "current_directory": str(current_dir),
        "files": results
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
