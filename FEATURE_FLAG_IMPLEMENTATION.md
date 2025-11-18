# Feature Flag Implementation for Questions Tab

**Purpose**: Enable Questions tab only for design partners  
**Status**: NOT STARTED  
**Owner**: Engineering Lead  
**Time**: 2 hours

---

## 🎯 Requirements

1. Create feature flag system (if not exists)
2. Add `questions_tab_beta` flag
3. Enable for specific user emails
4. Hide Questions tab for non-beta users
5. Add admin UI to manage flags

---

## 🏗️ Implementation Plan

### Option 1: Simple Environment Variable (Quick)

**Pros**: Fast, no database changes  
**Cons**: Requires redeployment to change users  
**Time**: 30 minutes

**Implementation**:

1. **Add environment variable** (`.env.local`):
```bash
NEXT_PUBLIC_QUESTIONS_TAB_BETA_USERS=user1@example.com,user2@example.com,user3@example.com
```

2. **Create feature flag hook** (`frontend/src/hooks/useFeatureFlag.ts`):
```typescript
export function useFeatureFlag(flagName: string): boolean {
  const { user } = useAuth();
  
  if (flagName === 'questions_tab_beta') {
    const betaUsers = process.env.NEXT_PUBLIC_QUESTIONS_TAB_BETA_USERS?.split(',') || [];
    return betaUsers.includes(user?.email || '');
  }
  
  return false;
}
```

3. **Use in navigation** (`frontend/src/components/layout/Navigation.tsx`):
```typescript
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export function Navigation() {
  const showQuestionsTab = useFeatureFlag('questions_tab_beta');
  
  return (
    <nav>
      {/* Other tabs */}
      {showQuestionsTab && (
        <Link href="/project/[projectId]?tab=questions">
          Questions
        </Link>
      )}
    </nav>
  );
}
```

---

### Option 2: Database-Backed Feature Flags (Recommended)

**Pros**: Dynamic, no redeployment needed, admin UI  
**Cons**: Requires database changes  
**Time**: 2 hours

**Implementation**:

#### Step 1: Database Schema

**Create migration** (`backend/migrations/add_feature_flags.sql`):
```sql
-- Feature flags table
CREATE TABLE feature_flags (
  flag_id VARCHAR(255) PRIMARY KEY,
  flag_name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  is_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User feature flags (many-to-many)
CREATE TABLE user_feature_flags (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  flag_id VARCHAR(255) NOT NULL,
  enabled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (flag_id) REFERENCES feature_flags(flag_id) ON DELETE CASCADE,
  UNIQUE(user_id, flag_id)
);

-- Insert Questions tab beta flag
INSERT INTO feature_flags (flag_id, flag_name, description, is_enabled)
VALUES (
  'questions_tab_beta',
  'Questions Tab Beta',
  'Access to the new Questions tab feature',
  TRUE
);
```

#### Step 2: Backend API

**Create endpoint** (`backend/routers/feature_flags.py`):
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

router = APIRouter(prefix="/api/feature-flags", tags=["feature-flags"])

@router.get("/user/{user_id}")
async def get_user_feature_flags(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Get all feature flags for a user"""
    flags = db.query(UserFeatureFlag).filter(
        UserFeatureFlag.user_id == user_id
    ).all()
    
    return {
        "user_id": user_id,
        "flags": [flag.flag_id for flag in flags]
    }

@router.post("/user/{user_id}/enable/{flag_id}")
async def enable_feature_flag(
    user_id: str,
    flag_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)  # Admin only
):
    """Enable a feature flag for a user"""
    # Check if flag exists
    flag = db.query(FeatureFlag).filter(
        FeatureFlag.flag_id == flag_id
    ).first()
    
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")
    
    # Check if already enabled
    existing = db.query(UserFeatureFlag).filter(
        UserFeatureFlag.user_id == user_id,
        UserFeatureFlag.flag_id == flag_id
    ).first()
    
    if existing:
        return {"message": "Flag already enabled"}
    
    # Enable flag
    user_flag = UserFeatureFlag(user_id=user_id, flag_id=flag_id)
    db.add(user_flag)
    db.commit()
    
    return {"message": "Flag enabled successfully"}

@router.delete("/user/{user_id}/disable/{flag_id}")
async def disable_feature_flag(
    user_id: str,
    flag_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)  # Admin only
):
    """Disable a feature flag for a user"""
    user_flag = db.query(UserFeatureFlag).filter(
        UserFeatureFlag.user_id == user_id,
        UserFeatureFlag.flag_id == flag_id
    ).first()
    
    if not user_flag:
        raise HTTPException(status_code=404, detail="Flag not found")
    
    db.delete(user_flag)
    db.commit()
    
    return {"message": "Flag disabled successfully"}
```

#### Step 3: Frontend Hook

**Create hook** (`frontend/src/hooks/useFeatureFlag.ts`):
```typescript
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function useFeatureFlag(flagId: string): boolean {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkFlag() {
      if (!user?.user_id) {
        setIsEnabled(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/proxy/feature-flags/user/${user.user_id}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setIsEnabled(data.flags.includes(flagId));
        }
      } catch (error) {
        console.error('Failed to check feature flag:', error);
        setIsEnabled(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkFlag();
  }, [user?.user_id, flagId]);

  return isEnabled;
}
```

#### Step 4: Use in Components

**Update navigation** (`frontend/src/components/layout/Navigation.tsx`):
```typescript
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export function Navigation() {
  const showQuestionsTab = useFeatureFlag('questions_tab_beta');

  return (
    <nav>
      {/* Other tabs */}
      {showQuestionsTab && (
        <Link href="/project/[projectId]?tab=questions">
          Questions
        </Link>
      )}
    </nav>
  );
}
```

**Update project page** (`frontend/src/app/project/[projectId]/page.tsx`):
```typescript
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export default function ProjectPage() {
  const showQuestionsTab = useFeatureFlag('questions_tab_beta');

  const tabs = [
    { id: 'papers', label: 'Papers' },
    { id: 'network', label: 'Network' },
    ...(showQuestionsTab ? [{ id: 'questions', label: 'Questions' }] : []),
    { id: 'reports', label: 'Reports' },
  ];

  // Rest of component...
}
```

---

### Option 3: Third-Party Service (LaunchDarkly, Flagsmith)

**Pros**: Full-featured, analytics, gradual rollouts
**Cons**: Additional cost, external dependency
**Time**: 1 hour (setup)

**Recommended for**: Production at scale

---

## 🚀 Deployment Steps

### For Option 1 (Environment Variable):

1. **Add beta user emails to `.env.local`**:
```bash
NEXT_PUBLIC_QUESTIONS_TAB_BETA_USERS=partner1@university.edu,partner2@university.edu,partner3@university.edu,partner4@university.edu,partner5@university.edu
```

2. **Create feature flag hook**
3. **Update navigation components**
4. **Test locally**
5. **Deploy to production**
6. **Verify with test account**

---

### For Option 2 (Database-Backed):

1. **Run database migration**:
```bash
cd backend
alembic revision --autogenerate -m "Add feature flags tables"
alembic upgrade head
```

2. **Create backend API endpoints**
3. **Create frontend hook**
4. **Update navigation components**
5. **Test locally**
6. **Deploy backend**
7. **Deploy frontend**
8. **Enable flag for design partners via admin UI**

---

## 🧪 Testing Checklist

- [ ] Feature flag hook returns correct value
- [ ] Questions tab visible for beta users
- [ ] Questions tab hidden for non-beta users
- [ ] Navigation updates correctly
- [ ] No console errors
- [ ] Works on all browsers (Chrome, Firefox, Safari)
- [ ] Works on mobile
- [ ] Admin can enable/disable flags (Option 2)

---

## 📊 Monitoring

### Metrics to Track:
- Number of users with flag enabled
- Questions tab usage by beta users
- Errors related to feature flag checks
- Performance impact of flag checks

### Alerts:
- Alert if feature flag API fails
- Alert if flag check takes > 500ms

---

## 🔄 Rollout Plan

### Phase 1: Design Partners (Week 7)
- Enable for 5 design partners
- Monitor usage and bugs
- Collect feedback

### Phase 2: Expanded Beta (Week 15)
- Enable for 15 more users (total: 20)
- Continue monitoring

### Phase 3: General Availability (Month 3)
- Remove feature flag
- Enable for all users
- Announce in changelog

---

## 🛠️ Admin UI (Optional for Option 2)

**Create admin page** (`frontend/src/app/admin/feature-flags/page.tsx`):
```typescript
'use client';

import { useState, useEffect } from 'react';

export default function FeatureFlagsAdmin() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [flags, setFlags] = useState([]);

  async function enableFlag(userId: string, flagId: string) {
    await fetch(`/api/proxy/feature-flags/user/${userId}/enable/${flagId}`, {
      method: 'POST',
    });
    // Refresh flags
  }

  async function disableFlag(userId: string, flagId: string) {
    await fetch(`/api/proxy/feature-flags/user/${userId}/disable/${flagId}`, {
      method: 'DELETE',
    });
    // Refresh flags
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Feature Flags Admin</h1>

      {/* User selector */}
      <select onChange={(e) => setSelectedUser(e.target.value)}>
        <option value="">Select user...</option>
        {users.map(user => (
          <option key={user.user_id} value={user.user_id}>
            {user.email}
          </option>
        ))}
      </select>

      {/* Flag toggles */}
      <div className="mt-4">
        <h2 className="text-xl font-semibold mb-2">Available Flags</h2>
        {flags.map(flag => (
          <div key={flag.flag_id} className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={flag.enabled}
              onChange={(e) => {
                if (e.target.checked) {
                  enableFlag(selectedUser, flag.flag_id);
                } else {
                  disableFlag(selectedUser, flag.flag_id);
                }
              }}
            />
            <label>{flag.flag_name}</label>
            <span className="text-sm text-gray-500">{flag.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 📝 Documentation

### For Design Partners:

**Email Template**:
```
Subject: You now have access to the Questions Tab! 🎉

Hi [Name],

Great news! We've enabled the Questions tab for your account.

You should now see a "Questions" tab when you open any project.

If you don't see it:
1. Log out and log back in
2. Hard refresh your browser (Cmd+Shift+R or Ctrl+Shift+R)
3. Clear your browser cache

Still not seeing it? Let us know in Slack!

Check out the onboarding guide to get started:
[Link to DESIGN_PARTNER_ONBOARDING_GUIDE.md]

Happy researching!
- The R&D Agent Team
```

---

## 🎯 Recommendation

**For Week 7**: Use **Option 1** (Environment Variable)
- Fastest to implement (30 minutes)
- Good enough for 5 users
- Can migrate to Option 2 later if needed

**For Phase 2**: Migrate to **Option 2** (Database-Backed)
- Better for 20+ users
- Admin UI for easy management
- No redeployment needed

---

**Status**: Ready to implement
**Next Step**: Choose option and implement

