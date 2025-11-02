/**
 * ═══════════════════════════════════════════════════════════════════════════
 * WEEK 11 DAY 1 - PDF ANNOTATION BACKEND TESTING SCRIPT
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This script tests the PDF annotation backend implementation:
 * 1. Runs database migration
 * 2. Gets your project ID and user ID
 * 3. Tests creating annotations with PDF fields
 * 4. Tests retrieving annotations with PDF fields
 * 
 * INSTRUCTIONS:
 * 1. Open https://frontend-psi-seven-85.vercel.app in your browser
 * 2. Log in with your account
 * 3. Open DevTools (F12) → Console tab
 * 4. Copy and paste this ENTIRE script
 * 5. Press Enter to run
 * 6. Wait for all tests to complete
 * 7. Copy ALL console output and send back
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

console.clear();
console.log('%c╔═══════════════════════════════════════════════════════════════════════════╗', 'color: #3b82f6; font-weight: bold;');
console.log('%c║  WEEK 11 DAY 1 - PDF ANNOTATION BACKEND TESTING                          ║', 'color: #3b82f6; font-weight: bold;');
console.log('%c╚═══════════════════════════════════════════════════════════════════════════╝', 'color: #3b82f6; font-weight: bold;');
console.log('');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  BACKEND_URL: 'https://r-dagent-production.up.railway.app',
  FRONTEND_URL: 'https://frontend-psi-seven-85.vercel.app',
  TEST_PMID: '39361594'
};

// Get user ID from localStorage
const USER_DATA = localStorage.getItem('rd_agent_user') 
  ? JSON.parse(localStorage.getItem('rd_agent_user'))
  : null;

const USER_ID = USER_DATA?.email || 'default_user';

console.log('%c📋 CONFIGURATION', 'color: #10b981; font-weight: bold; font-size: 14px;');
console.log('Backend URL:', CONFIG.BACKEND_URL);
console.log('User ID:', USER_ID);
console.log('Test PMID:', CONFIG.TEST_PMID);
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

function logTest(test, status, details = '') {
  const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  const color = status === 'pass' ? '#10b981' : status === 'fail' ? '#ef4444' : '#f59e0b';
  console.log(`%c${emoji} ${test}`, `color: ${color}; font-weight: bold;`);
  if (details) console.log(`   ${details}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 1: RUN DATABASE MIGRATION
// ═══════════════════════════════════════════════════════════════════════════

async function runMigration() {
  logSection('STEP 1: DATABASE MIGRATION');
  
  console.log('Running PDF annotations migration...');
  console.log('');
  
  try {
    const response = await fetch(`${CONFIG.BACKEND_URL}/api/admin/apply-pdf-annotations-migration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      logTest('Migration applied successfully', 'pass');
      console.log('   Changes:');
      data.changes.forEach(change => console.log(`   - ${change}`));
    } else if (data.status === 'already_applied') {
      logTest('Migration already applied', 'pass', data.message);
    } else {
      logTest('Migration failed', 'fail', data.message);
      return false;
    }
    
    return true;
    
  } catch (error) {
    logTest('Migration failed', 'fail', error.message);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 2: GET PROJECT ID
// ═══════════════════════════════════════════════════════════════════════════

async function getProjectId() {
  logSection('STEP 2: GET PROJECT ID');
  
  console.log('Fetching your projects...');
  console.log('');
  
  try {
    const response = await fetch(`${CONFIG.BACKEND_URL}/projects`, {
      headers: { 'User-ID': USER_ID }
    });
    
    const data = await response.json();
    
    if (data.projects && data.projects.length > 0) {
      const project = data.projects[0];
      logTest('Found projects', 'pass', `Using project: "${project.project_name}"`);
      console.log(`   Project ID: ${project.project_id}`);
      return project.project_id;
    } else {
      logTest('No projects found', 'fail', 'Please create a project first');
      return null;
    }
    
  } catch (error) {
    logTest('Failed to fetch projects', 'fail', error.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 3: CREATE ANNOTATION WITH PDF FIELDS
// ═══════════════════════════════════════════════════════════════════════════

async function testCreateAnnotation(projectId) {
  logSection('STEP 3: CREATE ANNOTATION WITH PDF FIELDS');
  
  console.log('Creating test annotation with PDF highlight...');
  console.log('');
  
  const testAnnotation = {
    content: 'Test highlight from PDF - Cancer immunotherapy mechanisms',
    article_pmid: CONFIG.TEST_PMID,
    note_type: 'finding',
    priority: 'high',
    status: 'active',
    pdf_page: 3,
    pdf_coordinates: {
      x: 0.25,
      y: 0.35,
      width: 0.15,
      height: 0.02,
      pageWidth: 612,
      pageHeight: 792
    },
    highlight_color: '#FFEB3B',
    highlight_text: 'cancer immunotherapy mechanisms and clinical applications'
  };
  
  console.log('   Annotation data:');
  console.log('   - Content:', testAnnotation.content);
  console.log('   - PMID:', testAnnotation.article_pmid);
  console.log('   - Page:', testAnnotation.pdf_page);
  console.log('   - Color:', testAnnotation.highlight_color);
  console.log('   - Text:', testAnnotation.highlight_text);
  console.log('');
  
  try {
    const response = await fetch(`${CONFIG.BACKEND_URL}/projects/${projectId}/annotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': USER_ID
      },
      body: JSON.stringify(testAnnotation)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      logTest('Annotation created successfully', 'pass');
      console.log('   Annotation ID:', data.annotation_id);
      console.log('   PDF Page:', data.pdf_page);
      console.log('   Highlight Color:', data.highlight_color);
      console.log('   Highlight Text:', data.highlight_text);
      console.log('   Coordinates:', JSON.stringify(data.pdf_coordinates));
      return data.annotation_id;
    } else {
      logTest('Failed to create annotation', 'fail', data.detail || data.error);
      return null;
    }
    
  } catch (error) {
    logTest('Failed to create annotation', 'fail', error.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 4: RETRIEVE ANNOTATIONS WITH PDF FIELDS
// ═══════════════════════════════════════════════════════════════════════════

async function testRetrieveAnnotations(projectId) {
  logSection('STEP 4: RETRIEVE ANNOTATIONS WITH PDF FIELDS');
  
  console.log(`Fetching annotations for PMID ${CONFIG.TEST_PMID}...`);
  console.log('');
  
  try {
    const response = await fetch(
      `${CONFIG.BACKEND_URL}/projects/${projectId}/annotations?article_pmid=${CONFIG.TEST_PMID}`,
      { headers: { 'User-ID': USER_ID } }
    );
    
    const data = await response.json();
    
    if (response.ok) {
      const annotations = data.annotations || [];
      const pdfAnnotations = annotations.filter(a => a.pdf_page !== null);
      
      logTest('Retrieved annotations', 'pass', `Found ${annotations.length} total, ${pdfAnnotations.length} with PDF data`);
      
      if (pdfAnnotations.length > 0) {
        console.log('');
        console.log('   PDF Annotations:');
        pdfAnnotations.forEach((a, i) => {
          console.log(`   ${i + 1}. Page ${a.pdf_page} - ${a.highlight_color}`);
          console.log(`      Text: "${a.highlight_text}"`);
          console.log(`      Content: "${a.content}"`);
        });
      }
      
      return pdfAnnotations.length > 0;
    } else {
      logTest('Failed to retrieve annotations', 'fail', data.detail || data.error);
      return false;
    }
    
  } catch (error) {
    logTest('Failed to retrieve annotations', 'fail', error.message);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST 5: VERIFY PDF FIELDS IN RESPONSE
// ═══════════════════════════════════════════════════════════════════════════

async function verifyPDFFields(projectId, annotationId) {
  logSection('STEP 5: VERIFY PDF FIELDS IN RESPONSE');
  
  console.log('Verifying all PDF fields are returned correctly...');
  console.log('');
  
  try {
    const response = await fetch(
      `${CONFIG.BACKEND_URL}/projects/${projectId}/annotations?article_pmid=${CONFIG.TEST_PMID}`,
      { headers: { 'User-ID': USER_ID } }
    );
    
    const data = await response.json();
    const annotation = data.annotations?.find(a => a.annotation_id === annotationId);
    
    if (!annotation) {
      logTest('Annotation not found', 'fail');
      return false;
    }
    
    const checks = [
      { field: 'pdf_page', value: annotation.pdf_page, expected: 'number' },
      { field: 'pdf_coordinates', value: annotation.pdf_coordinates, expected: 'object' },
      { field: 'highlight_color', value: annotation.highlight_color, expected: 'string' },
      { field: 'highlight_text', value: annotation.highlight_text, expected: 'string' }
    ];
    
    let allPassed = true;
    
    checks.forEach(check => {
      const passed = check.value !== null && check.value !== undefined && typeof check.value === check.expected;
      logTest(
        `Field "${check.field}" present`,
        passed ? 'pass' : 'fail',
        passed ? `Value: ${typeof check.value === 'object' ? JSON.stringify(check.value) : check.value}` : 'Missing or wrong type'
      );
      if (!passed) allPassed = false;
    });
    
    return allPassed;
    
  } catch (error) {
    logTest('Verification failed', 'fail', error.message);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN TEST RUNNER
// ═══════════════════════════════════════════════════════════════════════════

async function runAllTests() {
  const startTime = performance.now();
  
  console.log('%c🚀 Starting PDF Annotation Backend Tests...', 'color: #10b981; font-weight: bold;');
  console.log('');
  
  try {
    // Step 1: Run migration
    const migrationSuccess = await runMigration();
    if (!migrationSuccess) {
      console.log('');
      console.log('%c❌ Migration failed. Cannot proceed with tests.', 'color: #ef4444; font-weight: bold;');
      return;
    }
    
    await sleep(1000);
    
    // Step 2: Get project ID
    const projectId = await getProjectId();
    if (!projectId) {
      console.log('');
      console.log('%c❌ No project found. Please create a project first.', 'color: #ef4444; font-weight: bold;');
      return;
    }
    
    await sleep(1000);
    
    // Step 3: Create annotation
    const annotationId = await testCreateAnnotation(projectId);
    if (!annotationId) {
      console.log('');
      console.log('%c❌ Failed to create annotation. Cannot proceed with verification.', 'color: #ef4444; font-weight: bold;');
      return;
    }
    
    await sleep(1000);
    
    // Step 4: Retrieve annotations
    const retrieveSuccess = await testRetrieveAnnotations(projectId);
    
    await sleep(1000);
    
    // Step 5: Verify PDF fields
    const verifySuccess = await verifyPDFFields(projectId, annotationId);
    
    // Summary
    const totalTime = ((performance.now() - startTime) / 1000).toFixed(2);
    
    logSection('TEST SUMMARY');
    
    if (migrationSuccess && projectId && annotationId && retrieveSuccess && verifySuccess) {
      console.log('%c✅ ALL TESTS PASSED!', 'color: #10b981; font-weight: bold; font-size: 18px;');
      console.log('');
      console.log('%c🎉 PDF Annotation Backend is working correctly!', 'color: #10b981; font-weight: bold;');
      console.log('');
      console.log('   ✅ Database migration successful');
      console.log('   ✅ Annotations can be created with PDF fields');
      console.log('   ✅ Annotations can be retrieved with PDF fields');
      console.log('   ✅ All PDF fields are present in responses');
    } else {
      console.log('%c⚠️  SOME TESTS FAILED', 'color: #f59e0b; font-weight: bold; font-size: 18px;');
      console.log('');
      console.log('   Please review the test results above.');
    }
    
    console.log('');
    console.log(`%cTotal execution time: ${totalTime}s`, 'color: #6b7280;');
    console.log('');
    console.log('%c📋 NEXT STEPS:', 'color: #3b82f6; font-weight: bold;');
    console.log('1. Copy ALL console output above');
    console.log('2. Send it back to confirm Day 1 is complete');
    console.log('3. We will proceed to Day 2: Frontend Highlight Tool');
    console.log('');
    
  } catch (error) {
    console.error('%c❌ TEST SUITE ERROR:', 'color: #ef4444; font-weight: bold;', error);
  }
}

// Run all tests
runAllTests();

