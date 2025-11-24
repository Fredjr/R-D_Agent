"""
Unit Tests for Note-Evidence Integration Service

Week 24: Integration Gaps Implementation - Gap 2

Tests:
- create_note_from_evidence
- get_notes_for_evidence
- get_notes_for_triage

Date: 2025-11-24
"""

import pytest
import uuid
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base, Annotation, PaperTriage, Hypothesis, Project, User
from backend.app.services.note_evidence_integration_service import NoteEvidenceIntegrationService


# Test database setup
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DATABASE_URL)
TestSessionLocal = sessionmaker(bind=engine)


@pytest.fixture
def db():
    """Create test database"""
    Base.metadata.create_all(bind=engine)
    session = TestSessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_data(db):
    """Create test data"""
    # Create user
    user_id = str(uuid.uuid4())
    user = User(
        user_id=user_id,
        username="testuser",
        email="test@example.com",
        first_name="Test",
        last_name="User",
        category="Academic",
        role="Researcher",
        institution="Test University",
        subject_area="Biology",
        how_heard_about_us="Other"
    )
    db.add(user)

    # Create project
    project = Project(
        project_id=str(uuid.uuid4()),
        project_name="Test Project",
        created_by=user.user_id
    )
    db.add(project)
    
    # Create hypothesis
    hypothesis = Hypothesis(
        hypothesis_id=str(uuid.uuid4()),
        project_id=project.project_id,
        hypothesis_text="AZD0530 reduces bone formation in FOP patients",
        status="proposed",
        created_by=user.user_id
    )
    db.add(hypothesis)
    
    # Create triage
    triage = PaperTriage(
        triage_id=str(uuid.uuid4()),
        project_id=project.project_id,
        article_pmid="12345678",
        triage_status="triaged",
        relevance_score=85,
        evidence_excerpts=[
            {
                "index": 0,
                "text": "AZD0530 significantly reduced heterotopic ossification in FOP mouse models",
                "type": "key_finding",
                "hypothesis_id": hypothesis.hypothesis_id
            }
        ],
        triaged_by=user.user_id
    )
    db.add(triage)
    
    db.commit()
    
    return {
        "user": user,
        "project": project,
        "hypothesis": hypothesis,
        "triage": triage
    }


def test_create_note_from_evidence(db, test_data):
    """Test creating a note from evidence excerpt"""
    evidence_excerpt = {
        "index": 0,
        "text": "AZD0530 significantly reduced heterotopic ossification in FOP mouse models",
        "type": "key_finding",
        "hypothesis_id": test_data["hypothesis"].hypothesis_id
    }
    
    annotation = NoteEvidenceIntegrationService.create_note_from_evidence(
        evidence_excerpt,
        test_data["triage"].triage_id,
        test_data["user"].user_id,
        test_data["project"].project_id,
        "This is very promising for FOP treatment!",
        db
    )
    
    assert annotation is not None
    assert annotation.linked_evidence_id == f"{test_data['triage'].triage_id}_0"
    assert annotation.evidence_quote == evidence_excerpt["text"]
    assert annotation.linked_hypothesis_id == test_data["hypothesis"].hypothesis_id
    assert "Evidence Quote" in annotation.content
    assert "My Thoughts" in annotation.content
    assert "promising" in annotation.content
    assert annotation.note_type == "finding"
    assert "from_triage" in annotation.tags


def test_create_note_from_evidence_no_additional_content(db, test_data):
    """Test creating a note with only evidence quote"""
    evidence_excerpt = {
        "index": 0,
        "text": "AZD0530 significantly reduced heterotopic ossification",
        "type": "key_finding",
        "hypothesis_id": test_data["hypothesis"].hypothesis_id
    }
    
    annotation = NoteEvidenceIntegrationService.create_note_from_evidence(
        evidence_excerpt,
        test_data["triage"].triage_id,
        test_data["user"].user_id,
        test_data["project"].project_id,
        "",
        db
    )
    
    assert annotation is not None
    assert "Evidence Quote" in annotation.content
    assert "My Thoughts" not in annotation.content


def test_get_notes_for_evidence(db, test_data):
    """Test getting notes for a specific evidence excerpt"""
    # Create a note
    evidence_excerpt = {
        "index": 0,
        "text": "Test evidence",
        "type": "key_finding",
        "hypothesis_id": test_data["hypothesis"].hypothesis_id
    }
    
    annotation = NoteEvidenceIntegrationService.create_note_from_evidence(
        evidence_excerpt,
        test_data["triage"].triage_id,
        test_data["user"].user_id,
        test_data["project"].project_id,
        "Test note",
        db
    )
    
    # Get notes
    evidence_id = f"{test_data['triage'].triage_id}_0"
    notes = NoteEvidenceIntegrationService.get_notes_for_evidence(evidence_id, db)
    
    assert len(notes) == 1
    assert notes[0].annotation_id == annotation.annotation_id


def test_get_notes_for_triage(db, test_data):
    """Test getting all notes for a triage"""
    # Create multiple notes
    for i in range(3):
        evidence_excerpt = {
            "index": i,
            "text": f"Evidence {i}",
            "type": "key_finding",
            "hypothesis_id": test_data["hypothesis"].hypothesis_id
        }
        
        NoteEvidenceIntegrationService.create_note_from_evidence(
            evidence_excerpt,
            test_data["triage"].triage_id,
            test_data["user"].user_id,
            test_data["project"].project_id,
            f"Note {i}",
            db
        )
    
    # Get all notes
    notes_by_evidence = NoteEvidenceIntegrationService.get_notes_for_triage(
        test_data["triage"].triage_id,
        db
    )
    
    assert len(notes_by_evidence) == 3
    for i in range(3):
        evidence_id = f"{test_data['triage'].triage_id}_{i}"
        assert evidence_id in notes_by_evidence
        assert len(notes_by_evidence[evidence_id]) == 1

