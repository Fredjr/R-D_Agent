#!/usr/bin/env python3
"""
Test database connection and basic operations
"""
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from database import User, Project, get_engine, get_session_local
import uuid

def test_local_db():
    """Test local database connection and operations"""
    print("Testing local database connection...")
    
    try:
        # Test engine creation
        engine = get_engine()
        print("✅ Engine created successfully")
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Database connection successful")
        
        # Test session creation
        SessionLocal = get_session_local()
        db = SessionLocal()
        
        # Test user creation (similar to what happens in the endpoint)
        test_user_id = f"test_user_{uuid.uuid4().hex[:8]}"
        user = User(
            user_id=test_user_id,
            username=test_user_id,
            email=f"{test_user_id}@example.com",
            first_name="Test",
            last_name="User",
            category="Industry",
            role="Researcher",
            institution="Test Institution",
            subject_area="General",
            how_heard_about_us="Direct"
        )
        
        db.add(user)
        db.commit()
        print(f"✅ User created successfully: {test_user_id}")
        
        # Test project creation
        project_id = str(uuid.uuid4())
        project = Project(
            project_id=project_id,
            project_name="Test Project",
            description="Test Description",
            owner_user_id=test_user_id
        )
        
        db.add(project)
        db.commit()
        print(f"✅ Project created successfully: {project_id}")
        
        # Clean up
        db.delete(project)
        db.delete(user)
        db.commit()
        print("✅ Cleanup completed")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ Database test failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_local_db()
    if success:
        print("\n✅ All database tests PASSED")
    else:
        print("\n❌ Database tests FAILED")
