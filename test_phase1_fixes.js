#!/usr/bin/env node

/**
 * PHASE 1 COMPREHENSIVE TESTING SCRIPT
 * Tests all Phase 1 critical fixes to ensure they're working properly
 */

const BASE_URL = 'https://r-dagent-production.up.railway.app';
const FRONTEND_URL = 'https://frontend-psi-seven-85.vercel.app';
const TEST_USER = 'fredericle77@gmail.com';
const TEST_PROJECT = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';

console.log('🚀 PHASE 1 COMPREHENSIVE TESTING - ALL CRITICAL FIXES');
console.log('=' * 60);

async function testBackgroundJobs() {
    console.log('\n📋 TESTING: Background Job Processing (Fix #1)');
    console.log('-'.repeat(50));
    
    try {
        // Test Generate Review Job
        console.log('🧪 Testing Generate Review Background Job...');
        const reviewResponse = await fetch(`${BASE_URL}/background-jobs/generate-review`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-ID': TEST_USER
            },
            body: JSON.stringify({
                project_id: TEST_PROJECT,
                molecule: 'acetaminophen',
                objective: 'pain relief mechanisms',
                max_results: 3
            })
        });
        
        if (!reviewResponse.ok) {
            throw new Error(`HTTP ${reviewResponse.status}: ${await reviewResponse.text()}`);
        }
        
        const reviewJob = await reviewResponse.json();
        console.log(`✅ Generate Review Job Created: ${reviewJob.job_id}`);
        
        // Wait and check status
        await new Promise(resolve => setTimeout(resolve, 8000));
        
        const statusResponse = await fetch(`${BASE_URL}/background-jobs/${reviewJob.job_id}/status`, {
            headers: { 'User-ID': TEST_USER }
        });
        
        const status = await statusResponse.json();
        console.log(`📊 Job Status: ${status.status}`);
        
        if (status.status === 'completed') {
            console.log('✅ BACKGROUND JOBS: WORKING PERFECTLY');
            console.log(`   Report ID: ${status.result_data?.report_id}`);
            console.log(`   Duration: ${new Date(status.completed_at) - new Date(status.created_at)}ms`);
        } else if (status.status === 'failed') {
            console.log('❌ BACKGROUND JOBS: STILL FAILING');
            console.log(`   Error: ${status.error_message}`);
            return false;
        } else {
            console.log('⏳ BACKGROUND JOBS: STILL PROCESSING');
        }
        
        // Test Deep Dive Job
        console.log('\n🧪 Testing Deep Dive Background Job...');
        const deepDiveResponse = await fetch(`${BASE_URL}/background-jobs/deep-dive`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-ID': TEST_USER
            },
            body: JSON.stringify({
                project_id: TEST_PROJECT,
                pmid: '35123456',
                article_title: 'Test Deep Dive Analysis'
            })
        });
        
        if (!deepDiveResponse.ok) {
            throw new Error(`HTTP ${deepDiveResponse.status}: ${await deepDiveResponse.text()}`);
        }
        
        const deepDiveJob = await deepDiveResponse.json();
        console.log(`✅ Deep Dive Job Created: ${deepDiveJob.job_id}`);
        
        // Wait and check status
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const deepDiveStatusResponse = await fetch(`${BASE_URL}/background-jobs/${deepDiveJob.job_id}/status`, {
            headers: { 'User-ID': TEST_USER }
        });
        
        const deepDiveStatus = await deepDiveStatusResponse.json();
        console.log(`📊 Deep Dive Status: ${deepDiveStatus.status}`);
        
        if (deepDiveStatus.status === 'completed') {
            console.log('✅ DEEP DIVE JOBS: WORKING PERFECTLY');
            console.log(`   Analysis ID: ${deepDiveStatus.result_data?.analysis_id}`);
        } else if (deepDiveStatus.status === 'failed') {
            console.log('❌ DEEP DIVE JOBS: STILL FAILING');
            console.log(`   Error: ${deepDiveStatus.error_message}`);
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.log('❌ BACKGROUND JOBS TEST FAILED');
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

async function testSynchronousReview() {
    console.log('\n📝 TESTING: Synchronous Review Generation (Fix #2)');
    console.log('-'.repeat(50));
    
    try {
        console.log('🧪 Testing Synchronous Review Endpoint...');
        const startTime = Date.now();
        
        const response = await fetch(`${FRONTEND_URL}/api/proxy/generate-review-sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-ID': TEST_USER
            },
            body: JSON.stringify({
                project_id: TEST_PROJECT,
                molecule: 'metformin',
                objective: 'diabetes treatment analysis',
                max_results: 3
            })
        });
        
        const duration = Date.now() - startTime;
        console.log(`⏱️  Response Time: ${duration}ms`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.log('❌ SYNCHRONOUS REVIEW: STILL FAILING');
            console.log(`   Status: ${response.status}`);
            console.log(`   Error: ${errorText}`);
            return false;
        }
        
        const result = await response.json();
        console.log('✅ SYNCHRONOUS REVIEW: WORKING PERFECTLY');
        console.log(`   Analysis ID: ${result.analysis_id}`);
        console.log(`   Job ID: ${result.job_id}`);
        console.log(`   Saved to DB: ${result.saved_to_database}`);
        console.log(`   Duration: ${duration}ms`);
        
        return true;
        
    } catch (error) {
        console.log('❌ SYNCHRONOUS REVIEW TEST FAILED');
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

async function testProjectTimeline() {
    console.log('\n📊 TESTING: Project Timeline System (Fix #3)');
    console.log('-'.repeat(50));
    
    try {
        console.log('🧪 Testing Project Timeline Endpoint...');
        const startTime = Date.now();
        
        const response = await fetch(`${BASE_URL}/projects/${TEST_PROJECT}/timeline?period_strategy=lustrum&min_articles=2`, {
            headers: { 'User-ID': TEST_USER }
        });
        
        const duration = Date.now() - startTime;
        console.log(`⏱️  Response Time: ${duration}ms`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.log('❌ PROJECT TIMELINE: STILL FAILING');
            console.log(`   Status: ${response.status}`);
            console.log(`   Error: ${errorText}`);
            return false;
        }
        
        const result = await response.json();
        console.log('✅ PROJECT TIMELINE: WORKING PERFECTLY');
        console.log(`   Project: ${result.project.name}`);
        console.log(`   Total Articles: ${result.project.total_articles}`);
        console.log(`   Timeline Periods: ${result.timeline_data.periods.length}`);
        console.log(`   Year Range: ${result.timeline_data.year_range[0]}-${result.timeline_data.year_range[1]}`);
        console.log(`   Duration: ${duration}ms`);
        
        return true;
        
    } catch (error) {
        console.log('❌ PROJECT TIMELINE TEST FAILED');
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

async function testErrorHandling() {
    console.log('\n🛡️  TESTING: Error Handling & Timeouts (Fix #4)');
    console.log('-'.repeat(50));
    
    const tests = [
        {
            name: 'Invalid Project ID',
            url: `${BASE_URL}/projects/invalid-project-id/timeline`,
            expectedStatus: 404
        },
        {
            name: 'Missing User-ID Header',
            url: `${BASE_URL}/projects/${TEST_PROJECT}/timeline`,
            headers: {},
            expectedStatus: 422
        },
        {
            name: 'Invalid Background Job ID',
            url: `${BASE_URL}/background-jobs/invalid-job-id/status`,
            expectedStatus: 404
        }
    ];
    
    let passedTests = 0;
    
    for (const test of tests) {
        try {
            console.log(`🧪 Testing: ${test.name}...`);
            
            const headers = test.headers || { 'User-ID': TEST_USER };
            const response = await fetch(test.url, { headers });
            
            if (response.status === test.expectedStatus) {
                console.log(`✅ ${test.name}: Correct error handling (${response.status})`);
                passedTests++;
            } else {
                console.log(`❌ ${test.name}: Wrong status (expected ${test.expectedStatus}, got ${response.status})`);
            }
            
        } catch (error) {
            console.log(`❌ ${test.name}: Test failed - ${error.message}`);
        }
    }
    
    console.log(`📊 Error Handling Tests: ${passedTests}/${tests.length} passed`);
    return passedTests === tests.length;
}

async function runAllTests() {
    console.log(`🕐 Started at: ${new Date().toISOString()}`);
    
    const results = {
        backgroundJobs: await testBackgroundJobs(),
        synchronousReview: await testSynchronousReview(),
        projectTimeline: await testProjectTimeline(),
        errorHandling: await testErrorHandling()
    };
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 PHASE 1 TESTING RESULTS SUMMARY');
    console.log('='.repeat(60));
    
    const fixes = [
        { name: 'Background Job Processing', status: results.backgroundJobs, critical: true },
        { name: 'Synchronous Review Generation', status: results.synchronousReview, critical: true },
        { name: 'Project Timeline System', status: results.projectTimeline, critical: true },
        { name: 'Error Handling & Timeouts', status: results.errorHandling, critical: false }
    ];
    
    let criticalPassed = 0;
    let totalPassed = 0;
    
    fixes.forEach(fix => {
        const icon = fix.status ? '✅' : '❌';
        const priority = fix.critical ? '[CRITICAL]' : '[ENHANCEMENT]';
        console.log(`${icon} ${fix.name} ${priority}`);
        
        if (fix.status) {
            totalPassed++;
            if (fix.critical) criticalPassed++;
        }
    });
    
    console.log('\n📊 FINAL RESULTS:');
    console.log(`   Critical Fixes: ${criticalPassed}/3 ✅`);
    console.log(`   Total Fixes: ${totalPassed}/4 ✅`);
    
    if (criticalPassed === 3) {
        console.log('\n🎉 PHASE 1 COMPLETE! All critical fixes are working.');
        console.log('✅ Ready to proceed to Phase 2: High Priority Features');
    } else {
        console.log('\n⚠️  PHASE 1 INCOMPLETE! Critical fixes still needed.');
        console.log('❌ Cannot proceed to Phase 2 until all critical fixes pass.');
    }
    
    console.log(`\n🕐 Completed at: ${new Date().toISOString()}`);
}

// Run the tests
runAllTests().catch(console.error);
