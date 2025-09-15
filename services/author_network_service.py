"""
Author Network Analysis Service

This service provides comprehensive author network analysis including:
- Author collaboration mapping
- Co-authorship detection and scoring
- Author influence and impact metrics
- Research team discovery
- Suggested researcher recommendations
"""

import asyncio
import aiohttp
import logging
from typing import Dict, List, Optional, Set, Tuple, Any
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import json
import re
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from database import get_db, Article, AuthorCollaboration

logger = logging.getLogger(__name__)

@dataclass
class AuthorProfile:
    """Comprehensive author profile with metrics"""
    name: str
    normalized_name: str
    total_papers: int = 0
    total_citations: int = 0
    h_index: int = 0
    collaboration_count: int = 0
    recent_papers: int = 0  # Papers in last 3 years
    career_span: int = 0  # Years from first to last publication
    primary_journals: List[str] = field(default_factory=list)
    research_domains: List[str] = field(default_factory=list)
    top_collaborators: List[str] = field(default_factory=list)
    influence_score: float = 0.0
    activity_score: float = 0.0  # Recent activity metric
    
@dataclass
class CollaborationEdge:
    """Represents a collaboration relationship between two authors"""
    author1: str
    author2: str
    strength: float
    paper_count: int
    shared_papers: List[str]
    first_collaboration: Optional[datetime] = None
    last_collaboration: Optional[datetime] = None
    collaboration_span: int = 0
    shared_journals: List[str] = field(default_factory=list)
    
@dataclass
class AuthorNetwork:
    """Complete author network representation"""
    authors: Dict[str, AuthorProfile]
    collaborations: List[CollaborationEdge]
    network_metrics: Dict[str, Any]
    suggested_authors: List[AuthorProfile]
    research_clusters: Dict[str, List[str]]

class AuthorNetworkService:
    """Service for author network analysis and collaboration discovery"""
    
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.cache: Dict[str, Any] = {}
        self.cache_ttl = timedelta(hours=6)  # 6-hour cache
        self.rate_limits = {
            'openalex': {'calls': 0, 'reset_time': datetime.now()},
            'crossref': {'calls': 0, 'reset_time': datetime.now()}
        }
        
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={'User-Agent': 'RD-Agent/1.0 (Research Discovery)'}
        )
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    def normalize_author_name(self, name: str) -> str:
        """Normalize author name for consistent matching"""
        if not name:
            return ""
        
        # Remove extra whitespace and convert to lowercase
        normalized = re.sub(r'\s+', ' ', name.strip().lower())
        
        # Handle common name formats
        # "Smith, John A." -> "john a smith"
        if ',' in normalized:
            parts = normalized.split(',', 1)
            if len(parts) == 2:
                last_name = parts[0].strip()
                first_names = parts[1].strip()
                normalized = f"{first_names} {last_name}"
        
        # Remove periods and extra punctuation
        normalized = re.sub(r'[^\w\s-]', '', normalized)
        
        return normalized
    
    def calculate_author_influence(self, profile: AuthorProfile) -> float:
        """Calculate author influence score based on multiple factors"""
        if profile.total_papers == 0:
            return 0.0
        
        # Base metrics
        citation_factor = min(profile.total_citations / 100, 10.0)  # Cap at 10
        h_index_factor = min(profile.h_index / 10, 5.0)  # Cap at 5
        collaboration_factor = min(profile.collaboration_count / 20, 3.0)  # Cap at 3
        productivity_factor = min(profile.total_papers / 50, 2.0)  # Cap at 2
        
        # Recent activity bonus
        activity_bonus = min(profile.recent_papers / 10, 1.0)
        
        # Career longevity factor
        longevity_factor = min(profile.career_span / 20, 1.0)
        
        # Calculate weighted influence score
        influence = (
            citation_factor * 0.3 +
            h_index_factor * 0.25 +
            collaboration_factor * 0.2 +
            productivity_factor * 0.15 +
            activity_bonus * 0.05 +
            longevity_factor * 0.05
        )
        
        return round(influence, 2)
    
    def calculate_collaboration_strength(self, shared_papers: List[str], 
                                       author1_total: int, author2_total: int) -> float:
        """Calculate collaboration strength between two authors"""
        if not shared_papers or author1_total == 0 or author2_total == 0:
            return 0.0
        
        # Base collaboration count
        collaboration_count = len(shared_papers)
        
        # Normalize by total papers (Jaccard-like similarity)
        total_unique_papers = author1_total + author2_total - collaboration_count
        jaccard_similarity = collaboration_count / total_unique_papers if total_unique_papers > 0 else 0
        
        # Boost for frequent collaborations
        frequency_boost = min(collaboration_count / 5, 2.0)
        
        # Calculate final strength
        strength = jaccard_similarity * frequency_boost
        
        return round(strength, 3)
    
    async def fetch_author_papers(self, author_name: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Fetch papers for a specific author from external APIs"""
        if not self.session:
            return []
        
        try:
            # Try OpenAlex first
            normalized_name = self.normalize_author_name(author_name)
            url = f"https://api.openalex.org/works"
            params = {
                'filter': f'author.display_name.search:{author_name}',
                'per-page': min(limit, 200),
                'sort': 'cited_by_count:desc'
            }
            
            await self._rate_limit('openalex')
            
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    papers = []
                    
                    for work in data.get('results', []):
                        # Extract paper information
                        paper = {
                            'pmid': self._extract_pmid(work),
                            'title': work.get('title', ''),
                            'authors': [auth.get('display_name', '') for auth in work.get('authorships', [])],
                            'journal': work.get('primary_location', {}).get('source', {}).get('display_name', ''),
                            'year': work.get('publication_year', 0),
                            'citation_count': work.get('cited_by_count', 0),
                            'doi': work.get('doi', '').replace('https://doi.org/', '') if work.get('doi') else None
                        }
                        
                        if paper['pmid'] or paper['doi']:
                            papers.append(paper)
                    
                    return papers
                    
        except Exception as e:
            logger.error(f"Error fetching papers for author {author_name}: {e}")
        
        return []
    
    def _extract_pmid(self, work_data: Dict[str, Any]) -> Optional[str]:
        """Extract PMID from OpenAlex work data"""
        ids = work_data.get('ids', {})
        
        # Check for PMID in various formats
        if 'pmid' in ids:
            pmid = ids['pmid']
            if isinstance(pmid, str) and pmid.startswith('https://pubmed.ncbi.nlm.nih.gov/'):
                return pmid.split('/')[-1]
            return str(pmid)
        
        # Check external IDs
        for external_id in work_data.get('external_ids', []):
            if external_id.get('type') == 'pmid':
                return str(external_id.get('value', ''))
        
        return None
    
    async def _rate_limit(self, service: str):
        """Simple rate limiting for external APIs"""
        now = datetime.now()
        rate_info = self.rate_limits[service]
        
        # Reset counter every minute
        if now - rate_info['reset_time'] > timedelta(minutes=1):
            rate_info['calls'] = 0
            rate_info['reset_time'] = now
        
        # Wait if we've hit the limit
        if rate_info['calls'] >= 100:  # 100 calls per minute
            await asyncio.sleep(1)
            rate_info['calls'] = 0
            rate_info['reset_time'] = now
        
        rate_info['calls'] += 1
    
    async def build_author_profile(self, author_name: str, 
                                 known_papers: Optional[List[Dict[str, Any]]] = None) -> AuthorProfile:
        """Build comprehensive author profile"""
        normalized_name = self.normalize_author_name(author_name)
        
        # Use provided papers or fetch from APIs
        papers = known_papers or await self.fetch_author_papers(author_name)
        
        if not papers:
            return AuthorProfile(name=author_name, normalized_name=normalized_name)
        
        # Calculate metrics
        total_papers = len(papers)
        total_citations = sum(paper.get('citation_count', 0) for paper in papers)
        
        # Calculate H-index
        citations = sorted([paper.get('citation_count', 0) for paper in papers], reverse=True)
        h_index = 0
        for i, citation_count in enumerate(citations, 1):
            if citation_count >= i:
                h_index = i
            else:
                break
        
        # Recent activity (last 3 years)
        current_year = datetime.now().year
        recent_papers = sum(1 for paper in papers if paper.get('year', 0) >= current_year - 3)
        
        # Career span
        years = [paper.get('year', 0) for paper in papers if paper.get('year', 0) > 0]
        career_span = max(years) - min(years) if years else 0
        
        # Primary journals
        journal_counts = Counter(paper.get('journal', '') for paper in papers if paper.get('journal'))
        primary_journals = [journal for journal, _ in journal_counts.most_common(5)]
        
        # Research domains (simplified - based on journal names)
        research_domains = self._extract_research_domains(primary_journals)
        
        profile = AuthorProfile(
            name=author_name,
            normalized_name=normalized_name,
            total_papers=total_papers,
            total_citations=total_citations,
            h_index=h_index,
            recent_papers=recent_papers,
            career_span=career_span,
            primary_journals=primary_journals,
            research_domains=research_domains
        )
        
        # Calculate influence score
        profile.influence_score = self.calculate_author_influence(profile)
        profile.activity_score = recent_papers / max(total_papers, 1) * 100
        
        return profile
    
    def _extract_research_domains(self, journals: List[str]) -> List[str]:
        """Extract research domains from journal names"""
        domain_keywords = {
            'machine learning': ['machine learning', 'artificial intelligence', 'neural', 'deep learning'],
            'medicine': ['medicine', 'medical', 'clinical', 'health', 'patient'],
            'biology': ['biology', 'biological', 'molecular', 'cell', 'genetics'],
            'chemistry': ['chemistry', 'chemical', 'molecular'],
            'physics': ['physics', 'physical', 'quantum'],
            'computer science': ['computer', 'computing', 'software', 'algorithm'],
            'neuroscience': ['neuroscience', 'brain', 'neural', 'cognitive'],
            'cancer research': ['cancer', 'oncology', 'tumor', 'carcinoma'],
            'genetics': ['genetics', 'genomics', 'gene', 'dna', 'rna']
        }
        
        domains = set()
        journal_text = ' '.join(journals).lower()
        
        for domain, keywords in domain_keywords.items():
            if any(keyword in journal_text for keyword in keywords):
                domains.add(domain)
        
        return list(domains)[:5]  # Limit to top 5 domains

    async def analyze_collaborations(self, papers: List[Dict[str, Any]]) -> List[CollaborationEdge]:
        """Analyze collaborations from a set of papers"""
        collaborations = defaultdict(lambda: {
            'papers': [],
            'journals': set(),
            'years': []
        })

        # Process each paper to find collaborations
        for paper in papers:
            authors = paper.get('authors', [])
            if len(authors) < 2:
                continue

            # Create collaboration pairs
            for i, author1 in enumerate(authors):
                for author2 in authors[i+1:]:
                    # Normalize names for consistent matching
                    norm_author1 = self.normalize_author_name(author1)
                    norm_author2 = self.normalize_author_name(author2)

                    # Create consistent pair key (alphabetical order)
                    pair_key = tuple(sorted([norm_author1, norm_author2]))

                    # Record collaboration
                    collab_data = collaborations[pair_key]
                    collab_data['papers'].append(paper.get('pmid', paper.get('doi', '')))
                    collab_data['journals'].add(paper.get('journal', ''))
                    if paper.get('year'):
                        collab_data['years'].append(paper.get('year'))

        # Convert to CollaborationEdge objects
        edges = []
        for (author1, author2), data in collaborations.items():
            if len(data['papers']) == 0:
                continue

            years = sorted(data['years']) if data['years'] else []
            first_year = years[0] if years else None
            last_year = years[-1] if years else None

            # Calculate collaboration strength (simplified for now)
            strength = len(data['papers']) * 0.1  # Base strength

            edge = CollaborationEdge(
                author1=author1,
                author2=author2,
                strength=strength,
                paper_count=len(data['papers']),
                shared_papers=data['papers'],
                first_collaboration=datetime(first_year, 1, 1) if first_year else None,
                last_collaboration=datetime(last_year, 12, 31) if last_year else None,
                collaboration_span=last_year - first_year if years and len(years) > 1 else 0,
                shared_journals=list(data['journals'])
            )

            edges.append(edge)

        return edges

    async def find_suggested_authors(self, base_authors: List[str],
                                   limit: int = 10) -> List[AuthorProfile]:
        """Find suggested authors based on collaboration patterns"""
        suggested = []

        try:
            # Get database session
            db = next(get_db())

            # Find authors who frequently collaborate with base authors
            collaboration_candidates = defaultdict(int)

            for base_author in base_authors:
                norm_base = self.normalize_author_name(base_author)

                # Query collaborations from database
                collaborations = db.query(AuthorCollaboration).filter(
                    or_(
                        AuthorCollaboration.author1_name.ilike(f'%{norm_base}%'),
                        AuthorCollaboration.author2_name.ilike(f'%{norm_base}%')
                    )
                ).order_by(desc(AuthorCollaboration.collaboration_strength)).limit(50).all()

                for collab in collaborations:
                    # Find the other author in the collaboration
                    other_author = (collab.author2_name
                                  if norm_base in collab.author1_name.lower()
                                  else collab.author1_name)

                    if other_author not in base_authors:
                        collaboration_candidates[other_author] += collab.collaboration_strength

            # Sort by collaboration strength and build profiles
            sorted_candidates = sorted(collaboration_candidates.items(),
                                     key=lambda x: x[1], reverse=True)[:limit]

            for author_name, strength in sorted_candidates:
                profile = await self.build_author_profile(author_name)
                if profile.total_papers > 0:  # Only include authors with papers
                    suggested.append(profile)

            db.close()

        except Exception as e:
            logger.error(f"Error finding suggested authors: {e}")

        return suggested[:limit]

    async def build_author_network(self, source_pmid: str,
                                 depth: int = 2) -> AuthorNetwork:
        """Build comprehensive author network from a source paper"""
        try:
            # Get database session
            db = next(get_db())

            # Get source article
            source_article = db.query(Article).filter(Article.pmid == source_pmid).first()
            if not source_article:
                return AuthorNetwork(
                    authors={},
                    collaborations=[],
                    network_metrics={},
                    suggested_authors=[],
                    research_clusters={}
                )

            # Start with source article authors
            base_authors = source_article.authors or []
            all_papers = [self._article_to_dict(source_article)]

            # Expand network by finding related papers
            related_papers = await self._find_related_papers(source_pmid, depth)
            all_papers.extend(related_papers)

            # Extract all unique authors
            all_authors = set()
            for paper in all_papers:
                all_authors.update(paper.get('authors', []))

            # Build author profiles
            author_profiles = {}
            for author_name in all_authors:
                if author_name:  # Skip empty names
                    profile = await self.build_author_profile(
                        author_name,
                        [p for p in all_papers if author_name in p.get('authors', [])]
                    )
                    author_profiles[author_name] = profile

            # Analyze collaborations
            collaborations = await self.analyze_collaborations(all_papers)

            # Update collaboration counts in profiles
            for edge in collaborations:
                if edge.author1 in author_profiles:
                    author_profiles[edge.author1].collaboration_count += 1
                if edge.author2 in author_profiles:
                    author_profiles[edge.author2].collaboration_count += 1

            # Find suggested authors
            suggested_authors = await self.find_suggested_authors(base_authors)

            # Calculate network metrics
            network_metrics = self._calculate_network_metrics(author_profiles, collaborations)

            # Identify research clusters
            research_clusters = self._identify_research_clusters(author_profiles)

            db.close()

            return AuthorNetwork(
                authors=author_profiles,
                collaborations=collaborations,
                network_metrics=network_metrics,
                suggested_authors=suggested_authors,
                research_clusters=research_clusters
            )

        except Exception as e:
            logger.error(f"Error building author network for {source_pmid}: {e}")
            return AuthorNetwork(
                authors={},
                collaborations=[],
                network_metrics={},
                suggested_authors=[],
                research_clusters={}
            )

    def _article_to_dict(self, article: Article) -> Dict[str, Any]:
        """Convert Article model to dictionary"""
        return {
            'pmid': article.pmid,
            'title': article.title,
            'authors': article.authors or [],
            'journal': article.journal,
            'year': article.publication_year,
            'citation_count': article.citation_count or 0,
            'doi': article.doi
        }

    async def _find_related_papers(self, source_pmid: str, depth: int) -> List[Dict[str, Any]]:
        """Find papers related to source through citations and collaborations"""
        related_papers = []

        try:
            db = next(get_db())

            # Find papers that cite or are cited by the source
            from services.citation_service import get_citation_service
            async with get_citation_service() as citation_service:
                # Get references and citations
                references = await citation_service.fetch_references(source_pmid)
                citations = await citation_service.fetch_citations(source_pmid)

                # Convert to paper dictionaries
                for ref_data in references[:20]:  # Limit to prevent explosion
                    related_papers.append({
                        'pmid': ref_data.pmid,
                        'title': ref_data.title,
                        'authors': ref_data.authors,
                        'journal': ref_data.journal,
                        'year': ref_data.year,
                        'citation_count': ref_data.citation_count
                    })

                for cit_data in citations[:20]:  # Limit to prevent explosion
                    related_papers.append({
                        'pmid': cit_data.pmid,
                        'title': cit_data.title,
                        'authors': cit_data.authors,
                        'journal': cit_data.journal,
                        'year': cit_data.year,
                        'citation_count': cit_data.citation_count
                    })

            db.close()

        except Exception as e:
            logger.error(f"Error finding related papers: {e}")

        return related_papers

    def _calculate_network_metrics(self, authors: Dict[str, AuthorProfile],
                                 collaborations: List[CollaborationEdge]) -> Dict[str, Any]:
        """Calculate network-level metrics"""
        if not authors:
            return {}

        total_authors = len(authors)
        total_collaborations = len(collaborations)

        # Calculate average metrics
        avg_papers = sum(a.total_papers for a in authors.values()) / total_authors
        avg_citations = sum(a.total_citations for a in authors.values()) / total_authors
        avg_h_index = sum(a.h_index for a in authors.values()) / total_authors

        # Network density (actual edges / possible edges)
        max_possible_edges = total_authors * (total_authors - 1) / 2
        density = total_collaborations / max_possible_edges if max_possible_edges > 0 else 0

        # Find most influential authors
        top_authors = sorted(authors.values(), key=lambda a: a.influence_score, reverse=True)[:5]

        return {
            'total_authors': total_authors,
            'total_collaborations': total_collaborations,
            'network_density': round(density, 3),
            'average_papers_per_author': round(avg_papers, 1),
            'average_citations_per_author': round(avg_citations, 1),
            'average_h_index': round(avg_h_index, 1),
            'top_influential_authors': [a.name for a in top_authors],
            'most_active_domains': self._get_top_domains(authors)
        }

    def _get_top_domains(self, authors: Dict[str, AuthorProfile]) -> List[str]:
        """Get most common research domains in the network"""
        domain_counts = Counter()
        for author in authors.values():
            for domain in author.research_domains:
                domain_counts[domain] += 1

        return [domain for domain, _ in domain_counts.most_common(5)]

    def _identify_research_clusters(self, authors: Dict[str, AuthorProfile]) -> Dict[str, List[str]]:
        """Identify research clusters based on domains and collaborations"""
        clusters = defaultdict(list)

        # Group authors by primary research domain
        for author_name, profile in authors.items():
            if profile.research_domains:
                primary_domain = profile.research_domains[0]
                clusters[primary_domain].append(author_name)

        # Only return clusters with multiple authors
        return {domain: authors_list for domain, authors_list in clusters.items()
                if len(authors_list) > 1}

# Singleton pattern for service
_author_network_service = None

async def get_author_network_service() -> AuthorNetworkService:
    """Get singleton author network service instance"""
    global _author_network_service
    if _author_network_service is None:
        _author_network_service = AuthorNetworkService()
    return _author_network_service
