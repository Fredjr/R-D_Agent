#!/usr/bin/env python3
"""
Production Backend Test for R&D Agent Platform
Tests Railway backend via HTTP requests
"""

import asyncio
import json
import logging
import sys
import requests
from datetime import datetime
from typing import Dict, Any, List
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ProductionBackendTest:
    def __init__(self):
        self.backend_url = "https://r-dagent-production.up.railway.app"
        self.test_project_id = "5ac213d7-6fcc-46ff-9420-5c7f4b421012"
        self.test_user_id = "fredericle77@gmail.com"
        self.results = {}
        self.start_time = datetime.now()
        
    def log(self, message: str, level: str = "info", data: Any = None):
        """Enhanced logging with emoji and timing"""
        elapsed = (datetime.now() - self.start_time).total_seconds()
        emoji = {
            'info': 'ℹ️', 'success': '✅', 'warning': '⚠️', 'error': '❌',
            'test': '🧪', 'api': '🌐', 'data': '📊'
        }.get(level, 'ℹ️')
        
        log_message = f"{emoji} [+{elapsed:.2f}s] {message}"
        
        if level == 'error':
            logger.error(log_message)
        elif level == 'warning':
            logger.warning(log_message)
        else:
            logger.info(log_message)
            
        if data:
            logger.info(f"   Data: {data}")

    def test_backend_connectivity(self) -> Dict[str, Any]:
        """Test backend connectivity"""
        self.log("Testing backend connectivity", "api")
        
        try:
            response = requests.get(f"{self.backend_url}/health", timeout=10)
            if response.status_code == 200:
                self.log("Backend connectivity successful", "success")
                return {"success": True, "status": response.status_code}
            else:
                self.log(f"Backend connectivity failed: {response.status_code}", "error")
                return {"success": False, "status": response.status_code}
        except Exception as e:
            self.log(f"Backend connectivity error: {str(e)}", "error")
            return {"success": False, "error": str(e)}

    def test_project_data(self) -> Dict[str, Any]:
        """Test project data endpoints"""
        self.log("Testing project data endpoints", "api")
        
        results = {}
        headers = {"User-ID": self.test_user_id}
        
        # Test reports
        try:
            response = requests.get(
                f"{self.backend_url}/projects/{self.test_project_id}/reports",
                headers=headers,
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                count = len(data) if isinstance(data, list) else len(data.get('reports', []))
                self.log(f"Reports endpoint: {count} reports found", "success")
                results['reports'] = {"success": True, "count": count}
            else:
                self.log(f"Reports endpoint failed: {response.status_code}", "error")
                results['reports'] = {"success": False, "status": response.status_code}
        except Exception as e:
            self.log(f"Reports endpoint error: {str(e)}", "error")
            results['reports'] = {"success": False, "error": str(e)}

        # Test deep dive analyses
        try:
            response = requests.get(
                f"{self.backend_url}/projects/{self.test_project_id}/deep-dive-analyses",
                headers=headers,
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                count = len(data) if isinstance(data, list) else len(data.get('analyses', []))
                self.log(f"Deep dive analyses endpoint: {count} analyses found", "success")
                results['deep_dive_analyses'] = {"success": True, "count": count}
            else:
                self.log(f"Deep dive analyses endpoint failed: {response.status_code}", "error")
                results['deep_dive_analyses'] = {"success": False, "status": response.status_code}
        except Exception as e:
            self.log(f"Deep dive analyses endpoint error: {str(e)}", "error")
            results['deep_dive_analyses'] = {"success": False, "error": str(e)}

        return results

    def test_specific_content(self) -> Dict[str, Any]:
        """Test specific report and analysis content"""
        self.log("Testing specific content", "data")
        
        results = {}
        headers = {"User-ID": self.test_user_id}
        
        # Test specific reports
        report_ids = [
            "ea457710-c706-4275-b1cc-84aa65292d35",
            "caf44086-3a9c-4399-b323-ddc43a6cca13"
        ]
        
        for report_id in report_ids:
            try:
                response = requests.get(
                    f"{self.backend_url}/reports/{report_id}",
                    headers=headers,
                    timeout=10
                )
                if response.status_code == 200:
                    data = response.json()
                    content_length = len(str(data.get('content', '')))
                    self.log(f"Report {report_id}: {content_length} chars", "success")
                    results[f'report_{report_id}'] = {
                        "success": True, 
                        "content_length": content_length,
                        "has_content": content_length > 1000
                    }
                else:
                    self.log(f"Report {report_id} failed: {response.status_code}", "error")
                    results[f'report_{report_id}'] = {"success": False, "status": response.status_code}
            except Exception as e:
                self.log(f"Report {report_id} error: {str(e)}", "error")
                results[f'report_{report_id}'] = {"success": False, "error": str(e)}

        # Test specific analysis
        analysis_id = "ff45c139-c343-4c84-9403-381c9d773b20"
        try:
            response = requests.get(
                f"{self.backend_url}/analyses/{analysis_id}",
                headers=headers,
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                content_length = len(json.dumps(data))
                has_real_content = bool(
                    data.get('scientific_model_analysis') or 
                    data.get('experimental_methods_analysis') or 
                    data.get('results_interpretation_analysis')
                )
                self.log(f"Analysis {analysis_id}: {content_length} chars, real content: {has_real_content}", "success")
                results[f'analysis_{analysis_id}'] = {
                    "success": True, 
                    "content_length": content_length,
                    "has_real_content": has_real_content,
                    "processing_status": data.get('processing_status')
                }
            else:
                self.log(f"Analysis {analysis_id} failed: {response.status_code}", "error")
                results[f'analysis_{analysis_id}'] = {"success": False, "status": response.status_code}
        except Exception as e:
            self.log(f"Analysis {analysis_id} error: {str(e)}", "error")
            results[f'analysis_{analysis_id}'] = {"success": False, "error": str(e)}

        return results

    def test_phd_endpoints(self) -> Dict[str, Any]:
        """Test PhD analysis endpoints"""
        self.log("Testing PhD analysis endpoints", "api")
        
        results = {}
        headers = {"User-ID": self.test_user_id, "Content-Type": "application/json"}
        
        # Test endpoints with minimal payloads
        endpoints = [
            {
                "name": "literature-gap-analysis",
                "url": f"{self.backend_url}/literature-gap-analysis",
                "payload": {
                    "project_id": self.test_project_id,
                    "objective": "Test literature gap analysis"
                }
            },
            {
                "name": "methodology-synthesis", 
                "url": f"{self.backend_url}/methodology-synthesis",
                "payload": {
                    "project_id": self.test_project_id,
                    "objective": "Test methodology synthesis"
                }
            },
            {
                "name": "thesis-chapter-generator",
                "url": f"{self.backend_url}/thesis-chapter-generator", 
                "payload": {
                    "project_id": self.test_project_id,
                    "objective": "Test thesis chapter generation"
                }
            }
        ]
        
        for endpoint in endpoints:
            try:
                response = requests.post(
                    endpoint["url"],
                    headers=headers,
                    json=endpoint["payload"],
                    timeout=30
                )
                if response.status_code in [200, 201, 202]:
                    self.log(f"{endpoint['name']}: SUCCESS ({response.status_code})", "success")
                    results[endpoint['name']] = {"success": True, "status": response.status_code}
                else:
                    self.log(f"{endpoint['name']}: FAILED ({response.status_code})", "error")
                    results[endpoint['name']] = {"success": False, "status": response.status_code}
            except Exception as e:
                self.log(f"{endpoint['name']}: ERROR - {str(e)}", "error")
                results[endpoint['name']] = {"success": False, "error": str(e)}

        return results

    def run_comprehensive_test(self):
        """Run all tests"""
        self.log("🚀 Starting comprehensive production backend test", "test")
        
        # Test 1: Backend connectivity
        self.results['connectivity'] = self.test_backend_connectivity()
        
        # Test 2: Project data
        self.results['project_data'] = self.test_project_data()
        
        # Test 3: Specific content
        self.results['specific_content'] = self.test_specific_content()
        
        # Test 4: PhD endpoints
        self.results['phd_endpoints'] = self.test_phd_endpoints()
        
        # Summary
        self.log("🎯 Production backend test completed", "test")
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("🎯 PRODUCTION BACKEND TEST SUMMARY")
        print("="*60)
        
        total_tests = 0
        passed_tests = 0
        
        for category, results in self.results.items():
            print(f"\n📊 {category.upper()}:")
            if isinstance(results, dict):
                for test_name, result in results.items():
                    total_tests += 1
                    if isinstance(result, dict) and result.get('success', False):
                        passed_tests += 1
                        status = "✅ PASS"
                    elif isinstance(result, bool) and result:
                        passed_tests += 1
                        status = "✅ PASS"
                    else:
                        status = "❌ FAIL"
                    print(f"   {status} {test_name}")
            else:
                total_tests += 1
                if isinstance(results, dict) and results.get('success', False):
                    passed_tests += 1
                    print(f"   ✅ PASS")
                elif isinstance(results, bool) and results:
                    passed_tests += 1
                    print(f"   ✅ PASS")
                else:
                    print(f"   ❌ FAIL")
        
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        print(f"\n🎯 OVERALL RESULTS:")
        print(f"   Tests Passed: {passed_tests}/{total_tests}")
        print(f"   Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print(f"   Status: ✅ EXCELLENT")
        elif success_rate >= 60:
            print(f"   Status: ⚠️ NEEDS ATTENTION")
        else:
            print(f"   Status: ❌ CRITICAL ISSUES")

if __name__ == "__main__":
    test = ProductionBackendTest()
    test.run_comprehensive_test()
