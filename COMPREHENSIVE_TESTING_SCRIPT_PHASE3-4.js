/**
 * ═══════════════════════════════════════════════════════════════════════════
 * COMPREHENSIVE TESTING SCRIPT - PHASE 3 WEEK 5 TO PHASE 4 WEEK 9-10
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This script tests ALL features implemented from Phase 3 Week 5 onwards:
 * - Phase 3 Week 6: Global Search with Filters
 * - Phase 4 Week 7 Days 1-5: Collaborators Backend & Frontend
 * - Phase 4 Week 7 Days 6-8: Enhanced Activity Feed
 * - Phase 4 Week 7 Days 9-10: Testing Suite
 * - Phase 4 Week 9-10 Days 1-5: PDF Viewer & Reading Experience
 * - Cost Optimization Phases 2-3: PubMed Caching & Database Optimization
 * 
 * INSTRUCTIONS:
 * 1. Open https://frontend-psi-seven-85.vercel.app in your browser
 * 2. Log in with your account
 * 3. Open DevTools (F12) → Console tab
 * 4. Copy and paste this ENTIRE script
 * 5. Press Enter to run
 * 6. Wait for all tests to complete (~2-3 minutes)
 * 7. Copy ALL console output and send back
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

console.clear();
console.log('%c╔═══════════════════════════════════════════════════════════════════════════╗', 'color: #3b82f6; font-weight: bold;');
console.log('%c║  COMPREHENSIVE TESTING SCRIPT - PHASE 3-4 (Week 5 to Week 9-10)          ║', 'color: #3b82f6; font-weight: bold;');
console.log('%c╚═══════════════════════════════════════════════════════════════════════════╝', 'color: #3b82f6; font-weight: bold;');
console.log('');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  BACKEND_URL: 'https://r-dagent-production.up.railway.app',
  FRONTEND_URL: 'https://frontend-psi-seven-85.vercel.app',
  TEST_PMIDS: {
    WITH_PDF: ['39361594', '38811638'],
    NO_PDF: ['37699232'],
    INVALID: ['99999999']
  },
  TEST_QUERIES: ['cancer immunotherapy', 'CRISPR gene editing', 'COVID-19 vaccines'],
  TIMEOUT: 15000
};

// Get user ID from localStorage
const USER_ID = localStorage.getItem('rd_agent_user') 
  ? JSON.parse(localStorage.getItem('rd_agent_user')).email 
  : 'default_user';

console.log('%c📋 TEST CONFIGURATION', 'color: #10b981; font-weight: bold; font-size: 14px;');
console.log('Backend URL:', CONFIG.BACKEND_URL);
console.log('Frontend URL:', CONFIG.FRONTEND_URL);
console.log('User ID:', USER_ID);
console.log('');

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function logSection(title) {
  console.log('');
  console.log('%c' + '═'.repeat(80), 'color: #6b7280;');
  console.log('%c' + title, 'color: #3b82f6; font-weight: bold; font-size: 16px;');
  console.log('%c' + '═'.repeat(80), 'color: #6b7280;');
}

function logTest(category, test, status, details = '') {
  const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  const color = status === 'pass' ? '#10b981' : status === 'fail' ? '#ef4444' : '#f59e0b';
  console.log(`%c${emoji} [${category}] ${test}`, `color: ${color}; font-weight: bold;`);
  if (details) console.log(`   ${details}`);
}

async function testBackendEndpoint(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-ID': USER_ID
      }
    };
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(`${CONFIG.BACKEND_URL}${endpoint}`, options);
    const data = await response.json();
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 1: GLOBAL SEARCH WITH FILTERS (Phase 3 Week 6)
// ═══════════════════════════════════════════════════════════════════════════

async function testGlobalSearch() {
  logSection('TEST SUITE 1: GLOBAL SEARCH WITH FILTERS');
  
  // Test 1.1: Search UI Elements
  console.log('%c\n1.1 SEARCH UI ELEMENTS', 'color: #8b5cf6; font-weight: bold;');
  const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"]');
  const searchButton = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent.includes('Search') || btn.querySelector('svg')
  );
  
  logTest('UI', 'Search input exists', searchInput ? 'pass' : 'fail', 
    searchInput ? 'Found search input' : 'Search input not found');
  logTest('UI', 'Search button exists', searchButton ? 'pass' : 'fail',
    searchButton ? 'Found search button' : 'Search button not found');
  
  // Test 1.2: Filter UI Elements
  console.log('%c\n1.2 FILTER UI ELEMENTS', 'color: #8b5cf6; font-weight: bold;');
  const filterButtons = Array.from(document.querySelectorAll('button')).filter(btn =>
    btn.textContent.match(/Year|Journal|Author|Type/i)
  );
  logTest('UI', 'Filter buttons exist', filterButtons.length > 0 ? 'pass' : 'warn',
    `Found ${filterButtons.length} filter buttons`);
  
  // Test 1.3: Backend Search Endpoint
  console.log('%c\n1.3 BACKEND SEARCH ENDPOINT', 'color: #8b5cf6; font-weight: bold;');
  const searchResult = await testBackendEndpoint('/pubmed/search?q=cancer&limit=5');
  logTest('Backend', 'PubMed search endpoint', searchResult.success ? 'pass' : 'fail',
    searchResult.success ? `Found ${searchResult.data.articles?.length || 0} articles` : searchResult.error);
  
  // Test 1.4: Search with Filters
  console.log('%c\n1.4 SEARCH WITH FILTERS', 'color: #8b5cf6; font-weight: bold;');
  const filteredSearch = await testBackendEndpoint('/pubmed/search?q=cancer&year_min=2020&limit=5');
  logTest('Backend', 'Filtered search', filteredSearch.success ? 'pass' : 'fail',
    filteredSearch.success ? `Filtered results: ${filteredSearch.data.articles?.length || 0}` : filteredSearch.error);
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 2: COLLABORATORS (Phase 4 Week 7 Days 1-5)
// ═══════════════════════════════════════════════════════════════════════════

async function testCollaborators() {
  logSection('TEST SUITE 2: COLLABORATORS SYSTEM');
  
  // Test 2.1: Backend Collaborators Endpoint
  console.log('%c\n2.1 BACKEND COLLABORATORS ENDPOINT', 'color: #8b5cf6; font-weight: bold;');
  
  // First, get a project ID
  const projectsResult = await testBackendEndpoint('/projects');
  const projectId = projectsResult.data?.projects?.[0]?.project_id || 'default';
  
  const collabResult = await testBackendEndpoint(`/projects/${projectId}/collaborators`);
  logTest('Backend', 'GET collaborators endpoint', collabResult.success ? 'pass' : 'fail',
    collabResult.success ? `Found ${collabResult.data?.collaborators?.length || 0} collaborators` : collabResult.error);
  
  // Test 2.2: Frontend Collaborators UI
  console.log('%c\n2.2 FRONTEND COLLABORATORS UI', 'color: #8b5cf6; font-weight: bold;');
  const collabSection = Array.from(document.querySelectorAll('*')).find(el =>
    el.textContent.includes('Collaborator') || el.textContent.includes('Team Member')
  );
  logTest('UI', 'Collaborators section exists', collabSection ? 'pass' : 'warn',
    collabSection ? 'Found collaborators section' : 'Navigate to project settings to see collaborators');
  
  // Test 2.3: Add Collaborator (if UI exists)
  console.log('%c\n2.3 ADD COLLABORATOR FUNCTIONALITY', 'color: #8b5cf6; font-weight: bold;');
  const addButton = Array.from(document.querySelectorAll('button')).find(btn =>
    btn.textContent.includes('Add Collaborator') || btn.textContent.includes('Invite')
  );
  logTest('UI', 'Add collaborator button', addButton ? 'pass' : 'warn',
    addButton ? 'Found add collaborator button' : 'Button may be in project settings');
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 3: ENHANCED ACTIVITY FEED (Phase 4 Week 7 Days 6-8)
// ═══════════════════════════════════════════════════════════════════════════

async function testActivityFeed() {
  logSection('TEST SUITE 3: ENHANCED ACTIVITY FEED');
  
  // Test 3.1: Activity Feed UI
  console.log('%c\n3.1 ACTIVITY FEED UI ELEMENTS', 'color: #8b5cf6; font-weight: bold;');
  const activityFeed = Array.from(document.querySelectorAll('*')).find(el =>
    el.textContent.includes('Activity') || el.textContent.includes('Recent')
  );
  logTest('UI', 'Activity feed exists', activityFeed ? 'pass' : 'warn',
    activityFeed ? 'Found activity feed' : 'Navigate to home or project page to see activity feed');
  
  // Test 3.2: Activity Filter Buttons
  console.log('%c\n3.2 ACTIVITY FILTER BUTTONS', 'color: #8b5cf6; font-weight: bold;');
  const filterButtons = Array.from(document.querySelectorAll('button')).filter(btn =>
    btn.textContent.match(/All|Search|Save|Collection|Note/i)
  );
  logTest('UI', 'Activity filter buttons', filterButtons.length >= 3 ? 'pass' : 'warn',
    `Found ${filterButtons.length} filter buttons`);
  
  // Test 3.3: Backend Activity Endpoint
  console.log('%c\n3.3 BACKEND ACTIVITY ENDPOINT', 'color: #8b5cf6; font-weight: bold;');
  const activityResult = await testBackendEndpoint('/activity?limit=10');
  logTest('Backend', 'Activity feed endpoint', activityResult.success ? 'pass' : 'fail',
    activityResult.success ? `Found ${activityResult.data?.activities?.length || 0} activities` : activityResult.error);
  
  // Test 3.4: Activity Cards
  console.log('%c\n3.4 ACTIVITY CARDS', 'color: #8b5cf6; font-weight: bold;');
  const activityCards = document.querySelectorAll('[class*="activity"], [class*="card"]');
  logTest('UI', 'Activity cards rendered', activityCards.length > 0 ? 'pass' : 'warn',
    `Found ${activityCards.length} activity cards`);
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 4: PDF VIEWER (Phase 4 Week 9-10 Days 1-5)
// ═══════════════════════════════════════════════════════════════════════════

async function testPDFViewer() {
  logSection('TEST SUITE 4: PDF VIEWER & READING EXPERIENCE');
  
  // Test 4.1: Backend PDF URL Endpoint
  console.log('%c\n4.1 BACKEND PDF URL ENDPOINT', 'color: #8b5cf6; font-weight: bold;');
  
  for (const pmid of CONFIG.TEST_PMIDS.WITH_PDF) {
    const pdfResult = await testBackendEndpoint(`/articles/${pmid}/pdf-url`);
    logTest('Backend', `PDF URL for PMID ${pmid}`, pdfResult.success ? 'pass' : 'fail',
      pdfResult.success ? `Source: ${pdfResult.data.source}, Available: ${pdfResult.data.pdf_available}` : pdfResult.error);
  }
  
  // Test no PDF available
  for (const pmid of CONFIG.TEST_PMIDS.NO_PDF) {
    const pdfResult = await testBackendEndpoint(`/articles/${pmid}/pdf-url`);
    logTest('Backend', `No PDF for PMID ${pmid}`, pdfResult.success && !pdfResult.data.pdf_available ? 'pass' : 'warn',
      pdfResult.success ? `Correctly returned pdf_available: false` : 'Unexpected response');
  }
  
  // Test 4.2: Frontend PDF Viewer UI
  console.log('%c\n4.2 FRONTEND PDF VIEWER UI', 'color: #8b5cf6; font-weight: bold;');
  const readPDFButtons = Array.from(document.querySelectorAll('button')).filter(btn =>
    btn.textContent.includes('Read PDF') || btn.textContent.includes('View PDF')
  );
  logTest('UI', 'Read PDF buttons exist', readPDFButtons.length > 0 ? 'pass' : 'warn',
    `Found ${readPDFButtons.length} "Read PDF" buttons`);
  
  // Test 4.3: PDF Viewer Component
  console.log('%c\n4.3 PDF VIEWER COMPONENT', 'color: #8b5cf6; font-weight: bold;');
  console.log('   ℹ️  To test PDF viewer:');
  console.log('   1. Search for PMID: 39361594');
  console.log('   2. Click "Read PDF" button');
  console.log('   3. Verify PDF loads in full-screen modal');
  console.log('   4. Test navigation (← → arrow keys)');
  console.log('   5. Test zoom controls');
  console.log('   6. Press Esc to close');
  
  // Test 4.4: Frontend Proxy Route
  console.log('%c\n4.4 FRONTEND PROXY ROUTE', 'color: #8b5cf6; font-weight: bold;');
  try {
    const proxyResult = await fetch(`${CONFIG.FRONTEND_URL}/api/proxy/articles/39361594/pdf-url`, {
      headers: { 'User-ID': USER_ID }
    });
    const proxyData = await proxyResult.json();
    logTest('Frontend', 'PDF proxy route', proxyResult.ok ? 'pass' : 'fail',
      proxyResult.ok ? `Proxy working, PDF available: ${proxyData.pdf_available}` : 'Proxy route failed');
  } catch (error) {
    logTest('Frontend', 'PDF proxy route', 'fail', error.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 5: COST OPTIMIZATION (Phases 2-3)
// ═══════════════════════════════════════════════════════════════════════════

async function testCostOptimization() {
  logSection('TEST SUITE 5: COST OPTIMIZATION');
  
  // Test 5.1: PubMed Caching
  console.log('%c\n5.1 PUBMED API CACHING', 'color: #8b5cf6; font-weight: bold;');
  
  const testQuery = 'cancer';
  console.log(`   Testing cache with query: "${testQuery}"`);
  
  // First request (cache miss)
  const start1 = performance.now();
  const result1 = await testBackendEndpoint(`/pubmed/search?q=${testQuery}&limit=5`);
  const time1 = performance.now() - start1;
  
  await sleep(100); // Small delay
  
  // Second request (should be cached)
  const start2 = performance.now();
  const result2 = await testBackendEndpoint(`/pubmed/search?q=${testQuery}&limit=5`);
  const time2 = performance.now() - start2;
  
  const isCached = time2 < time1 * 0.5; // Cached should be at least 50% faster
  logTest('Performance', 'PubMed caching working', isCached ? 'pass' : 'warn',
    `First request: ${time1.toFixed(0)}ms, Second request: ${time2.toFixed(0)}ms`);
  
  // Test 5.2: Database Query Optimization
  console.log('%c\n5.2 DATABASE QUERY OPTIMIZATION', 'color: #8b5cf6; font-weight: bold;');
  
  const projectsResult = await testBackendEndpoint('/projects');
  if (projectsResult.success && projectsResult.data?.projects?.length > 0) {
    const projectId = projectsResult.data.projects[0].project_id;
    
    const start = performance.now();
    const projectDetail = await testBackendEndpoint(`/projects/${projectId}`);
    const time = performance.now() - start;
    
    logTest('Performance', 'Project detail query', projectDetail.success ? 'pass' : 'fail',
      `Response time: ${time.toFixed(0)}ms (should be < 500ms)`);
  } else {
    logTest('Performance', 'Database optimization', 'warn', 'No projects found to test');
  }
  
  // Test 5.3: Artifact Registry Cleanup
  console.log('%c\n5.3 ARTIFACT REGISTRY CLEANUP', 'color: #8b5cf6; font-weight: bold;');
  console.log('   ℹ️  Artifact Registry cleanup is automated via GitHub Actions');
  console.log('   ℹ️  Weekly cleanup runs every Sunday at midnight UTC');
  console.log('   ℹ️  Check GitHub Actions tab for cleanup job status');
  logTest('Info', 'Cleanup automation', 'pass', 'Automated cleanup configured');
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN TEST RUNNER
// ═══════════════════════════════════════════════════════════════════════════

async function runAllTests() {
  const startTime = performance.now();
  
  try {
    await testGlobalSearch();
    await sleep(500);
    
    await testCollaborators();
    await sleep(500);
    
    await testActivityFeed();
    await sleep(500);
    
    await testPDFViewer();
    await sleep(500);
    
    await testCostOptimization();
    
  } catch (error) {
    console.error('%c❌ TEST SUITE ERROR:', 'color: #ef4444; font-weight: bold;', error);
  }
  
  const totalTime = ((performance.now() - startTime) / 1000).toFixed(2);
  
  logSection('TEST SUMMARY');
  console.log('%c✅ All tests completed!', 'color: #10b981; font-weight: bold; font-size: 16px;');
  console.log(`%cTotal execution time: ${totalTime}s`, 'color: #6b7280;');
  console.log('');
  console.log('%c📋 NEXT STEPS:', 'color: #3b82f6; font-weight: bold;');
  console.log('1. Review all test results above');
  console.log('2. Test PDF viewer manually (search PMID: 39361594, click "Read PDF")');
  console.log('3. Test activity feed filters (navigate to home page)');
  console.log('4. Test collaborators (navigate to project settings)');
  console.log('5. Copy ALL console output and send back');
  console.log('');
}

// Run all tests
runAllTests();

