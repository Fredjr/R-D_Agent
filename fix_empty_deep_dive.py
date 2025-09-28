#!/usr/bin/env python3
"""
Fix Empty Deep Dive Analysis for PMID 29622564
Analysis ID: dda55347-754f-4baf-8b26-de6c4ea260fa

This script will:
1. Fetch the article details from PubMed
2. Regenerate the deep dive analysis with proper content
3. Update the analysis record with real results
"""

import requests
import json
import time
from typing import Dict, Any, Optional

# Configuration
BACKEND_URL = "https://r-dagent-production.up.railway.app"
USER_ID = "fredericle77@gmail.com"
ANALYSIS_ID = "dda55347-754f-4baf-8b26-de6c4ea260fa"
PMID = "29622564"

def fetch_pubmed_article(pmid: str) -> Optional[Dict[str, Any]]:
    """Fetch article details from PubMed"""
    try:
        print(f"🔍 Fetching PubMed article for PMID: {pmid}")
        
        # Use PubMed eutils API
        fetch_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id={pmid}&retmode=xml&rettype=abstract"
        
        response = requests.get(fetch_url, headers={
            'User-Agent': 'RD-Agent/1.0 (Research Discovery Tool)'
        })
        
        if not response.ok:
            print(f"❌ PubMed fetch failed: {response.status_code}")
            return None
            
        xml_content = response.text
        print(f"✅ Fetched PubMed XML ({len(xml_content)} chars)")
        
        # Parse basic info from XML (simplified)
        import re
        
        # Extract title
        title_match = re.search(r'<ArticleTitle>(.*?)</ArticleTitle>', xml_content, re.DOTALL)
        title = title_match.group(1).strip() if title_match else f"Article {pmid}"
        
        # Extract abstract
        abstract_match = re.search(r'<AbstractText[^>]*>(.*?)</AbstractText>', xml_content, re.DOTALL)
        abstract = abstract_match.group(1).strip() if abstract_match else ""
        
        # Clean HTML tags
        title = re.sub(r'<[^>]+>', '', title)
        abstract = re.sub(r'<[^>]+>', '', abstract)
        
        print(f"📄 Title: {title[:100]}...")
        print(f"📝 Abstract: {len(abstract)} chars")
        
        return {
            "pmid": pmid,
            "title": title,
            "abstract": abstract,
            "xml_content": xml_content
        }
        
    except Exception as e:
        print(f"❌ Error fetching PubMed article: {e}")
        return None

def regenerate_deep_dive_analysis(article: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Regenerate deep dive analysis using the backend API"""
    try:
        print(f"🔬 Regenerating deep dive analysis for: {article['title'][:50]}...")
        
        # Prepare payload for deep dive analysis
        payload = {
            "pmid": article["pmid"],
            "title": article["title"],
            "abstract": article["abstract"],
            "objective": f"Deep dive analysis of: {article['title']}",
            "analysis_mode": "abstract_based",  # Use abstract since we don't have full text
            "content_source": "pubmed_abstract",
            "require_full_text": False,
            "fallback_to_abstract": True,
            "include_methodology": True,
            "include_results": True,
            "include_implications": True
        }
        
        print(f"📤 Sending deep dive request...")
        
        response = requests.post(
            f"{BACKEND_URL}/deep-dive",
            headers={
                'Content-Type': 'application/json',
                'User-ID': USER_ID
            },
            json=payload,
            timeout=120  # 2 minutes timeout
        )
        
        if response.ok:
            result = response.json()
            print(f"✅ Deep dive analysis completed successfully")
            print(f"📊 Sections: {len(result.get('sections', []))}")
            print(f"🔍 Analysis: {'Yes' if result.get('analysis') else 'No'}")
            return result
        else:
            print(f"❌ Deep dive analysis failed: {response.status_code}")
            print(f"Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error regenerating deep dive analysis: {e}")
        return None

def update_analysis_record(analysis_result: Dict[str, Any], article: Dict[str, Any]) -> bool:
    """Update the analysis record in the database"""
    try:
        print(f"💾 Updating analysis record: {ANALYSIS_ID}")
        
        # Prepare update payload
        update_payload = {
            "processing_status": "completed",
            "article_pmid": article["pmid"],
            "article_title": article["title"],
            "results": analysis_result,
            "updated_at": time.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        }
        
        response = requests.patch(
            f"{BACKEND_URL}/deep-dive-analyses/{ANALYSIS_ID}",
            headers={
                'Content-Type': 'application/json',
                'User-ID': USER_ID
            },
            json=update_payload
        )
        
        if response.ok:
            print(f"✅ Analysis record updated successfully")
            return True
        else:
            print(f"❌ Failed to update analysis record: {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error updating analysis record: {e}")
        return False

def main():
    """Main execution function"""
    print("🚀 Starting Deep Dive Analysis Fix")
    print(f"Analysis ID: {ANALYSIS_ID}")
    print(f"PMID: {PMID}")
    print("-" * 50)
    
    # Step 1: Fetch article from PubMed
    article = fetch_pubmed_article(PMID)
    if not article:
        print("❌ Failed to fetch article from PubMed")
        return False
    
    # Step 2: Regenerate deep dive analysis
    analysis_result = regenerate_deep_dive_analysis(article)
    if not analysis_result:
        print("❌ Failed to regenerate deep dive analysis")
        return False
    
    # Step 3: Update analysis record
    success = update_analysis_record(analysis_result, article)
    if not success:
        print("❌ Failed to update analysis record")
        return False
    
    print("-" * 50)
    print("🎉 Deep Dive Analysis Fix Completed Successfully!")
    print(f"🔗 View updated analysis: https://frontend-psi-seven-85.vercel.app/analysis/{ANALYSIS_ID}")
    
    return True

if __name__ == "__main__":
    main()
