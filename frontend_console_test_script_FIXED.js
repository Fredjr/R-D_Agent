/**
 * PHASE 1 CONTEXTUAL NOTES - COMPREHENSIVE FRONTEND TEST SCRIPT (FIXED)
 * 
 * FIXED ISSUES:
 * - Uses correct user ID from localStorage (rd_agent_user)
 * - Uses correct project ID from URL
 * - Better detection of NetworkSidebar components
 * 
 * Instructions:
 * 1. Navigate to Network View in your project
 * 2. Click on a paper node to open NetworkSidebar
 * 3. Open browser DevTools (F12) → Console tab
 * 4. Copy and paste this ENTIRE script into the console
 * 5. Press Enter to run
 * 6. Copy ALL console output and send back
 */

(async function runPhase1TestsFixed() {
  console.clear();
  console.log('%c╔════════════════════════════════════════════════════════════════╗', 'color: #00ff00; font-weight: bold');
  console.log('%c║  PHASE 1 CONTEXTUAL NOTES - FIXED TEST SCRIPT                 ║', 'color: #00ff00; font-weight: bold');
  console.log('%c╚════════════════════════════════════════════════════════════════╝', 'color: #00ff00; font-weight: bold');
  console.log('');
  console.log('%c📅 Test Date:', 'color: #00aaff; font-weight: bold', new Date().toISOString());
  console.log('%c🌐 Test URL:', 'color: #00aaff; font-weight: bold', window.location.href);
  console.log('');

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
  };

  function logTest(category, name, status, details = '') {
    const icons = { pass: '✅', fail: '❌', warn: '⚠️' };
    const colors = { pass: '#00ff00', fail: '#ff0000', warn: '#ffaa00' };
    
    console.log(`%c${icons[status]} [${category}] ${name}`, `color: ${colors[status]}; font-weight: bold`, details);
    
    results.tests.push({ category, name, status, details });
    if (status === 'pass') results.passed++;
    else if (status === 'fail') results.failed++;
    else if (status === 'warn') results.warnings++;
  }

  function logSection(title) {
    console.log('');
    console.log('%c' + '═'.repeat(70), 'color: #00aaff');
    console.log('%c' + title, 'color: #00aaff; font-weight: bold; font-size: 14px');
    console.log('%c' + '═'.repeat(70), 'color: #00aaff');
  }

  // ============================================================================
  // CONFIGURATION & USER DETECTION
  // ============================================================================
  logSection('CONFIGURATION & USER DETECTION');

  // Get user from localStorage
  let userEmail = null;
  try {
    const rdAgentUser = localStorage.getItem('rd_agent_user');
    if (rdAgentUser) {
      const userData = JSON.parse(rdAgentUser);
      userEmail = userData.email || userData.user_id;
    }
  } catch (e) {
    console.warn('Could not parse rd_agent_user:', e);
  }

  if (!userEmail) {
    // Try other localStorage keys
    const keys = Object.keys(localStorage);
    const userProfileKey = keys.find(k => k.startsWith('user_profile_') && k.includes('@'));
    if (userProfileKey) {
      userEmail = userProfileKey.replace('user_profile_', '');
    }
  }

  if (userEmail) {
    logTest('Config', 'User email detected', 'pass', userEmail);
  } else {
    logTest('Config', 'User email detected', 'fail', 'Could not find user email in localStorage');
    userEmail = 'test_user'; // fallback
  }

  // Get project ID from URL
  const projectId = window.location.pathname.split('/').find(p => p.length === 36);
  if (projectId) {
    logTest('Config', 'Project ID detected', 'pass', projectId);
  } else {
    logTest('Config', 'Project ID detected', 'warn', 'Using fallback project ID');
  }

  const backendUrl = 'https://r-dagent-production.up.railway.app';
  logTest('Config', 'Backend URL', 'pass', backendUrl);

  // ============================================================================
  // STEP 1.1: DATABASE SCHEMA VERIFICATION (via API responses)
  // ============================================================================
  logSection('STEP 1.1: DATABASE SCHEMA VERIFICATION');

  try {
    const testProjectId = projectId || 'b700a560-eb62-4237-95d9-a1da0b2fc9ff';
    const response = await fetch(`${backendUrl}/projects/${testProjectId}/annotations`, {
      headers: { 'User-ID': userEmail }
    });

    console.log(`API Response Status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      logTest('1.1-API', 'Annotations endpoint accessible', 'pass', `${data.annotations?.length || 0} annotations found`);

      // Verify new schema fields exist in response
      if (data.annotations && data.annotations.length > 0) {
        const sample = data.annotations[0];
        console.log('Sample annotation:', sample);

        const requiredFields = [
          'annotation_id', 'project_id', 'content', 'article_pmid',
          'note_type', 'priority', 'status', 'tags', 'action_items',
          'parent_annotation_id', 'related_pmids', 'created_at', 'updated_at',
          'author_id', 'is_private'
        ];

        let schemaPass = 0;
        let schemaFail = 0;

        requiredFields.forEach(field => {
          if (field in sample) {
            schemaPass++;
            logTest('1.1-Schema', `Field '${field}'`, 'pass', typeof sample[field]);
          } else {
            schemaFail++;
            logTest('1.1-Schema', `Field '${field}'`, 'fail', 'Missing');
          }
        });

        // Verify enum values
        const validNoteTypes = ['finding', 'hypothesis', 'question', 'todo', 'comparison', 'critique', 'general'];
        const validPriorities = ['low', 'medium', 'high', 'critical'];
        const validStatuses = ['active', 'resolved', 'archived'];

        if (validNoteTypes.includes(sample.note_type)) {
          logTest('1.1-Schema', 'note_type enum', 'pass', sample.note_type);
        } else {
          logTest('1.1-Schema', 'note_type enum', 'warn', sample.note_type || 'null');
        }

        if (validPriorities.includes(sample.priority)) {
          logTest('1.1-Schema', 'priority enum', 'pass', sample.priority);
        } else {
          logTest('1.1-Schema', 'priority enum', 'warn', sample.priority || 'null');
        }

        if (validStatuses.includes(sample.status)) {
          logTest('1.1-Schema', 'status enum', 'pass', sample.status);
        } else {
          logTest('1.1-Schema', 'status enum', 'warn', sample.status || 'null');
        }

        // Verify JSON fields
        if (Array.isArray(sample.tags)) {
          logTest('1.1-Schema', 'tags is array', 'pass', `${sample.tags.length} tags`);
        } else {
          logTest('1.1-Schema', 'tags is array', 'fail', typeof sample.tags);
        }

        if (Array.isArray(sample.action_items)) {
          logTest('1.1-Schema', 'action_items is array', 'pass', `${sample.action_items.length} items`);
        } else {
          logTest('1.1-Schema', 'action_items is array', 'fail', typeof sample.action_items);
        }

        console.log(`Schema verification: ${schemaPass} passed, ${schemaFail} failed`);
      } else {
        logTest('1.1-Schema', 'Sample annotation', 'warn', 'No annotations to verify schema');
      }
    } else if (response.status === 403) {
      logTest('1.1-API', 'Annotations endpoint', 'fail', `HTTP 403 - Access denied for user: ${userEmail}`);
      console.error('403 Error - Check if user has access to this project');
    } else {
      logTest('1.1-API', 'Annotations endpoint', 'fail', `HTTP ${response.status}`);
    }
  } catch (error) {
    logTest('1.1-API', 'Database schema verification', 'fail', error.message);
    console.error('API Error:', error);
  }

  // ============================================================================
  // STEP 1.2: BACKEND API ENDPOINTS
  // ============================================================================
  logSection('STEP 1.2: BACKEND API ENDPOINTS');

  try {
    const testProjectId = projectId || 'b700a560-eb62-4237-95d9-a1da0b2fc9ff';

    // Test 1: GET annotations
    const getResponse = await fetch(`${backendUrl}/projects/${testProjectId}/annotations`, {
      headers: { 'User-ID': userEmail }
    });
    logTest('1.2-Endpoint', 'GET /annotations', getResponse.ok ? 'pass' : 'fail', `HTTP ${getResponse.status}`);

    // Test 2: GET with filters
    const filterResponse = await fetch(`${backendUrl}/projects/${testProjectId}/annotations?note_type=finding&priority=high`, {
      headers: { 'User-ID': userEmail }
    });
    logTest('1.2-Endpoint', 'GET /annotations with filters', filterResponse.ok ? 'pass' : 'fail', `HTTP ${filterResponse.status}`);

    // Test 3: GET all threads
    const threadsResponse = await fetch(`${backendUrl}/projects/${testProjectId}/annotations/threads`, {
      headers: { 'User-ID': userEmail }
    });
    logTest('1.2-Endpoint', 'GET /annotations/threads', threadsResponse.ok ? 'pass' : 'fail', `HTTP ${threadsResponse.status}`);

  } catch (error) {
    logTest('1.2-Endpoint', 'Backend API endpoints', 'fail', error.message);
  }

  // ============================================================================
  // STEP 1.3: FRONTEND UI COMPONENTS
  // ============================================================================
  logSection('STEP 1.3: FRONTEND UI COMPONENTS');

  try {
    // Check for NetworkSidebar
    const networkSidebar = document.querySelector('[class*="NetworkSidebar"], aside, [class*="sidebar"]');
    if (networkSidebar) {
      logTest('1.3-Component', 'NetworkSidebar', 'pass', 'Found in DOM');
      console.log('NetworkSidebar element:', networkSidebar);
    } else {
      logTest('1.3-Component', 'NetworkSidebar', 'warn', 'Not found - click on a paper node');
    }

    // Check for AnnotationList component (Phase 1 specific)
    const annotationList = document.querySelector('[class*="AnnotationList"], [class*="annotation-list"]');
    if (annotationList) {
      logTest('1.3-Component', 'AnnotationList', 'pass', 'Found in DOM');
    } else {
      logTest('1.3-Component', 'AnnotationList', 'warn', 'Not found - may need to scroll in sidebar');
    }

    // Check for "+ New Note" button (Phase 1 specific)
    const newNoteButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
      btn.textContent.includes('New Note') || btn.textContent.includes('Add Note')
    );
    
    if (newNoteButtons.length > 0) {
      logTest('1.3-Component', '"+ New Note" button', 'pass', `Found ${newNoteButtons.length} button(s)`);
      newNoteButtons.forEach((btn, i) => {
        console.log(`Button ${i + 1}:`, btn.textContent.trim(), btn.className);
      });
    } else {
      logTest('1.3-Component', '"+ New Note" button', 'warn', 'Not found');
    }

    // Check for connection indicator
    const connectionIndicator = document.querySelector('[class*="connection"], [class*="indicator"], [class*="dot"]');
    if (connectionIndicator) {
      const bgColor = window.getComputedStyle(connectionIndicator).backgroundColor;
      const isGreen = bgColor.includes('34, 197, 94') || bgColor.includes('0, 255, 0');
      logTest('1.3-Component', 'Connection indicator', isGreen ? 'pass' : 'warn', `Found (${bgColor})`);
    } else {
      logTest('1.3-Component', 'Connection indicator', 'warn', 'Not found');
    }

    // Check for filter/refresh/help icons
    const filterIcon = Array.from(document.querySelectorAll('button, [role="button"]')).find(el => 
      el.getAttribute('aria-label')?.toLowerCase().includes('filter') || 
      el.title?.toLowerCase().includes('filter')
    );
    logTest('1.3-Component', 'Filter icon', filterIcon ? 'pass' : 'warn', filterIcon ? 'Found' : 'Not found');

    const refreshIcon = Array.from(document.querySelectorAll('button, [role="button"]')).find(el => 
      el.getAttribute('aria-label')?.toLowerCase().includes('refresh') || 
      el.title?.toLowerCase().includes('refresh')
    );
    logTest('1.3-Component', 'Refresh icon', refreshIcon ? 'pass' : 'warn', refreshIcon ? 'Found' : 'Not found');

    const helpIcon = Array.from(document.querySelectorAll('button, [role="button"]')).find(el => 
      el.textContent.includes('?') || 
      el.getAttribute('aria-label')?.toLowerCase().includes('help')
    );
    logTest('1.3-Component', 'Help icon (?)', helpIcon ? 'pass' : 'warn', helpIcon ? 'Found' : 'Not found');

  } catch (error) {
    logTest('1.3-Component', 'Frontend UI components', 'fail', error.message);
  }

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================
  console.log('');
  console.log('%c' + '═'.repeat(70), 'color: #ffaa00');
  console.log('%c📊 TEST SUMMARY', 'color: #ffaa00; font-weight: bold; font-size: 16px');
  console.log('%c' + '═'.repeat(70), 'color: #ffaa00');
  console.log('');
  console.log('%c✅ PASSED:', 'color: #00ff00; font-weight: bold', results.passed);
  console.log('%c❌ FAILED:', 'color: #ff0000; font-weight: bold', results.failed);
  console.log('%c⚠️  WARNINGS:', 'color: #ffaa00; font-weight: bold', results.warnings);
  console.log('%cTOTAL TESTS:', 'color: #00aaff; font-weight: bold', results.tests.length);
  console.log('');

  const passRate = ((results.passed / results.tests.length) * 100).toFixed(1);
  console.log('%cPASS RATE:', 'color: #00aaff; font-weight: bold', `${passRate}%`);
  console.log('');

  // Overall verdict
  if (results.failed === 0 && results.warnings === 0) {
    console.log('%c🎉 ALL TESTS PASSED! PHASE 1 IS FULLY FUNCTIONAL!', 'color: #00ff00; font-weight: bold; font-size: 16px; background: #003300; padding: 10px');
  } else if (results.failed === 0) {
    console.log('%c✅ ALL CRITICAL TESTS PASSED! Some warnings to review.', 'color: #ffaa00; font-weight: bold; font-size: 14px');
  } else {
    console.log('%c⚠️  SOME TESTS FAILED. Review failures above.', 'color: #ff0000; font-weight: bold; font-size: 14px');
  }
  console.log('');

  // Instructions
  console.log('%c📋 IMPORTANT:', 'color: #ff0000; font-weight: bold; font-size: 14px');
  console.log('If you see HTTP 403 errors or "NetworkSidebar not found":');
  console.log('1. Make sure you are in NETWORK VIEW (click Network tab)');
  console.log('2. Click on a PAPER NODE (circle) in the network visualization');
  console.log('3. Scroll DOWN in the NetworkSidebar to see the Notes section');
  console.log('4. Then re-run this script');
  console.log('');

  window.phase1TestResultsFixed = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userEmail: userEmail,
    projectId: projectId,
    results: results
  };

  console.log('%c💾 Results saved to: window.phase1TestResultsFixed', 'color: #00ff00; font-weight: bold');

  return results;
})();

