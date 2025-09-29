#!/usr/bin/env python3

import sys
import asyncio
import traceback
sys.path.append('.')

from services.ai_recommendations_service import get_spotify_recommendations_service
from database import get_db

async def debug_recommendations():
    """Debug the recommendation system step by step"""
    try:
        service = get_spotify_recommendations_service()
        db = next(get_db())
        
        print('🔍 Step 1: Testing user profile building...')
        user_profile = await service._build_user_research_profile('test_user_collections@example.com', None, db)
        print(f'👤 User profile keys: {list(user_profile.keys()) if user_profile else "None"}')
        
        if user_profile:
            print(f'👤 Primary domains: {user_profile.get("primary_domains", [])}')
            print(f'👤 Activity level: {user_profile.get("activity_level", "unknown")}')
        
        print('\n🔍 Step 2: Testing individual recommendation methods...')
        
        # Test papers-for-you
        try:
            papers_for_you = await service._generate_papers_for_you(user_profile or {}, db)
            print(f'📄 Papers-for-you type: {type(papers_for_you)}')
            if isinstance(papers_for_you, dict):
                print(f'📄 Papers-for-you keys: {list(papers_for_you.keys())}')
                if 'papers' in papers_for_you:
                    print(f'📄 Papers count: {len(papers_for_you["papers"])}')
        except Exception as e:
            print(f'❌ Papers-for-you error: {e}')
            traceback.print_exc()
        
        # Test trending
        try:
            trending = await service._generate_trending_in_field(user_profile or {}, db)
            print(f'🔥 Trending type: {type(trending)}')
            if isinstance(trending, dict):
                print(f'🔥 Trending keys: {list(trending.keys())}')
                if 'papers' in trending:
                    print(f'🔥 Trending count: {len(trending["papers"])}')
        except Exception as e:
            print(f'❌ Trending error: {e}')
            traceback.print_exc()
        
        print('\n🔍 Step 3: Testing raw recommendations structure...')
        
        try:
            raw_recommendations = {
                "papers_for_you": await service._generate_papers_for_you(user_profile or {}, db),
                "trending_in_field": await service._generate_trending_in_field(user_profile or {}, db),
                "cross_pollination": await service._generate_cross_pollination(user_profile or {}, db),
                "citation_opportunities": await service._generate_citation_opportunities(user_profile or {}, db)
            }
            
            print(f'📊 Raw recommendations type: {type(raw_recommendations)}')
            print(f'📊 Raw recommendations keys: {list(raw_recommendations.keys())}')
            
            for key, value in raw_recommendations.items():
                print(f'📊 {key}: type={type(value)}, keys={list(value.keys()) if isinstance(value, dict) else "not dict"}')
                
        except Exception as e:
            print(f'❌ Raw recommendations error: {e}')
            traceback.print_exc()
        
        db.close()
        
    except Exception as e:
        print(f'❌ Debug error: {e}')
        traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(debug_recommendations())
