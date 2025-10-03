#!/usr/bin/env python3
"""
Test script to verify PhD agent methods are available
"""

def test_methods():
    try:
        from phd_thesis_agents import ResearchGapAgent, MethodologySynthesisAgent
        
        print("🔍 Testing PhD Agent Methods...")
        
        # Test ResearchGapAgent
        print("\n📊 ResearchGapAgent:")
        gap_agent = ResearchGapAgent(llm=None)
        
        methods_to_test = [
            '_extract_research_domains',
            '_format_gaps_for_ui',
            '_generate_gap_summary',
            '_generate_research_opportunities'
        ]
        
        for method in methods_to_test:
            has_method = hasattr(gap_agent, method)
            status = "✅" if has_method else "❌"
            print(f"  {status} {method}: {has_method}")
        
        # Test MethodologySynthesisAgent
        print("\n🔬 MethodologySynthesisAgent:")
        method_agent = MethodologySynthesisAgent(llm=None)
        
        methods_to_test = [
            '_generate_methodology_comparisons',
            '_format_methodologies_for_ui',
            '_generate_methodology_synthesis',
            '_extract_methodologies',
            '_generate_recommended_combinations'
        ]
        
        for method in methods_to_test:
            has_method = hasattr(method_agent, method)
            status = "✅" if has_method else "❌"
            print(f"  {status} {method}: {has_method}")
        
        # List all private methods
        print("\n🔍 All ResearchGapAgent private methods:")
        gap_methods = [m for m in dir(gap_agent) if m.startswith('_') and not m.startswith('__')]
        for method in sorted(gap_methods):
            print(f"  - {method}")
        
        print("\n🔍 All MethodologySynthesisAgent private methods:")
        method_methods = [m for m in dir(method_agent) if m.startswith('_') and not m.startswith('__')]
        for method in sorted(method_methods):
            print(f"  - {method}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_methods()
