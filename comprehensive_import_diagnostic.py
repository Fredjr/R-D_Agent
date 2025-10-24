#!/usr/bin/env python3
"""
Comprehensive Import Diagnostic Tool
Identifies why PhD analysis modules fail to import in Railway deployment
"""

import sys
import os
import importlib
import traceback
from pathlib import Path

def test_module_imports():
    """Test all PhD analysis module imports with detailed error reporting"""
    
    print("🔍 COMPREHENSIVE IMPORT DIAGNOSTIC")
    print("=" * 50)
    print(f"Python Version: {sys.version}")
    print(f"Python Path: {sys.path}")
    print(f"Current Working Directory: {os.getcwd()}")
    print(f"Environment: {'RAILWAY' if os.getenv('RAILWAY_ENVIRONMENT') else 'LOCAL'}")
    print()
    
    # List of all PhD analysis modules to test
    modules_to_test = [
        "scientific_model_analyst",
        "experimental_methods_analyst", 
        "results_interpretation_analyst",
        "phd_thesis_agents",
        "cutting_edge_model_manager",
        "langchain_openai",
        "langchain.chains",
        "langchain.prompts"
    ]
    
    results = {}
    
    for module_name in modules_to_test:
        print(f"🧪 Testing import: {module_name}")
        try:
            module = importlib.import_module(module_name)
            results[module_name] = {
                "status": "SUCCESS",
                "location": getattr(module, '__file__', 'Built-in'),
                "error": None
            }
            print(f"   ✅ SUCCESS: {getattr(module, '__file__', 'Built-in')}")
            
            # Test specific classes/functions if available
            if module_name == "scientific_model_analyst":
                try:
                    from scientific_model_analyst import analyze_scientific_model
                    print(f"   ✅ Function analyze_scientific_model: Available")
                except ImportError as e:
                    print(f"   ❌ Function analyze_scientific_model: {e}")
                    
            elif module_name == "phd_thesis_agents":
                try:
                    from phd_thesis_agents import PhDThesisOrchestrator
                    print(f"   ✅ Class PhDThesisOrchestrator: Available")
                except ImportError as e:
                    print(f"   ❌ Class PhDThesisOrchestrator: {e}")
                    
        except ImportError as e:
            results[module_name] = {
                "status": "FAILED",
                "location": None,
                "error": str(e)
            }
            print(f"   ❌ FAILED: {e}")
            print(f"   📍 Traceback:")
            traceback.print_exc()
            
        except Exception as e:
            results[module_name] = {
                "status": "ERROR",
                "location": None,
                "error": str(e)
            }
            print(f"   ⚠️ ERROR: {e}")
            
        print()
    
    return results

def check_file_existence():
    """Check if PhD analysis module files exist in the filesystem"""
    
    print("📁 FILE EXISTENCE CHECK")
    print("=" * 30)
    
    files_to_check = [
        "scientific_model_analyst.py",
        "experimental_methods_analyst.py",
        "results_interpretation_analyst.py", 
        "phd_thesis_agents.py",
        "cutting_edge_model_manager.py"
    ]
    
    current_dir = Path.cwd()
    
    for filename in files_to_check:
        file_path = current_dir / filename
        if file_path.exists():
            print(f"✅ {filename}: EXISTS ({file_path})")
            # Check file size
            size = file_path.stat().st_size
            print(f"   📊 Size: {size} bytes")
        else:
            print(f"❌ {filename}: NOT FOUND")
            # Search in subdirectories
            found_paths = list(current_dir.rglob(filename))
            if found_paths:
                print(f"   🔍 Found in: {found_paths}")
            else:
                print(f"   🔍 Not found anywhere in project")
        print()

def check_environment_variables():
    """Check critical environment variables"""
    
    print("🌍 ENVIRONMENT VARIABLES CHECK")
    print("=" * 35)
    
    env_vars_to_check = [
        "OPENAI_API_KEY",
        "GOOGLE_GENAI_API_KEY", 
        "RAILWAY_ENVIRONMENT",
        "PORT",
        "DATABASE_URL",
        "PYTHONPATH"
    ]
    
    for var_name in env_vars_to_check:
        value = os.getenv(var_name)
        if value:
            # Mask sensitive values
            if "API_KEY" in var_name or "DATABASE_URL" in var_name:
                masked_value = value[:10] + "..." + value[-5:] if len(value) > 15 else "***"
                print(f"✅ {var_name}: {masked_value}")
            else:
                print(f"✅ {var_name}: {value}")
        else:
            print(f"❌ {var_name}: NOT SET")
    print()

def check_dependencies():
    """Check if required dependencies are installed"""
    
    print("📦 DEPENDENCIES CHECK")
    print("=" * 25)
    
    dependencies = [
        "langchain",
        "langchain_openai",
        "openai",
        "google-generativeai",
        "fastapi",
        "sqlalchemy",
        "pydantic"
    ]
    
    for dep in dependencies:
        try:
            module = importlib.import_module(dep.replace("-", "_"))
            version = getattr(module, '__version__', 'Unknown')
            print(f"✅ {dep}: {version}")
        except ImportError:
            print(f"❌ {dep}: NOT INSTALLED")
    print()

def main():
    """Run comprehensive diagnostic"""
    
    print("🚀 STARTING COMPREHENSIVE IMPORT DIAGNOSTIC")
    print("=" * 60)
    print()
    
    # Run all diagnostic checks
    check_environment_variables()
    check_dependencies()
    check_file_existence()
    import_results = test_module_imports()
    
    # Summary
    print("📊 DIAGNOSTIC SUMMARY")
    print("=" * 25)
    
    successful_imports = sum(1 for result in import_results.values() if result["status"] == "SUCCESS")
    failed_imports = sum(1 for result in import_results.values() if result["status"] == "FAILED")
    
    print(f"✅ Successful imports: {successful_imports}")
    print(f"❌ Failed imports: {failed_imports}")
    print(f"📊 Success rate: {(successful_imports / len(import_results) * 100):.1f}%")
    
    if failed_imports > 0:
        print("\n🚨 CRITICAL ISSUES IDENTIFIED:")
        for module_name, result in import_results.items():
            if result["status"] == "FAILED":
                print(f"   ❌ {module_name}: {result['error']}")
    
    print("\n🎯 NEXT STEPS:")
    if failed_imports == 0:
        print("   ✅ All imports working - issue may be environment-specific")
    else:
        print("   🔧 Fix import failures identified above")
        print("   📦 Check missing dependencies")
        print("   📁 Verify file locations")
        print("   🌍 Check environment variables")

if __name__ == "__main__":
    main()
