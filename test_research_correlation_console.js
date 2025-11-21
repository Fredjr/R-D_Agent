/**
 * Browser Console Test Script for Research Correlation Feature
 * 
 * USAGE:
 * 1. Open your R&D Agent app in browser
 * 2. Navigate to a project with questions, hypotheses, and experiment plans
 * 3. Open browser console (F12 or Cmd+Option+I)
 * 4. Copy and paste this entire file into console
 * 5. Run: await testResearchCorrelation()
 * 
 * REQUIREMENTS:
 * - Must be logged in
 * - Must have a project with at least 1 question, 1 hypothesis, 1 protocol
 */

// Configuration - UPDATE THESE VALUES
const CONFIG = {
  projectId: 'YOUR_PROJECT_ID_HERE',  // Get from URL or localStorage
  userId: 'YOUR_USER_ID_HERE',        // Get from localStorage
  apiBase: '/api/proxy'
};

// Test Results Storage
const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

// Helper Functions
function log(emoji, message, data = null) {
  console.log(`${emoji} ${message}`);
  if (data) console.log(data);
}

function pass(testName) {
  testResults.passed.push(testName);
  log('✅', `PASS: ${testName}`);
}

function fail(testName, error) {
  testResults.failed.push({ test: testName, error });
  log('❌', `FAIL: ${testName}`, error);
}

function warn(message) {
  testResults.warnings.push(message);
  log('⚠️', `WARNING: ${message}`);
}

// API Helper
async function apiCall(endpoint, options = {}) {
  const url = `${CONFIG.apiBase}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'User-ID': CONFIG.userId
  };
  
  const response = await fetch(url, {
    ...options,
    headers: { ...defaultHeaders, ...options.headers }
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// Test 1: Verify Backend Endpoints Exist
async function testBackendEndpoints() {
  log('🧪', 'TEST 1: Verifying Backend Endpoints...');
  
  try {
    // Get questions
    const questions = await apiCall(`/questions/project/${CONFIG.projectId}`);
    if (questions.length === 0) {
      warn('No questions found in project. Create at least 1 question first.');
      return;
    }
    pass('GET /questions/project/{id} - Returns questions');
    
    // Get single question
    const question = await apiCall(`/questions/${questions[0].question_id}`);
    pass('GET /questions/{id} - Returns single question');
    
    // Get hypotheses
    const hypotheses = await apiCall(`/hypotheses/project/${CONFIG.projectId}`);
    if (hypotheses.length === 0) {
      warn('No hypotheses found in project. Create at least 1 hypothesis first.');
      return;
    }
    pass('GET /hypotheses/project/{id} - Returns hypotheses');
    
    // Get single hypothesis (NEW ENDPOINT)
    const hypothesis = await apiCall(`/hypotheses/${hypotheses[0].hypothesis_id}`);
    pass('GET /hypotheses/{id} - Returns single hypothesis (NEW!)');
    
    // Store for later tests
    window.testData = { questions, hypotheses, question, hypothesis };
    
  } catch (error) {
    fail('Backend Endpoints Test', error);
  }
}

// Test 2: Generate Experiment Plan with AI Linking
async function testAILinking() {
  log('🧪', 'TEST 2: Testing AI Auto-Linking...');
  
  try {
    // Get protocols
    const protocols = await apiCall(`/protocols/project/${CONFIG.projectId}`);
    if (protocols.length === 0) {
      warn('No protocols found. Extract a protocol from a paper first.');
      return;
    }
    
    const protocol = protocols[0];
    log('📋', `Using protocol: ${protocol.protocol_name}`);
    
    // Generate experiment plan
    log('⏳', 'Generating experiment plan (this may take 10-30 seconds)...');
    const plan = await apiCall(`/experiment-plans/generate`, {
      method: 'POST',
      body: JSON.stringify({
        project_id: CONFIG.projectId,
        protocol_id: protocol.protocol_id
      })
    });
    
    log('✨', 'Experiment plan generated!', plan);
    
    // Check if AI populated linked arrays
    if (plan.linked_questions && plan.linked_questions.length > 0) {
      pass(`AI Auto-Linking: ${plan.linked_questions.length} questions linked`);
    } else {
      warn('AI did not link any questions. This may be expected if questions are not relevant.');
    }
    
    if (plan.linked_hypotheses && plan.linked_hypotheses.length > 0) {
      pass(`AI Auto-Linking: ${plan.linked_hypotheses.length} hypotheses linked`);
    } else {
      warn('AI did not link any hypotheses. This may be expected if hypotheses are not relevant.');
    }
    
    // Store for later tests
    window.testData.plan = plan;
    
  } catch (error) {
    fail('AI Linking Test', error);
  }
}

// Test 3: Test Manual Linking API
async function testManualLinking() {
  log('🧪', 'TEST 3: Testing Manual Linking API...');
  
  try {
    if (!window.testData.plan) {
      warn('No experiment plan available. Run testAILinking() first.');
      return;
    }
    
    const plan = window.testData.plan;
    const { questions, hypotheses } = window.testData;
    
    // Manually link first question and hypothesis
    const updateData = {
      linked_questions: [questions[0].question_id],
      linked_hypotheses: hypotheses[0].hypothesis_id ? [hypotheses[0].hypothesis_id] : []
    };
    
    log('📝', 'Updating research links...', updateData);
    
    const updatedPlan = await apiCall(`/experiment-plans/${plan.plan_id}/research-links`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
    
    // Verify update
    if (updatedPlan.linked_questions.includes(questions[0].question_id)) {
      pass('Manual Linking: Question linked successfully');
    } else {
      fail('Manual Linking: Question not linked', updatedPlan);
    }
    
    if (hypotheses[0].hypothesis_id && updatedPlan.linked_hypotheses.includes(hypotheses[0].hypothesis_id)) {
      pass('Manual Linking: Hypothesis linked successfully');
    }
    
    window.testData.plan = updatedPlan;
    
  } catch (error) {
    fail('Manual Linking Test', error);
  }
}

// Test 4: Test Badge Components (Frontend)
async function testBadgeComponents() {
  log('🧪', 'TEST 4: Testing Badge Components...');
  
  try {
    const { questions, hypotheses } = window.testData;
    
    // Test QuestionBadge API call
    const questionData = await apiCall(`/questions/${questions[0].question_id}`);
    if (questionData.question_id === questions[0].question_id) {
      pass('QuestionBadge: API endpoint works correctly');
    }
    
    // Test HypothesisBadge API call
    if (hypotheses[0].hypothesis_id) {
      const hypothesisData = await apiCall(`/hypotheses/${hypotheses[0].hypothesis_id}`);
      if (hypothesisData.hypothesis_id === hypotheses[0].hypothesis_id) {
        pass('HypothesisBadge: API endpoint works correctly');
      }
    }
    
  } catch (error) {
    fail('Badge Components Test', error);
  }
}

// Main Test Runner
async function testResearchCorrelation() {
  console.clear();
  log('🚀', '=== RESEARCH CORRELATION FEATURE TEST ===');
  log('📋', 'Configuration:', CONFIG);
  
  // Validate config
  if (CONFIG.projectId === 'YOUR_PROJECT_ID_HERE' || CONFIG.userId === 'YOUR_USER_ID_HERE') {
    log('❌', 'ERROR: Please update CONFIG values at the top of this script!');
    log('💡', 'Get projectId from URL: /projects/{projectId}');
    log('💡', 'Get userId from: localStorage.getItem("userId")');
    return;
  }
  
  // Run tests
  await testBackendEndpoints();
  await testAILinking();
  await testManualLinking();
  await testBadgeComponents();
  
  // Print summary
  console.log('\n' + '='.repeat(50));
  log('📊', 'TEST SUMMARY');
  console.log('='.repeat(50));
  log('✅', `Passed: ${testResults.passed.length} tests`);
  log('❌', `Failed: ${testResults.failed.length} tests`);
  log('⚠️', `Warnings: ${testResults.warnings.length}`);
  
  if (testResults.passed.length > 0) {
    console.log('\n✅ PASSED TESTS:');
    testResults.passed.forEach(test => console.log(`  - ${test}`));
  }
  
  if (testResults.failed.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.failed.forEach(({ test, error }) => {
      console.log(`  - ${test}`);
      console.log(`    Error:`, error);
    });
  }
  
  if (testResults.warnings.length > 0) {
    console.log('\n⚠️ WARNINGS:');
    testResults.warnings.forEach(warning => console.log(`  - ${warning}`));
  }
  
  console.log('\n' + '='.repeat(50));
  
  // Return test data for manual inspection
  return {
    results: testResults,
    data: window.testData
  };
}

// Quick setup helper
function setupConfig() {
  const userId = localStorage.getItem('userId');
  const projectId = window.location.pathname.match(/projects\/([^\/]+)/)?.[1];
  
  if (userId) {
    CONFIG.userId = userId;
    log('✅', `Found userId: ${userId}`);
  }
  
  if (projectId) {
    CONFIG.projectId = projectId;
    log('✅', `Found projectId: ${projectId}`);
  }
  
  if (userId && projectId) {
    log('🎉', 'Config auto-detected! Run: await testResearchCorrelation()');
  } else {
    log('⚠️', 'Could not auto-detect config. Please update CONFIG manually.');
  }
}

// Auto-run setup
log('🔧', 'Setting up test configuration...');
setupConfig();

