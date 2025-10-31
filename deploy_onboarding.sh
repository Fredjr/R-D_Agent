#!/bin/bash

# Deploy Onboarding Wizard Changes

echo "🚀 Deploying Onboarding Wizard..."
echo ""

# Add all onboarding-related files
echo "📦 Adding files to git..."
git add frontend/src/components/onboarding/
git add frontend/src/lib/research-topics.ts
git add frontend/src/app/auth/complete-profile/page.tsx
git add frontend/src/app/api/proxy/auth/complete-registration/route.ts
git add main.py

# Show status
echo ""
echo "📋 Git status:"
git status --short

# Commit changes
echo ""
echo "💾 Committing changes..."
git commit -m "feat: Add 3-step onboarding wizard for new users

- Add StepIndicator component with progress visualization
- Add Step2ResearchInterests for topic/keyword selection (12 predefined topics)
- Add Step3FirstAction for guided first action (search/import/trending/project)
- Convert complete-profile page to multi-step wizard
- Store onboarding data in user.preferences JSON field
- Update backend to accept and store preferences
- Smart redirects based on user's chosen first action
- Solves cold start problem for new users"

# Get commit hash
COMMIT_HASH=$(git rev-parse --short HEAD)
echo ""
echo "✅ Committed as: $COMMIT_HASH"

# Push to GitHub
echo ""
echo "📤 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔄 Next steps:"
echo "1. Vercel will auto-deploy from GitHub (frontend-psi-seven-85.vercel.app)"
echo "2. Deploy backend to Railway manually"
echo ""

