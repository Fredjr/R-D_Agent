# Stable Version Rollback Documentation

## Current Stable Version
**Tag**: `stable-v1.0-pre-gaps-fix`
**Date**: 2025-09-12
**Frontend URL**: https://frontend-psi-seven-85.vercel.app/
**Backend URL**: https://r-dagent-production.up.railway.app

## Rollback Instructions
If issues arise with new implementations, rollback using:

```bash
git checkout stable-v1.0-pre-gaps-fix
git push origin main --force
```

## Working Features at This Version
- ✅ New Report Creation
- ✅ Add Note (Annotations)
- ✅ Deep Dive Analysis Creation (backend only)
- ✅ Generate Summary Report
- ✅ Invite Collaborators with SendGrid email
- ✅ Project Management
- ✅ User Authentication
- ✅ WebSocket Real-time Updates

## Known Gaps Being Fixed
- ❌ GET endpoint for deep dive analyses
- ❌ Deep dive analyses not in project details
- ❌ Frontend components for analysis/report display
- ❌ Summary reports not linked to projects

## Environment Configuration
- Railway: SENDGRID_API_KEY, FROM_EMAIL=jules.balanche@erythosia.com
- Vercel: NEXT_PUBLIC_BACKEND_URL=https://r-dagent-production.up.railway.app
