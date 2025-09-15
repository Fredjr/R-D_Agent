"""
Phase 2 Complete Testing Suite - Citation Navigation & Enhanced Sidebar
"""

import requests
import json
import asyncio
from typing import Dict, Any

class Phase2CompleteTester:
    def __init__(self, base_url: str = "http://localhost:8080"):
        self.base_url = base_url
        self.test_user = "phase2_complete_test_user"
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
    
    def test_citation_service_functionality(self):
        """Test citation service core functionality"""
        print(f"\n🔧 Testing Citation Service Core Functionality")
        
        try:
            # Test that citation service can be imported and initialized
            from services.citation_service import get_citation_service, CitationService
            
            service = CitationService()
            cache_stats = service.get_cache_stats()
            
            if isinstance(cache_stats, dict) and "total_entries" in cache_stats:
                self.log_result("Citation Service Import", True, "Service imported and initialized successfully")
                self.log_result("Citation Service Cache", True, f"Cache stats: {cache_stats}")
                
                # Test parsing functionality
                mock_data = {
                    'id': 'https://openalex.org/W123',
                    'doi': 'https://doi.org/10.1038/test',
                    'title': 'Test Paper',
                    'publication_year': 2023,
                    'cited_by_count': 50,
                    'ids': {'pmid': 'https://pubmed.ncbi.nlm.nih.gov/12345'},
                    'authorships': [{'author': {'display_name': 'Test Author'}}],
                    'host_venue': {'display_name': 'Test Journal'},
                    'referenced_works': [],
                    'abstract': 'Test abstract'
                }
                
                result = service._parse_openalex_response(mock_data)
                if result and result.title == 'Test Paper':
                    self.log_result("Citation Service Parsing", True, f"Parsed: {result.title} by {result.authors[0]}")
                else:
                    self.log_result("Citation Service Parsing", False, "Failed to parse mock data")
                    
            else:
                self.log_result("Citation Service Cache", False, "Invalid cache stats format")
                
        except Exception as e:
            self.log_result("Citation Service Functionality", False, f"Error: {str(e)}")
    
    def test_all_citation_endpoints(self):
        """Test all citation navigation endpoints"""
        print(f"\n🌐 Testing All Citation Navigation Endpoints")
        
        test_pmid = "test001"
        endpoints = [
            ("references", "📚 References"),
            ("references-network", "🕸️ References Network"),
            ("citations", "📈 Citations"),
            ("citations-network", "🌐 Citations Network")
        ]
        
        for endpoint, description in endpoints:
            try:
                response = requests.get(
                    f"{self.base_url}/articles/{test_pmid}/{endpoint}",
                    headers={"User-ID": self.test_user},
                    params={"limit": 10},
                    timeout=15
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if "network" in endpoint:
                        # Network endpoint
                        required_fields = ["nodes", "edges", "metadata"]
                        missing_fields = [field for field in required_fields if field not in data]
                        
                        if not missing_fields:
                            metadata = data["metadata"]
                            self.log_result(f"{description} Endpoint", True, 
                                          f"Network: {metadata['total_nodes']} nodes, {metadata['total_edges']} edges")
                        else:
                            self.log_result(f"{description} Endpoint", False, 
                                          f"Missing fields: {missing_fields}")
                    else:
                        # Data endpoint
                        required_fields = ["base_article", endpoint.replace('-', '_'), "total_found", "search_parameters", "cache_stats"]
                        missing_fields = [field for field in required_fields if field not in data]
                        
                        if not missing_fields:
                            self.log_result(f"{description} Endpoint", True, 
                                          f"Found {data['total_found']} {endpoint}")
                        else:
                            self.log_result(f"{description} Endpoint", False, 
                                          f"Missing fields: {missing_fields}")
                else:
                    self.log_result(f"{description} Endpoint", False, 
                                  f"HTTP {response.status_code}: {response.text[:100]}")
                    
            except Exception as e:
                self.log_result(f"{description} Endpoint", False, f"Error: {str(e)}")
    
    def test_frontend_api_proxies(self):
        """Test frontend API proxy routes"""
        print(f"\n🔗 Testing Frontend API Proxy Routes")
        
        # Note: This would require the frontend server to be running
        # For now, we'll just verify the files exist
        
        proxy_files = [
            "frontend/src/app/api/proxy/articles/[pmid]/references/route.ts",
            "frontend/src/app/api/proxy/articles/[pmid]/references-network/route.ts",
            "frontend/src/app/api/proxy/articles/[pmid]/citations/route.ts",
            "frontend/src/app/api/proxy/articles/[pmid]/citations-network/route.ts"
        ]
        
        import os
        for proxy_file in proxy_files:
            if os.path.exists(proxy_file):
                self.log_result(f"Proxy Route {proxy_file.split('/')[-2]}", True, "File exists")
            else:
                self.log_result(f"Proxy Route {proxy_file.split('/')[-2]}", False, "File missing")
    
    def test_enhanced_sidebar_component(self):
        """Test enhanced NetworkSidebar component"""
        print(f"\n📱 Testing Enhanced NetworkSidebar Component")
        
        import os
        sidebar_file = "frontend/src/components/NetworkSidebar.tsx"
        
        if os.path.exists(sidebar_file):
            self.log_result("NetworkSidebar Component", True, "Component file exists")
            
            # Check for key functionality in the file
            with open(sidebar_file, 'r') as f:
                content = f.read()
                
                key_features = [
                    ("Navigation Change Handler", "onNavigationChange"),
                    ("Collection Integration", "handleAddToCollection"),
                    ("References Display", "references.length"),
                    ("Citations Display", "citations.length"),
                    ("Paper Details", "data.title"),
                    ("Collection Selection", "selectedCollection")
                ]
                
                for feature_name, search_term in key_features:
                    if search_term in content:
                        self.log_result(f"Sidebar {feature_name}", True, "Feature implemented")
                    else:
                        self.log_result(f"Sidebar {feature_name}", False, "Feature missing")
        else:
            self.log_result("NetworkSidebar Component", False, "Component file missing")
    
    def test_networkview_integration(self):
        """Test NetworkView integration with enhanced sidebar"""
        print(f"\n🔗 Testing NetworkView Integration")
        
        import os
        networkview_file = "frontend/src/components/NetworkView.tsx"
        
        if os.path.exists(networkview_file):
            with open(networkview_file, 'r') as f:
                content = f.read()
                
                integration_features = [
                    ("Sidebar Import", "import NetworkSidebar"),
                    ("Sidebar State", "showSidebar"),
                    ("Collections State", "collections"),
                    ("Sidebar Handlers", "handleSidebarNavigationChange"),
                    ("Sidebar JSX", "<NetworkSidebar")
                ]
                
                for feature_name, search_term in integration_features:
                    if search_term in content:
                        self.log_result(f"NetworkView {feature_name}", True, "Integration implemented")
                    else:
                        self.log_result(f"NetworkView {feature_name}", False, "Integration missing")
        else:
            self.log_result("NetworkView Integration", False, "NetworkView file missing")
    
    def test_database_schema(self):
        """Test database schema for citation relationships"""
        print(f"\n🗄️ Testing Database Schema")
        
        try:
            from database import ArticleCitation, AuthorCollaboration
            from sqlalchemy import inspect
            
            # Test ArticleCitation model
            citation_columns = [col.name for col in inspect(ArticleCitation).columns]
            required_citation_columns = ['id', 'citing_pmid', 'cited_pmid', 'citation_context', 'created_at']
            
            missing_citation_cols = [col for col in required_citation_columns if col not in citation_columns]
            if not missing_citation_cols:
                self.log_result("ArticleCitation Schema", True, f"All required columns present: {citation_columns}")
            else:
                self.log_result("ArticleCitation Schema", False, f"Missing columns: {missing_citation_cols}")
            
            # Test AuthorCollaboration model
            collab_columns = [col.name for col in inspect(AuthorCollaboration).columns]
            required_collab_columns = ['id', 'author1_name', 'author2_name', 'collaboration_count', 'created_at']
            
            missing_collab_cols = [col for col in required_collab_columns if col not in collab_columns]
            if not missing_collab_cols:
                self.log_result("AuthorCollaboration Schema", True, f"All required columns present: {collab_columns}")
            else:
                self.log_result("AuthorCollaboration Schema", False, f"Missing columns: {missing_collab_cols}")
                
        except Exception as e:
            self.log_result("Database Schema", False, f"Error: {str(e)}")
    
    def run_comprehensive_test(self):
        """Run comprehensive Phase 2 testing"""
        print("🧪 Phase 2 Complete Testing Suite - Citation Navigation & Enhanced Sidebar")
        print("=" * 80)
        
        # Run all test categories
        self.test_citation_service_functionality()
        self.test_all_citation_endpoints()
        self.test_frontend_api_proxies()
        self.test_enhanced_sidebar_component()
        self.test_networkview_integration()
        self.test_database_schema()
        
        # Summary
        print("\n📊 Phase 2 Complete Testing Summary")
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
        
        # Phase 2 completion status
        critical_features = [
            "Citation Service Import",
            "References Endpoint",
            "Citations Endpoint", 
            "NetworkSidebar Component",
            "NetworkView Sidebar Import"
        ]
        
        critical_passed = sum(1 for r in self.results if r['success'] and r['test'] in critical_features)
        critical_total = len(critical_features)
        
        if critical_passed == critical_total:
            status = "✅ PHASE 2 COMPLETE - READY FOR PHASE 3"
        elif critical_passed >= critical_total * 0.8:
            status = "⚠️ PHASE 2 MOSTLY COMPLETE - MINOR FIXES NEEDED"
        else:
            status = "❌ PHASE 2 INCOMPLETE - MAJOR ISSUES NEED RESOLUTION"
        
        print(f"\n🎯 Phase 2 Status: {status}")
        print(f"Critical Features: {critical_passed}/{critical_total} passing")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = Phase2CompleteTester()
    success = tester.run_comprehensive_test()
    
    if success:
        print("\n🚀 Phase 2 Complete! Ready to proceed with Phase 3: Timeline Visualization.")
    else:
        print("\n⚠️ Some Phase 2 tests failed. Please review and fix issues before proceeding.")
