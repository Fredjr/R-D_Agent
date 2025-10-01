/**
 * 🚀 PHASE 3 COMPLETE TEST SUITE
 * 
 * Testing all Phase 3 features:
 * 1. Collection Network Features
 * 2. Collaboration Management
 * 
 * Expected: 100% success rate (all tests passing)
 */

const BASE_URL = 'https://r-dagent-production.up.railway.app';
const USER_ID = 'fredericle77@gmail.com';

// Test configuration
const TESTS = [
    // 🔗 Collection Network Features (2 tests)
    {
        name: "Collection Network - Working Collection",
        method: "GET",
        url: `${BASE_URL}/collections/0de0bf09-9ac8-4eed-b632-0261981b204d/network`,
        headers: { "User-ID": USER_ID },
        expectedStatus: 200,
        category: "collection-network"
    },
    {
        name: "Collection Network - Empty Collection",
        method: "GET", 
        url: `${BASE_URL}/collections/34db811e-3d25-4e2f-af01-39c0daf15003/network`,
        headers: { "User-ID": USER_ID },
        expectedStatus: 200,
        category: "collection-network"
    },
    
    // 👥 Collaboration Management (3 tests)
    {
        name: "Collaboration Management Dashboard",
        method: "GET",
        url: `${BASE_URL}/collaborations/manage`,
        headers: { "User-ID": USER_ID },
        expectedStatus: 200,
        category: "collaboration-management"
    },
    {
        name: "Collaboration Invite - Missing Data",
        method: "POST",
        url: `${BASE_URL}/collaborations/invite`,
        headers: { "User-ID": USER_ID, "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: "test" }), // Missing email
        expectedStatus: 400,
        category: "collaboration-management"
    },
    {
        name: "Collaboration Response - Invalid Invitation",
        method: "POST",
        url: `${BASE_URL}/collaborations/respond`,
        headers: { "User-ID": USER_ID, "Content-Type": "application/json" },
        body: JSON.stringify({ invitation_id: "invalid", response: "accept" }),
        expectedStatus: 404,
        category: "collaboration-management"
    }
];

// Test execution
async function runTest(test) {
    const startTime = Date.now();
    
    try {
        console.log(`🧪 [${new Date().toISOString()}] [+${Date.now() - globalStartTime}ms] 🧪 ${test.name}...`);
        
        const options = {
            method: test.method,
            headers: test.headers || {}
        };
        
        if (test.body) {
            options.body = test.body;
        }
        
        const response = await fetch(test.url, options);
        const responseTime = Date.now() - startTime;
        
        // Check status code
        const statusMatch = response.status === test.expectedStatus;
        
        if (statusMatch) {
            console.log(`✅ [${new Date().toISOString()}] [+${Date.now() - globalStartTime}ms] ✅ ${test.name} - SUCCESS`);
            
            // Log response data for successful tests
            if (response.status === 200) {
                try {
                    const data = await response.json();
                    console.log(`VM592:62 Data: ${JSON.stringify({
                        status: response.status,
                        responseTime: `${responseTime}ms`,
                        category: test.category,
                        dataKeys: Object.keys(data),
                        hasData: Object.keys(data).length > 0
                    })}`);
                } catch (e) {
                    console.log(`VM592:62 Data: ${JSON.stringify({
                        status: response.status,
                        responseTime: `${responseTime}ms`,
                        category: test.category,
                        hasData: false
                    })}`);
                }
            } else {
                console.log(`VM592:62 Data: ${JSON.stringify({
                    status: response.status,
                    responseTime: `${responseTime}ms`,
                    category: test.category,
                    expectedError: true
                })}`);
            }
            
            return { success: true, responseTime, status: response.status };
        } else {
            console.log(`❌ [${new Date().toISOString()}] [+${Date.now() - globalStartTime}ms] ❌ ${test.name} - FAILED`);
            console.log(`VM592:64 Expected: ${test.expectedStatus}, Got: ${response.status}`);
            
            // Try to get error details
            try {
                const errorData = await response.text();
                console.log(`VM592:65 Error: ${errorData.substring(0, 200)}...`);
            } catch (e) {
                console.log(`VM592:65 Error: Could not read response body`);
            }
            
            return { success: false, responseTime, status: response.status, expected: test.expectedStatus };
        }
        
    } catch (error) {
        const responseTime = Date.now() - startTime;
        console.log(`❌ [${new Date().toISOString()}] [+${Date.now() - globalStartTime}ms] ❌ ${test.name} - NETWORK ERROR`);
        console.log(`VM592:66 Network Error: ${error.message}`);
        return { success: false, responseTime, error: error.message };
    }
}

// Main execution
const globalStartTime = Date.now();

async function runAllTests() {
    console.log(`🚀 [${new Date().toISOString()}] [+0ms] 🚀 PHASE 3 COMPLETE TEST SUITE STARTING...`);
    console.log(`📊 Total Tests: ${TESTS.length}`);
    console.log(`🎯 Target: 100% Success Rate`);
    console.log('');
    
    const results = [];
    
    for (const test of TESTS) {
        const result = await runTest(test);
        results.push({ ...result, name: test.name, category: test.category });
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Calculate statistics
    const totalTests = results.length;
    const successfulTests = results.filter(r => r.success).length;
    const failedTests = totalTests - successfulTests;
    const successRate = ((successfulTests / totalTests) * 100).toFixed(1);
    const totalTime = Date.now() - globalStartTime;
    const avgResponseTime = Math.round(results.reduce((sum, r) => sum + r.responseTime, 0) / totalTests);
    
    // Category breakdown
    const categories = {};
    results.forEach(result => {
        if (!categories[result.category]) {
            categories[result.category] = { total: 0, success: 0 };
        }
        categories[result.category].total++;
        if (result.success) categories[result.category].success++;
    });
    
    console.log('');
    console.log('🎉 ===============================================');
    console.log('🎉 PHASE 3 COMPLETE TEST RESULTS');
    console.log('🎉 ===============================================');
    console.log('');
    console.log(`📊 OVERALL PERFORMANCE: ${successRate}% Success Rate`);
    console.log(`⏱️  Total Duration: ${Math.floor(totalTime / 1000 / 60)} minutes ${Math.floor((totalTime / 1000) % 60)} seconds (${totalTime}ms)`);
    console.log(`⚡ Average Response Time: ${avgResponseTime}ms`);
    console.log(`✅ Successful Tests: ${successfulTests}/${totalTests}`);
    console.log(`❌ Failed Tests: ${failedTests}/${totalTests}`);
    console.log('');
    
    // Category breakdown
    console.log('🔍 DETAILED BREAKDOWN BY CATEGORY:');
    console.log('');
    Object.entries(categories).forEach(([category, stats]) => {
        const categoryRate = ((stats.success / stats.total) * 100).toFixed(1);
        const status = categoryRate === '100.0' ? '✅' : categoryRate >= '80.0' ? '⚠️' : '❌';
        console.log(`${status} **${category.toUpperCase()}**: ${categoryRate}% (${stats.success}/${stats.total})`);
    });
    
    console.log('');
    console.log('🎯 PHASE 3 FEATURE STATUS:');
    console.log('');
    console.log(`🔗 **Collection Network Features**: ${categories['collection-network'] ? ((categories['collection-network'].success / categories['collection-network'].total) * 100).toFixed(1) : 0}% Success`);
    console.log(`👥 **Collaboration Management**: ${categories['collaboration-management'] ? ((categories['collaboration-management'].success / categories['collaboration-management'].total) * 100).toFixed(1) : 0}% Success`);
    
    if (successRate === '100.0') {
        console.log('');
        console.log('🎉 🎉 🎉 PHASE 3 COMPLETE - ALL TESTS PASSING! 🎉 🎉 🎉');
        console.log('🚀 Collection Network Features and Collaboration Management are fully operational!');
    } else if (successRate >= '90.0') {
        console.log('');
        console.log('✅ PHASE 3 MOSTLY COMPLETE - Excellent performance!');
        console.log('🔧 Minor issues to address for 100% success rate.');
    } else {
        console.log('');
        console.log('⚠️  PHASE 3 NEEDS ATTENTION - Some features require fixes.');
        console.log('🔧 Review failed tests and implement necessary fixes.');
    }
    
    console.log('');
    console.log('===============================================');
}

// Run the tests
runAllTests().catch(console.error);
