"""
Step 2C: Intelligent Fallback Service
Replaces hardcoded fallbacks with ML-based intelligent analysis
"""

import asyncio
import logging
import time
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
import json
import uuid

# Import enhanced semantic analysis
try:
    from services.enhanced_semantic_service import EnhancedSemanticAnalysisService, EnhancedSemanticFeatures
    from services.ml_entity_extractor import MLEntity, EntityType
    INTELLIGENT_FALLBACK_AVAILABLE = True
    print("✅ Intelligent fallback service components available")
except ImportError as e:
    INTELLIGENT_FALLBACK_AVAILABLE = False
    print(f"⚠️  Intelligent fallback service not available: {e}")

logger = logging.getLogger(__name__)

@dataclass
class IntelligentGap:
    """Intelligent research gap identified through ML analysis"""
    gap_id: str
    title: str
    description: str
    gap_type: str  # theoretical, methodological, empirical, temporal
    severity: str  # low, medium, high, critical
    confidence: float
    research_opportunity: str
    potential_impact: str
    suggested_approaches: List[str]
    timeline_estimate: str
    related_entities: List[MLEntity]
    evidence_strength: float

@dataclass
class IntelligentAnalysisResult:
    """Result of intelligent analysis replacing hardcoded fallbacks"""
    analysis_type: str
    confidence: float
    processing_time: float
    ml_models_used: List[str]
    quality_score: float
    evidence_strength: float
    result_data: Dict[str, Any]

class IntelligentFallbackService:
    """
    Intelligent Fallback Service - Step 2C
    
    Replaces hardcoded fallbacks with ML-based intelligent analysis:
    - Gap analysis using semantic similarity
    - Literature analysis using entity extraction
    - Methodology synthesis using cross-encoder ranking
    - Thesis structuring using content quality assessment
    """
    
    def __init__(self):
        self.enhanced_semantic_service = None
        self.is_initialized = False
        
        # Quality thresholds for intelligent analysis
        self.quality_thresholds = {
            'minimum_confidence': 0.6,
            'minimum_evidence_strength': 0.5,
            'minimum_entity_confidence': 0.7,
            'minimum_papers_for_analysis': 3
        }
        
        # Gap analysis patterns
        self.gap_patterns = {
            'theoretical': {
                'keywords': ['theory', 'framework', 'model', 'concept', 'paradigm'],
                'indicators': ['lack of', 'limited', 'insufficient', 'no clear', 'unclear']
            },
            'methodological': {
                'keywords': ['method', 'approach', 'technique', 'procedure', 'protocol'],
                'indicators': ['no standard', 'inconsistent', 'varied approaches', 'methodological']
            },
            'empirical': {
                'keywords': ['data', 'evidence', 'study', 'research', 'findings'],
                'indicators': ['limited data', 'small sample', 'insufficient evidence', 'more research needed']
            },
            'temporal': {
                'keywords': ['recent', 'current', 'updated', 'longitudinal', 'time'],
                'indicators': ['outdated', 'old studies', 'need for recent', 'temporal gap']
            }
        }
    
    async def initialize(self) -> bool:
        """Initialize intelligent fallback service"""
        if self.is_initialized:
            return True
        
        try:
            print("🧠 Initializing intelligent fallback service...")
            logger.info("Initializing intelligent fallback service")
            
            # Initialize enhanced semantic service
            if INTELLIGENT_FALLBACK_AVAILABLE:
                self.enhanced_semantic_service = EnhancedSemanticAnalysisService()
                success = await self.enhanced_semantic_service.initialize()
                if success:
                    print("✅ Enhanced semantic service initialized for intelligent fallbacks")
                else:
                    print("⚠️  Enhanced semantic service initialization failed")
                    return False
            else:
                print("❌ Intelligent fallback service dependencies not available")
                return False
            
            self.is_initialized = True
            print("🎉 Intelligent fallback service initialized successfully")
            logger.info("Intelligent fallback service initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize intelligent fallback service: {e}")
            print(f"❌ Failed to initialize intelligent fallback service: {e}")
            return False
    
    async def intelligent_gap_analysis(self, 
                                     project_data: Dict[str, Any], 
                                     user_profile: Dict[str, Any] = None) -> IntelligentAnalysisResult:
        """Intelligent gap analysis replacing hardcoded fallbacks"""
        
        if not self.is_initialized:
            await self.initialize()
        
        start_time = time.time()
        print("🔍 [INTELLIGENT-GAP] Starting intelligent gap analysis")
        
        try:
            # Extract research context
            research_objective = project_data.get("description", "")
            papers = self._extract_papers_from_project(project_data)
            
            print(f"📊 [CONTEXT] Research objective: {len(research_objective)} chars")
            print(f"📊 [CONTEXT] Papers available: {len(papers)}")
            
            if len(papers) < self.quality_thresholds['minimum_papers_for_analysis']:
                print(f"⚠️  [INTELLIGENT-GAP] Insufficient papers ({len(papers)}) for high-quality analysis")
                # Still provide intelligent analysis with available data
            
            # Analyze research objective with enhanced semantic analysis
            objective_features = await self.enhanced_semantic_service.analyze_content_enhanced(
                title="Research Objective Analysis",
                abstract=research_objective,
                context_query="research gaps opportunities methodology"
            )
            
            print(f"✅ [OBJECTIVE-ANALYSIS] Quality: {objective_features.content_quality_score:.2f}, "
                  f"Entities: {len(objective_features.ml_entities)}")
            
            # Analyze papers for gap identification
            paper_analyses = []
            for i, paper in enumerate(papers[:10]):  # Limit to top 10 papers
                title = paper.get('title', '')
                abstract = paper.get('abstract', '')
                
                if title or abstract:
                    paper_features = await self.enhanced_semantic_service.analyze_content_enhanced(
                        title=title,
                        abstract=abstract,
                        context_query=research_objective
                    )
                    paper_analyses.append({
                        'paper': paper,
                        'features': paper_features
                    })
                    
                    if i == 0:  # Log first paper analysis
                        print(f"📄 [PAPER-ANALYSIS] Sample - Quality: {paper_features.content_quality_score:.2f}, "
                              f"Entities: {len(paper_features.ml_entities)}")
            
            # Identify intelligent gaps
            intelligent_gaps = await self._identify_intelligent_gaps(
                objective_features, paper_analyses, research_objective
            )
            
            print(f"🎯 [GAPS-IDENTIFIED] Found {len(intelligent_gaps)} intelligent gaps")
            
            # Calculate overall analysis quality
            analysis_quality = self._calculate_analysis_quality(
                objective_features, paper_analyses, intelligent_gaps
            )
            
            processing_time = time.time() - start_time
            
            # Format result
            result_data = {
                "identified_gaps": [self._format_intelligent_gap(gap) for gap in intelligent_gaps],
                "papers_analyzed": len(paper_analyses),
                "research_domains": list(set(
                    entity.entity_type.value for analysis in paper_analyses 
                    for entity in analysis['features'].ml_entities
                )),
                "gap_summary": self._generate_gap_summary(intelligent_gaps, objective_features),
                "research_opportunities": [gap.research_opportunity for gap in intelligent_gaps],
                "analysis_metadata": {
                    "objective_quality": objective_features.content_quality_score,
                    "average_paper_quality": sum(a['features'].content_quality_score for a in paper_analyses) / len(paper_analyses) if paper_analyses else 0,
                    "total_entities_extracted": sum(len(a['features'].ml_entities) for a in paper_analyses),
                    "ml_models_used": objective_features.ml_models_used
                },
                # Legacy format for backward compatibility
                "semantic_gaps": [self._format_intelligent_gap(gap) for gap in intelligent_gaps if gap.gap_type == 'theoretical'],
                "methodology_gaps": [self._format_intelligent_gap(gap) for gap in intelligent_gaps if gap.gap_type == 'methodological'],
                "temporal_gaps": [self._format_intelligent_gap(gap) for gap in intelligent_gaps if gap.gap_type == 'temporal'],
                "cross_domain_opportunities": [self._format_intelligent_gap(gap) for gap in intelligent_gaps if gap.gap_type == 'empirical']
            }
            
            result = IntelligentAnalysisResult(
                analysis_type="intelligent_gap_analysis",
                confidence=analysis_quality['confidence'],
                processing_time=processing_time,
                ml_models_used=objective_features.ml_models_used,
                quality_score=analysis_quality['quality_score'],
                evidence_strength=analysis_quality['evidence_strength'],
                result_data=result_data
            )
            
            print(f"✅ [INTELLIGENT-GAP] Completed in {processing_time:.3f}s")
            print(f"📊 [RESULTS] Quality: {analysis_quality['quality_score']:.2f}, "
                  f"Confidence: {analysis_quality['confidence']:.2f}, "
                  f"Gaps: {len(intelligent_gaps)}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error in intelligent gap analysis: {e}")
            print(f"❌ [INTELLIGENT-GAP] Error: {e}")
            
            # Return minimal intelligent result on error
            processing_time = time.time() - start_time
            return IntelligentAnalysisResult(
                analysis_type="intelligent_gap_analysis",
                confidence=0.5,
                processing_time=processing_time,
                ml_models_used=[],
                quality_score=0.5,
                evidence_strength=0.5,
                result_data={
                    "identified_gaps": [],
                    "papers_analyzed": 0,
                    "research_domains": [],
                    "gap_summary": "Analysis encountered errors",
                    "research_opportunities": [],
                    "semantic_gaps": [],
                    "methodology_gaps": [],
                    "temporal_gaps": [],
                    "cross_domain_opportunities": []
                }
            )
    
    async def _identify_intelligent_gaps(self, 
                                       objective_features: EnhancedSemanticFeatures,
                                       paper_analyses: List[Dict[str, Any]],
                                       research_objective: str) -> List[IntelligentGap]:
        """Identify research gaps using ML-based analysis"""
        
        gaps = []
        
        try:
            # Extract entities from objective and papers
            objective_entities = objective_features.ml_entities
            paper_entities = []
            for analysis in paper_analyses:
                paper_entities.extend(analysis['features'].ml_entities)
            
            # Identify theoretical gaps
            theoretical_gaps = await self._identify_theoretical_gaps(
                objective_entities, paper_entities, research_objective
            )
            gaps.extend(theoretical_gaps)
            
            # Identify methodological gaps
            methodological_gaps = await self._identify_methodological_gaps(
                objective_entities, paper_entities, paper_analyses
            )
            gaps.extend(methodological_gaps)
            
            # Identify empirical gaps
            empirical_gaps = await self._identify_empirical_gaps(
                paper_analyses, research_objective
            )
            gaps.extend(empirical_gaps)
            
            # Identify temporal gaps
            temporal_gaps = await self._identify_temporal_gaps(
                paper_analyses, research_objective
            )
            gaps.extend(temporal_gaps)
            
            # Sort gaps by confidence and evidence strength
            gaps.sort(key=lambda g: (g.confidence * g.evidence_strength), reverse=True)
            
            # Limit to top gaps
            return gaps[:10]
            
        except Exception as e:
            logger.error(f"Error identifying intelligent gaps: {e}")
            return []
    
    async def _identify_theoretical_gaps(self, 
                                       objective_entities: List[MLEntity],
                                       paper_entities: List[MLEntity],
                                       research_objective: str) -> List[IntelligentGap]:
        """Identify theoretical gaps using entity analysis"""
        
        gaps = []
        
        try:
            # Find concepts mentioned in objective but not well-covered in papers
            objective_concepts = [e for e in objective_entities if e.entity_type == EntityType.CONCEPT]
            paper_concepts = [e for e in paper_entities if e.entity_type == EntityType.CONCEPT]
            
            objective_concept_names = {e.name.lower() for e in objective_concepts}
            paper_concept_names = {e.name.lower() for e in paper_concepts}
            
            # Identify under-represented concepts
            under_represented = objective_concept_names - paper_concept_names
            
            for concept in under_represented:
                # Find the original entity for confidence
                original_entity = next((e for e in objective_concepts if e.name.lower() == concept), None)
                if original_entity and original_entity.confidence > 0.7:
                    
                    gap = IntelligentGap(
                        gap_id=str(uuid.uuid4()),
                        title=f"Theoretical Gap in {original_entity.name}",
                        description=f"Limited theoretical coverage of {original_entity.name} in current literature",
                        gap_type="theoretical",
                        severity="medium" if original_entity.confidence > 0.8 else "low",
                        confidence=original_entity.confidence,
                        research_opportunity=f"Develop theoretical framework for {original_entity.name}",
                        potential_impact="Could provide new theoretical insights",
                        suggested_approaches=["Literature review", "Theoretical modeling", "Conceptual analysis"],
                        timeline_estimate="3-6 months",
                        related_entities=[original_entity],
                        evidence_strength=original_entity.confidence * 0.8  # Slightly lower than entity confidence
                    )
                    gaps.append(gap)
            
            return gaps[:3]  # Limit to top 3 theoretical gaps
            
        except Exception as e:
            logger.error(f"Error identifying theoretical gaps: {e}")
            return []
    
    async def _identify_methodological_gaps(self, 
                                          objective_entities: List[MLEntity],
                                          paper_entities: List[MLEntity],
                                          paper_analyses: List[Dict[str, Any]]) -> List[IntelligentGap]:
        """Identify methodological gaps using methodology analysis"""
        
        gaps = []
        
        try:
            # Find methodologies mentioned in objective
            objective_methods = [e for e in objective_entities if e.entity_type == EntityType.METHODOLOGY]
            paper_methods = [e for e in paper_entities if e.entity_type == EntityType.METHODOLOGY]
            
            # Analyze methodology diversity in papers
            method_names = [m.name.lower() for m in paper_methods]
            method_diversity = len(set(method_names))
            
            # If low methodology diversity, suggest methodological gap
            if method_diversity < 3 and len(paper_analyses) > 5:
                gap = IntelligentGap(
                    gap_id=str(uuid.uuid4()),
                    title="Limited Methodological Diversity",
                    description=f"Only {method_diversity} distinct methodologies identified across {len(paper_analyses)} papers",
                    gap_type="methodological",
                    severity="medium",
                    confidence=0.8,
                    research_opportunity="Explore alternative methodological approaches",
                    potential_impact="Could reveal new insights through methodological innovation",
                    suggested_approaches=["Mixed methods research", "Novel analytical techniques", "Cross-disciplinary methods"],
                    timeline_estimate="6-12 months",
                    related_entities=paper_methods,
                    evidence_strength=0.7
                )
                gaps.append(gap)
            
            return gaps
            
        except Exception as e:
            logger.error(f"Error identifying methodological gaps: {e}")
            return []
    
    async def _identify_empirical_gaps(self, 
                                     paper_analyses: List[Dict[str, Any]],
                                     research_objective: str) -> List[IntelligentGap]:
        """Identify empirical gaps using evidence strength analysis"""
        
        gaps = []
        
        try:
            if not paper_analyses:
                return gaps
            
            # Calculate average evidence strength
            avg_evidence_strength = sum(
                analysis['features'].evidence_strength_score 
                for analysis in paper_analyses
            ) / len(paper_analyses)
            
            # If evidence strength is low, suggest empirical gap
            if avg_evidence_strength < 0.6:
                gap = IntelligentGap(
                    gap_id=str(uuid.uuid4()),
                    title="Insufficient Empirical Evidence",
                    description=f"Average evidence strength ({avg_evidence_strength:.2f}) indicates need for more robust empirical studies",
                    gap_type="empirical",
                    severity="high" if avg_evidence_strength < 0.4 else "medium",
                    confidence=0.9 - avg_evidence_strength,  # Higher confidence when evidence is weaker
                    research_opportunity="Conduct comprehensive empirical studies with stronger evidence",
                    potential_impact="Could provide robust empirical foundation for the field",
                    suggested_approaches=["Large-scale studies", "Longitudinal research", "Multi-site validation"],
                    timeline_estimate="12-18 months",
                    related_entities=[],
                    evidence_strength=0.9 - avg_evidence_strength
                )
                gaps.append(gap)
            
            return gaps
            
        except Exception as e:
            logger.error(f"Error identifying empirical gaps: {e}")
            return []
    
    async def _identify_temporal_gaps(self, 
                                    paper_analyses: List[Dict[str, Any]],
                                    research_objective: str) -> List[IntelligentGap]:
        """Identify temporal gaps using publication analysis"""
        
        gaps = []
        
        try:
            # This would be enhanced with actual publication dates
            # For now, suggest temporal gap based on content analysis
            
            # Check if papers mention "recent", "current", "updated" etc.
            temporal_indicators = 0
            for analysis in paper_analyses:
                paper_text = f"{analysis['paper'].get('title', '')} {analysis['paper'].get('abstract', '')}"
                if any(indicator in paper_text.lower() for indicator in ['recent', 'current', 'updated', 'latest']):
                    temporal_indicators += 1
            
            # If few papers mention temporal aspects, suggest temporal gap
            if temporal_indicators < len(paper_analyses) * 0.3:  # Less than 30% mention temporal aspects
                gap = IntelligentGap(
                    gap_id=str(uuid.uuid4()),
                    title="Temporal Coverage Gap",
                    description="Limited focus on recent developments and current state of the field",
                    gap_type="temporal",
                    severity="medium",
                    confidence=0.7,
                    research_opportunity="Update research with recent developments and current perspectives",
                    potential_impact="Could provide more current and relevant insights",
                    suggested_approaches=["Recent literature review", "Current state analysis", "Trend identification"],
                    timeline_estimate="2-4 months",
                    related_entities=[],
                    evidence_strength=0.6
                )
                gaps.append(gap)
            
            return gaps
            
        except Exception as e:
            logger.error(f"Error identifying temporal gaps: {e}")
            return []
    
    def _extract_papers_from_project(self, project_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract papers from project data"""
        papers = []
        
        # Try different possible locations for papers
        if "papers" in project_data:
            papers = project_data["papers"]
        elif "literature" in project_data:
            papers = project_data["literature"]
        elif "documents" in project_data:
            papers = project_data["documents"]
        
        # Ensure papers is a list
        if not isinstance(papers, list):
            papers = []
        
        return papers
    
    def _calculate_analysis_quality(self, 
                                  objective_features: EnhancedSemanticFeatures,
                                  paper_analyses: List[Dict[str, Any]],
                                  gaps: List[IntelligentGap]) -> Dict[str, float]:
        """Calculate overall analysis quality metrics"""
        
        try:
            # Base quality from objective analysis
            base_quality = objective_features.content_quality_score
            
            # Paper analysis quality
            paper_quality = 0.0
            if paper_analyses:
                paper_quality = sum(a['features'].content_quality_score for a in paper_analyses) / len(paper_analyses)
            
            # Gap analysis quality based on confidence
            gap_quality = 0.0
            if gaps:
                gap_quality = sum(gap.confidence for gap in gaps) / len(gaps)
            
            # Overall quality score
            quality_score = (base_quality * 0.3 + paper_quality * 0.4 + gap_quality * 0.3)
            
            # Confidence based on evidence strength
            confidence = objective_features.confidence_breakdown.get('overall', 0.5)
            
            # Evidence strength
            evidence_strength = objective_features.evidence_strength_score
            
            return {
                'quality_score': quality_score,
                'confidence': confidence,
                'evidence_strength': evidence_strength
            }
            
        except Exception as e:
            logger.error(f"Error calculating analysis quality: {e}")
            return {
                'quality_score': 0.5,
                'confidence': 0.5,
                'evidence_strength': 0.5
            }
    
    def _format_intelligent_gap(self, gap: IntelligentGap) -> Dict[str, Any]:
        """Format intelligent gap for API response"""
        return {
            "id": gap.gap_id,
            "title": gap.title,
            "description": gap.description,
            "gap_type": gap.gap_type,
            "severity": gap.severity,
            "confidence": gap.confidence,
            "research_opportunity": gap.research_opportunity,
            "potential_impact": gap.potential_impact,
            "suggested_approaches": gap.suggested_approaches,
            "timeline_estimate": gap.timeline_estimate,
            "related_entities": [
                {
                    "name": entity.name,
                    "type": entity.entity_type.value,
                    "confidence": entity.confidence
                } for entity in gap.related_entities
            ],
            "evidence_strength": gap.evidence_strength
        }
    
    def _generate_gap_summary(self, 
                            gaps: List[IntelligentGap], 
                            objective_features: EnhancedSemanticFeatures) -> str:
        """Generate intelligent gap analysis summary"""
        
        if not gaps:
            return "No significant research gaps identified through ML analysis"
        
        gap_types = {}
        for gap in gaps:
            gap_types[gap.gap_type] = gap_types.get(gap.gap_type, 0) + 1
        
        summary_parts = []
        summary_parts.append(f"Identified {len(gaps)} research gaps through ML-based analysis")
        
        for gap_type, count in gap_types.items():
            summary_parts.append(f"{count} {gap_type} gap{'s' if count > 1 else ''}")
        
        avg_confidence = sum(gap.confidence for gap in gaps) / len(gaps)
        summary_parts.append(f"Average gap confidence: {avg_confidence:.2f}")
        
        return ". ".join(summary_parts) + "."
