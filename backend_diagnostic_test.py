#!/usr/bin/env python3
"""
Backend Diagnostic Test for R&D Agent Platform
Tests database connectivity, report generation services, and data integrity
"""

import asyncio
import json
import logging
import sys
from datetime import datetime
from typing import Dict, Any, List
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class BackendDiagnosticTest:
    def __init__(self):
        self.test_project_id = "5ac213d7-6fcc-46ff-9420-5c7f4b421012"
        self.test_user_id = "fredericle77@gmail.com"
        self.results = {}
        self.start_time = datetime.now()
        
    def log(self, message: str, level: str = "info", data: Any = None):
        """Enhanced logging with emoji and timing"""
        elapsed = (datetime.now() - self.start_time).total_seconds()
        emoji = {
            'info': 'ℹ️', 'success': '✅', 'warning': '⚠️', 'error': '❌',
            'test': '🧪', 'db': '🗄️', 'api': '🌐', 'data': '📊'
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

    async def test_database_connectivity(self) -> Dict[str, Any]:
        """Test database connection and basic queries"""
        self.log("Testing database connectivity", "db")
        
        try:
            from database import get_db
            from sqlalchemy import text
            
            db_gen = get_db()
            db = next(db_gen)
            
            # Test basic connection
            result = db.execute(text("SELECT 1 as test")).fetchone()
            if result and result[0] == 1:
                self.log("Database connection successful", "success")
                db_status = {"connected": True}
            else:
                self.log("Database connection failed", "error")
                return {"connected": False, "error": "Connection test failed"}
            
            # Test project table
            try:
                project_query = text("""
                    SELECT project_id, project_name, description, created_at 
                    FROM projects 
                    WHERE project_id = :project_id
                """)
                project_result = db.execute(project_query, {"project_id": self.test_project_id}).fetchone()
                
                if project_result:
                    db_status["project_exists"] = True
                    db_status["project_data"] = {
                        "project_id": project_result[0],
                        "project_name": project_result[1],
                        "description": project_result[2][:100] if project_result[2] else None,
                        "created_at": str(project_result[3])
                    }
                    self.log(f"Project found: {project_result[1]}", "success")
                else:
                    db_status["project_exists"] = False
                    self.log("Test project not found in database", "warning")
                    
            except Exception as e:
                db_status["project_query_error"] = str(e)
                self.log(f"Project query failed: {e}", "error")
            
            # Test reports table
            try:
                reports_query = text("""
                    SELECT report_id, title, processing_status, created_at
                    FROM reports 
                    WHERE project_id = :project_id
                    ORDER BY created_at DESC
                    LIMIT 5
                """)
                reports_result = db.execute(reports_query, {"project_id": self.test_project_id}).fetchall()
                
                db_status["reports_count"] = len(reports_result)
                db_status["recent_reports"] = [
                    {
                        "report_id": row[0],
                        "title": row[1][:50] if row[1] else None,
                        "status": row[2],
                        "created_at": str(row[3])
                    }
                    for row in reports_result
                ]
                
                self.log(f"Found {len(reports_result)} reports for project", "success")
                
            except Exception as e:
                db_status["reports_query_error"] = str(e)
                self.log(f"Reports query failed: {e}", "error")
            
            # Test analyses table
            try:
                analyses_query = text("""
                    SELECT analysis_id, article_title, processing_status, created_at
                    FROM analyses 
                    WHERE project_id = :project_id
                    ORDER BY created_at DESC
                    LIMIT 5
                """)
                analyses_result = db.execute(analyses_query, {"project_id": self.test_project_id}).fetchall()
                
                db_status["analyses_count"] = len(analyses_result)
                db_status["recent_analyses"] = [
                    {
                        "analysis_id": row[0],
                        "article_title": row[1][:50] if row[1] else None,
                        "status": row[2],
                        "created_at": str(row[3])
                    }
                    for row in analyses_result
                ]
                
                self.log(f"Found {len(analyses_result)} analyses for project", "success")
                
            except Exception as e:
                db_status["analyses_query_error"] = str(e)
                self.log(f"Analyses query failed: {e}", "error")
            
            return db_status
            
        except Exception as e:
            self.log(f"Database connectivity test failed: {e}", "error")
            return {"connected": False, "error": str(e), "traceback": traceback.format_exc()}

    async def test_specific_reports(self) -> Dict[str, Any]:
        """Test specific report IDs mentioned by user"""
        self.log("Testing specific report access", "test")
        
        report_ids = [
            "ea457710-c706-4275-b1cc-84aa65292d35",
            "caf44086-3a9c-4399-b323-ddc43a6cca13"
        ]
        
        analysis_id = "ff45c139-c343-4c84-9403-381c9d773b20"
        
        results = {}
        
        try:
            from database import get_db
            from sqlalchemy import text
            
            db_gen = get_db()
            db = next(db_gen)
            
            # Test reports
            for report_id in report_ids:
                try:
                    report_query = text("""
                        SELECT report_id, title, content, objective, processing_status, 
                               created_at, updated_at, project_id
                        FROM reports 
                        WHERE report_id = :report_id
                    """)
                    report_result = db.execute(report_query, {"report_id": report_id}).fetchone()
                    
                    if report_result:
                        content_length = len(str(report_result[2])) if report_result[2] else 0
                        objective_length = len(str(report_result[3])) if report_result[3] else 0
                        
                        results[f"report_{report_id}"] = {
                            "exists": True,
                            "title": report_result[1],
                            "content_length": content_length,
                            "objective_length": objective_length,
                            "processing_status": report_result[4],
                            "created_at": str(report_result[5]),
                            "updated_at": str(report_result[6]),
                            "project_id": report_result[7],
                            "has_content": content_length > 0,
                            "has_objective": objective_length > 0,
                            "content_preview": str(report_result[2])[:200] if report_result[2] else None
                        }
                        
                        self.log(f"Report {report_id}: Found, {content_length} chars content", "success")
                    else:
                        results[f"report_{report_id}"] = {"exists": False}
                        self.log(f"Report {report_id}: Not found", "warning")
                        
                except Exception as e:
                    results[f"report_{report_id}"] = {"exists": False, "error": str(e)}
                    self.log(f"Report {report_id}: Query failed - {e}", "error")
            
            # Test analysis
            try:
                analysis_query = text("""
                    SELECT analysis_id, article_title, scientific_model_analysis, 
                           experimental_methods_analysis, results_interpretation_analysis,
                           processing_status, created_at, project_id
                    FROM analyses 
                    WHERE analysis_id = :analysis_id
                """)
                analysis_result = db.execute(analysis_query, {"analysis_id": analysis_id}).fetchone()
                
                if analysis_result:
                    sci_length = len(str(analysis_result[2])) if analysis_result[2] else 0
                    exp_length = len(str(analysis_result[3])) if analysis_result[3] else 0
                    res_length = len(str(analysis_result[4])) if analysis_result[4] else 0
                    
                    results[f"analysis_{analysis_id}"] = {
                        "exists": True,
                        "article_title": analysis_result[1],
                        "scientific_model_length": sci_length,
                        "experimental_methods_length": exp_length,
                        "results_interpretation_length": res_length,
                        "processing_status": analysis_result[5],
                        "created_at": str(analysis_result[6]),
                        "project_id": analysis_result[7],
                        "has_scientific_analysis": sci_length > 0,
                        "has_experimental_analysis": exp_length > 0,
                        "has_results_analysis": res_length > 0,
                        "total_content_length": sci_length + exp_length + res_length
                    }
                    
                    self.log(f"Analysis {analysis_id}: Found, {sci_length + exp_length + res_length} chars total", "success")
                else:
                    results[f"analysis_{analysis_id}"] = {"exists": False}
                    self.log(f"Analysis {analysis_id}: Not found", "warning")
                    
            except Exception as e:
                results[f"analysis_{analysis_id}"] = {"exists": False, "error": str(e)}
                self.log(f"Analysis {analysis_id}: Query failed - {e}", "error")
            
            return results
            
        except Exception as e:
            self.log(f"Specific reports test failed: {e}", "error")
            return {"error": str(e), "traceback": traceback.format_exc()}

    async def test_report_generation_services(self) -> Dict[str, Any]:
        """Test report generation service availability"""
        self.log("Testing report generation services", "api")
        
        services_status = {}
        
        # Test service imports
        try:
            from services.deep_dive_service import DeepDiveService
            services_status["deep_dive_service"] = {"importable": True}
            self.log("DeepDiveService import successful", "success")
        except Exception as e:
            services_status["deep_dive_service"] = {"importable": False, "error": str(e)}
            self.log(f"DeepDiveService import failed: {e}", "error")
        
        # Test main.py endpoints
        try:
            import main
            
            # Check if endpoints exist
            endpoints_to_check = [
                "generate_summary_endpoint",
                "generate_review",
                "deep_dive",
                "generate_thesis_chapters_endpoint",
                "analyze_literature_gaps_endpoint",
                "synthesize_methodologies_endpoint"
            ]
            
            for endpoint_name in endpoints_to_check:
                if hasattr(main, endpoint_name):
                    services_status[endpoint_name] = {"exists": True}
                    self.log(f"Endpoint {endpoint_name}: Available", "success")
                else:
                    services_status[endpoint_name] = {"exists": False}
                    self.log(f"Endpoint {endpoint_name}: Not found", "warning")
                    
        except Exception as e:
            services_status["main_import_error"] = str(e)
            self.log(f"Main.py import failed: {e}", "error")
        
        return services_status

    async def run_comprehensive_diagnostic(self) -> Dict[str, Any]:
        """Run all diagnostic tests"""
        self.log("🚀 Starting comprehensive backend diagnostic", "test")
        
        diagnostic_results = {
            "test_start_time": self.start_time.isoformat(),
            "project_id": self.test_project_id,
            "user_id": self.test_user_id
        }
        
        # Test 1: Database connectivity
        self.log("Phase 1: Database connectivity", "test")
        diagnostic_results["database"] = await self.test_database_connectivity()
        
        # Test 2: Specific reports
        self.log("Phase 2: Specific report access", "test")
        diagnostic_results["specific_reports"] = await self.test_specific_reports()
        
        # Test 3: Report generation services
        self.log("Phase 3: Report generation services", "test")
        diagnostic_results["services"] = await self.test_report_generation_services()
        
        # Generate summary
        diagnostic_results["summary"] = self.generate_diagnostic_summary(diagnostic_results)
        
        self.log("🎯 Backend diagnostic completed", "success")
        return diagnostic_results

    def generate_diagnostic_summary(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate diagnostic summary"""
        summary = {
            "database_connected": results.get("database", {}).get("connected", False),
            "project_exists": results.get("database", {}).get("project_exists", False),
            "reports_found": results.get("database", {}).get("reports_count", 0),
            "analyses_found": results.get("database", {}).get("analyses_count", 0),
            "services_available": 0,
            "issues": []
        }
        
        # Count available services
        services = results.get("services", {})
        for service, status in services.items():
            if isinstance(status, dict) and (status.get("importable") or status.get("exists")):
                summary["services_available"] += 1
        
        # Identify issues
        if not summary["database_connected"]:
            summary["issues"].append("Database connection failed")
        
        if not summary["project_exists"]:
            summary["issues"].append("Test project not found in database")
        
        if summary["reports_found"] == 0:
            summary["issues"].append("No reports found for test project")
        
        if summary["analyses_found"] == 0:
            summary["issues"].append("No analyses found for test project")
        
        # Check specific reports
        specific_reports = results.get("specific_reports", {})
        empty_reports = []
        for report_key, report_data in specific_reports.items():
            if isinstance(report_data, dict):
                if not report_data.get("exists"):
                    summary["issues"].append(f"Report/Analysis {report_key} not found in database")
                elif report_data.get("content_length", 0) == 0 and report_data.get("total_content_length", 0) == 0:
                    empty_reports.append(report_key)
        
        if empty_reports:
            summary["issues"].append(f"Empty content found in: {', '.join(empty_reports)}")
        
        summary["status"] = "HEALTHY" if len(summary["issues"]) == 0 else "ISSUES_FOUND"
        
        return summary

async def main():
    """Main diagnostic function"""
    diagnostic = BackendDiagnosticTest()
    
    try:
        results = await diagnostic.run_comprehensive_diagnostic()
        
        # Print results
        print("\n" + "="*80)
        print("🎯 BACKEND DIAGNOSTIC RESULTS")
        print("="*80)
        print(json.dumps(results, indent=2, default=str))
        
        # Print summary
        summary = results.get("summary", {})
        print(f"\n🎯 SUMMARY:")
        print(f"   Status: {summary.get('status', 'UNKNOWN')}")
        print(f"   Database Connected: {summary.get('database_connected', False)}")
        print(f"   Project Exists: {summary.get('project_exists', False)}")
        print(f"   Reports Found: {summary.get('reports_found', 0)}")
        print(f"   Analyses Found: {summary.get('analyses_found', 0)}")
        print(f"   Services Available: {summary.get('services_available', 0)}")
        
        issues = summary.get("issues", [])
        if issues:
            print(f"\n❌ ISSUES IDENTIFIED ({len(issues)}):")
            for issue in issues:
                print(f"   • {issue}")
        else:
            print(f"\n✅ No critical issues found!")
        
        return results
        
    except Exception as e:
        print(f"❌ Diagnostic failed: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return {"error": str(e), "traceback": traceback.format_exc()}

if __name__ == "__main__":
    asyncio.run(main())
