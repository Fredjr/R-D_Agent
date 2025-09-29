#!/usr/bin/env node

/**
 * Comprehensive Test Suite for R&D Agent
 * Tests all existing functionality + new background processing features
 */

const axios = require('axios');
const WebSocket = require('ws');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'https://r-dagent-production.up.railway.app';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://r-d-agent-frontend.vercel.app';
const TEST_USER_ID = 'fredericle77@gmail.com';
const TEST_PROJECT_ID = 'test-project-' + Date.now();

// Test Results Tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Utility Functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    'info': '📋',
    'success': '✅',
    'error': '❌',
    'warning': '⚠️',
    'test': '🧪'
  }[type] || '📋';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function recordTest(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`${testName}: PASSED ${details}`, 'success');
  } else {
    testResults.failed++;
    log(`${testName}: FAILED ${details}`, 'error');
  }
  testResults.details.push({ testName, passed, details });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test Functions
async function testHealthCheck() {
  log('Testing health check endpoint...', 'test');
  try {
    const response = await axios.get(`${BACKEND_URL}/health`, { timeout: 10000 });
    recordTest('Health Check', response.status === 200, `Status: ${response.status}`);
    return response.data;
  } catch (error) {
    recordTest('Health Check', false, `Error: ${error.message}`);
    return null;
  }
}

async function testRecommendationsEndpoint() {
  log('Testing recommendations endpoint...', 'test');
  try {
    const response = await axios.get(
      `${BACKEND_URL}/recommendations/weekly/${TEST_USER_ID}`,
      {
        headers: { 'User-ID': TEST_USER_ID },
        timeout: 30000
      }
    );
    
    const isValid = response.status === 200 && response.data && Array.isArray(response.data.papers);
    recordTest('Weekly Recommendations', isValid, 
      `Status: ${response.status}, Papers: ${response.data?.papers?.length || 0}`);
    return response.data;
  } catch (error) {
    recordTest('Weekly Recommendations', false, `Error: ${error.message}`);
    return null;
  }
}

async function testBackgroundJobCreation() {
  log('Testing background job creation...', 'test');
  try {
    const jobData = {
      molecule: 'aspirin',
      objective: 'cardiovascular protection',
      max_results: 5,
      project_id: TEST_PROJECT_ID
    };
    
    const response = await axios.post(
      `${BACKEND_URL}/background-jobs/generate-review`,
      jobData,
      {
        headers: { 'User-ID': TEST_USER_ID },
        timeout: 10000
      }
    );
    
    const isValid = response.status === 200 && response.data.job_id;
    recordTest('Background Job Creation', isValid, 
      `Status: ${response.status}, Job ID: ${response.data?.job_id}`);
    return response.data;
  } catch (error) {
    recordTest('Background Job Creation', false, `Error: ${error.message}`);
    return null;
  }
}

async function testBackgroundJobStatus(jobId) {
  if (!jobId) return null;
  
  log('Testing background job status...', 'test');
  try {
    const response = await axios.get(
      `${BACKEND_URL}/background-jobs/${jobId}/status`,
      {
        headers: { 'User-ID': TEST_USER_ID },
        timeout: 10000
      }
    );
    
    const isValid = response.status === 200 && response.data.status;
    recordTest('Background Job Status', isValid, 
      `Status: ${response.status}, Job Status: ${response.data?.status}`);
    return response.data;
  } catch (error) {
    recordTest('Background Job Status', false, `Error: ${error.message}`);
    return null;
  }
}

async function testWebSocketConnection() {
  log('Testing WebSocket connection...', 'test');
  return new Promise((resolve) => {
    try {
      const wsUrl = `${BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws:')}/ws/${encodeURIComponent(TEST_USER_ID)}`;
      const ws = new WebSocket(wsUrl);
      
      let connected = false;
      let messageReceived = false;
      
      const timeout = setTimeout(() => {
        if (!connected) {
          recordTest('WebSocket Connection', false, 'Connection timeout');
          ws.close();
          resolve(false);
        }
      }, 10000);
      
      ws.on('open', () => {
        connected = true;
        log('WebSocket connected successfully', 'success');
        
        // Send a test message
        ws.send(JSON.stringify({
          type: 'ping',
          timestamp: new Date().toISOString()
        }));
      });
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          messageReceived = true;
          log(`WebSocket message received: ${message.type}`, 'info');
          
          clearTimeout(timeout);
          recordTest('WebSocket Connection', true, 
            `Connected and received: ${message.type}`);
          ws.close();
          resolve(true);
        } catch (error) {
          log(`WebSocket message parse error: ${error.message}`, 'error');
        }
      });
      
      ws.on('error', (error) => {
        clearTimeout(timeout);
        recordTest('WebSocket Connection', false, `Error: ${error.message}`);
        resolve(false);
      });
      
      ws.on('close', () => {
        if (connected && messageReceived) {
          log('WebSocket closed successfully', 'info');
        }
      });
      
    } catch (error) {
      recordTest('WebSocket Connection', false, `Error: ${error.message}`);
      resolve(false);
    }
  });
}

async function testDeepDiveEndpoint() {
  log('Testing deep dive endpoint...', 'test');
  try {
    const deepDiveData = {
      pmid: '12345678',
      article_title: 'Test Article for Deep Dive Analysis',
      project_id: TEST_PROJECT_ID
    };
    
    const response = await axios.post(
      `${BACKEND_URL}/background-jobs/deep-dive`,
      deepDiveData,
      {
        headers: { 'User-ID': TEST_USER_ID },
        timeout: 10000
      }
    );
    
    const isValid = response.status === 200 && response.data.job_id;
    recordTest('Deep Dive Job Creation', isValid, 
      `Status: ${response.status}, Job ID: ${response.data?.job_id}`);
    return response.data;
  } catch (error) {
    recordTest('Deep Dive Job Creation', false, `Error: ${error.message}`);
    return null;
  }
}

async function testSemanticAnalysis() {
  log('Testing semantic analysis endpoint...', 'test');
  try {
    const response = await axios.get(
      `${BACKEND_URL}/semantic-analysis/test`,
      {
        headers: { 'User-ID': TEST_USER_ID },
        timeout: 15000
      }
    );
    
    const isValid = response.status === 200;
    recordTest('Semantic Analysis', isValid, 
      `Status: ${response.status}, Available: ${response.data?.available || false}`);
    return response.data;
  } catch (error) {
    recordTest('Semantic Analysis', false, `Error: ${error.message}`);
    return null;
  }
}

async function testProjectEndpoints() {
  log('Testing project management endpoints...', 'test');
  try {
    // Test project creation
    const projectData = {
      project_name: `Test Project ${Date.now()}`,
      description: 'Automated test project',
      tags: ['test', 'automation']
    };
    
    const createResponse = await axios.post(
      `${BACKEND_URL}/projects`,
      projectData,
      {
        headers: { 'User-ID': TEST_USER_ID },
        timeout: 10000
      }
    );
    
    const projectCreated = createResponse.status === 200 && createResponse.data.project_id;
    recordTest('Project Creation', projectCreated, 
      `Status: ${createResponse.status}, Project ID: ${createResponse.data?.project_id}`);
    
    if (projectCreated) {
      // Test project listing
      const listResponse = await axios.get(
        `${BACKEND_URL}/projects`,
        {
          headers: { 'User-ID': TEST_USER_ID },
          timeout: 10000
        }
      );
      
      const projectsListed = listResponse.status === 200 && Array.isArray(listResponse.data);
      recordTest('Project Listing', projectsListed, 
        `Status: ${listResponse.status}, Projects: ${listResponse.data?.length || 0}`);
    }
    
    return createResponse.data;
  } catch (error) {
    recordTest('Project Management', false, `Error: ${error.message}`);
    return null;
  }
}

// Main Test Runner
async function runComprehensiveTests() {
  log('🚀 Starting Comprehensive R&D Agent Test Suite', 'info');
  log(`Backend URL: ${BACKEND_URL}`, 'info');
  log(`Frontend URL: ${FRONTEND_URL}`, 'info');
  log(`Test User: ${TEST_USER_ID}`, 'info');
  log('=' * 60, 'info');
  
  // Core Infrastructure Tests
  log('📋 PHASE 1: Core Infrastructure Tests', 'info');
  await testHealthCheck();
  await sleep(1000);
  
  // Recommendation System Tests
  log('📋 PHASE 2: Recommendation System Tests', 'info');
  await testRecommendationsEndpoint();
  await sleep(2000);
  
  // Background Processing Tests
  log('📋 PHASE 3: Background Processing Tests', 'info');
  const generateReviewJob = await testBackgroundJobCreation();
  await sleep(1000);
  
  if (generateReviewJob?.job_id) {
    await testBackgroundJobStatus(generateReviewJob.job_id);
    await sleep(1000);
  }
  
  const deepDiveJob = await testDeepDiveEndpoint();
  await sleep(1000);
  
  if (deepDiveJob?.job_id) {
    await testBackgroundJobStatus(deepDiveJob.job_id);
    await sleep(1000);
  }
  
  // WebSocket Tests
  log('📋 PHASE 4: WebSocket Communication Tests', 'info');
  await testWebSocketConnection();
  await sleep(2000);
  
  // Project Management Tests
  log('📋 PHASE 5: Project Management Tests', 'info');
  await testProjectEndpoints();
  await sleep(1000);
  
  // Advanced Features Tests
  log('📋 PHASE 6: Advanced Features Tests', 'info');
  await testSemanticAnalysis();
  await sleep(1000);
  
  // Test Results Summary
  log('=' * 60, 'info');
  log('🎯 TEST RESULTS SUMMARY', 'info');
  log(`Total Tests: ${testResults.total}`, 'info');
  log(`Passed: ${testResults.passed}`, 'success');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'info');
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`, 
    testResults.failed === 0 ? 'success' : 'warning');
  
  if (testResults.failed > 0) {
    log('❌ FAILED TESTS:', 'error');
    testResults.details
      .filter(test => !test.passed)
      .forEach(test => {
        log(`  - ${test.testName}: ${test.details}`, 'error');
      });
  }
  
  log('=' * 60, 'info');
  log('✅ Comprehensive testing completed!', 'success');
  
  return testResults;
}

// Run tests if called directly
if (require.main === module) {
  runComprehensiveTests()
    .then(results => {
      process.exit(results.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      log(`Test suite failed: ${error.message}`, 'error');
      process.exit(1);
    });
}

module.exports = { runComprehensiveTests, testResults };
