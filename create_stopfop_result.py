"""
Create a realistic experiment result for the STOPFOP Trial
that matches the actual experiment plan and hypothesis about AZD0530 in FOP patients.
"""

import requests
import json
from datetime import datetime, timedelta

# Configuration
BACKEND_URL = "https://r-dagent-production.up.railway.app"
USER_ID = "default_user"

# IDs from the actual project
PROJECT_ID = "804494b5-69e0-4b9a-9c7b-f7fb2bddef64"
PLAN_ID = "b7dc9831-863f-47da-ae75-af68249b767c"  # STOPFOP Trial Implementation Plan

# Create experiment result that matches the STOPFOP trial
result_data = {
    "plan_id": PLAN_ID,
    "project_id": PROJECT_ID,
    "status": "completed",
    "outcome": "The STOPFOP trial successfully evaluated AZD0530 (saracatinib) in FOP patients. The primary endpoint showed a 42% reduction in heterotopic bone volume compared to placebo at 6 months (p=0.003).",
    "observations": [
        "Heterotopic bone volume decreased by 42% in treatment group vs 8% in placebo group",
        "No new heterotopic ossification sites formed in 78% of treatment group patients",
        "Flare-up frequency reduced by 65% in treatment group",
        "Mild gastrointestinal side effects in 23% of participants (manageable)",
        "No serious adverse events related to AZD0530",
        "Patient-reported pain scores improved by 54% in treatment group"
    ],
    "measurements": [
        {
            "metric": "Heterotopic Bone Volume Change",
            "value": -42,
            "unit": "% reduction"
        },
        {
            "metric": "New Ossification Sites",
            "value": 22,
            "unit": "% of patients (treatment group)"
        },
        {
            "metric": "Flare-up Frequency Reduction",
            "value": 65,
            "unit": "%"
        },
        {
            "metric": "Pain Score Improvement",
            "value": 54,
            "unit": "% improvement"
        },
        {
            "metric": "Adverse Events (mild GI)",
            "value": 23,
            "unit": "% of patients"
        }
    ],
    "success_criteria_met": {
        "heterotopic_bone_volume_reduction": True,
        "safety_profile": True,
        "flare_up_reduction": True,
        "patient_tolerance": True,
        "cost_effectiveness": True
    },
    "interpretation": "The STOPFOP trial provides strong evidence that AZD0530 (saracatinib) is both efficacious and safe for treating Fibrodysplasia Ossificans Progressiva (FOP). The 42% reduction in heterotopic bone volume significantly exceeds the pre-specified success threshold and demonstrates clinically meaningful benefit. The safety profile was excellent with only mild, manageable side effects. These results strongly support the hypothesis that AZD0530 can effectively treat FOP while maintaining an acceptable safety profile and reasonable cost.",
    "supports_hypothesis": True,
    "confidence_change": 35.0,
    "what_worked": "AZD0530 demonstrated excellent efficacy in reducing heterotopic ossification. The 100mg daily dose was well-tolerated. The randomized controlled design provided robust evidence. Low-dose CT imaging successfully quantified bone volume changes. Patient compliance was excellent at 96%.",
    "what_didnt_work": "Some patients experienced mild GI side effects requiring symptomatic treatment. The 6-month timeframe may be too short to assess long-term durability of effect. Cost remains a concern for widespread adoption ($50K-100K per trial).",
    "next_steps": "1. Develop hypothesis for optimal long-term dosing strategy\n2. Design 2-year follow-up study to assess durability\n3. Investigate cost-reduction strategies for broader access\n4. Explore combination therapies to enhance efficacy\n5. Publish results in high-impact journal (Nature Medicine or NEJM)",
    "started_at": (datetime.now() - timedelta(days=180)).isoformat() + "Z",
    "completed_at": datetime.now().isoformat() + "Z"
}

print("=" * 80)
print("Creating STOPFOP Trial Result")
print("=" * 80)
print(f"\nProject ID: {PROJECT_ID}")
print(f"Plan ID: {PLAN_ID}")
print(f"Plan Name: STOPFOP Trial Implementation Plan")
print(f"\nResult Summary:")
print(f"  - Outcome: {result_data['outcome'][:100]}...")
print(f"  - Supports Hypothesis: {result_data['supports_hypothesis']}")
print(f"  - Confidence Change: +{result_data['confidence_change']}%")
print(f"  - Status: {result_data['status']}")

# Create the result
response = requests.post(
    f"{BACKEND_URL}/experiment-results",
    headers={
        "User-ID": USER_ID,
        "Content-Type": "application/json"
    },
    json=result_data
)

if response.status_code == 200:
    result = response.json()
    print(f"\n✅ Result created successfully!")
    print(f"   Result ID: {result['result_id']}")
    print(f"\n📊 Key Metrics:")
    for measurement in result['measurements']:
        print(f"   - {measurement['metric']}: {measurement['value']}{measurement['unit']}")
    print(f"\n🎯 This result now properly connects to the STOPFOP trial and FOP hypothesis!")
else:
    print(f"\n❌ Error creating result: {response.status_code}")
    print(response.text)

print("\n" + "=" * 80)

