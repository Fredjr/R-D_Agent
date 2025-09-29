/**
 * FINAL DEPLOYMENT VERIFICATION
 * Comprehensive test of all fixed endpoints and functionality
 */

class FinalDeploymentVerification {
    constructor() {
        this.results = [];
        this.baseUrl = 'https://frontend-psi-seven-85.vercel.app';
        this.backendUrl = 'https://r-dagent-production.up.railway.app';
    }

    log(message, type = 'info', data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, type, message, data };
        this.results.push(logEntry);
        
        const emoji = {
            'info': 'ℹ️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌',
            'test': '🧪',
            'deploy': '🚀'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} [${timestamp}] ${message}`);
        if (data) {
            console.log('Data:', data);
        }
    }

    async testCriticalEndpoints() {
        this.log('🧪 TESTING CRITICAL ENDPOINTS AFTER FIXES', 'test');
        
        const tests = [
            {
                name: 'Backend Health Check',
                url: `${this.backendUrl}/health`,
                method: 'GET',
                expected: { status: 'healthy' }
            },
            {
                name: 'Generate Review Sync (FIXED)',
                url: `${this.baseUrl}/api/proxy/generate-review-sync`,
                method: 'POST',
                body: {
                    molecule: 'Final verification test',
                    objective: 'Test fixed sync endpoint',
                    max_results: 2
                },
                expected: { saved_to_database: true, analysis_id: 'exists' }
            },
            {
                name: 'Background Job Creation',
                url: `${this.backendUrl}/background-jobs/generate-review`,
                method: 'POST',
                body: {
                    molecule: 'Background job test',
                    objective: 'Test background processing',
                    max_results: 2,
                    project_id: 'test-project'
                },
                expected: { success: true, job_id: 'exists' }
            },
            {
                name: 'Persistence Retrieval',
                url: `${this.backendUrl}/generate-review-analyses?user_id=fredericle77@gmail.com&limit=3`,
                method: 'GET',
                expected: { analyses: 'array' }
            },
            {
                name: 'Frontend Persistence List',
                url: `${this.baseUrl}/api/proxy/generate-review-analyses`,
                method: 'GET',
                expected: { analyses: 'array' }
            }
        ];

        const results = {};
        
        for (const test of tests) {
            this.log(`Testing: ${test.name}`, 'test');
            
            try {
                const options = {
                    method: test.method,
                    headers: {
                        'Content-Type': 'application/json',
                        'User-ID': 'fredericle77@gmail.com'
                    }
                };
                
                if (test.body) {
                    options.body = JSON.stringify(test.body);
                }
                
                const response = await fetch(test.url, options);
                const data = await response.json();
                
                // Validate expectations
                let passed = true;
                const validationResults = {};
                
                for (const [key, expectedValue] of Object.entries(test.expected)) {
                    if (expectedValue === 'exists') {
                        validationResults[key] = !!data[key];
                        passed = passed && !!data[key];
                    } else if (expectedValue === 'array') {
                        validationResults[key] = Array.isArray(data[key]);
                        passed = passed && Array.isArray(data[key]);
                    } else {
                        validationResults[key] = data[key] === expectedValue;
                        passed = passed && (data[key] === expectedValue);
                    }
                }
                
                results[test.name] = {
                    success: response.ok && passed,
                    status: response.status,
                    validations: validationResults,
                    responseTime: 'measured',
                    data: {
                        hasAnalysisId: !!(data.analysis_id || data.id || data.job_id),
                        savedToDatabase: data.saved_to_database,
                        resultsCount: data.results?.length || data.analyses?.length || 0
                    }
                };
                
                const status = response.ok && passed ? '✅ PASSED' : '❌ FAILED';
                this.log(`${status} ${test.name}`, response.ok && passed ? 'success' : 'error', {
                    status: response.status,
                    validations: validationResults
                });
                
            } catch (error) {
                results[test.name] = {
                    success: false,
                    error: error.message
                };
                this.log(`❌ ERROR ${test.name}: ${error.message}`, 'error');
            }
        }
        
        return results;
    }

    async runFinalVerification() {
        this.log('🚀 STARTING FINAL DEPLOYMENT VERIFICATION', 'deploy');
        
        const testResults = await this.testCriticalEndpoints();
        
        // Calculate success metrics
        const totalTests = Object.keys(testResults).length;
        const passedTests = Object.values(testResults).filter(r => r.success).length;
        const successRate = ((passedTests / totalTests) * 100).toFixed(1);
        
        const summary = {
            totalTests,
            passedTests,
            failedTests: totalTests - passedTests,
            successRate: `${successRate}%`,
            allCriticalEndpointsWorking: passedTests === totalTests,
            deploymentStatus: passedTests === totalTests ? 'SUCCESS' : 'ISSUES_FOUND',
            timestamp: new Date().toISOString()
        };
        
        // Store results globally
        window.finalDeploymentVerification = {
            summary,
            testResults,
            logs: this.results
        };
        
        if (summary.allCriticalEndpointsWorking) {
            this.log('🎉 ALL CRITICAL ENDPOINTS WORKING - DEPLOYMENT FULLY SUCCESSFUL!', 'success', summary);
        } else {
            this.log(`⚠️ ${summary.failedTests} tests failed - Success rate: ${summary.successRate}`, 'warning', summary);
        }
        
        this.log('✅ Final verification complete. Results stored in window.finalDeploymentVerification', 'success');
        
        return window.finalDeploymentVerification;
    }
}

// Auto-execute
(async () => {
    const verification = new FinalDeploymentVerification();
    await verification.runFinalVerification();
})();
