#!/usr/bin/env python3
"""
LangGraph Orchestration System - PhD Analysis Workflow
Implements systematic workflow control with quality gates and iterative improvement
"""

import logging
import asyncio
from typing import Dict, List, Any, Optional, TypedDict
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)

# Try to import LangGraph components
try:
    from langgraph.graph import StateGraph, END
    from langgraph.prebuilt import ToolExecutor
    LANGGRAPH_AVAILABLE = True
except ImportError:
    logger.warning("LangGraph not available, using fallback orchestration")
    StateGraph = None
    END = None
    ToolExecutor = None
    LANGGRAPH_AVAILABLE = False

class AnalysisState(TypedDict):
    """State object for PhD analysis workflow"""
    # Input
    query: str
    analysis_type: str
    project_context: Dict[str, Any]
    
    # Workflow state
    current_step: str
    iteration_count: int
    quality_score: float
    
    # Data
    raw_papers: List[Dict[str, Any]]
    reranked_papers: List[Dict[str, Any]]
    compressed_context: str
    extracted_entities: List[Dict[str, Any]]
    
    # Outputs
    draft_analysis: str
    critique_result: Dict[str, Any]
    final_analysis: str
    
    # Metadata
    workflow_metadata: Dict[str, Any]
    error_log: List[str]

@dataclass
class WorkflowNode:
    """Represents a node in the PhD analysis workflow"""
    name: str
    description: str
    required_inputs: List[str]
    outputs: List[str]
    quality_gate: bool = False
    max_retries: int = 2

class PhDAnalysisOrchestrator:
    """
    Orchestrates PhD analysis workflow using LangGraph or fallback system
    
    Workflow: Plan → Retrieve → Rerank → Compress → Extract → Draft → Critique → Revise → Verify → Finalize
    """
    
    def __init__(self, llm, use_langgraph: bool = True):
        self.llm = llm
        self.use_langgraph = use_langgraph and LANGGRAPH_AVAILABLE
        
        # Define workflow nodes
        self.workflow_nodes = {
            "plan": WorkflowNode(
                name="plan",
                description="Plan retrieval strategy and context assembly",
                required_inputs=["query", "analysis_type", "project_context"],
                outputs=["retrieval_plan", "context_strategy"]
            ),
            "retrieve": WorkflowNode(
                name="retrieve",
                description="Retrieve relevant papers and documents",
                required_inputs=["retrieval_plan"],
                outputs=["raw_papers"]
            ),
            "rerank": WorkflowNode(
                name="rerank",
                description="Rerank papers using cross-encoder for relevance",
                required_inputs=["raw_papers", "query"],
                outputs=["reranked_papers"]
            ),
            "compress": WorkflowNode(
                name="compress",
                description="Compress context to focus on relevant content",
                required_inputs=["reranked_papers", "query"],
                outputs=["compressed_context"]
            ),
            "extract": WorkflowNode(
                name="extract",
                description="Extract entities and key information",
                required_inputs=["compressed_context"],
                outputs=["extracted_entities"]
            ),
            "draft": WorkflowNode(
                name="draft",
                description="Generate initial analysis draft",
                required_inputs=["compressed_context", "extracted_entities", "query"],
                outputs=["draft_analysis"]
            ),
            "critique": WorkflowNode(
                name="critique",
                description="Evaluate draft quality against PhD standards",
                required_inputs=["draft_analysis", "query"],
                outputs=["critique_result"],
                quality_gate=True
            ),
            "revise": WorkflowNode(
                name="revise",
                description="Revise analysis based on critique feedback",
                required_inputs=["draft_analysis", "critique_result"],
                outputs=["revised_analysis"]
            ),
            "verify": WorkflowNode(
                name="verify",
                description="Final quality verification and validation",
                required_inputs=["revised_analysis"],
                outputs=["verification_result"],
                quality_gate=True
            ),
            "finalize": WorkflowNode(
                name="finalize",
                description="Finalize analysis with metadata and formatting",
                required_inputs=["revised_analysis", "verification_result"],
                outputs=["final_analysis"]
            )
        }
        
        if self.use_langgraph:
            self.graph = self._build_langgraph_workflow()
        else:
            self.graph = None
        
        logger.info(f"✅ PhD Analysis Orchestrator initialized (LangGraph: {'✅' if self.use_langgraph else '❌'})")
    
    def _build_langgraph_workflow(self) -> StateGraph:
        """Build LangGraph workflow"""
        
        if not LANGGRAPH_AVAILABLE:
            return None
        
        # Create state graph
        workflow = StateGraph(AnalysisState)
        
        # Add nodes
        workflow.add_node("plan", self._plan_node)
        workflow.add_node("retrieve", self._retrieve_node)
        workflow.add_node("rerank", self._rerank_node)
        workflow.add_node("compress", self._compress_node)
        workflow.add_node("extract", self._extract_node)
        workflow.add_node("draft", self._draft_node)
        workflow.add_node("critique", self._critique_node)
        workflow.add_node("revise", self._revise_node)
        workflow.add_node("verify", self._verify_node)
        workflow.add_node("finalize", self._finalize_node)
        
        # Define workflow edges
        workflow.set_entry_point("plan")
        workflow.add_edge("plan", "retrieve")
        workflow.add_edge("retrieve", "rerank")
        workflow.add_edge("rerank", "compress")
        workflow.add_edge("compress", "extract")
        workflow.add_edge("extract", "draft")
        workflow.add_edge("draft", "critique")
        
        # Conditional edge for critique result
        workflow.add_conditional_edges(
            "critique",
            self._should_revise,
            {
                "revise": "revise",
                "verify": "verify"
            }
        )
        
        workflow.add_edge("revise", "critique")  # Loop back for re-critique
        workflow.add_edge("verify", "finalize")
        workflow.add_edge("finalize", END)
        
        return workflow.compile()
    
    async def run_analysis(self, 
                          query: str,
                          analysis_type: str = "generate_review",
                          project_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Run complete PhD analysis workflow"""
        
        # Initialize state
        initial_state = AnalysisState(
            query=query,
            analysis_type=analysis_type,
            project_context=project_context or {},
            current_step="plan",
            iteration_count=0,
            quality_score=0.0,
            raw_papers=[],
            reranked_papers=[],
            compressed_context="",
            extracted_entities=[],
            draft_analysis="",
            critique_result={},
            final_analysis="",
            workflow_metadata={},
            error_log=[]
        )
        
        if self.use_langgraph and self.graph:
            # Use LangGraph workflow
            logger.info("🚀 Running LangGraph orchestrated workflow")
            result = await self.graph.ainvoke(initial_state)
        else:
            # Use fallback sequential workflow
            logger.info("🚀 Running fallback sequential workflow")
            result = await self._run_fallback_workflow(initial_state)
        
        return result
    
    async def _run_fallback_workflow(self, state: AnalysisState) -> AnalysisState:
        """Fallback workflow when LangGraph is not available"""
        
        try:
            # Sequential execution of workflow nodes
            state = await self._plan_node(state)
            state = await self._retrieve_node(state)
            state = await self._rerank_node(state)
            state = await self._compress_node(state)
            state = await self._extract_node(state)
            state = await self._draft_node(state)
            
            # Critique-revise loop
            max_revisions = 2
            for revision in range(max_revisions):
                state = await self._critique_node(state)
                
                if state["critique_result"].get("meets_threshold", False):
                    break
                
                if revision < max_revisions - 1:  # Don't revise on last iteration
                    state = await self._revise_node(state)
                    state["iteration_count"] += 1
            
            state = await self._verify_node(state)
            state = await self._finalize_node(state)
            
            logger.info("✅ Fallback workflow completed successfully")
            
        except Exception as e:
            logger.error(f"Workflow execution failed: {e}")
            state["error_log"].append(f"Workflow error: {str(e)}")
        
        return state
    
    # Workflow node implementations
    async def _plan_node(self, state: AnalysisState) -> AnalysisState:
        """Plan retrieval strategy and context assembly"""
        state["current_step"] = "plan"
        
        # Create retrieval plan based on query and analysis type
        retrieval_plan = {
            "query_expansion": True,
            "max_papers": 20,
            "date_filter": "last_5_years",
            "quality_filter": True
        }
        
        state["workflow_metadata"]["retrieval_plan"] = retrieval_plan
        logger.info("📋 Planning phase completed")
        return state
    
    async def _retrieve_node(self, state: AnalysisState) -> AnalysisState:
        """Retrieve relevant papers and documents"""
        state["current_step"] = "retrieve"
        
        # Simulate paper retrieval (integrate with existing PubMed tools)
        try:
            from main import _harvest_pubmed
            import time
            
            papers = _harvest_pubmed(state["query"], time.time() + 30.0)
            state["raw_papers"] = papers[:20]  # Limit to top 20
            
            logger.info(f"📚 Retrieved {len(state['raw_papers'])} papers")
            
        except Exception as e:
            logger.error(f"Paper retrieval failed: {e}")
            state["error_log"].append(f"Retrieval error: {str(e)}")
            state["raw_papers"] = []
        
        return state
    
    async def _rerank_node(self, state: AnalysisState) -> AnalysisState:
        """Rerank papers using cross-encoder for relevance"""
        state["current_step"] = "rerank"
        
        try:
            from cross_encoder_reranking import rerank_retrieved_chunks
            
            # Convert papers to chunks for reranking
            chunks = []
            for paper in state["raw_papers"]:
                chunk = {
                    'id': paper.get('pmid', paper.get('id', 'unknown')),
                    'content': f"{paper.get('title', '')} {paper.get('abstract', '')}",
                    'score': 1.0,
                    'metadata': paper
                }
                chunks.append(chunk)
            
            # Rerank chunks
            reranked_chunks = rerank_retrieved_chunks(state["query"], chunks, top_k=10)
            
            # Convert back to papers
            state["reranked_papers"] = [chunk.metadata for chunk in reranked_chunks]
            
            logger.info(f"🎯 Reranked to {len(state['reranked_papers'])} relevant papers")
            
        except Exception as e:
            logger.error(f"Reranking failed: {e}")
            state["error_log"].append(f"Reranking error: {str(e)}")
            state["reranked_papers"] = state["raw_papers"][:10]  # Fallback
        
        return state
    
    async def _compress_node(self, state: AnalysisState) -> AnalysisState:
        """Compress context to focus on relevant content"""
        state["current_step"] = "compress"
        
        try:
            from contextual_compression import compress_retrieved_chunks
            
            # Convert papers to chunks for compression
            chunks = []
            for paper in state["reranked_papers"]:
                chunk = {
                    'id': paper.get('pmid', paper.get('id', 'unknown')),
                    'content': f"{paper.get('title', '')} {paper.get('abstract', '')}",
                    'metadata': paper
                }
                chunks.append(chunk)
            
            # Compress chunks
            compressed_chunks = compress_retrieved_chunks(state["query"], chunks, self.llm)
            
            # Create compressed context string
            from contextual_compression import contextual_compressor
            state["compressed_context"] = contextual_compressor.create_compressed_context(
                compressed_chunks, max_total_chars=4000
            )
            
            logger.info(f"🗜️ Compressed context to {len(state['compressed_context'])} chars")
            
        except Exception as e:
            logger.error(f"Compression failed: {e}")
            state["error_log"].append(f"Compression error: {str(e)}")
            # Fallback: use raw paper abstracts
            abstracts = [paper.get('abstract', '')[:200] for paper in state["reranked_papers"]]
            state["compressed_context"] = "\n\n".join(abstracts)
        
        return state
    
    async def _extract_node(self, state: AnalysisState) -> AnalysisState:
        """Extract entities and key information"""
        state["current_step"] = "extract"
        
        # Simple entity extraction (can be enhanced with NER models)
        entities = []
        
        # Extract from compressed context
        content = state["compressed_context"].lower()
        
        # Common research entities
        frameworks = ['tensorflow', 'pytorch', 'scikit-learn', 'r', 'spss', 'stata']
        methods = ['regression', 'anova', 'chi-square', 'correlation', 't-test']
        
        for framework in frameworks:
            if framework in content:
                entities.append({"name": framework, "type": "framework", "context": "mentioned in literature"})
        
        for method in methods:
            if method in content:
                entities.append({"name": method, "type": "statistical_method", "context": "used in studies"})
        
        state["extracted_entities"] = entities
        logger.info(f"🏷️ Extracted {len(entities)} entities")
        
        return state
    
    async def _draft_node(self, state: AnalysisState) -> AnalysisState:
        """Generate initial analysis draft"""
        state["current_step"] = "draft"
        
        # Use existing analysis generation (simplified for orchestration)
        try:
            # This would integrate with existing generate-review logic
            draft = f"""
            Based on analysis of {len(state['reranked_papers'])} relevant papers, the following insights emerge:
            
            {state['compressed_context'][:1000]}
            
            Key entities identified: {', '.join([e['name'] for e in state['extracted_entities']])}
            
            This analysis addresses the query: {state['query']}
            """
            
            state["draft_analysis"] = draft
            logger.info(f"✍️ Generated draft analysis ({len(draft)} chars)")
            
        except Exception as e:
            logger.error(f"Draft generation failed: {e}")
            state["error_log"].append(f"Draft error: {str(e)}")
            state["draft_analysis"] = f"Analysis of {state['query']} based on available literature."
        
        return state
    
    async def _critique_node(self, state: AnalysisState) -> AnalysisState:
        """Evaluate draft quality against PhD standards"""
        state["current_step"] = "critique"
        
        try:
            from critique_revise_system import get_critique_revise_system
            
            system = get_critique_revise_system(self.llm)
            critique = await system.critic.evaluate(
                content=state["draft_analysis"],
                query=state["query"],
                analysis_type=state["analysis_type"],
                available_sources=len(state["reranked_papers"])
            )
            
            state["critique_result"] = {
                "overall_score": critique.overall_score,
                "meets_threshold": critique.meets_threshold,
                "strengths": critique.strengths,
                "weaknesses": critique.weaknesses,
                "improvements": critique.specific_improvements
            }
            
            state["quality_score"] = critique.overall_score
            
            logger.info(f"📊 Critique completed: {critique.overall_score:.3f} score")
            
        except Exception as e:
            logger.error(f"Critique failed: {e}")
            state["error_log"].append(f"Critique error: {str(e)}")
            state["critique_result"] = {"overall_score": 0.5, "meets_threshold": False}
        
        return state
    
    async def _revise_node(self, state: AnalysisState) -> AnalysisState:
        """Revise analysis based on critique feedback"""
        state["current_step"] = "revise"
        
        try:
            from critique_revise_system import get_critique_revise_system
            
            system = get_critique_revise_system(self.llm)
            
            # Create critique result object
            from critique_revise_system import CritiqueResult
            critique = CritiqueResult(
                overall_score=state["critique_result"]["overall_score"],
                rubric_scores={},
                strengths=state["critique_result"].get("strengths", []),
                weaknesses=state["critique_result"].get("weaknesses", []),
                specific_improvements=state["critique_result"].get("improvements", []),
                meets_threshold=state["critique_result"]["meets_threshold"]
            )
            
            revised_content = await system.reviser.revise(
                original_content=state["draft_analysis"],
                critique=critique,
                query=state["query"],
                analysis_type=state["analysis_type"],
                context_data=state["project_context"]
            )
            
            state["draft_analysis"] = revised_content  # Update draft for next critique
            
            logger.info(f"🔄 Analysis revised ({len(revised_content)} chars)")
            
        except Exception as e:
            logger.error(f"Revision failed: {e}")
            state["error_log"].append(f"Revision error: {str(e)}")
        
        return state
    
    async def _verify_node(self, state: AnalysisState) -> AnalysisState:
        """Final quality verification and validation"""
        state["current_step"] = "verify"
        
        # Simple verification (can be enhanced with additional checks)
        verification_result = {
            "length_check": len(state["draft_analysis"]) > 200,
            "entity_check": len(state["extracted_entities"]) > 0,
            "quality_check": state["quality_score"] > 0.6,
            "error_check": len(state["error_log"]) == 0
        }
        
        verification_result["overall_pass"] = all(verification_result.values())
        
        state["workflow_metadata"]["verification_result"] = verification_result
        
        logger.info(f"✅ Verification: {'PASS' if verification_result['overall_pass'] else 'FAIL'}")
        
        return state
    
    async def _finalize_node(self, state: AnalysisState) -> AnalysisState:
        """Finalize analysis with metadata and formatting"""
        state["current_step"] = "finalize"
        
        # Create final analysis with metadata
        final_analysis = f"""
        {state['draft_analysis']}
        
        ---
        Analysis Metadata:
        - Papers analyzed: {len(state['reranked_papers'])}
        - Entities extracted: {len(state['extracted_entities'])}
        - Quality score: {state['quality_score']:.3f}
        - Iterations: {state['iteration_count']}
        """
        
        state["final_analysis"] = final_analysis
        
        logger.info("🎯 Analysis finalized")
        
        return state
    
    def _should_revise(self, state: AnalysisState) -> str:
        """Determine if revision is needed based on critique"""
        
        meets_threshold = state["critique_result"].get("meets_threshold", False)
        max_iterations_reached = state["iteration_count"] >= 2
        
        if meets_threshold or max_iterations_reached:
            return "verify"
        else:
            return "revise"

# Global instance
phd_orchestrator = None

def get_phd_orchestrator(llm):
    """Get or create global PhD analysis orchestrator"""
    global phd_orchestrator
    if phd_orchestrator is None:
        phd_orchestrator = PhDAnalysisOrchestrator(llm)
    return phd_orchestrator

# Convenience function
async def run_orchestrated_analysis(query: str, llm, analysis_type: str = "generate_review", 
                                   project_context: Dict[str, Any] = None) -> Dict[str, Any]:
    """Run orchestrated PhD analysis workflow"""
    orchestrator = get_phd_orchestrator(llm)
    return await orchestrator.run_analysis(query, analysis_type, project_context)
