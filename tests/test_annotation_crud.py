"""Test CRUD operations for enhanced Annotation model"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db, Annotation
from sqlalchemy.orm import Session
import uuid
from datetime import datetime
import json

def test_create_annotation_with_new_fields():
    """Test creating annotation with contextual fields"""
    print("\n🧪 Test 1: Create annotation with new fields")
    print("-" * 60)
    
    db = next(get_db())
    
    try:
        # Create annotation with new fields
        annotation = Annotation(
            annotation_id=str(uuid.uuid4()),
            project_id="test_project",
            content="Test finding about insulin resistance",
            article_pmid="38796750",
            note_type="finding",
            priority="high",
            status="active",
            related_pmids=["12345", "67890"],
            tags=["insulin", "mitochondria"],
            action_items=[
                {"text": "Compare with dataset", "completed": False}
            ],
            author_id="test_user",
            is_private=False,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        db.add(annotation)
        db.commit()
        db.refresh(annotation)
        
        print(f"✅ Created annotation: {annotation.annotation_id}")
        print(f"   Type: {annotation.note_type}")
        print(f"   Priority: {annotation.priority}")
        print(f"   Status: {annotation.status}")
        print(f"   Tags: {annotation.tags}")
        print(f"   Related PMIDs: {annotation.related_pmids}")
        print(f"   Action Items: {annotation.action_items}")
        
        # Verify it was saved
        saved = db.query(Annotation).filter(
            Annotation.annotation_id == annotation.annotation_id
        ).first()
        
        assert saved is not None, "Annotation not found in database"
        assert saved.note_type == "finding", f"Expected note_type='finding', got '{saved.note_type}'"
        assert saved.priority == "high", f"Expected priority='high', got '{saved.priority}'"
        assert saved.status == "active", f"Expected status='active', got '{saved.status}'"
        
        # Parse JSON fields if they're strings
        if isinstance(saved.tags, str):
            saved_tags = json.loads(saved.tags)
        else:
            saved_tags = saved.tags
        
        if isinstance(saved.related_pmids, str):
            saved_pmids = json.loads(saved.related_pmids)
        else:
            saved_pmids = saved.related_pmids
            
        assert len(saved_tags) == 2, f"Expected 2 tags, got {len(saved_tags)}"
        assert len(saved_pmids) == 2, f"Expected 2 related PMIDs, got {len(saved_pmids)}"
        
        print("✅ All assertions passed")
        
        # Cleanup
        db.delete(annotation)
        db.commit()
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


def test_create_annotation_thread():
    """Test creating parent-child annotation relationship"""
    print("\n🧪 Test 2: Create parent-child annotation relationship")
    print("-" * 60)
    
    db = next(get_db())
    
    try:
        # Create parent annotation
        parent = Annotation(
            annotation_id=str(uuid.uuid4()),
            project_id="test_project",
            content="Parent note: Initial finding",
            article_pmid="38796750",
            note_type="finding",
            priority="high",
            status="active",
            author_id="test_user",
            is_private=False,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        db.add(parent)
        db.commit()
        db.refresh(parent)
        
        print(f"✅ Created parent annotation: {parent.annotation_id}")
        
        # Create child annotation
        child = Annotation(
            annotation_id=str(uuid.uuid4()),
            project_id="test_project",
            content="Child note: Follow-up hypothesis",
            article_pmid="12345",
            note_type="hypothesis",
            priority="medium",
            status="active",
            parent_annotation_id=parent.annotation_id,
            author_id="test_user",
            is_private=False,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        db.add(child)
        db.commit()
        db.refresh(child)
        
        print(f"✅ Created child annotation: {child.annotation_id}")
        print(f"   Parent: {child.parent_annotation_id}")
        
        # Verify relationship
        assert child.parent_annotation_id == parent.annotation_id, "Parent-child relationship not set correctly"
        
        # Query child's parent
        parent_from_db = db.query(Annotation).filter(
            Annotation.annotation_id == child.parent_annotation_id
        ).first()
        
        assert parent_from_db is not None, "Parent annotation not found"
        assert parent_from_db.annotation_id == parent.annotation_id, "Parent ID mismatch"
        
        print("✅ Parent-child relationship works")
        
        # Cleanup
        db.delete(child)
        db.delete(parent)
        db.commit()
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


def test_query_by_note_type():
    """Test querying annotations by note_type"""
    print("\n🧪 Test 3: Query annotations by note_type")
    print("-" * 60)
    
    db = next(get_db())
    
    try:
        # Create multiple annotations with different types
        annotations = []
        for note_type in ["finding", "hypothesis", "question"]:
            ann = Annotation(
                annotation_id=str(uuid.uuid4()),
                project_id="test_project",
                content=f"Test {note_type}",
                article_pmid="38796750",
                note_type=note_type,
                priority="medium",
                status="active",
                author_id="test_user",
                is_private=False,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            annotations.append(ann)
            db.add(ann)
        
        db.commit()
        
        # Query by note_type
        findings = db.query(Annotation).filter(
            Annotation.project_id == "test_project",
            Annotation.note_type == "finding"
        ).all()
        
        print(f"✅ Found {len(findings)} finding(s)")
        assert len(findings) >= 1, "Should find at least 1 finding"
        
        # Query by priority
        high_priority = db.query(Annotation).filter(
            Annotation.project_id == "test_project",
            Annotation.priority == "medium"
        ).all()
        
        print(f"✅ Found {len(high_priority)} medium priority annotation(s)")
        assert len(high_priority) >= 3, "Should find at least 3 medium priority annotations"
        
        # Cleanup
        for ann in annotations:
            db.delete(ann)
        db.commit()
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


def test_update_annotation():
    """Test updating annotation with new fields"""
    print("\n🧪 Test 4: Update annotation with new fields")
    print("-" * 60)
    
    db = next(get_db())
    
    try:
        # Create annotation
        annotation = Annotation(
            annotation_id=str(uuid.uuid4()),
            project_id="test_project",
            content="Initial note",
            article_pmid="38796750",
            note_type="general",
            priority="low",
            status="active",
            author_id="test_user",
            is_private=False,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        db.add(annotation)
        db.commit()
        db.refresh(annotation)
        
        print(f"✅ Created annotation: {annotation.annotation_id}")
        print(f"   Initial type: {annotation.note_type}")
        print(f"   Initial priority: {annotation.priority}")
        
        # Update annotation
        annotation.note_type = "finding"
        annotation.priority = "high"
        annotation.tags = ["important", "review"]
        annotation.updated_at = datetime.now()
        
        db.commit()
        db.refresh(annotation)
        
        print(f"✅ Updated annotation")
        print(f"   New type: {annotation.note_type}")
        print(f"   New priority: {annotation.priority}")
        print(f"   New tags: {annotation.tags}")
        
        # Verify update
        assert annotation.note_type == "finding", "note_type not updated"
        assert annotation.priority == "high", "priority not updated"
        
        print("✅ Update successful")
        
        # Cleanup
        db.delete(annotation)
        db.commit()
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    print("🧪 Testing Annotation CRUD operations...")
    print("=" * 60)
    
    results = []
    
    try:
        results.append(("Create with new fields", test_create_annotation_with_new_fields()))
        results.append(("Parent-child relationship", test_create_annotation_thread()))
        results.append(("Query by note_type", test_query_by_note_type()))
        results.append(("Update annotation", test_update_annotation()))
        
        print("\n" + "=" * 60)
        print("📊 Test Results:")
        print("-" * 60)
        
        for test_name, passed in results:
            status = "✅ PASSED" if passed else "❌ FAILED"
            print(f"{test_name:30} {status}")
        
        all_passed = all(result[1] for result in results)
        
        if all_passed:
            print("\n✅ All tests passed!")
        else:
            print("\n❌ Some tests failed!")
            
    except Exception as e:
        print(f"\n❌ Test suite failed: {e}")
        import traceback
        traceback.print_exc()

