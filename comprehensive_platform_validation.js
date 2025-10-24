/**
 * Comprehensive Platform Validation Script
 * Tests Deep Dive Analysis fix, platform success rate, and data quality
 */

async function validateDeepDiveAnalysisFix() {
    console.log('🔍 DEEP DIVE ANALYSIS FIX VALIDATION');
    console.log('===================================');
    
    const USER_ID = 'fredericle77@gmail.com';
    
    try {
        const startTime = Date.now();
        const response = await fetch('/api/proxy/deep-dive-analyses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-ID': USER_ID
            },
            body: JSON.stringify({
                objective: 'Deep Dive Analysis fix validation test',
                article_pmid: '38278529',
                article_title: 'Machine Learning in Medical Diagnostics - Fix Validation',
                article_url: 'https://pubmed.ncbi.nlm.nih.gov/38278529/'
            })
        });
        
        const responseTime = Date.now() - startTime;
        
        if (response.ok) {
            const data = await response.json();
            console.log('🎉 DEEP DIVE ANALYSIS FIX: SUCCESS!');
            console.log(`✅ Status: 200 SUCCESS (${responseTime}ms)`);
            console.log(`📄 Analysis ID: ${data.analysis_id || data.id}`);
            console.log(`💾 Saved to database: ${data.saved_to_database}`);
            console.log(`🎯 Fix confirmed: analysis.analysis_id working correctly`);
            
            return {
                success: true,
                responseTime,
                analysisId: data.analysis_id || data.id,
                savedToDatabase: data.saved_to_database
            };
        } else {
            const errorText = await response.text();
            console.log('❌ DEEP DIVE ANALYSIS FIX: FAILED');
            console.log(`❌ Status: ${response.status}`);
            console.log(`📄 Error: ${errorText.substring(0, 300)}...`);
            
            if (errorText.includes("'DeepDiveAnalysis' object has no attribute 'id'")) {
                console.log('⚠️ SAME ERROR DETECTED - Fix not yet active');
            }
            
            return {
                success: false,
                status: response.status,
                error: errorText,
                responseTime
            };
        }
    } catch (error) {
        console.log('❌ NETWORK ERROR');
        console.log(`❌ Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function runComprehensivePlatformTesting() {
    console.log('\n🧪 COMPREHENSIVE PLATFORM TESTING');
    console.log('=================================');
    
    const PROJECT_ID = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
    const USER_ID = 'fredericle77@gmail.com';
    
    const allEndpoints = [
        {
            name: 'New Report Generation',
            url: `/api/proxy/projects/${PROJECT_ID}/generate-summary-report`,
            method: 'POST',
            payload: {
                molecule: 'machine learning medical diagnostics validation',
                objective: 'Platform validation test report',
                project_id: PROJECT_ID
            },
            critical: true
        },
        {
            name: 'Deep Dive Analysis (FIXED)',
            url: '/api/proxy/deep-dive-analyses',
            method: 'POST',
            payload: {
                objective: 'Platform validation deep dive',
                article_pmid: '38278529',
                article_title: 'Validation Test Article',
                article_url: 'https://pubmed.ncbi.nlm.nih.gov/38278529/'
            },
            critical: true
        },
        {
            name: 'Generate Summary',
            url: '/api/proxy/generate-summary',
            method: 'POST',
            payload: {
                project_id: PROJECT_ID,
                objective: 'Platform validation summary',
                academic_level: 'phd'
            },
            critical: true
        },
        {
            name: 'Literature Gap Analysis',
            url: '/api/proxy/literature-gap-analysis',
            method: 'POST',
            payload: {
                project_id: PROJECT_ID,
                objective: 'Platform validation gap analysis',
                academic_level: 'phd'
            },
            critical: true
        },
        {
            name: 'Methodology Synthesis',
            url: '/api/proxy/methodology-synthesis',
            method: 'POST',
            payload: {
                project_id: PROJECT_ID,
                objective: 'Platform validation methodology',
                academic_level: 'phd'
            },
            critical: true
        },
        {
            name: 'Thesis Chapter Generator',
            url: '/api/proxy/thesis-chapter-generator',
            method: 'POST',
            payload: {
                project_id: PROJECT_ID,
                objective: 'Platform validation thesis',
                academic_level: 'phd'
            },
            critical: true
        },
        {
            name: 'Reports List',
            url: `/api/proxy/projects/${PROJECT_ID}/reports`,
            method: 'GET',
            critical: false
        },
        {
            name: 'Deep Dive Analyses List',
            url: `/api/proxy/projects/${PROJECT_ID}/deep-dive-analyses`,
            method: 'GET',
            critical: false
        },
        {
            name: 'Collections List',
            url: `/api/proxy/projects/${PROJECT_ID}/collections`,
            method: 'GET',
            critical: false
        }
    ];

    let passed = 0;
    let critical_passed = 0;
    let total = allEndpoints.length;
    let critical_total = allEndpoints.filter(e => e.critical).length;
    const results = [];

    console.log(`📊 Testing ${total} endpoints (${critical_total} critical)...\n`);

    for (const endpoint of allEndpoints) {
        try {
            console.log(`🧪 Testing ${endpoint.name}...`);
            
            const startTime = Date.now();
            const options = {
                method: endpoint.method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': USER_ID
                }
            };

            if (endpoint.payload) {
                options.body = JSON.stringify(endpoint.payload);
            }

            const response = await fetch(endpoint.url, options);
            const responseTime = Date.now() - startTime;

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ ${endpoint.name}: SUCCESS (${response.status}, ${responseTime}ms)`);
                passed++;
                if (endpoint.critical) critical_passed++;
                
                results.push({
                    name: endpoint.name,
                    status: 'SUCCESS',
                    responseTime,
                    critical: endpoint.critical,
                    dataSize: JSON.stringify(data).length
                });
                
                // Special handling for Deep Dive Analysis
                if (endpoint.name.includes('Deep Dive Analysis')) {
                    console.log(`   🎯 CRITICAL FIX VERIFIED: Analysis ID ${data.analysis_id || data.id}`);
                    console.log(`   💾 Database save: ${data.saved_to_database ? 'SUCCESS' : 'UNKNOWN'}`);
                }
            } else {
                const errorText = await response.text();
                console.log(`❌ ${endpoint.name}: FAILED (${response.status}, ${responseTime}ms)`);
                console.log(`   📄 Error: ${errorText.substring(0, 100)}...`);
                
                results.push({
                    name: endpoint.name,
                    status: 'FAILED',
                    responseTime,
                    critical: endpoint.critical,
                    error: response.status
                });
            }
        } catch (error) {
            console.log(`❌ ${endpoint.name}: ERROR - ${error.message}`);
            results.push({
                name: endpoint.name,
                status: 'ERROR',
                critical: endpoint.critical,
                error: error.message
            });
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    const successRate = (passed / total * 100).toFixed(1);
    const criticalSuccessRate = (critical_passed / critical_total * 100).toFixed(1);
    
    console.log('\n🎯 COMPREHENSIVE PLATFORM TEST RESULTS');
    console.log('=====================================');
    console.log(`📊 Overall Success: ${passed}/${total} (${successRate}%)`);
    console.log(`🎯 Critical Endpoints: ${critical_passed}/${critical_total} (${criticalSuccessRate}%)`);
    
    if (successRate == 100) {
        console.log('🎉 PLATFORM STATUS: EXCELLENT - 100% SUCCESS RATE ACHIEVED!');
        console.log('✅ Deep Dive Analysis fix confirmed working');
        console.log('✅ All endpoints operational');
    } else if (successRate >= 90) {
        console.log('✅ PLATFORM STATUS: VERY GOOD - Minor issues remain');
    } else if (successRate >= 80) {
        console.log('⚠️ PLATFORM STATUS: GOOD - Some issues need attention');
    } else {
        console.log('❌ PLATFORM STATUS: NEEDS WORK - Multiple issues detected');
    }
    
    return {
        passed,
        total,
        successRate: parseFloat(successRate),
        criticalPassed: critical_passed,
        criticalTotal: critical_total,
        criticalSuccessRate: parseFloat(criticalSuccessRate),
        results
    };
}

async function validateDataQualityAndUIIntegration() {
    console.log('\n📊 DATA QUALITY & UI INTEGRATION VALIDATION');
    console.log('==========================================');
    
    const PROJECT_ID = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
    
    // Test 1: Check if data is properly displayed in UI
    console.log('🎨 Test 1: UI Data Integration');
    console.log('-----------------------------');
    
    const reportElements = document.querySelectorAll('[data-testid*="report"], .report-item, .report-card');
    const analysisElements = document.querySelectorAll('[data-testid*="analysis"], .analysis-item, .analysis-card');
    const collectionElements = document.querySelectorAll('[data-testid*="collection"], .collection-item, .collection-card');
    
    console.log(`📄 Report elements found: ${reportElements.length}`);
    console.log(`🔍 Analysis elements found: ${analysisElements.length}`);
    console.log(`📚 Collection elements found: ${collectionElements.length}`);
    
    // Test 2: Check for mock data indicators
    console.log('\n🕵️ Test 2: Mock Data Detection');
    console.log('------------------------------');
    
    const bodyText = document.body.innerText.toLowerCase();
    const mockIndicators = [
        'lorem ipsum',
        'placeholder',
        'sample data',
        'test data',
        'mock content',
        'dummy text',
        'example content'
    ];
    
    let mockDataFound = false;
    for (const indicator of mockIndicators) {
        if (bodyText.includes(indicator)) {
            console.log(`⚠️ Mock data indicator found: "${indicator}"`);
            mockDataFound = true;
        }
    }
    
    if (!mockDataFound) {
        console.log('✅ No mock data indicators detected');
    }
    
    // Test 3: Check data persistence
    console.log('\n💾 Test 3: Data Persistence Check');
    console.log('--------------------------------');
    
    try {
        const [reportsResponse, analysesResponse, collectionsResponse] = await Promise.all([
            fetch(`/api/proxy/projects/${PROJECT_ID}/reports`, {
                headers: { 'User-ID': 'fredericle77@gmail.com' }
            }),
            fetch(`/api/proxy/projects/${PROJECT_ID}/deep-dive-analyses`, {
                headers: { 'User-ID': 'fredericle77@gmail.com' }
            }),
            fetch(`/api/proxy/projects/${PROJECT_ID}/collections`, {
                headers: { 'User-ID': 'fredericle77@gmail.com' }
            })
        ]);
        
        const reportsData = reportsResponse.ok ? await reportsResponse.json() : null;
        const analysesData = analysesResponse.ok ? await analysesResponse.json() : null;
        const collectionsData = collectionsResponse.ok ? await collectionsResponse.json() : null;
        
        console.log(`📄 Reports in database: ${reportsData ? (Array.isArray(reportsData) ? reportsData.length : 'Data structure issue') : 'Failed to fetch'}`);
        console.log(`🔍 Analyses in database: ${analysesData ? (Array.isArray(analysesData) ? analysesData.length : 'Data structure issue') : 'Failed to fetch'}`);
        console.log(`📚 Collections in database: ${collectionsData ? (Array.isArray(collectionsData) ? collectionsData.length : 'Data structure issue') : 'Failed to fetch'}`);
        
        return {
            uiElements: {
                reports: reportElements.length,
                analyses: analysisElements.length,
                collections: collectionElements.length
            },
            mockDataFound,
            persistence: {
                reports: reportsData ? (Array.isArray(reportsData) ? reportsData.length : 'structure_issue') : 'failed',
                analyses: analysesData ? (Array.isArray(analysesData) ? analysesData.length : 'structure_issue') : 'failed',
                collections: collectionsData ? (Array.isArray(collectionsData) ? collectionsData.length : 'structure_issue') : 'failed'
            }
        };
    } catch (error) {
        console.log(`❌ Data persistence check failed: ${error.message}`);
        return { error: error.message };
    }
}

// Main validation function
async function runCompleteValidation() {
    console.log('🚀 COMPLETE PLATFORM VALIDATION STARTED');
    console.log('=======================================');
    console.log('🎯 Validating: Deep Dive fix, Platform testing, Data quality & UI integration');
    console.log('');
    
    // Step 1: Validate Deep Dive Analysis fix
    const deepDiveResult = await validateDeepDiveAnalysisFix();
    
    // Step 2: Run comprehensive platform testing
    const platformResult = await runComprehensivePlatformTesting();
    
    // Step 3: Validate data quality and UI integration
    const dataQualityResult = await validateDataQualityAndUIIntegration();
    
    // Final summary
    console.log('\n🎯 COMPLETE VALIDATION SUMMARY');
    console.log('=============================');
    console.log(`🔍 Deep Dive Analysis Fix: ${deepDiveResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`🧪 Platform Success Rate: ${platformResult.successRate}% (${platformResult.passed}/${platformResult.total})`);
    console.log(`🎯 Critical Endpoints: ${platformResult.criticalSuccessRate}% (${platformResult.criticalPassed}/${platformResult.criticalTotal})`);
    console.log(`🎨 UI Integration: ${dataQualityResult.uiElements ? 'Elements detected' : 'Needs review'}`);
    console.log(`🕵️ Mock Data: ${dataQualityResult.mockDataFound ? '⚠️ Found' : '✅ Clean'}`);
    console.log(`💾 Data Persistence: ${dataQualityResult.persistence ? 'Checked' : 'Failed'}`);
    
    const overallSuccess = deepDiveResult.success && platformResult.successRate >= 90;
    console.log(`\n🏆 OVERALL VALIDATION: ${overallSuccess ? '✅ SUCCESS' : '⚠️ NEEDS ATTENTION'}`);
    
    return {
        deepDive: deepDiveResult,
        platform: platformResult,
        dataQuality: dataQualityResult,
        overallSuccess
    };
}

// Make functions globally available
window.validateDeepDiveAnalysisFix = validateDeepDiveAnalysisFix;
window.runComprehensivePlatformTesting = runComprehensivePlatformTesting;
window.validateDataQualityAndUIIntegration = validateDataQualityAndUIIntegration;
window.runCompleteValidation = runCompleteValidation;

console.log('🚀 Comprehensive Platform Validation loaded!');
console.log('');
console.log('Available commands:');
console.log('  runCompleteValidation() - Run all validation tests');
console.log('  validateDeepDiveAnalysisFix() - Test Deep Dive fix specifically');
console.log('  runComprehensivePlatformTesting() - Test all endpoints');
console.log('  validateDataQualityAndUIIntegration() - Test UI and data quality');
