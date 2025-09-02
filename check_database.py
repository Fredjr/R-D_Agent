#!/usr/bin/env python3
"""
Database Verification Script
Check if user entries are being created in PostgreSQL tables
"""

import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from database import User, Project
from dotenv import load_dotenv

load_dotenv()

def get_database_connection():
    """Get database connection"""
    # Use local SQLite for now since we don't have PostgreSQL credentials locally
    DATABASE_URL = "sqlite:///./rd_agent.db"
    
    try:
        engine = create_engine(DATABASE_URL, echo=False)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        return engine, SessionLocal
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return None, None

def check_user_entries():
    """Check user entries in the database"""
    print("🔍 Checking User Entries in Database...")
    print("=" * 50)
    
    engine, SessionLocal = get_database_connection()
    if not engine:
        return
    
    try:
        db = SessionLocal()
        
        # Get all users
        users = db.query(User).all()
        
        print(f"📊 Total Users Found: {len(users)}")
        print()
        
        if users:
            print("👥 User Details:")
            print("-" * 80)
            for i, user in enumerate(users, 1):
                print(f"User {i}:")
                print(f"  User ID: {user.user_id}")
                print(f"  Username: {user.username}")
                print(f"  Email: {user.email}")
                print(f"  First Name: {user.first_name}")
                print(f"  Last Name: {user.last_name}")
                print(f"  Category: {user.category}")
                print(f"  Role: {user.role}")
                print(f"  Institution: {user.institution}")
                print(f"  Subject Area: {user.subject_area}")
                print(f"  Registration Completed: {user.registration_completed}")
                print(f"  Created At: {user.created_at}")
                print(f"  Is Active: {user.is_active}")
                print("-" * 80)
        else:
            print("❌ No users found in database")
        
        # Check projects
        projects = db.query(Project).all()
        print(f"📁 Total Projects Found: {len(projects)}")
        
        # Check other tables
        print("📋 Other tables will be checked when available")
        
        db.close()
        
    except Exception as e:
        print(f"❌ Error checking database: {e}")

def check_recent_signups():
    """Check for recent signups from E2E tests"""
    print("\n🕐 Recent Test Signups (from E2E tests):")
    print("=" * 50)
    
    engine, SessionLocal = get_database_connection()
    if not engine:
        return
    
    try:
        db = SessionLocal()
        
        # Look for test users
        test_users = db.query(User).filter(
            User.email.like('%test.e2e%')
        ).order_by(User.created_at.desc()).limit(5).all()
        
        if test_users:
            for user in test_users:
                print(f"✅ Test User: {user.email}")
                print(f"   Registration Status: {'✅ Complete' if user.registration_completed else '⏳ Incomplete'}")
                print(f"   Created: {user.created_at}")
                print()
        else:
            print("❌ No test users found")
        
        db.close()
        
    except Exception as e:
        print(f"❌ Error checking recent signups: {e}")

if __name__ == "__main__":
    check_user_entries()
    check_recent_signups()
