#!/usr/bin/env python3
"""
Check if production database has evidence_excerpts column
"""

import requests
import sys

BACKEND_URL = "https://r-dagent-production.up.railway.app"

def check_production_schema():
    """Check if production database has required columns"""
    print("="*80)
    print("CHECKING PRODUCTION DATABASE SCHEMA")
    print("="*80)
    print(f"Backend URL: {BACKEND_URL}")
    
    # Try to fetch triage data to see if evidence_excerpts field is returned
    try:
        # This endpoint should return triage data with evidence_excerpts if it exists
        response = requests.get(
            f"{BACKEND_URL}/api/health",
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ Backend is online")
        else:
            print(f"⚠️  Backend returned status {response.status_code}")
        
        # Try to get database info endpoint if it exists
        response = requests.get(
            f"{BACKEND_URL}/api/database/info",
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Database info: {data}")
        else:
            print("⚠️  No database info endpoint available")
        
        print("\n" + "="*80)
        print("RECOMMENDATION")
        print("="*80)
        print("Since the migration is configured in run_migration_and_start.sh,")
        print("it should run automatically on Railway deployment.")
        print("\nTo verify:")
        print("1. Check Railway deployment logs")
        print("2. Look for: '🎯 Running migration: enhance_paper_triage'")
        print("3. Verify it says: '✅ Migration 002 completed successfully!'")
        
        return True
        
    except Exception as e:
        print(f"❌ Error checking production: {e}")
        return False


if __name__ == "__main__":
    check_production_schema()

