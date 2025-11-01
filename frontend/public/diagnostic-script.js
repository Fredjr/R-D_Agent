/**
 * DIAGNOSTIC SCRIPT - Check what's actually deployed
 * 
 * Run this in browser console to check:
 * 1. Which JavaScript bundle is loaded
 * 2. What User-ID header is being sent
 * 3. Network requests details
 */

(async function diagnosticCheck() {
  console.clear();
  console.log('%c🔍 DIAGNOSTIC CHECK - Phase 1 Week 1', 'color: #3b82f6; font-weight: bold; font-size: 16px;');
  console.log('═══════════════════════════════════════════════════════════\n');

  // 1. Check deployment version
  console.log('%c1. DEPLOYMENT INFO', 'color: #06b6d4; font-weight: bold;');
  console.log('Current URL:', window.location.href);
  console.log('Hostname:', window.location.hostname);
  
  // Check for build ID in HTML
  const scripts = Array.from(document.querySelectorAll('script[src]'));
  console.log('Loaded scripts:', scripts.length);
  scripts.slice(0, 5).forEach(script => {
    console.log('  -', script.src.substring(0, 100));
  });

  // 2. Check User-ID in requests
  console.log('\n%c2. CHECKING USER-ID HEADER', 'color: #06b6d4; font-weight: bold;');
  
  const projectId = window.location.pathname.split('/').pop();
  console.log('Project ID:', projectId);

  // Intercept fetch to see what headers are being sent
  const originalFetch = window.fetch;
  let capturedHeaders = null;
  
  window.fetch = function(...args) {
    const [url, options] = args;
    if (url.includes('/annotations')) {
      console.log('%c📤 INTERCEPTED ANNOTATIONS REQUEST:', 'color: #eab308; font-weight: bold;');
      console.log('URL:', url);
      console.log('Headers:', options?.headers);
      capturedHeaders = options?.headers;
    }
    return originalFetch.apply(this, args);
  };

  // 3. Make a test request
  console.log('\n%c3. MAKING TEST REQUEST', 'color: #06b6d4; font-weight: bold;');
  
  try {
    const response = await fetch(`/api/proxy/projects/${projectId}/annotations`, {
      headers: {
        'User-ID': 'fredericle75019@gmail.com'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response OK:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('%c✅ SUCCESS! Annotations loaded:', 'color: #22c55e; font-weight: bold;');
      console.log('Count:', Array.isArray(data) ? data.length : data.annotations?.length || 0);
    } else {
      const error = await response.text();
      console.log('%c❌ FAILED! Response:', 'color: #ef4444; font-weight: bold;');
      console.log(error);
    }
  } catch (error) {
    console.log('%c❌ ERROR:', 'color: #ef4444; font-weight: bold;');
    console.log(error);
  }

  // 4. Check if NotesTab component is using correct header
  console.log('\n%c4. CHECKING REACT COMPONENTS', 'color: #06b6d4; font-weight: bold;');
  
  // Try to find React Fiber to inspect component props
  const rootElement = document.getElementById('__next');
  if (rootElement && rootElement._reactRootContainer) {
    console.log('React root found');
  } else {
    console.log('React root not accessible (expected in production)');
  }

  // 5. Check localStorage/sessionStorage
  console.log('\n%c5. CHECKING STORAGE', 'color: #06b6d4; font-weight: bold;');
  console.log('localStorage keys:', Object.keys(localStorage));
  console.log('sessionStorage keys:', Object.keys(sessionStorage));

  // 6. Check service worker
  console.log('\n%c6. CHECKING SERVICE WORKER', 'color: #06b6d4; font-weight: bold;');
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log('Service workers:', registrations.length);
    if (registrations.length > 0) {
      console.log('%c⚠️ WARNING: Service worker detected! This might cache old code.', 'color: #eab308; font-weight: bold;');
      console.log('To fix: Run this command:');
      console.log('%cnavigator.serviceWorker.getRegistrations().then(regs => regs.forEach(reg => reg.unregister()))', 'color: #3b82f6;');
    }
  }

  // 7. Check cache storage
  console.log('\n%c7. CHECKING CACHE STORAGE', 'color: #06b6d4; font-weight: bold;');
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    console.log('Cache names:', cacheNames);
    if (cacheNames.length > 0) {
      console.log('%c⚠️ WARNING: Caches detected!', 'color: #eab308; font-weight: bold;');
      console.log('To clear: Run this command:');
      console.log('%ccaches.keys().then(names => names.forEach(name => caches.delete(name)))', 'color: #3b82f6;');
    }
  }

  // 8. Final recommendations
  console.log('\n%c═══════════════════════════════════════════════════════════', 'color: #3b82f6; font-weight: bold;');
  console.log('%c📋 RECOMMENDATIONS', 'color: #3b82f6; font-weight: bold;');
  console.log('%c═══════════════════════════════════════════════════════════', 'color: #3b82f6; font-weight: bold;');
  
  console.log('\n%cIf you see 401 errors:', 'color: #eab308; font-weight: bold;');
  console.log('1. Clear all site data:');
  console.log('   - Chrome: DevTools > Application > Clear storage > Clear site data');
  console.log('   - Firefox: DevTools > Storage > Clear All');
  console.log('2. Unregister service workers (see command above)');
  console.log('3. Clear cache storage (see command above)');
  console.log('4. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)');
  console.log('5. Try incognito/private mode');
  
  console.log('\n%cIf still failing:', 'color: #eab308; font-weight: bold;');
  console.log('- Check Network tab in DevTools');
  console.log('- Look for the annotations request');
  console.log('- Check what User-ID header is actually being sent');
  console.log('- Compare with expected: fredericle75019@gmail.com');

  // Restore original fetch
  window.fetch = originalFetch;

  console.log('\n%c✅ Diagnostic check complete!', 'color: #22c55e; font-weight: bold;');
})();

