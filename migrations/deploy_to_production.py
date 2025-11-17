"""
Deploy Migration to Production (Railway)

This script safely deploys the database migration to Railway's PostgreSQL database.

Safety Features:
1. Backs up current database schema
2. Tests connection before migration
3. Runs migration with error handling
4. Verifies all tables created
5. Provides rollback instructions

Usage:
    # Dry run (test connection only)
    python3 migrations/deploy_to_production.py --dry-run

    # Deploy to production
    python3 migrations/deploy_to_production.py --deploy

    # Verify deployment
    python3 migrations/deploy_to_production.py --verify
"""

import sys
import os
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_engine, get_database_url
from sqlalchemy import inspect, text


def test_connection():
    """Test database connection"""
    print("🔍 Testing database connection...")
    print("=" * 60)
    
    try:
        db_url = get_database_url()
        print(f"Database URL: {db_url[:50]}...")
        
        engine = get_engine()
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1")).fetchone()
            if result:
                print("✅ Database connection successful")
                
                # Check database type
                if engine.url.drivername.startswith('postgresql'):
                    print("✅ Connected to PostgreSQL (Production)")
                    
                    # Get database info
                    db_version = conn.execute(text("SELECT version()")).fetchone()
                    print(f"📊 Database: {db_version[0][:80]}...")
                    
                    return True, "postgresql"
                else:
                    print("⚠️  Connected to SQLite (Local)")
                    return True, "sqlite"
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False, None
    
    return False, None


def backup_schema():
    """Backup current database schema"""
    print("\n📦 Backing up current database schema...")
    print("=" * 60)
    
    try:
        engine = get_engine()
        inspector = inspect(engine)
        
        # Get all table names
        tables = inspector.get_table_names()
        print(f"✅ Found {len(tables)} existing tables")
        
        # Create backup file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = f"migrations/backup_schema_{timestamp}.txt"
        
        with open(backup_file, 'w') as f:
            f.write(f"Database Schema Backup\n")
            f.write(f"Timestamp: {timestamp}\n")
            f.write(f"Tables: {len(tables)}\n")
            f.write("=" * 60 + "\n\n")
            
            for table_name in tables:
                f.write(f"Table: {table_name}\n")
                columns = inspector.get_columns(table_name)
                for col in columns:
                    f.write(f"  - {col['name']}: {col['type']}\n")
                f.write("\n")
        
        print(f"✅ Schema backed up to: {backup_file}")
        return True, backup_file
    except Exception as e:
        print(f"❌ Backup failed: {e}")
        return False, None


def deploy_migration():
    """Deploy migration to production"""
    print("\n🚀 Deploying migration to production...")
    print("=" * 60)

    try:
        # Import migration module using importlib
        import importlib.util
        spec = importlib.util.spec_from_file_location(
            "migration_001",
            os.path.join(os.path.dirname(__file__), "001_add_pivot_tables.py")
        )
        migration_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(migration_module)

        # Run migration
        migration_module.upgrade()

        print("✅ Migration deployed successfully!")
        return True
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        print(f"❌ Error details: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        print("\n🚨 ROLLBACK INSTRUCTIONS:")
        print("python3 migrations/001_add_pivot_tables.py downgrade")
        return False


def verify_deployment():
    """Verify migration was successful"""
    print("\n🔍 Verifying deployment...")
    print("=" * 60)
    
    try:
        engine = get_engine()
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        
        # Tables that should exist after migration
        required_tables = [
            'research_questions',
            'question_evidence',
            'hypotheses',
            'hypothesis_evidence',
            'project_decisions',
            'paper_triage',
            'protocols',
            'experiments',
            'field_summaries',
            'project_alerts',
        ]
        
        all_exist = True
        for table_name in required_tables:
            if table_name in existing_tables:
                print(f"✅ Table exists: {table_name}")
            else:
                print(f"❌ Table missing: {table_name}")
                all_exist = False
        
        if all_exist:
            print("\n✅ All tables verified successfully!")
            print(f"✅ Total tables in database: {len(existing_tables)}")
            return True
        else:
            print("\n❌ Some tables are missing!")
            return False
    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False


def main():
    """Main deployment workflow"""
    print("🚀 Production Deployment Script")
    print("=" * 60)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # Parse command line arguments
    if len(sys.argv) < 2:
        print("\n❌ Error: Missing argument")
        print("\nUsage:")
        print("  python3 migrations/deploy_to_production.py --dry-run")
        print("  python3 migrations/deploy_to_production.py --deploy")
        print("  python3 migrations/deploy_to_production.py --verify")
        sys.exit(1)
    
    command = sys.argv[1]
    
    # Test connection first
    success, db_type = test_connection()
    if not success:
        print("\n❌ Cannot proceed without database connection")
        sys.exit(1)
    
    if db_type == "sqlite":
        print("\n⚠️  WARNING: Connected to SQLite (local development)")
        print("⚠️  This script is intended for production deployment")
        response = input("\nContinue anyway? (yes/no): ")
        if response.lower() != "yes":
            print("❌ Deployment cancelled")
            sys.exit(0)
    
    # Execute command
    if command == "--dry-run":
        print("\n✅ Dry run complete - connection successful")
        print("✅ Ready for deployment")
        
    elif command == "--deploy":
        # Backup schema
        backup_success, backup_file = backup_schema()
        if not backup_success:
            print("\n❌ Cannot proceed without backup")
            sys.exit(1)
        
        # Confirm deployment
        print("\n⚠️  WARNING: About to deploy migration to production")
        print(f"⚠️  Backup saved to: {backup_file}")
        response = input("\nProceed with deployment? (yes/no): ")
        
        if response.lower() != "yes":
            print("❌ Deployment cancelled")
            sys.exit(0)
        
        # Deploy migration
        if deploy_migration():
            # Verify deployment
            verify_deployment()
        else:
            print("\n❌ Deployment failed")
            sys.exit(1)
    
    elif command == "--verify":
        verify_deployment()
    
    else:
        print(f"\n❌ Unknown command: {command}")
        sys.exit(1)


if __name__ == "__main__":
    main()

