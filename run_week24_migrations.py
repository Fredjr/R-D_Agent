"""
Run Week 24 Migrations Script

This script runs the Week 24 integration gaps migrations.
Can be called via API endpoint or directly in Railway environment.

Usage:
    python3 run_week24_migrations.py
"""

import os
import sys
import logging

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run_migrations():
    """Run all Week 24 migrations"""
    results = []
    
    try:
        # Migration 1: Collections-Hypotheses Integration
        logger.info("=" * 80)
        logger.info("Running Migration 1: Collections-Hypotheses Integration")
        logger.info("=" * 80)
        
        from migrations.add_collections_hypotheses_integration import upgrade as upgrade_collections
        upgrade_collections()
        results.append({"migration": "collections_hypotheses", "status": "success"})
        logger.info("✅ Migration 1 completed successfully")
        
    except Exception as e:
        logger.error(f"❌ Migration 1 failed: {e}")
        results.append({"migration": "collections_hypotheses", "status": "failed", "error": str(e)})
    
    try:
        # Migration 2: Notes-Evidence Integration
        logger.info("\n" + "=" * 80)
        logger.info("Running Migration 2: Notes-Evidence Integration")
        logger.info("=" * 80)
        
        from migrations.add_notes_evidence_integration import upgrade as upgrade_notes
        upgrade_notes()
        results.append({"migration": "notes_evidence", "status": "success"})
        logger.info("✅ Migration 2 completed successfully")
        
    except Exception as e:
        logger.error(f"❌ Migration 2 failed: {e}")
        results.append({"migration": "notes_evidence", "status": "failed", "error": str(e)})
    
    # Summary
    logger.info("\n" + "=" * 80)
    logger.info("MIGRATION SUMMARY")
    logger.info("=" * 80)
    
    success_count = sum(1 for r in results if r["status"] == "success")
    failed_count = sum(1 for r in results if r["status"] == "failed")
    
    for result in results:
        status_emoji = "✅" if result["status"] == "success" else "❌"
        logger.info(f"{status_emoji} {result['migration']}: {result['status']}")
        if result["status"] == "failed":
            logger.info(f"   Error: {result.get('error', 'Unknown error')}")
    
    logger.info(f"\nTotal: {success_count} succeeded, {failed_count} failed")
    logger.info("=" * 80)
    
    return results


if __name__ == "__main__":
    logger.info("🚀 Starting Week 24 Migrations...")
    logger.info(f"Database URL: {os.getenv('DATABASE_URL', 'Not set')[:50]}...")
    
    results = run_migrations()
    
    # Exit with error code if any migration failed
    failed_count = sum(1 for r in results if r["status"] == "failed")
    if failed_count > 0:
        logger.error(f"\n❌ {failed_count} migration(s) failed")
        sys.exit(1)
    else:
        logger.info("\n✅ All migrations completed successfully!")
        sys.exit(0)

