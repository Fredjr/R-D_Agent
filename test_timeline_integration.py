"""
Timeline Network Integration Testing
"""

import os
import re
from typing import Dict, Any, List

class TimelineIntegrationTester:
    def __init__(self):
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
    
    def test_timeline_import_in_networkview(self):
        """Test that TimelineView is imported in NetworkView"""
        print(f"\n📦 Testing Timeline Import in NetworkView")
        
        networkview_path = "frontend/src/components/NetworkView.tsx"
        
        if not os.path.exists(networkview_path):
            self.log_result("NetworkView File", False, "NetworkView.tsx not found")
            return
        
        with open(networkview_path, 'r') as f:
            content = f.read()
        
        # Check for TimelineView import
        if "import TimelineView from './TimelineView'" in content:
            self.log_result("TimelineView Import", True, "TimelineView imported correctly")
        else:
            self.log_result("TimelineView Import", False, "TimelineView import missing")
    
    def test_timeline_navigation_mode(self):
        """Test timeline navigation mode integration"""
        print(f"\n🧭 Testing Timeline Navigation Mode")
        
        networkview_path = "frontend/src/components/NetworkView.tsx"
        
        if not os.path.exists(networkview_path):
            self.log_result("Navigation Mode", False, "NetworkView.tsx not found")
            return
        
        with open(networkview_path, 'r') as f:
            content = f.read()
        
        # Check for timeline in navigation mode type
        if "'timeline'" in content and "navigationMode?" in content:
            self.log_result("Timeline Navigation Mode", True, "Timeline mode added to navigation types")
        else:
            self.log_result("Timeline Navigation Mode", False, "Timeline mode not found in navigation types")
        
        # Check for timeline mode handling in fetchNetworkData
        if "case 'timeline':" in content:
            self.log_result("Timeline Fetch Handling", True, "Timeline mode handled in fetchNetworkData")
        else:
            self.log_result("Timeline Fetch Handling", False, "Timeline mode not handled in fetchNetworkData")
    
    def test_timeline_conditional_rendering(self):
        """Test timeline conditional rendering"""
        print(f"\n🎨 Testing Timeline Conditional Rendering")
        
        networkview_path = "frontend/src/components/NetworkView.tsx"
        
        if not os.path.exists(networkview_path):
            self.log_result("Conditional Rendering", False, "NetworkView.tsx not found")
            return
        
        with open(networkview_path, 'r') as f:
            content = f.read()
        
        # Check for timeline conditional rendering
        if "if (navigationMode === 'timeline')" in content:
            self.log_result("Timeline Conditional Rendering", True, "Timeline conditional rendering implemented")
        else:
            self.log_result("Timeline Conditional Rendering", False, "Timeline conditional rendering missing")
        
        # Check for TimelineView component usage
        if "<TimelineView" in content:
            self.log_result("TimelineView Component Usage", True, "TimelineView component used in render")
        else:
            self.log_result("TimelineView Component Usage", False, "TimelineView component not used")
    
    def test_timeline_props_integration(self):
        """Test timeline props integration"""
        print(f"\n⚙️ Testing Timeline Props Integration")
        
        networkview_path = "frontend/src/components/NetworkView.tsx"
        
        if not os.path.exists(networkview_path):
            self.log_result("Props Integration", False, "NetworkView.tsx not found")
            return
        
        with open(networkview_path, 'r') as f:
            content = f.read()
        
        # Check for pmid and projectId props
        timeline_props = [
            "pmid={sourceType === 'article' ? sourceId : undefined}",
            "projectId={sourceType === 'project' ? sourceId : undefined}",
            "onArticleSelect="
        ]
        
        missing_props = []
        for prop in timeline_props:
            if prop not in content:
                missing_props.append(prop)
        
        if not missing_props:
            self.log_result("Timeline Props", True, "All timeline props correctly passed")
        else:
            self.log_result("Timeline Props", False, f"Missing props: {missing_props}")
    
    def test_timeline_sidebar_integration(self):
        """Test timeline sidebar integration"""
        print(f"\n📋 Testing Timeline Sidebar Integration")
        
        networkview_path = "frontend/src/components/NetworkView.tsx"
        
        if not os.path.exists(networkview_path):
            self.log_result("Sidebar Integration", False, "NetworkView.tsx not found")
            return
        
        with open(networkview_path, 'r') as f:
            content = f.read()
        
        # Check for sidebar integration in timeline mode
        if "NetworkSidebar" in content and "timeline" in content:
            self.log_result("Timeline Sidebar Integration", True, "NetworkSidebar integrated with timeline mode")
        else:
            self.log_result("Timeline Sidebar Integration", False, "NetworkSidebar not integrated with timeline")
        
        # Check for article selection handling
        if "onArticleSelect={(article) =>" in content:
            self.log_result("Article Selection Handling", True, "Article selection handler implemented")
        else:
            self.log_result("Article Selection Handling", False, "Article selection handler missing")
    
    def test_timeline_navigation_controls(self):
        """Test timeline navigation controls"""
        print(f"\n🎛️ Testing Timeline Navigation Controls")
        
        networkview_path = "frontend/src/components/NetworkView.tsx"
        
        if not os.path.exists(networkview_path):
            self.log_result("Navigation Controls", False, "NetworkView.tsx not found")
            return
        
        with open(networkview_path, 'r') as f:
            content = f.read()
        
        # Check for timeline button in navigation controls
        if "Timeline View" in content and "handleNavigationChange('timeline')" in content:
            self.log_result("Timeline Navigation Button", True, "Timeline navigation button added")
        else:
            self.log_result("Timeline Navigation Button", False, "Timeline navigation button missing")
        
        # Check for timeline button styling
        if "bg-purple-600" in content and "timeline" in content:
            self.log_result("Timeline Button Styling", True, "Timeline button has unique styling")
        else:
            self.log_result("Timeline Button Styling", False, "Timeline button styling missing")
    
    def test_utility_functions(self):
        """Test utility functions for timeline integration"""
        print(f"\n🔧 Testing Utility Functions")
        
        networkview_path = "frontend/src/components/NetworkView.tsx"
        
        if not os.path.exists(networkview_path):
            self.log_result("Utility Functions", False, "NetworkView.tsx not found")
            return
        
        with open(networkview_path, 'r') as f:
            content = f.read()
        
        # Check for getNodeColor function
        if "const getNodeColor = (year: number): string =>" in content:
            self.log_result("getNodeColor Function", True, "getNodeColor utility function implemented")
        else:
            self.log_result("getNodeColor Function", False, "getNodeColor utility function missing")
        
        # Check for color mapping logic
        color_checks = [
            "year >= 2020",
            "year >= 2015", 
            "year >= 2010",
            "#10b981",  # Green
            "#3b82f6",  # Blue
            "#f59e0b",  # Orange
            "#6b7280"   # Gray
        ]
        
        missing_color_logic = []
        for check in color_checks:
            if check not in content:
                missing_color_logic.append(check)
        
        if not missing_color_logic:
            self.log_result("Color Mapping Logic", True, "Complete color mapping logic implemented")
        else:
            self.log_result("Color Mapping Logic", False, f"Missing color logic: {missing_color_logic}")
    
    def test_timeline_component_exists(self):
        """Test that TimelineView component exists"""
        print(f"\n📁 Testing TimelineView Component Existence")
        
        timeline_path = "frontend/src/components/TimelineView.tsx"
        
        if os.path.exists(timeline_path):
            self.log_result("TimelineView Component", True, "TimelineView.tsx exists")
            
            # Check component exports
            with open(timeline_path, 'r') as f:
                content = f.read()
            
            if "export default function TimelineView" in content:
                self.log_result("TimelineView Export", True, "TimelineView properly exported")
            else:
                self.log_result("TimelineView Export", False, "TimelineView export missing")
        else:
            self.log_result("TimelineView Component", False, "TimelineView.tsx not found")
    
    def test_integration_completeness(self):
        """Test overall integration completeness"""
        print(f"\n🔍 Testing Integration Completeness")
        
        # Count successful integrations
        integration_tests = [
            "TimelineView Import",
            "Timeline Navigation Mode", 
            "Timeline Conditional Rendering",
            "Timeline Props",
            "Timeline Sidebar Integration",
            "Timeline Navigation Button",
            "getNodeColor Function"
        ]
        
        successful_integrations = []
        failed_integrations = []
        
        for result in self.results:
            if result["test"] in integration_tests:
                if result["success"]:
                    successful_integrations.append(result["test"])
                else:
                    failed_integrations.append(result["test"])
        
        integration_score = len(successful_integrations) / len(integration_tests) * 100
        
        if integration_score >= 90:
            self.log_result("Integration Completeness", True, 
                          f"Integration {integration_score:.1f}% complete ({len(successful_integrations)}/{len(integration_tests)})")
        else:
            self.log_result("Integration Completeness", False, 
                          f"Integration only {integration_score:.1f}% complete. Missing: {failed_integrations}")
    
    def run_all_tests(self):
        """Run all timeline integration tests"""
        print("🧪 Timeline Network Integration - Testing Suite")
        print("=" * 60)
        
        # Test component existence
        self.test_timeline_component_exists()
        
        # Test import integration
        self.test_timeline_import_in_networkview()
        
        # Test navigation mode integration
        self.test_timeline_navigation_mode()
        
        # Test conditional rendering
        self.test_timeline_conditional_rendering()
        
        # Test props integration
        self.test_timeline_props_integration()
        
        # Test sidebar integration
        self.test_timeline_sidebar_integration()
        
        # Test navigation controls
        self.test_timeline_navigation_controls()
        
        # Test utility functions
        self.test_utility_functions()
        
        # Test overall completeness
        self.test_integration_completeness()
        
        # Summary
        print("\n📊 Timeline Integration Testing Summary")
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
        
        status = "INTEGRATION COMPLETE" if failed_tests == 0 else "NEEDS FIXES"
        print(f"\n🎯 Timeline Integration Status: {status}")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = TimelineIntegrationTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🚀 Timeline integration complete! Ready for Phase 3 testing.")
    else:
        print("\n⚠️ Some integration tests failed. Please fix issues before proceeding.")
