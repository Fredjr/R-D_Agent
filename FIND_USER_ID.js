/**
 * ============================================================================
 * HELPER SCRIPT: Find Your User ID
 * ============================================================================
 * 
 * Run this script in the browser console to find your User ID.
 * Copy the User ID and use it when prompted by the test suite.
 * 
 * USAGE:
 * 1. Open browser DevTools Console (F12)
 * 2. Copy and paste this script
 * 3. Press Enter
 * 4. Copy the User ID that is displayed
 * ============================================================================
 */

(function() {
  console.log('%c╔════════════════════════════════════════════════════════════════╗', 'color: #1DB954; font-weight: bold');
  console.log('%c║  FIND YOUR USER ID - HELPER SCRIPT                            ║', 'color: #1DB954; font-weight: bold');
  console.log('%c╚════════════════════════════════════════════════════════════════╝', 'color: #1DB954; font-weight: bold');
  console.log('');

  let foundUserId = null;
  const findings = [];

  // Check localStorage
  console.log('%c🔍 Checking localStorage...', 'color: #1DB954; font-weight: bold');
  const userDataKeys = ['user', 'userData', 'currentUser', 'auth', 'session', 'userId', 'user_id'];
  
  for (const key of userDataKeys) {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (parsed.userId || parsed.user_id || parsed.id) {
          const id = parsed.userId || parsed.user_id || parsed.id;
          findings.push({ source: `localStorage.${key}`, userId: id });
          if (!foundUserId) foundUserId = id;
        }
      } catch (e) {
        // Not JSON, might be direct user ID
        if (data.length > 10 && data.includes('-')) {
          findings.push({ source: `localStorage.${key}`, userId: data });
          if (!foundUserId) foundUserId = data;
        }
      }
    }
  }

  // Check all localStorage keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && !userDataKeys.includes(key)) {
      const value = localStorage.getItem(key);
      if (value && value.length > 10 && value.includes('-') && value.match(/^[a-f0-9-]{36}$/i)) {
        findings.push({ source: `localStorage.${key}`, userId: value });
        if (!foundUserId) foundUserId = value;
      }
    }
  }

  // Check cookies
  console.log('%c🔍 Checking cookies...', 'color: #1DB954; font-weight: bold');
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if ((name === 'userId' || name === 'user_id' || name === 'user') && value) {
      findings.push({ source: `cookie.${name}`, userId: value });
      if (!foundUserId) foundUserId = value;
    }
  }

  // Check sessionStorage
  console.log('%c🔍 Checking sessionStorage...', 'color: #1DB954; font-weight: bold');
  for (const key of userDataKeys) {
    const data = sessionStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (parsed.userId || parsed.user_id || parsed.id) {
          const id = parsed.userId || parsed.user_id || parsed.id;
          findings.push({ source: `sessionStorage.${key}`, userId: id });
          if (!foundUserId) foundUserId = id;
        }
      } catch (e) {
        if (data.length > 10 && data.includes('-')) {
          findings.push({ source: `sessionStorage.${key}`, userId: data });
          if (!foundUserId) foundUserId = data;
        }
      }
    }
  }

  // Display results
  console.log('');
  console.log('%c═══════════════════════════════════════════════════════════════', 'color: #1DB954');
  console.log('%cRESULTS', 'color: #1DB954; font-weight: bold; font-size: 14px');
  console.log('%c═══════════════════════════════════════════════════════════════', 'color: #1DB954');
  console.log('');

  if (findings.length > 0) {
    console.log(`%c✅ Found ${findings.length} potential User ID(s):`, 'color: #1DB954; font-weight: bold');
    console.log('');
    
    findings.forEach((finding, index) => {
      console.log(`%c${index + 1}. Source: ${finding.source}`, 'color: #FFFFFF');
      console.log(`   User ID: %c${finding.userId}`, 'color: #1DB954; font-weight: bold');
      console.log('');
    });

    if (foundUserId) {
      console.log('%c═══════════════════════════════════════════════════════════════', 'color: #1DB954');
      console.log('%c🎯 RECOMMENDED USER ID:', 'color: #1DB954; font-weight: bold; font-size: 14px');
      console.log(`%c${foundUserId}`, 'color: #1DB954; font-weight: bold; font-size: 16px; background: #000; padding: 5px;');
      console.log('%c═══════════════════════════════════════════════════════════════', 'color: #1DB954');
      console.log('');
      console.log('%c📋 Copy the User ID above and use it when running the test suite.', 'color: #FFA500');
    }
  } else {
    console.log('%c❌ No User ID found in localStorage, cookies, or sessionStorage', 'color: #E22134; font-weight: bold');
    console.log('');
    console.log('%c💡 SUGGESTIONS:', 'color: #FFA500; font-weight: bold');
    console.log('   1. Make sure you are logged in');
    console.log('   2. Check your profile page for your User ID');
    console.log('   3. Look in the Network tab for API requests with User-ID header');
    console.log('   4. Contact your admin for your User ID');
  }

  console.log('');
  console.log('%c═══════════════════════════════════════════════════════════════', 'color: #1DB954');
  console.log('');

  return {
    found: findings.length > 0,
    userId: foundUserId,
    allFindings: findings
  };
})();

