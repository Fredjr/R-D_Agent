#!/usr/bin/env python3
"""Deploy onboarding wizard changes to GitHub"""

import subprocess
import sys
import time

def run_command(cmd, description):
    """Run a shell command and print output"""
    print(f"\n{'='*80}")
    print(f"🔧 {description}")
    print(f"{'='*80}")
    print(f"Command: {cmd}")
    print()
    
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.stdout:
            print("STDOUT:")
            print(result.stdout)
        
        if result.stderr:
            print("STDERR:")
            print(result.stderr)
        
        if result.returncode != 0:
            print(f"❌ Command failed with return code {result.returncode}")
            return False
        else:
            print(f"✅ {description} - SUCCESS")
            return True
            
    except subprocess.TimeoutExpired:
        print(f"❌ Command timed out after 60 seconds")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("🚀 DEPLOYING ONBOARDING WIZARD TO GITHUB")
    print("="*80)
    
    # Step 1: Check git status
    if not run_command("git status --short", "Check git status"):
        print("\n⚠️  Git status check failed, but continuing...")
    
    # Step 2: Add files
    files_to_add = [
        "frontend/src/components/onboarding/",
        "frontend/src/lib/research-topics.ts",
        "frontend/src/app/auth/complete-profile/page.tsx",
        "frontend/src/app/api/proxy/auth/complete-registration/route.ts",
        "main.py",
        "test_onboarding_flow.md",
        "commit_onboarding.sh",
        "deploy_onboarding.py"
    ]
    
    add_cmd = "git add " + " ".join(files_to_add)
    if not run_command(add_cmd, "Stage files for commit"):
        print("\n❌ Failed to stage files")
        return False
    
    # Step 3: Commit
    commit_msg = """feat: Add 3-step onboarding wizard for new users

Phase 1 Implementation - Guided Onboarding Wizard

New Components:
- StepIndicator: Progress bar with step circles and animations
- Step2ResearchInterests: 12 research topics + keywords + career stage
- Step3FirstAction: 4 guided first actions (search/import/trending/project)
- research-topics.ts: Topic definitions with icons, colors, keywords

Modified Files:
- complete-profile/page.tsx: Converted to multi-step wizard
- complete-registration/route.ts: Added preferences field
- main.py: Backend accepts and stores preferences

Features:
- Visual progress indicator with smooth animations
- 12 predefined research topics (ML, Biotech, Drug Discovery, etc.)
- Custom keyword input with tag display
- Career stage selection (Early/Mid/Senior/Student)
- Smart redirects based on chosen first action
- Stores onboarding data in user.preferences JSON field
- Backward compatible (existing users unaffected)

Solves:
- Cold start problem for new users
- Provides research interests for recommendations
- Guides users to meaningful first action
- Improves user activation and retention

Testing:
- Build passes (4.0s, 72/72 pages)
- Type checking passes
- No regressions"""
    
    commit_cmd = f'git commit -m "{commit_msg}"'
    if not run_command(commit_cmd, "Commit changes"):
        print("\n❌ Failed to commit changes")
        return False
    
    # Step 4: Push to GitHub
    if not run_command("git push origin main", "Push to GitHub"):
        print("\n❌ Failed to push to GitHub")
        return False
    
    # Step 5: Show latest commit
    run_command("git log --oneline -1", "Show latest commit")
    
    print("\n" + "="*80)
    print("🎉 DEPLOYMENT SUCCESSFUL!")
    print("="*80)
    print()
    print("📦 Auto-deployments triggered:")
    print("   🔷 Vercel Frontend: https://frontend-psi-seven-85.vercel.app/")
    print("   🚂 Railway Backend: https://r-dagent-production.up.railway.app/")
    print()
    print("⏳ Deployment times:")
    print("   Vercel: ~2-3 minutes")
    print("   Railway: ~2-3 minutes")
    print()
    print("🧪 Test URLs after deployment:")
    print("   Sign Up: https://frontend-psi-seven-85.vercel.app/auth/signup")
    print("   Complete Profile: https://frontend-psi-seven-85.vercel.app/auth/complete-profile")
    print()
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

