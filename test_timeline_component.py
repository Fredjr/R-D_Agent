"""
Timeline Visualization Component Testing
"""

import os
import subprocess
import time
import requests
from typing import Dict, Any

class TimelineComponentTester:
    def __init__(self):
        self.results = []
        self.backend_url = "http://localhost:8080"
        self.frontend_url = "http://localhost:3000"
        
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
    
    def test_timeline_component_file_exists(self):
        """Test that TimelineView component file exists"""
        print(f"\n📁 Testing Timeline Component File Structure")
        
        component_path = "frontend/src/components/TimelineView.tsx"
        
        if os.path.exists(component_path):
            self.log_result("TimelineView Component File", True, "Component file exists")
            
            # Check file content
            with open(component_path, 'r') as f:
                content = f.read()
                
            # Check for key component features
            required_features = [
                "interface TimelineArticle",
                "interface TimelinePeriod", 
                "interface TimelineData",
                "useState",
                "useEffect",
                "periodStrategy",
                "navigatePeriod",
                "onArticleSelect"
            ]
            
            missing_features = []
            for feature in required_features:
                if feature not in content:
                    missing_features.append(feature)
            
            if not missing_features:
                self.log_result("TimelineView Component Features", True, 
                              "All required features present")
            else:
                self.log_result("TimelineView Component Features", False, 
                              f"Missing features: {missing_features}")
        else:
            self.log_result("TimelineView Component File", False, "Component file missing")
    
    def test_timeline_api_integration(self):
        """Test timeline API integration"""
        print(f"\n🔗 Testing Timeline API Integration")
        
        try:
            # Test article timeline endpoint
            response = requests.get(
                f"{self.backend_url}/articles/test001/timeline",
                headers={"User-ID": "timeline_test_user"},
                params={"period_strategy": "lustrum", "min_articles": 1},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response structure
                if "timeline_data" in data:
                    timeline_data = data["timeline_data"]
                    
                    required_fields = ["periods", "total_articles", "year_range", "citation_trends", "key_milestones"]
                    missing_fields = [field for field in required_fields if field not in timeline_data]
                    
                    if not missing_fields:
                        self.log_result("Timeline API Response Structure", True, 
                                      f"All fields present. {timeline_data['total_articles']} articles, {len(timeline_data['periods'])} periods")
                        
                        # Test period structure
                        if timeline_data["periods"]:
                            period = timeline_data["periods"][0]
                            period_fields = ["start_year", "end_year", "label", "total_articles", "articles"]
                            period_missing = [field for field in period_fields if field not in period]
                            
                            if not period_missing:
                                self.log_result("Timeline Period Structure", True, 
                                              f"Period structure valid: {period['label']}")
                            else:
                                self.log_result("Timeline Period Structure", False, 
                                              f"Missing period fields: {period_missing}")
                        else:
                            self.log_result("Timeline Periods", True, "No periods (expected for test data)")
                    else:
                        self.log_result("Timeline API Response Structure", False, 
                                      f"Missing fields: {missing_fields}")
                else:
                    self.log_result("Timeline API Response Structure", False, 
                                  "Missing timeline_data field")
            else:
                self.log_result("Timeline API Integration", False, 
                              f"HTTP {response.status_code}: {response.text[:100]}")
                
        except Exception as e:
            self.log_result("Timeline API Integration", False, f"Error: {str(e)}")
    
    def test_timeline_component_imports(self):
        """Test that component imports are valid"""
        print(f"\n📦 Testing Timeline Component Imports")
        
        component_path = "frontend/src/components/TimelineView.tsx"
        
        if not os.path.exists(component_path):
            self.log_result("Component Imports", False, "Component file not found")
            return
        
        with open(component_path, 'r') as f:
            content = f.read()
        
        # Check for required imports
        required_imports = [
            "React",
            "useState",
            "useEffect", 
            "Card",
            "Button",
            "Badge",
            "ScrollArea"
        ]
        
        missing_imports = []
        for imp in required_imports:
            if imp not in content:
                missing_imports.append(imp)
        
        if not missing_imports:
            self.log_result("Component Imports", True, "All required imports present")
        else:
            self.log_result("Component Imports", False, f"Missing imports: {missing_imports}")
    
    def test_timeline_component_props(self):
        """Test component props interface"""
        print(f"\n⚙️ Testing Timeline Component Props")
        
        component_path = "frontend/src/components/TimelineView.tsx"
        
        if not os.path.exists(component_path):
            self.log_result("Component Props", False, "Component file not found")
            return
        
        with open(component_path, 'r') as f:
            content = f.read()
        
        # Check for props interface
        if "interface TimelineViewProps" in content:
            self.log_result("Props Interface", True, "TimelineViewProps interface defined")
            
            # Check for key props
            required_props = ["pmid?", "projectId?", "onArticleSelect?", "className?"]
            missing_props = []
            
            for prop in required_props:
                if prop not in content:
                    missing_props.append(prop)
            
            if not missing_props:
                self.log_result("Component Props", True, "All required props defined")
            else:
                self.log_result("Component Props", False, f"Missing props: {missing_props}")
        else:
            self.log_result("Props Interface", False, "TimelineViewProps interface not found")
    
    def test_timeline_component_functionality(self):
        """Test component functionality features"""
        print(f"\n🔧 Testing Timeline Component Functionality")
        
        component_path = "frontend/src/components/TimelineView.tsx"
        
        if not os.path.exists(component_path):
            self.log_result("Component Functionality", False, "Component file not found")
            return
        
        with open(component_path, 'r') as f:
            content = f.read()
        
        # Check for key functionality
        functionality_checks = [
            ("Period Strategy Selection", "periodStrategy"),
            ("Period Navigation", "navigatePeriod"),
            ("Article Selection", "onArticleSelect"),
            ("Loading State", "loading"),
            ("Error Handling", "error"),
            ("Milestone Display", "showMilestones"),
            ("Timeline Visualization", "periodWidths"),
            ("API Fetch", "fetchTimelineData")
        ]
        
        for feature_name, feature_code in functionality_checks:
            if feature_code in content:
                self.log_result(f"Functionality: {feature_name}", True, "Feature implemented")
            else:
                self.log_result(f"Functionality: {feature_name}", False, "Feature missing")
    
    def test_ui_components_usage(self):
        """Test UI components usage"""
        print(f"\n🎨 Testing UI Components Usage")
        
        component_path = "frontend/src/components/TimelineView.tsx"
        
        if not os.path.exists(component_path):
            self.log_result("UI Components", False, "Component file not found")
            return
        
        with open(component_path, 'r') as f:
            content = f.read()
        
        # Check for UI components usage
        ui_components = [
            ("Card Components", "<Card>"),
            ("Button Components", "<Button"),
            ("Badge Components", "<Badge"),
            ("ScrollArea Component", "<ScrollArea"),
            ("Icons Usage", "lucide-react"),
            ("Responsive Grid", "grid-cols"),
            ("Loading State", "animate-spin"),
            ("Interactive Elements", "onClick")
        ]
        
        for component_name, component_code in ui_components:
            if component_code in content:
                self.log_result(f"UI: {component_name}", True, "Component used")
            else:
                self.log_result(f"UI: {component_name}", False, "Component not used")
    
    def test_typescript_interfaces(self):
        """Test TypeScript interfaces"""
        print(f"\n📝 Testing TypeScript Interfaces")
        
        component_path = "frontend/src/components/TimelineView.tsx"
        
        if not os.path.exists(component_path):
            self.log_result("TypeScript Interfaces", False, "Component file not found")
            return
        
        with open(component_path, 'r') as f:
            content = f.read()
        
        # Check for required interfaces
        interfaces = [
            "TimelineArticle",
            "TimelinePeriod", 
            "TimelineData",
            "TimelineViewProps"
        ]
        
        for interface in interfaces:
            if f"interface {interface}" in content:
                self.log_result(f"Interface: {interface}", True, "Interface defined")
            else:
                self.log_result(f"Interface: {interface}", False, "Interface missing")
    
    def run_all_tests(self):
        """Run all timeline component tests"""
        print("🧪 Timeline Visualization Component - Testing Suite")
        print("=" * 60)
        
        # Test component file structure
        self.test_timeline_component_file_exists()
        
        # Test component imports
        self.test_timeline_component_imports()
        
        # Test TypeScript interfaces
        self.test_typescript_interfaces()
        
        # Test component props
        self.test_timeline_component_props()
        
        # Test component functionality
        self.test_timeline_component_functionality()
        
        # Test UI components usage
        self.test_ui_components_usage()
        
        # Test API integration
        self.test_timeline_api_integration()
        
        # Summary
        print("\n📊 Timeline Component Testing Summary")
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
        
        status = "READY FOR INTEGRATION" if failed_tests == 0 else "NEEDS FIXES"
        print(f"\n🎯 Timeline Component Status: {status}")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = TimelineComponentTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🚀 All timeline component tests passed! Ready for network integration.")
    else:
        print("\n⚠️ Some tests failed. Please fix issues before proceeding.")
