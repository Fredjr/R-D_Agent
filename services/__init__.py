"""
Services Package
ResearchRabbit Feature Parity Implementation

This package contains all service modules for the R&D Agent backend:
- author_network_service: Author collaboration analysis
- citation_enrichment_service: Citation data enrichment from external APIs
- citation_service: Citation relationship management
- similarity_engine: Article similarity calculations
- timeline_service: Timeline data processing and visualization
"""

# Make services importable
from .author_network_service import *
from .citation_enrichment_service import *
from .citation_service import *
from .similarity_engine import *
from .timeline_service import *
