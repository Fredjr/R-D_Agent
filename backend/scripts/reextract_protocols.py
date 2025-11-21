"""
Script to re-extract existing protocols with new evidence-based logic.

This script:
1. Fetches all existing protocols from the database
2. For each protocol, re-extracts using the new intelligent extractor
3. Updates the protocol with confidence scores and source citations
4. Preserves original protocol data as backup

Usage:
    python backend/scripts/reextract_protocols.py [--project-id PROJECT_ID] [--dry-run]
"""

import sys
import os
import asyncio
import argparse
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from sqlalchemy.orm import Session
from database import get_session_local, Protocol, Article
from backend.app.services.intelligent_protocol_extractor import IntelligentProtocolExtractor
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def reextract_protocol(protocol: Protocol, article: Article, db: Session, dry_run: bool = False):
    """Re-extract a single protocol with new logic."""
    try:
        logger.info(f"\n{'='*80}")
        logger.info(f"📄 Re-extracting protocol: {protocol.protocol_name}")
        logger.info(f"   Source PMID: {protocol.source_pmid}")
        logger.info(f"   Original extraction method: {protocol.extraction_method}")
        
        if not article:
            logger.warning(f"⚠️  Article not found for PMID {protocol.source_pmid}, skipping")
            return False
        
        # Create extractor
        extractor = IntelligentProtocolExtractor()
        
        # Re-extract protocol
        logger.info(f"🔄 Extracting with new evidence-based logic...")
        new_protocol_data = await extractor.extract_protocol(
            abstract=article.abstract or "",
            project_id=protocol.project_id,
            pmid=protocol.source_pmid,
            db=db
        )
        
        if not new_protocol_data:
            logger.warning(f"⚠️  No protocol extracted (likely review paper or no clear protocol)")
            return False
        
        # Log confidence score
        confidence = new_protocol_data.get('extraction_confidence', 0)
        confidence_level = new_protocol_data.get('confidence_explanation', {}).get('confidence_level', 'Unknown')
        logger.info(f"📊 Confidence: {confidence}/100 ({confidence_level})")
        
        # Log source citations
        material_sources = new_protocol_data.get('material_sources', {})
        step_sources = new_protocol_data.get('step_sources', {})
        logger.info(f"📚 Source citations: {len(material_sources)} materials, {len(step_sources)} steps")
        
        if dry_run:
            logger.info(f"🔍 DRY RUN - Would update protocol with:")
            logger.info(f"   - Confidence: {confidence}/100")
            logger.info(f"   - Materials: {len(new_protocol_data.get('materials', []))}")
            logger.info(f"   - Steps: {len(new_protocol_data.get('steps', []))}")
            return True
        
        # Update protocol in database
        protocol.materials = new_protocol_data.get('materials', [])
        protocol.steps = new_protocol_data.get('steps', [])
        protocol.equipment = new_protocol_data.get('equipment', [])
        protocol.key_parameters = new_protocol_data.get('key_parameters', [])
        protocol.expected_outcomes = new_protocol_data.get('expected_outcomes', [])
        protocol.troubleshooting_tips = new_protocol_data.get('troubleshooting_tips', [])
        
        # Update context-aware fields
        protocol.relevance_score = new_protocol_data.get('relevance_score', 50)
        protocol.affected_questions = new_protocol_data.get('affected_questions', [])
        protocol.affected_hypotheses = new_protocol_data.get('affected_hypotheses', [])
        protocol.relevance_reasoning = new_protocol_data.get('relevance_reasoning')
        protocol.key_insights = new_protocol_data.get('key_insights', [])
        protocol.potential_applications = new_protocol_data.get('potential_applications', [])
        protocol.recommendations = new_protocol_data.get('recommendations', [])
        protocol.context_relevance = new_protocol_data.get('context_relevance')
        
        # Update confidence and sources
        protocol.extraction_confidence = confidence
        protocol.confidence_explanation = new_protocol_data.get('confidence_explanation', {})
        protocol.material_sources = material_sources
        protocol.step_sources = step_sources
        
        # Update extraction metadata
        protocol.extraction_method = 'intelligent_multi_agent'
        protocol.context_aware = True
        
        db.commit()
        logger.info(f"✅ Protocol updated successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error re-extracting protocol {protocol.protocol_id}: {e}")
        db.rollback()
        return False


async def main():
    parser = argparse.ArgumentParser(description='Re-extract protocols with new evidence-based logic')
    parser.add_argument('--project-id', type=str, help='Only re-extract protocols for specific project')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be done without making changes')
    parser.add_argument('--limit', type=int, help='Limit number of protocols to process')
    
    args = parser.parse_args()

    SessionLocal = get_session_local()
    db = SessionLocal()
    
    try:
        # Fetch protocols
        query = db.query(Protocol)
        if args.project_id:
            query = query.filter(Protocol.project_id == args.project_id)
        
        if args.limit:
            query = query.limit(args.limit)
        
        protocols = query.all()
        
        logger.info(f"\n{'='*80}")
        logger.info(f"🔄 RE-EXTRACTING PROTOCOLS WITH EVIDENCE-BASED LOGIC")
        logger.info(f"{'='*80}")
        logger.info(f"Total protocols to process: {len(protocols)}")
        if args.dry_run:
            logger.info(f"⚠️  DRY RUN MODE - No changes will be made")
        logger.info(f"{'='*80}\n")
        
        success_count = 0
        skip_count = 0
        error_count = 0
        
        for i, protocol in enumerate(protocols, 1):
            logger.info(f"\n[{i}/{len(protocols)}] Processing protocol {protocol.protocol_id}...")
            
            # Fetch article
            article = db.query(Article).filter(Article.pmid == protocol.source_pmid).first()
            
            result = await reextract_protocol(protocol, article, db, dry_run=args.dry_run)
            
            if result:
                success_count += 1
            elif result is False:
                skip_count += 1
            else:
                error_count += 1
        
        logger.info(f"\n{'='*80}")
        logger.info(f"✅ RE-EXTRACTION COMPLETE!")
        logger.info(f"{'='*80}")
        logger.info(f"✅ Successfully re-extracted: {success_count}")
        logger.info(f"⚠️  Skipped (no protocol found): {skip_count}")
        logger.info(f"❌ Errors: {error_count}")
        logger.info(f"{'='*80}\n")
        
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(main())

