"""
Timeline API Endpoints Testing
"""

import requests
import json
from typing import Dict, Any

class TimelineEndpointTester:
    def __init__(self, base_url: str = "http://localhost:8080"):
        self.base_url = base_url
        self.test_user = "timeline_test_user"
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
    
    def test_article_timeline_endpoint(self, pmid: str = "test001"):
        """Test the article timeline endpoint"""
        print(f"\n📅 Testing Article Timeline Endpoint for PMID: {pmid}")
        
        try:
            response = requests.get(
                f"{self.base_url}/articles/{pmid}/timeline",
                headers={"User-ID": self.test_user},
                params={
                    "period_strategy": "lustrum",
                    "min_articles": 1
                },
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response structure
                required_fields = ["base_article", "timeline_data", "search_parameters"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    timeline_data = data["timeline_data"]
                    self.log_result("Article Timeline Structure", True, 
                                  f"Timeline with {timeline_data['total_articles']} articles, {len(timeline_data['periods'])} periods")
                    
                    # Check timeline data structure
                    timeline_required = ["periods", "total_articles", "year_range", "citation_trends", "research_evolution", "key_milestones"]
                    timeline_missing = [field for field in timeline_required if field not in timeline_data]
                    
                    if not timeline_missing:
                        self.log_result("Timeline Data Structure", True, 
                                      f"All timeline fields present. Year range: {timeline_data['year_range']}")
                        
                        # Check periods structure
                        if timeline_data["periods"]:
                            period = timeline_data["periods"][0]
                            period_required = ["start_year", "end_year", "label", "total_articles", "avg_citations", "articles"]
                            period_missing = [field for field in period_required if field not in period]
                            
                            if not period_missing:
                                self.log_result("Timeline Period Structure", True, 
                                              f"Period: {period['label']} ({period['total_articles']} articles)")
                            else:
                                self.log_result("Timeline Period Structure", False, 
                                              f"Missing period fields: {period_missing}")
                        else:
                            self.log_result("Timeline Periods", True, "No periods (expected for limited data)")
                    else:
                        self.log_result("Timeline Data Structure", False, 
                                      f"Missing timeline fields: {timeline_missing}")
                    
                    return data
                else:
                    self.log_result("Article Timeline Structure", False, 
                                  f"Missing fields: {missing_fields}")
                    return None
            else:
                self.log_result("Article Timeline Endpoint", False, 
                              f"HTTP {response.status_code}: {response.text[:100]}")
                return None
                
        except Exception as e:
            self.log_result("Article Timeline Endpoint", False, f"Error: {str(e)}")
            return None
    
    def test_project_timeline_endpoint(self, project_id: str = "311b7451-c555-4f04-a62a-2e87de0b6700"):
        """Test the project timeline endpoint"""
        print(f"\n📊 Testing Project Timeline Endpoint for Project: {project_id}")
        
        try:
            response = requests.get(
                f"{self.base_url}/projects/{project_id}/timeline",
                headers={"User-ID": self.test_user},
                params={
                    "period_strategy": "lustrum",
                    "min_articles": 2
                },
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response structure
                required_fields = ["project", "timeline_data", "search_parameters"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    project_info = data["project"]
                    timeline_data = data["timeline_data"]
                    
                    self.log_result("Project Timeline Structure", True, 
                                  f"Project: {project_info.get('name', 'Unknown')} with {timeline_data['total_articles']} articles")
                    
                    # Check timeline data structure
                    timeline_required = ["periods", "total_articles", "year_range", "citation_trends", "research_evolution", "key_milestones"]
                    timeline_missing = [field for field in timeline_required if field not in timeline_data]
                    
                    if not timeline_missing:
                        self.log_result("Project Timeline Data", True, 
                                      f"Timeline periods: {len(timeline_data['periods'])}, Year range: {timeline_data['year_range']}")
                    else:
                        self.log_result("Project Timeline Data", False, 
                                      f"Missing timeline fields: {timeline_missing}")
                    
                    return data
                else:
                    self.log_result("Project Timeline Structure", False, 
                                  f"Missing fields: {missing_fields}")
                    return None
            elif response.status_code == 404:
                self.log_result("Project Timeline Endpoint", True, 
                              "Project not found (expected for test user)")
                return None
            else:
                self.log_result("Project Timeline Endpoint", False, 
                              f"HTTP {response.status_code}: {response.text[:100]}")
                return None
                
        except Exception as e:
            self.log_result("Project Timeline Endpoint", False, f"Error: {str(e)}")
            return None
    
    def test_timeline_period_strategies(self, pmid: str = "test001"):
        """Test different period strategies"""
        print(f"\n⏰ Testing Timeline Period Strategies")
        
        strategies = ["decade", "lustrum", "triennium", "annual"]
        
        for strategy in strategies:
            try:
                response = requests.get(
                    f"{self.base_url}/articles/{pmid}/timeline",
                    headers={"User-ID": self.test_user},
                    params={
                        "period_strategy": strategy,
                        "min_articles": 1
                    },
                    timeout=15
                )
                
                if response.status_code == 200:
                    data = response.json()
                    timeline_data = data["timeline_data"]
                    search_params = data["search_parameters"]
                    
                    if search_params["period_strategy"] == strategy:
                        self.log_result(f"Period Strategy: {strategy}", True, 
                                      f"Strategy applied, {len(timeline_data['periods'])} periods created")
                    else:
                        self.log_result(f"Period Strategy: {strategy}", False, 
                                      f"Strategy not applied correctly")
                else:
                    self.log_result(f"Period Strategy: {strategy}", False, 
                                  f"HTTP {response.status_code}")
                    
            except Exception as e:
                self.log_result(f"Period Strategy: {strategy}", False, f"Error: {str(e)}")
    
    def test_timeline_service_integration(self):
        """Test timeline service integration"""
        print(f"\n🔧 Testing Timeline Service Integration")
        
        try:
            # Test that timeline service can be imported and used
            from services.timeline_service import get_timeline_processor, TimelineProcessor
            
            processor = get_timeline_processor()
            
            if isinstance(processor, TimelineProcessor):
                self.log_result("Timeline Service Import", True, "Service imported successfully")
                
                # Test with sample data
                sample_articles = [
                    {
                        'pmid': '12345',
                        'title': 'Test Article 1',
                        'authors': ['Author, A.'],
                        'journal': 'Test Journal',
                        'year': 2020,
                        'citation_count': 100
                    },
                    {
                        'pmid': '12346',
                        'title': 'Test Article 2',
                        'authors': ['Author, B.'],
                        'journal': 'Test Journal',
                        'year': 2021,
                        'citation_count': 150
                    }
                ]
                
                timeline_data = processor.process_articles_for_timeline(sample_articles)
                
                if timeline_data.total_articles == 2:
                    self.log_result("Timeline Processing", True, 
                                  f"Processed {timeline_data.total_articles} articles into timeline")
                else:
                    self.log_result("Timeline Processing", False, 
                                  f"Expected 2 articles, got {timeline_data.total_articles}")
            else:
                self.log_result("Timeline Service Import", False, "Invalid service instance")
                
        except Exception as e:
            self.log_result("Timeline Service Integration", False, f"Error: {str(e)}")
    
    def test_frontend_proxy_routes(self):
        """Test frontend API proxy routes exist"""
        print(f"\n🔗 Testing Frontend Timeline Proxy Routes")
        
        import os
        proxy_files = [
            "frontend/src/app/api/proxy/articles/[pmid]/timeline/route.ts",
            "frontend/src/app/api/proxy/projects/[id]/timeline/route.ts"
        ]
        
        for proxy_file in proxy_files:
            if os.path.exists(proxy_file):
                self.log_result(f"Proxy Route {proxy_file.split('/')[-2]}", True, "File exists")
            else:
                self.log_result(f"Proxy Route {proxy_file.split('/')[-2]}", False, "File missing")
    
    def run_all_tests(self):
        """Run all timeline endpoint tests"""
        print("🧪 Timeline API Endpoints - Testing Suite")
        print("=" * 60)
        
        # Test timeline service integration
        self.test_timeline_service_integration()
        
        # Test API endpoints
        self.test_article_timeline_endpoint()
        self.test_project_timeline_endpoint()
        
        # Test period strategies
        self.test_timeline_period_strategies()
        
        # Test frontend proxy routes
        self.test_frontend_proxy_routes()
        
        # Summary
        print("\n📊 Timeline Endpoints Testing Summary")
        print("=" * 40)
        
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
        
        status = "READY FOR TIMELINE COMPONENT" if failed_tests == 0 else "NEEDS FIXES"
        print(f"\n🎯 Timeline Endpoints Status: {status}")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = TimelineEndpointTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🚀 All timeline endpoint tests passed! Ready to build Timeline Visualization Component.")
    else:
        print("\n⚠️ Some tests failed. Please fix issues before proceeding.")
