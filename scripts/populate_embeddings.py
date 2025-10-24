"""
Batch Embedding Population Script - Sprint 1B
Populates embeddings for all papers in the database

Usage:
    python3 scripts/populate_embeddings.py [--limit N] [--batch-size N] [--skip-existing]

Options:
    --limit N: Process only N papers (default: all)
    --batch-size N: Batch size for processing (default: 100)
    --skip-existing: Skip papers that already have embeddings (default: True)
    --force: Force re-embedding of all papers
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import argparse
from datetime import datetime
from sqlalchemy import func
from database import get_session_local, Article
from database_models.paper_embedding import PaperEmbedding
from services.vector_store_service import get_vector_store_service
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class EmbeddingPopulator:
    """Batch embedding population service"""
    
    def __init__(self, batch_size: int = 100, skip_existing: bool = True):
        self.batch_size = batch_size
        self.skip_existing = skip_existing
        self.vector_service = get_vector_store_service()
        self.stats = {
            'total_articles': 0,
            'already_embedded': 0,
            'to_process': 0,
            'success': 0,
            'failed': 0,
            'skipped': 0,
            'start_time': None,
            'end_time': None
        }
    
    def get_articles_to_process(self, db, limit: int = None):
        """Get articles that need embeddings"""
        logger.info("📊 Analyzing articles in database...")
        
        # Count total articles
        total_articles = db.query(func.count(Article.pmid)).scalar()
        self.stats['total_articles'] = total_articles
        logger.info(f"   Total articles in database: {total_articles}")
        
        if self.skip_existing:
            # Get articles without embeddings
            embedded_pmids = db.query(PaperEmbedding.pmid).all()
            embedded_pmids_set = {pmid[0] for pmid in embedded_pmids}
            
            self.stats['already_embedded'] = len(embedded_pmids_set)
            logger.info(f"   Already embedded: {len(embedded_pmids_set)}")
            
            # Query articles not in embedded set
            query = db.query(Article).filter(
                ~Article.pmid.in_(embedded_pmids_set)
            )
        else:
            # Process all articles
            query = db.query(Article)
            logger.info("   Processing ALL articles (force mode)")
        
        if limit:
            query = query.limit(limit)
            logger.info(f"   Limiting to {limit} articles")
        
        articles = query.all()
        self.stats['to_process'] = len(articles)
        
        logger.info(f"   Articles to process: {len(articles)}")
        return articles
    
    def prepare_paper_batch(self, articles):
        """Convert Article objects to paper dicts for batch processing"""
        papers = []
        for article in articles:
            papers.append({
                'pmid': article.pmid,
                'title': article.title,
                'abstract': article.abstract,
                'metadata': {
                    'publication_year': article.publication_year,
                    'journal': article.journal,
                    'research_domain': None  # Could be inferred from MeSH terms
                }
            })
        return papers
    
    async def populate(self, limit: int = None):
        """Main population method"""
        logger.info("="*70)
        logger.info("🚀 STARTING BATCH EMBEDDING POPULATION")
        logger.info("="*70)
        
        self.stats['start_time'] = datetime.now()
        
        SessionLocal = get_session_local()
        db = SessionLocal()
        
        try:
            # Get articles to process
            articles = self.get_articles_to_process(db, limit)
            
            if not articles:
                logger.info("✅ No articles to process - all embeddings up to date!")
                return self.stats
            
            # Prepare batch
            papers = self.prepare_paper_batch(articles)
            
            logger.info(f"\n📦 Processing {len(papers)} papers in batches of {self.batch_size}...")
            logger.info(f"⏱️  Estimated time: {len(papers) * 0.5 / 60:.1f} minutes (at ~2 papers/sec)")
            
            # Process batch
            batch_stats = await self.vector_service.embed_papers_batch(
                db, papers, batch_size=self.batch_size
            )
            
            # Update stats
            self.stats['success'] = batch_stats['success']
            self.stats['failed'] = batch_stats['failed']
            self.stats['skipped'] = batch_stats['skipped']
            
            self.stats['end_time'] = datetime.now()
            
            # Print summary
            self.print_summary()
            
            return self.stats
            
        except Exception as e:
            logger.error(f"❌ Population error: {e}")
            raise
        finally:
            db.close()
    
    def print_summary(self):
        """Print population summary"""
        logger.info("\n" + "="*70)
        logger.info("📊 EMBEDDING POPULATION SUMMARY")
        logger.info("="*70)
        
        logger.info(f"\n📈 Statistics:")
        logger.info(f"   Total articles in DB: {self.stats['total_articles']}")
        logger.info(f"   Already embedded: {self.stats['already_embedded']}")
        logger.info(f"   Processed: {self.stats['to_process']}")
        logger.info(f"   ✅ Success: {self.stats['success']}")
        logger.info(f"   ⏭️  Skipped: {self.stats['skipped']}")
        logger.info(f"   ❌ Failed: {self.stats['failed']}")
        
        if self.stats['start_time'] and self.stats['end_time']:
            duration = (self.stats['end_time'] - self.stats['start_time']).total_seconds()
            logger.info(f"\n⏱️  Performance:")
            logger.info(f"   Duration: {duration:.1f} seconds ({duration/60:.1f} minutes)")
            if self.stats['success'] > 0:
                rate = self.stats['success'] / duration
                logger.info(f"   Rate: {rate:.2f} papers/second")
        
        success_rate = (self.stats['success'] / self.stats['to_process'] * 100) if self.stats['to_process'] > 0 else 0
        logger.info(f"\n🎯 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 95:
            logger.info("🎉 EXCELLENT! Embedding population successful!")
        elif success_rate >= 80:
            logger.info("✅ GOOD! Most embeddings created successfully")
        else:
            logger.info("⚠️  WARNING: Low success rate - check errors")
        
        logger.info("="*70 + "\n")


async def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Populate paper embeddings")
    parser.add_argument('--limit', type=int, default=None, help="Limit number of papers to process")
    parser.add_argument('--batch-size', type=int, default=100, help="Batch size for processing")
    parser.add_argument('--force', action='store_true', help="Force re-embedding of all papers")
    
    args = parser.parse_args()
    
    # Create populator
    populator = EmbeddingPopulator(
        batch_size=args.batch_size,
        skip_existing=not args.force
    )
    
    # Run population
    try:
        stats = await populator.populate(limit=args.limit)
        
        # Exit with appropriate code
        if stats['failed'] == 0:
            sys.exit(0)
        elif stats['success'] > 0:
            sys.exit(0)  # Partial success is OK
        else:
            sys.exit(1)  # Total failure
            
    except KeyboardInterrupt:
        logger.info("\n⚠️  Population interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"\n❌ Population failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())

