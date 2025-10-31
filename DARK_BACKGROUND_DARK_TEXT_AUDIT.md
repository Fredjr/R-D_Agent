# Dark Background + Dark Text Contrast Issues - Audit Report

## Date: 2025-10-31
## Issue: Black boxes with black background and dark font making text unreadable

---

## 🔍 **Root Cause**

The `spotify-theme.css` file contains global CSS rules with `!important` that apply dark backgrounds to ALL form elements:

```css
/* Lines 398-402 in spotify-theme.css */
input, textarea, select {
  background-color: var(--spotify-medium-gray) !important;
  color: var(--spotify-white) !important;
  border: 1px solid var(--spotify-border-gray) !important;
}
```

This causes form elements on white/light backgrounds to have dark backgrounds with dark text, making them unreadable.

---

## 🚨 **Affected Components**

### **1. Authentication Pages** ⚠️ **CRITICAL**

#### **Sign In Page** (`/auth/signin`)
- **File:** `frontend/src/app/auth/signin/page.tsx`
- **Issue:** White card (`bg-white` on line 46) with dark input fields
- **Affected Elements:**
  - Email input (line 69-77)
  - Password input (line 88-96)
  - Labels (lines 64, 83)
- **Impact:** Users cannot see what they're typing during login

#### **Sign Up Page** (`/auth/signup`)
- **File:** `frontend/src/app/auth/signup/page.tsx`
- **Issue:** White card (`bg-white` on line 95) with dark input fields
- **Affected Elements:**
  - Email Input component (lines 113-123)
  - Password Input component (lines 128-138)
  - Labels rendered by Input/PasswordInput components
- **Impact:** Users cannot see what they're typing during registration

#### **Complete Profile Page** (`/auth/complete-profile`)
- **File:** `frontend/src/app/auth/complete-profile/page.tsx`
- **Issue:** White card (`bg-white` on line 112) with dark input fields
- **Affected Elements:**
  - First Name input (lines 136-144)
  - Last Name input (similar pattern)
  - Category select dropdown
  - Role select dropdown
  - Institution input
  - Subject Area input
  - How Heard About Us input
  - All labels (e.g., line 131)
- **Impact:** Users cannot complete their profile

#### **Auth Landing Page** (`/auth`)
- **File:** `frontend/src/app/auth/page.tsx`
- **Issue:** White card (`bg-white` on line 10)
- **Affected Elements:** No form elements, but text visibility issues
- **Impact:** Low - mostly navigation links

---

### **2. Modal Components** ⚠️ **HIGH PRIORITY**

#### **AuthModal Component**
- **File:** `frontend/src/components/AuthModal.tsx`
- **Issue:** White background modal (`bg-white` on line 44)
- **Affected Elements:**
  - Email Input component (lines 57-67)
  - Username Input component (lines 71-80)
  - Labels rendered by Input components
- **Impact:** Quick login modal is unreadable

#### **Generic Modal Component**
- **File:** `frontend/src/components/ui/Modal.tsx`
- **Issue:** White background modal (`bg-white` on line 68)
- **Affected Elements:** Any form elements rendered inside modals
- **Impact:** All modals using this component with forms are affected

#### **ClusterExplorationModal**
- **File:** `frontend/src/components/ClusterExplorationModal.tsx`
- **Issue:** White background modal (`bg-white` on line 123)
- **Affected Elements:** Any form elements inside this modal
- **Impact:** Research cluster exploration may have form issues

#### **ArticleSummaryModal**
- **File:** `frontend/src/components/ArticleSummaryModal.tsx`
- **Issue:** White background modal (`bg-white` on line 177)
- **Affected Elements:** Text content visibility
- **Impact:** Summary text may be hard to read

---

### **3. Settings Page** ⚠️ **MEDIUM PRIORITY**

#### **Settings Page**
- **File:** `frontend/src/app/settings/page.tsx`
- **Issue:** Contains form elements with explicit dark theme styling
- **Affected Elements:**
  - Profile settings inputs (lines 79-86)
  - All form inputs use explicit dark theme classes
- **Impact:** Settings page intentionally uses dark theme, but may have inconsistencies

---

### **4. Other Components with White Backgrounds**

#### **ContextMenu Component**
- **File:** `frontend/src/components/ui/ContextMenu.tsx`
- **Issue:** White background (`bg-white`)
- **Affected Elements:** Any form elements in context menus
- **Impact:** Low - mostly buttons and links

#### **PerformanceMonitor Component**
- **File:** `frontend/src/components/PerformanceMonitor.tsx`
- **Issue:** White background (`bg-white`)
- **Affected Elements:** Display only, no forms
- **Impact:** None

---

## ✅ **Fix Applied**

### **Solution: CSS Override for White Backgrounds**

Added comprehensive CSS overrides in `spotify-theme.css` (lines 638-708) to fix form elements on white/light backgrounds:

```css
/* Fix input, textarea, and select elements on white/light backgrounds */
.bg-white input,
.bg-white textarea,
.bg-white select,
.bg-gray-50 input,
.bg-gray-50 textarea,
.bg-gray-50 select,
.bg-gray-100 input,
.bg-gray-100 textarea,
.bg-gray-100 select {
  background-color: #ffffff !important;
  color: #1a1a1a !important;
  border: 1px solid #d1d5db !important; /* gray-300 */
}

/* Fix placeholder text on white backgrounds */
.bg-white input::placeholder,
.bg-white textarea::placeholder,
.bg-white select::placeholder,
.bg-gray-50 input::placeholder,
.bg-gray-50 textarea::placeholder,
.bg-gray-50 select::placeholder,
.bg-gray-100 input::placeholder,
.bg-gray-100 textarea::placeholder,
.bg-gray-100 select::placeholder {
  color: #9ca3af !important; /* gray-400 */
}

/* Fix labels on white backgrounds */
.bg-white label,
.bg-white .form-label,
.bg-gray-50 label,
.bg-gray-50 .form-label,
.bg-gray-100 label,
.bg-gray-100 .form-label {
  color: #374151 !important; /* gray-700 */
}

/* Fix focus states on white backgrounds */
.bg-white input:focus,
.bg-white textarea:focus,
.bg-white select:focus,
.bg-gray-50 input:focus,
.bg-gray-50 textarea:focus,
.bg-gray-50 select:focus,
.bg-gray-100 input:focus,
.bg-gray-100 textarea:focus,
.bg-gray-100 select:focus {
  border-color: #3b82f6 !important; /* blue-500 */
  outline: none !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
}

/* Fix disabled states on white backgrounds */
.bg-white input:disabled,
.bg-white textarea:disabled,
.bg-white select:disabled,
.bg-gray-50 input:disabled,
.bg-gray-50 textarea:disabled,
.bg-gray-50 select:disabled,
.bg-gray-100 input:disabled,
.bg-gray-100 textarea:disabled,
.bg-gray-100 select:disabled {
  background-color: #f3f4f6 !important; /* gray-100 */
  color: #9ca3af !important; /* gray-400 */
  cursor: not-allowed !important;
}
```

---

## 🧪 **Testing Checklist**

### **Critical Tests** (Must Pass)
- [ ] Sign In page - Email and password inputs are readable
- [ ] Sign Up page - Email and password inputs are readable
- [ ] Complete Profile page - All form inputs are readable
- [ ] AuthModal - Email and username inputs are readable

### **High Priority Tests**
- [ ] Generic Modal with forms - Inputs are readable
- [ ] ClusterExplorationModal - Any forms are readable

### **Medium Priority Tests**
- [ ] Settings page - All inputs remain properly styled
- [ ] Any other modals with forms

---

## 📊 **Impact Summary**

| Severity | Count | Components |
|----------|-------|------------|
| **CRITICAL** | 4 | Sign In, Sign Up, Complete Profile, AuthModal |
| **HIGH** | 2 | Generic Modal, ClusterExplorationModal |
| **MEDIUM** | 1 | Settings Page |
| **LOW** | 2 | ContextMenu, PerformanceMonitor |

**Total Affected Components:** 9

---

## 🎯 **Expected Outcome**

After applying the fix:

1. ✅ All form inputs on white backgrounds will have white backgrounds
2. ✅ All text in form inputs will be dark (readable)
3. ✅ All labels will be dark gray (readable)
4. ✅ Placeholder text will be medium gray (readable)
5. ✅ Focus states will show blue border with subtle shadow
6. ✅ Disabled states will have light gray background

---

## 🔄 **Future Recommendations**

1. **Consider Theme Toggle:** Add a theme switcher to allow users to choose between dark and light themes
2. **Component-Level Theming:** Use CSS variables or Tailwind's dark mode classes for better theme management
3. **Audit Other Pages:** Check dashboard, project pages, and other areas for similar issues
4. **Accessibility Testing:** Run WCAG contrast ratio tests on all form elements
5. **Design System:** Create a comprehensive design system with clear guidelines for light/dark backgrounds

---

## 📝 **Files Modified**

1. `frontend/src/styles/spotify-theme.css` - Added CSS overrides (lines 638-708)

---

**Status:** ✅ **FIX APPLIED - READY FOR TESTING**

