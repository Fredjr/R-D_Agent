// CORRECTED R&D Agent Platform Test
// Run this in your frontend console at https://frontend-psi-seven-85.vercel.app

async function testRDAgentPlatformCorrected() {
    console.log('🧪 Starting CORRECTED R&D Agent Platform Test');
    console.log('==============================================');
    
    const PROJECT_ID = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
    const USER_ID = 'fredericle77@gmail.com';
    
    const endpoints = [
        {
            name: 'New Report (Fixed)',
            url: `/api/proxy/projects/${PROJECT_ID}/generate-summary-report`,
            method: 'POST',
            payload: {
                molecule: 'machine learning medical diagnostics',  // REQUIRED field
                objective: 'Generate comprehensive summary report for machine learning in medical diagnostics research',
                project_id: PROJECT_ID,
                clinical_mode: false,
                preference: 'precision',
                dag_mode: false,
                full_text_only: false
            }
        },
        {
            name: 'Deep Dive Analysis (Fixed)',
            url: `/api/proxy/projects/${PROJECT_ID}/deep-dive-analyses`,
            method: 'POST',
            payload: {
                objective: 'Conduct deep dive analysis of machine learning applications in medical diagnostics',
                pmid: '38278529',
                title: 'Machine Learning in Medical Diagnostics: A Comprehensive Review',
                url: 'https://pubmed.ncbi.nlm.nih.gov/38278529/',
                analysis_type: 'comprehensive',
                include_methodology: true,
                include_results: true,
                academic_level: 'phd'
            }
        },
        {
            name: 'Literature Gap Analysis',
            url: `/api/proxy/literature-gap-analysis`,
            method: 'POST',
            payload: {
                project_id: PROJECT_ID,
                objective: 'Identify research gaps in machine learning applications for medical diagnostics',
                gap_types: ['theoretical', 'methodological', 'empirical'],
                domain_focus: 'medical_diagnostics',
                severity_threshold: 'moderate',
                academic_level: 'phd',
                analysis_depth: 'comprehensive',
                include_methodology_gaps: true
            }
        },
        {
            name: 'Methodology Synthesis',
            url: `/api/proxy/methodology-synthesis`,
            method: 'POST',
            payload: {
                project_id: PROJECT_ID,
                objective: 'Synthesize research methodologies for machine learning in medical diagnostics',
                methodology_types: ['experimental', 'observational', 'computational'],
                include_statistical_methods: true,
                include_validation: true,
                comparison_depth: 'detailed',
                academic_level: 'phd',
                synthesis_type: 'comprehensive_comparative'
            }
        },
        {
            name: 'Thesis Chapter Generator',
            url: `/api/proxy/thesis-chapter-generator`,
            method: 'POST',
            payload: {
                project_id: PROJECT_ID,
                objective: 'Generate thesis chapter structure for machine learning in medical diagnostics research',
                chapter_focus: 'comprehensive',
                academic_level: 'phd',
                citation_style: 'apa',
                target_length: 80000,
                include_timeline: true
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
    let total = endpoints.length;
    const results = [];

    for (const endpoint of endpoints) {
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
            const responseText = await response.text();
            
            let responseData;
            try {
                responseData = JSON.parse(responseText);
            } catch (e) {
                responseData = responseText;
            }

            if (response.ok) {
                console.log(`✅ ${endpoint.name}: SUCCESS (${response.status})`);
                passed++;
                
                if (endpoint.method === 'GET') {
                    const count = Array.isArray(responseData) ? responseData.length : 
                                 (responseData.reports?.length || responseData.analyses?.length || 0);
                    console.log(`   📊 Found ${count} items`);
                } else {
                    // For POST requests, show creation success
                    if (responseData.analysis_id || responseData.report_id || responseData.id) {
                        console.log(`   📄 Created with ID: ${responseData.analysis_id || responseData.report_id || responseData.id}`);
                    } else if (responseData.message) {
                        console.log(`   📄 Message: ${responseData.message}`);
                    }
                }
                
                results.push({ name: endpoint.name, status: 'SUCCESS', code: response.status });
            } else {
                console.log(`❌ ${endpoint.name}: FAILED (${response.status})`);
                console.log(`   📄 Error: ${responseText.substring(0, 200)}...`);
                results.push({ name: endpoint.name, status: 'FAILED', code: response.status, error: responseText.substring(0, 100) });
            }
        } catch (error) {
            console.log(`❌ ${endpoint.name}: ERROR - ${error.message}`);
            results.push({ name: endpoint.name, status: 'ERROR', error: error.message });
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    const successRate = (passed / total * 100).toFixed(1);
    
    console.log('');
    console.log('🎯 CORRECTED PLATFORM TEST RESULTS');
    console.log('==================================');
    console.log(`📊 Tests Passed: ${passed}/${total}`);
    console.log(`📊 Success Rate: ${successRate}%`);
    console.log('');
    console.log('📋 DETAILED RESULTS:');
    results.forEach(result => {
        const status = result.status === 'SUCCESS' ? '✅' : '❌';
        console.log(`   ${status} ${result.name}: ${result.status} ${result.code ? `(${result.code})` : ''}`);
        if (result.error) {
            console.log(`      Error: ${result.error}`);
        }
    });
    
    console.log('');
    if (successRate >= 90) {
        console.log('🎉 Status: EXCELLENT - Platform working great!');
    } else if (successRate >= 75) {
        console.log('✅ Status: GOOD - Minor issues remain');
    } else if (successRate >= 60) {
        console.log('⚠️ Status: NEEDS ATTENTION');
    } else {
        console.log('❌ Status: CRITICAL ISSUES');
    }
    
    console.log('');
    console.log('🔍 KEY IMPROVEMENTS MADE:');
    console.log('   • Added required "molecule" field to New Report');
    console.log('   • Enhanced Deep Dive Analysis payload');
    console.log('   • Fixed all PhD endpoint payloads');
    console.log('   • Corrected endpoint URLs');
    
    return { passed, total, successRate, results };
}

// Run the corrected test
console.log('🚀 Loading corrected test...');
console.log('📋 Fixes applied:');
console.log('   ✅ Added missing "molecule" field for New Report');
console.log('   ✅ Enhanced Deep Dive Analysis payload');
console.log('   ✅ All PhD endpoints already working');
console.log('');
console.log('Run: testRDAgentPlatformCorrected()');
