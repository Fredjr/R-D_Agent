"""
Create test article for author network endpoint testing
"""

from database import get_db, Article
from sqlalchemy.orm import Session

def create_test_article():
    """Create a test article with authors for testing"""
    try:
        db = next(get_db())
        
        # Check if test article already exists
        existing_article = db.query(Article).filter(Article.pmid == "test001").first()
        if existing_article:
            print("✅ Test article already exists")
            print(f"   PMID: {existing_article.pmid}")
            print(f"   Title: {existing_article.title}")
            print(f"   Authors: {existing_article.authors}")
            return
        
        # Create test article
        test_article = Article(
            pmid="test001",
            title="Machine Learning Applications in Drug Discovery: A Comprehensive Review",
            authors=[
                "Smith, John A.",
                "Doe, Jane B.", 
                "Johnson, Robert C.",
                "Brown, Alice D."
            ],
            journal="Nature Machine Intelligence",
            publication_year=2023,
            doi="10.1038/s41586-2023-test001",
            abstract="This comprehensive review examines the applications of machine learning in drug discovery, covering recent advances in molecular property prediction, drug-target interaction modeling, and clinical trial optimization.",
            citation_count=150,
            keywords=["machine learning", "drug discovery", "artificial intelligence", "pharmaceutical research"],
            mesh_terms=["Drug Discovery", "Machine Learning", "Artificial Intelligence", "Pharmaceutical Preparations"]
        )
        
        db.add(test_article)
        db.commit()
        
        print("✅ Test article created successfully")
        print(f"   PMID: {test_article.pmid}")
        print(f"   Title: {test_article.title}")
        print(f"   Authors: {test_article.authors}")
        print(f"   Journal: {test_article.journal}")
        print(f"   Year: {test_article.publication_year}")
        
        # Create a second test article for network testing
        test_article2 = Article(
            pmid="test002",
            title="Deep Learning for Genomic Analysis and Personalized Medicine",
            authors=[
                "Smith, John A.",  # Shared author with test001
                "Wilson, Emily F.",
                "Davis, Michael G."
            ],
            journal="Nature Genetics",
            publication_year=2022,
            doi="10.1038/s41588-2022-test002",
            abstract="This study presents novel deep learning approaches for genomic data analysis and their applications in personalized medicine.",
            citation_count=89,
            keywords=["deep learning", "genomics", "personalized medicine", "bioinformatics"],
            mesh_terms=["Deep Learning", "Genomics", "Precision Medicine", "Computational Biology"]
        )
        
        db.add(test_article2)
        db.commit()
        
        print("✅ Second test article created successfully")
        print(f"   PMID: {test_article2.pmid}")
        print(f"   Title: {test_article2.title}")
        print(f"   Authors: {test_article2.authors}")
        
        db.close()
        
    except Exception as e:
        print(f"❌ Error creating test article: {e}")

if __name__ == "__main__":
    create_test_article()
