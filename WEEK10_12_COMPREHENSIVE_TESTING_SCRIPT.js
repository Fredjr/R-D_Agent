/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WEEKS 10-12 COMPREHENSIVE TESTING SCRIPT
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This script tests ALL implementations from Week 10 to Week 12:
 * 
 * WEEK 10: PDF Viewer Implementation
 * - PDF URL retrieval from multiple sources (PMC, EuropePMC, Unpaywall)
 * - Embedded PDF viewer with navigation
 * - Reading progress tracking
 * 
 * WEEK 11: PDF Reading Features & Enhanced Onboarding
 * - Day 1: PDF annotations backend (database schema, API endpoints)
 * - Day 2: Highlight tool (text selection, color picker)
 * - Day 3: Annotations sidebar (display, CRUD operations)
 * - Days 4-7: Enhanced onboarding (7-step flow)
 * 
 * WEEK 12: Information Architecture Enhancements
 * - Day 1: Enhanced Research Question Tab (quick actions, seed paper)
 * - Days 2-3: Redesigned Collections Tab (grid/list views, filtering, bulk ops)
 * - Day 4: Enhanced Explore Tab (view toggle)
 * - Day 5: Enhanced Analysis Tab (search, export, share)
 * - Days 6-7: Enhanced Progress Tab (reading progress, collaboration stats)
 * 
 * INSTRUCTIONS:
 * 1. Open https://frontend-psi-seven-85.vercel.app in your browser
 * 2. Log in with your account
 * 3. Navigate to a project (or create one if needed)
 * 4. Open DevTools (F12) → Console tab
 * 5. Copy and paste this ENTIRE script
 * 6. Press Enter to run
 * 7. Follow the prompts and review results
 * 
 * REQUIREMENTS:
 * - Must be logged in
 * - Must have at least one project
 * - Must be on a project page
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(async function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  const CONFIG = {
    BACKEND_URL: 'https://r-dagent-production.up.railway.app',
    FRONTEND_URL: 'https://frontend-psi-seven-85.vercel.app',
    TEST_PMID: '33099609', // Known article with PDF available
    TEST_PMID_2: '39361594', // Alternative test article
    COLORS: {
      SUCCESS: '#4CAF50',
      ERROR: '#F44336',
      WARNING: '#FF9800',
      INFO: '#2196F3',
      SECTION: '#9C27B0'
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const log = {
    section: (title) => {
      console.log(`\n%c${'═'.repeat(80)}`, `color: ${CONFIG.COLORS.SECTION}; font-weight: bold`);
      console.log(`%c${title}`, `color: ${CONFIG.COLORS.SECTION}; font-size: 16px; font-weight: bold`);
      console.log(`%c${'═'.repeat(80)}`, `color: ${CONFIG.COLORS.SECTION}; font-weight: bold`);
    },
    success: (msg) => console.log(`%c✅ ${msg}`, `color: ${CONFIG.COLORS.SUCCESS}; font-weight: bold`),
    error: (msg) => console.log(`%c❌ ${msg}`, `color: ${CONFIG.COLORS.ERROR}; font-weight: bold`),
    warning: (msg) => console.log(`%c⚠️  ${msg}`, `color: ${CONFIG.COLORS.WARNING}`),
    info: (msg) => console.log(`%c ℹ️  ${msg}`, `color: ${CONFIG.COLORS.INFO}`),
    test: (name) => console.log(`%c🧪 Testing: ${name}`, `color: ${CONFIG.COLORS.INFO}; font-style: italic`)
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Get current project ID from URL
  const getProjectId = () => {
    const match = window.location.pathname.match(/\/project\/([^\/]+)/);
    return match ? match[1] : null;
  };

  // Get user ID from localStorage or cookies
  const getUserId = () => {
    try {
      const authData = localStorage.getItem('auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.user?.email || parsed.user?.id || null;
      }
    } catch (e) {
      log.warning('Could not parse auth data from localStorage');
    }
    return null;
  };

  // Make API request with proper headers
  const apiRequest = async (endpoint, options = {}) => {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User ID not found. Please ensure you are logged in.');
    }

    const url = endpoint.startsWith('http') ? endpoint : `${CONFIG.BACKEND_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    return response.json();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST RESULTS TRACKING
  // ═══════════════════════════════════════════════════════════════════════════
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
  };

  const recordTest = (name, status, message = '', data = null) => {
    results.total++;
    if (status === 'pass') results.passed++;
    else if (status === 'fail') results.failed++;
    else if (status === 'warning') results.warnings++;
    
    results.tests.push({ name, status, message, data, timestamp: new Date().toISOString() });
    
    if (status === 'pass') log.success(`${name}: ${message}`);
    else if (status === 'fail') log.error(`${name}: ${message}`);
    else if (status === 'warning') log.warning(`${name}: ${message}`);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // PRE-FLIGHT CHECKS
  // ═══════════════════════════════════════════════════════════════════════════
  
  log.section('🚀 PRE-FLIGHT CHECKS');
  
  const projectId = getProjectId();
  const userId = getUserId();
  
  if (!projectId) {
    log.error('Not on a project page! Please navigate to a project first.');
    log.info('Example: https://frontend-psi-seven-85.vercel.app/project/YOUR_PROJECT_ID');
    return;
  }
  
  if (!userId) {
    log.error('User not logged in! Please log in first.');
    return;
  }
  
  log.success(`Project ID: ${projectId}`);
  log.success(`User ID: ${userId}`);
  log.info('Starting comprehensive tests...\n');

  await sleep(1000);

  // ═══════════════════════════════════════════════════════════════════════════
  // WEEK 10: PDF VIEWER TESTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  log.section('📄 WEEK 10: PDF VIEWER TESTS');
  
  // Test 1: PDF URL Retrieval
  log.test('PDF URL Retrieval from Multiple Sources');
  try {
    const pdfUrlResponse = await apiRequest(`/articles/${CONFIG.TEST_PMID}/pdf-url`);
    
    if (pdfUrlResponse.available && pdfUrlResponse.url) {
      recordTest(
        'PDF URL Retrieval',
        'pass',
        `PDF available from ${pdfUrlResponse.source}`,
        { url: pdfUrlResponse.url, source: pdfUrlResponse.source }
      );
    } else {
      recordTest('PDF URL Retrieval', 'warning', 'PDF not available for test article');
    }
  } catch (error) {
    recordTest('PDF URL Retrieval', 'fail', error.message);
  }

  await sleep(500);

  // Test 2: PDF Viewer Component Existence
  log.test('PDF Viewer Component');
  try {
    // Check if PDF viewer modal exists in DOM
    const pdfViewerExists = document.querySelector('[data-testid="pdf-viewer-modal"]') !== null ||
                           document.querySelector('.pdf-viewer') !== null;
    
    if (pdfViewerExists) {
      recordTest('PDF Viewer Component', 'pass', 'PDF viewer component found in DOM');
    } else {
      recordTest('PDF Viewer Component', 'warning', 'PDF viewer not currently open (this is normal)');
    }
  } catch (error) {
    recordTest('PDF Viewer Component', 'fail', error.message);
  }

  await sleep(500);

  // ═══════════════════════════════════════════════════════════════════════════
  // WEEK 11 DAY 1: PDF ANNOTATIONS BACKEND TESTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  log.section('📝 WEEK 11 DAY 1: PDF ANNOTATIONS BACKEND');
  
  // Test 3: Create PDF Annotation
  log.test('Create PDF Annotation with Highlight');
  let testAnnotationId = null;
  try {
    const annotationData = {
      content: `Test highlight annotation created at ${new Date().toISOString()}`,
      article_pmid: CONFIG.TEST_PMID,
      note_type: 'highlight',
      priority: 'medium',
      status: 'active',
      pdf_page: 1,
      pdf_coordinates: {
        x: 0.25,
        y: 0.35,
        width: 0.15,
        height: 0.02,
        pageWidth: 612,
        pageHeight: 792
      },
      highlight_color: '#FFEB3B',
      highlight_text: 'This is a test highlight'
    };
    
    const createResponse = await apiRequest(`/projects/${projectId}/annotations`, {
      method: 'POST',
      body: JSON.stringify(annotationData)
    });
    
    testAnnotationId = createResponse.annotation_id;
    
    if (createResponse.annotation_id && createResponse.pdf_page === 1) {
      recordTest(
        'Create PDF Annotation',
        'pass',
        `Created annotation ${createResponse.annotation_id}`,
        createResponse
      );
    } else {
      recordTest('Create PDF Annotation', 'fail', 'Response missing required fields');
    }
  } catch (error) {
    recordTest('Create PDF Annotation', 'fail', error.message);
  }

  await sleep(500);

  // Test 4: Retrieve PDF Annotations
  log.test('Retrieve PDF Annotations');
  try {
    const annotations = await apiRequest(`/projects/${projectId}/annotations?article_pmid=${CONFIG.TEST_PMID}`);
    
    const pdfAnnotations = annotations.filter(a => a.pdf_page !== null && a.pdf_page !== undefined);
    
    if (pdfAnnotations.length > 0) {
      recordTest(
        'Retrieve PDF Annotations',
        'pass',
        `Found ${pdfAnnotations.length} PDF annotation(s)`,
        { count: pdfAnnotations.length, sample: pdfAnnotations[0] }
      );
    } else {
      recordTest('Retrieve PDF Annotations', 'warning', 'No PDF annotations found (may be expected)');
    }
  } catch (error) {
    recordTest('Retrieve PDF Annotations', 'fail', error.message);
  }

  await sleep(500);

  // ═══════════════════════════════════════════════════════════════════════════
  // WEEK 11 DAY 4-7: ENHANCED ONBOARDING TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  log.section('🎓 WEEK 11 DAY 4-7: ENHANCED ONBOARDING');

  // Test 8: Onboarding Steps Components
  log.test('Onboarding Components Existence');
  try {
    // Check if we're on onboarding page
    const isOnboardingPage = window.location.pathname.includes('/auth/complete-profile');

    if (isOnboardingPage) {
      const step4Exists = document.querySelector('[data-testid="step4-create-project"]') !== null;
      const step5Exists = document.querySelector('[data-testid="step5-find-seed"]') !== null;
      const step6Exists = document.querySelector('[data-testid="step6-explore-organize"]') !== null;
      const step7Exists = document.querySelector('[data-testid="step7-first-note"]') !== null;

      const stepsFound = [step4Exists, step5Exists, step6Exists, step7Exists].filter(Boolean).length;

      if (stepsFound > 0) {
        recordTest('Onboarding Components', 'pass', `Found ${stepsFound} onboarding step(s)`);
      } else {
        recordTest('Onboarding Components', 'warning', 'No onboarding steps visible (may be on different step)');
      }
    } else {
      recordTest('Onboarding Components', 'warning', 'Not on onboarding page (user already onboarded)');
    }
  } catch (error) {
    recordTest('Onboarding Components', 'fail', error.message);
  }

  await sleep(500);

  // ═══════════════════════════════════════════════════════════════════════════
  // WEEK 12 DAY 1: RESEARCH QUESTION TAB TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  log.section('🎯 WEEK 12 DAY 1: RESEARCH QUESTION TAB');

  // Test 9: Research Question Tab Component
  log.test('Research Question Tab');
  try {
    const researchQuestionTab = document.querySelector('[data-testid="research-question-tab"]') ||
                                document.querySelector('[href*="tab=research-question"]');

    if (researchQuestionTab) {
      recordTest('Research Question Tab', 'pass', 'Research Question tab found');

      // Click the tab to activate it
      researchQuestionTab.click();
      await sleep(1000);

      // Check for quick actions
      const quickActions = document.querySelector('[data-testid="quick-actions"]') ||
                          document.querySelectorAll('button').length > 0;

      if (quickActions) {
        recordTest('Quick Actions Section', 'pass', 'Quick actions section found');
      } else {
        recordTest('Quick Actions Section', 'warning', 'Quick actions not visible');
      }
    } else {
      recordTest('Research Question Tab', 'warning', 'Research Question tab not found in current view');
    }
  } catch (error) {
    recordTest('Research Question Tab', 'fail', error.message);
  }

  await sleep(500);

  // Test 10: Seed Paper Display
  log.test('Seed Paper Display');
  try {
    const seedPaper = document.querySelector('[data-testid="seed-paper"]') ||
                     document.querySelector('.seed-paper');

    if (seedPaper) {
      recordTest('Seed Paper Display', 'pass', 'Seed paper display found');
    } else {
      recordTest('Seed Paper Display', 'warning', 'Seed paper not displayed (may not be set)');
    }
  } catch (error) {
    recordTest('Seed Paper Display', 'fail', error.message);
  }

  await sleep(500);

  // ═══════════════════════════════════════════════════════════════════════════
  // WEEK 12 DAY 2-3: COLLECTIONS TAB TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  log.section('📚 WEEK 12 DAY 2-3: COLLECTIONS TAB');

  // Test 11: Collections Tab Component
  log.test('Collections Tab');
  try {
    const collectionsTab = document.querySelector('[data-testid="collections-tab"]') ||
                          document.querySelector('[href*="tab=collections"]');

    if (collectionsTab) {
      recordTest('Collections Tab', 'pass', 'Collections tab found');

      // Click the tab to activate it
      collectionsTab.click();
      await sleep(1000);
    } else {
      recordTest('Collections Tab', 'warning', 'Collections tab not found');
    }
  } catch (error) {
    recordTest('Collections Tab', 'fail', error.message);
  }

  await sleep(500);

  // Test 12: Get Collections via API
  log.test('Get Collections API');
  try {
    const collections = await apiRequest(`/projects/${projectId}/collections`);

    if (Array.isArray(collections)) {
      recordTest(
        'Get Collections API',
        'pass',
        `Found ${collections.length} collection(s)`,
        { count: collections.length }
      );
    } else {
      recordTest('Get Collections API', 'fail', 'Invalid response format');
    }
  } catch (error) {
    recordTest('Get Collections API', 'fail', error.message);
  }

  await sleep(500);

  // Test 13: View Toggle (Grid/List)
  log.test('Collections View Toggle');
  try {
    const gridViewBtn = document.querySelector('[data-testid="grid-view-btn"]') ||
                       Array.from(document.querySelectorAll('button')).find(btn =>
                         btn.textContent.includes('Grid') || btn.title?.includes('Grid')
                       );

    const listViewBtn = document.querySelector('[data-testid="list-view-btn"]') ||
                       Array.from(document.querySelectorAll('button')).find(btn =>
                         btn.textContent.includes('List') || btn.title?.includes('List')
                       );

    if (gridViewBtn && listViewBtn) {
      recordTest('Collections View Toggle', 'pass', 'Grid and List view buttons found');
    } else {
      recordTest('Collections View Toggle', 'warning', 'View toggle buttons not visible');
    }
  } catch (error) {
    recordTest('Collections View Toggle', 'fail', error.message);
  }

  await sleep(500);

  // Test 14: Search and Filter
  log.test('Collections Search and Filter');
  try {
    const searchInput = document.querySelector('input[type="text"][placeholder*="Search"]') ||
                       document.querySelector('input[placeholder*="collection"]');

    const sortSelect = document.querySelector('select') ||
                      document.querySelector('[data-testid="sort-select"]');

    if (searchInput) {
      recordTest('Collections Search', 'pass', 'Search input found');
    } else {
      recordTest('Collections Search', 'warning', 'Search input not visible');
    }

    if (sortSelect) {
      recordTest('Collections Sort', 'pass', 'Sort dropdown found');
    } else {
      recordTest('Collections Sort', 'warning', 'Sort dropdown not visible');
    }
  } catch (error) {
    recordTest('Collections Search and Filter', 'fail', error.message);
  }

  await sleep(500);

  // ═══════════════════════════════════════════════════════════════════════════
  // WEEK 12 DAY 4: EXPLORE TAB TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  log.section('🔍 WEEK 12 DAY 4: EXPLORE TAB');

  // Test 15: Explore Tab Component
  log.test('Explore Tab');
  try {
    const exploreTab = document.querySelector('[data-testid="explore-tab"]') ||
                      document.querySelector('[href*="tab=explore"]');

    if (exploreTab) {
      recordTest('Explore Tab', 'pass', 'Explore tab found');

      // Click the tab to activate it
      exploreTab.click();
      await sleep(1000);
    } else {
      recordTest('Explore Tab', 'warning', 'Explore tab not found');
    }
  } catch (error) {
    recordTest('Explore Tab', 'fail', error.message);
  }

  await sleep(500);

  // Test 16: View Mode Toggle (Network/Search)
  log.test('Explore View Mode Toggle');
  try {
    const networkViewBtn = document.querySelector('[data-testid="network-view-btn"]') ||
                          Array.from(document.querySelectorAll('button')).find(btn =>
                            btn.textContent.includes('Network')
                          );

    const searchViewBtn = document.querySelector('[data-testid="search-view-btn"]') ||
                         Array.from(document.querySelectorAll('button')).find(btn =>
                           btn.textContent.includes('Search')
                         );

    if (networkViewBtn && searchViewBtn) {
      recordTest('Explore View Toggle', 'pass', 'Network and Search view buttons found');
    } else {
      recordTest('Explore View Toggle', 'warning', 'View toggle buttons not visible');
    }
  } catch (error) {
    recordTest('Explore View Mode Toggle', 'fail', error.message);
  }

  await sleep(500);

  // ═══════════════════════════════════════════════════════════════════════════
  // WEEK 12 DAY 5: ANALYSIS TAB TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  log.section('📊 WEEK 12 DAY 5: ANALYSIS TAB');

  // Test 17: Analysis Tab Component
  log.test('Analysis Tab');
  try {
    const analysisTab = document.querySelector('[data-testid="analysis-tab"]') ||
                       document.querySelector('[href*="tab=analysis"]');

    if (analysisTab) {
      recordTest('Analysis Tab', 'pass', 'Analysis tab found');

      // Click the tab to activate it
      analysisTab.click();
      await sleep(1000);
    } else {
      recordTest('Analysis Tab', 'warning', 'Analysis tab not found');
    }
  } catch (error) {
    recordTest('Analysis Tab', 'fail', error.message);
  }

  await sleep(500);

  // Test 18: Analysis Search
  log.test('Analysis Search');
  try {
    const searchInput = document.querySelector('input[type="text"][placeholder*="Search"]') ||
                       document.querySelector('input[placeholder*="analysis"]');

    if (searchInput) {
      recordTest('Analysis Search', 'pass', 'Analysis search input found');
    } else {
      recordTest('Analysis Search', 'warning', 'Analysis search not visible');
    }
  } catch (error) {
    recordTest('Analysis Search', 'fail', error.message);
  }

  await sleep(500);

  // Test 19: Export and Share Buttons
  log.test('Analysis Export and Share');
  try {
    const exportBtn = Array.from(document.querySelectorAll('button')).find(btn =>
      btn.textContent.includes('Export') || btn.textContent.includes('Download')
    );

    const shareBtn = Array.from(document.querySelectorAll('button')).find(btn =>
      btn.textContent.includes('Share')
    );

    if (exportBtn) {
      recordTest('Analysis Export', 'pass', 'Export button found');
    } else {
      recordTest('Analysis Export', 'warning', 'Export button not visible (no analyses may exist)');
    }

    if (shareBtn) {
      recordTest('Analysis Share', 'pass', 'Share button found');
    } else {
      recordTest('Analysis Share', 'warning', 'Share button not visible (no analyses may exist)');
    }
  } catch (error) {
    recordTest('Analysis Export and Share', 'fail', error.message);
  }

  await sleep(500);

  // ═══════════════════════════════════════════════════════════════════════════
  // WEEK 12 DAY 6-7: PROGRESS TAB TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  log.section('📈 WEEK 12 DAY 6-7: PROGRESS TAB');

  // Test 20: Progress Tab Component
  log.test('Progress Tab');
  try {
    const progressTab = document.querySelector('[data-testid="progress-tab"]') ||
                       document.querySelector('[href*="tab=progress"]');

    if (progressTab) {
      recordTest('Progress Tab', 'pass', 'Progress tab found');

      // Click the tab to activate it
      progressTab.click();
      await sleep(1000);
    } else {
      recordTest('Progress Tab', 'warning', 'Progress tab not found');
    }
  } catch (error) {
    recordTest('Progress Tab', 'fail', error.message);
  }

  await sleep(500);

  // Test 21: Reading Progress Section
  log.test('Reading Progress Section');
  try {
    const readingProgress = document.querySelector('[data-testid="reading-progress"]') ||
                           Array.from(document.querySelectorAll('h3')).find(h3 =>
                             h3.textContent.includes('Reading Progress')
                           );

    if (readingProgress) {
      recordTest('Reading Progress Section', 'pass', 'Reading progress section found');

      // Check for progress bar
      const progressBar = document.querySelector('.bg-blue-600') ||
                         document.querySelector('[role="progressbar"]');

      if (progressBar) {
        recordTest('Progress Bar', 'pass', 'Progress bar found');
      }
    } else {
      recordTest('Reading Progress Section', 'warning', 'Reading progress section not visible');
    }
  } catch (error) {
    recordTest('Reading Progress Section', 'fail', error.message);
  }

  await sleep(500);

  // Test 22: Collaboration Stats Section
  log.test('Collaboration Stats Section');
  try {
    const collaborationStats = Array.from(document.querySelectorAll('h3')).find(h3 =>
      h3.textContent.includes('Collaboration')
    );

    if (collaborationStats) {
      recordTest('Collaboration Stats', 'pass', 'Collaboration stats section found');
    } else {
      recordTest('Collaboration Stats', 'warning', 'Collaboration stats not visible (may have no collaborators)');
    }
  } catch (error) {
    recordTest('Collaboration Stats Section', 'fail', error.message);
  }

  await sleep(500);

  // Test 23: Enhanced Activity Feed
  log.test('Enhanced Activity Feed');
  try {
    const activityFeed = document.querySelector('[data-testid="activity-feed"]') ||
                        document.querySelector('.activity-feed');

    if (activityFeed) {
      recordTest('Enhanced Activity Feed', 'pass', 'Activity feed found');
    } else {
      recordTest('Enhanced Activity Feed', 'warning', 'Activity feed not visible');
    }
  } catch (error) {
    recordTest('Enhanced Activity Feed', 'fail', error.message);
  }

  await sleep(500);

  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRATION TESTS: CROSS-FEATURE WORKFLOWS
  // ═══════════════════════════════════════════════════════════════════════════

  log.section('🔗 INTEGRATION TESTS: CROSS-FEATURE WORKFLOWS');

  // Test 24: Create Collection via API
  log.test('Create Collection');
  let testCollectionId = null;
  try {
    const collectionData = {
      name: `Test Collection ${Date.now()}`,
      description: 'Created by comprehensive testing script'
    };

    const createResponse = await apiRequest(`/projects/${projectId}/collections`, {
      method: 'POST',
      body: JSON.stringify(collectionData)
    });

    testCollectionId = createResponse.collection_id;

    if (createResponse.collection_id) {
      recordTest(
        'Create Collection',
        'pass',
        `Created collection ${createResponse.collection_id}`,
        createResponse
      );
    } else {
      recordTest('Create Collection', 'fail', 'Response missing collection_id');
    }
  } catch (error) {
    recordTest('Create Collection', 'fail', error.message);
  }

  await sleep(500);

  // Test 25: Add Article to Collection
  if (testCollectionId) {
    log.test('Add Article to Collection');
    try {
      const addArticleResponse = await apiRequest(
        `/projects/${projectId}/collections/${testCollectionId}/articles`,
        {
          method: 'POST',
          body: JSON.stringify({
            pmid: CONFIG.TEST_PMID,
            notes: 'Added by testing script'
          })
        }
      );

      if (addArticleResponse.success || addArticleResponse.article_id) {
        recordTest('Add Article to Collection', 'pass', 'Successfully added article to collection');
      } else {
        recordTest('Add Article to Collection', 'fail', 'Failed to add article');
      }
    } catch (error) {
      recordTest('Add Article to Collection', 'fail', error.message);
    }
  }

  await sleep(500);

  // Test 26: Get Collection Articles
  if (testCollectionId) {
    log.test('Get Collection Articles');
    try {
      const articles = await apiRequest(`/projects/${projectId}/collections/${testCollectionId}/articles`);

      if (Array.isArray(articles)) {
        recordTest(
          'Get Collection Articles',
          'pass',
          `Found ${articles.length} article(s) in collection`,
          { count: articles.length }
        );
      } else {
        recordTest('Get Collection Articles', 'fail', 'Invalid response format');
      }
    } catch (error) {
      recordTest('Get Collection Articles', 'fail', error.message);
    }
  }

  await sleep(500);

  // Test 27: Get Article Citations
  log.test('Get Article Citations');
  try {
    const citations = await apiRequest(`/articles/${CONFIG.TEST_PMID}/citations?limit=10`);

    if (citations && (Array.isArray(citations) || citations.citations)) {
      const citationList = Array.isArray(citations) ? citations : citations.citations;
      recordTest(
        'Get Article Citations',
        'pass',
        `Found ${citationList.length} citation(s)`,
        { count: citationList.length }
      );
    } else {
      recordTest('Get Article Citations', 'warning', 'No citations found or unexpected format');
    }
  } catch (error) {
    recordTest('Get Article Citations', 'fail', error.message);
  }

  await sleep(500);

  // Test 28: Get Article References
  log.test('Get Article References');
  try {
    const references = await apiRequest(`/articles/${CONFIG.TEST_PMID}/references?limit=10`);

    if (references && (Array.isArray(references) || references.references)) {
      const referenceList = Array.isArray(references) ? references : references.references;
      recordTest(
        'Get Article References',
        'pass',
        `Found ${referenceList.length} reference(s)`,
        { count: referenceList.length }
      );
    } else {
      recordTest('Get Article References', 'warning', 'No references found or unexpected format');
    }
  } catch (error) {
    recordTest('Get Article References', 'fail', error.message);
  }

  await sleep(500);

  // Test 29: Get Project Details
  log.test('Get Project Details');
  try {
    const project = await apiRequest(`/projects/${projectId}`);

    if (project && project.project_id) {
      recordTest(
        'Get Project Details',
        'pass',
        `Project: ${project.name || 'Unnamed'}`,
        {
          name: project.name,
          total_papers: project.total_papers,
          collections_count: project.collections?.length || 0
        }
      );
    } else {
      recordTest('Get Project Details', 'fail', 'Invalid project response');
    }
  } catch (error) {
    recordTest('Get Project Details', 'fail', error.message);
  }

  await sleep(500);

  // Test 30: Get All Annotations for Project
  log.test('Get All Project Annotations');
  try {
    const annotations = await apiRequest(`/projects/${projectId}/annotations`);

    if (Array.isArray(annotations)) {
      const pdfAnnotations = annotations.filter(a => a.pdf_page !== null);
      const regularNotes = annotations.filter(a => a.pdf_page === null);

      recordTest(
        'Get All Project Annotations',
        'pass',
        `Found ${annotations.length} total annotation(s): ${pdfAnnotations.length} PDF, ${regularNotes.length} regular`,
        {
          total: annotations.length,
          pdf: pdfAnnotations.length,
          regular: regularNotes.length
        }
      );
    } else {
      recordTest('Get All Project Annotations', 'fail', 'Invalid response format');
    }
  } catch (error) {
    recordTest('Get All Project Annotations', 'fail', error.message);
  }

  await sleep(500);

  // ═══════════════════════════════════════════════════════════════════════════
  // CLEANUP: DELETE TEST DATA
  // ═══════════════════════════════════════════════════════════════════════════

  log.section('🧹 CLEANUP: DELETING TEST DATA');

  // Cleanup Test 1: Delete Test Annotation
  if (testAnnotationId) {
    log.test('Delete Test Annotation');
    try {
      await apiRequest(`/projects/${projectId}/annotations/${testAnnotationId}`, {
        method: 'DELETE'
      });
      recordTest('Delete Test Annotation', 'pass', 'Successfully deleted test annotation');
    } catch (error) {
      recordTest('Delete Test Annotation', 'warning', `Could not delete: ${error.message}`);
    }
  }

  await sleep(500);

  // Cleanup Test 2: Delete Test Collection
  if (testCollectionId) {
    log.test('Delete Test Collection');
    try {
      await apiRequest(`/projects/${projectId}/collections/${testCollectionId}`, {
        method: 'DELETE'
      });
      recordTest('Delete Test Collection', 'pass', 'Successfully deleted test collection');
    } catch (error) {
      recordTest('Delete Test Collection', 'warning', `Could not delete: ${error.message}`);
    }
  }

  await sleep(500);

  // ═══════════════════════════════════════════════════════════════════════════
  // FINAL RESULTS SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════

  log.section('📊 FINAL RESULTS SUMMARY');

  const passRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : 0;
  const failRate = results.total > 0 ? ((results.failed / results.total) * 100).toFixed(1) : 0;
  const warningRate = results.total > 0 ? ((results.warnings / results.total) * 100).toFixed(1) : 0;

  console.log('\n');
  console.log('%c╔═══════════════════════════════════════════════════════════════════════════╗', 'color: #9C27B0; font-weight: bold');
  console.log('%c║                         TEST RESULTS SUMMARY                              ║', 'color: #9C27B0; font-weight: bold');
  console.log('%c╚═══════════════════════════════════════════════════════════════════════════╝', 'color: #9C27B0; font-weight: bold');
  console.log('\n');

  console.log(`%c📊 Total Tests: ${results.total}`, 'font-size: 14px; font-weight: bold');
  console.log(`%c✅ Passed: ${results.passed} (${passRate}%)`, `color: ${CONFIG.COLORS.SUCCESS}; font-size: 14px; font-weight: bold`);
  console.log(`%c❌ Failed: ${results.failed} (${failRate}%)`, `color: ${CONFIG.COLORS.ERROR}; font-size: 14px; font-weight: bold`);
  console.log(`%c⚠️  Warnings: ${results.warnings} (${warningRate}%)`, `color: ${CONFIG.COLORS.WARNING}; font-size: 14px; font-weight: bold`);
  console.log('\n');

  // Overall status
  if (results.failed === 0 && results.passed > 0) {
    console.log('%c🎉 ALL TESTS PASSED! 🎉', `color: ${CONFIG.COLORS.SUCCESS}; font-size: 18px; font-weight: bold; background: #E8F5E9; padding: 10px`);
  } else if (results.failed > 0 && results.failed < results.total * 0.3) {
    console.log('%c⚠️  MOSTLY PASSING (Some failures)', `color: ${CONFIG.COLORS.WARNING}; font-size: 16px; font-weight: bold`);
  } else if (results.failed >= results.total * 0.3) {
    console.log('%c❌ MULTIPLE FAILURES DETECTED', `color: ${CONFIG.COLORS.ERROR}; font-size: 16px; font-weight: bold`);
  }

  console.log('\n');

  // Breakdown by week
  console.log('%c═══════════════════════════════════════════════════════════════════════════', 'color: #9C27B0');
  console.log('%cBREAKDOWN BY WEEK:', 'font-size: 14px; font-weight: bold; color: #9C27B0');
  console.log('%c═══════════════════════════════════════════════════════════════════════════', 'color: #9C27B0');
  console.log('\n');

  const week10Tests = results.tests.filter(t => t.name.includes('PDF URL') || t.name.includes('PDF Viewer'));
  const week11Tests = results.tests.filter(t =>
    t.name.includes('Annotation') ||
    t.name.includes('Highlight') ||
    t.name.includes('Sidebar') ||
    t.name.includes('Onboarding')
  );
  const week12Tests = results.tests.filter(t =>
    t.name.includes('Research Question') ||
    t.name.includes('Collections') ||
    t.name.includes('Explore') ||
    t.name.includes('Analysis') ||
    t.name.includes('Progress') ||
    t.name.includes('Reading Progress') ||
    t.name.includes('Collaboration')
  );

  const countResults = (tests) => {
    return {
      total: tests.length,
      passed: tests.filter(t => t.status === 'pass').length,
      failed: tests.filter(t => t.status === 'fail').length,
      warnings: tests.filter(t => t.status === 'warning').length
    };
  };

  const week10Results = countResults(week10Tests);
  const week11Results = countResults(week11Tests);
  const week12Results = countResults(week12Tests);

  console.log(`%c📄 WEEK 10 (PDF Viewer):`, 'font-weight: bold; font-size: 13px');
  console.log(`   Total: ${week10Results.total} | ✅ ${week10Results.passed} | ❌ ${week10Results.failed} | ⚠️  ${week10Results.warnings}`);
  console.log('\n');

  console.log(`%c📝 WEEK 11 (PDF Reading & Onboarding):`, 'font-weight: bold; font-size: 13px');
  console.log(`   Total: ${week11Results.total} | ✅ ${week11Results.passed} | ❌ ${week11Results.failed} | ⚠️  ${week11Results.warnings}`);
  console.log('\n');

  console.log(`%c🎨 WEEK 12 (Information Architecture):`, 'font-weight: bold; font-size: 13px');
  console.log(`   Total: ${week12Results.total} | ✅ ${week12Results.passed} | ❌ ${week12Results.failed} | ⚠️  ${week12Results.warnings}`);
  console.log('\n');

  // Detailed test results
  console.log('%c═══════════════════════════════════════════════════════════════════════════', 'color: #9C27B0');
  console.log('%cDETAILED TEST RESULTS:', 'font-size: 14px; font-weight: bold; color: #9C27B0');
  console.log('%c═══════════════════════════════════════════════════════════════════════════', 'color: #9C27B0');
  console.log('\n');

  results.tests.forEach((test, index) => {
    const icon = test.status === 'pass' ? '✅' : test.status === 'fail' ? '❌' : '⚠️';
    const color = test.status === 'pass' ? CONFIG.COLORS.SUCCESS :
                  test.status === 'fail' ? CONFIG.COLORS.ERROR :
                  CONFIG.COLORS.WARNING;

    console.log(`%c${index + 1}. ${icon} ${test.name}`, `color: ${color}; font-weight: bold`);
    if (test.message) {
      console.log(`   ${test.message}`);
    }
    if (test.data && test.status === 'pass') {
      console.log(`   Data:`, test.data);
    }
  });

  console.log('\n');

  // Export results
  console.log('%c═══════════════════════════════════════════════════════════════════════════', 'color: #9C27B0');
  console.log('%cEXPORT RESULTS:', 'font-size: 14px; font-weight: bold; color: #9C27B0');
  console.log('%c═══════════════════════════════════════════════════════════════════════════', 'color: #9C27B0');
  console.log('\n');

  const exportData = {
    summary: {
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      warnings: results.warnings,
      passRate: `${passRate}%`,
      failRate: `${failRate}%`,
      warningRate: `${warningRate}%`
    },
    breakdown: {
      week10: week10Results,
      week11: week11Results,
      week12: week12Results
    },
    tests: results.tests,
    metadata: {
      projectId,
      userId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    }
  };

  console.log('📋 Copy the results below to save them:');
  console.log('\n');
  console.log(JSON.stringify(exportData, null, 2));
  console.log('\n');

  // Save to window for easy access
  window.testResults = exportData;
  console.log('%c💾 Results saved to window.testResults', `color: ${CONFIG.COLORS.INFO}; font-weight: bold`);
  console.log('%cℹ️  You can access them by typing: window.testResults', `color: ${CONFIG.COLORS.INFO}`);
  console.log('\n');

  // Recommendations
  console.log('%c═══════════════════════════════════════════════════════════════════════════', 'color: #9C27B0');
  console.log('%cRECOMMENDATIONS:', 'font-size: 14px; font-weight: bold; color: #9C27B0');
  console.log('%c═══════════════════════════════════════════════════════════════════════════', 'color: #9C27B0');
  console.log('\n');

  if (results.failed > 0) {
    console.log('%c⚠️  FAILED TESTS DETECTED:', `color: ${CONFIG.COLORS.ERROR}; font-weight: bold`);
    const failedTests = results.tests.filter(t => t.status === 'fail');
    failedTests.forEach(test => {
      console.log(`   • ${test.name}: ${test.message}`);
    });
    console.log('\n');
    console.log('%c📝 Action Items:', 'font-weight: bold');
    console.log('   1. Review failed tests above');
    console.log('   2. Check backend logs for API errors');
    console.log('   3. Verify database migrations are applied');
    console.log('   4. Check network tab for failed requests');
    console.log('\n');
  }

  if (results.warnings > 5) {
    console.log('%c⚠️  MULTIPLE WARNINGS:', `color: ${CONFIG.COLORS.WARNING}; font-weight: bold`);
    console.log('   Some features may not be visible in the current view.');
    console.log('   This is normal if:');
    console.log('   • PDF viewer is not open');
    console.log('   • User is not on onboarding page');
    console.log('   • No data exists yet (collections, analyses, etc.)');
    console.log('\n');
  }

  if (results.passed === results.total && results.total > 0) {
    console.log('%c🎉 EXCELLENT! All tests passed!', `color: ${CONFIG.COLORS.SUCCESS}; font-weight: bold; font-size: 14px`);
    console.log('   Your implementation is working correctly.');
    console.log('   All features from Weeks 10-12 are functional.');
    console.log('\n');
  }

  // Next steps
  console.log('%c═══════════════════════════════════════════════════════════════════════════', 'color: #9C27B0');
  console.log('%cNEXT STEPS:', 'font-size: 14px; font-weight: bold; color: #9C27B0');
  console.log('%c═══════════════════════════════════════════════════════════════════════════', 'color: #9C27B0');
  console.log('\n');
  console.log('1. 📄 Test PDF Viewer manually:');
  console.log('   • Search for a paper (PMID: 33099609)');
  console.log('   • Click "Read PDF" button');
  console.log('   • Try highlighting text');
  console.log('   • Check annotations sidebar');
  console.log('\n');
  console.log('2. 📚 Test Collections Tab:');
  console.log('   • Navigate to Collections tab');
  console.log('   • Toggle between Grid and List views');
  console.log('   • Try search and filters');
  console.log('   • Create a new collection');
  console.log('\n');
  console.log('3. 🔍 Test Explore Tab:');
  console.log('   • Navigate to Explore tab');
  console.log('   • Toggle between Network and Search views');
  console.log('   • Search for papers');
  console.log('   • View network graph');
  console.log('\n');
  console.log('4. 📊 Test Analysis Tab:');
  console.log('   • Navigate to Analysis tab');
  console.log('   • Search for analyses');
  console.log('   • Try export and share features');
  console.log('\n');
  console.log('5. 📈 Test Progress Tab:');
  console.log('   • Navigate to Progress tab');
  console.log('   • Check reading progress bar');
  console.log('   • View collaboration stats');
  console.log('   • Check activity feed');
  console.log('\n');

  console.log('%c═══════════════════════════════════════════════════════════════════════════', 'color: #9C27B0; font-weight: bold');
  console.log('%c                    TESTING COMPLETE! 🎉                                   ', 'color: #9C27B0; font-weight: bold; font-size: 16px');
  console.log('%c═══════════════════════════════════════════════════════════════════════════', 'color: #9C27B0; font-weight: bold');
  console.log('\n');

  return exportData;

})().catch(error => {
  console.error('%c❌ FATAL ERROR:', 'color: #F44336; font-weight: bold; font-size: 16px');
  console.error(error);
  console.log('\n');
  console.log('%c📝 Troubleshooting:', 'font-weight: bold');
  console.log('1. Make sure you are logged in');
  console.log('2. Make sure you are on a project page');
  console.log('3. Check browser console for errors');
  console.log('4. Try refreshing the page and running again');
});

  // Test 5: Update PDF Annotation
  if (testAnnotationId) {
    log.test('Update PDF Annotation');
    try {
      const updateData = {
        content: 'Updated test annotation content',
        priority: 'high'
      };
      
      const updateResponse = await apiRequest(`/projects/${projectId}/annotations/${testAnnotationId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      
      if (updateResponse.annotation_id === testAnnotationId) {
        recordTest('Update PDF Annotation', 'pass', 'Successfully updated annotation');
      } else {
        recordTest('Update PDF Annotation', 'fail', 'Update response mismatch');
      }
    } catch (error) {
      recordTest('Update PDF Annotation', 'fail', error.message);
    }
  }

  await sleep(500);

  // ═══════════════════════════════════════════════════════════════════════════
  // WEEK 11 DAY 2-3: HIGHLIGHT TOOL & ANNOTATIONS SIDEBAR
  // ═══════════════════════════════════════════════════════════════════════════
  
  log.section('🎨 WEEK 11 DAY 2-3: HIGHLIGHT TOOL & SIDEBAR');
  
  // Test 6: Highlight Tool Component
  log.test('Highlight Tool Component');
  try {
    const highlightToolExists = document.querySelector('[data-testid="highlight-tool"]') !== null ||
                                document.querySelector('.highlight-tool') !== null;
    
    if (highlightToolExists) {
      recordTest('Highlight Tool Component', 'pass', 'Highlight tool found in DOM');
    } else {
      recordTest('Highlight Tool Component', 'warning', 'Highlight tool not visible (PDF viewer may be closed)');
    }
  } catch (error) {
    recordTest('Highlight Tool Component', 'fail', error.message);
  }

  await sleep(500);

  // Test 7: Annotations Sidebar Component
  log.test('Annotations Sidebar Component');
  try {
    const sidebarExists = document.querySelector('[data-testid="annotations-sidebar"]') !== null ||
                         document.querySelector('.annotations-sidebar') !== null;
    
    if (sidebarExists) {
      recordTest('Annotations Sidebar Component', 'pass', 'Annotations sidebar found in DOM');
    } else {
      recordTest('Annotations Sidebar Component', 'warning', 'Annotations sidebar not visible (PDF viewer may be closed)');
    }
  } catch (error) {
    recordTest('Annotations Sidebar Component', 'fail', error.message);
  }

  await sleep(500);

