#!/usr/bin/env python3
"""
Debug Database Articles Script
Check what articles are in the database and their metadata quality
"""

import requests
import json

def debug_articles():
    """Debug the articles in the database"""
    backend_url = "https://r-dagent-production.up.railway.app"
    user_id = "fredericle77@gmail.com"
    
    headers = {
        "User-ID": user_id,
        "Content-Type": "application/json"
    }
    
    print("🔍 Debugging database articles...")
    
    # Get recommendations to see what's being returned
    try:
        url = f"{backend_url}/recommendations/weekly/{user_id}?force_refresh=true"
        print(f"📡 Calling: {url}")
        
        response = requests.get(url, headers=headers, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            
            print("\n📊 RECOMMENDATION STATISTICS:")
            recs = data.get("recommendations", {})
            
            print(f"📚 Papers for You: {len(recs.get('papers_for_you', []))}")
            print(f"🔥 Trending: {len(recs.get('trending_in_field', []))}")
            print(f"🔬 Cross-pollination: {len(recs.get('cross_pollination', []))}")
            print(f"💡 Citation Opportunities: {len(recs.get('citation_opportunities', []))}")
            
            # Check for generic titles
            all_papers = []
            for category, papers in recs.items():
                if isinstance(papers, list):
                    all_papers.extend(papers)
            
            generic_titles = [p for p in all_papers if 
                            p.get('title', '').startswith(('Citation Article', 'Reference Article'))]
            
            valid_titles = [p for p in all_papers if 
                          p.get('title') and not p.get('title', '').startswith(('Citation Article', 'Reference Article'))]
            
            print(f"\n🎯 TITLE QUALITY:")
            print(f"✅ Valid titles: {len(valid_titles)}")
            print(f"❌ Generic titles: {len(generic_titles)}")
            
            if generic_titles:
                print(f"\n🚨 GENERIC TITLES FOUND:")
                for paper in generic_titles[:5]:
                    print(f"  - {paper.get('pmid')}: {paper.get('title')}")
            
            if valid_titles:
                print(f"\n✨ SAMPLE VALID TITLES:")
                for paper in valid_titles[:5]:
                    print(f"  - {paper.get('pmid')}: {paper.get('title')[:80]}...")
                    
            # Check citation opportunities specifically
            citation_opps = recs.get('citation_opportunities', [])
            if citation_opps:
                print(f"\n💡 CITATION OPPORTUNITIES DETAILS:")
                for paper in citation_opps:
                    print(f"  - {paper.get('pmid')}: {paper.get('title')[:60]}... (Citations: {paper.get('citation_count', 0)})")
            else:
                print(f"\n⚠️ NO CITATION OPPORTUNITIES FOUND")
                
        else:
            print(f"❌ Error: Status {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    debug_articles()
