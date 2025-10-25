"""
Admin API Endpoints
For database migrations and administrative tasks
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
import logging

from database import get_engine, get_session_local

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])


# Dependency for database session
def get_db():
    SessionLocal = get_session_local()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/migrate/drop-user-interactions-fk")
async def drop_user_interactions_fk(db: Session = Depends(get_db)):
    """
    Drop foreign key constraint from user_interactions.user_id
    
    This is a one-time migration to allow event tracking for users
    before they complete full registration.
    """
    try:
        logger.info("🔄 Starting FK constraint removal migration...")
        
        # Check if constraint exists
        check_sql = text("""
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'user_interactions' 
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%user_id%'
        """)
        
        result = db.execute(check_sql)
        constraints = result.fetchall()
        
        if not constraints:
            logger.info("✅ No FK constraint found - already removed")
            return {
                "success": True,
                "message": "FK constraint already removed or never existed",
                "constraints_dropped": []
            }
        
        # Drop each constraint
        dropped = []
        for constraint in constraints:
            constraint_name = constraint[0]
            logger.info(f"🔧 Dropping constraint: {constraint_name}")
            
            drop_sql = text(f"""
                ALTER TABLE user_interactions 
                DROP CONSTRAINT IF EXISTS {constraint_name}
            """)
            
            db.execute(drop_sql)
            db.commit()
            dropped.append(constraint_name)
            logger.info(f"✅ Dropped: {constraint_name}")
        
        # Verify
        verify_result = db.execute(check_sql)
        remaining = verify_result.fetchall()
        
        if remaining:
            logger.warning(f"⚠️ {len(remaining)} FK constraints still exist")
            return {
                "success": False,
                "message": f"{len(remaining)} FK constraints still exist",
                "constraints_dropped": dropped,
                "remaining_constraints": [c[0] for c in remaining]
            }
        
        logger.info("✅ Migration completed successfully!")
        return {
            "success": True,
            "message": "FK constraint removed successfully",
            "constraints_dropped": dropped
        }
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Migration failed: {str(e)}")

