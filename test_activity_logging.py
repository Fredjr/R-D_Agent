#!/usr/bin/env python3
"""
Test Activity Logging System
Tests that activity logging is working correctly for all major actions
"""

import asyncio
import aiohttp
import json
import sys
from datetime import datetime

# Backend URL
BACKEND_URL = "https://r-dagent-production.up.railway.app"

async def test_project_creation_activity():
    """Test that project creation logs activity"""
    print("📁 Testing Project Creation Activity Logging...")
    print("=" * 50)
    
    timestamp = int(datetime.now().timestamp())
    test_user = f"test_user_{timestamp}"
    project_name = f"Test Project {timestamp}"
    
    async with aiohttp.ClientSession() as session:
        # Create a project
        async with session.post(f"{BACKEND_URL}/projects", 
            json={
                "project_name": project_name,
                "description": "Test project for activity logging"
            },
            headers={"User-ID": test_user}
        ) as response:
            if response.status != 200:
                print(f"❌ Failed to create project: {response.status}")
                return False
            
            project_data = await response.json()
            project_id = project_data["project_id"]
            print(f"✅ Created project: {project_id}")
        
        # Check if activity was logged
        await asyncio.sleep(2)  # Give time for activity to be logged
        
        async with session.get(f"{BACKEND_URL}/projects/{project_id}/activities",
            headers={"User-ID": test_user}
        ) as response:
            if response.status != 200:
                print(f"❌ Failed to get activities: {response.status}")
                return False
            
            activities_data = await response.json()
            activities = activities_data.get("activities", [])
            
            # Look for project creation activity
            project_created_activity = None
            for activity in activities:
                if activity["activity_type"] == "project_created":
                    project_created_activity = activity
                    break
            
            if project_created_activity:
                print(f"✅ Found project creation activity: {project_created_activity['description']}")
                return True
            else:
                print(f"❌ No project creation activity found")
                print(f"   Found activities: {[a['activity_type'] for a in activities]}")
                return False

async def test_collaborator_activity():
    """Test that collaborator management logs activity"""
    print(f"\n👥 Testing Collaborator Activity Logging...")
    print("=" * 50)
    
    timestamp = int(datetime.now().timestamp())
    test_user = f"test_owner_{timestamp}"
    collaborator_email = f"collaborator_{timestamp}@example.com"
    project_name = f"Collab Test Project {timestamp}"
    
    async with aiohttp.ClientSession() as session:
        # Create a project first
        async with session.post(f"{BACKEND_URL}/projects", 
            json={
                "project_name": project_name,
                "description": "Test project for collaborator activity logging"
            },
            headers={"User-ID": test_user}
        ) as response:
            if response.status != 200:
                print(f"❌ Failed to create project: {response.status}")
                return False
            
            project_data = await response.json()
            project_id = project_data["project_id"]
            print(f"✅ Created project: {project_id}")
        
        # Invite a collaborator
        async with session.post(f"{BACKEND_URL}/projects/{project_id}/collaborators",
            json={
                "email": collaborator_email,
                "role": "editor"
            },
            headers={"User-ID": test_user}
        ) as response:
            if response.status != 200:
                print(f"❌ Failed to invite collaborator: {response.status}")
                response_text = await response.text()
                print(f"   Response: {response_text}")
                return False
            
            print(f"✅ Invited collaborator: {collaborator_email}")
        
        # Check if activity was logged
        await asyncio.sleep(2)  # Give time for activity to be logged
        
        async with session.get(f"{BACKEND_URL}/projects/{project_id}/activities",
            headers={"User-ID": test_user}
        ) as response:
            if response.status != 200:
                print(f"❌ Failed to get activities: {response.status}")
                return False
            
            activities_data = await response.json()
            activities = activities_data.get("activities", [])
            
            # Look for collaborator added activity
            collaborator_activity = None
            for activity in activities:
                if activity["activity_type"] == "collaborator_added":
                    collaborator_activity = activity
                    break
            
            if collaborator_activity:
                print(f"✅ Found collaborator activity: {collaborator_activity['description']}")
                return True
            else:
                print(f"❌ No collaborator activity found")
                print(f"   Found activities: {[a['activity_type'] for a in activities]}")
                return False

async def test_annotation_activity():
    """Test that annotation creation logs activity"""
    print(f"\n📝 Testing Annotation Activity Logging...")
    print("=" * 50)
    
    timestamp = int(datetime.now().timestamp())
    test_user = f"test_annotator_{timestamp}"
    project_name = f"Annotation Test Project {timestamp}"
    
    async with aiohttp.ClientSession() as session:
        # Create a project first
        async with session.post(f"{BACKEND_URL}/projects", 
            json={
                "project_name": project_name,
                "description": "Test project for annotation activity logging"
            },
            headers={"User-ID": test_user}
        ) as response:
            if response.status != 200:
                print(f"❌ Failed to create project: {response.status}")
                return False
            
            project_data = await response.json()
            project_id = project_data["project_id"]
            print(f"✅ Created project: {project_id}")
        
        # Create an annotation
        async with session.post(f"{BACKEND_URL}/projects/{project_id}/annotations",
            json={
                "content": "This is a test annotation for activity logging",
                "article_pmid": "12345678"
            },
            headers={"User-ID": test_user}
        ) as response:
            if response.status != 200:
                print(f"❌ Failed to create annotation: {response.status}")
                response_text = await response.text()
                print(f"   Response: {response_text}")
                return False
            
            annotation_data = await response.json()
            print(f"✅ Created annotation: {annotation_data['annotation_id']}")
        
        # Check if activity was logged
        await asyncio.sleep(2)  # Give time for activity to be logged
        
        async with session.get(f"{BACKEND_URL}/projects/{project_id}/activities",
            headers={"User-ID": test_user}
        ) as response:
            if response.status != 200:
                print(f"❌ Failed to get activities: {response.status}")
                return False
            
            activities_data = await response.json()
            activities = activities_data.get("activities", [])
            
            # Look for annotation created activity
            annotation_activity = None
            for activity in activities:
                if activity["activity_type"] == "annotation_created":
                    annotation_activity = activity
                    break
            
            if annotation_activity:
                print(f"✅ Found annotation activity: {annotation_activity['description']}")
                return True
            else:
                print(f"❌ No annotation activity found")
                print(f"   Found activities: {[a['activity_type'] for a in activities]}")
                return False

async def test_activity_feed_realtime():
    """Test that activity feed updates in real-time"""
    print(f"\n🔄 Testing Real-time Activity Feed...")
    print("=" * 50)
    
    timestamp = int(datetime.now().timestamp())
    test_user = f"test_realtime_{timestamp}"
    project_name = f"Realtime Test Project {timestamp}"
    
    async with aiohttp.ClientSession() as session:
        # Create a project first
        async with session.post(f"{BACKEND_URL}/projects", 
            json={
                "project_name": project_name,
                "description": "Test project for real-time activity feed"
            },
            headers={"User-ID": test_user}
        ) as response:
            if response.status != 200:
                print(f"❌ Failed to create project: {response.status}")
                return False
            
            project_data = await response.json()
            project_id = project_data["project_id"]
            print(f"✅ Created project: {project_id}")
        
        # Get initial activity count
        async with session.get(f"{BACKEND_URL}/projects/{project_id}/activities",
            headers={"User-ID": test_user}
        ) as response:
            if response.status != 200:
                print(f"❌ Failed to get initial activities: {response.status}")
                return False
            
            initial_data = await response.json()
            initial_count = len(initial_data.get("activities", []))
            print(f"📊 Initial activity count: {initial_count}")
        
        # Create multiple activities
        for i in range(3):
            async with session.post(f"{BACKEND_URL}/projects/{project_id}/annotations",
                json={
                    "content": f"Test annotation {i+1} for real-time testing",
                    "article_pmid": f"1234567{i}"
                },
                headers={"User-ID": test_user}
            ) as response:
                if response.status == 200:
                    print(f"✅ Created annotation {i+1}")
                else:
                    print(f"❌ Failed to create annotation {i+1}")
        
        # Wait and check final activity count
        await asyncio.sleep(3)
        
        async with session.get(f"{BACKEND_URL}/projects/{project_id}/activities",
            headers={"User-ID": test_user}
        ) as response:
            if response.status != 200:
                print(f"❌ Failed to get final activities: {response.status}")
                return False
            
            final_data = await response.json()
            final_count = len(final_data.get("activities", []))
            print(f"📊 Final activity count: {final_count}")
            
            expected_count = initial_count + 3  # 3 annotations
            if final_count >= expected_count:
                print(f"✅ Activity feed updated correctly (expected >= {expected_count}, got {final_count})")
                return True
            else:
                print(f"❌ Activity feed not updated correctly (expected >= {expected_count}, got {final_count})")
                return False

async def main():
    """Run all activity logging tests"""
    print("🚀 Starting Activity Logging Tests")
    print("=" * 60)
    
    # Test different activity logging scenarios
    project_test = await test_project_creation_activity()
    collaborator_test = await test_collaborator_activity()
    annotation_test = await test_annotation_activity()
    realtime_test = await test_activity_feed_realtime()
    
    print("\n" + "=" * 60)
    if project_test and collaborator_test and annotation_test and realtime_test:
        print("🎉 ALL ACTIVITY LOGGING TESTS PASSED!")
        print("✅ Project creation activity logging works")
        print("✅ Collaborator management activity logging works")
        print("✅ Annotation creation activity logging works")
        print("✅ Real-time activity feed updates work")
    else:
        print("❌ ACTIVITY LOGGING TESTS FAILED!")
        if not project_test:
            print("❌ Project creation activity logging failed")
        if not collaborator_test:
            print("❌ Collaborator management activity logging failed")
        if not annotation_test:
            print("❌ Annotation creation activity logging failed")
        if not realtime_test:
            print("❌ Real-time activity feed updates failed")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
