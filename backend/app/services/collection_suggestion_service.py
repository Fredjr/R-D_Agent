"""
Collection Suggestion Service

Phase 3, Feature 3.1: Smart Collection Suggestions
Analyzes triage data to suggest creating collections based on patterns.

This service uses $0 LLM costs - it analyzes existing AI-generated triage data.
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
import uuid

from database import PaperTriage, Hypothesis, ResearchQuestion, Collection


class CollectionSuggestion:
    """Data class for collection suggestions"""
    
    def __init__(
        self,
        suggestion_id: str,
        project_id: str,
        suggestion_type: str,
        collection_name: str,
        description: str,
        article_pmids: List[str],
        paper_count: int,
        linked_hypothesis_ids: Optional[List[str]] = None,
        linked_question_ids: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.suggestion_id = suggestion_id
        self.project_id = project_id
        self.suggestion_type = suggestion_type
        self.collection_name = collection_name
        self.description = description
        self.article_pmids = article_pmids
        self.paper_count = paper_count
        self.linked_hypothesis_ids = linked_hypothesis_ids or []
        self.linked_question_ids = linked_question_ids or []
        self.metadata = metadata or {}
        self.created_at = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            'suggestion_id': self.suggestion_id,
            'project_id': self.project_id,
            'suggestion_type': self.suggestion_type,
            'collection_name': self.collection_name,
            'description': self.description,
            'article_pmids': self.article_pmids,
            'paper_count': self.paper_count,
            'linked_hypothesis_ids': self.linked_hypothesis_ids,
            'linked_question_ids': self.linked_question_ids,
            'metadata': self.metadata,
            'created_at': self.created_at.isoformat()
        }


class CollectionSuggestionService:
    """Service for generating smart collection suggestions"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def suggest_collections_from_triage(
        self,
        project_id: str,
        min_papers: int = 5
    ) -> List[CollectionSuggestion]:
        """
        Analyze triage data and suggest collections
        
        Args:
            project_id: Project ID
            min_papers: Minimum number of papers to suggest a collection (default: 5)
        
        Returns:
            List of collection suggestions
        """
        suggestions = []
        
        # Get all triaged papers for this project
        triages = self.db.query(PaperTriage).filter(
            PaperTriage.project_id == project_id,
            PaperTriage.triage_status == 'must_read'
        ).all()
        
        if not triages:
            return suggestions
        
        # Suggestion 1: Group by hypothesis
        hypothesis_suggestions = self._suggest_by_hypothesis(project_id, triages, min_papers)
        suggestions.extend(hypothesis_suggestions)
        
        # Suggestion 2: Group by research question
        question_suggestions = self._suggest_by_question(project_id, triages, min_papers)
        suggestions.extend(question_suggestions)
        
        # Suggestion 3: High-impact papers (relevance_score >= 80)
        high_impact_suggestion = self._suggest_high_impact(project_id, triages, min_papers)
        if high_impact_suggestion:
            suggestions.append(high_impact_suggestion)
        
        return suggestions
    
    def _suggest_by_hypothesis(
        self,
        project_id: str,
        triages: List[PaperTriage],
        min_papers: int
    ) -> List[CollectionSuggestion]:
        """Suggest collections grouped by hypothesis"""
        suggestions = []
        
        # Group papers by hypothesis
        papers_by_hypothesis = {}
        for triage in triages:
            affected_hypotheses = triage.affected_hypotheses or []
            for hyp_id in affected_hypotheses:
                if hyp_id not in papers_by_hypothesis:
                    papers_by_hypothesis[hyp_id] = []
                papers_by_hypothesis[hyp_id].append(triage.article_pmid)
        
        # Create suggestions for hypotheses with enough papers
        for hyp_id, pmids in papers_by_hypothesis.items():
            if len(pmids) >= min_papers:
                hypothesis = self.db.query(Hypothesis).filter(
                    Hypothesis.hypothesis_id == hyp_id
                ).first()
                
                if hypothesis:
                    suggestion = CollectionSuggestion(
                        suggestion_id=str(uuid.uuid4()),
                        project_id=project_id,
                        suggestion_type='hypothesis',
                        collection_name=f'Evidence: {hypothesis.hypothesis_text[:50]}...',
                        description=f'Papers supporting hypothesis: {hypothesis.hypothesis_text}',
                        article_pmids=pmids,
                        paper_count=len(pmids),
                        linked_hypothesis_ids=[hyp_id],
                        metadata={
                            'hypothesis_text': hypothesis.hypothesis_text,
                            'hypothesis_type': hypothesis.hypothesis_type
                        }
                    )
                    suggestions.append(suggestion)
        
        return suggestions

    def _suggest_by_question(
        self,
        project_id: str,
        triages: List[PaperTriage],
        min_papers: int
    ) -> List[CollectionSuggestion]:
        """Suggest collections grouped by research question"""
        suggestions = []

        # Group papers by question
        papers_by_question = {}
        for triage in triages:
            affected_questions = triage.affected_questions or []
            for q_id in affected_questions:
                if q_id not in papers_by_question:
                    papers_by_question[q_id] = []
                papers_by_question[q_id].append(triage.article_pmid)

        # Create suggestions for questions with enough papers
        for q_id, pmids in papers_by_question.items():
            if len(pmids) >= min_papers:
                question = self.db.query(ResearchQuestion).filter(
                    ResearchQuestion.question_id == q_id
                ).first()

                if question:
                    suggestion = CollectionSuggestion(
                        suggestion_id=str(uuid.uuid4()),
                        project_id=project_id,
                        suggestion_type='question',
                        collection_name=f'Research: {question.question_text[:50]}...',
                        description=f'Papers addressing question: {question.question_text}',
                        article_pmids=pmids,
                        paper_count=len(pmids),
                        linked_question_ids=[q_id],
                        metadata={
                            'question_text': question.question_text,
                            'question_type': question.question_type
                        }
                    )
                    suggestions.append(suggestion)

        return suggestions

    def _suggest_high_impact(
        self,
        project_id: str,
        triages: List[PaperTriage],
        min_papers: int
    ) -> Optional[CollectionSuggestion]:
        """Suggest collection of high-impact papers (relevance_score >= 80)"""
        high_impact_pmids = [
            triage.article_pmid
            for triage in triages
            if triage.relevance_score and triage.relevance_score >= 80
        ]

        if len(high_impact_pmids) >= min_papers:
            return CollectionSuggestion(
                suggestion_id=str(uuid.uuid4()),
                project_id=project_id,
                suggestion_type='high_impact',
                collection_name='High-Impact Papers',
                description=f'Top {len(high_impact_pmids)} papers with relevance score ≥ 80',
                article_pmids=high_impact_pmids,
                paper_count=len(high_impact_pmids),
                metadata={
                    'min_relevance_score': 80,
                    'avg_relevance_score': sum(
                        t.relevance_score for t in triages if t.article_pmid in high_impact_pmids
                    ) / len(high_impact_pmids)
                }
            )

        return None

    def create_collection_from_suggestion(
        self,
        suggestion: CollectionSuggestion,
        user_id: str
    ) -> Collection:
        """
        Create a collection from a suggestion

        Args:
            suggestion: Collection suggestion
            user_id: User ID creating the collection

        Returns:
            Created collection
        """
        # Create collection
        collection = Collection(
            collection_id=str(uuid.uuid4()),
            project_id=suggestion.project_id,
            collection_name=suggestion.collection_name,
            description=suggestion.description,
            created_by=user_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            article_pmids=suggestion.article_pmids,
            linked_hypothesis_ids=suggestion.linked_hypothesis_ids,
            linked_question_ids=suggestion.linked_question_ids
        )

        self.db.add(collection)
        self.db.commit()
        self.db.refresh(collection)

        return collection

