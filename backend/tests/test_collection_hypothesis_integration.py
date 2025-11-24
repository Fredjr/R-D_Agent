"""
Unit Tests for Collection-Hypothesis Integration Service

Week 24: Integration Gaps Implementation - Gap 1

Tests:
- suggest_collections_for_triage
- get_collections_for_hypothesis
- validate_hypothesis_links
- auto_update_collection

Date: 2025-11-24
"""

import pytest
import uuid
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base, Collection, Hypothesis, PaperTriage, ArticleCollection, HypothesisEvidence, Project, User
from backend.app.services.collection_hypothesis_integration_service import CollectionHypothesisIntegrationService


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
    project_id = str(uuid.uuid4())
    project = Project(
        project_id=project_id,
        project_name="Test Project",
        owner_user_id=user.user_id
    )
    db.add(project)

    # Create hypotheses
    hypothesis1_id = str(uuid.uuid4())
    hypothesis1 = Hypothesis(
        hypothesis_id=hypothesis1_id,
        project_id=project.project_id,
        hypothesis_text="AZD0530 reduces bone formation in FOP patients",
        status="proposed"
    )
    hypothesis2_id = str(uuid.uuid4())
    hypothesis2 = Hypothesis(
        hypothesis_id=hypothesis2_id,
        project_id=project.project_id,
        hypothesis_text="Saracatinib inhibits ACVR1 signaling",
        status="proposed"
    )
    db.add_all([hypothesis1, hypothesis2])

    # Create collections
    collection1_id = str(uuid.uuid4())
    collection1 = Collection(
        collection_id=collection1_id,
        project_id=project.project_id,
        collection_name="FOP Evidence",
        description="Papers supporting FOP hypothesis",
        linked_hypothesis_ids=[hypothesis1.hypothesis_id],
        auto_update=True,
        created_by=user.user_id
    )
    collection2_id = str(uuid.uuid4())
    collection2 = Collection(
        collection_id=collection2_id,
        project_id=project.project_id,
        collection_name="ACVR1 Research",
        description="Papers about ACVR1",
        linked_hypothesis_ids=[hypothesis2.hypothesis_id],
        auto_update=False,
        created_by=user.user_id
    )
    db.add_all([collection1, collection2])

    # Create triage
    triage_id = str(uuid.uuid4())
    triage = PaperTriage(
        triage_id=triage_id,
        project_id=project.project_id,
        article_pmid="12345678",
        triage_status="triaged",
        relevance_score=85,
        affected_hypotheses=[
            {
                "hypothesis_id": hypothesis1.hypothesis_id,
                "support_type": "supports",
                "score": 85
            }
        ]
    )
    db.add(triage)

    # Create hypothesis evidence
    evidence = HypothesisEvidence(
        hypothesis_id=hypothesis1.hypothesis_id,
        article_pmid="12345678",
        evidence_type="supports",
        strength="strong",
        key_finding="AZD0530 shows efficacy",
        added_by="ai_triage"
    )
    db.add(evidence)
    
    db.commit()
    
    return {
        "user": user,
        "project": project,
        "hypothesis1": hypothesis1,
        "hypothesis2": hypothesis2,
        "collection1": collection1,
        "collection2": collection2,
        "triage": triage,
        "evidence": evidence
    }


def test_suggest_collections_for_triage(db, test_data):
    """Test suggesting collections based on triage results"""
    triage_result = {
        "affected_hypotheses": [
            {
                "hypothesis_id": test_data["hypothesis1"].hypothesis_id,
                "support_type": "supports",
                "score": 85
            }
        ]
    }
    
    suggestions = CollectionHypothesisIntegrationService.suggest_collections_for_triage(
        triage_result,
        test_data["project"].project_id,
        db
    )
    
    assert len(suggestions) == 1
    assert suggestions[0]["collection_id"] == test_data["collection1"].collection_id
    assert suggestions[0]["collection_name"] == "FOP Evidence"
    assert suggestions[0]["confidence"] == 0.9
    assert "AZD0530" in suggestions[0]["reason"]


def test_suggest_collections_no_hypotheses(db, test_data):
    """Test suggesting collections when no hypotheses are affected"""
    triage_result = {"affected_hypotheses": []}
    
    suggestions = CollectionHypothesisIntegrationService.suggest_collections_for_triage(
        triage_result,
        test_data["project"].project_id,
        db
    )
    
    assert len(suggestions) == 0


def test_get_collections_for_hypothesis(db, test_data):
    """Test getting collections for a specific hypothesis"""
    collections = CollectionHypothesisIntegrationService.get_collections_for_hypothesis(
        test_data["hypothesis1"].hypothesis_id,
        test_data["project"].project_id,
        db
    )

    assert len(collections) == 1
    assert collections[0].collection_id == test_data["collection1"].collection_id


def test_validate_hypothesis_links_valid(db, test_data):
    """Test validating valid hypothesis links"""
    result = CollectionHypothesisIntegrationService.validate_hypothesis_links(
        [test_data["hypothesis1"].hypothesis_id, test_data["hypothesis2"].hypothesis_id],
        test_data["project"].project_id,
        db
    )

    assert result["valid"] is True
    assert len(result["invalid_ids"]) == 0
    assert result["valid_count"] == 2


def test_validate_hypothesis_links_invalid(db, test_data):
    """Test validating invalid hypothesis links"""
    fake_id = str(uuid.uuid4())
    result = CollectionHypothesisIntegrationService.validate_hypothesis_links(
        [test_data["hypothesis1"].hypothesis_id, fake_id],
        test_data["project"].project_id,
        db
    )

    assert result["valid"] is False
    assert len(result["invalid_ids"]) == 1
    assert fake_id in result["invalid_ids"]
    assert result["valid_count"] == 1


def test_validate_hypothesis_links_empty(db, test_data):
    """Test validating empty hypothesis links"""
    result = CollectionHypothesisIntegrationService.validate_hypothesis_links(
        [],
        test_data["project"].project_id,
        db
    )

    assert result["valid"] is True
    assert len(result["invalid_ids"]) == 0


def test_auto_update_collection(db, test_data):
    """Test auto-updating collection with new papers"""
    result = CollectionHypothesisIntegrationService.auto_update_collection(
        test_data["collection1"].collection_id,
        db
    )

    assert result["success"] is True
    assert result["papers_added"] == 1
    assert result["collection_id"] == test_data["collection1"].collection_id

    # Verify paper was added
    articles = db.query(ArticleCollection).filter(
        ArticleCollection.collection_id == test_data["collection1"].collection_id
    ).all()
    assert len(articles) == 1
    assert articles[0].article_pmid == "12345678"


def test_auto_update_collection_disabled(db, test_data):
    """Test auto-update fails when disabled"""
    result = CollectionHypothesisIntegrationService.auto_update_collection(
        test_data["collection2"].collection_id,
        db
    )

    assert result["success"] is False
    assert "not enabled" in result["error"]


def test_auto_update_collection_not_found(db, test_data):
    """Test auto-update fails for non-existent collection"""
    fake_id = str(uuid.uuid4())
    result = CollectionHypothesisIntegrationService.auto_update_collection(
        fake_id,
        db
    )

    assert result["success"] is False
    assert "not found" in result["error"]

