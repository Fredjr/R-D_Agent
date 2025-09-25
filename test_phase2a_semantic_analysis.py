#!/usr/bin/env python3
"""
Phase 2A.1: Semantic Analysis Testing Script
Tests the semantic analysis service and API endpoints
"""

import asyncio
import requests
import json
import time
import sys
from typing import Dict, Any

# Test configuration
BASE_URL = "http://localhost:8000"  # Adjust if your server runs on different port
TEST_PAPERS = [
    {
        "title": "Deep Learning Approaches for Protein Structure Prediction",
        "abstract": "This study presents novel deep learning methods for predicting protein structures from amino acid sequences. We developed a transformer-based architecture that achieves state-of-the-art performance on benchmark datasets. Our experimental results demonstrate significant improvements in prediction accuracy compared to existing methods. The approach combines convolutional neural networks with attention mechanisms to capture both local and global structural patterns. We validated our method on multiple protein families and show its potential for drug discovery applications.",
        "pmid": "test_protein_dl"
    },
    {
        "title": "A Systematic Review of Machine Learning in Healthcare",
        "abstract": "This comprehensive review examines the current state of machine learning applications in healthcare. We analyzed 150 studies published between 2020-2024, focusing on clinical decision support, diagnostic imaging, and patient outcome prediction. Our analysis reveals significant progress in deep learning for medical imaging, with accuracy rates exceeding 95% in several domains. However, challenges remain in model interpretability, data privacy, and regulatory approval. We provide recommendations for future research directions and clinical implementation strategies.",
        "pmid": "test_healthcare_review"
    },
    {
        "title": "Quantum Computing Applications in Cryptography: A Theoretical Framework",
        "abstract": "We present a theoretical framework for analyzing quantum computing applications in modern cryptography. Our mathematical model demonstrates the potential vulnerabilities of current encryption methods to quantum attacks. We derive new theoretical bounds for quantum key distribution protocols and propose novel quantum-resistant algorithms. The framework includes formal proofs of security properties and complexity analysis. This work contributes to the theoretical foundations of post-quantum cryptography.",
        "pmid": "test_quantum_crypto"
    }
]

def print_header(title: str):
    """Print a formatted header"""
    print("\n" + "="*60)
    print(f"🧪 {title}")
    print("="*60)

def print_result(test_name: str, success: bool, details: str = ""):
    """Print test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}")
    if details:
        print(f"   {details}")

def test_service_status():
    """Test the semantic analysis service status endpoint"""
    print_header("Testing Service Status")
    
    try:
        response = requests.get(f"{BASE_URL}/api/semantic/service-status")
        
        if response.status_code == 200:
            data = response.json()
            print_result("Service Status Endpoint", True, f"Service available: {data.get('is_available', False)}")
            
            if data.get('is_available'):
                print(f"   📊 Service initialized: {data.get('is_initialized', False)}")
                print(f"   🔧 Capabilities: {len(data.get('capabilities', {}))}")
                print(f"   📚 Models loaded: {data.get('models', {})}")
            else:
                print(f"   ⚠️  Service not available: {data.get('error', 'Unknown error')}")
            
            return data.get('is_available', False)
        else:
            print_result("Service Status Endpoint", False, f"HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print_result("Service Status Endpoint", False, f"Error: {e}")
        return False

def test_service_initialization():
    """Test manual service initialization"""
    print_header("Testing Service Initialization")
    
    try:
        response = requests.post(f"{BASE_URL}/api/semantic/initialize-service")
        
        if response.status_code == 200:
            data = response.json()
            success = data.get('status') == 'success'
            print_result("Service Initialization", success, data.get('message', ''))
            return success
        else:
            print_result("Service Initialization", False, f"HTTP {response.status_code}")
            if response.status_code == 503:
                print("   ⚠️  Service dependencies not installed. Run: python setup_nlp_infrastructure.py")
            return False
            
    except Exception as e:
        print_result("Service Initialization", False, f"Error: {e}")
        return False

def test_paper_analysis():
    """Test paper analysis with sample papers"""
    print_header("Testing Paper Analysis")
    
    success_count = 0
    total_tests = len(TEST_PAPERS)
    
    for i, paper in enumerate(TEST_PAPERS, 1):
        print(f"\n📄 Test Paper {i}/{total_tests}: {paper['title'][:50]}...")
        
        try:
            response = requests.post(
                f"{BASE_URL}/api/semantic/analyze-paper",
                json=paper,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate response structure
                required_fields = ['methodology', 'complexity_score', 'novelty_type', 
                                 'technical_terms', 'research_domains', 'embedding_dimensions']
                
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    print_result(f"Paper {i} Analysis", True, 
                               f"Methodology: {data['methodology']}, "
                               f"Complexity: {data['complexity_score']:.2f}, "
                               f"Novelty: {data['novelty_type']}")
                    
                    print(f"   🔬 Technical terms: {len(data['technical_terms'])}")
                    print(f"   🏷️  Research domains: {data['research_domains']}")
                    print(f"   📊 Embedding dimensions: {data['embedding_dimensions']}")
                    
                    success_count += 1
                else:
                    print_result(f"Paper {i} Analysis", False, f"Missing fields: {missing_fields}")
            else:
                print_result(f"Paper {i} Analysis", False, f"HTTP {response.status_code}")
                if response.status_code == 503:
                    print("   ⚠️  Service not available")
                    break
                
        except Exception as e:
            print_result(f"Paper {i} Analysis", False, f"Error: {e}")
    
    print(f"\n📊 Paper Analysis Summary: {success_count}/{total_tests} successful")
    return success_count == total_tests

def test_built_in_analysis():
    """Test the built-in test analysis endpoint"""
    print_header("Testing Built-in Analysis")
    
    try:
        response = requests.get(f"{BASE_URL}/api/semantic/test-analysis")
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('test_status') == 'success':
                analysis = data.get('analysis_results', {})
                print_result("Built-in Test Analysis", True, 
                           f"Methodology: {analysis.get('methodology')}, "
                           f"Complexity: {analysis.get('complexity_score', 0):.2f}")
                
                print(f"   📊 Technical terms: {analysis.get('technical_terms_count', 0)}")
                print(f"   🏷️  Research domains: {analysis.get('research_domains_count', 0)}")
                print(f"   📐 Embedding dimensions: {analysis.get('embedding_dimensions', 0)}")
                
                service_info = data.get('service_info', {})
                print(f"   🔧 Service initialized: {service_info.get('is_initialized', False)}")
                
                return True
            else:
                print_result("Built-in Test Analysis", False, "Test status not success")
                return False
        else:
            print_result("Built-in Test Analysis", False, f"HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print_result("Built-in Test Analysis", False, f"Error: {e}")
        return False

def test_performance():
    """Test analysis performance with timing"""
    print_header("Testing Performance")
    
    test_paper = TEST_PAPERS[0]  # Use first test paper
    
    try:
        start_time = time.time()
        
        response = requests.post(
            f"{BASE_URL}/api/semantic/analyze-paper",
            json=test_paper,
            headers={"Content-Type": "application/json"}
        )
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        if response.status_code == 200:
            print_result("Performance Test", True, f"Analysis completed in {processing_time:.2f} seconds")
            
            if processing_time < 5.0:
                print("   🚀 Excellent performance (< 5s)")
            elif processing_time < 10.0:
                print("   ⚡ Good performance (< 10s)")
            else:
                print("   🐌 Slow performance (> 10s) - consider optimization")
            
            return True
        else:
            print_result("Performance Test", False, f"HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print_result("Performance Test", False, f"Error: {e}")
        return False

def main():
    """Run all tests"""
    print_header("Phase 2A.1: Semantic Analysis Testing")
    print("🎯 Testing semantic analysis service and API endpoints")
    print(f"🌐 Base URL: {BASE_URL}")
    
    # Test results tracking
    test_results = {}
    
    # 1. Test service status
    test_results['status'] = test_service_status()
    
    # 2. Test service initialization (if needed)
    if not test_results['status']:
        test_results['initialization'] = test_service_initialization()
    else:
        test_results['initialization'] = True
    
    # 3. Test built-in analysis
    test_results['builtin_analysis'] = test_built_in_analysis()
    
    # 4. Test paper analysis (only if service is working)
    if test_results['builtin_analysis']:
        test_results['paper_analysis'] = test_paper_analysis()
        test_results['performance'] = test_performance()
    else:
        test_results['paper_analysis'] = False
        test_results['performance'] = False
    
    # Summary
    print_header("Test Summary")
    
    passed_tests = sum(1 for result in test_results.values() if result)
    total_tests = len(test_results)
    
    for test_name, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name.replace('_', ' ').title()}")
    
    print(f"\n📊 Overall Results: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("🎉 All tests passed! Phase 2A.1 implementation is working correctly.")
        return 0
    else:
        print("⚠️  Some tests failed. Check the output above for details.")
        
        if not test_results['status']:
            print("\n💡 Next steps:")
            print("   1. Install NLP dependencies: python setup_nlp_infrastructure.py")
            print("   2. Start the backend server: python main.py")
            print("   3. Re-run this test script")
        
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
