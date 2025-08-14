#!/usr/bin/env python3
"""
Simple test script for the PubMed and Web Search tools.
Tests basic functionality with a sample query.
"""

from tools import PubMedSearchTool, WebSearchTool

def main():
    """Test both tools with a sample query."""
    
    # Sample query as specified
    sample_query = "insulin hypoglycemic effect mice"
    
    print("🧪 Testing Tools with Sample Query:")
    print(f"Query: '{sample_query}'")
    print("=" * 60)
    
    # Test PubMed Tool
    print("\n📚 Testing PubMedSearchTool...")
    try:
        pubmed_tool = PubMedSearchTool()
        pubmed_result = pubmed_tool.run(sample_query)
        print("✅ PubMed Tool Results:")
        print(pubmed_result)
    except Exception as e:
        print(f"❌ PubMed Tool Error: {e}")
    
    print("\n" + "-" * 60)
    
    # Test Web Search Tool
    print("\n🌐 Testing WebSearchTool...")
    try:
        web_tool = WebSearchTool()
        web_result = web_tool.run(sample_query)
        print("✅ Web Search Tool Results:")
        print(web_result)
    except Exception as e:
        print(f"❌ Web Search Tool Error: {e}")
    
    print("\n🎉 Testing completed!")

if __name__ == "__main__":
    main()
