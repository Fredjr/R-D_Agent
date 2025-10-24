/**
 * Railway Deployment Verification Script
 * Run this in your frontend console to verify the Deep Dive fix deployment
 */

async function verifyRailwayDeployment() {
    console.log('🚀 RAILWAY DEPLOYMENT VERIFICATION');
    console.log('==================================');
    console.log('🎯 Testing Deep Dive Analysis fix deployment');
    console.log('');
    
    const PROJECT_ID = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
    const USER_ID = 'fredericle77@gmail.com';
    
    // Test 1: Deep Dive Analysis (the fixed endpoint)
    console.log('🔍 Test 1: Deep Dive Analysis (CRITICAL FIX)');
    console.log('--------------------------------------------');
    
    try {
        const startTime = Date.now();
        const response = await fetch('/api/proxy/deep-dive-analyses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-ID': USER_ID
            },
            body: JSON.stringify({
                objective: 'Verify Railway deployment fix for Deep Dive Analysis',
                article_pmid: '38278529',
                article_title: 'Machine Learning in Medical Diagnostics: Railway Deployment Test',
                article_url: 'https://pubmed.ncbi.nlm.nih.gov/38278529/',
                project_id: PROJECT_ID
            })
        });
        
        const responseTime = Date.now() - startTime;
        
        if (response.ok) {
            const data = await response.json();
            console.log('🎉 DEPLOYMENT SUCCESS!');
            console.log(`✅ Deep Dive Analysis: 200 SUCCESS (${responseTime}ms)`);
            console.log(`📄 Created analysis ID: ${data.analysis_id || data.id}`);
            console.log('🔧 Fix confirmed: analysis.id → analysis.analysis_id working');
            
            return { success: true, analysisId: data.analysis_id || data.id };
        } else {
            const errorText = await response.text();
            console.log('❌ DEPLOYMENT NOT YET COMPLETE');
            console.log(`❌ Deep Dive Analysis: ${response.status} ERROR`);
            console.log(`📄 Error: ${errorText.substring(0, 200)}...`);
            
            if (response.status === 500 && errorText.includes("'DeepDiveAnalysis' object has no attribute 'id'")) {
                console.log('⚠️ Same error detected - Railway deployment still in progress');
                console.log('⏰ Please wait 2-3 more minutes and try again');
            }
            
            return { success: false, status: response.status, error: errorText };
        }
    } catch (error) {
        console.log('❌ NETWORK ERROR');
        console.log(`❌ Deep Dive Analysis: ERROR - ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function runFullVerification() {
    console.log('🧪 FULL PLATFORM VERIFICATION AFTER DEPLOYMENT');
    console.log('==============================================');
    
    const PROJECT_ID = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
    const USER_ID = 'fredericle77@gmail.com';
    
    const allEndpoints = [
        {
            name: 'New Report',
            url: `/api/proxy/projects/${PROJECT_ID}/generate-summary-report`,
            method: 'POST',
            payload: {
                molecule: 'machine learning medical diagnostics',
                objective: 'Test report generation',
                project_id: PROJECT_ID
            }
        },
        {
            name: 'Deep Dive Analysis (FIXED)',
            url: '/api/proxy/deep-dive-analyses',
            method: 'POST',
            payload: {
                objective: 'Test deep dive analysis',
                article_pmid: '38278529',
                article_title: 'Test Article',
                article_url: 'https://pubmed.ncbi.nlm.nih.gov/38278529/'
            }
        },
        {
            name: 'Literature Gap Analysis',
            url: '/api/proxy/literature-gap-analysis',
            method: 'POST',
            payload: {
                project_id: PROJECT_ID,
                objective: 'Test gap analysis',
                academic_level: 'phd'
            }
        },
        {
            name: 'Methodology Synthesis',
            url: '/api/proxy/methodology-synthesis',
            method: 'POST',
            payload: {
                project_id: PROJECT_ID,
                objective: 'Test methodology synthesis',
                academic_level: 'phd'
            }
        },
        {
            name: 'Thesis Chapter Generator',
            url: '/api/proxy/thesis-chapter-generator',
            method: 'POST',
            payload: {
                project_id: PROJECT_ID,
                objective: 'Test thesis generation',
                academic_level: 'phd'
            }
        },
        {
            name: 'Reports List',
            url: `/api/proxy/projects/${PROJECT_ID}/reports`,
            method: 'GET'
        },
        {
            name: 'Deep Dive Analyses List',
            url: `/api/proxy/projects/${PROJECT_ID}/deep-dive-analyses`,
            method: 'GET'
        },
        {
            name: 'Collections List',
            url: `/api/proxy/projects/${PROJECT_ID}/collections`,
            method: 'GET'
        }
    ];

    let passed = 0;
    let total = allEndpoints.length;

    for (const endpoint of allEndpoints) {
        try {
            console.log(`🧪 Testing ${endpoint.name}...`);
            
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

            if (response.ok) {
                console.log(`✅ ${endpoint.name}: SUCCESS (${response.status})`);
                passed++;
                
                if (endpoint.name.includes('Deep Dive Analysis')) {
                    const data = await response.json();
                    console.log(`   🎯 CRITICAL FIX VERIFIED: Created ID ${data.analysis_id || data.id}`);
                }
            } else {
                console.log(`❌ ${endpoint.name}: FAILED (${response.status})`);
            }
        } catch (error) {
            console.log(`❌ ${endpoint.name}: ERROR - ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    const successRate = (passed / total * 100).toFixed(1);
    
    console.log('');
    console.log('🎯 FINAL DEPLOYMENT VERIFICATION RESULTS');
    console.log('=======================================');
    console.log(`📊 Tests Passed: ${passed}/${total}`);
    console.log(`📊 Success Rate: ${successRate}%`);
    
    if (successRate == 100) {
        console.log('🎉 DEPLOYMENT SUCCESSFUL - 100% SUCCESS RATE ACHIEVED!');
        console.log('✅ Deep Dive Analysis fix confirmed working');
        console.log('✅ All platform endpoints operational');
        console.log('🏆 Platform Status: EXCELLENT');
    } else if (successRate >= 88) {
        console.log('✅ DEPLOYMENT MOSTLY SUCCESSFUL');
        console.log(`⚠️ ${total - passed} endpoint(s) still need attention`);
    } else {
        console.log('❌ DEPLOYMENT ISSUES DETECTED');
        console.log('🔄 May need additional time or investigation');
    }
    
    return { passed, total, successRate };
}

// Global functions
window.verifyRailwayDeployment = verifyRailwayDeployment;
window.runFullVerification = runFullVerification;

console.log('🚀 Railway Deployment Verification loaded!');
console.log('');
console.log('Available commands:');
console.log('  verifyRailwayDeployment() - Test Deep Dive fix specifically');
console.log('  runFullVerification() - Test all endpoints after deployment');
console.log('');
console.log('⏰ Wait 2-5 minutes after triggering deployment, then run verification');
