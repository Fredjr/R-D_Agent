#!/bin/bash
set -e

echo "🚀 Committing Onboarding Wizard Changes..."
echo ""

# Add files
git add frontend/src/components/onboarding/StepIndicator.tsx
git add frontend/src/components/onboarding/Step2ResearchInterests.tsx
git add frontend/src/components/onboarding/Step3FirstAction.tsx
git add frontend/src/lib/research-topics.ts
git add frontend/src/app/auth/complete-profile/page.tsx
git add frontend/src/app/api/proxy/auth/complete-registration/route.ts
git add main.py
git add test_onboarding_flow.md

echo "✅ Files staged"
echo ""

# Commit
git commit -m "feat: Add 3-step onboarding wizard for new users

- Add StepIndicator component with progress visualization
- Add Step2ResearchInterests for topic/keyword selection (12 predefined topics)
- Add Step3FirstAction for guided first action (search/import/trending/project)
- Convert complete-profile page to multi-step wizard
- Store onboarding data in user.preferences JSON field
- Update backend to accept and store preferences
- Smart redirects based on user's chosen first action
- Solves cold start problem for new users"

echo "✅ Committed"
echo ""

# Push
git push origin main

echo "✅ Pushed to GitHub"
echo ""
echo "🎉 Deployment complete! Vercel and Railway will auto-deploy."

