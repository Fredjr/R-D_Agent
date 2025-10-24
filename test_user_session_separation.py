#!/usr/bin/env python3
"""
🚨 CRITICAL SECURITY TEST: User Session Separation
Tests whether user data is properly isolated between different user accounts.
This script simulates two different users and checks if they can see each other's data.
"""

import asyncio
import aiohttp
import json
import time
from typing import Dict, List, Any

# Test configuration
BACKEND_URL = "https://r-dagent-production.up.railway.app"

# Test users
USER_A = "fredericle77@gmail.com"  # Your account
USER_B = "testuser2@example.com"   # Another user account

class UserSessionSeparationTest:
    def __init__(self):
        self.results = {
            "critical_vulnerabilities": [],
            "data_leakage_found": False,
            "test_results": {}
        }
    
    async def test_projects_isolation(self, session: aiohttp.ClientSession):
        """Test if users can see each other's projects"""
        print("\n🔒 TESTING PROJECT ISOLATION")
        print("=" * 50)
        
        # Get projects for User A
        user_a_projects = await self._get_user_projects(session, USER_A)
        print(f"👤 User A ({USER_A}) projects: {len(user_a_projects)}")
        
        # Get projects for User B  
        user_b_projects = await self._get_user_projects(session, USER_B)
        print(f"👤 User B ({USER_B}) projects: {len(user_b_projects)}")
        
        # Check for data leakage
        if user_a_projects and user_b_projects:
            # Check if any projects are shared (they shouldn't be unless explicitly shared)
            user_a_project_ids = {p.get('project_id') for p in user_a_projects}
            user_b_project_ids = {p.get('project_id') for p in user_b_projects}
            
            shared_projects = user_a_project_ids.intersection(user_b_project_ids)
            
            if shared_projects:
                self.results["critical_vulnerabilities"].append({
                    "type": "PROJECT_DATA_LEAKAGE",
                    "severity": "CRITICAL",
                    "description": f"Users can see each other's projects",
                    "shared_project_ids": list(shared_projects),
                    "user_a_total": len(user_a_projects),
                    "user_b_total": len(user_b_projects)
                })
                self.results["data_leakage_found"] = True
                print(f"🚨 CRITICAL: {len(shared_projects)} shared projects found!")
                
                # Check if these are the SAME projects (indicating fallback to all projects)
                if user_a_project_ids == user_b_project_ids:
                    print("🚨 CRITICAL: Users see IDENTICAL project lists - FALLBACK TO ALL PROJECTS DETECTED!")
                    self.results["critical_vulnerabilities"].append({
                        "type": "FALLBACK_TO_ALL_PROJECTS",
                        "severity": "CRITICAL", 
                        "description": "Both users see identical project lists - indicates fallback to all projects",
                        "evidence": "user_a_project_ids == user_b_project_ids"
                    })
            else:
                print("✅ No shared projects found")
        
        # Check project ownership
        for project in user_a_projects[:3]:  # Check first 3 projects
            owner = project.get('owner_user_id')
            if owner != USER_A:
                print(f"⚠️  User A sees project owned by: {owner}")
                self.results["critical_vulnerabilities"].append({
                    "type": "UNAUTHORIZED_PROJECT_ACCESS",
                    "severity": "HIGH",
                    "description": f"User {USER_A} can see project owned by {owner}",
                    "project_id": project.get('project_id'),
                    "project_name": project.get('project_name')
                })
        
        self.results["test_results"]["projects"] = {
            "user_a_count": len(user_a_projects),
            "user_b_count": len(user_b_projects),
            "shared_count": len(shared_projects) if 'shared_projects' in locals() else 0
        }
    
    async def test_recommendations_isolation(self, session: aiohttp.ClientSession):
        """Test if users get different recommendations"""
        print("\n🎯 TESTING RECOMMENDATION ISOLATION")
        print("=" * 50)
        
        # Get recommendations for both users
        user_a_recs = await self._get_user_recommendations(session, USER_A)
        user_b_recs = await self._get_user_recommendations(session, USER_B)
        
        if user_a_recs and user_b_recs:
            # Compare recommendation content
            user_a_papers = user_a_recs.get('recommendations', {}).get('papers_for_you', [])
            user_b_papers = user_b_recs.get('recommendations', {}).get('papers_for_you', [])
            
            print(f"👤 User A recommendations: {len(user_a_papers)} papers")
            print(f"👤 User B recommendations: {len(user_b_papers)} papers")
            
            # Check if recommendations are identical (suspicious)
            if user_a_papers and user_b_papers:
                user_a_pmids = {p.get('pmid') for p in user_a_papers if p.get('pmid')}
                user_b_pmids = {p.get('pmid') for p in user_b_papers if p.get('pmid')}
                
                if user_a_pmids == user_b_pmids and len(user_a_pmids) > 0:
                    print("🚨 CRITICAL: Users receive IDENTICAL recommendations!")
                    self.results["critical_vulnerabilities"].append({
                        "type": "IDENTICAL_RECOMMENDATIONS",
                        "severity": "HIGH",
                        "description": "Different users receive identical recommendations",
                        "identical_papers": len(user_a_pmids)
                    })
                    self.results["data_leakage_found"] = True
                else:
                    print("✅ Recommendations appear to be user-specific")
        
        self.results["test_results"]["recommendations"] = {
            "user_a_papers": len(user_a_papers) if 'user_a_papers' in locals() else 0,
            "user_b_papers": len(user_b_papers) if 'user_b_papers' in locals() else 0
        }
    
    async def test_collections_isolation(self, session: aiohttp.ClientSession):
        """Test if users can see each other's collections"""
        print("\n📚 TESTING COLLECTION ISOLATION")
        print("=" * 50)
        
        # Get User A's projects first
        user_a_projects = await self._get_user_projects(session, USER_A)
        
        if user_a_projects:
            project_id = user_a_projects[0]['project_id']
            
            # Get collections for User A
            user_a_collections = await self._get_project_collections(session, USER_A, project_id)
            print(f"👤 User A collections in project {project_id}: {len(user_a_collections)}")
            
            # Try to access same project as User B (should be denied)
            user_b_collections = await self._get_project_collections(session, USER_B, project_id)
            
            if user_b_collections:
                print(f"🚨 CRITICAL: User B can access User A's project collections!")
                self.results["critical_vulnerabilities"].append({
                    "type": "UNAUTHORIZED_COLLECTION_ACCESS",
                    "severity": "CRITICAL",
                    "description": f"User B can access User A's project {project_id}",
                    "project_id": project_id,
                    "collections_accessed": len(user_b_collections)
                })
                self.results["data_leakage_found"] = True
            else:
                print("✅ User B cannot access User A's project collections")
    
    async def _get_user_projects(self, session: aiohttp.ClientSession, user_id: str) -> List[Dict]:
        """Get projects for a specific user"""
        try:
            async with session.get(
                f"{BACKEND_URL}/projects?user_id={user_id}",
                headers={'User-ID': user_id, 'Content-Type': 'application/json'},
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('projects', [])
                else:
                    print(f"⚠️  Failed to get projects for {user_id}: {response.status}")
                    return []
        except Exception as e:
            print(f"❌ Error getting projects for {user_id}: {e}")
            return []
    
    async def _get_user_recommendations(self, session: aiohttp.ClientSession, user_id: str) -> Dict:
        """Get recommendations for a specific user"""
        try:
            async with session.get(
                f"{BACKEND_URL}/recommendations/weekly/{user_id}?limit=5",
                headers={'User-ID': user_id, 'Content-Type': 'application/json'},
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    print(f"⚠️  Failed to get recommendations for {user_id}: {response.status}")
                    return {}
        except Exception as e:
            print(f"❌ Error getting recommendations for {user_id}: {e}")
            return {}
    
    async def _get_project_collections(self, session: aiohttp.ClientSession, user_id: str, project_id: str) -> List[Dict]:
        """Get collections for a specific project as a specific user"""
        try:
            async with session.get(
                f"{BACKEND_URL}/projects/{project_id}/collections",
                headers={'User-ID': user_id, 'Content-Type': 'application/json'},
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return data if isinstance(data, list) else []
                else:
                    print(f"⚠️  User {user_id} cannot access project {project_id}: {response.status}")
                    return []
        except Exception as e:
            print(f"❌ Error getting collections for {user_id}: {e}")
            return []
    
    async def run_comprehensive_test(self):
        """Run all user session separation tests"""
        print("🚨 CRITICAL SECURITY TEST: USER SESSION SEPARATION")
        print("=" * 60)
        print(f"Testing isolation between:")
        print(f"  👤 User A: {USER_A}")
        print(f"  👤 User B: {USER_B}")
        print()
        
        async with aiohttp.ClientSession() as session:
            await self.test_projects_isolation(session)
            await self.test_recommendations_isolation(session)
            await self.test_collections_isolation(session)
        
        # Generate final report
        self._generate_security_report()
    
    def _generate_security_report(self):
        """Generate comprehensive security assessment report"""
        print("\n" + "=" * 60)
        print("🛡️  SECURITY ASSESSMENT REPORT")
        print("=" * 60)
        
        if self.results["data_leakage_found"]:
            print("🚨 CRITICAL SECURITY VULNERABILITIES FOUND!")
            print(f"📊 Total vulnerabilities: {len(self.results['critical_vulnerabilities'])}")
            
            for vuln in self.results["critical_vulnerabilities"]:
                print(f"\n❌ {vuln['type']} ({vuln['severity']})")
                print(f"   Description: {vuln['description']}")
                if 'evidence' in vuln:
                    print(f"   Evidence: {vuln['evidence']}")
        else:
            print("✅ No critical data leakage vulnerabilities detected")
        
        print(f"\n📊 Test Results Summary:")
        for test_name, results in self.results["test_results"].items():
            print(f"  {test_name}: {results}")
        
        # Save detailed results
        with open('user_session_security_report.json', 'w') as f:
            json.dump(self.results, f, indent=2, default=str)
        
        print(f"\n📄 Detailed report saved to: user_session_security_report.json")

async def main():
    """Main test execution"""
    test = UserSessionSeparationTest()
    await test.run_comprehensive_test()

if __name__ == "__main__":
    asyncio.run(main())
