#!/usr/bin/env python3

import sys
sys.path.append('.')

from database import get_db, User

def check_users():
    """Check what users exist in the database"""
    try:
        db = next(get_db())
        
        print('👥 Checking users in database...')
        users = db.query(User).limit(10).all()
        
        print(f'📊 Found {len(users)} users:')
        for user in users:
            print(f'👤 {user.email} (ID: {user.user_id}, Subject: {user.subject_area})')
        
        db.close()
        
    except Exception as e:
        print(f'❌ Error checking users: {e}')
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    check_users()
