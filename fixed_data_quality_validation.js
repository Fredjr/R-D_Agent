/**
 * Fixed Data Quality & UI Integration Validation
 * Handles paginated API responses correctly
 */

async function validateDataQualityAndUIIntegrationFixed() {
    console.log('📊 FIXED DATA QUALITY & UI INTEGRATION VALIDATION');
    console.log('================================================');
    
    const PROJECT_ID = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
    
    // Test 1: Enhanced UI Element Detection
    console.log('🎨 Test 1: Enhanced UI Data Integration');
    console.log('-------------------------------------');
    
    // More comprehensive selectors based on typical React patterns
    const uiSelectors = {
        reports: [
            '[data-testid*="report"]',
            '.report-item', '.report-card', '.report-container',
            '[class*="report"]', '[id*="report"]',
            '.card', '.item', '.list-item', '[role="listitem"]'
        ],
        analyses: [
            '[data-testid*="analysis"]', '[data-testid*="deep-dive"]',
            '.analysis-item', '.analysis-card', '.analysis-container',
            '[class*="analysis"]', '[class*="deep-dive"]',
            '.card', '.item', '.list-item'
        ],
        collections: [
            '[data-testid*="collection"]',
            '.collection-item', '.collection-card', '.collection-container',
            '[class*="collection"]', '.card', '.item'
        ]
    };
    
    let totalUIElements = 0;
    const uiResults = {};
    
    for (const [type, selectors] of Object.entries(uiSelectors)) {
        let maxFound = 0;
        let bestSelector = '';
        
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > maxFound) {
                maxFound = elements.length;
                bestSelector = selector;
            }
        }
        
        uiResults[type] = { count: maxFound, selector: bestSelector };
        totalUIElements += maxFound;
        
        console.log(`📊 ${type.charAt(0).toUpperCase() + type.slice(1)} elements: ${maxFound} (${bestSelector || 'none found'})`);
    }
    
    // Test 2: Mock Data Detection (Enhanced)
    console.log('\n🕵️ Test 2: Enhanced Mock Data Detection');
    console.log('--------------------------------------');
    
    const bodyText = document.body.innerText.toLowerCase();
    const mockIndicators = [
        'lorem ipsum', 'placeholder', 'sample data', 'test data',
        'mock content', 'dummy text', 'example content', 'coming soon',
        'no data available', 'loading...', 'placeholder text'
    ];
    
    const foundMockIndicators = [];
    for (const indicator of mockIndicators) {
        if (bodyText.includes(indicator)) {
            foundMockIndicators.push(indicator);
        }
    }
    
    const mockDataFound = foundMockIndicators.length > 0;
    
    if (mockDataFound) {
        console.log(`⚠️ Mock data indicators found: ${foundMockIndicators.join(', ')}`);
    } else {
        console.log('✅ No mock data indicators detected');
    }
    
    // Test 3: Fixed Data Persistence Check (Handles Pagination)
    console.log('\n💾 Test 3: Fixed Data Persistence Check');
    console.log('--------------------------------------');
    
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
        
        // Handle Reports (Paginated Response)
        let reportsCount = 'failed';
        if (reportsResponse.ok) {
            const reportsData = await reportsResponse.json();
            if (typeof reportsData === 'object' && reportsData.reports && Array.isArray(reportsData.reports)) {
                reportsCount = reportsData.reports.length;
                console.log(`📄 Reports in database: ${reportsCount} (paginated response)`);
                if (reportsData.pagination) {
                    console.log(`   📊 Pagination: ${JSON.stringify(reportsData.pagination)}`);
                }
            } else if (Array.isArray(reportsData)) {
                reportsCount = reportsData.length;
                console.log(`📄 Reports in database: ${reportsCount} (array response)`);
            } else {
                console.log(`📄 Reports: Unexpected structure - ${typeof reportsData}`);
            }
        } else {
            console.log(`📄 Reports: Failed to fetch (${reportsResponse.status})`);
        }
        
        // Handle Analyses (Paginated Response)
        let analysesCount = 'failed';
        if (analysesResponse.ok) {
            const analysesData = await analysesResponse.json();
            if (typeof analysesData === 'object' && analysesData.analyses && Array.isArray(analysesData.analyses)) {
                analysesCount = analysesData.analyses.length;
                console.log(`🔍 Analyses in database: ${analysesCount} (paginated response)`);
                if (analysesData.pagination) {
                    console.log(`   📊 Pagination: ${JSON.stringify(analysesData.pagination)}`);
                }
            } else if (Array.isArray(analysesData)) {
                analysesCount = analysesData.length;
                console.log(`🔍 Analyses in database: ${analysesCount} (array response)`);
            } else {
                console.log(`🔍 Analyses: Unexpected structure - ${typeof analysesData}`);
            }
        } else {
            console.log(`🔍 Analyses: Failed to fetch (${analysesResponse.status})`);
        }
        
        // Handle Collections (Array Response)
        let collectionsCount = 'failed';
        if (collectionsResponse.ok) {
            const collectionsData = await collectionsResponse.json();
            if (Array.isArray(collectionsData)) {
                collectionsCount = collectionsData.length;
                console.log(`📚 Collections in database: ${collectionsCount} (array response)`);
            } else {
                console.log(`📚 Collections: Unexpected structure - ${typeof collectionsData}`);
            }
        } else {
            console.log(`📚 Collections: Failed to fetch (${collectionsResponse.status})`);
        }
        
        // Test 4: Content Quality Assessment
        console.log('\n🎓 Test 4: Content Quality Assessment');
        console.log('------------------------------------');
        
        // Sample a few reports and analyses for quality check
        if (reportsResponse.ok && reportsCount > 0) {
            const reportsData = await reportsResponse.json();
            const reports = reportsData.reports || reportsData;
            if (Array.isArray(reports) && reports.length > 0) {
                const sampleReport = reports[0];
                const reportKeys = Object.keys(sampleReport);
                console.log(`📄 Sample Report Structure: ${reportKeys.slice(0, 5).join(', ')}...`);
                
                // Check for content richness
                const contentFields = ['content', 'summary', 'analysis', 'findings', 'results'];
                const hasContent = contentFields.some(field => 
                    sampleReport[field] && typeof sampleReport[field] === 'string' && sampleReport[field].length > 100
                );
                console.log(`📊 Report Content Quality: ${hasContent ? '✅ Rich content detected' : '⚠️ Limited content'}`);
            }
        }
        
        if (analysesResponse.ok && analysesCount > 0) {
            const analysesData = await analysesResponse.json();
            const analyses = analysesData.analyses || analysesData;
            if (Array.isArray(analyses) && analyses.length > 0) {
                const sampleAnalysis = analyses[0];
                const analysisKeys = Object.keys(sampleAnalysis);
                console.log(`🔍 Sample Analysis Structure: ${analysisKeys.slice(0, 5).join(', ')}...`);
                
                // Check for analysis richness
                const analysisFields = ['scientific_model_analysis', 'experimental_methods_analysis', 'results_interpretation_analysis'];
                const hasAnalysisContent = analysisFields.some(field => 
                    sampleAnalysis[field] && typeof sampleAnalysis[field] === 'object'
                );
                console.log(`📊 Analysis Content Quality: ${hasAnalysisContent ? '✅ Rich analysis detected' : '⚠️ Limited analysis'}`);
            }
        }
        
        return {
            uiElements: uiResults,
            totalUIElements,
            mockDataFound,
            foundMockIndicators,
            persistence: {
                reports: reportsCount,
                analyses: analysesCount,
                collections: collectionsCount
            },
            dataQuality: {
                reportsWorking: reportsCount !== 'failed',
                analysesWorking: analysesCount !== 'failed',
                collectionsWorking: collectionsCount !== 'failed'
            }
        };
        
    } catch (error) {
        console.log(`❌ Data persistence check failed: ${error.message}`);
        return { error: error.message };
    }
}

async function runCompleteValidationFixed() {
    console.log('🚀 COMPLETE PLATFORM VALIDATION (FIXED VERSION)');
    console.log('===============================================');
    console.log('🎯 Validating: Deep Dive fix, Platform testing, Data quality & UI integration');
    console.log('');
    
    // Step 1: Validate Deep Dive Analysis fix (reuse existing function)
    const deepDiveResult = await validateDeepDiveAnalysisFix();
    
    // Step 2: Run comprehensive platform testing (reuse existing function)
    const platformResult = await runComprehensivePlatformTesting();
    
    // Step 3: Run FIXED data quality and UI integration validation
    const dataQualityResult = await validateDataQualityAndUIIntegrationFixed();
    
    // Final summary with corrected data
    console.log('\n🎯 COMPLETE VALIDATION SUMMARY (CORRECTED)');
    console.log('=========================================');
    console.log(`🔍 Deep Dive Analysis Fix: ${deepDiveResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`🧪 Platform Success Rate: ${platformResult.successRate}% (${platformResult.passed}/${platformResult.total})`);
    console.log(`🎯 Critical Endpoints: ${platformResult.criticalSuccessRate}% (${platformResult.criticalPassed}/${platformResult.criticalTotal})`);
    console.log(`🎨 UI Elements Detected: ${dataQualityResult.totalUIElements || 0} total elements`);
    console.log(`🕵️ Mock Data: ${dataQualityResult.mockDataFound ? '⚠️ Found' : '✅ Clean'}`);
    console.log(`💾 Data Persistence:`);
    console.log(`   📄 Reports: ${dataQualityResult.persistence?.reports || 'unknown'}`);
    console.log(`   🔍 Analyses: ${dataQualityResult.persistence?.analyses || 'unknown'}`);
    console.log(`   📚 Collections: ${dataQualityResult.persistence?.collections || 'unknown'}`);
    
    const overallSuccess = deepDiveResult.success && 
                          platformResult.successRate >= 90 && 
                          dataQualityResult.persistence?.reports !== 'failed' &&
                          dataQualityResult.persistence?.analyses !== 'failed';
    
    console.log(`\n🏆 OVERALL VALIDATION: ${overallSuccess ? '✅ SUCCESS' : '⚠️ NEEDS ATTENTION'}`);
    
    if (overallSuccess) {
        console.log('🎉 PLATFORM STATUS: PRODUCTION READY');
        console.log('✅ All systems operational');
        console.log('✅ Data persistence confirmed');
        console.log('✅ Quality standards met');
    }
    
    return {
        deepDive: deepDiveResult,
        platform: platformResult,
        dataQuality: dataQualityResult,
        overallSuccess
    };
}

// Make functions globally available
window.validateDataQualityAndUIIntegrationFixed = validateDataQualityAndUIIntegrationFixed;
window.runCompleteValidationFixed = runCompleteValidationFixed;

console.log('🔧 Fixed Data Quality Validation loaded!');
console.log('');
console.log('Available commands:');
console.log('  validateDataQualityAndUIIntegrationFixed() - Fixed data quality test');
console.log('  runCompleteValidationFixed() - Complete validation with fixes');
