#!/usr/bin/env python3
"""
Create a sample experiment result for testing Phase 4 & 5 enhancements.

This script will:
1. Find an existing experiment plan in the project
2. Create a sample experiment result for it
3. Verify the result appears in summaries and insights
"""

import requests
import json

# Configuration
BACKEND_URL = "https://r-dagent-production.up.railway.app"
PROJECT_ID = "804494b5-69e0-4b9a-9c7b-f7fb2bddef64"  # From your screenshots
USER_ID = "default_user"

def get_experiment_plans():
    """Get all experiment plans for the project"""
    print(f"📋 Fetching experiment plans for project {PROJECT_ID}...")
    
    response = requests.get(
        f"{BACKEND_URL}/experiment-plans/project/{PROJECT_ID}",
        headers={"User-ID": USER_ID}
    )
    
    if response.status_code == 200:
        plans = response.json()
        print(f"✅ Found {len(plans)} experiment plans")
        return plans
    else:
        print(f"❌ Error: {response.status_code} - {response.text}")
        return []


def create_experiment_result(plan_id: str):
    """Create a sample experiment result"""
    print(f"\n📊 Creating experiment result for plan {plan_id}...")
    
    result_data = {
        "plan_id": plan_id,
        "outcome": "The STOPFOP trial protocol was successfully implemented. Mineralocorticoid receptor antagonists showed a 23% improvement in insulin sensitivity compared to baseline (p<0.05).",
        "observations": [
            "Fasting glucose levels decreased by 15mg/dL on average",
            "HbA1c improved by 0.8% over 12 weeks",
            "No significant adverse effects reported",
            "Patient compliance was 94% throughout the study period"
        ],
        "measurements": [
            {"metric": "Insulin Sensitivity Index", "value": 23, "unit": "% improvement"},
            {"metric": "Fasting Glucose", "value": -15, "unit": "mg/dL change"},
            {"metric": "HbA1c", "value": -0.8, "unit": "% change"},
            {"metric": "Patient Compliance", "value": 94, "unit": "%"}
        ],
        "success_criteria_met": {
            "insulin_sensitivity_improvement": True,
            "glucose_control": True,
            "safety_profile": True,
            "patient_compliance": True
        },
        "interpretation": "The results strongly support the hypothesis that mineralocorticoid receptor antagonists improve insulin regulation in patients with cardiorenal health issues. The 23% improvement in insulin sensitivity is clinically significant and aligns with the mechanisms described in the triaged papers.",
        "supports_hypothesis": True,
        "confidence_change": 35.0,
        "what_worked": "The STOPFOP protocol was effective and well-tolerated. Patient compliance was excellent at 94%. The correlation between cardiorenal health and insulin regulation was confirmed.",
        "what_didnt_work": "Some patients experienced mild hyperkalemia requiring monitoring. The study duration may have been too short to assess long-term outcomes.",
        "next_steps": "1. Develop hypothesis for optimal dosing strategy\n2. Design long-term follow-up study\n3. Investigate molecular mechanisms of MR antagonist action on insulin pathways"
    }
    
    response = requests.post(
        f"{BACKEND_URL}/experiment-results",
        headers={
            "User-ID": USER_ID,
            "Content-Type": "application/json"
        },
        json=result_data
    )
    
    if response.status_code == 201:
        result = response.json()
        print(f"✅ Experiment result created successfully!")
        print(f"   Result ID: {result['result_id']}")
        print(f"   Status: {result['status']}")
        print(f"   Supports Hypothesis: {result['supports_hypothesis']}")
        print(f"   Confidence Change: +{result['confidence_change']}%")
        return result
    else:
        print(f"❌ Error: {response.status_code} - {response.text}")
        return None


def regenerate_insights():
    """Regenerate insights to include the new result"""
    print(f"\n🔄 Regenerating insights...")
    
    response = requests.post(
        f"{BACKEND_URL}/insights/projects/{PROJECT_ID}/insights/regenerate",
        headers={"User-ID": USER_ID}
    )
    
    if response.status_code == 200:
        print(f"✅ Insights regenerated successfully!")
        return response.json()
    else:
        print(f"❌ Error: {response.status_code} - {response.text}")
        return None


def regenerate_summary():
    """Regenerate summary to include the new result"""
    print(f"\n🔄 Regenerating summary...")
    
    response = requests.post(
        f"{BACKEND_URL}/summaries/projects/{PROJECT_ID}/summary/regenerate",
        headers={"User-ID": USER_ID}
    )
    
    if response.status_code == 200:
        print(f"✅ Summary regenerated successfully!")
        return response.json()
    else:
        print(f"❌ Error: {response.status_code} - {response.text}")
        return None


def main():
    print("🚀 Creating Sample Experiment Result for Phase 4 & 5 Testing\n")
    print("=" * 70)
    
    # Step 1: Get experiment plans
    plans = get_experiment_plans()
    if not plans:
        print("\n❌ No experiment plans found. Cannot create result.")
        return
    
    # Step 2: Use the first plan
    plan = plans[0]
    print(f"\n📝 Using plan: {plan['plan_name']}")
    print(f"   Plan ID: {plan['plan_id']}")
    print(f"   Status: {plan['status']}")
    
    # Step 3: Create result
    result = create_experiment_result(plan['plan_id'])
    if not result:
        return
    
    # Step 4: Regenerate insights and summary
    print("\n" + "=" * 70)
    print("🔄 Regenerating AI Analysis...")
    
    insights = regenerate_insights()
    summary = regenerate_summary()
    
    print("\n" + "=" * 70)
    print("✅ COMPLETE! Phase 4 & 5 enhancements should now be visible:")
    print("   1. Check the Research Journey Timeline for the new Result event")
    print("   2. Check AI Insights for evidence chain analysis")
    print("   3. Check Summary for complete research loop narrative")
    print("\n🔗 View project: https://frontend-psi-seven-85.vercel.app/projects/" + PROJECT_ID)


if __name__ == "__main__":
    main()

