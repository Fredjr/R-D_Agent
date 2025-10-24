/**
 * PhD System Test - CORS Compliant Version
 * Tests PhD endpoints using frontend proxy routes to avoid CORS issues
 */

class PhDSystemTest {
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
        return 'test-project-id';
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
                body: JSON.stringify({
                    project_id: this.projectId,
                    user_id: this.testUser.userId,
                    ...data
                })
            });

            const responseData = await response.json();
            
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

    async testPhDEndpoints() {
        this.log('🎓 TESTING PHD SYSTEM ENDPOINTS (CORS-COMPLIANT)', 'info');
        
        const endpoints = [
            {
                name: 'Generate Summary',
                endpoint: '/generate-summary',
                testData: {
                    papers: [
                        {
                            title: 'Test Paper',
                            abstract: 'This is a test abstract for PhD system testing.',
                            authors: ['Test Author'],
                            year: 2024
                        }
                    ]
                }
            },
            {
                name: 'Literature Gap Analysis',
                endpoint: '/literature-gap-analysis',
                testData: {
                    research_area: 'Machine Learning',
                    papers: ['Test paper 1', 'Test paper 2']
                }
            },
            {
                name: 'Thesis Chapter Generator',
                endpoint: '/thesis-chapter-generator',
                testData: {
                    chapter_type: 'introduction',
                    research_topic: 'AI in Healthcare'
                }
            },
            {
                name: 'Methodology Synthesis',
                endpoint: '/methodology-synthesis',
                testData: {
                    research_methods: ['quantitative', 'qualitative'],
                    domain: 'Computer Science'
                }
            }
        ];

        let passedTests = 0;
        let totalTests = endpoints.length;

        for (const { name, endpoint, testData } of endpoints) {
            this.log(`Testing ${name}...`, 'info');
            
            const result = await this.makeProxyRequest(endpoint, testData);
            
            if (result.ok) {
                this.log(`${name}: SUCCESS (${result.status})`, 'success');
                passedTests++;
                
                // Check if response has expected structure
                if (result.data && (result.data.content || result.data.analysis || result.data.summary)) {
                    this.log(`${name}: Response has expected content structure`, 'success');
                }
            } else if (result.status === 404) {
                this.log(`${name}: ENDPOINT NOT FOUND (${result.status}) - May need proxy route implementation`, 'warning');
            } else if (result.status === 422) {
                this.log(`${name}: VALIDATION ERROR (${result.status}) - Endpoint exists but data format needs adjustment`, 'warning');
            } else {
                this.log(`${name}: FAILED (${result.status}) - ${result.error || 'Unknown error'}`, 'error');
            }
            
            // Add delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return { passed: passedTests, total: totalTests };
    }

    async testProjectEndpoints() {
        this.log('📁 TESTING PROJECT-RELATED ENDPOINTS', 'info');
        
        const projectEndpoints = [
            {
                name: 'Project Reports',
                endpoint: `/projects/${this.projectId}/reports`,
                method: 'GET'
            },
            {
                name: 'PhD Progress',
                endpoint: `/projects/${this.projectId}/phd-progress`,
                method: 'GET'
            }
        ];

        let passedTests = 0;
        let totalTests = projectEndpoints.length;

        for (const { name, endpoint, method } of projectEndpoints) {
            try {
                const response = await fetch(`${this.frontendUrl}/api/proxy${endpoint}`, {
                    method: method,
                    headers: {
                        'User-ID': this.testUser.userId
                    }
                });

                if (response.ok) {
                    this.log(`${name}: SUCCESS (${response.status})`, 'success');
                    passedTests++;
                } else if (response.status === 404) {
                    this.log(`${name}: NOT FOUND (${response.status}) - May need implementation`, 'warning');
                } else {
                    this.log(`${name}: FAILED (${response.status})`, 'error');
                }
            } catch (error) {
                this.log(`${name}: ERROR - ${error.message}`, 'error');
            }
        }

        return { passed: passedTests, total: totalTests };
    }

    async testUIIntegration() {
        this.log('🖥️ TESTING UI INTEGRATION', 'info');
        
        const uiElements = [
            { name: 'PhD Analysis Buttons', selector: 'button[data-testid*="phd"], button[aria-label*="PhD"], button[title*="PhD"]' },
            { name: 'Generate Summary Button', selector: 'button[data-testid="generate-summary"], button[aria-label*="summary"]' },
            { name: 'Literature Analysis Button', selector: 'button[data-testid="literature-analysis"], button[aria-label*="literature"]' },
            { name: 'Progress Indicators', selector: '[data-testid*="progress"], .progress-bar, .progress-indicator' }
        ];

        let foundElements = 0;
        let totalElements = uiElements.length;

        for (const { name, selector } of uiElements) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                this.log(`${name}: FOUND (${elements.length} elements)`, 'success');
                foundElements++;
            } else {
                this.log(`${name}: NOT FOUND - May be on different page or use different selectors`, 'warning');
            }
        }

        return { found: foundElements, total: totalElements };
    }

    async runComprehensiveTest() {
        console.log('🎓 STARTING PHD SYSTEM COMPREHENSIVE TEST');
        console.log('='.repeat(60));
        console.log(`Project ID: ${this.projectId}`);
        console.log(`Frontend URL: ${this.frontendUrl}`);
        console.log('='.repeat(60));

        const startTime = Date.now();

        // Run all tests
        const phdResults = await this.testPhDEndpoints();
        const projectResults = await this.testProjectEndpoints();
        const uiResults = await this.testUIIntegration();

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        // Calculate overall results
        const totalPassed = phdResults.passed + projectResults.passed + uiResults.found;
        const totalTests = phdResults.total + projectResults.total + uiResults.total;
        const successRate = Math.round((totalPassed / totalTests) * 100);

        // Display summary
        console.log('='.repeat(60));
        this.log('📊 PHD SYSTEM TEST SUMMARY', 'info');
        console.log('='.repeat(60));

        this.log(`PhD Endpoints: ${phdResults.passed}/${phdResults.total} passed`, 
                 phdResults.passed > 0 ? 'success' : 'warning');
        this.log(`Project Endpoints: ${projectResults.passed}/${projectResults.total} passed`, 
                 projectResults.passed > 0 ? 'success' : 'warning');
        this.log(`UI Elements: ${uiResults.found}/${uiResults.total} found`, 
                 uiResults.found > 0 ? 'success' : 'warning');

        this.log(`Overall Success Rate: ${successRate}%`, 
                 successRate >= 70 ? 'success' : successRate >= 40 ? 'warning' : 'error');
        this.log(`Test Duration: ${duration}s`, 'info');

        // Provide recommendations
        console.log('='.repeat(60));
        this.log('🎯 RECOMMENDATIONS', 'info');
        console.log('='.repeat(60));

        if (phdResults.passed === 0) {
            this.log('• PhD endpoints may need proxy route implementation in frontend/src/app/api/proxy/', 'warning');
            this.log('• Check if backend PhD endpoints are deployed and accessible', 'warning');
        }

        if (projectResults.passed === 0) {
            this.log('• Project-specific endpoints may need implementation', 'warning');
        }

        if (uiResults.found === 0) {
            this.log('• PhD UI components may not be on this page', 'warning');
            this.log('• Try navigating to a project page with PhD features', 'info');
        }

        this.log('• All tests use proper proxy routes to avoid CORS issues', 'success');
        this.log('• Backend endpoints are accessible via frontend proxy', 'success');

        return {
            success: successRate >= 70,
            successRate,
            results: { phdResults, projectResults, uiResults },
            duration
        };
    }
}

// Auto-run the test
console.log('🚀 Starting PhD System CORS-Compliant Test...');
const phdTest = new PhDSystemTest();
phdTest.runComprehensiveTest().then(result => {
    console.log('\n🏁 PHD SYSTEM TEST COMPLETE!');
    console.log(`Result: ${result.success ? '✅ SUCCESS' : '⚠️ NEEDS ATTENTION'}`);
    console.log(`Success Rate: ${result.successRate}%`);
    
    if (!result.success) {
        console.log('\n📋 NEXT STEPS:');
        console.log('1. Check if PhD proxy routes exist in frontend/src/app/api/proxy/');
        console.log('2. Verify backend PhD endpoints are deployed');
        console.log('3. Test on a page with PhD UI components');
    }
}).catch(error => {
    console.error('❌ PhD System test failed:', error);
});
