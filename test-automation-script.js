// 🧪 AUTOMATED TESTING SCRIPT FOR WEEKLY MIX & SEMANTIC DISCOVERY
// Run this in browser console to automatically test key functionality

console.log('🚀 Starting Comprehensive Test Suite...');

// Test Configuration
const TEST_CONFIG = {
  testUser: 'test@example.com',
  baseUrl: window.location.origin,
  timeout: 5000,
  verbose: true
};

// Utility Functions
const log = (message, type = 'info') => {
  const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '🔍';
  console.log(`${emoji} ${message}`);
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const testApiEndpoint = async (url, expectedFields = []) => {
  try {
    const response = await fetch(url, {
      headers: {
        'User-ID': TEST_CONFIG.testUser,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    log(`API Response for ${url}:`, 'info');
    console.log(JSON.stringify(data, null, 2));
    
    // Check for expected fields
    const missingFields = expectedFields.filter(field => !data[field] && !data.recommendations?.[field]);
    if (missingFields.length > 0) {
      log(`Missing expected fields: ${missingFields.join(', ')}`, 'warning');
    }
    
    return { success: true, data, response };
  } catch (error) {
    log(`API Error for ${url}: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
};

const testUIElement = (selector, expectedText = null) => {
  const element = document.querySelector(selector);
  if (!element) {
    log(`UI Element not found: ${selector}`, 'error');
    return false;
  }
  
  if (expectedText && !element.textContent.includes(expectedText)) {
    log(`UI Element text mismatch. Expected: "${expectedText}", Found: "${element.textContent}"`, 'warning');
  }
  
  log(`UI Element found: ${selector}`, 'success');
  return true;
};

// Test Suite Functions
const testBackendAPIs = async () => {
  log('🔧 Testing Backend APIs...', 'info');
  
  const apiTests = [
    {
      name: 'Cross-Pollination API',
      url: `/api/proxy/recommendations/cross-pollination/${TEST_CONFIG.testUser}`,
      expectedFields: ['cross_pollination', 'recommendations']
    },
    {
      name: 'Trending API', 
      url: `/api/proxy/recommendations/trending/${TEST_CONFIG.testUser}`,
      expectedFields: ['trending_in_field', 'recommendations']
    },
    {
      name: 'Papers-for-You API',
      url: `/api/proxy/recommendations/papers-for-you/${TEST_CONFIG.testUser}`,
      expectedFields: ['papers_for_you', 'recommendations']
    }
  ];
  
  const results = {};
  for (const test of apiTests) {
    log(`Testing ${test.name}...`);
    results[test.name] = await testApiEndpoint(test.url, test.expectedFields);
    await wait(1000); // Rate limiting
  }
  
  return results;
};

const testHomePageElements = () => {
  log('🏠 Testing Home Page Elements...', 'info');
  
  const homePageTests = [
    {
      name: 'Cross-Domain Discoveries Section',
      selector: '[data-testid="cross-domain-section"], .cross-domain, h3:contains("Cross-Domain")',
      shouldNotContain: '0 papers'
    },
    {
      name: 'Trending Now Section',
      selector: '[data-testid="trending-section"], .trending, h3:contains("Trending Now")',
      shouldNotContain: '0 papers'
    },
    {
      name: 'For You Section',
      selector: '[data-testid="for-you-section"], .for-you, h3:contains("For You")',
      shouldNotContain: '0 papers'
    }
  ];
  
  const results = {};
  homePageTests.forEach(test => {
    const element = document.querySelector(test.selector);
    if (element) {
      const hasZeroPapers = element.textContent.includes('0 papers');
      results[test.name] = {
        found: true,
        hasZeroPapers,
        text: element.textContent.substring(0, 100) + '...'
      };
      
      if (hasZeroPapers) {
        log(`${test.name}: Still showing "0 papers"`, 'error');
      } else {
        log(`${test.name}: Shows dynamic count`, 'success');
      }
    } else {
      results[test.name] = { found: false };
      log(`${test.name}: Element not found`, 'error');
    }
  });
  
  return results;
};

const testDiscoverPageElements = () => {
  log('🔍 Testing Discover Page Elements...', 'info');
  
  const discoverTests = [
    {
      name: 'Semantic Discovery Interface',
      selector: '[data-testid="semantic-discovery"], .semantic-discovery',
      required: true
    },
    {
      name: 'Smart Recommendations Button',
      selector: 'button:contains("Smart Recommendations"), [data-testid="smart-recommendations"]',
      required: true
    },
    {
      name: 'Semantic Search Button',
      selector: 'button:contains("Semantic Search"), [data-testid="semantic-search"]',
      required: true
    },
    {
      name: 'Smart Filters Button',
      selector: 'button:contains("Smart Filters"), [data-testid="smart-filters"]',
      required: true
    },
    {
      name: 'Cross-Domain Discovery Button (Should be REMOVED)',
      selector: 'button:contains("Cross-Domain Discovery")',
      required: false,
      shouldNotExist: true
    },
    {
      name: 'Trending Now Button (Should be REMOVED)',
      selector: 'button:contains("Trending Now")',
      required: false,
      shouldNotExist: true
    },
    {
      name: 'For You Button (Should be REMOVED)',
      selector: 'button:contains("For You")',
      required: false,
      shouldNotExist: true
    }
  ];
  
  const results = {};
  discoverTests.forEach(test => {
    const element = document.querySelector(test.selector);
    const exists = !!element;
    
    results[test.name] = { exists, shouldNotExist: test.shouldNotExist };
    
    if (test.shouldNotExist) {
      if (exists) {
        log(`${test.name}: Should be removed but still exists`, 'error');
      } else {
        log(`${test.name}: Correctly removed`, 'success');
      }
    } else if (test.required) {
      if (exists) {
        log(`${test.name}: Found`, 'success');
      } else {
        log(`${test.name}: Missing (required)`, 'error');
      }
    }
  });
  
  return results;
};

const testSemanticSections = () => {
  log('🎯 Testing Semantic Recommendation Sections...', 'info');
  
  const sectionTests = [
    {
      name: 'Cross-Domain Insights Section',
      selector: '[data-testid="cross-domain-insights"], .cross-domain-insights, h3:contains("Cross-Domain Insights")',
      shouldNotContain: 'No papers found'
    },
    {
      name: 'Trending Discoveries Section',
      selector: '[data-testid="trending-discoveries"], .trending-discoveries, h3:contains("Trending Discoveries")',
      shouldNotContain: 'No papers found'
    },
    {
      name: 'Semantic Matches Section',
      selector: '[data-testid="semantic-matches"], .semantic-matches, h3:contains("Semantic Matches")',
      shouldNotContain: 'No papers found'
    }
  ];
  
  const results = {};
  sectionTests.forEach(test => {
    const element = document.querySelector(test.selector);
    if (element) {
      const hasNoPapers = element.textContent.includes('No papers found');
      const paperCount = (element.textContent.match(/\d+\s+papers?/g) || []).length;
      
      results[test.name] = {
        found: true,
        hasNoPapers,
        paperCount,
        text: element.textContent.substring(0, 200) + '...'
      };
      
      if (hasNoPapers) {
        log(`${test.name}: Still showing "No papers found"`, 'error');
      } else {
        log(`${test.name}: Shows papers (${paperCount} detected)`, 'success');
      }
    } else {
      results[test.name] = { found: false };
      log(`${test.name}: Section not found`, 'error');
    }
  });
  
  return results;
};

const checkConsoleForLogs = () => {
  log('📊 Checking for Expected Console Logs...', 'info');
  
  // This is a simplified check - in real testing, you'd monitor console.log calls
  const expectedLogs = [
    'Weekly Mix',
    'semantic recommendations',
    'API response',
    'recommendations loaded'
  ];
  
  log('Expected console logs to look for:', 'info');
  expectedLogs.forEach(logPattern => {
    log(`  - Look for: "${logPattern}"`, 'info');
  });
  
  return { expectedLogs };
};

// Main Test Runner
const runComprehensiveTests = async () => {
  log('🧪 COMPREHENSIVE TEST SUITE STARTING', 'info');
  log('='.repeat(50), 'info');
  
  const testResults = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    tests: {}
  };
  
  try {
    // Test 1: Backend APIs
    testResults.tests.backendAPIs = await testBackendAPIs();
    
    // Test 2: Home Page Elements (if on home page)
    if (window.location.pathname.includes('/home') || window.location.pathname === '/') {
      testResults.tests.homePageElements = testHomePageElements();
    }
    
    // Test 3: Discover Page Elements (if on discover page)
    if (window.location.pathname.includes('/discover')) {
      testResults.tests.discoverPageElements = testDiscoverPageElements();
      testResults.tests.semanticSections = testSemanticSections();
    }
    
    // Test 4: Console Logs Check
    testResults.tests.consoleLogs = checkConsoleForLogs();
    
    log('='.repeat(50), 'info');
    log('🎉 COMPREHENSIVE TEST SUITE COMPLETED', 'success');
    log('📊 Full test results:', 'info');
    console.log(JSON.stringify(testResults, null, 2));
    
    return testResults;
    
  } catch (error) {
    log(`Test suite error: ${error.message}`, 'error');
    testResults.error = error.message;
    return testResults;
  }
};

// Auto-run if script is executed
if (typeof window !== 'undefined') {
  // Export functions for manual testing
  window.testSuite = {
    runAll: runComprehensiveTests,
    testAPIs: testBackendAPIs,
    testHomePage: testHomePageElements,
    testDiscoverPage: testDiscoverPageElements,
    testSemanticSections: testSemanticSections
  };
  
  log('🔧 Test suite loaded! Run window.testSuite.runAll() to start comprehensive testing', 'success');
  log('📋 Available individual tests:', 'info');
  log('  - window.testSuite.testAPIs()', 'info');
  log('  - window.testSuite.testHomePage()', 'info');
  log('  - window.testSuite.testDiscoverPage()', 'info');
  log('  - window.testSuite.testSemanticSections()', 'info');
}

// For Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runComprehensiveTests,
    testBackendAPIs,
    testHomePageElements,
    testDiscoverPageElements,
    testSemanticSections
  };
}
