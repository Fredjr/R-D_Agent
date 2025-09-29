#!/usr/bin/env python3

import sys
import asyncio
sys.path.append('.')

from services.ai_recommendations_service import get_spotify_recommendations_service
from database import get_db

async def test_recommendations():
    """Test the recommendation system"""
    try:
        service = get_spotify_recommendations_service()
        db = next(get_db())
        
        print('🧪 Testing recommendations for test_user_collections@example.com...')
        result = await service.get_weekly_recommendations('test_user_collections@example.com')
        
        print(f'📊 Result status: {result.get("status", "unknown")}')
        
        if 'recommendations' in result:
            recs = result['recommendations']
            papers_for_you = recs.get('papers_for_you', {}).get('papers', [])
            trending = recs.get('trending_in_field', {}).get('papers', [])
            cross_poll = recs.get('cross_pollination', {}).get('papers', [])
            
            print(f'📄 Papers for You: {len(papers_for_you)} papers')
            print(f'🔥 Trending: {len(trending)} papers')
            print(f'🔬 Cross-pollination: {len(cross_poll)} papers')
            
            # Show sample papers
            if papers_for_you:
                sample = papers_for_you[0]
                print(f'📄 Sample paper: {sample.get("title", "No title")[:60]}...')
                print(f'📄 Relevance score: {sample.get("relevance_score", "N/A")}')
                print(f'📄 Is fallback: {sample.get("is_fallback", "N/A")}')
                print(f'📄 Reason: {sample.get("reason", "N/A")}')
        else:
            print('❌ No recommendations found in result')
            print(f'Result keys: {list(result.keys())}')
            if 'error' in result:
                print(f'Error: {result["error"]}')

        db.close()
        
    except Exception as e:
        print(f'❌ Error testing recommendations: {e}')
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(test_recommendations())
