"""Test annotation endpoints with contextual notes features"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid
from datetime import datetime

from main import app
from database import Base, get_db, User, Project, Annotation

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_annotations.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override get_db dependency
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Create test client
client = TestClient(app)

# Test data
TEST_USER_ID = "test_user_123"
TEST_PROJECT_ID = str(uuid.uuid4())
TEST_ARTICLE_PMID = "38796750"


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    """Setup test database"""
    print("\n🔧 Setting up test database...")
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create test user and project
    db = TestingSessionLocal()
    try:
        # Create user
        user = User(
            user_id=TEST_USER_ID,
            username="testuser",
            email="test@example.com",
            password_hash="test_hash",
            first_name="Test",
            last_name="User",
            category="Academic",
            role="Researcher",
            institution="Test University",
            subject_area="Biology",
            how_heard_about_us="Testing"
        )
        db.add(user)
        
        # Create project
        project = Project(
            project_id=TEST_PROJECT_ID,
            name="Test Project",
            owner_user_id=TEST_USER_ID
        )
        db.add(project)
        
        db.commit()
        print("✅ Test database setup complete")
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        db.rollback()
    finally:
        db.close()
    
    yield
    
    # Cleanup
    print("\n🧹 Cleaning up test database...")
    Base.metadata.drop_all(bind=engine)


def test_create_annotation_with_contextual_fields():
    """Test creating annotation with new contextual fields"""
    print("\n🧪 Test 1: Create annotation with contextual fields")
    print("-" * 60)
    
    response = client.post(
        f"/projects/{TEST_PROJECT_ID}/annotations",
        json={
            "content": "This paper shows insulin affects mitochondrial function",
            "article_pmid": TEST_ARTICLE_PMID,
            "note_type": "finding",
            "priority": "high",
            "status": "active",
            "tags": ["insulin", "mitochondria", "important"],
            "related_pmids": ["12345", "67890"],
            "action_items": [
                {
                    "text": "Follow up with team",
                    "completed": False,
                    "due_date": "2025-11-15"
                }
            ]
        },
        headers={"User-ID": TEST_USER_ID}
    )
    
    print(f"Status code: {response.status_code}")
    
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    data = response.json()
    print(f"✅ Created annotation: {data['annotation_id']}")
    print(f"   note_type: {data['note_type']}")
    print(f"   priority: {data['priority']}")
    print(f"   tags: {data['tags']}")
    print(f"   action_items: {len(data['action_items'])} items")
    
    assert data["content"] == "This paper shows insulin affects mitochondrial function"
    assert data["note_type"] == "finding"
    assert data["priority"] == "high"
    assert data["status"] == "active"
    assert len(data["tags"]) == 3
    assert len(data["related_pmids"]) == 2
    assert len(data["action_items"]) == 1
    
    # Store for later tests
    global CREATED_ANNOTATION_ID
    CREATED_ANNOTATION_ID = data["annotation_id"]
    
    print("✅ Test passed")


def test_create_annotation_without_context():
    """Test that creating annotation without context fails"""
    print("\n🧪 Test 2: Create annotation without context (should fail)")
    print("-" * 60)
    
    response = client.post(
        f"/projects/{TEST_PROJECT_ID}/annotations",
        json={
            "content": "This note has no context",
            "note_type": "general"
        },
        headers={"User-ID": TEST_USER_ID}
    )
    
    print(f"Status code: {response.status_code}")
    
    assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    
    print("✅ Correctly rejected annotation without context")


def test_get_annotations_with_filters():
    """Test getting annotations with filters"""
    print("\n🧪 Test 3: Get annotations with filters")
    print("-" * 60)
    
    # Create a few more annotations
    client.post(
        f"/projects/{TEST_PROJECT_ID}/annotations",
        json={
            "content": "Hypothesis about mechanism",
            "article_pmid": TEST_ARTICLE_PMID,
            "note_type": "hypothesis",
            "priority": "medium"
        },
        headers={"User-ID": TEST_USER_ID}
    )
    
    client.post(
        f"/projects/{TEST_PROJECT_ID}/annotations",
        json={
            "content": "Question to investigate",
            "article_pmid": TEST_ARTICLE_PMID,
            "note_type": "question",
            "priority": "high"
        },
        headers={"User-ID": TEST_USER_ID}
    )
    
    # Get all annotations
    response = client.get(
        f"/projects/{TEST_PROJECT_ID}/annotations",
        headers={"User-ID": TEST_USER_ID}
    )
    
    assert response.status_code == 200
    data = response.json()
    total_annotations = len(data["annotations"])
    print(f"✅ Total annotations: {total_annotations}")
    
    # Filter by note_type
    response = client.get(
        f"/projects/{TEST_PROJECT_ID}/annotations?note_type=finding",
        headers={"User-ID": TEST_USER_ID}
    )
    
    assert response.status_code == 200
    data = response.json()
    findings = len(data["annotations"])
    print(f"✅ Findings: {findings}")
    assert findings >= 1
    assert all(a["note_type"] == "finding" for a in data["annotations"])
    
    # Filter by priority
    response = client.get(
        f"/projects/{TEST_PROJECT_ID}/annotations?priority=high",
        headers={"User-ID": TEST_USER_ID}
    )
    
    assert response.status_code == 200
    data = response.json()
    high_priority = len(data["annotations"])
    print(f"✅ High priority: {high_priority}")
    assert high_priority >= 2
    assert all(a["priority"] == "high" for a in data["annotations"])
    
    print("✅ Test passed")


def test_update_annotation():
    """Test updating annotation"""
    print("\n🧪 Test 4: Update annotation")
    print("-" * 60)
    
    response = client.put(
        f"/projects/{TEST_PROJECT_ID}/annotations/{CREATED_ANNOTATION_ID}",
        json={
            "note_type": "hypothesis",
            "priority": "critical",
            "tags": ["insulin", "mitochondria", "important", "reviewed"],
            "status": "resolved"
        },
        headers={"User-ID": TEST_USER_ID}
    )
    
    print(f"Status code: {response.status_code}")
    
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    data = response.json()
    print(f"✅ Updated annotation: {data['annotation_id']}")
    print(f"   note_type: {data['note_type']} (was 'finding')")
    print(f"   priority: {data['priority']} (was 'high')")
    print(f"   status: {data['status']} (was 'active')")
    print(f"   tags: {len(data['tags'])} tags (was 3)")
    
    assert data["note_type"] == "hypothesis"
    assert data["priority"] == "critical"
    assert data["status"] == "resolved"
    assert len(data["tags"]) == 4
    
    print("✅ Test passed")


def test_create_annotation_thread():
    """Test creating parent-child annotation thread"""
    print("\n🧪 Test 5: Create annotation thread")
    print("-" * 60)
    
    # Create parent annotation
    response = client.post(
        f"/projects/{TEST_PROJECT_ID}/annotations",
        json={
            "content": "Parent note about research direction",
            "article_pmid": TEST_ARTICLE_PMID,
            "note_type": "general",
            "priority": "medium"
        },
        headers={"User-ID": TEST_USER_ID}
    )
    
    assert response.status_code == 200
    parent_id = response.json()["annotation_id"]
    print(f"✅ Created parent: {parent_id}")
    
    # Create child annotation
    response = client.post(
        f"/projects/{TEST_PROJECT_ID}/annotations",
        json={
            "content": "Child note with follow-up thought",
            "article_pmid": TEST_ARTICLE_PMID,
            "note_type": "finding",
            "priority": "medium",
            "parent_annotation_id": parent_id
        },
        headers={"User-ID": TEST_USER_ID}
    )
    
    assert response.status_code == 200
    child_id = response.json()["annotation_id"]
    print(f"✅ Created child: {child_id}")
    
    # Store for thread tests
    global THREAD_PARENT_ID
    THREAD_PARENT_ID = parent_id
    
    print("✅ Test passed")


def test_get_annotation_thread():
    """Test getting annotation thread"""
    print("\n🧪 Test 6: Get annotation thread")
    print("-" * 60)

    response = client.get(
        f"/projects/{TEST_PROJECT_ID}/annotations/{THREAD_PARENT_ID}/thread",
        headers={"User-ID": TEST_USER_ID}
    )

    print(f"Status code: {response.status_code}")

    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    data = response.json()
    thread = data["thread"]

    print(f"✅ Retrieved thread:")
    print(f"   Root: {thread['annotation_id']}")
    print(f"   Children: {len(thread['children'])}")
    print(f"   Total annotations: {data['total_annotations']}")

    assert thread["annotation_id"] == THREAD_PARENT_ID
    assert len(thread["children"]) >= 1
    assert data["total_annotations"] >= 2

    print("✅ Test passed")


def test_get_all_threads():
    """Test getting all annotation threads"""
    print("\n🧪 Test 7: Get all annotation threads")
    print("-" * 60)

    response = client.get(
        f"/projects/{TEST_PROJECT_ID}/annotations/threads",
        headers={"User-ID": TEST_USER_ID}
    )

    print(f"Status code: {response.status_code}")

    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    data = response.json()

    print(f"✅ Retrieved threads:")
    print(f"   Total threads: {data['total_threads']}")
    print(f"   Total annotations: {data['total_annotations']}")

    # Check thread structure
    for i, thread in enumerate(data["threads"][:3]):  # Show first 3
        print(f"   Thread {i+1}: {thread['annotation_id'][:8]}... ({thread['total_in_thread']} annotations)")

    assert data["total_threads"] >= 1
    assert data["total_annotations"] >= 1

    print("✅ Test passed")


def test_get_threads_with_filters():
    """Test getting threads with filters"""
    print("\n🧪 Test 8: Get threads with filters")
    print("-" * 60)

    # Filter by note_type
    response = client.get(
        f"/projects/{TEST_PROJECT_ID}/annotations/threads?note_type=general",
        headers={"User-ID": TEST_USER_ID}
    )

    assert response.status_code == 200
    data = response.json()

    print(f"✅ Filtered threads (note_type=general):")
    print(f"   Total threads: {data['total_threads']}")

    # All root annotations should be 'general' type
    for thread in data["threads"]:
        assert thread["note_type"] == "general"

    print("✅ Test passed")


def test_invalid_note_type():
    """Test that invalid note_type is rejected"""
    print("\n🧪 Test 9: Invalid note_type (should fail)")
    print("-" * 60)

    response = client.post(
        f"/projects/{TEST_PROJECT_ID}/annotations",
        json={
            "content": "Test note",
            "article_pmid": TEST_ARTICLE_PMID,
            "note_type": "invalid_type"
        },
        headers={"User-ID": TEST_USER_ID}
    )

    print(f"Status code: {response.status_code}")

    assert response.status_code == 422, f"Expected 422, got {response.status_code}"

    print("✅ Correctly rejected invalid note_type")


def test_summary():
    """Print test summary"""
    print("\n" + "=" * 60)
    print("📊 Test Summary")
    print("=" * 60)
    print("✅ All annotation endpoint tests passed!")
    print("\nTested features:")
    print("  1. Create annotation with contextual fields")
    print("  2. Validation (context required)")
    print("  3. Get annotations with filters")
    print("  4. Update annotation")
    print("  5. Create annotation thread")
    print("  6. Get annotation thread")
    print("  7. Get all threads")
    print("  8. Filter threads")
    print("  9. Validation (invalid note_type)")
    print("=" * 60)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])

