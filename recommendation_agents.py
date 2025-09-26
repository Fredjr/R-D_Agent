"""
Specialized AI Agents for Spotify-Inspired Paper Recommendations
Each agent focuses on a specific recommendation category with tailored prompts and logic.
"""

from __future__ import annotations
import json
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from sqlalchemy.orm import Session
from database import User, Project, Collection, Article, ArticleCollection
from sqlalchemy import desc, func, and_, or_


class PersonalizedPapersAgent:
    """Agent specialized in generating 'Papers for You' recommendations"""
    
    PROMPT_TEMPLATE = PromptTemplate(
        template="""
        You are a Personalized Research Discovery Agent. Analyze the user's research profile and recommend highly relevant papers.
        
        User Research Profile:
        - Primary Domains: {primary_domains}
        - Recent Papers Saved: {recent_papers}
        - Research Interests: {research_interests}
        - Activity Level: {activity_level}
        - Preferred Paper Types: {paper_preferences}
        
        Available Papers Pool: {available_papers}
        
        Task: Select and rank the TOP 12 most relevant papers for this specific user.
        
        Criteria for Selection:
        1. Direct relevance to user's primary research domains
        2. Alignment with user's demonstrated interests from saved papers
        3. Appropriate complexity level for user's expertise
        4. Recency and citation quality balance
        5. Methodological alignment with user's preferences
        
        Return ONLY a JSON array of objects with:
        - pmid: string
        - relevance_score: float (0.0-1.0)
        - relevance_reason: string (why this paper matches the user)
        - personalization_factors: array of strings (what makes it personal)
        - confidence: float (0.0-1.0)
        
        Focus on QUALITY over quantity. Each recommendation should be highly personalized.
        """,
        input_variables=["primary_domains", "recent_papers", "research_interests", 
                        "activity_level", "paper_preferences", "available_papers"]
    )

    def __init__(self, llm):
        self.llm = llm
        self.chain = LLMChain(llm=llm, prompt=self.PROMPT_TEMPLATE)

    async def generate_recommendations(self, user_profile: Dict[str, Any], 
                                     available_papers: List[Dict], 
                                     limit: int = 12) -> List[Dict[str, Any]]:
        """Generate personalized paper recommendations"""
        
        # Prepare user context
        context = {
            "primary_domains": json.dumps(user_profile.get("primary_domains", [])),
            "recent_papers": json.dumps(user_profile.get("recent_papers", [])[:10]),
            "research_interests": json.dumps(user_profile.get("topic_preferences", [])),
            "activity_level": user_profile.get("activity_level", "moderate"),
            "paper_preferences": json.dumps(user_profile.get("paper_preferences", [])),
            "available_papers": json.dumps(available_papers[:50])  # Limit for context
        }
        
        try:
            result = await self.chain.ainvoke(context)
            recommendations = json.loads(result["text"])
            
            # Validate and limit results
            if isinstance(recommendations, list):
                return recommendations[:limit]
            return []
            
        except Exception as e:
            print(f"PersonalizedPapersAgent error: {e}")
            return []


class TrendingFieldAgent:
    """Agent specialized in identifying trending papers in user's field"""
    
    PROMPT_TEMPLATE = PromptTemplate(
        template="""
        You are a Research Trend Analysis Agent. Identify the hottest, most impactful papers in the user's research field.
        
        User's Research Field: {user_domains}
        Time Period: Last 12 months
        Available Recent Papers: {recent_papers}
        Citation Velocity Data: {citation_data}
        
        Task: Identify papers that are TRENDING (gaining rapid attention) in the user's field.
        
        Trending Indicators:
        1. High citation velocity (citations per month since publication)
        2. Recent publication date (last 12 months)
        3. Breakthrough findings or novel methodologies
        4. Cross-institutional collaboration
        5. High-impact journal publication
        6. Social media/academic discussion volume
        
        Return ONLY a JSON array of objects with:
        - pmid: string
        - trend_score: float (0.0-1.0)
        - trend_reason: string (why it's trending)
        - impact_indicators: array of strings (what makes it impactful)
        - velocity_metrics: object with citation and discussion metrics
        - field_relevance: float (0.0-1.0)
        
        Focus on papers that are creating BUZZ in the research community.
        """,
        input_variables=["user_domains", "recent_papers", "citation_data"]
    )

    def __init__(self, llm):
        self.llm = llm
        self.chain = LLMChain(llm=llm, prompt=self.PROMPT_TEMPLATE)

    async def generate_recommendations(self, user_profile: Dict[str, Any], 
                                     available_papers: List[Dict], 
                                     limit: int = 12) -> List[Dict[str, Any]]:
        """Generate trending papers recommendations"""
        
        # Filter for recent papers (last 12 months)
        cutoff_date = datetime.now() - timedelta(days=365)
        recent_papers = [
            paper for paper in available_papers 
            if paper.get("pub_year", 0) >= cutoff_date.year
        ]
        
        context = {
            "user_domains": json.dumps(user_profile.get("primary_domains", [])),
            "recent_papers": json.dumps(recent_papers[:30]),
            "citation_data": json.dumps([
                {
                    "pmid": paper.get("pmid"),
                    "citation_count": paper.get("citation_count", 0),
                    "pub_year": paper.get("pub_year"),
                    "citation_velocity": self._calculate_citation_velocity(paper)
                }
                for paper in recent_papers[:30]
            ])
        }
        
        try:
            result = await self.chain.ainvoke(context)
            recommendations = json.loads(result["text"])
            
            if isinstance(recommendations, list):
                return recommendations[:limit]
            return []
            
        except Exception as e:
            print(f"TrendingFieldAgent error: {e}")
            return []

    def _calculate_citation_velocity(self, paper: Dict) -> float:
        """Calculate citations per month since publication"""
        pub_year = paper.get("pub_year", datetime.now().year)
        citation_count = paper.get("citation_count", 0)
        
        months_since_pub = max(1, (datetime.now().year - pub_year) * 12)
        return citation_count / months_since_pub


class CrossPollinationAgent:
    """Agent specialized in finding interdisciplinary discovery opportunities"""
    
    PROMPT_TEMPLATE = PromptTemplate(
        template="""
        You are an Interdisciplinary Discovery Agent. Find papers that bridge different research domains and offer cross-pollination opportunities.
        
        User's Primary Domain: {primary_domain}
        User's Secondary Interests: {secondary_domains}
        Cross-Domain Papers Pool: {cross_domain_papers}
        Domain Intersection Map: {domain_intersections}
        
        Task: Identify papers that offer INTERDISCIPLINARY insights and cross-pollination opportunities.
        
        Cross-Pollination Criteria:
        1. Papers that bridge 2+ distinct research domains
        2. Novel methodologies from other fields applied to user's domain
        3. Unexpected connections between disparate research areas
        4. Emerging interdisciplinary research trends
        5. Papers that could inspire new research directions
        
        Return ONLY a JSON array of objects with:
        - pmid: string
        - cross_pollination_score: float (0.0-1.0)
        - bridged_domains: array of strings (domains connected)
        - discovery_potential: string (what new insights it offers)
        - methodology_transfer: string (methods that could be adapted)
        - innovation_opportunity: string (how it could inspire new research)
        
        Focus on papers that could SPARK new ideas and research directions.
        """,
        input_variables=["primary_domain", "secondary_domains", "cross_domain_papers", "domain_intersections"]
    )

    def __init__(self, llm):
        self.llm = llm
        self.chain = LLMChain(llm=llm, prompt=self.PROMPT_TEMPLATE)

    async def generate_recommendations(self, user_profile: Dict[str, Any], 
                                     available_papers: List[Dict], 
                                     limit: int = 12) -> List[Dict[str, Any]]:
        """Generate cross-pollination recommendations"""
        
        primary_domains = user_profile.get("primary_domains", [])
        primary_domain = primary_domains[0] if primary_domains else "general"
        secondary_domains = primary_domains[1:] if len(primary_domains) > 1 else []
        
        # Filter for papers that span multiple domains
        cross_domain_papers = [
            paper for paper in available_papers
            if self._is_cross_domain_paper(paper, primary_domains)
        ]
        
        context = {
            "primary_domain": primary_domain,
            "secondary_domains": json.dumps(secondary_domains),
            "cross_domain_papers": json.dumps(cross_domain_papers[:25]),
            "domain_intersections": json.dumps(self._map_domain_intersections(primary_domains))
        }
        
        try:
            result = await self.chain.ainvoke(context)
            recommendations = json.loads(result["text"])
            
            if isinstance(recommendations, list):
                return recommendations[:limit]
            return []
            
        except Exception as e:
            print(f"CrossPollinationAgent error: {e}")
            return []

    def _is_cross_domain_paper(self, paper: Dict, user_domains: List[str]) -> bool:
        """Check if paper spans multiple domains"""
        paper_keywords = paper.get("keywords", []) + [paper.get("title", "")]
        paper_text = " ".join(str(k).lower() for k in paper_keywords)
        
        domain_matches = sum(1 for domain in user_domains if domain.lower() in paper_text)
        return domain_matches >= 2 or any(
            interdisciplinary_term in paper_text 
            for interdisciplinary_term in ["interdisciplinary", "multidisciplinary", "cross-domain", "hybrid"]
        )

    def _map_domain_intersections(self, domains: List[str]) -> Dict[str, List[str]]:
        """Map potential intersections between domains"""
        intersections = {}
        for i, domain1 in enumerate(domains):
            for domain2 in domains[i+1:]:
                key = f"{domain1}+{domain2}"
                intersections[key] = [
                    f"Methods from {domain2} applied to {domain1}",
                    f"Data from {domain1} analyzed with {domain2} techniques",
                    f"Theoretical frameworks bridging {domain1} and {domain2}"
                ]
        return intersections


class CitationOpportunityAgent:
    """Agent specialized in finding citation opportunities"""
    
    PROMPT_TEMPLATE = PromptTemplate(
        template="""
        You are a Citation Opportunity Discovery Agent. Find recent papers that could benefit from citing the user's work or related research.
        
        User's Research Profile: {user_research_profile}
        User's Publication History: {user_publications}
        Recent Papers in Field: {recent_papers}
        Citation Gap Analysis: {citation_gaps}
        
        Task: Identify recent papers that represent CITATION OPPORTUNITIES.
        
        Citation Opportunity Criteria:
        1. Recent papers (current year) with low citation counts
        2. Papers in user's field that missed relevant citations
        3. Papers that could benefit from user's methodologies
        4. Papers with citation gaps in their literature review
        5. Papers by early-career researchers who might appreciate guidance
        
        Return ONLY a JSON array of objects with:
        - pmid: string
        - opportunity_score: float (0.0-1.0)
        - opportunity_type: string (why it's a citation opportunity)
        - citation_gap: string (what's missing from their citations)
        - engagement_potential: string (how to approach the authors)
        - mutual_benefit: string (how both parties benefit)
        
        Focus on GENUINE opportunities for meaningful academic engagement.
        """,
        input_variables=["user_research_profile", "user_publications", "recent_papers", "citation_gaps"]
    )

    def __init__(self, llm):
        self.llm = llm
        self.chain = LLMChain(llm=llm, prompt=self.PROMPT_TEMPLATE)

    async def generate_recommendations(self, user_profile: Dict[str, Any], 
                                     available_papers: List[Dict], 
                                     limit: int = 12) -> List[Dict[str, Any]]:
        """Generate citation opportunity recommendations"""
        
        # Filter for very recent papers with low citations
        current_year = datetime.now().year
        opportunity_papers = [
            paper for paper in available_papers
            if (paper.get("pub_year", 0) >= current_year - 1 and 
                paper.get("citation_count", 0) < 10)
        ]
        
        context = {
            "user_research_profile": json.dumps({
                "domains": user_profile.get("primary_domains", []),
                "expertise_level": user_profile.get("activity_level", "moderate"),
                "research_focus": user_profile.get("topic_preferences", [])
            }),
            "user_publications": json.dumps(user_profile.get("user_publications", [])),
            "recent_papers": json.dumps(opportunity_papers[:20]),
            "citation_gaps": json.dumps(self._analyze_citation_gaps(opportunity_papers))
        }
        
        try:
            result = await self.chain.ainvoke(context)
            recommendations = json.loads(result["text"])
            
            if isinstance(recommendations, list):
                return recommendations[:limit]
            return []
            
        except Exception as e:
            print(f"CitationOpportunityAgent error: {e}")
            return []

    def _analyze_citation_gaps(self, papers: List[Dict]) -> List[Dict]:
        """Analyze potential citation gaps in recent papers"""
        gaps = []
        for paper in papers:
            gaps.append({
                "pmid": paper.get("pmid"),
                "title": paper.get("title", ""),
                "citation_count": paper.get("citation_count", 0),
                "potential_gaps": [
                    "Missing foundational methodology citations",
                    "Limited recent literature coverage",
                    "Narrow geographic research scope"
                ]
            })
        return gaps


class RecommendationOrchestrator:
    """Orchestrates all recommendation agents for comprehensive suggestions"""
    
    def __init__(self, llm):
        self.llm = llm
        self.agents = {
            'papers_for_you': PersonalizedPapersAgent(llm),
            'trending': TrendingFieldAgent(llm),
            'cross_pollination': CrossPollinationAgent(llm),
            'citation_opportunities': CitationOpportunityAgent(llm)
        }
    
    async def generate_all_recommendations(self, user_profile: Dict[str, Any], 
                                         available_papers: List[Dict]) -> Dict[str, Any]:
        """Generate all recommendation categories in parallel"""
        
        # Execute all agents in parallel for efficiency - Spotify-style abundance
        tasks = [
            self.agents['papers_for_you'].generate_recommendations(user_profile, available_papers, 20),
            self.agents['trending'].generate_recommendations(user_profile, available_papers, 18),
            self.agents['cross_pollination'].generate_recommendations(user_profile, available_papers, 15),
            self.agents['citation_opportunities'].generate_recommendations(user_profile, available_papers, 12)
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        return {
            'papers_for_you': results[0] if not isinstance(results[0], Exception) else [],
            'trending': results[1] if not isinstance(results[1], Exception) else [],
            'cross_pollination': results[2] if not isinstance(results[2], Exception) else [],
            'citation_opportunities': results[3] if not isinstance(results[3], Exception) else [],
            'user_insights': user_profile
        }
