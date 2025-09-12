# Production Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the latest R&D Agent enhancements to production.

## Current Status
- **Staging Environment**: ✅ Fully tested with all new features
- **Backend**: ✅ Already deployed to Railway production
- **Frontend Production**: ⚠️ Needs update to commit `0f588d5`

## Pre-Deployment Checklist

### ✅ Completed Validations
- [x] Backend health check (200ms response time)
- [x] All new endpoints functional
- [x] Regression testing passed
- [x] Email notifications working
- [x] Database connectivity confirmed
- [x] Staging environment fully functional

### New Features Ready for Production
- Deep dive analysis display with status indicators
- Enhanced project dashboard with reports, analyses, and collaborators
- Project-linked summary report generation
- Complete API proxy routes for new endpoints

## Production Deployment Steps

### Step 1: Verify Current Production State
```bash
# Check current production frontend
curl -X GET "https://r-d-agent-frontend.vercel.app/api/debug"

# Verify backend connectivity
curl -X GET "https://r-dagent-production.up.railway.app/health"
```

### Step 2: Deploy to Production Frontend
1. **Access Vercel Dashboard**
   - Navigate to https://vercel.com/dashboard
   - Select the `r-d-agent` project (production)

2. **Deploy Specific Commit**
   - Go to Deployments tab
   - Click "Deploy" 
   - Select commit `0f588d5` or deploy from `main` branch
   - Confirm deployment

3. **Verify Environment Variables**
   - Ensure `NEXT_PUBLIC_BACKEND_URL` = `https://r-dagent-production.up.railway.app`
   - Confirm all required environment variables are set

### Step 3: Post-Deployment Validation

#### Frontend Validation
```bash
# Test production frontend health
curl -X GET "https://r-d-agent-frontend.vercel.app/api/debug"

# Verify backend connectivity from production
curl -X GET "https://r-d-agent-frontend.vercel.app/api/proxy/health"
```

#### Feature Validation
1. **Login Flow**: Test user authentication
2. **Project Creation**: Create a new test project
3. **Deep Dive Analysis**: Start an analysis and verify UI display
4. **Report Generation**: Create a report and verify it appears in project dashboard
5. **Collaborator Invitation**: Send an invitation and verify email delivery
6. **Real-time Updates**: Test WebSocket functionality

### Step 4: Rollback Procedure (If Needed)

If issues are detected:

```bash
# Rollback to previous stable version
# In Vercel dashboard, redeploy previous working commit
# Or use the stable rollback tag: stable-v1.0-pre-gaps-fix
```

## Expected Production URLs

### After Deployment
- **Frontend**: https://r-d-agent-frontend.vercel.app
- **Backend**: https://r-dagent-production.up.railway.app (unchanged)
- **Database**: PostgreSQL on Railway (unchanged)

## Monitoring Post-Deployment

### Key Metrics to Monitor
1. **Response Times**: Frontend and backend performance
2. **Error Rates**: Check for any 500/404 errors
3. **User Activity**: Monitor login and project creation
4. **Email Delivery**: Verify SendGrid notifications
5. **WebSocket Connections**: Real-time feature functionality

### Health Check Endpoints
- Frontend: `https://r-d-agent-frontend.vercel.app/api/debug`
- Backend: `https://r-dagent-production.up.railway.app/health`

## Communication Plan

### User Notification
After successful deployment, notify users of new features:

**New Features Available:**
- Enhanced project dashboard showing all reports and analyses
- Visual status indicators for deep dive analysis progress
- Improved project-linked summary report generation
- Better collaboration visibility with team member display

## Support Information

### Troubleshooting
- **Frontend Issues**: Check Vercel deployment logs
- **Backend Issues**: Monitor Railway application logs
- **Database Issues**: Verify PostgreSQL connection health
- **Email Issues**: Check SendGrid delivery status

### Emergency Contacts
- **Technical Issues**: Check GitHub repository issues
- **Deployment Issues**: Verify Vercel and Railway status pages

---

**Deployment Target**: Commit `0f588d5`  
**Estimated Deployment Time**: 5-10 minutes  
**Risk Level**: Low (all features tested in staging)  
**Rollback Time**: < 2 minutes if needed
