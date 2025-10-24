/**
 * UPDATED COMPREHENSIVE R&D AGENT PLATFORM TEST v3.0
 * 
 * All fixes applied:
 * - Correct endpoint URLs
 * - Fixed field names (article_pmid, article_title, article_url)
 * - Added required fields (molecule for New Report)
 * - Complete payloads for PhD endpoints
 */

class UpdatedComprehensiveRDAgentTest {
    constructor() {
        // Force use of production frontend URL when running from file://
        this.frontendUrl = (window.location.protocol === 'file:') 
            ? 'https://frontend-psi-seven-85.vercel.app'
            : window.location.origin;
        this.projectId = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
        this.testUserId = 'fredericle77@gmail.com';
        this.results = [];
        this.startTime = Date.now();
    }

    log(message, type = 'info', data = null) {
        const timestamp = new Date().toISOString();
        const elapsed = Date.now() - this.startTime;
        const emoji = {
            'info': 'ℹ️', 'success': '✅', 'warning': '⚠️', 'error': '❌',
            'test': '🧪', 'ui': '🎨', 'api': '🌐', 'data': '📊'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} [${timestamp}] [+${elapsed}ms] ${message}`);
        if (data) console.log('   Data:', data);
    }

    async testAllEndpoints() {
        console.log('🧪 UPDATED COMPREHENSIVE R&D AGENT PLATFORM TEST');
        console.log('================================================');
        console.log(`🌐 Frontend URL: ${this.frontendUrl}`);
        console.log(`📍 Project ID: ${this.projectId}`);
        console.log(`👤 User ID: ${this.testUserId}`);
        console.log('');

        const endpoints = [
            {
                name: 'New Report (Fixed)',
                url: `${this.frontendUrl}/api/proxy/projects/${this.projectId}/generate-summary-report`,
                method: 'POST',
                payload: {
                    molecule: 'machine learning medical diagnostics',  // REQUIRED field
                    objective: 'Generate comprehensive summary report for machine learning in medical diagnostics research',
                    project_id: this.projectId,
                    clinical_mode: false,
                    preference: 'precision'
                }
            },
            {
                name: 'Generate Summary',
                url: `${this.frontendUrl}/api/proxy/projects/${this.projectId}/generate-comprehensive-summary`,
                method: 'POST',
                payload: {
                    analysis_type: 'comprehensive',
                    include_methodology_synthesis: true,
                    include_gap_analysis: true,
                    academic_level: 'phd'
                }
            },
            {
                name: 'Deep Dive Analysis (Fixed)',
                url: `${this.frontendUrl}/api/proxy/deep-dive-analyses`,
                method: 'POST',
                payload: {
                    objective: 'Conduct deep dive analysis of machine learning applications in medical diagnostics',
                    article_pmid: '38278529',  // CORRECTED: was 'pmid'
                    article_title: 'Machine Learning in Medical Diagnostics: A Comprehensive Review',  // CORRECTED: was 'title'
                    article_url: 'https://pubmed.ncbi.nlm.nih.gov/38278529/'  // CORRECTED: was 'url'
                }
            },
            {
                name: 'Literature Gap Analysis (Fixed)',
                url: `${this.frontendUrl}/api/proxy/literature-gap-analysis`,
                method: 'POST',
                payload: {
                    project_id: this.projectId,
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
                name: 'Methodology Synthesis (Fixed)',
                url: `${this.frontendUrl}/api/proxy/methodology-synthesis`,
                method: 'POST',
                payload: {
                    project_id: this.projectId,
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
                name: 'Thesis Chapter Generator (Fixed)',
                url: `${this.frontendUrl}/api/proxy/thesis-chapter-generator`,
                method: 'POST',
                payload: {
                    project_id: this.projectId,
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
                url: `${this.frontendUrl}/api/proxy/projects/${this.projectId}/reports`,
                method: 'GET'
            },
            {
                name: 'Deep Dive Analyses List (Fixed)',
                url: `${this.frontendUrl}/api/proxy/projects/${this.projectId}/deep-dive-analyses`,
                method: 'GET'
            },
            {
                name: 'Collections List',
                url: `${this.frontendUrl}/api/proxy/projects/${this.projectId}/collections`,
                method: 'GET'
            }
        ];

        let passed = 0;
        let total = endpoints.length;
        const results = [];

        for (const endpoint of endpoints) {
            try {
                this.log(`🧪 Testing ${endpoint.name}...`, 'test');
                
                const options = {
                    method: endpoint.method,
                    headers: {
                        'Content-Type': 'application/json',
                        'User-ID': this.testUserId
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
                    this.log(`✅ ${endpoint.name}: SUCCESS (${response.status})`, 'success');
                    passed++;
                    
                    if (endpoint.method === 'GET') {
                        const count = Array.isArray(responseData) ? responseData.length : 
                                     (responseData.reports?.length || responseData.analyses?.length || 0);
                        console.log(`   📊 Found ${count} items`);
                    } else {
                        if (responseData.analysis_id || responseData.report_id || responseData.id) {
                            console.log(`   📄 Created with ID: ${responseData.analysis_id || responseData.report_id || responseData.id}`);
                        }
                    }
                    
                    results.push({ name: endpoint.name, status: 'SUCCESS', code: response.status });
                } else {
                    this.log(`❌ ${endpoint.name}: FAILED (${response.status})`, 'error');
                    console.log(`   📄 Error: ${responseText.substring(0, 200)}...`);
                    results.push({ name: endpoint.name, status: 'FAILED', code: response.status });
                }
            } catch (error) {
                this.log(`❌ ${endpoint.name}: ERROR - ${error.message}`, 'error');
                results.push({ name: endpoint.name, status: 'ERROR', error: error.message });
            }
            
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const successRate = (passed / total * 100).toFixed(1);
        
        console.log('');
        console.log('🎯 UPDATED COMPREHENSIVE TEST RESULTS');
        console.log('====================================');
        console.log(`📊 Tests Passed: ${passed}/${total}`);
        console.log(`📊 Success Rate: ${successRate}%`);
        console.log('');
        console.log('📋 DETAILED RESULTS:');
        results.forEach(result => {
            const status = result.status === 'SUCCESS' ? '✅' : '❌';
            console.log(`   ${status} ${result.name}: ${result.status} ${result.code ? `(${result.code})` : ''}`);
        });
        
        console.log('');
        if (successRate >= 90) {
            console.log('🎉 Status: EXCELLENT - All fixes working!');
        } else if (successRate >= 75) {
            console.log('✅ Status: GOOD - Major improvements achieved');
        } else if (successRate >= 60) {
            console.log('⚠️ Status: NEEDS ATTENTION');
        } else {
            console.log('❌ Status: CRITICAL ISSUES');
        }
        
        console.log('');
        console.log('🔧 FIXES APPLIED:');
        console.log('   ✅ Added required "molecule" field to New Report');
        console.log('   ✅ Fixed Deep Dive Analysis field names (pmid → article_pmid)');
        console.log('   ✅ Enhanced all PhD endpoint payloads');
        console.log('   ✅ Corrected endpoint URLs');
        console.log('   ✅ Fixed frontend URL detection');
        
        return { passed, total, successRate, results };
    }
}

// Global function to run the updated test
window.runUpdatedRDAgentTest = async function() {
    const tester = new UpdatedComprehensiveRDAgentTest();
    return await tester.testAllEndpoints();
};

console.log('🎯 Updated Comprehensive R&D Agent Test loaded!');
console.log('Run: runUpdatedRDAgentTest() to start the FIXED test');
