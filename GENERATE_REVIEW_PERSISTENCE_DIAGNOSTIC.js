/**
 * GENERATE REVIEW PERSISTENCE DIAGNOSTIC
 * Check if generate-review has the same persistence issues as deep-dive
 */

class GenerateReviewPersistenceDiagnostic {
    constructor() {
        this.results = [];
        this.baseUrl = 'https://frontend-psi-seven-85.vercel.app';
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
            'diagnostic': '🔍',
            'critical': '🚨'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} [${timestamp}] ${message}`);
        if (data) {
            console.log('Data:', data);
        }
    }

    async checkGenerateReviewAnalysesList() {
        this.log('🔍 CHECKING GENERATE REVIEW ANALYSES LIST', 'diagnostic');
        
        const endpointsToTest = [
            '/api/proxy/generate-review-analyses',
            '/api/proxy/reviews',
            '/api/proxy/analyses',
            '/api/proxy/generate-reviews'
        ];

        const results = {};
        
        for (const endpoint of endpointsToTest) {
            try {
                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-ID': 'fredericle77@gmail.com'
                    }
                });

                results[endpoint] = {
                    status: response.status,
                    exists: response.status !== 404,
                    ok: response.ok
                };

                if (response.ok) {
                    const data = await response.json();
                    results[endpoint].dataStructure = {
                        isArray: Array.isArray(data),
                        length: Array.isArray(data) ? data.length : 'N/A',
                        keys: typeof data === 'object' ? Object.keys(data) : 'N/A'
                    };
                }
            } catch (error) {
                results[endpoint] = {
                    status: 'ERROR',
                    exists: false,
                    error: error.message
                };
            }
        }

        this.log('📊 Generate Review List Endpoints Test:', 'diagnostic', results);
        return results;
    }

    async testGenerateReviewEndpoints() {
        this.log('🔍 TESTING GENERATE REVIEW ENDPOINTS', 'diagnostic');
        
        const testPayload = {
            molecule: 'COVID-19 treatment diagnostic test',
            objective: 'Generate review persistence diagnostic test',
            max_results: 3,
            user_id: 'fredericle77@gmail.com'
        };

        const endpointsToTest = [
            '/api/proxy/generate-review',
            '/api/proxy/generate-review-sync',
            '/api/proxy/generate-review-async',
            '/api/proxy/generate-review-semantic'
        ];

        const results = {};
        
        for (const endpoint of endpointsToTest) {
            this.log(`🧪 Testing endpoint: ${endpoint}`, 'info');
            const startTime = Date.now();
            
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-ID': 'fredericle77@gmail.com'
                    },
                    body: JSON.stringify(testPayload)
                });

                const responseTime = Date.now() - startTime;
                
                if (response.ok) {
                    const data = await response.json();
                    
                    results[endpoint] = {
                        success: true,
                        status: response.status,
                        responseTime,
                        hasAnalysisId: !!(data.analysis_id || data.id || data.review_id),
                        hasResults: !!(data.results || data.papers || data.articles),
                        resultsCount: (data.results || data.papers || data.articles || []).length,
                        responseKeys: Object.keys(data),
                        analysisIdField: data.analysis_id ? 'analysis_id' : 
                                       data.id ? 'id' : 
                                       data.review_id ? 'review_id' : 'none'
                    };
                    
                    this.log(`✅ ${endpoint} successful`, 'success', {
                        responseTime: `${responseTime}ms`,
                        hasAnalysisId: results[endpoint].hasAnalysisId,
                        resultsCount: results[endpoint].resultsCount
                    });
                } else {
                    const errorText = await response.text();
                    results[endpoint] = {
                        success: false,
                        status: response.status,
                        responseTime,
                        error: errorText
                    };
                    this.log(`❌ ${endpoint} failed`, 'error', response.status);
                }
            } catch (error) {
                results[endpoint] = {
                    success: false,
                    responseTime: Date.now() - startTime,
                    error: error.message
                };
                this.log(`❌ ${endpoint} error`, 'error', error.message);
            }
        }

        return results;
    }

    async checkGenerateReviewSaveEndpoints() {
        this.log('🔍 CHECKING GENERATE REVIEW SAVE ENDPOINTS', 'diagnostic');
        
        const testAnalysisData = {
            molecule: 'Persistence Test Review',
            objective: 'Database save test for generate review',
            results: [{ test: 'data' }],
            processing_status: 'completed',
            user_id: 'fredericle77@gmail.com'
        };

        const endpointsToTest = [
            '/api/proxy/generate-review-analyses',
            '/api/proxy/reviews',
            '/api/proxy/analyses',
            '/api/proxy/generate-reviews'
        ];

        const results = {};
        
        for (const endpoint of endpointsToTest) {
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-ID': 'fredericle77@gmail.com'
                    },
                    body: JSON.stringify(testAnalysisData)
                });

                if (response.ok) {
                    const data = await response.json();
                    results[endpoint] = {
                        success: true,
                        status: response.status,
                        hasAnalysisId: !!(data.analysis_id || data.id || data.review_id),
                        responseKeys: Object.keys(data)
                    };
                    this.log(`✅ ${endpoint} save endpoint working`, 'success');
                } else {
                    const errorText = await response.text();
                    results[endpoint] = {
                        success: false,
                        status: response.status,
                        error: errorText
                    };
                }
            } catch (error) {
                results[endpoint] = {
                    success: false,
                    error: error.message
                };
            }
        }

        this.log('📊 Generate Review Save Endpoints Test:', 'diagnostic', results);
        return results;
    }

    async checkProjectGenerateReviewEndpoints() {
        this.log('🔍 CHECKING PROJECT-SPECIFIC GENERATE REVIEW ENDPOINTS', 'diagnostic');
        
        // Test project-specific endpoints similar to deep-dive
        const projectId = 'test-project-id';
        const endpointsToTest = [
            `/api/proxy/projects/${projectId}/generate-reviews`,
            `/api/proxy/projects/${projectId}/reviews`,
            `/api/proxy/projects/${projectId}/analyses`
        ];

        const results = {};
        
        for (const endpoint of endpointsToTest) {
            try {
                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-ID': 'fredericle77@gmail.com'
                    }
                });

                results[endpoint] = {
                    status: response.status,
                    exists: response.status !== 404,
                    ok: response.ok
                };
            } catch (error) {
                results[endpoint] = {
                    status: 'ERROR',
                    exists: false,
                    error: error.message
                };
            }
        }

        this.log('📊 Project Generate Review Endpoints Test:', 'diagnostic', results);
        return results;
    }

    compareWithDeepDiveIssues() {
        this.log('🔍 COMPARING WITH DEEP DIVE ISSUES', 'diagnostic');
        
        const deepDiveIssues = {
            missingListEndpoint: '/api/proxy/deep-dive-analyses (GET) - 404',
            missingSaveEndpoint: '/api/proxy/deep-dive-analyses (POST) - 404',
            missingPubMedEndpoint: '/api/proxy/pubmed/details/{pmid} - 404',
            noAnalysisIdReturned: 'Deep dive completes but no analysis_id',
            persistenceFailure: 'Analyses not appearing in UI list'
        };

        this.log('🚨 Known Deep Dive Issues:', 'critical', deepDiveIssues);
        
        return {
            deepDiveIssues,
            comparisonNeeded: [
                'Check if generate-review has list endpoint',
                'Check if generate-review has save endpoint', 
                'Check if generate-review returns analysis_id',
                'Check if generate-review analyses persist in UI',
                'Verify if same architecture gaps exist'
            ]
        };
    }

    async runComprehensiveGenerateReviewDiagnostic() {
        this.log('🚀 STARTING COMPREHENSIVE GENERATE REVIEW PERSISTENCE DIAGNOSTIC', 'diagnostic');
        
        // Step 1: Check list endpoints
        const listEndpointsTest = await this.checkGenerateReviewAnalysesList();
        
        // Step 2: Test generate review endpoints
        const endpointsTest = await this.testGenerateReviewEndpoints();
        
        // Step 3: Check save endpoints
        const saveEndpointsTest = await this.checkGenerateReviewSaveEndpoints();
        
        // Step 4: Check project-specific endpoints
        const projectEndpointsTest = await this.checkProjectGenerateReviewEndpoints();
        
        // Step 5: Compare with deep dive issues
        const comparison = this.compareWithDeepDiveIssues();

        // Comprehensive analysis
        const diagnosticResults = {
            listEndpoints: {
                anyWorking: Object.values(listEndpointsTest).some(r => r.exists && r.ok),
                workingEndpoints: Object.entries(listEndpointsTest).filter(([k, v]) => v.exists && v.ok).map(([k]) => k),
                missingEndpoints: Object.entries(listEndpointsTest).filter(([k, v]) => !v.exists).map(([k]) => k)
            },
            generateReviewEndpoints: {
                totalTested: Object.keys(endpointsTest).length,
                successful: Object.values(endpointsTest).filter(r => r.success).length,
                withAnalysisId: Object.values(endpointsTest).filter(r => r.success && r.hasAnalysisId).length,
                withoutAnalysisId: Object.values(endpointsTest).filter(r => r.success && !r.hasAnalysisId).length
            },
            saveEndpoints: {
                anyWorking: Object.values(saveEndpointsTest).some(r => r.success),
                workingEndpoints: Object.entries(saveEndpointsTest).filter(([k, v]) => v.success).map(([k]) => k)
            },
            projectEndpoints: {
                anyWorking: Object.values(projectEndpointsTest).some(r => r.exists && r.ok),
                workingEndpoints: Object.entries(projectEndpointsTest).filter(([k, v]) => v.exists && v.ok).map(([k]) => k)
            },
            criticalIssues: [],
            recommendations: []
        };

        // Identify critical issues
        if (!diagnosticResults.listEndpoints.anyWorking) {
            diagnosticResults.criticalIssues.push('No working list endpoints for generate-review analyses');
        }
        
        if (!diagnosticResults.saveEndpoints.anyWorking) {
            diagnosticResults.criticalIssues.push('No working save endpoints for generate-review analyses');
        }
        
        if (diagnosticResults.generateReviewEndpoints.withoutAnalysisId > 0) {
            diagnosticResults.criticalIssues.push('Generate-review endpoints complete but don\'t return analysis_id');
        }
        
        if (!diagnosticResults.projectEndpoints.anyWorking) {
            diagnosticResults.criticalIssues.push('No working project-specific generate-review endpoints');
        }

        // Generate recommendations
        if (diagnosticResults.criticalIssues.length > 0) {
            diagnosticResults.recommendations = [
                'Create missing generate-review list endpoints',
                'Create missing generate-review save endpoints',
                'Fix generate-review endpoints to return analysis_id',
                'Implement project-specific generate-review endpoints',
                'Ensure generate-review analyses persist to database'
            ];
        }

        // Compare with deep dive
        const hasSameIssues = diagnosticResults.criticalIssues.length > 0;
        const issueComparison = {
            deepDiveHasIssues: true, // We know this from previous diagnostic
            generateReviewHasIssues: hasSameIssues,
            sameArchitecturalGaps: hasSameIssues,
            systemWideIssue: hasSameIssues
        };

        this.log('📊 DIAGNOSTIC SUMMARY', 'diagnostic', {
            ...diagnosticResults,
            issueComparison
        });

        // Store results
        window.generateReviewPersistenceDiagnostic = {
            diagnosticResults,
            listEndpointsTest,
            endpointsTest,
            saveEndpointsTest,
            projectEndpointsTest,
            comparison,
            issueComparison,
            timestamp: new Date().toISOString(),
            logs: this.results
        };

        this.log('✅ Comprehensive generate-review diagnostic complete. Results stored in window.generateReviewPersistenceDiagnostic', 'success');
        
        if (hasSameIssues) {
            this.log('🚨 CRITICAL: Generate-review has the same persistence issues as deep-dive!', 'critical');
        } else {
            this.log('✅ Generate-review persistence appears to be working correctly', 'success');
        }
        
        return window.generateReviewPersistenceDiagnostic;
    }
}

// Auto-execute when script is loaded
(async () => {
    const diagnostic = new GenerateReviewPersistenceDiagnostic();
    await diagnostic.runComprehensiveGenerateReviewDiagnostic();
})();
