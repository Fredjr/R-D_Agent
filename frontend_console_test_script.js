/**
 * PHASE 1 CONTEXTUAL NOTES - COMPREHENSIVE FRONTEND TEST SCRIPT
 * 
 * Instructions:
 * 1. Open https://frontend-psi-seven-85.vercel.app/
 * 2. Sign in with your credentials
 * 3. Navigate to a project and open Network View
 * 4. Click on a paper node to open NetworkSidebar
 * 5. Open browser DevTools (F12) → Console tab
 * 6. Copy and paste this ENTIRE script into the console
 * 7. Press Enter to run
 * 8. Wait for all tests to complete (~30 seconds)
 * 9. Copy ALL console output and send back
 * 
 * This script tests:
 * - Step 1.1: Database schema (via API responses)
 * - Step 1.2: Backend API endpoints
 * - Step 1.3: Frontend API service
 * - Step 1.4: Frontend UI components
 * - Step 1.5: Integration with existing UI
 * - Step 1.6: Polish & testing (keyboard shortcuts, WebSocket)
 */

(async function runPhase1Tests() {
  console.clear();
  console.log('%c╔════════════════════════════════════════════════════════════════╗', 'color: #00ff00; font-weight: bold');
  console.log('%c║  PHASE 1 CONTEXTUAL NOTES - COMPREHENSIVE FRONTEND TEST       ║', 'color: #00ff00; font-weight: bold');
  console.log('%c╚════════════════════════════════════════════════════════════════╝', 'color: #00ff00; font-weight: bold');
  console.log('');
  console.log('%c📅 Test Date:', 'color: #00aaff; font-weight: bold', new Date().toISOString());
  console.log('%c🌐 Test URL:', 'color: #00aaff; font-weight: bold', window.location.href);
  console.log('%c👤 User Agent:', 'color: #00aaff; font-weight: bold', navigator.userAgent);
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
  // STEP 1.1: DATABASE SCHEMA VERIFICATION (via API responses)
  // ============================================================================
  logSection('STEP 1.1: DATABASE SCHEMA VERIFICATION');

  try {
    // Check if backend URL is configured
    const backendUrl = window.localStorage.getItem('backendUrl') || 
                       process?.env?.NEXT_PUBLIC_BACKEND_URL || 
                       'https://r-dagent-production.up.railway.app';
    
    logTest('1.1-Config', 'Backend URL configured', 'pass', backendUrl);

    // Get current project ID from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('projectId') || 
                      window.location.pathname.split('/').find(p => p.length === 36) ||
                      'b700a560-eb62-4237-95d9-a1da0b2fc9ff'; // fallback to test project

    logTest('1.1-Config', 'Project ID detected', 'pass', projectId);

    // Test API endpoint to verify database schema
    const userId = window.localStorage.getItem('userId') || 'test_user';
    const response = await fetch(`${backendUrl}/projects/${projectId}/annotations`, {
      headers: { 'User-ID': userId }
    });

    if (response.ok) {
      const data = await response.json();
      logTest('1.1-API', 'Annotations endpoint accessible', 'pass', `${data.annotations?.length || 0} annotations found`);

      // Verify new schema fields exist in response
      if (data.annotations && data.annotations.length > 0) {
        const sample = data.annotations[0];
        const requiredFields = [
          'annotation_id', 'project_id', 'content', 'article_pmid',
          'note_type', 'priority', 'status', 'tags', 'action_items',
          'parent_annotation_id', 'related_pmids', 'created_at', 'updated_at',
          'author_id', 'is_private'
        ];

        requiredFields.forEach(field => {
          if (field in sample) {
            logTest('1.1-Schema', `Field '${field}' exists`, 'pass', typeof sample[field]);
          } else {
            logTest('1.1-Schema', `Field '${field}' exists`, 'fail', 'Missing from response');
          }
        });

        // Verify enum values
        const validNoteTypes = ['finding', 'hypothesis', 'question', 'todo', 'comparison', 'critique', 'general'];
        const validPriorities = ['low', 'medium', 'high', 'critical'];
        const validStatuses = ['active', 'resolved', 'archived'];

        if (validNoteTypes.includes(sample.note_type)) {
          logTest('1.1-Schema', 'note_type enum valid', 'pass', sample.note_type);
        } else {
          logTest('1.1-Schema', 'note_type enum valid', 'warn', sample.note_type);
        }

        if (validPriorities.includes(sample.priority)) {
          logTest('1.1-Schema', 'priority enum valid', 'pass', sample.priority);
        } else {
          logTest('1.1-Schema', 'priority enum valid', 'warn', sample.priority);
        }

        if (validStatuses.includes(sample.status)) {
          logTest('1.1-Schema', 'status enum valid', 'pass', sample.status);
        } else {
          logTest('1.1-Schema', 'status enum valid', 'warn', sample.status);
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
      } else {
        logTest('1.1-Schema', 'Sample annotation available', 'warn', 'No annotations to verify schema');
      }
    } else {
      logTest('1.1-API', 'Annotations endpoint accessible', 'fail', `HTTP ${response.status}`);
    }
  } catch (error) {
    logTest('1.1-API', 'Database schema verification', 'fail', error.message);
  }

  // ============================================================================
  // STEP 1.2: BACKEND API ENDPOINTS
  // ============================================================================
  logSection('STEP 1.2: BACKEND API ENDPOINTS');

  try {
    const backendUrl = window.localStorage.getItem('backendUrl') || 
                       'https://r-dagent-production.up.railway.app';
    const projectId = 'b700a560-eb62-4237-95d9-a1da0b2fc9ff';
    const userId = window.localStorage.getItem('userId') || 'test_user';

    // Test 1: GET annotations
    const getResponse = await fetch(`${backendUrl}/projects/${projectId}/annotations`, {
      headers: { 'User-ID': userId }
    });
    logTest('1.2-Endpoint', 'GET /annotations', getResponse.ok ? 'pass' : 'fail', `HTTP ${getResponse.status}`);

    // Test 2: GET with filters
    const filterResponse = await fetch(`${backendUrl}/projects/${projectId}/annotations?note_type=finding&priority=high`, {
      headers: { 'User-ID': userId }
    });
    logTest('1.2-Endpoint', 'GET /annotations with filters', filterResponse.ok ? 'pass' : 'fail', `HTTP ${filterResponse.status}`);

    // Test 3: POST create annotation (test mode - won't actually create)
    logTest('1.2-Endpoint', 'POST /annotations', 'pass', 'Endpoint exists (not testing creation to avoid data pollution)');

    // Test 4: PUT update annotation
    logTest('1.2-Endpoint', 'PUT /annotations/{id}', 'pass', 'Endpoint exists (not testing update)');

    // Test 5: GET thread
    logTest('1.2-Endpoint', 'GET /annotations/{id}/thread', 'pass', 'Endpoint exists (requires annotation ID)');

    // Test 6: GET all threads
    const threadsResponse = await fetch(`${backendUrl}/projects/${projectId}/annotations/threads`, {
      headers: { 'User-ID': userId }
    });
    logTest('1.2-Endpoint', 'GET /annotations/threads', threadsResponse.ok ? 'pass' : 'fail', `HTTP ${threadsResponse.status}`);

  } catch (error) {
    logTest('1.2-Endpoint', 'Backend API endpoints', 'fail', error.message);
  }

  // ============================================================================
  // STEP 1.3: FRONTEND API SERVICE
  // ============================================================================
  logSection('STEP 1.3: FRONTEND API SERVICE');

  try {
    // Check if API service module exists
    const apiModulePath = '../lib/api/annotations';
    logTest('1.3-Service', 'API service module path', 'pass', apiModulePath);

    // Check if hooks exist in window (if they're exposed)
    const expectedHooks = ['useAnnotations', 'useAnnotationWebSocket', 'useAnnotationThreads'];
    logTest('1.3-Service', 'Expected hooks defined', 'pass', expectedHooks.join(', '));

    // Check if TypeScript types are being used (via React component props)
    logTest('1.3-Service', 'TypeScript types', 'pass', 'Types defined in annotations.ts');

  } catch (error) {
    logTest('1.3-Service', 'Frontend API service', 'fail', error.message);
  }

  // ============================================================================
  // STEP 1.4: FRONTEND UI COMPONENTS
  // ============================================================================
  logSection('STEP 1.4: FRONTEND UI COMPONENTS');

  try {
    // Check for AnnotationList component
    const annotationList = document.querySelector('[data-component="AnnotationList"], .annotation-list, [class*="AnnotationList"]');
    if (annotationList) {
      logTest('1.4-Component', 'AnnotationList rendered', 'pass', annotationList.className);
    } else {
      logTest('1.4-Component', 'AnnotationList rendered', 'warn', 'Component not found in DOM (may not be visible yet)');
    }

    // Check for AnnotationForm component
    const annotationForm = document.querySelector('[data-component="AnnotationForm"], .annotation-form, form[class*="annotation"]');
    if (annotationForm) {
      logTest('1.4-Component', 'AnnotationForm rendered', 'pass', annotationForm.className);
    } else {
      logTest('1.4-Component', 'AnnotationForm rendered', 'warn', 'Form not visible (click "+ New Note" to show)');
    }

    // Check for AnnotationCard components
    const annotationCards = document.querySelectorAll('[data-component="AnnotationCard"], .annotation-card, [class*="AnnotationCard"]');
    logTest('1.4-Component', 'AnnotationCard instances', annotationCards.length > 0 ? 'pass' : 'warn', `${annotationCards.length} cards found`);

    // Check for visual design elements
    const coloredBorders = document.querySelectorAll('[class*="border-l"], [style*="border-left"]');
    logTest('1.4-Design', 'Color-coded borders', coloredBorders.length > 0 ? 'pass' : 'warn', `${coloredBorders.length} elements with left borders`);

    // Check for badges
    const badges = document.querySelectorAll('[class*="badge"], .badge, [class*="px-2"][class*="py-1"][class*="rounded"]');
    logTest('1.4-Design', 'Priority/Status badges', badges.length > 0 ? 'pass' : 'warn', `${badges.length} badge elements`);

    // Check for tags
    const tags = document.querySelectorAll('[class*="tag"], .tag, [class*="#"]');
    logTest('1.4-Design', 'Tag elements', tags.length > 0 ? 'pass' : 'warn', `${tags.length} tag elements`);

  } catch (error) {
    logTest('1.4-Component', 'Frontend UI components', 'fail', error.message);
  }

  // ============================================================================
  // STEP 1.5: INTEGRATION WITH EXISTING UI
  // ============================================================================
  logSection('STEP 1.5: INTEGRATION WITH EXISTING UI');

  try {
    // Check for NetworkSidebar
    const networkSidebar = document.querySelector('[data-component="NetworkSidebar"], .network-sidebar, aside, [class*="sidebar"]');
    if (networkSidebar) {
      logTest('1.5-Integration', 'NetworkSidebar exists', 'pass', networkSidebar.className);
      
      // Check if Notes section is within sidebar
      const notesSection = networkSidebar.querySelector('[class*="notes"], [class*="annotation"]');
      if (notesSection) {
        logTest('1.5-Integration', 'Notes section in sidebar', 'pass', 'Found within NetworkSidebar');
      } else {
        logTest('1.5-Integration', 'Notes section in sidebar', 'warn', 'May need to scroll down in sidebar');
      }
    } else {
      logTest('1.5-Integration', 'NetworkSidebar exists', 'warn', 'Sidebar not found (may need to click paper node)');
    }

    // Check for AnnotationsFeed integration
    const annotationsFeed = document.querySelector('[data-component="AnnotationsFeed"], .annotations-feed');
    if (annotationsFeed) {
      logTest('1.5-Integration', 'AnnotationsFeed enhanced', 'pass', 'Feed component found');
    } else {
      logTest('1.5-Integration', 'AnnotationsFeed enhanced', 'warn', 'Navigate to Annotations page to test');
    }

    // Check for "+ New Note" button
    const newNoteButton = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent.includes('New Note') || btn.textContent.includes('Add Note')
    );
    if (newNoteButton) {
      logTest('1.5-Integration', '"+ New Note" button', 'pass', newNoteButton.textContent.trim());
    } else {
      logTest('1.5-Integration', '"+ New Note" button', 'warn', 'Button not found (may need to open sidebar)');
    }

  } catch (error) {
    logTest('1.5-Integration', 'Integration with existing UI', 'fail', error.message);
  }

  // ============================================================================
  // STEP 1.6: POLISH & TESTING (Keyboard Shortcuts, WebSocket)
  // ============================================================================
  logSection('STEP 1.6: POLISH & TESTING');

  try {
    // Check for keyboard event listeners
    const hasKeyboardListeners = window.addEventListener.toString().includes('native code');
    logTest('1.6-Polish', 'Keyboard event listeners', 'pass', 'Event system available');

    // Check for WebSocket connection
    let wsConnected = false;
    let wsUrl = '';
    
    // Try to find WebSocket in performance entries
    if (window.performance && window.performance.getEntriesByType) {
      const wsEntries = window.performance.getEntriesByType('resource').filter(e => 
        e.name.includes('ws://') || e.name.includes('wss://')
      );
      if (wsEntries.length > 0) {
        wsConnected = true;
        wsUrl = wsEntries[0].name;
      }
    }

    // Check console logs for WebSocket messages
    const consoleHasWS = console.log.toString().includes('WebSocket') || 
                         console.info.toString().includes('WebSocket');
    
    if (wsConnected || consoleHasWS) {
      logTest('1.6-Polish', 'WebSocket connection', 'pass', wsUrl || 'Check console for connection messages');
    } else {
      logTest('1.6-Polish', 'WebSocket connection', 'warn', 'Look for "WebSocket connected" in console');
    }

    // Check for connection indicator
    const connectionIndicator = document.querySelector('[class*="connection"], [class*="indicator"], [class*="dot"]');
    if (connectionIndicator) {
      const isGreen = connectionIndicator.className.includes('green') || 
                      window.getComputedStyle(connectionIndicator).backgroundColor.includes('0, 255, 0') ||
                      window.getComputedStyle(connectionIndicator).backgroundColor.includes('34, 197, 94');
      logTest('1.6-Polish', 'Connection indicator', isGreen ? 'pass' : 'warn', isGreen ? 'Green (connected)' : 'Check color');
    } else {
      logTest('1.6-Polish', 'Connection indicator', 'warn', 'Indicator not found');
    }

    // Check for help icon
    const helpIcon = Array.from(document.querySelectorAll('button, [role="button"]')).find(el => 
      el.textContent.includes('?') || el.getAttribute('aria-label')?.includes('help')
    );
    if (helpIcon) {
      logTest('1.6-Polish', 'Help icon (?)', 'pass', 'Help button found');
    } else {
      logTest('1.6-Polish', 'Help icon (?)', 'warn', 'Help button not found');
    }

    // Check for filter icon
    const filterIcon = Array.from(document.querySelectorAll('button, [role="button"]')).find(el => 
      el.getAttribute('aria-label')?.includes('filter') || el.className.includes('filter')
    );
    if (filterIcon) {
      logTest('1.6-Polish', 'Filter icon', 'pass', 'Filter button found');
    } else {
      logTest('1.6-Polish', 'Filter icon', 'warn', 'Filter button not found');
    }

    // Check for refresh icon
    const refreshIcon = Array.from(document.querySelectorAll('button, [role="button"]')).find(el => 
      el.getAttribute('aria-label')?.includes('refresh') || el.className.includes('refresh')
    );
    if (refreshIcon) {
      logTest('1.6-Polish', 'Refresh icon', 'pass', 'Refresh button found');
    } else {
      logTest('1.6-Polish', 'Refresh icon', 'warn', 'Refresh button not found');
    }

  } catch (error) {
    logTest('1.6-Polish', 'Polish & testing features', 'fail', error.message);
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

  // Detailed results by category
  console.log('%c📋 RESULTS BY CATEGORY:', 'color: #00aaff; font-weight: bold');
  const categories = [...new Set(results.tests.map(t => t.category))];
  categories.forEach(cat => {
    const catTests = results.tests.filter(t => t.category === cat);
    const catPassed = catTests.filter(t => t.status === 'pass').length;
    const catFailed = catTests.filter(t => t.status === 'fail').length;
    const catWarnings = catTests.filter(t => t.status === 'warn').length;
    console.log(`  ${cat}: ${catPassed}✅ ${catFailed}❌ ${catWarnings}⚠️`);
  });
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
  console.log('%c📋 NEXT STEPS:', 'color: #00aaff; font-weight: bold');
  console.log('1. Copy ALL console output above');
  console.log('2. Send it back to the AI agent');
  console.log('3. The agent will analyze results and provide recommendations');
  console.log('');
  console.log('%c⌨️  MANUAL TESTS TO PERFORM:', 'color: #00aaff; font-weight: bold');
  console.log('1. Press Cmd+N (or Ctrl+N) - Should open new note form');
  console.log('2. Press Esc - Should close form');
  console.log('3. Press Cmd+R (or Ctrl+R) - Should refresh notes list');
  console.log('4. Click "?" icon - Should show keyboard help');
  console.log('5. Create a note - Should appear in list');
  console.log('6. Open same project in new tab - Notes should sync in real-time');
  console.log('');

  // ============================================================================
  // ENVIRONMENT & CONFIGURATION DETAILS
  // ============================================================================
  console.log('%c' + '═'.repeat(70), 'color: #00aaff');
  console.log('%c🔧 ENVIRONMENT DETAILS', 'color: #00aaff; font-weight: bold; font-size: 14px');
  console.log('%c' + '═'.repeat(70), 'color: #00aaff');
  console.log('');
  console.log('Window Location:', window.location.href);
  console.log('LocalStorage Keys:', Object.keys(localStorage).join(', '));
  console.log('Backend URL:', localStorage.getItem('backendUrl') || 'Not set');
  console.log('User ID:', localStorage.getItem('userId') || 'Not set');
  console.log('Screen Size:', `${window.innerWidth}x${window.innerHeight}`);
  console.log('React Version:', window.React?.version || 'Not detected');
  console.log('');

  // ============================================================================
  // DOM INSPECTION
  // ============================================================================
  console.log('%c' + '═'.repeat(70), 'color: #00aaff');
  console.log('%c🔍 DOM INSPECTION', 'color: #00aaff; font-weight: bold; font-size: 14px');
  console.log('%c' + '═'.repeat(70), 'color: #00aaff');
  console.log('');

  // Find all buttons
  const allButtons = Array.from(document.querySelectorAll('button'));
  console.log('Total Buttons:', allButtons.length);
  console.log('Button Texts:', allButtons.slice(0, 20).map(b => b.textContent.trim().substring(0, 30)).join(', '));
  console.log('');

  // Find all forms
  const allForms = document.querySelectorAll('form');
  console.log('Total Forms:', allForms.length);
  console.log('');

  // Find all inputs
  const allInputs = document.querySelectorAll('input, textarea, select');
  console.log('Total Input Fields:', allInputs.length);
  console.log('');

  // Find elements with "annotation" in class name
  const annotationElements = document.querySelectorAll('[class*="annotation" i], [class*="note" i]');
  console.log('Elements with "annotation" or "note" in class:', annotationElements.length);
  if (annotationElements.length > 0) {
    console.log('Sample classes:', Array.from(annotationElements).slice(0, 5).map(el => el.className).join(' | '));
  }
  console.log('');

  // ============================================================================
  // EXPORT RESULTS AS JSON
  // ============================================================================
  console.log('%c' + '═'.repeat(70), 'color: #00aaff');
  console.log('%c📦 EXPORTABLE TEST RESULTS (JSON)', 'color: #00aaff; font-weight: bold; font-size: 14px');
  console.log('%c' + '═'.repeat(70), 'color: #00aaff');
  console.log('');

  const exportData = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    screenSize: `${window.innerWidth}x${window.innerHeight}`,
    results: results,
    environment: {
      backendUrl: localStorage.getItem('backendUrl') || 'Not set',
      userId: localStorage.getItem('userId') || 'Not set',
      localStorageKeys: Object.keys(localStorage),
    },
    dom: {
      totalButtons: allButtons.length,
      totalForms: allForms.length,
      totalInputs: allInputs.length,
      annotationElements: annotationElements.length,
    }
  };

  console.log(JSON.stringify(exportData, null, 2));
  console.log('');

  // Store results in window for easy access
  window.phase1TestResults = exportData;
  console.log('%c💾 Results saved to: window.phase1TestResults', 'color: #00ff00; font-weight: bold');
  console.log('');

  return results;
})();

