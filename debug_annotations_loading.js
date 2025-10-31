/**
 * DEBUG SCRIPT: Annotations Loading Issue
 * 
 * Run this in the browser console when you're on the Network View
 * with a paper selected and seeing "Loading annotations..."
 * 
 * This will help diagnose why annotations are stuck loading.
 */

(async function debugAnnotationsLoading() {
  console.clear();
  console.log('%c🔍 DEBUGGING ANNOTATIONS LOADING ISSUE', 'color: #ff0000; font-weight: bold; font-size: 16px');
  console.log('');

  // Step 1: Get user info from localStorage
  console.log('%c[1] Checking User Authentication', 'color: #00aaff; font-weight: bold');
  
  let userEmail = null;
  try {
    const rdAgentUser = localStorage.getItem('rd_agent_user');
    if (rdAgentUser) {
      const userData = JSON.parse(rdAgentUser);
      userEmail = userData.email || userData.user_id;
      console.log('✅ User found:', userEmail);
      console.log('   Full user data:', userData);
    } else {
      console.log('❌ No rd_agent_user in localStorage');
    }
  } catch (e) {
    console.log('❌ Error parsing user data:', e);
  }

  if (!userEmail) {
    console.log('⚠️ Trying alternative localStorage keys...');
    const keys = Object.keys(localStorage);
    const userProfileKey = keys.find(k => k.startsWith('user_profile_') && k.includes('@'));
    if (userProfileKey) {
      userEmail = userProfileKey.replace('user_profile_', '');
      console.log('✅ Found user email from profile key:', userEmail);
    }
  }

  if (!userEmail) {
    console.log('❌ CRITICAL: Could not find user email!');
    console.log('   This will cause API calls to fail.');
    return;
  }

  console.log('');

  // Step 2: Get project ID from URL
  console.log('%c[2] Checking Project ID', 'color: #00aaff; font-weight: bold');
  
  const projectId = window.location.pathname.split('/').find(p => p.length === 36);
  if (projectId) {
    console.log('✅ Project ID found:', projectId);
  } else {
    console.log('❌ CRITICAL: Could not find project ID in URL!');
    console.log('   Current URL:', window.location.href);
    return;
  }

  console.log('');

  // Step 3: Check if we're in Network View with a paper selected
  console.log('%c[3] Checking Network View State', 'color: #00aaff; font-weight: bold');
  
  const networkSidebar = document.querySelector('[class*="NetworkSidebar"], aside');
  if (networkSidebar) {
    console.log('✅ NetworkSidebar found in DOM');
  } else {
    console.log('⚠️ NetworkSidebar not found - are you in Network View with a paper selected?');
  }

  console.log('');

  // Step 4: Test annotations API endpoint directly
  console.log('%c[4] Testing Annotations API Endpoint', 'color: #00aaff; font-weight: bold');
  
  const backendUrl = 'https://r-dagent-production.up.railway.app';
  const annotationsUrl = `${backendUrl}/projects/${projectId}/annotations`;
  
  console.log('   URL:', annotationsUrl);
  console.log('   User-ID header:', userEmail);
  console.log('');
  console.log('   Making API call...');
  
  try {
    const response = await fetch(annotationsUrl, {
      method: 'GET',
      headers: {
        'User-ID': userEmail,
        'Content-Type': 'application/json',
      },
    });

    console.log('   Response status:', response.status, response.statusText);
    console.log('   Response headers:');
    response.headers.forEach((value, key) => {
      if (key.includes('access-control') || key.includes('content-type')) {
        console.log(`     ${key}: ${value}`);
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API call successful!');
      console.log('   Annotations count:', data.annotations?.length || 0);
      console.log('   Response data:', data);
      
      if (data.annotations && data.annotations.length > 0) {
        console.log('   Sample annotation:', data.annotations[0]);
      } else {
        console.log('   ℹ️ No annotations found (empty array)');
      }
    } else {
      console.log('❌ API call failed!');
      const errorText = await response.text();
      console.log('   Error response:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.log('   Error details:', errorJson);
      } catch (e) {
        // Not JSON
      }
    }
  } catch (error) {
    console.log('❌ Network error:', error);
    console.log('   This could be a CORS issue or network connectivity problem');
  }

  console.log('');

  // Step 5: Test through proxy (how frontend actually calls it)
  console.log('%c[5] Testing Through Frontend Proxy', 'color: #00aaff; font-weight: bold');
  
  const proxyUrl = `/api/proxy/projects/${projectId}/annotations`;
  console.log('   Proxy URL:', proxyUrl);
  console.log('');
  console.log('   Making API call through proxy...');
  
  try {
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'User-ID': userEmail,
        'Content-Type': 'application/json',
      },
    });

    console.log('   Response status:', response.status, response.statusText);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Proxy call successful!');
      console.log('   Annotations count:', data.annotations?.length || 0);
      console.log('   Response data:', data);
    } else {
      console.log('❌ Proxy call failed!');
      const errorText = await response.text();
      console.log('   Error response:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.log('   Error details:', errorJson);
      } catch (e) {
        // Not JSON
      }
    }
  } catch (error) {
    console.log('❌ Proxy error:', error);
  }

  console.log('');

  // Step 6: Check React component state
  console.log('%c[6] Checking React Component State', 'color: #00aaff; font-weight: bold');
  
  const annotationListElement = document.querySelector('[class*="annotation"], [class*="note"]');
  if (annotationListElement) {
    console.log('✅ Found annotation-related element in DOM');
    console.log('   Element:', annotationListElement);
    console.log('   Text content:', annotationListElement.textContent?.substring(0, 100));
  } else {
    console.log('⚠️ No annotation-related elements found in DOM');
  }

  // Check for "Loading annotations..." text
  const loadingText = Array.from(document.querySelectorAll('*')).find(el => 
    el.textContent?.includes('Loading annotations')
  );
  if (loadingText) {
    console.log('✅ Found "Loading annotations..." element');
    console.log('   Element:', loadingText);
    console.log('   Parent:', loadingText.parentElement);
  } else {
    console.log('⚠️ "Loading annotations..." text not found in DOM');
  }

  console.log('');

  // Step 7: Summary and recommendations
  console.log('%c[7] SUMMARY & RECOMMENDATIONS', 'color: #ffaa00; font-weight: bold; font-size: 14px');
  console.log('');
  
  console.log('📋 Checklist:');
  console.log(`   ${userEmail ? '✅' : '❌'} User authenticated: ${userEmail || 'NO'}`);
  console.log(`   ${projectId ? '✅' : '❌'} Project ID found: ${projectId || 'NO'}`);
  console.log(`   ${networkSidebar ? '✅' : '⚠️'} NetworkSidebar in DOM: ${networkSidebar ? 'YES' : 'NO'}`);
  console.log('');

  console.log('🔧 Next Steps:');
  console.log('   1. Check the API call results above');
  console.log('   2. If API returns 403: User doesn\'t have access to project');
  console.log('   3. If API returns 200 with empty array: No annotations exist (this is OK!)');
  console.log('   4. If API returns error: Check backend logs');
  console.log('   5. If proxy fails but direct call works: Proxy configuration issue');
  console.log('');

  console.log('📞 Send this entire console output to the AI for analysis!');
  console.log('');

})();

