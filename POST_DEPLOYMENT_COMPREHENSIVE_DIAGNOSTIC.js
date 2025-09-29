/**
 * POST-DEPLOYMENT COMPREHENSIVE DIAGNOSTIC
 * Test all newly deployed persistence endpoints and functionality
 */

class PostDeploymentComprehensiveDiagnostic {
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
            'critical': '🚨',
            'deploy': '🚀'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} [${timestamp}] ${message}`);
        if (data) {
            console.log('Data:', data);
        }
    }

    async testNewlyCreatedEndpoints() {
        this.log('🚀 TESTING NEWLY CREATED ENDPOINTS', 'deploy');
        
        const endpointsToTest = [
            // Core persistence endpoints
            { endpoint: '/api/proxy/deep-dive-analyses', method: 'GET', name: 'Deep Dive Analyses List' },
            { endpoint: '/api/proxy/generate-review-analyses', method: 'GET', name: 'Generate Review Analyses List' },
            { endpoint: '/api/proxy/pubmed/details/29622564', method: 'GET', name: 'PubMed Details' },
            
            // Project-specific endpoints
            { endpoint: '/api/proxy/projects/test-project/generate-review-analyses', method: 'GET', name: 'Project Generate Review Analyses' },
            { endpoint: '/api/proxy/projects/test-project/deep-dive-analyses', method: 'GET', name: 'Project Deep Dive Analyses' },
            
            // Collection-specific endpoints
            { endpoint: '/api/proxy/collections/test-collection/generate-review-analyses', method: 'GET', name: 'Collection Generate Review Analyses' },
            { endpoint: '/api/proxy/collections/test-collection/deep-dive-analyses', method: 'GET', name: 'Collection Deep Dive Analyses' }
        ];

        const results = {};
        
        for (const test of endpointsToTest) {
            try {
                const response = await fetch(test.endpoint, {
                    method: test.method,
                    headers: {
                        'Content-Type': 'application/json',
                        'User-ID': 'fredericle77@gmail.com'
                    }
                });

                results[test.endpoint] = {
                    name: test.name,
                    status: response.status,
                    exists: response.status !== 404,
                    ok: response.ok,
                    method: test.method
                };

                if (response.ok) {
                    try {
                        const data = await response.json();
                        results[test.endpoint].dataStructure = {
                            isArray: Array.isArray(data),
                            length: Array.isArray(data) ? data.length : 'N/A',
                            keys: typeof data === 'object' ? Object.keys(data).slice(0, 5) : 'N/A'
                        };
                    } catch (jsonError) {
                        results[test.endpoint].dataStructure = 'Invalid JSON';
                    }
                }

                const status = response.status === 404 ? '❌ NOT FOUND' : 
                              response.ok ? '✅ WORKING' : 
                              `⚠️ ERROR ${response.status}`;
                              
                this.log(`${status} ${test.name}: ${test.endpoint}`, 
                         response.status === 404 ? 'error' : response.ok ? 'success' : 'warning');
                         
            } catch (error) {
                results[test.endpoint] = {
                    name: test.name,
                    status: 'ERROR',
                    exists: false,
                    error: error.message,
                    method: test.method
                };
                this.log(`❌ ERROR ${test.name}: ${error.message}`, 'error');
            }
        }

        return results;
    }

    async testUpdatedEndpointsWithPersistence() {
        this.log('🔍 TESTING UPDATED ENDPOINTS WITH PERSISTENCE', 'diagnostic');
        
        const testPayload = {
            molecule: 'Post-deployment persistence test',
            objective: 'Test if analyses now persist correctly',
            max_results: 3,
            user_id: 'fredericle77@gmail.com'
        };

        const deepDivePayload = {
            pmid: '29622564',
            title: 'Post-deployment deep dive persistence test',
            objective: 'Test if deep dive analyses now persist correctly',
            user_id: 'fredericle77@gmail.com'
        };

        const endpointsToTest = [
            { endpoint: '/api/proxy/generate-review', payload: testPayload, name: 'Generate Review' },
            { endpoint: '/api/proxy/generate-review-sync', payload: testPayload, name: 'Generate Review Sync' },
            { endpoint: '/api/proxy/deep-dive', payload: deepDivePayload, name: 'Deep Dive' }
        ];

        const results = {};
        
        for (const test of endpointsToTest) {
            this.log(`🧪 Testing ${test.name} with persistence...`, 'info');
            const startTime = Date.now();
            
            try {
                const response = await fetch(test.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-ID': 'fredericle77@gmail.com'
                    },
                    body: JSON.stringify(test.payload)
                });

                const responseTime = Date.now() - startTime;
                
                if (response.ok) {
                    const data = await response.json();
                    
                    results[test.endpoint] = {
                        name: test.name,
                        success: true,
                        status: response.status,
                        responseTime,
                        hasAnalysisId: !!(data.analysis_id || data.id || data.review_id),
                        savedToDatabase: data.saved_to_database,
                        hasResults: !!(data.results || data.papers || data.articles || data.source),
                        responseKeys: Object.keys(data),
                        analysisIdField: data.analysis_id ? 'analysis_id' : 
                                       data.id ? 'id' : 
                                       data.review_id ? 'review_id' : 'none'
                    };
                    
                    const persistenceStatus = data.saved_to_database === true ? '✅ PERSISTED' :
                                            data.saved_to_database === false ? '❌ NOT PERSISTED' :
                                            results[test.endpoint].hasAnalysisId ? '✅ HAS ANALYSIS_ID' :
                                            '⚠️ NO ANALYSIS_ID';
                    
                    this.log(`${persistenceStatus} ${test.name}`, 
                             data.saved_to_database === true || results[test.endpoint].hasAnalysisId ? 'success' : 'warning', {
                        responseTime: `${responseTime}ms`,
                        hasAnalysisId: results[test.endpoint].hasAnalysisId,
                        savedToDatabase: data.saved_to_database
                    });
                } else {
                    const errorText = await response.text();
                    results[test.endpoint] = {
                        name: test.name,
                        success: false,
                        status: response.status,
                        responseTime,
                        error: errorText
                    };
                    this.log(`❌ ${test.name} failed: ${response.status}`, 'error');
                }
            } catch (error) {
                results[test.endpoint] = {
                    name: test.name,
                    success: false,
                    responseTime: Date.now() - startTime,
                    error: error.message
                };
                this.log(`❌ ${test.name} error: ${error.message}`, 'error');
            }
        }

        return results;
    }

    async testPersistenceFlow() {
        this.log('🔄 TESTING COMPLETE PERSISTENCE FLOW', 'diagnostic');
        
        // Step 1: Create an analysis
        this.log('Step 1: Creating analysis...', 'info');
        const createResponse = await fetch('/api/proxy/generate-review', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-ID': 'fredericle77@gmail.com'
            },
            body: JSON.stringify({
                molecule: 'Persistence flow test analysis',
                objective: 'Test complete persistence flow',
                max_results: 2
            })
        });

        if (!createResponse.ok) {
            this.log('❌ Failed to create analysis for persistence flow test', 'error');
            return { success: false, step: 'create', error: await createResponse.text() };
        }

        const createData = await createResponse.json();
        const analysisId = createData.analysis_id || createData.id || createData.review_id;
        
        this.log(`✅ Analysis created with ID: ${analysisId}`, 'success');

        // Step 2: Wait a moment for persistence
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 3: Try to retrieve the analysis from the list
        this.log('Step 2: Retrieving analysis from list...', 'info');
        const listResponse = await fetch('/api/proxy/generate-review-analyses', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-ID': 'fredericle77@gmail.com'
            }
        });

        if (!listResponse.ok) {
            this.log('❌ Failed to retrieve analyses list', 'error');
            return { success: false, step: 'list', error: await listResponse.text() };
        }

        const listData = await listResponse.json();
        const foundAnalysis = Array.isArray(listData) ? 
            listData.find(a => (a.analysis_id || a.id || a.review_id) === analysisId) : null;

        if (foundAnalysis) {
            this.log('✅ Analysis found in list - persistence working!', 'success');
            return { 
                success: true, 
                analysisId, 
                foundInList: true,
                listCount: Array.isArray(listData) ? listData.length : 0,
                analysisData: foundAnalysis
            };
        } else {
            this.log('⚠️ Analysis not found in list - persistence may have issues', 'warning');
            return { 
                success: false, 
                analysisId, 
                foundInList: false,
                listCount: Array.isArray(listData) ? listData.length : 0,
                step: 'retrieve'
            };
        }
    }

    async runComprehensivePostDeploymentDiagnostic() {
        this.log('🚀 STARTING POST-DEPLOYMENT COMPREHENSIVE DIAGNOSTIC', 'deploy');
        
        // Step 1: Test newly created endpoints
        const newEndpointsTest = await this.testNewlyCreatedEndpoints();
        
        // Step 2: Test updated endpoints with persistence
        const persistenceTest = await this.testUpdatedEndpointsWithPersistence();
        
        // Step 3: Test complete persistence flow
        const flowTest = await this.testPersistenceFlow();

        // Comprehensive analysis
        const diagnosticResults = {
            newEndpoints: {
                total: Object.keys(newEndpointsTest).length,
                working: Object.values(newEndpointsTest).filter(r => r.exists && r.ok).length,
                missing: Object.values(newEndpointsTest).filter(r => !r.exists).length,
                errors: Object.values(newEndpointsTest).filter(r => r.exists && !r.ok).length
            },
            persistenceEndpoints: {
                total: Object.keys(persistenceTest).length,
                successful: Object.values(persistenceTest).filter(r => r.success).length,
                withAnalysisId: Object.values(persistenceTest).filter(r => r.success && r.hasAnalysisId).length,
                withPersistence: Object.values(persistenceTest).filter(r => r.success && r.savedToDatabase === true).length
            },
            persistenceFlow: {
                success: flowTest.success,
                analysisCreated: !!flowTest.analysisId,
                foundInList: flowTest.foundInList,
                step: flowTest.step
            },
            overallStatus: 'UNKNOWN'
        };

        // Determine overall status
        const criticalIssues = [];
        
        if (diagnosticResults.newEndpoints.missing > 0) {
            criticalIssues.push(`${diagnosticResults.newEndpoints.missing} new endpoints still missing`);
        }
        
        if (diagnosticResults.persistenceEndpoints.withAnalysisId === 0) {
            criticalIssues.push('No endpoints returning analysis_id');
        }
        
        if (!diagnosticResults.persistenceFlow.success) {
            criticalIssues.push('Persistence flow test failed');
        }

        if (criticalIssues.length === 0) {
            diagnosticResults.overallStatus = 'SUCCESS';
            this.log('🎉 ALL SYSTEMS WORKING - PERSISTENCE LAYER FULLY FUNCTIONAL!', 'success');
        } else {
            diagnosticResults.overallStatus = 'ISSUES_FOUND';
            this.log('⚠️ Issues found in deployment:', 'warning', criticalIssues);
        }

        // Store results
        window.postDeploymentDiagnostic = {
            diagnosticResults,
            newEndpointsTest,
            persistenceTest,
            flowTest,
            criticalIssues,
            timestamp: new Date().toISOString(),
            logs: this.results
        };

        this.log('✅ Post-deployment diagnostic complete. Results stored in window.postDeploymentDiagnostic', 'success');
        
        return window.postDeploymentDiagnostic;
    }
}

// Auto-execute when script is loaded
(async () => {
    const diagnostic = new PostDeploymentComprehensiveDiagnostic();
    await diagnostic.runComprehensivePostDeploymentDiagnostic();
})();
