"""
Admin endpoints for database migrations and maintenance
"""

from fastapi import APIRouter, Depends, HTTPException, Header, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
from database import get_db, Protocol, Article
import logging
import os
from typing import Dict, List
from backend.app.services.intelligent_protocol_extractor import IntelligentProtocolExtractor

router = APIRouter(prefix="/admin", tags=["admin"])
logger = logging.getLogger(__name__)


@router.post("/migrate/003-enhance-protocols")
async def run_migration_003(
    admin_key: str = Header(..., alias="X-Admin-Key"),
    db: Session = Depends(get_db)
):
    """
    Run migration 003: Enhance Protocols with Context-Aware Fields
    
    Requires X-Admin-Key header for security.
    """
    # Simple security check - you should set this in Railway environment
    import os
    expected_key = os.getenv("ADMIN_KEY", "your-secret-admin-key-change-this")
    
    if admin_key != expected_key:
        raise HTTPException(status_code=403, detail="Invalid admin key")
    
    try:
        logger.info("🔄 Starting migration 003...")
        
        # Check if columns already exist
        inspector = inspect(db.bind)
        existing_columns = {col['name'] for col in inspector.get_columns('protocols')}
        
        if 'key_parameters' in existing_columns:
            return {
                "status": "already_applied",
                "message": "Migration 003 has already been applied",
                "columns_exist": True
            }
        
        # Read migration SQL
        with open('backend/migrations/003_enhance_protocols.sql', 'r') as f:
            migration_sql = f.read()
        
        # Execute migration
        logger.info("🔄 Executing migration SQL...")
        db.execute(text(migration_sql))
        db.commit()
        
        logger.info("✅ Migration completed successfully")
        
        # Verify new columns exist
        inspector = inspect(db.bind)
        new_columns = {col['name'] for col in inspector.get_columns('protocols')}
        
        added_columns = [
            'relevance_score', 'affected_questions', 'affected_hypotheses',
            'relevance_reasoning', 'key_insights', 'potential_applications',
            'recommendations', 'key_parameters', 'expected_outcomes',
            'troubleshooting_tips', 'context_relevance', 'extraction_method',
            'context_aware'
        ]
        
        verified = [col for col in added_columns if col in new_columns]
        
        return {
            "status": "success",
            "message": "Migration 003 completed successfully",
            "columns_added": len(verified),
            "verified_columns": verified
        }
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Migration failed: {str(e)}")


@router.post("/migrate/004-add-protocol-confidence-and-sources")
async def run_migration_004(
    admin_key: str = Header(..., alias="X-Admin-Key"),
    db: Session = Depends(get_db)
):
    """
    Run migration 004: Add confidence scoring and source citations

    Requires X-Admin-Key header for security.
    """
    # Simple security check
    import os
    expected_key = os.getenv("ADMIN_KEY", "your-secret-admin-key-change-this")

    if admin_key != expected_key:
        raise HTTPException(status_code=403, detail="Invalid admin key")

    try:
        logger.info("🔄 Starting migration 004...")

        # Check if columns already exist
        inspector = inspect(db.bind)
        existing_columns = {col['name'] for col in inspector.get_columns('protocols')}

        if 'extraction_confidence' in existing_columns:
            return {
                "status": "already_applied",
                "message": "Migration 004 has already been applied",
                "columns_exist": True
            }

        # Read migration SQL
        with open('backend/migrations/004_add_protocol_confidence_and_sources.sql', 'r') as f:
            migration_sql = f.read()

        # Execute migration
        logger.info("🔄 Executing migration SQL...")
        db.execute(text(migration_sql))
        db.commit()

        logger.info("✅ Migration 004 completed successfully")

        # Verify new columns exist
        inspector = inspect(db.bind)
        new_columns = {col['name'] for col in inspector.get_columns('protocols')}

        added_columns = [
            'extraction_confidence', 'confidence_explanation',
            'material_sources', 'step_sources'
        ]

        verified = [col for col in added_columns if col in new_columns]

        return {
            "status": "success",
            "message": "Migration 004 completed successfully",
            "columns_added": len(verified),
            "verified_columns": verified
        }

    except Exception as e:
        logger.error(f"❌ Migration 004 failed: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/migrate/005-add-experiment-plans")
async def run_migration_005(
    admin_key: str = Header(..., alias="X-Admin-Key"),
    db: Session = Depends(get_db)
):
    """
    Apply migration 005: Add experiment_plans table.
    Week 19-20: Experiment Planning Feature
    """
    # Verify admin key
    expected_key = os.getenv("ADMIN_KEY", "super-secret-admin-key-change-this")
    if admin_key != expected_key:
        raise HTTPException(status_code=403, detail="Invalid admin key")

    logger.info("🔧 Starting migration 005: Add experiment_plans table")

    try:
        # Read migration file
        migration_path = "backend/migrations/005_add_experiment_plans.sql"
        with open(migration_path, 'r') as f:
            migration_sql = f.read()

        logger.info(f"📄 Read migration file: {migration_path}")

        # Execute migration
        db.execute(text(migration_sql))
        db.commit()

        logger.info("✅ Migration 005 applied successfully")

        return {
            "status": "success",
            "message": "Migration 005 applied successfully",
            "migration": "005_add_experiment_plans",
            "changes": [
                "Created experiment_plans table",
                "Added indexes for performance",
                "Added trigger for updated_at timestamp"
            ]
        }

    except Exception as e:
        logger.error(f"❌ Migration 005 failed: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/migrate/011-add-tables-and-figures")
async def run_migration_011(
    admin_key: str = Header(..., alias="X-Admin-Key"),
    db: Session = Depends(get_db)
):
    """
    Run migration 011: Add tables and figures support (Week 22)

    Adds columns for rich PDF content extraction:
    - articles.pdf_tables
    - articles.pdf_figures
    - protocols.tables_data
    - protocols.figures_data
    - protocols.figures_analysis

    Requires X-Admin-Key header for security.
    """
    # Verify admin key
    expected_key = os.getenv("ADMIN_KEY", "your-secret-admin-key-change-this")
    if admin_key != expected_key:
        raise HTTPException(status_code=403, detail="Invalid admin key")

    try:
        logger.info("🔧 Starting migration 011...")

        # Check if columns already exist
        inspector = inspect(db.bind)
        articles_columns = {col['name'] for col in inspector.get_columns('articles')}
        protocols_columns = {col['name'] for col in inspector.get_columns('protocols')}

        if 'pdf_tables' in articles_columns and 'tables_data' in protocols_columns:
            return {
                "status": "already_applied",
                "message": "Migration 011 has already been applied",
                "columns_exist": True
            }

        # Read migration SQL
        migration_path = "backend/migrations/011_add_tables_and_figures.sql"
        with open(migration_path, 'r') as f:
            migration_sql = f.read()

        # Split by semicolon and execute each statement
        statements = [
            s.strip()
            for s in migration_sql.split(';')
            if s.strip() and not s.strip().startswith('--')
        ]

        results = []
        for stmt in statements:
            if stmt:
                try:
                    db.execute(text(stmt))
                    results.append({"statement": stmt[:100] + "...", "status": "success"})
                    logger.info(f"✅ Executed: {stmt[:60]}...")
                except Exception as e:
                    error_msg = str(e)
                    if "already exists" in error_msg or "duplicate" in error_msg.lower():
                        results.append({"statement": stmt[:100] + "...", "status": "already_exists"})
                        logger.info(f"⚠️ Already exists: {stmt[:60]}...")
                    else:
                        raise

        db.commit()

        logger.info("✅ Migration 011 completed successfully!")

        return {
            "status": "success",
            "message": "Migration 011 completed successfully! Now uncomment the columns in database.py and redeploy.",
            "statements_executed": len(results),
            "details": results,
            "next_steps": [
                "1. Uncomment pdf_tables and pdf_figures in Article model (database.py line ~451)",
                "2. Uncomment tables_data, figures_data, figures_analysis in Protocol model (database.py line ~917)",
                "3. Commit and push to trigger redeployment"
            ]
        }

    except Exception as e:
        logger.error(f"❌ Migration 011 failed: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Migration failed: {str(e)}")


@router.get("/migrate/status")
async def check_migration_status(
    db: Session = Depends(get_db)
):
    """
    Check which migrations have been applied.
    Public endpoint - no auth required.
    """
    try:
        inspector = inspect(db.bind)
        protocols_columns = {col['name'] for col in inspector.get_columns('protocols')}
        articles_columns = {col['name'] for col in inspector.get_columns('articles')}

        # Check for Week 19 columns
        week_19_columns = [
            'relevance_score', 'affected_questions', 'affected_hypotheses',
            'key_insights', 'recommendations', 'context_aware'
        ]

        # Check for migration 004 columns
        confidence_columns = [
            'extraction_confidence', 'confidence_explanation',
            'material_sources', 'step_sources'
        ]

        # Check for migration 011 columns (Week 22)
        week_22_articles_columns = ['pdf_tables', 'pdf_figures']
        week_22_protocols_columns = ['tables_data', 'figures_data', 'figures_analysis']

        has_week_19 = all(col in protocols_columns for col in week_19_columns)
        has_confidence = all(col in protocols_columns for col in confidence_columns)
        has_week_22 = (
            all(col in articles_columns for col in week_22_articles_columns) and
            all(col in protocols_columns for col in week_22_protocols_columns)
        )

        return {
            "migration_003_applied": has_week_19,
            "migration_004_applied": has_confidence,
            "migration_011_applied": has_week_22,
            "total_protocols_columns": len(protocols_columns),
            "total_articles_columns": len(articles_columns),
            "week_19_columns_present": sum(1 for col in week_19_columns if col in protocols_columns),
            "week_19_columns_total": len(week_19_columns),
            "confidence_columns_present": sum(1 for col in confidence_columns if col in protocols_columns),
            "confidence_columns_total": len(confidence_columns),
            "week_22_columns_present": (
                sum(1 for col in week_22_articles_columns if col in articles_columns) +
                sum(1 for col in week_22_protocols_columns if col in protocols_columns)
            ),
            "week_22_columns_total": len(week_22_articles_columns) + len(week_22_protocols_columns),
            "status": "up_to_date" if (has_week_19 and has_confidence and has_week_22) else "migration_needed"
        }

    except Exception as e:
        logger.error(f"❌ Status check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")


@router.post("/protocols/reextract")
async def reextract_protocols(
    admin_key: str = Header(..., alias="X-Admin-Key"),
    project_id: str = None,
    limit: int = None,
    dry_run: bool = False,
    db: Session = Depends(get_db)
):
    """
    Re-extract existing protocols with new evidence-based logic.

    This endpoint:
    1. Fetches existing protocols (optionally filtered by project_id)
    2. Re-extracts each protocol using the new intelligent extractor
    3. Updates protocols with confidence scores and source citations

    Args:
        admin_key: Admin authentication key
        project_id: Optional project ID to filter protocols
        limit: Optional limit on number of protocols to process
        dry_run: If True, shows what would be done without making changes
    """
    # Verify admin key
    expected_key = os.getenv("ADMIN_KEY", "your-secret-admin-key-change-this")
    if admin_key != expected_key:
        raise HTTPException(status_code=403, detail="Invalid admin key")

    try:
        # Fetch protocols
        query = db.query(Protocol)
        if project_id:
            query = query.filter(Protocol.project_id == project_id)

        if limit:
            query = query.limit(limit)

        protocols = query.all()

        logger.info(f"🔄 Re-extracting {len(protocols)} protocols (dry_run={dry_run})")

        results = {
            "total": len(protocols),
            "success": 0,
            "skipped": 0,
            "errors": 0,
            "protocols": []
        }

        extractor = IntelligentProtocolExtractor()

        for protocol in protocols:
            try:
                # Fetch article
                article = db.query(Article).filter(Article.pmid == protocol.source_pmid).first()

                if not article:
                    logger.warning(f"⚠️  Article not found for PMID {protocol.source_pmid}")
                    results["skipped"] += 1
                    results["protocols"].append({
                        "protocol_id": protocol.protocol_id,
                        "status": "skipped",
                        "reason": "Article not found"
                    })
                    continue

                # Re-extract protocol
                new_protocol_data = await extractor.extract_protocol_with_context(
                    article_pmid=protocol.source_pmid,
                    project_id=protocol.project_id,
                    user_id=protocol.created_by,
                    db=db
                )

                if not new_protocol_data:
                    logger.warning(f"⚠️  No protocol extracted for {protocol.protocol_name}")
                    results["skipped"] += 1
                    results["protocols"].append({
                        "protocol_id": protocol.protocol_id,
                        "status": "skipped",
                        "reason": "No protocol found (likely review paper)"
                    })
                    continue

                confidence = new_protocol_data.get('extraction_confidence', 0)
                confidence_level = new_protocol_data.get('confidence_explanation', {}).get('confidence_level', 'Unknown')

                if not dry_run:
                    # Update protocol in database
                    protocol.materials = new_protocol_data.get('materials', [])
                    protocol.steps = new_protocol_data.get('steps', [])
                    protocol.equipment = new_protocol_data.get('equipment', [])
                    protocol.key_parameters = new_protocol_data.get('key_parameters', [])
                    protocol.expected_outcomes = new_protocol_data.get('expected_outcomes', [])
                    protocol.troubleshooting_tips = new_protocol_data.get('troubleshooting_tips', [])

                    # Update context-aware fields
                    protocol.relevance_score = new_protocol_data.get('relevance_score', 50)
                    protocol.affected_questions = new_protocol_data.get('affected_questions', [])
                    protocol.affected_hypotheses = new_protocol_data.get('affected_hypotheses', [])
                    protocol.relevance_reasoning = new_protocol_data.get('relevance_reasoning')
                    protocol.key_insights = new_protocol_data.get('key_insights', [])
                    protocol.potential_applications = new_protocol_data.get('potential_applications', [])
                    protocol.recommendations = new_protocol_data.get('recommendations', [])
                    protocol.context_relevance = new_protocol_data.get('context_relevance')

                    # Update confidence and sources
                    protocol.extraction_confidence = confidence
                    protocol.confidence_explanation = new_protocol_data.get('confidence_explanation', {})
                    protocol.material_sources = new_protocol_data.get('material_sources', {})
                    protocol.step_sources = new_protocol_data.get('step_sources', {})

                    # Update extraction metadata
                    protocol.extraction_method = 'intelligent_multi_agent'
                    protocol.context_aware = True

                    db.commit()

                results["success"] += 1
                results["protocols"].append({
                    "protocol_id": protocol.protocol_id,
                    "protocol_name": protocol.protocol_name,
                    "status": "success" if not dry_run else "would_update",
                    "confidence": confidence,
                    "confidence_level": confidence_level,
                    "materials_count": len(new_protocol_data.get('materials', [])),
                    "steps_count": len(new_protocol_data.get('steps', []))
                })

                logger.info(f"✅ {'Would update' if dry_run else 'Updated'} {protocol.protocol_name} (confidence: {confidence})")

            except Exception as e:
                logger.error(f"❌ Error processing protocol {protocol.protocol_id}: {e}")
                results["errors"] += 1
                results["protocols"].append({
                    "protocol_id": protocol.protocol_id,
                    "status": "error",
                    "error": str(e)
                })
                db.rollback()

        return {
            "message": f"Re-extraction {'simulation' if dry_run else 'complete'}",
            "dry_run": dry_run,
            "results": results
        }

    except Exception as e:
        logger.error(f"❌ Re-extraction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Re-extraction failed: {str(e)}")

