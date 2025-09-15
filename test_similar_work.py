"""
Test script for Similar Work Discovery endpoints
Creates test articles and tests the similarity functionality
"""

import requests
import json
from database import get_db, Article
from sqlalchemy.orm import Session

def create_test_articles():
    """Create test articles in the database"""
    db = next(get_db())
    
    # Test articles with similar content
    test_articles = [
        {
            "pmid": "test001",
            "title": "Machine Learning Applications in Drug Discovery and Development",
            "abstract": "This comprehensive review explores the application of machine learning algorithms in pharmaceutical drug discovery processes. We examine various ML techniques including deep learning, random forests, and support vector machines for molecular property prediction, drug-target interaction modeling, and compound optimization.",
            "authors": ["Smith, John A.", "Johnson, Mary B.", "Brown, David C."],
            "journal": "Nature Biotechnology",
            "publication_year": 2023,
            "doi": "10.1038/nbt.test001",
            "citation_count": 45,
            "references_pmids": ["ref001", "ref002", "ref003"],
            "cited_by_pmids": ["cite001", "cite002"]
        },
        {
            "pmid": "test002", 
            "title": "Deep Learning for Pharmaceutical Research and Drug Development",
            "abstract": "We present novel deep learning approaches for accelerating pharmaceutical drug development. Our methods include convolutional neural networks for molecular structure analysis, recurrent networks for sequence-based predictions, and transformer models for drug-protein interaction prediction.",
            "authors": ["Smith, John A.", "Davis, Sarah E.", "Wilson, Robert F."],
            "journal": "Nature Biotechnology",
            "publication_year": 2023,
            "doi": "10.1038/nbt.test002",
            "citation_count": 38,
            "references_pmids": ["ref002", "ref003", "ref004"],
            "cited_by_pmids": ["cite003", "cite004"]
        },
        {
            "pmid": "test003",
            "title": "Artificial Intelligence in Medical Diagnosis and Treatment Planning",
            "abstract": "This study investigates the use of artificial intelligence systems for medical diagnosis and treatment planning. We developed AI models for image analysis, patient data interpretation, and personalized treatment recommendations using electronic health records.",
            "authors": ["Garcia, Maria L.", "Thompson, James K.", "Lee, Susan M."],
            "journal": "Nature Medicine",
            "publication_year": 2023,
            "doi": "10.1038/nm.test003",
            "citation_count": 52,
            "references_pmids": ["ref005", "ref006"],
            "cited_by_pmids": ["cite005", "cite006", "cite007"]
        },
        {
            "pmid": "test004",
            "title": "Climate Change Impact on Agricultural Crop Yields",
            "abstract": "We analyze the effects of climate change on global agricultural productivity. Our research examines temperature variations, precipitation patterns, and extreme weather events on crop yields across different geographical regions and farming systems.",
            "authors": ["Green, Patricia A.", "White, Michael B."],
            "journal": "Environmental Science & Technology",
            "publication_year": 2022,
            "doi": "10.1021/est.test004",
            "citation_count": 28,
            "references_pmids": ["ref007", "ref008"],
            "cited_by_pmids": ["cite008"]
        },
        {
            "pmid": "test005",
            "title": "Neural Networks for Drug-Target Interaction Prediction",
            "abstract": "This paper presents advanced neural network architectures for predicting drug-target interactions. We combine graph neural networks with attention mechanisms to model molecular structures and protein binding sites for improved drug discovery applications.",
            "authors": ["Chen, Li W.", "Smith, John A.", "Kumar, Raj P."],
            "journal": "Nature Biotechnology", 
            "publication_year": 2023,
            "doi": "10.1038/nbt.test005",
            "citation_count": 31,
            "references_pmids": ["ref001", "ref003", "ref009"],
            "cited_by_pmids": ["cite009", "cite010"]
        }
    ]
    
    # Add articles to database
    for article_data in test_articles:
        # Check if article already exists
        existing = db.query(Article).filter(Article.pmid == article_data["pmid"]).first()
        if not existing:
            article = Article(**article_data)
            db.add(article)
    
    db.commit()
    db.close()
    
    print(f"✅ Created {len(test_articles)} test articles")
    return test_articles

def test_similar_articles_endpoint():
    """Test the /articles/{pmid}/similar endpoint"""
    print("\n🔍 Testing Similar Articles Endpoint...")
    
    base_url = "http://localhost:8080"
    pmid = "test001"  # Base article about ML in drug discovery
    
    # Test the endpoint
    response = requests.get(
        f"{base_url}/articles/{pmid}/similar",
        headers={"User-ID": "test_user"},
        params={"limit": 10, "threshold": 0.1}
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Similar articles found: {data['total_found']}")
        print(f"📊 Base article: {data['base_article']['title']}")
        
        for i, article in enumerate(data['similar_articles'][:3]):
            print(f"   {i+1}. {article['title'][:60]}... (similarity: {article['similarity_score']:.4f})")
        
        print(f"🔧 Cache stats: {data.get('cache_stats', {})}")
        return data
    else:
        print(f"❌ Error: {response.status_code} - {response.text}")
        return None

def test_similar_network_endpoint():
    """Test the /articles/{pmid}/similar-network endpoint"""
    print("\n🕸️ Testing Similar Articles Network Endpoint...")
    
    base_url = "http://localhost:8080"
    pmid = "test001"
    
    response = requests.get(
        f"{base_url}/articles/{pmid}/similar-network",
        headers={"User-ID": "test_user"},
        params={"limit": 5, "threshold": 0.15}
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Network generated successfully")
        print(f"📊 Nodes: {data['metadata']['total_nodes']}")
        print(f"📊 Edges: {data['metadata']['total_edges']}")
        print(f"📊 Avg similarity: {data['metadata']['avg_similarity']:.4f}")
        
        # Show node details
        for node in data['nodes'][:3]:
            node_data = node['data']
            print(f"   📄 {node_data['pmid']}: {node_data['title'][:50]}...")
        
        return data
    else:
        print(f"❌ Error: {response.status_code} - {response.text}")
        return None

def test_similarity_engine_directly():
    """Test the similarity engine directly"""
    print("\n⚙️ Testing Similarity Engine Directly...")
    
    from services.similarity_engine import get_similarity_engine
    from database import get_db, Article
    
    db = next(get_db())
    
    # Get test articles
    article1 = db.query(Article).filter(Article.pmid == "test001").first()
    article2 = db.query(Article).filter(Article.pmid == "test002").first()
    article3 = db.query(Article).filter(Article.pmid == "test004").first()
    
    if article1 and article2 and article3:
        engine = get_similarity_engine()
        
        # Test similar articles (ML drug discovery)
        sim_12 = engine.calculate_similarity(article1, article2)
        print(f"✅ Similarity (ML drug discovery articles): {sim_12:.4f}")
        
        # Test dissimilar articles (ML vs Climate)
        sim_13 = engine.calculate_similarity(article1, article3)
        print(f"✅ Similarity (ML vs Climate articles): {sim_13:.4f}")
        
        # Test content similarity
        content_sim = engine._content_similarity(article1, article2)
        print(f"📝 Content similarity: {content_sim:.4f}")
        
        # Test author overlap
        author_sim = engine._author_overlap(article1, article2)
        print(f"👥 Author overlap: {author_sim:.4f}")
        
        # Test citation overlap
        citation_sim = engine._citation_overlap(article1, article2)
        print(f"📚 Citation overlap: {citation_sim:.4f}")
        
    else:
        print("❌ Test articles not found in database")
    
    db.close()

if __name__ == "__main__":
    print("🧪 Similar Work Discovery - Testing Suite")
    print("=" * 50)
    
    # Create test data
    create_test_articles()
    
    # Test similarity engine directly
    test_similarity_engine_directly()
    
    # Test API endpoints
    test_similar_articles_endpoint()
    test_similar_network_endpoint()
    
    print("\n🎉 Testing completed!")
