"""
Graph Population Script - Sprint 2A
Builds citation graphs and computes network metrics for all articles

Usage:
    python3 scripts/populate_graphs.py [--limit N] [--batch-size N] [--update-centrality]

Options:
    --limit N: Process only N articles (default: all)
    --batch-size N: Batch size for graph construction (default: 100)
    --update-centrality: Update Article.centrality_score in database
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import argparse
from datetime import datetime
from sqlalchemy import func
from database import get_session_local, Article
from services.graph_builder_service import get_graph_builder_service
from services.network_analysis_service import get_network_analysis_service
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class GraphPopulator:
    """Graph population service"""
    
    def __init__(self, batch_size: int = 100, update_centrality: bool = False):
        self.batch_size = batch_size
        self.update_centrality = update_centrality
        self.graph_service = get_graph_builder_service()
        self.analysis_service = get_network_analysis_service()
        self.stats = {
            'total_articles': 0,
            'graphs_built': 0,
            'centrality_computed': 0,
            'communities_detected': 0,
            'failed': 0,
            'start_time': None,
            'end_time': None
        }
    
    def get_articles_to_process(self, db, limit: int = None):
        """Get articles for graph construction"""
        logger.info("📊 Analyzing articles in database...")
        
        # Count total articles
        total_articles = db.query(func.count(Article.pmid)).scalar()
        self.stats['total_articles'] = total_articles
        logger.info(f"   Total articles in database: {total_articles}")
        
        # Get articles with citation data
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
        logger.info("🚀 STARTING GRAPH POPULATION")
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
                    # Build citation graph
                    logger.info(f"   🔨 Building citation graph...")
                    graph_data = self.graph_service.build_citation_graph(
                        db, pmids,
                        source_type='batch',
                        source_id=f'batch_{batch_num}'
                    )
                    self.stats['graphs_built'] += 1
                    
                    logger.info(f"   ✅ Graph built: {len(graph_data['nodes'])} nodes, {len(graph_data['edges'])} edges")
                    
                    # Compute centrality metrics
                    logger.info(f"   📊 Computing centrality metrics...")
                    metrics = self.analysis_service.compute_centrality_metrics(graph_data)
                    self.stats['centrality_computed'] += len(metrics)
                    
                    # Update database if requested
                    if self.update_centrality:
                        logger.info(f"   💾 Updating Article.centrality_score...")
                        self.analysis_service.update_article_centrality_scores(db, metrics)
                    
                    # Detect communities
                    logger.info(f"   🔍 Detecting communities...")
                    communities = self.analysis_service.detect_communities(graph_data)
                    self.stats['communities_detected'] += communities['num_communities']
                    
                    logger.info(f"   ✅ Batch {batch_num + 1} complete: {communities['num_communities']} communities (modularity: {communities['modularity']:.3f})")
                    
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
        logger.info("📊 GRAPH POPULATION SUMMARY")
        logger.info("="*70)
        
        logger.info(f"\n📈 Statistics:")
        logger.info(f"   Total articles: {self.stats['total_articles']}")
        logger.info(f"   ✅ Graphs built: {self.stats['graphs_built']}")
        logger.info(f"   📊 Centrality computed: {self.stats['centrality_computed']} nodes")
        logger.info(f"   🔍 Communities detected: {self.stats['communities_detected']}")
        logger.info(f"   ❌ Failed batches: {self.stats['failed']}")
        
        if self.stats['start_time'] and self.stats['end_time']:
            duration = (self.stats['end_time'] - self.stats['start_time']).total_seconds()
            logger.info(f"\n⏱️  Performance:")
            logger.info(f"   Duration: {duration:.1f} seconds ({duration/60:.1f} minutes)")
            if self.stats['graphs_built'] > 0:
                rate = self.stats['graphs_built'] / duration
                logger.info(f"   Rate: {rate:.2f} graphs/second")
        
        success_rate = (self.stats['graphs_built'] / (self.stats['graphs_built'] + self.stats['failed']) * 100) if (self.stats['graphs_built'] + self.stats['failed']) > 0 else 0
        logger.info(f"\n🎯 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 95:
            logger.info("🎉 EXCELLENT! Graph population successful!")
        elif success_rate >= 80:
            logger.info("✅ GOOD! Most graphs created successfully")
        else:
            logger.info("⚠️  WARNING: Low success rate - check errors")
        
        logger.info("="*70 + "\n")


async def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Populate citation graphs")
    parser.add_argument('--limit', type=int, default=None, help="Limit number of articles to process")
    parser.add_argument('--batch-size', type=int, default=100, help="Batch size for processing")
    parser.add_argument('--update-centrality', action='store_true', help="Update Article.centrality_score")
    
    args = parser.parse_args()
    
    # Create populator
    populator = GraphPopulator(
        batch_size=args.batch_size,
        update_centrality=args.update_centrality
    )
    
    # Run population
    try:
        stats = await populator.populate(limit=args.limit)
        
        # Exit with appropriate code
        if stats['failed'] == 0:
            sys.exit(0)
        elif stats['graphs_built'] > 0:
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

