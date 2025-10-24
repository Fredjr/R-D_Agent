"""
Cluster Population Script - Sprint 2B
Generates clusters for all papers in the database

Usage:
    python3 scripts/populate_clusters.py [--limit N] [--batch-size N] [--update-database]

Options:
    --limit N: Process only N articles (default: all)
    --batch-size N: Batch size for clustering (default: 100)
    --update-database: Update Article.cluster_id in database
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import argparse
from datetime import datetime
from sqlalchemy import func
from database import get_session_local, Article
from services.clustering_service import get_clustering_service
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ClusterPopulator:
    """Cluster population service"""
    
    def __init__(self, batch_size: int = 100, update_database: bool = False):
        self.batch_size = batch_size
        self.update_database = update_database
        self.clustering_service = get_clustering_service()
        self.stats = {
            'total_articles': 0,
            'clusters_generated': 0,
            'total_clusters': 0,
            'articles_clustered': 0,
            'failed': 0,
            'start_time': None,
            'end_time': None
        }
    
    def get_articles_to_process(self, db, limit: int = None):
        """Get articles for clustering"""
        logger.info("📊 Analyzing articles in database...")
        
        # Count total articles
        total_articles = db.query(func.count(Article.pmid)).scalar()
        self.stats['total_articles'] = total_articles
        logger.info(f"   Total articles in database: {total_articles}")
        
        # Get articles with citation data (better for clustering)
        query = db.query(Article).filter(
            (Article.cited_by_pmids != None) | (Article.references_pmids != None)
        )
        
        if limit:
            query = query.limit(limit)
            logger.info(f"   Limiting to {limit} articles")
        
        articles = query.all()
        logger.info(f"   Articles with citation data: {len(articles)}")
        
        return articles
    
    async def populate(self, limit: int = None):
        """Main population method"""
        logger.info("="*70)
        logger.info("🚀 STARTING CLUSTER POPULATION")
        logger.info("="*70)
        
        self.stats['start_time'] = datetime.now()
        
        SessionLocal = get_session_local()
        db = SessionLocal()
        
        try:
            # Get articles to process
            articles = self.get_articles_to_process(db, limit)
            
            if not articles:
                logger.info("✅ No articles with citation data found!")
                return self.stats
            
            # Process in batches
            total_batches = (len(articles) + self.batch_size - 1) // self.batch_size
            
            for batch_num in range(total_batches):
                start_idx = batch_num * self.batch_size
                end_idx = min(start_idx + self.batch_size, len(articles))
                batch = articles[start_idx:end_idx]
                
                logger.info(f"\n📦 Processing batch {batch_num + 1}/{total_batches} ({len(batch)} articles)...")
                
                # Get PMIDs for this batch
                pmids = [a.pmid for a in batch]
                
                try:
                    # Generate clusters
                    logger.info(f"   🔨 Generating clusters...")
                    clusters = self.clustering_service.generate_clusters(
                        db, pmids,
                        source_type='batch',
                        source_id=f'batch_{batch_num}'
                    )
                    
                    self.stats['clusters_generated'] += 1
                    self.stats['total_clusters'] += len(clusters)
                    
                    logger.info(f"   ✅ Generated {len(clusters)} clusters")
                    
                    # Update database if requested
                    if self.update_database:
                        logger.info(f"   💾 Updating Article.cluster_id...")
                        self.clustering_service.update_article_clusters(db, clusters)
                        self.stats['articles_clustered'] += len(pmids)
                    
                    # Get quality metrics
                    quality = self.clustering_service.get_cluster_quality_metrics(clusters)
                    logger.info(f"   📊 Quality: {quality['num_clusters']} clusters, modularity: {quality['modularity']:.3f}")
                    
                    # Log cluster details
                    for cluster in clusters.values():
                        logger.info(f"      - {cluster.title}: {cluster.paper_count} papers")
                    
                except Exception as e:
                    logger.error(f"   ❌ Batch {batch_num + 1} failed: {e}")
                    self.stats['failed'] += 1
            
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
        logger.info("📊 CLUSTER POPULATION SUMMARY")
        logger.info("="*70)
        
        logger.info(f"\n📈 Statistics:")
        logger.info(f"   Total articles: {self.stats['total_articles']}")
        logger.info(f"   ✅ Batches processed: {self.stats['clusters_generated']}")
        logger.info(f"   🔍 Total clusters: {self.stats['total_clusters']}")
        logger.info(f"   📊 Articles clustered: {self.stats['articles_clustered']}")
        logger.info(f"   ❌ Failed batches: {self.stats['failed']}")
        
        if self.stats['start_time'] and self.stats['end_time']:
            duration = (self.stats['end_time'] - self.stats['start_time']).total_seconds()
            logger.info(f"\n⏱️  Performance:")
            logger.info(f"   Duration: {duration:.1f} seconds ({duration/60:.1f} minutes)")
            if self.stats['clusters_generated'] > 0:
                rate = self.stats['clusters_generated'] / duration
                logger.info(f"   Rate: {rate:.2f} batches/second")
        
        success_rate = (self.stats['clusters_generated'] / (self.stats['clusters_generated'] + self.stats['failed']) * 100) if (self.stats['clusters_generated'] + self.stats['failed']) > 0 else 0
        logger.info(f"\n🎯 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 95:
            logger.info("🎉 EXCELLENT! Cluster population successful!")
        elif success_rate >= 80:
            logger.info("✅ GOOD! Most clusters created successfully")
        else:
            logger.info("⚠️  WARNING: Low success rate - check errors")
        
        logger.info("="*70 + "\n")


async def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Populate paper clusters")
    parser.add_argument('--limit', type=int, default=None, help="Limit number of articles to process")
    parser.add_argument('--batch-size', type=int, default=100, help="Batch size for processing")
    parser.add_argument('--update-database', action='store_true', help="Update Article.cluster_id")
    
    args = parser.parse_args()
    
    # Create populator
    populator = ClusterPopulator(
        batch_size=args.batch_size,
        update_database=args.update_database
    )
    
    # Run population
    try:
        stats = await populator.populate(limit=args.limit)
        
        # Exit with appropriate code
        if stats['failed'] == 0:
            sys.exit(0)
        elif stats['clusters_generated'] > 0:
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

