#!/usr/bin/env python3
"""
Database Migration Script for R&D Agent
Ensures PostgreSQL schema matches the updated User model with new authentication fields
"""

import os
import sys
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
from database import Base, User, Project, Dossier, DeepDiveAnalysis, Annotation, Report, ProjectCollaborator
from dotenv import load_dotenv

load_dotenv()

def get_database_url():
    """Get the database URL from environment variables"""
    # Google Cloud SQL PostgreSQL connection
    # Format: postgresql://[user]:[password]@[host]/[database]
    database_url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL")
    
    if not database_url:
        # Fallback to individual components for Google Cloud SQL
        db_user = os.getenv("DB_USER", "postgres")
        db_password = os.getenv("DB_PASSWORD", "")
        db_host = os.getenv("DB_HOST", "localhost")
        db_port = os.getenv("DB_PORT", "5432")
        db_name = "rd_agent"  # Google Cloud database name
        
        if db_password:
            database_url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
        else:
            database_url = "sqlite:///./rd_agent.db"  # Local fallback
    
    return database_url

def check_table_exists(engine, table_name):
    """Check if a table exists in the database"""
    inspector = inspect(engine)
    return table_name in inspector.get_table_names()

def check_column_exists(engine, table_name, column_name):
    """Check if a column exists in a table"""
    inspector = inspect(engine)
    if not check_table_exists(engine, table_name):
        return False
    
    columns = inspector.get_columns(table_name)
    return any(col['name'] == column_name for col in columns)

def migrate_user_table(engine):
    """Add new columns to the users table if they don't exist"""
    new_columns = [
        ("first_name", "VARCHAR NOT NULL DEFAULT ''"),
        ("last_name", "VARCHAR NOT NULL DEFAULT ''"),
        ("category", "VARCHAR NOT NULL DEFAULT ''"),
        ("role", "VARCHAR NOT NULL DEFAULT ''"),
        ("institution", "VARCHAR NOT NULL DEFAULT ''"),
        ("subject_area", "VARCHAR NOT NULL DEFAULT ''"),
        ("how_heard_about_us", "VARCHAR NOT NULL DEFAULT ''"),
        ("join_mailing_list", "BOOLEAN DEFAULT FALSE"),
        ("registration_completed", "BOOLEAN DEFAULT FALSE"),
        ("preferences", "JSON DEFAULT '{}'"),
        ("is_active", "BOOLEAN DEFAULT TRUE"),
        ("created_at", "TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP"),
        ("updated_at", "TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP")
    ]
    
    with engine.connect() as conn:
        for column_name, column_def in new_columns:
            if not check_column_exists(engine, "users", column_name):
                try:
                    # Handle JSON type for SQLite vs PostgreSQL
                    if column_name == "preferences" and "sqlite" in str(engine.url):
                        column_def = "TEXT DEFAULT '{}'"
                    
                    sql = f"ALTER TABLE users ADD COLUMN {column_name} {column_def}"
                    conn.execute(text(sql))
                    conn.commit()
                    print(f"✅ Added column '{column_name}' to users table")
                except Exception as e:
                    print(f"⚠️  Could not add column '{column_name}': {e}")
            else:
                print(f"✓ Column '{column_name}' already exists in users table")

def create_missing_tables(engine):
    """Create any missing tables"""
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created/verified successfully")
    except Exception as e:
        print(f"❌ Error creating tables: {e}")

def verify_database_schema(engine):
    """Verify the database schema matches our models"""
    inspector = inspect(engine)
    
    # Check required tables
    required_tables = ["users", "projects", "dossiers", "deep_dive_analyses", "annotations", "reports"]
    
    print("\n📋 Database Schema Verification:")
    print("=" * 50)
    
    for table in required_tables:
        if check_table_exists(engine, table):
            print(f"✅ Table '{table}' exists")
            
            # For users table, check new columns
            if table == "users":
                required_columns = [
                    "user_id", "username", "email", "password_hash",
                    "first_name", "last_name", "category", "role", 
                    "institution", "subject_area", "how_heard_about_us",
                    "join_mailing_list", "registration_completed"
                ]
                
                columns = inspector.get_columns(table)
                existing_columns = [col['name'] for col in columns]
                
                for col in required_columns:
                    if col in existing_columns:
                        print(f"  ✓ Column '{col}' exists")
                    else:
                        print(f"  ❌ Column '{col}' missing")
        else:
            print(f"❌ Table '{table}' missing")

def test_database_connection():
    """Test database connection and basic operations"""
    database_url = get_database_url()
    
    try:
        engine = create_engine(database_url)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print(f"✅ Database connection successful: {database_url}")
        
        return engine, SessionLocal
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return None, None

def main():
    """Main migration function"""
    print("🔄 Starting Database Migration for R&D Agent")
    print("=" * 60)
    
    # Test database connection
    engine, SessionLocal = test_database_connection()
    if not engine:
        sys.exit(1)
    
    # Create missing tables
    print("\n📦 Creating/Verifying Tables...")
    create_missing_tables(engine)
    
    # Migrate users table with new columns
    print("\n🔧 Migrating Users Table...")
    migrate_user_table(engine)
    
    # Verify schema
    verify_database_schema(engine)
    
    # Test basic operations
    print("\n🧪 Testing Database Operations...")
    try:
        db = SessionLocal()
        
        # Test user creation (without actually creating)
        test_user_data = {
            "user_id": "test_migration_user",
            "username": "Test Migration User",
            "email": "test@migration.com",
            "first_name": "Test",
            "last_name": "User",
            "category": "Academic",
            "role": "Professor",
            "institution": "Test University",
            "subject_area": "Computer Science",
            "how_heard_about_us": "Migration Test",
            "join_mailing_list": False,
            "registration_completed": True
        }
        
        # Check if test user already exists
        existing_user = db.query(User).filter(User.user_id == test_user_data["user_id"]).first()
        if existing_user:
            print("✅ Test user query successful")
        else:
            print("✅ Database ready for user operations")
        
        db.close()
        
    except Exception as e:
        print(f"❌ Database operation test failed: {e}")
    
    print("\n🎉 Database Migration Complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()
