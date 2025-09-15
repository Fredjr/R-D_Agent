"""
Phase 2 Citation Navigation Endpoints Testing
"""

import requests
import json
import asyncio
from typing import Dict, Any

class Phase2EndpointTester:
    def __init__(self, base_url: str = "http://localhost:8080"):
        self.base_url = base_url
        self.test_user = "phase2_test_user"
        self.results = []
        
    def log_result(self, test_name: str, success: bool, details: str = "", data: Any = None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "data": data
        }
        self.results.append(result)
        
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {details}")
    
    def test_references_endpoint(self, pmid: str = "test001"):
        """Test the references endpoint"""
        print(f"\n📚 Testing References Endpoint for PMID: {pmid}")
        
        try:
            response = requests.get(
                f"{self.base_url}/articles/{pmid}/references",
                headers={"User-ID": self.test_user},
                params={"limit": 10},
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response structure
                required_fields = ["base_article", "references", "total_found", "search_parameters", "cache_stats"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_result("References Endpoint Structure", True, 
                                  f"All required fields present. Found {data['total_found']} references")
                    
                    # Check base article structure
                    base_article = data["base_article"]
                    if "pmid" in base_article and "title" in base_article:
                        self.log_result("References Base Article", True, 
                                      f"Base article: {base_article['title'][:50]}...")
                    else:
                        self.log_result("References Base Article", False, "Missing required base article fields")
                    
                    return data
                else:
                    self.log_result("References Endpoint Structure", False, 
                                  f"Missing fields: {missing_fields}")
                    return None
            else:
                self.log_result("References Endpoint", False, 
                              f"HTTP {response.status_code}: {response.text[:100]}")
                return None
                
        except Exception as e:
            self.log_result("References Endpoint", False, f"Error: {str(e)}")
            return None
    
    def test_references_network_endpoint(self, pmid: str = "test001"):
        """Test the references network endpoint"""
        print(f"\n🕸️ Testing References Network Endpoint for PMID: {pmid}")
        
        try:
            response = requests.get(
                f"{self.base_url}/articles/{pmid}/references-network",
                headers={"User-ID": self.test_user},
                params={"limit": 10},
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check network structure
                required_fields = ["nodes", "edges", "metadata"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    metadata = data["metadata"]
                    self.log_result("References Network Structure", True, 
                                  f"Network: {metadata['total_nodes']} nodes, {metadata['total_edges']} edges")
                    
                    # Check metadata
                    if metadata.get("source_type") == "references":
                        self.log_result("References Network Metadata", True, 
                                      f"Source type correct, base PMID: {metadata.get('base_pmid')}")
                    else:
                        self.log_result("References Network Metadata", False, 
                                      f"Incorrect source type: {metadata.get('source_type')}")
                    
                    return data
                else:
                    self.log_result("References Network Structure", False, 
                                  f"Missing fields: {missing_fields}")
                    return None
            else:
                self.log_result("References Network Endpoint", False, 
                              f"HTTP {response.status_code}: {response.text[:100]}")
                return None
                
        except Exception as e:
            self.log_result("References Network Endpoint", False, f"Error: {str(e)}")
            return None
    
    def test_citations_endpoint(self, pmid: str = "test001"):
        """Test the citations endpoint"""
        print(f"\n📈 Testing Citations Endpoint for PMID: {pmid}")
        
        try:
            response = requests.get(
                f"{self.base_url}/articles/{pmid}/citations",
                headers={"User-ID": self.test_user},
                params={"limit": 10},
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response structure
                required_fields = ["base_article", "citations", "total_found", "search_parameters", "cache_stats"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_result("Citations Endpoint Structure", True, 
                                  f"All required fields present. Found {data['total_found']} citations")
                    
                    # Check base article structure
                    base_article = data["base_article"]
                    if "pmid" in base_article and "title" in base_article:
                        self.log_result("Citations Base Article", True, 
                                      f"Base article: {base_article['title'][:50]}...")
                    else:
                        self.log_result("Citations Base Article", False, "Missing required base article fields")
                    
                    return data
                else:
                    self.log_result("Citations Endpoint Structure", False, 
                                  f"Missing fields: {missing_fields}")
                    return None
            else:
                self.log_result("Citations Endpoint", False, 
                              f"HTTP {response.status_code}: {response.text[:100]}")
                return None
                
        except Exception as e:
            self.log_result("Citations Endpoint", False, f"Error: {str(e)}")
            return None
    
    def test_citations_network_endpoint(self, pmid: str = "test001"):
        """Test the citations network endpoint"""
        print(f"\n🌐 Testing Citations Network Endpoint for PMID: {pmid}")
        
        try:
            response = requests.get(
                f"{self.base_url}/articles/{pmid}/citations-network",
                headers={"User-ID": self.test_user},
                params={"limit": 10},
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check network structure
                required_fields = ["nodes", "edges", "metadata"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    metadata = data["metadata"]
                    self.log_result("Citations Network Structure", True, 
                                  f"Network: {metadata['total_nodes']} nodes, {metadata['total_edges']} edges")
                    
                    # Check metadata
                    if metadata.get("source_type") == "citations":
                        self.log_result("Citations Network Metadata", True, 
                                      f"Source type correct, base PMID: {metadata.get('base_pmid')}")
                    else:
                        self.log_result("Citations Network Metadata", False, 
                                      f"Incorrect source type: {metadata.get('source_type')}")
                    
                    return data
                else:
                    self.log_result("Citations Network Structure", False, 
                                  f"Missing fields: {missing_fields}")
                    return None
            else:
                self.log_result("Citations Network Endpoint", False, 
                              f"HTTP {response.status_code}: {response.text[:100]}")
                return None
                
        except Exception as e:
            self.log_result("Citations Network Endpoint", False, f"Error: {str(e)}")
            return None
    
    def test_citation_service_integration(self):
        """Test citation service integration"""
        print(f"\n🔧 Testing Citation Service Integration")
        
        try:
            # Test that citation service can be imported and initialized
            from services.citation_service import get_citation_service, CitationService
            
            service = CitationService()
            cache_stats = service.get_cache_stats()
            
            if isinstance(cache_stats, dict) and "total_entries" in cache_stats:
                self.log_result("Citation Service Import", True, "Service imported and initialized successfully")
                self.log_result("Citation Service Cache", True, f"Cache stats: {cache_stats}")
            else:
                self.log_result("Citation Service Cache", False, "Invalid cache stats format")
                
        except Exception as e:
            self.log_result("Citation Service Integration", False, f"Error: {str(e)}")
    
    def run_all_tests(self):
        """Run all Phase 2 endpoint tests"""
        print("🧪 Phase 2 Citation Navigation Endpoints - Testing Suite")
        print("=" * 60)
        
        # Test citation service integration
        self.test_citation_service_integration()
        
        # Test all endpoints with test article
        test_pmid = "test001"
        
        self.test_references_endpoint(test_pmid)
        self.test_references_network_endpoint(test_pmid)
        self.test_citations_endpoint(test_pmid)
        self.test_citations_network_endpoint(test_pmid)
        
        # Summary
        print("\n📊 Phase 2 Testing Summary")
        print("=" * 30)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ Failed Tests:")
            for result in self.results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
        
        status = "READY FOR NEXT PHASE" if failed_tests == 0 else "NEEDS FIXES"
        print(f"\n🎯 Phase 2 Status: {status}")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = Phase2EndpointTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🚀 All Phase 2 tests passed! Ready to proceed with Enhanced NetworkSidebar.")
    else:
        print("\n⚠️ Some tests failed. Please fix issues before proceeding.")
