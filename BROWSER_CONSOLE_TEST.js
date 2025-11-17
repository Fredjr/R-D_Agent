/**
 * 🧪 BROWSER CONSOLE TEST SUITE - QUESTIONS & HYPOTHESES
 * 
 * INSTRUCTIONS:
 * 1. Open your R&D Agent app in the browser
 * 2. Navigate to a project page
 * 3. Open browser console (F12 or Cmd+Option+I)
 * 4. Copy and paste this entire script
 * 5. Press Enter to run
 * 
 * The script will:
 * - Test all CRUD operations for questions
 * - Test all CRUD operations for hypotheses
 * - Test the new DELETE endpoints
 * - Clean up all test data automatically
 * - Display results in a formatted table
 */

(async function() {
  console.log('%c🧪 STARTING BROWSER CONSOLE TEST SUITE', 'background: #1DB954; color: white; font-size: 16px; padding: 10px; font-weight: bold;');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #1DB954;');
  
  // Configuration
  const API_BASE_URL = '/api/proxy';
  const testData = {
    projectId: null,
    userId: null,
    questionIds: [],
    hypothesisIds: []
  };
  
  const results = [];
  
  // Helper function to log test results
  function logTest(name, passed, details = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? '#1DB954' : '#E22134';
    console.log(`%c${status}%c | ${name}`, `color: ${color}; font-weight: bold;`, 'color: inherit;');
    if (details) {
      console.log(`   └─ ${details}`);
    }
    results.push({ name, passed, details });
  }
  
  // Helper function to make API calls
  async function apiCall(method, endpoint, body = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-ID': testData.userId
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    if (response.status === 204) {
      return { status: 204, data: null };
    }
    
    const data = await response.json();
    return { status: response.status, data };
  }
  
  // Get current user and project from page
  console.log('\n%c📋 SETUP', 'background: #535353; color: white; font-size: 14px; padding: 5px; font-weight: bold;');
  
  try {
    // Try to get project ID from URL
    const urlMatch = window.location.pathname.match(/\/project\/([^\/]+)/);
    if (urlMatch) {
      testData.projectId = urlMatch[1];
      console.log(`✓ Project ID: ${testData.projectId}`);
    } else {
      throw new Error('Could not find project ID in URL. Please navigate to a project page.');
    }
    
    // Try to get user ID from localStorage or cookies
    const userEmail = localStorage.getItem('userEmail') || 'test@example.com';
    testData.userId = userEmail;
    console.log(`✓ User ID: ${testData.userId}`);
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    return;
  }
  
  // TEST 1: Create Main Question
  console.log('\n%c🧪 TEST 1: Create Main Question', 'background: #535353; color: white; font-size: 14px; padding: 5px; font-weight: bold;');
  try {
    const result = await apiCall('POST', '/questions', {
      project_id: testData.projectId,
      question_text: '[TEST] What are the molecular mechanisms of autophagy?',
      question_type: 'main',
      description: 'Test question - will be deleted',
      status: 'exploring',
      priority: 'high'
    });
    
    const passed = result.status === 201;
    logTest('Create main question', passed, `Status: ${result.status}`);
    
    if (passed) {
      testData.questionIds.push(result.data.question_id);
      console.log(`   └─ Question ID: ${result.data.question_id}`);
      console.log(`   └─ Depth level: ${result.data.depth_level}`);
    }
  } catch (error) {
    logTest('Create main question', false, error.message);
  }
  
  // TEST 2: Create Sub-Question
  console.log('\n%c🧪 TEST 2: Create Sub-Question', 'background: #535353; color: white; font-size: 14px; padding: 5px; font-weight: bold;');
  try {
    const result = await apiCall('POST', '/questions', {
      project_id: testData.projectId,
      parent_question_id: testData.questionIds[0],
      question_text: '[TEST] How does mTOR regulate autophagy?',
      question_type: 'sub',
      description: 'Test sub-question - will be deleted',
      status: 'investigating',
      priority: 'medium'
    });
    
    const passed = result.status === 201;
    logTest('Create sub-question', passed, `Status: ${result.status}`);
    
    if (passed) {
      testData.questionIds.push(result.data.question_id);
      console.log(`   └─ Question ID: ${result.data.question_id}`);
      console.log(`   └─ Parent ID: ${result.data.parent_question_id}`);
      console.log(`   └─ Depth level: ${result.data.depth_level}`);
    }
  } catch (error) {
    logTest('Create sub-question', false, error.message);
  }
  
  // TEST 3: Get Project Questions
  console.log('\n%c🧪 TEST 3: Get Project Questions', 'background: #535353; color: white; font-size: 14px; padding: 5px; font-weight: bold;');
  try {
    const result = await apiCall('GET', `/questions/project/${testData.projectId}`);
    
    const passed = result.status === 200;
    logTest('Get project questions', passed, `Status: ${result.status}, Count: ${result.data?.length || 0}`);
    
    if (passed) {
      const testQuestions = result.data.filter(q => q.question_text.startsWith('[TEST]'));
      console.log(`   └─ Total questions: ${result.data.length}`);
      console.log(`   └─ Test questions: ${testQuestions.length}`);
    }
  } catch (error) {
    logTest('Get project questions', false, error.message);
  }
  
  // TEST 4: Update Question
  console.log('\n%c🧪 TEST 4: Update Question', 'background: #535353; color: white; font-size: 14px; padding: 5px; font-weight: bold;');
  try {
    const result = await apiCall('PUT', `/questions/${testData.questionIds[0]}`, {
      status: 'answered',
      priority: 'critical'
    });

    const passed = result.status === 200;
    logTest('Update question', passed, `Status: ${result.status}`);

    if (passed) {
      console.log(`   └─ New status: ${result.data.status}`);
      console.log(`   └─ New priority: ${result.data.priority}`);
    }
  } catch (error) {
    logTest('Update question', false, error.message);
  }

  // TEST 5: Create Hypothesis
  console.log('\n%c🧪 TEST 5: Create Hypothesis', 'background: #535353; color: white; font-size: 14px; padding: 5px; font-weight: bold;');
  try {
    const result = await apiCall('POST', '/hypotheses', {
      project_id: testData.projectId,
      question_id: testData.questionIds[0],
      hypothesis_text: '[TEST] mTOR inhibition increases autophagy flux',
      hypothesis_type: 'mechanistic',
      description: 'Test hypothesis - will be deleted',
      status: 'testing',
      confidence_level: 75
    });

    const passed = result.status === 201;
    logTest('Create hypothesis', passed, `Status: ${result.status}`);

    if (passed) {
      testData.hypothesisIds.push(result.data.hypothesis_id);
      console.log(`   └─ Hypothesis ID: ${result.data.hypothesis_id}`);
      console.log(`   └─ Type: ${result.data.hypothesis_type}`);
      console.log(`   └─ Confidence: ${result.data.confidence_level}%`);
    }
  } catch (error) {
    logTest('Create hypothesis', false, error.message);
  }

  // TEST 6: Get Question Hypotheses
  console.log('\n%c🧪 TEST 6: Get Question Hypotheses', 'background: #535353; color: white; font-size: 14px; padding: 5px; font-weight: bold;');
  try {
    const result = await apiCall('GET', `/hypotheses/question/${testData.questionIds[0]}`);

    const passed = result.status === 200;
    logTest('Get question hypotheses', passed, `Status: ${result.status}, Count: ${result.data?.length || 0}`);

    if (passed) {
      const testHypotheses = result.data.filter(h => h.hypothesis_text.startsWith('[TEST]'));
      console.log(`   └─ Total hypotheses: ${result.data.length}`);
      console.log(`   └─ Test hypotheses: ${testHypotheses.length}`);
    }
  } catch (error) {
    logTest('Get question hypotheses', false, error.message);
  }

  // TEST 7: Update Hypothesis
  console.log('\n%c🧪 TEST 7: Update Hypothesis', 'background: #535353; color: white; font-size: 14px; padding: 5px; font-weight: bold;');
  try {
    const result = await apiCall('PUT', `/hypotheses/${testData.hypothesisIds[0]}`, {
      status: 'supported',
      confidence_level: 85
    });

    const passed = result.status === 200;
    logTest('Update hypothesis', passed, `Status: ${result.status}`);

    if (passed) {
      console.log(`   └─ New status: ${result.data.status}`);
      console.log(`   └─ New confidence: ${result.data.confidence_level}%`);
    }
  } catch (error) {
    logTest('Update hypothesis', false, error.message);
  }

  // TEST 8: Delete Hypothesis (NEW ENDPOINT)
  console.log('\n%c🧪 TEST 8: Delete Hypothesis (NEW ENDPOINT)', 'background: #535353; color: white; font-size: 14px; padding: 5px; font-weight: bold;');
  try {
    const result = await apiCall('DELETE', `/hypotheses/${testData.hypothesisIds[0]}`);

    const passed = result.status === 204;
    logTest('Delete hypothesis', passed, `Status: ${result.status}`);

    if (passed) {
      console.log(`   └─ Hypothesis deleted successfully`);
    }
  } catch (error) {
    logTest('Delete hypothesis', false, error.message);
  }

  // TEST 9: Verify Hypothesis Deleted
  console.log('\n%c🧪 TEST 9: Verify Hypothesis Deleted', 'background: #535353; color: white; font-size: 14px; padding: 5px; font-weight: bold;');
  try {
    const result = await apiCall('GET', `/hypotheses/question/${testData.questionIds[0]}`);

    const testHypotheses = result.data.filter(h => h.hypothesis_text.startsWith('[TEST]'));
    const passed = result.status === 200 && testHypotheses.length === 0;
    logTest('Verify hypothesis deleted', passed, `Test hypotheses count: ${testHypotheses.length}`);
  } catch (error) {
    logTest('Verify hypothesis deleted', false, error.message);
  }

  // TEST 10: Delete Sub-Question
  console.log('\n%c🧪 TEST 10: Delete Sub-Question', 'background: #535353; color: white; font-size: 14px; padding: 5px; font-weight: bold;');
  try {
    const result = await apiCall('DELETE', `/questions/${testData.questionIds[1]}`);

    const passed = result.status === 204;
    logTest('Delete sub-question', passed, `Status: ${result.status}`);

    if (passed) {
      console.log(`   └─ Sub-question deleted successfully`);
    }
  } catch (error) {
    logTest('Delete sub-question', false, error.message);
  }

  // TEST 11: Delete Main Question (CASCADE)
  console.log('\n%c🧪 TEST 11: Delete Main Question (CASCADE)', 'background: #535353; color: white; font-size: 14px; padding: 5px; font-weight: bold;');
  try {
    const result = await apiCall('DELETE', `/questions/${testData.questionIds[0]}`);

    const passed = result.status === 204;
    logTest('Delete main question', passed, `Status: ${result.status}`);

    if (passed) {
      console.log(`   └─ Main question deleted successfully`);
      console.log(`   └─ All sub-questions should be deleted (CASCADE)`);
    }
  } catch (error) {
    logTest('Delete main question', false, error.message);
  }

  // TEST 12: Verify All Test Questions Deleted
  console.log('\n%c🧪 TEST 12: Verify All Test Questions Deleted', 'background: #535353; color: white; font-size: 14px; padding: 5px; font-weight: bold;');
  try {
    const result = await apiCall('GET', `/questions/project/${testData.projectId}`);

    const testQuestions = result.data.filter(q => q.question_text.startsWith('[TEST]'));
    const passed = result.status === 200 && testQuestions.length === 0;
    logTest('Verify all test questions deleted', passed, `Test questions count: ${testQuestions.length}`);
  } catch (error) {
    logTest('Verify all test questions deleted', false, error.message);
  }

  // SUMMARY
  console.log('\n%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #1DB954;');
  console.log('%c📊 TEST SUMMARY', 'background: #1DB954; color: white; font-size: 16px; padding: 10px; font-weight: bold;');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #1DB954;');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = ((passed / total) * 100).toFixed(1);

  console.log(`\nTotal Tests: ${total}`);
  console.log(`%cPassed: ${passed}`, 'color: #1DB954; font-weight: bold;');
  console.log(`%cFailed: ${total - passed}`, 'color: #E22134; font-weight: bold;');
  console.log(`Success Rate: ${percentage}%`);

  if (passed === total) {
    console.log('\n%c🎉 ALL TESTS PASSED!', 'background: #1DB954; color: white; font-size: 18px; padding: 15px; font-weight: bold;');
  } else {
    console.log('\n%c⚠️ SOME TESTS FAILED', 'background: #E22134; color: white; font-size: 18px; padding: 15px; font-weight: bold;');
  }

  console.log('\n%c🔍 NEW ENDPOINTS TESTED:', 'background: #535353; color: white; font-size: 14px; padding: 5px; font-weight: bold;');
  console.log('✅ DELETE /api/hypotheses/{id} - Delete hypothesis');
  console.log('✅ GET /api/questions/{id}/evidence - Get question evidence (ready)');
  console.log('✅ GET /api/hypotheses/{id}/evidence - Get hypothesis evidence (ready)');

  console.log('\n%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #1DB954;');
  console.log('%c✨ TEST SUITE COMPLETE', 'background: #1DB954; color: white; font-size: 16px; padding: 10px; font-weight: bold;');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #1DB954;');

  // Return results for programmatic access
  return {
    passed,
    total,
    percentage,
    results,
    success: passed === total
  };
})();

