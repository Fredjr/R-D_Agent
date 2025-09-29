/**
 * DEEP DIVE PERSISTENCE DIAGNOSTIC
 * Investigate why deep dive analyses are not persisting to the database
 */

class DeepDivePersistenceDiagnostic {
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

    async checkDeepDiveAnalysesList() {
        this.log('🔍 CHECKING CURRENT DEEP DIVE ANALYSES LIST', 'diagnostic');
        
        try {
            const response = await fetch('/api/proxy/deep-dive-analyses', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': 'fredericle77@gmail.com'
                }
            });

            if (response.ok) {
                const data = await response.json();
                
                // Filter for today's analyses
                const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
                const todaysAnalyses = data.filter(analysis => 
                    analysis.created_at && analysis.created_at.startsWith('2025-09-29')
                );

                this.log('✅ Deep dive analyses list retrieved', 'success', {
                    totalAnalyses: data.length,
                    todaysAnalyses: todaysAnalyses.length,
                    recentAnalyses: data.slice(0, 5).map(a => ({
                        id: a.analysis_id,
                        title: a.article_title,
                        pmid: a.article_pmid,
                        status: a.processing_status,
                        created: a.created_at
                    }))
                });

                return { success: true, data, todaysAnalyses };
            } else {
                this.log('❌ Failed to retrieve deep dive analyses list', 'error', response.status);
                return { success: false, error: response.status };
            }
        } catch (error) {
            this.log('❌ Error retrieving deep dive analyses list', 'error', error.message);
            return { success: false, error: error.message };
        }
    }

    async testDeepDiveEndpointDirectly() {
        this.log('🔍 TESTING DEEP DIVE ENDPOINT DIRECTLY', 'diagnostic');
        
        const testPayload = {
            pmid: '29622564',
            title: 'The cell biology of systemic insulin function',
            objective: 'Persistence diagnostic test',
            save_to_database: true,
            user_id: 'fredericle77@gmail.com'
        };

        try {
            const response = await fetch('/api/proxy/deep-dive', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': 'fredericle77@gmail.com'
                },
                body: JSON.stringify(testPayload)
            });

            const responseTime = Date.now();
            
            if (response.ok) {
                const data = await response.json();
                
                this.log('✅ Deep dive endpoint responded successfully', 'success', {
                    status: response.status,
                    hasAnalysisId: !!data.analysis_id,
                    hasResults: !!data.results_structured,
                    hasDiagnostics: !!data.diagnostics,
                    responseKeys: Object.keys(data)
                });

                // Check if analysis_id is present (indicates database save)
                if (data.analysis_id) {
                    this.log('✅ Analysis ID present - database save likely successful', 'success', {
                        analysisId: data.analysis_id
                    });
                } else {
                    this.log('⚠️ No analysis ID - database save may have failed', 'warning');
                }

                return { success: true, data, hasAnalysisId: !!data.analysis_id };
            } else {
                const errorText = await response.text();
                this.log('❌ Deep dive endpoint failed', 'error', {
                    status: response.status,
                    error: errorText
                });
                return { success: false, error: response.status, errorText };
            }
        } catch (error) {
            this.log('❌ Deep dive endpoint error', 'error', error.message);
            return { success: false, error: error.message };
        }
    }

    async checkBackendDeepDiveDirectly() {
        this.log('🔍 TESTING BACKEND DEEP DIVE DIRECTLY', 'diagnostic');
        
        const backendPayload = {
            pmid: '29622564',
            title: 'The cell biology of systemic insulin function',
            objective: 'Backend persistence diagnostic test',
            user_id: 'fredericle77@gmail.com'
        };

        try {
            // Note: This will likely fail due to CORS, but we can see the error
            const response = await fetch('https://r-dagent-production.up.railway.app/deep-dive', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(backendPayload)
            });

            if (response.ok) {
                const data = await response.json();
                this.log('✅ Backend deep dive successful', 'success', {
                    hasAnalysisId: !!data.analysis_id,
                    responseKeys: Object.keys(data)
                });
                return { success: true, data };
            } else {
                this.log('❌ Backend deep dive failed', 'error', response.status);
                return { success: false, error: response.status };
            }
        } catch (error) {
            this.log('⚠️ Backend deep dive blocked (expected CORS)', 'warning', error.message);
            return { success: false, error: 'CORS_BLOCKED', expected: true };
        }
    }

    async investigatePMIDMismatch() {
        this.log('🔍 INVESTIGATING PMID MISMATCH ISSUE', 'diagnostic');
        
        // The response showed mismatch: true and resolved different title
        const mismatchAnalysis = {
            expectedPMID: '29622564',
            expectedTitle: 'The cell biology of systemic insulin function',
            resolvedTitle: 'Identification of a Strigoterpenoid with Dual Nrf2 and Nf-κB Modulatory Activity',
            mismatchDetected: true,
            possibleCauses: [
                'PMID lookup returned different paper than expected',
                'Title resolution found different content',
                'Database has incorrect PMID-title mapping',
                'PMC/PubMed API returned unexpected results'
            ]
        };

        this.log('🚨 PMID/Title mismatch detected', 'critical', mismatchAnalysis);
        
        // Test PMID lookup directly
        try {
            const response = await fetch(`/api/proxy/pubmed/details/${mismatchAnalysis.expectedPMID}`);
            if (response.ok) {
                const data = await response.json();
                this.log('📄 PMID lookup result:', 'info', {
                    pmid: data.pmid,
                    title: data.title,
                    matchesExpected: data.title === mismatchAnalysis.expectedTitle
                });
                
                return { success: true, pmidData: data, mismatchAnalysis };
            } else {
                this.log('❌ PMID lookup failed', 'error', response.status);
                return { success: false, error: response.status, mismatchAnalysis };
            }
        } catch (error) {
            this.log('❌ PMID lookup error', 'error', error.message);
            return { success: false, error: error.message, mismatchAnalysis };
        }
    }

    async checkDatabaseSaveEndpoint() {
        this.log('🔍 CHECKING DATABASE SAVE ENDPOINT', 'diagnostic');
        
        // Try to check if there's a specific endpoint for saving deep dive results
        const testAnalysisData = {
            article_pmid: '29622564',
            article_title: 'Persistence Test Analysis',
            objective: 'Database save test',
            processing_status: 'completed',
            results: { test: 'data' },
            user_id: 'fredericle77@gmail.com'
        };

        try {
            const response = await fetch('/api/proxy/deep-dive-analyses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': 'fredericle77@gmail.com'
                },
                body: JSON.stringify(testAnalysisData)
            });

            if (response.ok) {
                const data = await response.json();
                this.log('✅ Database save endpoint working', 'success', {
                    analysisId: data.analysis_id || data.id,
                    responseKeys: Object.keys(data)
                });
                return { success: true, data };
            } else {
                const errorText = await response.text();
                this.log('❌ Database save endpoint failed', 'error', {
                    status: response.status,
                    error: errorText
                });
                return { success: false, error: response.status, errorText };
            }
        } catch (error) {
            this.log('❌ Database save endpoint error', 'error', error.message);
            return { success: false, error: error.message };
        }
    }

    async runComprehensiveDiagnostic() {
        this.log('🚀 STARTING COMPREHENSIVE DEEP DIVE PERSISTENCE DIAGNOSTIC', 'diagnostic');
        
        // Step 1: Check current analyses list
        const listCheck = await this.checkDeepDiveAnalysesList();
        
        // Step 2: Test deep dive endpoint directly
        const endpointTest = await this.testDeepDiveEndpointDirectly();
        
        // Step 3: Investigate PMID mismatch
        const mismatchInvestigation = await this.investigatePMIDMismatch();
        
        // Step 4: Check backend directly (will likely fail due to CORS)
        const backendTest = await this.checkBackendDeepDiveDirectly();
        
        // Step 5: Test database save endpoint
        const databaseTest = await this.checkDatabaseSaveEndpoint();

        // Comprehensive analysis
        const diagnosticResults = {
            listCheck: listCheck.success,
            endpointTest: endpointTest.success,
            mismatchInvestigation: mismatchInvestigation.success,
            backendTest: backendTest.success || backendTest.expected,
            databaseTest: databaseTest.success,
            criticalIssues: [],
            recommendations: []
        };

        // Identify critical issues
        if (!listCheck.success) {
            diagnosticResults.criticalIssues.push('Cannot retrieve deep dive analyses list');
        }
        
        if (!endpointTest.success) {
            diagnosticResults.criticalIssues.push('Deep dive endpoint failing');
        } else if (!endpointTest.hasAnalysisId) {
            diagnosticResults.criticalIssues.push('Deep dive completes but no analysis ID returned (database save issue)');
        }
        
        if (mismatchInvestigation.success && mismatchInvestigation.mismatchAnalysis.mismatchDetected) {
            diagnosticResults.criticalIssues.push('PMID/Title mismatch causing analysis issues');
        }
        
        if (!databaseTest.success) {
            diagnosticResults.criticalIssues.push('Database save endpoint not working');
        }

        // Generate recommendations
        if (diagnosticResults.criticalIssues.length > 0) {
            diagnosticResults.recommendations = [
                'Check backend logs for database save errors',
                'Verify PMID lookup and title resolution accuracy',
                'Test database connectivity and transaction handling',
                'Validate deep dive analysis save workflow',
                'Check for authentication/authorization issues in save process'
            ];
        }

        this.log('📊 DIAGNOSTIC SUMMARY', 'diagnostic', diagnosticResults);

        // Store results
        window.deepDivePersistenceDiagnostic = {
            diagnosticResults,
            listCheck,
            endpointTest,
            mismatchInvestigation,
            backendTest,
            databaseTest,
            timestamp: new Date().toISOString(),
            logs: this.results
        };

        this.log('✅ Comprehensive diagnostic complete. Results stored in window.deepDivePersistenceDiagnostic', 'success');
        
        return window.deepDivePersistenceDiagnostic;
    }
}

// Auto-execute when script is loaded
(async () => {
    const diagnostic = new DeepDivePersistenceDiagnostic();
    await diagnostic.runComprehensiveDiagnostic();
})();
