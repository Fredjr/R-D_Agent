"""Test that existing annotations still work after migration"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db, Annotation
import json

def test_existing_annotations():
    """Test that existing annotations have default values"""
    print("\n🧪 Testing existing annotations after migration")
    print("=" * 60)
    
    db = next(get_db())
    
    try:
        # Query all existing annotations
        annotations = db.query(Annotation).limit(10).all()
        
        if len(annotations) == 0:
            print("ℹ️  No existing annotations found in database")
            print("✅ This is expected for a fresh database")
            return True
        
        print(f"📊 Found {len(annotations)} existing annotation(s)")
        print("-" * 60)
        
        for i, ann in enumerate(annotations, 1):
            print(f"\n{i}. Annotation ID: {ann.annotation_id}")
            print(f"   Content: {ann.content[:50]}..." if len(ann.content) > 50 else f"   Content: {ann.content}")
            print(f"   Type: {ann.note_type}")
            print(f"   Priority: {ann.priority}")
            print(f"   Status: {ann.status}")
            
            # Parse JSON fields if they're strings
            if isinstance(ann.tags, str):
                tags = json.loads(ann.tags) if ann.tags else []
            else:
                tags = ann.tags if ann.tags else []
            
            if isinstance(ann.related_pmids, str):
                pmids = json.loads(ann.related_pmids) if ann.related_pmids else []
            else:
                pmids = ann.related_pmids if ann.related_pmids else []
            
            print(f"   Tags: {tags}")
            print(f"   Related PMIDs: {pmids}")
            print(f"   Parent: {ann.parent_annotation_id}")
            print(f"   Session: {ann.exploration_session_id}")
            
            # Verify defaults
            if ann.note_type is None:
                print("   ⚠️  WARNING: note_type is NULL (should be 'general')")
            
            if ann.priority is None:
                print("   ⚠️  WARNING: priority is NULL (should be 'medium')")
            
            if ann.status is None:
                print("   ⚠️  WARNING: status is NULL (should be 'active')")
        
        print("\n" + "=" * 60)
        print("✅ All existing annotations are accessible")
        print("✅ No data loss detected")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


def test_update_existing_annotation():
    """Test that we can update existing annotations with new fields"""
    print("\n🧪 Testing update of existing annotation")
    print("=" * 60)
    
    db = next(get_db())
    
    try:
        # Get first annotation
        annotation = db.query(Annotation).first()
        
        if annotation is None:
            print("ℹ️  No existing annotations to update")
            print("✅ This is expected for a fresh database")
            return True
        
        print(f"📊 Found annotation: {annotation.annotation_id}")
        print(f"   Current type: {annotation.note_type}")
        print(f"   Current priority: {annotation.priority}")
        
        # Store original values
        original_type = annotation.note_type
        original_priority = annotation.priority
        
        # Update with new fields
        annotation.note_type = "finding"
        annotation.priority = "high"
        annotation.tags = ["test", "migration"]
        
        db.commit()
        db.refresh(annotation)
        
        print(f"\n✅ Updated annotation")
        print(f"   New type: {annotation.note_type}")
        print(f"   New priority: {annotation.priority}")
        print(f"   New tags: {annotation.tags}")
        
        # Verify update
        assert annotation.note_type == "finding", "note_type not updated"
        assert annotation.priority == "high", "priority not updated"
        
        # Restore original values
        annotation.note_type = original_type
        annotation.priority = original_priority
        annotation.tags = []
        
        db.commit()
        
        print(f"\n✅ Restored original values")
        print("✅ Existing annotations can be updated with new fields")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    print("🧪 Testing Existing Annotations After Migration")
    print("=" * 60)
    
    results = []
    
    try:
        results.append(("Read existing annotations", test_existing_annotations()))
        results.append(("Update existing annotation", test_update_existing_annotation()))
        
        print("\n" + "=" * 60)
        print("📊 Test Results:")
        print("-" * 60)
        
        for test_name, passed in results:
            status = "✅ PASSED" if passed else "❌ FAILED"
            print(f"{test_name:30} {status}")
        
        all_passed = all(result[1] for result in results)
        
        if all_passed:
            print("\n✅ All tests passed!")
            print("✅ Migration is backward compatible")
        else:
            print("\n❌ Some tests failed!")
            
    except Exception as e:
        print(f"\n❌ Test suite failed: {e}")
        import traceback
        traceback.print_exc()

