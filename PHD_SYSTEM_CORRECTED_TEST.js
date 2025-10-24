/**
 * PhD System Test - CORRECTED DATA VALIDATION
 * Tests PhD endpoints with proper request formats matching backend expectations
 */

class PhDSystemCorrectedTest {
    constructor() {
        this.results = [];
        this.frontendUrl = window.location.origin;
        this.projectId = this.extractProjectId();
        this.testUser = {
            email: 'fredericle77@gmail.com',
            userId: 'e29e29d3-f87f-4c70-9aeb-424002382195'
        };
    }

    extractProjectId() {
        const path = window.location.pathname;
        const segments = path.split('/');
        const projectIndex = segments.indexOf('projects');
        if (projectIndex !== -1 && segments[projectIndex + 1]) {
            return segments[projectIndex + 1];
        }
        return '5ac213d7-6fcc-46ff-9420-5c7f4b421012'; // Default test project
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const styles = {
            'info': 'color: #2196F3; font-weight: bold;',
            'success': 'color: #4CAF50; font-weight: bold;',
            'error': 'color: #F44336; font-weight: bold;',
            'warning': 'color: #FF9800; font-weight: bold;'
        };
        
        const prefix = {
            'info': '📋',
            'success': '✅',
            'error': '❌',
            'warning': '⚠️'
        }[type] || '📋';
        
        console.log(`%c${prefix} [${timestamp.split('T')[1].split('.')[0]}] ${message}`, styles[type] || styles.info);
        this.results.push({ type, message, timestamp });
    }

    async makeProxyRequest(endpoint, data = {}) {
        try {
            const response = await fetch(`${this.frontendUrl}/api/proxy${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.testUser.userId
                },
                body: JSON.stringify(data)
            });

            let responseData;
            try {
                responseData = await response.json();
            } catch (parseError) {
                responseData = { error: 'Failed to parse response as JSON' };
            }
            
            return {
                ok: response.ok,
                status: response.status,
                data: responseData
            };
        } catch (error) {
            return {
                ok: false,
                status: 0,
                error: error.message
            };
        }
    }

    async testPhDEndpointsWithCorrectData() {
        this.log('🎓 TESTING PHD ENDPOINTS WITH CORRECTED DATA FORMATS', 'info');
        
        const endpoints = [
            {
                name: 'Generate Summary',
                endpoint: '/generate-summary',
                testData: {
                    project_id: this.projectId,
                    objective: "Generate comprehensive PhD-level summary of research findings",
                    summary_type: "comprehensive",
                    academic_level: "phd",
                    include_methodology: true,
                    include_gaps: true,
                    target_length: 5000
                },
                expectedFields: ['summary_content', 'methodology_summary', 'research_gaps', 'key_findings', 'quality_score']
            },
            {
                name: 'Literature Gap Analysis',
                endpoint: '/literature-gap-analysis',
                testData: {
                    project_id: this.projectId,
                    objective: "Identify systematic gaps in current literature",
                    gap_types: ["theoretical", "methodological", "empirical"],
                    domain_focus: "Machine Learning in Healthcare",
                    severity_threshold: "moderate",
                    academic_level: "phd",
                    analysis_depth: "comprehensive",
                    include_methodology_gaps: true
                },
                expectedFields: ['identified_gaps', 'research_opportunities', 'methodology_gaps', 'theoretical_gaps', 'empirical_gaps', 'quality_score']
            },
            {
                name: 'Thesis Chapter Generator',
                endpoint: '/thesis-chapter-generator',
                testData: {
                    project_id: this.projectId,
                    objective: "Generate PhD thesis chapter structure and content",
                    chapter_focus: "literature_review",
                    academic_level: "phd",
                    citation_style: "apa",
                    target_length: 80000,
                    include_timeline: true
                },
                expectedFields: ['chapters', 'total_estimated_words', 'quality_score', 'research_timeline']
            },
            {
                name: 'Methodology Synthesis',
                endpoint: '/methodology-synthesis',
                testData: {
                    project_id: this.projectId,
                    objective: "Synthesize and compare research methodologies",
                    methodology_types: ["experimental", "observational", "computational"],
                    include_statistical_methods: true,
                    include_validation: true,
                    comparison_depth: "detailed",
                    academic_level: "phd",
                    synthesis_type: "comprehensive_comparative"
                },
                expectedFields: ['identified_methodologies', 'methodology_comparison', 'statistical_methods', 'validation_approaches', 'quality_score']
            }
        ];

        let passedTests = 0;
        let totalTests = endpoints.length;
        const detailedResults = [];

        for (const { name, endpoint, testData, expectedFields } of endpoints) {
            this.log(`Testing ${name}...`, 'info');
            
            const result = await this.makeProxyRequest(endpoint, testData);
            
            const testResult = {
                name,
                endpoint,
                status: result.status,
                success: result.ok,
                data: result.data,
                expectedFields,
                foundFields: [],
                missingFields: [],
                error: result.error
            };

            if (result.ok) {
                this.log(`${name}: SUCCESS (${result.status})`, 'success');
                passedTests++;
                
                // Check if response has expected structure
                if (result.data) {
                    testResult.foundFields = expectedFields.filter(field => 
                        result.data.hasOwnProperty(field) && result.data[field] !== null && result.data[field] !== undefined
                    );
                    testResult.missingFields = expectedFields.filter(field => 
                        !result.data.hasOwnProperty(field) || result.data[field] === null || result.data[field] === undefined
                    );

                    if (testResult.foundFields.length > 0) {
                        this.log(`${name}: Found ${testResult.foundFields.length}/${expectedFields.length} expected fields`, 'success');
                    }
                    if (testResult.missingFields.length > 0) {
                        this.log(`${name}: Missing fields: ${testResult.missingFields.join(', ')}`, 'warning');
                    }

                    // Check quality score
                    if (result.data.quality_score) {
                        this.log(`${name}: Quality Score: ${result.data.quality_score}/10`, 'info');
                    }

                    // Check processing time
                    if (result.data.processing_time) {
                        this.log(`${name}: Processing Time: ${result.data.processing_time}`, 'info');
                    }
                }
            } else if (result.status === 404) {
                this.log(`${name}: ENDPOINT NOT FOUND (${result.status})`, 'error');
            } else if (result.status === 422) {
                this.log(`${name}: VALIDATION ERROR (${result.status}) - ${result.data?.detail || 'Unknown validation error'}`, 'error');
            } else if (result.status === 500) {
                this.log(`${name}: SERVER ERROR (${result.status}) - ${result.data?.detail || 'Internal server error'}`, 'error');
            } else {
                this.log(`${name}: FAILED (${result.status}) - ${result.error || result.data?.detail || 'Unknown error'}`, 'error');
            }

            detailedResults.push(testResult);
            
            // Add delay between requests
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        return { 
            passed: passedTests, 
            total: totalTests, 
            results: detailedResults,
            successRate: Math.round((passedTests / totalTests) * 100)
        };
    }

    async testBackgroundJobIntegration() {
        this.log('⚙️ TESTING BACKGROUND JOB INTEGRATION', 'info');
        
        // Test if endpoints support background processing
        const backgroundEndpoints = [
            '/background-jobs/generate-summary',
            '/background-jobs/literature-gap-analysis',
            '/background-jobs/thesis-chapter-generator',
            '/background-jobs/methodology-synthesis'
        ];

        let backgroundSupport = 0;
        let totalBackgroundTests = backgroundEndpoints.length;

        for (const endpoint of backgroundEndpoints) {
            try {
                const response = await fetch(`${this.frontendUrl}/api/proxy${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-ID': this.testUser.userId
                    },
                    body: JSON.stringify({
                        project_id: this.projectId,
                        objective: "Test background job processing"
                    })
                });

                if (response.ok || response.status === 422) {
                    this.log(`Background job endpoint ${endpoint}: AVAILABLE`, 'success');
                    backgroundSupport++;
                } else if (response.status === 404) {
                    this.log(`Background job endpoint ${endpoint}: NOT IMPLEMENTED`, 'warning');
                } else {
                    this.log(`Background job endpoint ${endpoint}: ERROR (${response.status})`, 'error');
                }
            } catch (error) {
                this.log(`Background job endpoint ${endpoint}: ERROR - ${error.message}`, 'error');
            }
        }

        return { 
            supported: backgroundSupport, 
            total: totalBackgroundTests,
            supportRate: Math.round((backgroundSupport / totalBackgroundTests) * 100)
        };
    }

    async testReportPersistence() {
        this.log('💾 TESTING REPORT PERSISTENCE', 'info');
        
        try {
            // Test project reports endpoint
            const response = await fetch(`${this.frontendUrl}/api/proxy/projects/${this.projectId}/reports`, {
                method: 'GET',
                headers: {
                    'User-ID': this.testUser.userId
                }
            });

            if (response.ok) {
                const reports = await response.json();
                this.log(`Report persistence: WORKING - Found ${reports.length || 0} reports`, 'success');
                return { working: true, reportCount: reports.length || 0 };
            } else {
                this.log(`Report persistence: FAILED (${response.status})`, 'error');
                return { working: false, reportCount: 0 };
            }
        } catch (error) {
            this.log(`Report persistence: ERROR - ${error.message}`, 'error');
            return { working: false, reportCount: 0 };
        }
    }

    async runComprehensiveTest() {
        console.log('🎓 STARTING PHD SYSTEM CORRECTED TEST');
        console.log('='.repeat(60));
        console.log(`Project ID: ${this.projectId}`);
        console.log(`Frontend URL: ${this.frontendUrl}`);
        console.log(`User ID: ${this.testUser.userId}`);
        console.log('='.repeat(60));

        const startTime = Date.now();

        // Run all tests
        const phdResults = await this.testPhDEndpointsWithCorrectData();
        const backgroundResults = await this.testBackgroundJobIntegration();
        const persistenceResults = await this.testReportPersistence();

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        // Calculate overall results
        const overallSuccessRate = Math.round(
            (phdResults.successRate + backgroundResults.supportRate + (persistenceResults.working ? 100 : 0)) / 3
        );

        // Display summary
        console.log('='.repeat(60));
        this.log('📊 PHD SYSTEM CORRECTED TEST SUMMARY', 'info');
        console.log('='.repeat(60));

        this.log(`PhD Endpoints: ${phdResults.passed}/${phdResults.total} passed (${phdResults.successRate}%)`, 
                 phdResults.successRate >= 75 ? 'success' : phdResults.successRate >= 50 ? 'warning' : 'error');
        
        this.log(`Background Jobs: ${backgroundResults.supported}/${backgroundResults.total} supported (${backgroundResults.supportRate}%)`, 
                 backgroundResults.supportRate >= 75 ? 'success' : backgroundResults.supportRate >= 50 ? 'warning' : 'error');
        
        this.log(`Report Persistence: ${persistenceResults.working ? 'WORKING' : 'FAILED'} (${persistenceResults.reportCount} reports found)`, 
                 persistenceResults.working ? 'success' : 'error');

        this.log(`Overall Success Rate: ${overallSuccessRate}%`, 
                 overallSuccessRate >= 75 ? 'success' : overallSuccessRate >= 50 ? 'warning' : 'error');
        this.log(`Test Duration: ${duration}s`, 'info');

        // Detailed results for debugging
        console.log('='.repeat(60));
        this.log('🔍 DETAILED RESULTS FOR DEBUGGING', 'info');
        console.log('='.repeat(60));

        phdResults.results.forEach(result => {
            if (!result.success) {
                console.log(`❌ ${result.name}:`, {
                    status: result.status,
                    error: result.error,
                    responseData: result.data
                });
            } else {
                console.log(`✅ ${result.name}:`, {
                    foundFields: result.foundFields,
                    missingFields: result.missingFields,
                    qualityScore: result.data?.quality_score
                });
            }
        });

        return {
            success: overallSuccessRate >= 75,
            overallSuccessRate,
            results: { phdResults, backgroundResults, persistenceResults },
            duration
        };
    }
}

// Auto-run the corrected test
console.log('🚀 Starting PhD System CORRECTED Test...');
const phdTest = new PhDSystemCorrectedTest();
phdTest.runComprehensiveTest().then(result => {
    console.log('\n🏁 PHD SYSTEM CORRECTED TEST COMPLETE!');
    console.log(`Result: ${result.success ? '✅ SUCCESS' : '⚠️ NEEDS ATTENTION'}`);
    console.log(`Overall Success Rate: ${result.overallSuccessRate}%`);
    
    if (result.success) {
        console.log('\n🎉 EXCELLENT! PhD system is working correctly with proper data formats!');
    } else {
        console.log('\n📋 NEXT STEPS IDENTIFIED:');
        if (result.results.phdResults.successRate < 75) {
            console.log('1. Some PhD endpoints may need backend implementation fixes');
        }
        if (result.results.backgroundResults.supportRate < 75) {
            console.log('2. Background job integration needs implementation');
        }
        if (!result.results.persistenceResults.working) {
            console.log('3. Report persistence system needs fixes');
        }
    }
}).catch(error => {
    console.error('❌ PhD System corrected test failed:', error);
});
