"""
Unit Tests for Network Context Integration Service

Week 24: Integration Gaps Implementation - Gap 3

Tests:
- enrich_network_with_context
- get_node_context
- filter_network_by_hypothesis
- _calculate_priority_score

Date: 2025-11-24
"""

import pytest
import uuid
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base, PaperTriage, Hypothesis, HypothesisEvidence, Project, User
from backend.app.services.network_context_integration_service import NetworkContextIntegrationService


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
    
    # Create triages
    triage1 = PaperTriage(
        triage_id=str(uuid.uuid4()),
        project_id=project.project_id,
        article_pmid="12345678",
        triage_status="triaged",
        relevance_score=85,
        methodology_notes="Protocol extracted",
        triaged_by=user.user_id
    )
    triage2 = PaperTriage(
        triage_id=str(uuid.uuid4()),
        project_id=project.project_id,
        article_pmid="87654321",
        triage_status="triaged",
        relevance_score=45,
        triaged_by=user.user_id
    )
    db.add_all([triage1, triage2])
    
    # Create hypothesis evidence
    evidence = HypothesisEvidence(
        hypothesis_id=hypothesis.hypothesis_id,
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
        "hypothesis": hypothesis,
        "triage1": triage1,
        "triage2": triage2,
        "evidence": evidence
    }


def test_enrich_network_with_context(db, test_data):
    """Test enriching network with research context"""
    network_data = {
        "nodes": [
            {"pmid": "12345678", "title": "Paper 1"},
            {"pmid": "87654321", "title": "Paper 2"}
        ],
        "edges": []
    }
    
    enriched = NetworkContextIntegrationService.enrich_network_with_context(
        network_data,
        test_data["project"].project_id,
        db
    )
    
    assert len(enriched["nodes"]) == 2
    
    # Check first node (high relevance, has protocol, has evidence)
    node1 = enriched["nodes"][0]
    assert node1["relevance_score"] == 85
    assert node1["triage_status"] == "triaged"
    assert node1["has_protocol"] is True
    assert len(node1["supports_hypotheses"]) == 1
    assert node1["priority_score"] > 0
    
    # Check second node (low relevance, no protocol, no evidence)
    node2 = enriched["nodes"][1]
    assert node2["relevance_score"] == 45
    assert node2["triage_status"] == "triaged"
    assert node2["has_protocol"] is False
    assert len(node2["supports_hypotheses"]) == 0


def test_calculate_priority_score():
    """Test priority score calculation"""
    # High relevance, multiple evidence, has protocol
    score1 = NetworkContextIntegrationService._calculate_priority_score(90, 3, True)
    assert score1 > 0.7
    
    # Medium relevance, some evidence, no protocol
    score2 = NetworkContextIntegrationService._calculate_priority_score(60, 1, False)
    assert 0.3 < score2 < 0.7
    
    # Low relevance, no evidence, no protocol
    score3 = NetworkContextIntegrationService._calculate_priority_score(20, 0, False)
    assert score3 < 0.3
    
    # Verify ordering
    assert score1 > score2 > score3


def test_get_node_context(db, test_data):
    """Test getting full context for a node"""
    context = NetworkContextIntegrationService.get_node_context(
        "12345678",
        test_data["project"].project_id,
        db
    )
    
    assert context["pmid"] == "12345678"
    assert context["relevance_score"] == 85
    assert context["triage_status"] == "triaged"
    assert context["has_protocol"] is True
    assert len(context["supports_hypotheses"]) == 1
    assert context["evidence_count"] == 1
    
    # Check hypothesis details
    hyp = context["supports_hypotheses"][0]
    assert hyp["hypothesis_id"] == test_data["hypothesis"].hypothesis_id
    assert hyp["support_type"] == "supports"
    assert hyp["strength"] == "strong"


def test_filter_network_by_hypothesis(db, test_data):
    """Test filtering network by hypothesis"""
    network_data = {
        "nodes": [
            {"pmid": "12345678", "title": "Paper 1"},
            {"pmid": "87654321", "title": "Paper 2"},
            {"pmid": "99999999", "title": "Paper 3"}
        ],
        "edges": [
            {"source": "12345678", "target": "87654321"},
            {"source": "87654321", "target": "99999999"}
        ]
    }
    
    filtered = NetworkContextIntegrationService.filter_network_by_hypothesis(
        network_data,
        test_data["hypothesis"].hypothesis_id,
        db
    )
    
    # Only paper 1 supports the hypothesis
    assert len(filtered["nodes"]) == 1
    assert filtered["nodes"][0]["pmid"] == "12345678"
    
    # No edges (only one node)
    assert len(filtered["edges"]) == 0
    
    # Check filter metadata
    assert filtered["filter"]["type"] == "hypothesis"
    assert filtered["filter"]["hypothesis_id"] == test_data["hypothesis"].hypothesis_id
    assert filtered["filter"]["original_node_count"] == 3
    assert filtered["filter"]["filtered_node_count"] == 1

