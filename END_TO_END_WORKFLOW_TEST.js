/**
 * END-TO-END WORKFLOW TEST v1.0
 * 
 * Tests complete user workflows from start to finish
 * Simulates real user interactions and verifies full system integration
 */

class EndToEndWorkflowTest {
    constructor() {
        this.baseUrl = 'https://frontend-psi-seven-85.vercel.app';
        this.testUserId = 'fredericle77@gmail.com';
        this.testProjectId = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
        this.results = [];
        this.startTime = Date.now();
    }

    log(message, type = 'info', data = null) {
        const timestamp = new Date().toISOString();
        const elapsed = Date.now() - this.startTime;
        const emoji = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${emoji} [${timestamp}] [+${elapsed}ms] ${message}`);
        if (data) console.log('Data:', data);
        this.results.push({ timestamp, type, message, data, elapsed });
    }

    async testResearchWorkflow() {
        this.log('🔬 TESTING COMPLETE RESEARCH WORKFLOW', 'info');
        
        const workflow = [
            {
                name: 'Get PubMed Recommendations',
                test: async () => {
                    const response = await fetch('/api/proxy/pubmed/recommendations?type=trending&limit=3', {
                        headers: { 'User-ID': this.testUserId }
                    });
                    const data = await response.json();
                    return { success: response.ok, papers: data.recommendations?.length || 0 };
                }
            },
            {
                name: 'Get Project Collections',
                test: async () => {
                    const response = await fetch(`/api/proxy/projects/${this.testProjectId}/collections`, {
                        headers: { 'User-ID': this.testUserId }
                    });
                    return { success: response.ok, status: response.status };
                }
            },
            {
                name: 'Get Project Activities',
                test: async () => {
                    const response = await fetch(`/api/proxy/projects/${this.testProjectId}/activities`, {
                        headers: { 'User-ID': this.testUserId }
                    });
                    return { success: response.ok, status: response.status };
                }
            },
            {
                name: 'Get Deep Dive Analyses',
                test: async () => {
                    const response = await fetch(`/api/proxy/projects/${this.testProjectId}/deep-dive-analyses`, {
                        headers: { 'User-ID': this.testUserId }
                    });
                    const data = await response.json();
                    return { success: response.ok, analyses: Array.isArray(data) ? data.length : 0 };
                }
            }
        ];

        const results = [];
        for (const step of workflow) {
            this.log(`🧪 ${step.name}...`, 'info');
            try {
                const result = await step.test();
                if (result.success) {
                    this.log(`✅ ${step.name} - SUCCESS`, 'success', result);
                    results.push({ ...step, result, success: true });
                } else {
                    this.log(`❌ ${step.name} - FAILED`, 'error', result);
                    results.push({ ...step, result, success: false });
                }
            } catch (error) {
                this.log(`❌ ${step.name} - ERROR`, 'error', { error: error.message });
                results.push({ ...step, error: error.message, success: false });
            }
        }

        return results;
    }

    async testCollaborationWorkflow() {
        this.log('👥 TESTING COLLABORATION WORKFLOW', 'info');
        
        // Test WebSocket connection for real-time collaboration
        return new Promise((resolve) => {
            const wsUrl = `wss://r-dagent-production.up.railway.app/ws/project/${this.testProjectId}`;
            const ws = new WebSocket(wsUrl);
            const timeout = setTimeout(() => {
                ws.close();
                this.log('⚠️ WebSocket connection timeout', 'warning');
                resolve({ success: false, reason: 'timeout' });
            }, 5000);

            ws.onopen = () => {
                clearTimeout(timeout);
                this.log('✅ Project WebSocket connected', 'success');
                
                // Send test message
                ws.send(JSON.stringify({
                    type: 'test_collaboration',
                    project_id: this.testProjectId,
                    user_id: this.testUserId,
                    timestamp: new Date().toISOString()
                }));
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.log('✅ WebSocket message received', 'success', { type: data.type });
                ws.close();
                resolve({ success: true, messageType: data.type });
            };

            ws.onerror = (error) => {
                clearTimeout(timeout);
                this.log('❌ WebSocket error', 'error', error);
                resolve({ success: false, reason: 'error' });
            };
        });
    }

    async testDataPersistence() {
        this.log('💾 TESTING DATA PERSISTENCE', 'info');
        
        const tests = [
            {
                name: 'Project Data Retrieval',
                endpoint: `/api/proxy/projects/${this.testProjectId}`,
                expectedFields: ['id', 'name', 'created_at']
            },
            {
                name: 'User Projects List',
                endpoint: '/api/proxy/projects',
                expectedFields: ['length'] // Should be array
            }
        ];

        const results = [];
        for (const test of tests) {
            try {
                const response = await fetch(test.endpoint, {
                    headers: { 'User-ID': this.testUserId }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const hasExpectedFields = test.expectedFields.every(field => 
                        field === 'length' ? Array.isArray(data) : data.hasOwnProperty(field)
                    );
                    
                    if (hasExpectedFields) {
                        this.log(`✅ ${test.name} - Data structure valid`, 'success');
                        results.push({ ...test, success: true, dataValid: true });
                    } else {
                        this.log(`⚠️ ${test.name} - Missing expected fields`, 'warning', { 
                            expected: test.expectedFields, 
                            actual: Object.keys(data) 
                        });
                        results.push({ ...test, success: true, dataValid: false });
                    }
                } else {
                    this.log(`❌ ${test.name} - HTTP ${response.status}`, 'error');
                    results.push({ ...test, success: false, status: response.status });
                }
            } catch (error) {
                this.log(`❌ ${test.name} - Error`, 'error', { error: error.message });
                results.push({ ...test, success: false, error: error.message });
            }
        }

        return results;
    }

    async runEndToEndTest() {
        this.log('🚀 STARTING END-TO-END WORKFLOW TEST', 'info');
        
        const researchResults = await this.testResearchWorkflow();
        const collaborationResults = await this.testCollaborationWorkflow();
        const persistenceResults = await this.testDataPersistence();
        
        const summary = {
            researchWorkflowSuccess: researchResults.filter(r => r.success).length,
            researchWorkflowTotal: researchResults.length,
            collaborationSuccess: collaborationResults.success,
            persistenceSuccess: persistenceResults.filter(r => r.success).length,
            persistenceTotal: persistenceResults.length,
            overallSuccess: 0,
            recommendations: []
        };

        // Calculate overall success rate
        const totalTests = summary.researchWorkflowTotal + 1 + summary.persistenceTotal;
        const totalSuccess = summary.researchWorkflowSuccess + 
                           (summary.collaborationSuccess ? 1 : 0) + 
                           summary.persistenceSuccess;
        summary.overallSuccess = Math.round((totalSuccess / totalTests) * 100);

        // Generate recommendations
        if (summary.researchWorkflowSuccess < summary.researchWorkflowTotal) {
            summary.recommendations.push('Some research workflow steps failed - check API endpoints');
        }
        if (!summary.collaborationSuccess) {
            summary.recommendations.push('Real-time collaboration features need attention');
        }
        if (summary.persistenceSuccess < summary.persistenceTotal) {
            summary.recommendations.push('Data persistence issues detected');
        }
        if (summary.overallSuccess >= 90) {
            summary.recommendations.push('🎉 End-to-end workflows working excellently!');
        }

        this.log('📊 END-TO-END WORKFLOW TEST COMPLETED', 'info');
        this.log(`✅ Overall Success Rate: ${summary.overallSuccess}%`, 'success');
        this.log('💡 RECOMMENDATIONS:', 'info');
        summary.recommendations.forEach(rec => this.log(rec, 'info'));

        // Store results
        window.endToEndTestResults = {
            results: this.results,
            summary,
            researchResults,
            collaborationResults,
            persistenceResults
        };

        return window.endToEndTestResults;
    }
}

// Auto-load
console.log('🔬 End-to-End Workflow Test v1.0 loaded');
console.log('📋 Usage: const test = new EndToEndWorkflowTest(); await test.runEndToEndTest();');
window.EndToEndWorkflowTest = EndToEndWorkflowTest;
