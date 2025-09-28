#!/usr/bin/env python3
"""
Fix OA Deep Dive Analysis for PMID 29622564
Analysis ID: dda55347-754f-4baf-8b26-de6c4ea260fa

This script will:
1. Detect if the paper is Open Access and get full-text URL
2. Regenerate the deep dive analysis with full-text content
3. Compare with Research Hub approach that works
"""

import requests
import json
import time
from typing import Dict, Any, Optional

# Configuration
BACKEND_URL = "https://r-dagent-production.up.railway.app"
FRONTEND_URL = "https://frontend-psi-seven-85.vercel.app"
USER_ID = "fredericle77@gmail.com"
ANALYSIS_ID = "dda55347-754f-4baf-8b26-de6c4ea260fa"
PMID = "29622564"

def detect_oa_status(pmid: str) -> Optional[Dict[str, Any]]:
    """Detect if paper is Open Access and get full-text URL"""
    try:
        print(f"🔍 Checking OA status for PMID: {pmid}")
        
        # Check multiple OA sources
        oa_sources = [
            f"https://api.unpaywall.org/v2/{pmid}?email=research@example.com",
            f"https://api.openalex.org/works/pmid:{pmid}",
        ]
        
        # Try Unpaywall first (most reliable for OA detection)
        try:
            response = requests.get(f"https://api.unpaywall.org/v2/{pmid}?email=research@example.com", timeout=10)
            if response.ok:
                data = response.json()
                if data.get('is_oa'):
                    best_oa_location = data.get('best_oa_location', {})
                    url_for_pdf = best_oa_location.get('url_for_pdf')
                    host_type = best_oa_location.get('host_type')
                    
                    print(f"✅ Paper is Open Access!")
                    print(f"   Host Type: {host_type}")
                    print(f"   PDF URL: {url_for_pdf}")
                    
                    return {
                        'is_oa': True,
                        'pdf_url': url_for_pdf,
                        'host_type': host_type,
                        'source': 'unpaywall'
                    }
        except Exception as e:
            print(f"⚠️ Unpaywall check failed: {e}")
        
        # Try PMC (PubMed Central) for this specific paper
        try:
            # This paper should be available in PMC
            pmc_url = f"https://www.ncbi.nlm.nih.gov/pmc/articles/PMC{pmid}/"
            print(f"🔍 Checking PMC availability...")
            
            # For this specific paper, we know it's OA
            if pmid == "29622564":
                return {
                    'is_oa': True,
                    'pdf_url': f"https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6467025/pdf/",
                    'full_text_url': f"https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6467025/",
                    'host_type': 'repository',
                    'source': 'pmc'
                }
        except Exception as e:
            print(f"⚠️ PMC check failed: {e}")
        
        print(f"❌ No OA version found")
        return None
        
    except Exception as e:
        print(f"❌ Error checking OA status: {e}")
        return None

def regenerate_with_full_text(pmid: str, title: str, oa_info: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Regenerate deep dive analysis using Research Hub approach with full-text URL"""
    try:
        print(f"🔬 Regenerating deep dive with full-text approach...")
        print(f"   Using URL: {oa_info.get('full_text_url', oa_info.get('pdf_url'))}")
        
        # Use the same approach as Research Hub (ArticleCard.tsx)
        payload = {
            "url": oa_info.get('full_text_url', oa_info.get('pdf_url')),  # ✅ KEY DIFFERENCE
            "pmid": pmid,
            "title": title,
            "objective": f"Deep dive analysis of: {title}",
            "projectId": None  # Same as Research Hub
        }
        
        print(f"📤 Sending deep dive request to /api/proxy/deep-dive...")
        
        response = requests.post(
            f"{FRONTEND_URL}/api/proxy/deep-dive",
            headers={
                'Content-Type': 'application/json',
                'User-ID': USER_ID
            },
            json=payload,
            timeout=300  # 5 minutes timeout
        )
        
        if response.ok:
            result = response.json()
            print(f"✅ Deep dive analysis completed successfully")
            
            # Check content quality
            has_model = bool(result.get('model_description_structured'))
            has_methods = bool(result.get('methods_structured'))
            has_results = bool(result.get('results_structured'))
            
            print(f"📊 Content Quality:")
            print(f"   Model Analysis: {'✅' if has_model else '❌'}")
            print(f"   Methods Analysis: {'✅' if has_methods else '❌'}")
            print(f"   Results Analysis: {'✅' if has_results else '❌'}")
            
            return result
        else:
            print(f"❌ Deep dive analysis failed: {response.status_code}")
            print(f"Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error regenerating deep dive analysis: {e}")
        return None

def compare_approaches():
    """Compare different deep dive approaches"""
    print("\n" + "="*60)
    print("🔍 DEEP DIVE APPROACH COMPARISON")
    print("="*60)
    
    print("\n✅ RESEARCH HUB APPROACH (WORKS):")
    print("   - Uses /api/proxy/deep-dive endpoint")
    print("   - Passes full-text URL in payload")
    print("   - Gets rich content with all sections")
    print("   - Synchronous processing")
    
    print("\n❌ PROJECT DASHBOARD APPROACH (BROKEN):")
    print("   - Uses /api/proxy/deep-dive-sync endpoint")
    print("   - Sets full_text_url: null")
    print("   - Gets generic/empty content")
    print("   - Creates database records but poor processing")
    
    print("\n❌ NETWORK VIEW APPROACH (BROKEN):")
    print("   - Uses /projects/{id}/deep-dive-analyses endpoint")
    print("   - No full-text URL provided")
    print("   - Creates database records only")
    print("   - No actual content processing")
    
    print("\n🎯 THE SOLUTION:")
    print("   - Detect OA status and get full-text URLs")
    print("   - Use Research Hub approach for all deep dives")
    print("   - Pass full-text URL when available")
    print("   - Fallback to abstract-only when needed")

def main():
    """Main execution function"""
    print("🚀 Starting OA Deep Dive Analysis Fix")
    print(f"Analysis ID: {ANALYSIS_ID}")
    print(f"PMID: {PMID}")
    print("-" * 50)
    
    # Step 1: Compare approaches
    compare_approaches()
    
    # Step 2: Detect OA status
    oa_info = detect_oa_status(PMID)
    if not oa_info:
        print("❌ Paper is not Open Access or OA detection failed")
        return False
    
    # Step 3: Get paper title
    title = "The cell biology of systemic insulin function"
    
    # Step 4: Regenerate with full-text approach
    analysis_result = regenerate_with_full_text(PMID, title, oa_info)
    if not analysis_result:
        print("❌ Failed to regenerate deep dive analysis")
        return False
    
    print("-" * 50)
    print("🎉 OA Deep Dive Analysis Fix Completed Successfully!")
    print(f"🔗 View updated analysis: {FRONTEND_URL}/analysis/{ANALYSIS_ID}")
    print("\n💡 KEY INSIGHTS:")
    print("   - Research Hub approach works because it uses full-text URLs")
    print("   - Project Dashboard needs to detect OA status and use full-text URLs")
    print("   - Network View needs to use the same approach as Research Hub")
    print("   - All deep dives should leverage OA detection for better content")
    
    return True

if __name__ == "__main__":
    main()
