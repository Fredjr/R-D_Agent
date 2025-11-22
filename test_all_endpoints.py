"""
Test all endpoints to verify they work correctly after fixes
"""
import os
import sys
import asyncio
from sqlalchemy.orm import Session

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from database import SessionLocal, Project, ResearchQuestion, Hypothesis, Article
from backend.app.services.insights_service import InsightsService
from backend.app.services.living_summary_service import LivingSummaryService
from backend.app.services.ai_triage_service import AITriageService
from backend.app.services.intelligent_protocol_extractor import ProtocolExtractor
from backend.app.services.experiment_planner_service import ExperimentPlannerService

async def test_insights_endpoint():
    """Test insights generation"""
    print("\n" + "="*80)
    print("TEST 1: INSIGHTS ENDPOINT")
    print("="*80)
    
    db = SessionLocal()
    try:
        # Get first project
        project = db.query(Project).first()
        if not project:
            print("❌ No projects found")
            return False
            
        print(f"✓ Testing with project: {project.project_id}")
        
        service = InsightsService()
        result = await service.generate_insights(
            project_id=project.project_id,
            user_id="test@example.com",
            db=db
        )
        
        print(f"✅ Insights generated successfully!")
        print(f"   - Key findings: {len(result.get('key_findings', []))}")
        print(f"   - Recommendations: {len(result.get('recommendations', []))}")
        return True
        
    except Exception as e:
        print(f"❌ Insights test failed: {e}")
        return False
    finally:
        db.close()

async def test_summary_endpoint():
    """Test summary generation"""
    print("\n" + "="*80)
    print("TEST 2: SUMMARY ENDPOINT")
    print("="*80)
    
    db = SessionLocal()
    try:
        # Get first project
        project = db.query(Project).first()
        if not project:
            print("❌ No projects found")
            return False
            
        print(f"✓ Testing with project: {project.project_id}")
        
        service = LivingSummaryService()
        result = await service.generate_summary(
            project_id=project.project_id,
            user_id="test@example.com",
            db=db
        )
        
        print(f"✅ Summary generated successfully!")
        print(f"   - Overall progress: {result.get('overall_progress', 'N/A')[:50]}...")
        print(f"   - Timeline events: {len(result.get('timeline_events', []))}")
        return True
        
    except Exception as e:
        print(f"❌ Summary test failed: {e}")
        return False
    finally:
        db.close()

async def test_triage_endpoint():
    """Test triage endpoint"""
    print("\n" + "="*80)
    print("TEST 3: TRIAGE ENDPOINT")
    print("="*80)
    
    db = SessionLocal()
    try:
        # Get first project and article
        project = db.query(Project).first()
        article = db.query(Article).first()
        
        if not project or not article:
            print("❌ No project or article found")
            return False
            
        print(f"✓ Testing with project: {project.project_id}")
        print(f"✓ Testing with article: {article.pmid}")
        
        service = AITriageService()
        result = await service.triage_paper(
            article_pmid=article.pmid,
            project_id=project.project_id,
            user_id="test@example.com",
            db=db
        )
        
        print(f"✅ Triage completed successfully!")
        print(f"   - Status: {result.get('triage_status', 'N/A')}")
        print(f"   - Relevance: {result.get('relevance_score', 0)}/100")
        return True
        
    except Exception as e:
        print(f"❌ Triage test failed: {e}")
        return False
    finally:
        db.close()

async def test_protocol_endpoint():
    """Test protocol extraction"""
    print("\n" + "="*80)
    print("TEST 4: PROTOCOL ENDPOINT")
    print("="*80)
    
    db = SessionLocal()
    try:
        # Get first project and article
        project = db.query(Project).first()
        article = db.query(Article).first()
        
        if not project or not article:
            print("❌ No project or article found")
            return False
            
        print(f"✓ Testing with project: {project.project_id}")
        print(f"✓ Testing with article: {article.pmid}")
        
        service = ProtocolExtractor()
        result = await service.extract_protocol_with_context(
            article_pmid=article.pmid,
            project_id=project.project_id,
            user_id="test@example.com",
            db=db
        )
        
        print(f"✅ Protocol extracted successfully!")
        print(f"   - Protocol name: {result.get('protocol_name', 'N/A')[:50]}...")
        print(f"   - Relevance: {result.get('relevance_score', 0)}/100")
        return True
        
    except Exception as e:
        print(f"❌ Protocol test failed: {e}")
        return False
    finally:
        db.close()

async def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("TESTING ALL ENDPOINTS AFTER FIXES")
    print("="*80)
    
    results = []
    
    # Test each endpoint
    results.append(("Insights", await test_insights_endpoint()))
    results.append(("Summary", await test_summary_endpoint()))
    results.append(("Triage", await test_triage_endpoint()))
    results.append(("Protocol", await test_protocol_endpoint()))
    
    # Print summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    for name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{name:20s} {status}")
    
    total = len(results)
    passed = sum(1 for _, p in results if p)
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! All endpoints are working correctly.")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please check the errors above.")

if __name__ == "__main__":
    asyncio.run(main())

