#!/usr/bin/env python3
"""
Simple test script for the PubMed and Web Search tools.
Tests basic functionality with a sample query.
"""

from tools import PubMedSearchTool, WebSearchTool
from experimental_methods_analyst import analyze_experimental_methods
from results_interpretation_analyst import analyze_results_interpretation

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

    # Optional schema smoke tests for deep-dive analysts if key present
    try:
        import os
        key = os.getenv("OPENAI_API_KEY")
        if key:
            from langchain_openai import ChatOpenAI
            llm = ChatOpenAI(model=os.getenv("OPENAI_SMALL_MODEL", os.getenv("OPENAI_MODEL", "gpt-4o-mini")), openai_api_key=key)
            methods = analyze_experimental_methods("Methods: We used Western Blot and ELISA to quantify proteins and cytokines.", "objective", llm)
            assert isinstance(methods, list)
            results = analyze_results_interpretation("Results: Compound X reduced NF-kB. Discussion: supports hypothesis.", "objective", llm)
            assert isinstance(results, dict)
            print("✅ Deep-dive analyst smoke tests passed.")
        else:
            print("ℹ️ Skipping deep-dive analyst smoke tests (no OPENAI_API_KEY).")
    except Exception as e:
        print(f"❌ Deep-dive analyst smoke test failure: {e}")

if __name__ == "__main__":
    main()
