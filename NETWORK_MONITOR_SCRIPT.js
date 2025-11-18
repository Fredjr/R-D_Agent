/**
 * ============================================================================
 * NETWORK MONITOR SCRIPT
 * ============================================================================
 * 
 * This script intercepts fetch calls to monitor API requests/responses
 * Run this BEFORE running the comprehensive test to see what's happening
 * 
 * USAGE:
 * 1. Copy/paste this script FIRST
 * 2. Then run the comprehensive test
 * 3. Check the console for detailed API call logs
 * ============================================================================
 */

(function() {
  console.log('%c╔════════════════════════════════════════════════════════════════╗', 'color: #FF6B6B; font-weight: bold; font-size: 16px');
  console.log('%c║              NETWORK MONITOR ACTIVE                            ║', 'color: #FF6B6B; font-weight: bold; font-size: 16px');
  console.log('%c╚════════════════════════════════════════════════════════════════╝', 'color: #FF6B6B; font-weight: bold; font-size: 16px');
  console.log('');
  console.log('📡 Monitoring all fetch requests...');
  console.log('');

  // Store original fetch
  const originalFetch = window.fetch;
  
  // Track API calls
  window.apiCallLog = [];

  // Override fetch
  window.fetch = async function(...args) {
    const [url, options = {}] = args;
    
    // Only log API calls (not other resources)
    if (url.includes('/api/')) {
      const timestamp = new Date().toISOString();
      const method = options.method || 'GET';
      
      console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #4ECDC4');
      console.log(`%c🌐 API CALL: ${method} ${url}`, 'color: #1DB954; font-weight: bold');
      console.log(`   ⏰ Time: ${timestamp}`);
      
      // Log headers
      if (options.headers) {
        console.log('   📋 Headers:');
        Object.entries(options.headers).forEach(([key, value]) => {
          console.log(`      ${key}: ${value}`);
        });
      }
      
      // Log body
      if (options.body) {
        console.log('   📦 Request Body:');
        try {
          const body = JSON.parse(options.body);
          console.log(body);
        } catch {
          console.log(options.body);
        }
      }
    }
    
    // Make the actual request
    try {
      const response = await originalFetch(...args);
      
      // Log response for API calls
      if (url.includes('/api/')) {
        console.log(`   📊 Response Status: ${response.status} ${response.statusText}`);
        
        // Clone response to read body without consuming it
        const clonedResponse = response.clone();
        
        try {
          const responseData = await clonedResponse.json();
          console.log('   ✅ Response Data:');
          console.log(responseData);
          
          // Store in log
          window.apiCallLog.push({
            timestamp: new Date().toISOString(),
            method: options.method || 'GET',
            url,
            status: response.status,
            headers: options.headers,
            requestBody: options.body ? JSON.parse(options.body) : null,
            responseBody: responseData
          });
        } catch (e) {
          console.log('   ⚠️  Response is not JSON or empty');
        }
        
        if (!response.ok) {
          console.log(`   ❌ ERROR: ${response.status} ${response.statusText}`);
        }
        
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #4ECDC4');
        console.log('');
      }
      
      return response;
    } catch (error) {
      if (url.includes('/api/')) {
        console.log(`   ❌ FETCH ERROR: ${error.message}`);
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #4ECDC4');
        console.log('');
      }
      throw error;
    }
  };

  console.log('✅ Network monitor installed');
  console.log('💡 Now run the comprehensive test to see all API calls');
  console.log('💡 View all logged calls with: window.apiCallLog');
  console.log('');
})();

