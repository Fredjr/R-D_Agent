"""Test Pydantic models for annotations"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.annotation_models import (
    CreateAnnotationRequest,
    UpdateAnnotationRequest,
    AnnotationResponse,
    ActionItem,
    NoteType,
    Priority,
    Status
)
from pydantic import ValidationError


def test_create_annotation_request():
    """Test CreateAnnotationRequest model"""
    print("\n🧪 Test 1: CreateAnnotationRequest validation")
    print("-" * 60)
    
    try:
        # Test with valid data
        req = CreateAnnotationRequest(
            content="Test finding about insulin",
            article_pmid="38796750",
            note_type="finding",
            priority="high",
            status="active",
            tags=["insulin", "mitochondria"],
            related_pmids=["12345", "67890"]
        )
        
        print(f"✅ Created request:")
        print(f"   content: {req.content}")
        print(f"   note_type: {req.note_type}")
        print(f"   priority: {req.priority}")
        print(f"   status: {req.status}")
        print(f"   tags: {req.tags}")
        print(f"   related_pmids: {req.related_pmids}")
        
        assert req.note_type == "finding"
        assert req.priority == "high"
        assert req.status == "active"
        assert len(req.tags) == 2
        assert len(req.related_pmids) == 2
        
        print("✅ All assertions passed")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_invalid_note_type():
    """Test that invalid note_type is rejected"""
    print("\n🧪 Test 2: Invalid note_type validation")
    print("-" * 60)
    
    try:
        # This should raise ValidationError
        req = CreateAnnotationRequest(
            content="Test note",
            article_pmid="12345",
            note_type="invalid_type"  # Invalid!
        )
        
        print("❌ Should have raised ValidationError")
        return False
        
    except ValidationError as e:
        print(f"✅ Correctly rejected invalid note_type")
        print(f"   Error: {e.errors()[0]['msg']}")
        return True
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False


def test_invalid_priority():
    """Test that invalid priority is rejected"""
    print("\n🧪 Test 3: Invalid priority validation")
    print("-" * 60)
    
    try:
        # This should raise ValidationError
        req = CreateAnnotationRequest(
            content="Test note",
            article_pmid="12345",
            priority="super_urgent"  # Invalid!
        )
        
        print("❌ Should have raised ValidationError")
        return False
        
    except ValidationError as e:
        print(f"✅ Correctly rejected invalid priority")
        print(f"   Error: {e.errors()[0]['msg']}")
        return True
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False


def test_default_values():
    """Test that default values are applied"""
    print("\n🧪 Test 4: Default values")
    print("-" * 60)
    
    try:
        # Create with minimal data
        req = CreateAnnotationRequest(
            content="Test note",
            article_pmid="12345"
        )
        
        print(f"✅ Created request with defaults:")
        print(f"   note_type: {req.note_type} (should be 'general')")
        print(f"   priority: {req.priority} (should be 'medium')")
        print(f"   status: {req.status} (should be 'active')")
        print(f"   tags: {req.tags} (should be [])")
        print(f"   related_pmids: {req.related_pmids} (should be [])")
        print(f"   is_private: {req.is_private} (should be False)")
        
        assert req.note_type == "general"
        assert req.priority == "medium"
        assert req.status == "active"
        assert req.tags == []
        assert req.related_pmids == []
        assert req.is_private == False
        
        print("✅ All default values correct")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_action_items():
    """Test ActionItem model"""
    print("\n🧪 Test 5: ActionItem model")
    print("-" * 60)
    
    try:
        # Create action item
        action = ActionItem(
            text="Follow up with team",
            completed=False,
            due_date="2025-11-15"
        )
        
        print(f"✅ Created action item:")
        print(f"   text: {action.text}")
        print(f"   completed: {action.completed}")
        print(f"   due_date: {action.due_date}")
        
        # Create request with action items
        req = CreateAnnotationRequest(
            content="Test note",
            article_pmid="12345",
            action_items=[action]
        )
        
        print(f"✅ Created request with action items:")
        print(f"   action_items: {req.action_items}")
        
        assert len(req.action_items) == 1
        assert req.action_items[0].text == "Follow up with team"
        
        print("✅ Action items work correctly")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_update_annotation_request():
    """Test UpdateAnnotationRequest model"""
    print("\n🧪 Test 6: UpdateAnnotationRequest")
    print("-" * 60)
    
    try:
        # Test with partial update
        req = UpdateAnnotationRequest(
            note_type="hypothesis",
            priority="critical",
            tags=["important", "review"]
        )
        
        print(f"✅ Created update request:")
        print(f"   note_type: {req.note_type}")
        print(f"   priority: {req.priority}")
        print(f"   tags: {req.tags}")
        print(f"   content: {req.content} (should be None)")
        
        assert req.note_type == "hypothesis"
        assert req.priority == "critical"
        assert req.content is None  # Not updated
        
        print("✅ Partial update works correctly")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_enum_values():
    """Test enum values"""
    print("\n🧪 Test 7: Enum values")
    print("-" * 60)
    
    try:
        print("✅ NoteType values:")
        for note_type in NoteType:
            print(f"   - {note_type.value}")
        
        print("\n✅ Priority values:")
        for priority in Priority:
            print(f"   - {priority.value}")
        
        print("\n✅ Status values:")
        for status in Status:
            print(f"   - {status.value}")
        
        assert len(list(NoteType)) == 7
        assert len(list(Priority)) == 4
        assert len(list(Status)) == 3
        
        print("\n✅ All enum values correct")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False


if __name__ == "__main__":
    print("🧪 Testing Annotation Pydantic Models")
    print("=" * 60)
    
    results = []
    
    try:
        results.append(("CreateAnnotationRequest", test_create_annotation_request()))
        results.append(("Invalid note_type", test_invalid_note_type()))
        results.append(("Invalid priority", test_invalid_priority()))
        results.append(("Default values", test_default_values()))
        results.append(("ActionItem model", test_action_items()))
        results.append(("UpdateAnnotationRequest", test_update_annotation_request()))
        results.append(("Enum values", test_enum_values()))
        
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

