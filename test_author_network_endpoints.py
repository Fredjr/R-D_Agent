"""
Author Network API Endpoints Testing

Comprehensive testing of Phase 4 author network API endpoints including:
- Article authors endpoint
- Author network endpoint  
- Author profile endpoint
- Suggested authors endpoint
"""

import requests
import time
from typing import Dict, Any, List

class AuthorNetworkEndpointTester:
    def __init__(self):
        self.results = []
        self.backend_url = "http://localhost:8080"
        self.test_user = "phase4_test_user"
        
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
    
    def test_article_authors_endpoint(self):
        """Test article authors endpoint"""
        print(f"\n👥 Testing Article Authors Endpoint")
        
        try:
            # Test with profiles
            response = requests.get(
                f"{self.backend_url}/articles/test001/authors",
                headers={"User-ID": self.test_user},
                params={"include_profiles": "true"},
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                
                required_fields = ["article", "authors", "author_count", "collaboration_metrics"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_result("Article Authors API", True, 
                                  f"API working. {data['author_count']} authors found")
                    
                    # Test author profile structure
                    if data["authors"] and len(data["authors"]) > 0:
                        author = data["authors"][0]
                        profile_fields = ["name", "total_papers", "influence_score"]
                        
                        if all(field in author for field in profile_fields):
                            self.log_result("Author Profile Structure", True, 
                                          "Author profiles include required fields")
                        else:
                            self.log_result("Author Profile Structure", False, 
                                          "Missing profile fields")
                    
                    # Test collaboration metrics
                    collab_metrics = data.get("collaboration_metrics", {})
                    if "total_authors" in collab_metrics and "is_collaboration" in collab_metrics:
                        self.log_result("Collaboration Metrics", True, 
                                      f"Collaboration type: {collab_metrics.get('collaboration_size', 'unknown')}")
                    else:
                        self.log_result("Collaboration Metrics", False, 
                                      "Missing collaboration metrics")
                else:
                    self.log_result("Article Authors API", False, 
                                  f"Missing fields: {missing_fields}")
            else:
                self.log_result("Article Authors API", False, 
                              f"HTTP {response.status_code}: {response.text[:100]}")
                
        except Exception as e:
            self.log_result("Article Authors API", False, f"Error: {str(e)}")
        
        # Test without profiles
        try:
            response = requests.get(
                f"{self.backend_url}/articles/test001/authors",
                headers={"User-ID": self.test_user},
                params={"include_profiles": "false"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data["authors"] and isinstance(data["authors"][0], dict):
                    if "name" in data["authors"][0] and len(data["authors"][0]) <= 2:
                        self.log_result("Simple Author List", True, 
                                      "Simple author list working (no profiles)")
                    else:
                        self.log_result("Simple Author List", False, 
                                      "Simple author list includes unexpected fields")
                else:
                    self.log_result("Simple Author List", True, "No authors found (expected)")
            else:
                self.log_result("Simple Author List", False, 
                              f"HTTP {response.status_code}")
                
        except Exception as e:
            self.log_result("Simple Author List", False, f"Error: {str(e)}")
    
    def test_author_network_endpoint(self):
        """Test author network endpoint"""
        print(f"\n🕸️ Testing Author Network Endpoint")
        
        try:
            response = requests.get(
                f"{self.backend_url}/articles/test001/author-network",
                headers={"User-ID": self.test_user},
                params={"depth": "2", "min_collaboration_strength": "0.1"},
                timeout=20
            )
            
            if response.status_code == 200:
                data = response.json()
                
                required_fields = ["source_article", "network", "suggested_authors", "search_parameters"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    network = data["network"]
                    
                    # Test network structure
                    network_fields = ["authors", "collaborations", "metrics", "research_clusters"]
                    network_missing = [field for field in network_fields if field not in network]
                    
                    if not network_missing:
                        self.log_result("Author Network Structure", True, 
                                      f"Network has {len(network['authors'])} authors, {len(network['collaborations'])} collaborations")
                        
                        # Test network metrics
                        metrics = network.get("metrics", {})
                        if "total_authors" in metrics and "network_density" in metrics:
                            self.log_result("Network Metrics", True, 
                                          f"Density: {metrics.get('network_density', 0):.3f}")
                        else:
                            self.log_result("Network Metrics", False, "Missing network metrics")
                        
                        # Test suggested authors
                        suggested = data.get("suggested_authors", [])
                        if isinstance(suggested, list):
                            self.log_result("Suggested Authors", True, 
                                          f"Found {len(suggested)} suggested authors")
                        else:
                            self.log_result("Suggested Authors", False, "Invalid suggested authors format")
                    else:
                        self.log_result("Author Network Structure", False, 
                                      f"Missing network fields: {network_missing}")
                else:
                    self.log_result("Author Network API", False, 
                                  f"Missing fields: {missing_fields}")
            else:
                self.log_result("Author Network API", False, 
                              f"HTTP {response.status_code}: {response.text[:100]}")
                
        except Exception as e:
            self.log_result("Author Network API", False, f"Error: {str(e)}")
    
    def test_author_profile_endpoint(self):
        """Test author profile endpoint"""
        print(f"\n👤 Testing Author Profile Endpoint")
        
        test_author = "John Smith"
        
        try:
            response = requests.get(
                f"{self.backend_url}/authors/{test_author}/profile",
                headers={"User-ID": self.test_user},
                params={"include_papers": "false"},
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                
                required_sections = ["author", "research_profile", "metrics"]
                missing_sections = [section for section in required_sections if section not in data]
                
                if not missing_sections:
                    author_data = data["author"]
                    
                    # Test author data structure
                    author_fields = ["name", "total_papers", "influence_score", "h_index"]
                    if all(field in author_data for field in author_fields):
                        self.log_result("Author Profile Data", True, 
                                      f"Profile for {author_data['name']}: {author_data['total_papers']} papers, H-index: {author_data['h_index']}")
                    else:
                        self.log_result("Author Profile Data", False, "Missing author fields")
                    
                    # Test research profile
                    research_profile = data["research_profile"]
                    if "research_domains" in research_profile and "primary_journals" in research_profile:
                        domains = research_profile["research_domains"]
                        self.log_result("Research Profile", True, 
                                      f"Research domains: {', '.join(domains[:3]) if domains else 'None'}")
                    else:
                        self.log_result("Research Profile", False, "Missing research profile fields")
                    
                    # Test metrics structure
                    metrics = data["metrics"]
                    metric_sections = ["productivity", "impact", "collaboration"]
                    if all(section in metrics for section in metric_sections):
                        self.log_result("Profile Metrics", True, 
                                      f"Influence: {author_data.get('influence_score', 0):.2f}")
                    else:
                        self.log_result("Profile Metrics", False, "Missing metrics sections")
                else:
                    self.log_result("Author Profile API", False, 
                                  f"Missing sections: {missing_sections}")
            else:
                self.log_result("Author Profile API", False, 
                              f"HTTP {response.status_code}: {response.text[:100]}")
                
        except Exception as e:
            self.log_result("Author Profile API", False, f"Error: {str(e)}")
    
    def test_suggested_authors_endpoint(self):
        """Test suggested authors endpoint"""
        print(f"\n🎯 Testing Suggested Authors Endpoint")
        
        try:
            # Test with multiple base authors
            params = {
                "based_on_authors": ["John Smith", "Jane Doe"],
                "limit": "10",
                "min_influence": "1.0"
            }
            
            response = requests.get(
                f"{self.backend_url}/authors/suggested",
                headers={"User-ID": self.test_user},
                params=params,
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                
                required_fields = ["base_authors", "suggested_authors", "total_suggestions", "search_parameters"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    suggestions = data["suggested_authors"]
                    
                    self.log_result("Suggested Authors API", True, 
                                  f"Found {len(suggestions)} suggestions based on {len(data['base_authors'])} authors")
                    
                    # Test suggestion structure
                    if suggestions and len(suggestions) > 0:
                        suggestion = suggestions[0]
                        suggestion_fields = ["name", "influence_score", "research_domains", "recommendation_reason"]
                        
                        if all(field in suggestion for field in suggestion_fields):
                            self.log_result("Suggestion Structure", True, 
                                          f"Top suggestion: {suggestion['name']} (influence: {suggestion['influence_score']:.2f})")
                        else:
                            self.log_result("Suggestion Structure", False, "Missing suggestion fields")
                    else:
                        self.log_result("Suggestion Structure", True, "No suggestions found (expected for test data)")
                    
                    # Test search parameters
                    search_params = data["search_parameters"]
                    if "suggestions_found" in search_params and "suggestions_after_filtering" in search_params:
                        self.log_result("Suggestion Filtering", True, 
                                      f"Found {search_params['suggestions_found']}, filtered to {search_params['suggestions_after_filtering']}")
                    else:
                        self.log_result("Suggestion Filtering", False, "Missing filtering information")
                else:
                    self.log_result("Suggested Authors API", False, 
                                  f"Missing fields: {missing_fields}")
            else:
                self.log_result("Suggested Authors API", False, 
                              f"HTTP {response.status_code}: {response.text[:100]}")
                
        except Exception as e:
            self.log_result("Suggested Authors API", False, f"Error: {str(e)}")
    
    def test_endpoint_completeness(self):
        """Test overall endpoint completeness"""
        print(f"\n🎯 Testing Author Network Endpoints Completeness")
        
        # Define required endpoints
        required_endpoints = [
            "Article Authors API",
            "Author Network Structure", 
            "Author Profile Data",
            "Suggested Authors API"
        ]
        
        successful_endpoints = []
        failed_endpoints = []
        
        for result in self.results:
            if result["test"] in required_endpoints:
                if result["success"]:
                    successful_endpoints.append(result["test"])
                else:
                    failed_endpoints.append(result["test"])
        
        completeness_rate = len(successful_endpoints) / len(required_endpoints) * 100
        
        if completeness_rate >= 90:
            self.log_result("Author Network Endpoints Completeness", True, 
                          f"Endpoints {completeness_rate:.1f}% complete ({len(successful_endpoints)}/{len(required_endpoints)})")
        else:
            self.log_result("Author Network Endpoints Completeness", False, 
                          f"Endpoints only {completeness_rate:.1f}% complete. Missing: {failed_endpoints}")
    
    def run_all_tests(self):
        """Run all author network endpoint tests"""
        print("🧪 Author Network API Endpoints - Testing Suite")
        print("=" * 60)
        
        # Test individual endpoints
        self.test_article_authors_endpoint()
        self.test_author_network_endpoint()
        self.test_author_profile_endpoint()
        self.test_suggested_authors_endpoint()
        
        # Test overall completeness
        self.test_endpoint_completeness()
        
        # Summary
        print("\n📊 Author Network Endpoints Testing Summary")
        print("=" * 50)
        
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
        
        status = "ENDPOINTS COMPLETE" if failed_tests == 0 else "NEEDS FIXES"
        print(f"\n🎯 Author Network Endpoints Status: {status}")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = AuthorNetworkEndpointTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🚀 Author Network API endpoints complete! Ready for frontend components.")
    else:
        print("\n⚠️ Some endpoint tests failed. Please fix issues before proceeding.")
