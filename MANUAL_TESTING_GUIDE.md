# 🧪 Manual Testing Guide for Vercel Deployment

## 🚀 Quick Testing Steps

### Step 1: Open the Application
1. Go to: https://frontend-psi-seven-85.vercel.app/home
2. Open Chrome DevTools (F12)
3. Go to Console tab

### Step 2: Disable Chrome Autofill (Optional)
If Chrome keeps prompting for password saving, run this in console:
```javascript
// Copy and paste this entire script into console:
function disableChromeAutofill() {
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
        input.setAttribute('autocomplete', 'new-password');
        input.setAttribute('data-lpignore', 'true');
    });
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('data-lpignore', 'true');
    });
    console.log('✅ Chrome autofill disabled');
}
disableChromeAutofill();
```

### Step 3: Run Browser Diagnostic
Copy and paste the entire content of `BROWSER_DIAGNOSTIC.js` into the console and press Enter.

**Expected Output:**
```
🎉 ALL TESTS PASSED! Deployment is healthy.
```

### Step 4: Test Authentication Manually

#### Test Signin:
1. Go to: https://frontend-psi-seven-85.vercel.app/auth/signin
2. Enter credentials:
   - **Email**: `fredericle77@gmail.com`
   - **Password**: `qwerty1234`
3. Click "Sign In"
4. Should redirect to dashboard

#### Test Signup (with new email):
1. Go to: https://frontend-psi-seven-85.vercel.app/auth/signup
2. Enter new credentials:
   - **Email**: `test.new.user@example.com`
   - **Password**: `TestPass123` (must have uppercase, lowercase, numbers)
3. Click "Create Account"
4. Should redirect to complete profile page

### Step 5: Test Notification System
1. After signing in, look at the top-right corner
2. Find the notification bell icon
3. Check the connection indicator:
   - **✅ Green dot** = Connected (WebSocket working)
   - **❌ Red dot** = Disconnected (issue)

### Step 6: Test WebSocket Manually (Advanced)
Run this in console after signing in:
```javascript
// Test WebSocket connection manually
const userId = 'e29e29d3-f87f-4c70-9aeb-424002382195'; // Known user ID
const ws = new WebSocket(`wss://r-dagent-production.up.railway.app/ws/${userId}`);

ws.onopen = () => {
    console.log('✅ WebSocket connected!');
    ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
};

ws.onmessage = (event) => {
    console.log('📨 WebSocket message:', JSON.parse(event.data));
};

ws.onerror = (error) => {
    console.log('❌ WebSocket error:', error);
};

// Close after 5 seconds
setTimeout(() => {
    ws.close();
    console.log('🔌 WebSocket connection closed');
}, 5000);
```

## 🔍 What to Look For

### ✅ Success Indicators:
- **Authentication**: Successful login/signup
- **Notification Bell**: Green dot (connected)
- **Console Diagnostic**: All tests pass
- **WebSocket**: Connection established and receiving messages
- **No Errors**: Clean console with no red error messages

### ❌ Failure Indicators:
- **Authentication**: Login fails or shows validation errors
- **Notification Bell**: Red dot (disconnected)
- **Console Diagnostic**: Failed tests
- **WebSocket**: Connection timeout or errors
- **Console Errors**: Red error messages in console

## 🐛 Troubleshooting

### Issue: "require is not defined"
- **Cause**: Trying to run Node.js script in browser
- **Solution**: Use `BROWSER_DIAGNOSTIC.js` instead

### Issue: Chrome password popup
- **Cause**: Chrome's autofill feature
- **Solution**: Run the autofill disable script above

### Issue: WebSocket shows red dot
- **Cause**: WebSocket connection failed
- **Check**: 
  1. User is properly signed in
  2. User ID is available in localStorage
  3. Network connectivity
  4. Backend WebSocket endpoint is working

### Issue: Authentication fails
- **Check**:
  1. Password meets requirements (uppercase, lowercase, numbers)
  2. Email format is valid
  3. Network connectivity to backend

## 📊 Expected Test Results

### Browser Diagnostic Output:
```
🚀 STARTING BROWSER DIAGNOSTIC
✅ Backend health check passed
✅ Signin test passed
✅ User Notifications WebSocket connection successful
✅ Project WebSocket connection successful
✅ Projects List test passed
✅ Health Check test passed

📊 DIAGNOSTIC SUMMARY
Total Tests: 6
Passed: 6
Failed: 0
Duration: 3.68s

🎉 ALL TESTS PASSED! Deployment is healthy.
```

### Manual Testing Checklist:
- [ ] Can access the home page
- [ ] Can sign in with existing credentials
- [ ] Can sign up with new credentials (proper password)
- [ ] Notification bell shows green dot
- [ ] No console errors
- [ ] WebSocket connections work
- [ ] API endpoints respond correctly

## 🎯 Quick Verification Commands

Run these one-liners in console for quick checks:

```javascript
// Check if user is signed in
console.log('User:', JSON.parse(localStorage.getItem('rd_agent_user') || 'null'));

// Check WebSocket connection status
console.log('WebSocket status:', window.navigator.onLine ? 'Online' : 'Offline');

// Test backend health
fetch('https://r-dagent-production.up.railway.app/health').then(r => r.json()).then(console.log);

// Test authentication endpoint
fetch('https://frontend-psi-seven-85.vercel.app/api/proxy/auth/signin', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({email: 'fredericle77@gmail.com', password: 'qwerty1234'})
}).then(r => r.json()).then(console.log);
```

---

## 🎉 Summary

Use the **browser-compatible diagnostic script** (`BROWSER_DIAGNOSTIC.js`) to test all functionality without Node.js dependencies. The script will automatically test authentication, WebSocket connections, and API endpoints, giving you a comprehensive health check of the deployment.

**Expected result: All 6 tests should pass! ✅**
