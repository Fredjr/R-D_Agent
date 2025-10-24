#!/usr/bin/env python3
"""
Simple script to run the backend diagnostic test
"""

import asyncio
import sys
import os

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

async def run_diagnostic():
    """Run the backend diagnostic test"""
    try:
        from backend_diagnostic_test import BackendDiagnosticTest
        
        print("🧪 Starting R&D Agent Backend Diagnostic Test")
        print("=" * 60)
        
        diagnostic = BackendDiagnosticTest()
        results = await diagnostic.run_comprehensive_diagnostic()
        
        print("\n" + "=" * 60)
        print("🎯 DIAGNOSTIC COMPLETED")
        print("=" * 60)
        
        return results
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Make sure you're running this from the correct directory with all dependencies installed.")
        return None
    except Exception as e:
        print(f"❌ Diagnostic failed: {e}")
        return None

if __name__ == "__main__":
    asyncio.run(run_diagnostic())
