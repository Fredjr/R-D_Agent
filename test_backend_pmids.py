#!/usr/bin/env python3
"""
Test the updated backend PDF extraction for all user-provided PMIDs.
"""

import asyncio
import httpx

# Test PMIDs from user
TEST_PMIDS = [
    "29622564",   # J Cell Biol - Silverchair + PMC
    "33264825",   # NEJM - NEJM Full Text
    "33099609",   # Eur Heart J - Oxford Academic + PMC
    "37345492",   # J Hypertension - Wolters Kluwer
    "38285982",   # Ann Intern Med - ACP Journals + PMC
    "40331662",   # Arthritis Rheumatol - Wiley
    "40327845",   # JASN - Wolters Kluwer + PMC
    "38278529",   # BMJ - HighWire (FIXED)
    "41021024",   # Wien Klin Wochenschr - Springer + PMC
    "36719097",   # Ann Med - Taylor & Francis + PMC
]

BACKEND_URL = "https://r-dagent-production.up.railway.app"


async def test_pmid(pmid: str):
    """Test PDF extraction for a single PMID."""
    print(f"\n{'='*80}")
    print(f"📄 Testing PMID: {pmid}")
    print(f"{'='*80}")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{BACKEND_URL}/articles/{pmid}/pdf-url",
                headers={"User-ID": "test-user"}
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Status: {response.status_code}")
                print(f"📋 Title: {data.get('title', 'N/A')[:80]}...")
                print(f"🔗 Source: {data.get('source', 'N/A')}")
                print(f"🔗 URL: {data.get('url', 'N/A')}")
                print(f"📄 PDF Available: {data.get('pdf_available', False)}")
                
                if data.get('pdf_available'):
                    print(f"✅ SUCCESS - PDF found via {data.get('source')}")
                else:
                    print(f"⚠️  WARNING - No PDF available, returned {data.get('source')} link")
                
                return {
                    "pmid": pmid,
                    "success": data.get('pdf_available', False),
                    "source": data.get('source'),
                    "url": data.get('url')
                }
            else:
                print(f"❌ Status: {response.status_code}")
                print(f"❌ Error: {response.text}")
                return {
                    "pmid": pmid,
                    "success": False,
                    "source": "error",
                    "url": None
                }
    
    except Exception as e:
        print(f"❌ Exception: {e}")
        return {
            "pmid": pmid,
            "success": False,
            "source": "exception",
            "url": None
        }


async def main():
    """Test all PMIDs."""
    print("🧪 Testing PDF extraction for all PMIDs...")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Total PMIDs to test: {len(TEST_PMIDS)}")
    
    results = []
    for pmid in TEST_PMIDS:
        result = await test_pmid(pmid)
        results.append(result)
        await asyncio.sleep(0.5)  # Be nice to the backend
    
    # Summary
    print(f"\n\n{'='*80}")
    print("📊 SUMMARY")
    print(f"{'='*80}")
    
    success_count = sum(1 for r in results if r['success'])
    print(f"✅ Successful: {success_count}/{len(TEST_PMIDS)}")
    print(f"❌ Failed: {len(TEST_PMIDS) - success_count}/{len(TEST_PMIDS)}")
    
    print(f"\n📋 Results by Source:")
    sources = {}
    for r in results:
        source = r['source']
        sources[source] = sources.get(source, 0) + 1
    
    for source, count in sorted(sources.items(), key=lambda x: x[1], reverse=True):
        print(f"   • {source}: {count}")
    
    print(f"\n📋 Failed PMIDs:")
    for r in results:
        if not r['success']:
            print(f"   • {r['pmid']}: {r['source']}")


if __name__ == "__main__":
    asyncio.run(main())

