#!/usr/bin/env python3
"""
Quick test to verify thesis chapter generator 'objective' error fix
"""

import asyncio
import sys
import os
import time
import uuid
from datetime import datetime

# Add the project root to Python path
sys.path.append('.')

async def test_thesis_chapter_generator():
    """Test thesis chapter generator with the objective fix"""
    print("🔧 TESTING THESIS CHAPTER GENERATOR FIX")
    print("=" * 60)
    
    try:
        # Import required modules
        from database import get_db
        from main import generate_thesis_chapters_endpoint, ThesisChapterRequest
        
        # Create test project with comprehensive data
        test_project_id = str(uuid.uuid4())
        test_user_id = "thesis-test-user@example.com"
        
        print(f"📋 Test Project ID: {test_project_id}")
        print(f"👤 Test User ID: {test_user_id}")
        
        # Create test data in database
        db = next(get_db())
        
        # Create test user
        from sqlalchemy import text
        db.execute(text("""
            INSERT OR IGNORE INTO users (user_id, email, first_name, last_name, category, role, institution, subject_area, how_heard_about_us)
            VALUES (:user_id, :email, 'Thesis', 'Tester', 'Academic', 'PhD Student', 'Test University', 'Computer Science', 'Testing')
        """), {
            "user_id": test_user_id,
            "email": test_user_id
        })
        
        # Create test project with description
        db.execute(text("""
            INSERT OR IGNORE INTO projects (project_id, project_name, description, owner_user_id)
            VALUES (:project_id, :project_name, :description, :owner_user_id)
        """), {
            "project_id": test_project_id,
            "project_name": "PhD Thesis Test Project",
            "description": "Comprehensive analysis of machine learning applications in healthcare with focus on transformer networks and federated learning approaches",
            "owner_user_id": test_user_id
        })
        
        # Create test collection
        collection_id = str(uuid.uuid4())
        db.execute(text("""
            INSERT OR IGNORE INTO collections (collection_id, project_id, collection_name, description, created_by)
            VALUES (:collection_id, :project_id, :collection_name, :description, :created_by)
        """), {
            "collection_id": collection_id,
            "project_id": test_project_id,
            "collection_name": "ML Healthcare Papers",
            "description": "Key papers on machine learning in healthcare",
            "created_by": test_user_id
        })
        
        # Add test articles to collection
        test_articles = [
            {
                "pmid": "thesis_test_1",
                "title": "Transformer Networks for Medical Image Analysis: A Comprehensive Review",
                "authors": "Smith, J., Johnson, A., Brown, K.",
                "journal": "Nature Medicine",
                "year": 2023
            },
            {
                "pmid": "thesis_test_2", 
                "title": "Federated Learning in Healthcare: Privacy-Preserving Machine Learning",
                "authors": "Davis, M., Wilson, R., Taylor, S.",
                "journal": "Journal of Medical Internet Research",
                "year": 2023
            },
            {
                "pmid": "thesis_test_3",
                "title": "Explainable AI for Clinical Decision Support Systems",
                "authors": "Anderson, L., Garcia, P., Lee, C.",
                "journal": "Artificial Intelligence in Medicine",
                "year": 2022
            }
        ]
        
        for article in test_articles:
            # Insert into articles table
            db.execute(text("""
                INSERT OR IGNORE INTO articles (pmid, title, authors, journal, publication_year, abstract)
                VALUES (:pmid, :title, :authors, :journal, :year, :abstract)
            """), {
                "pmid": article["pmid"],
                "title": article["title"],
                "authors": article["authors"],
                "journal": article["journal"],
                "year": article["year"],
                "abstract": f"This paper presents a comprehensive analysis of {article['title'].lower()}. The research demonstrates significant advances in the field with novel methodological approaches and substantial clinical implications."
            })
            
            # Insert into article_collections junction table
            db.execute(text("""
                INSERT OR IGNORE INTO article_collections (collection_id, article_pmid, article_title, article_authors, article_journal, article_year, source_type, added_by)
                VALUES (:collection_id, :article_pmid, :article_title, :article_authors, :article_journal, :article_year, :source_type, :added_by)
            """), {
                "collection_id": collection_id,
                "article_pmid": article["pmid"],
                "article_title": article["title"],
                "article_authors": article["authors"],
                "article_journal": article["journal"],
                "article_year": article["year"],
                "source_type": "manual",
                "added_by": test_user_id
            })
        
        db.commit()
        print("✅ Test data created successfully")
        
        # Create thesis chapter request
        request = ThesisChapterRequest(
            project_id=test_project_id,
            objective="Generate comprehensive PhD thesis chapter structure for machine learning applications in healthcare research",
            chapter_focus="comprehensive",
            academic_level="phd",
            citation_style="apa",
            word_count_target=5000,
            include_methodology=True,
            include_gaps=True
        )
        
        print("🔄 Testing thesis chapter generator...")
        start_time = time.time()
        
        # Test the endpoint
        response = await generate_thesis_chapters_endpoint(request, test_user_id, db)
        
        processing_time = time.time() - start_time
        
        print(f"✅ SUCCESS: Thesis chapter generator completed in {processing_time:.2f}s")
        print(f"📊 Chapters generated: {len(response.chapters)}")
        print(f"📝 Total estimated words: {response.total_estimated_words}")
        print(f"⭐ Quality score: {response.quality_score:.1f}/10")
        
        # Display chapter structure
        print("\n📚 GENERATED CHAPTER STRUCTURE:")
        for i, chapter in enumerate(response.chapters[:3]):  # Show first 3 chapters
            print(f"  Chapter {chapter.get('chapter_number', i+1)}: {chapter.get('title', 'Untitled')}")
            sections = chapter.get('sections', [])
            if sections:
                for section in sections[:2]:  # Show first 2 sections
                    print(f"    - {section}")
                if len(sections) > 2:
                    print(f"    - ... and {len(sections)-2} more sections")
        
        if len(response.chapters) > 3:
            print(f"  ... and {len(response.chapters)-3} more chapters")
        
        # Check if the objective error is fixed
        if response.chapters and len(response.chapters) > 0:
            print("\n🎉 OBJECTIVE ERROR FIXED! Thesis generator is working properly.")
            return True
        else:
            print("\n❌ Issue persists: No chapters generated")
            return False
            
    except Exception as e:
        print(f"❌ FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        # Cleanup test data
        try:
            db.execute(text("DELETE FROM article_collections WHERE collection_id = :collection_id"), {"collection_id": collection_id})
            db.execute(text("DELETE FROM collections WHERE collection_id = :collection_id"), {"collection_id": collection_id})
            db.execute(text("DELETE FROM articles WHERE pmid LIKE 'thesis_test_%'"))
            db.execute(text("DELETE FROM projects WHERE project_id = :project_id"), {"project_id": test_project_id})
            db.execute(text("DELETE FROM users WHERE user_id = :user_id"), {"user_id": test_user_id})
            db.commit()
            print("🧹 Test data cleaned up")
        except Exception as cleanup_error:
            print(f"⚠️ Cleanup warning: {cleanup_error}")

if __name__ == "__main__":
    result = asyncio.run(test_thesis_chapter_generator())
    if result:
        print("\n✅ THESIS CHAPTER GENERATOR FIX SUCCESSFUL")
        sys.exit(0)
    else:
        print("\n❌ THESIS CHAPTER GENERATOR FIX FAILED")
        sys.exit(1)
