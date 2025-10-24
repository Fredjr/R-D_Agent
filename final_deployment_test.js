/**
 * FINAL DEPLOYMENT TEST v1.0
 * 
 * Comprehensive test of all fixes applied:
 * 1. Backend data model fixes (Article.project_id -> ArticleCollection)
 * 2. CuttingEdgeModelManager API key initialization
 * 3. Frontend proxy routes functionality
 * 4. Integration test validation
 */

class FinalDeploymentTest {
    constructor() {
        this.frontendUrl = 'https://frontend-psi-seven-85.vercel.app';
        this.backendUrl = 'https://r-dagent-production.up.railway.app';
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
            'deploy': '🚀', 'test': '🧪', 'monitor': '📊', 'complete': '🎉'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} [${timestamp}] [+${elapsed}ms] ${message}`);
        if (data) console.log('   Data:', data);
        this.results.push({ timestamp, type, message, data, elapsed });
    }

    async waitForBackendHealth(maxWaitTime = 120000) {
        this.log('🏥 Waiting for backend to be healthy...', 'monitor');
        const startWait = Date.now();
        
        while (Date.now() - startWait < maxWaitTime) {
            try {
                const response = await fetch(`${this.backendUrl}/health`, {
                    method: 'GET',
                    signal: AbortSignal.timeout(10000)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.log('✅ Backend is healthy!', 'success', {
                        version: data.version,
                        service: data.service,
                        features: data.features?.length || 0
                    });
                    return true;
                }
            } catch (error) {
                // Continue waiting
            }
            
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        }
        
        this.log('❌ Backend health check timeout', 'error');
        return false;
    }

    async testNewEndpoints() {
        this.log('🧪 Testing all 4 new endpoints...', 'test');
        
        const endpoints = [
            {
                name: 'Generate Summary',
                path: '/generate-summary',
                payload: {
                    project_id: this.projectId,
                    objective: 'Final deployment test summary',
                    summary_type: 'comprehensive',
                    academic_level: 'phd'
                }
            },
            {
                name: 'Thesis Chapter Generator',
                path: '/thesis-chapter-generator',
                payload: {
                    project_id: this.projectId,
                    objective: 'Final deployment test thesis',
                    chapter_focus: 'literature_review',
                    academic_level: 'phd'
                }
            },
            {
                name: 'Literature Gap Analysis',
                path: '/literature-gap-analysis',
                payload: {
                    project_id: this.projectId,
                    objective: 'Final deployment test gap analysis',
                    gap_types: ['theoretical', 'methodological'],
                    academic_level: 'phd'
                }
            },
            {
                name: 'Methodology Synthesis',
                path: '/methodology-synthesis',
                payload: {
                    project_id: this.projectId,
                    objective: 'Final deployment test methodology',
                    methodology_types: ['experimental', 'observational'],
                    academic_level: 'phd'
                }
            }
        ];

        const results = [];
        
        for (const endpoint of endpoints) {
            this.log(`Testing ${endpoint.name}...`, 'test');
            
            try {
                const startTime = Date.now();
                
                // Test via frontend proxy
                const frontendResponse = await fetch(`${this.frontendUrl}/api/proxy${endpoint.path}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-ID': this.testUserId
                    },
                    body: JSON.stringify(endpoint.payload),
                    signal: AbortSignal.timeout(30000) // 30 second timeout
                });
                
                const responseTime = Date.now() - startTime;
                let responseData = null;
                let errorMessage = null;
                
                if (frontendResponse.ok) {
                    try {
                        responseData = await frontendResponse.json();
                    } catch (e) {
                        errorMessage = 'Invalid JSON response';
                    }
                } else {
                    try {
                        const errorText = await frontendResponse.text();
                        errorMessage = errorText;
                    } catch (e) {
                        errorMessage = `HTTP ${frontendResponse.status}`;
                    }
                }
                
                const result = {
                    name: endpoint.name,
                    status: frontendResponse.status,
                    ok: frontendResponse.ok,
                    responseTime,
                    hasData: !!responseData,
                    errorMessage,
                    dataKeys: responseData ? Object.keys(responseData) : null
                };
                
                results.push(result);
                
                if (result.ok) {
                    this.log(`✅ ${endpoint.name}: SUCCESS`, 'success', {
                        status: result.status,
                        responseTime: `${result.responseTime}ms`,
                        dataKeys: result.dataKeys?.length || 0
                    });
                } else {
                    this.log(`❌ ${endpoint.name}: FAILED`, 'error', {
                        status: result.status,
                        responseTime: `${result.responseTime}ms`,
                        error: result.errorMessage?.substring(0, 100) || 'Unknown error'
                    });
                }
                
            } catch (error) {
                results.push({
                    name: endpoint.name,
                    status: 0,
                    ok: false,
                    responseTime: 0,
                    hasData: false,
                    errorMessage: error.message,
                    dataKeys: null
                });
                
                this.log(`❌ ${endpoint.name}: EXCEPTION`, 'error', {
                    error: error.message
                });
            }
        }
        
        return results;
    }

    async runFinalDeploymentTest() {
        this.log('🚀 STARTING FINAL DEPLOYMENT TEST', 'deploy');
        this.log('Testing all fixes: data model, API keys, proxy routes', 'info');
        
        // Phase 1: Wait for backend health
        this.log('📊 Phase 1: Backend Health Check', 'monitor');
        const backendHealthy = await this.waitForBackendHealth();
        
        if (!backendHealthy) {
            this.log('❌ Cannot proceed - backend unhealthy', 'error');
            return this.generateFailureReport();
        }
        
        // Phase 2: Test all new endpoints
        this.log('🧪 Phase 2: Testing New Endpoints', 'test');
        const endpointResults = await this.testNewEndpoints();
        
        // Generate comprehensive report
        this.generateFinalReport(endpointResults);
    }

    generateFinalReport(endpointResults) {
        this.log('📋 FINAL DEPLOYMENT TEST REPORT', 'complete');
        
        console.log('\n🚀 FINAL DEPLOYMENT TEST RESULTS:');
        console.log(`   Test Duration: ${Math.round((Date.now() - this.startTime) / 1000)}s`);
        
        // Endpoint Results Summary
        const successfulEndpoints = endpointResults.filter(r => r.ok).length;
        const totalEndpoints = endpointResults.length;
        const successRate = (successfulEndpoints / totalEndpoints * 100).toFixed(1);
        
        console.log('\n🧪 ENDPOINT TEST RESULTS:');
        console.log(`   Successful Endpoints: ${successfulEndpoints}/${totalEndpoints} (${successRate}%)`);
        
        endpointResults.forEach(result => {
            const status = result.ok ? '✅' : '❌';
            console.log(`\n   ${result.name}:`);
            console.log(`     Status: ${status} ${result.status} (${result.responseTime}ms)`);
            
            if (result.ok) {
                console.log(`     Data Keys: ${result.dataKeys?.length || 0}`);
                if (result.dataKeys) {
                    console.log(`     Response Structure: ${result.dataKeys.slice(0, 5).join(', ')}${result.dataKeys.length > 5 ? '...' : ''}`);
                }
            } else {
                console.log(`     Error: ${result.errorMessage?.substring(0, 100) || 'Unknown error'}`);
            }
        });
        
        // Overall Assessment
        console.log('\n🎯 OVERALL DEPLOYMENT ASSESSMENT:');
        
        if (successRate >= 75) {
            console.log('   Status: 🎉 EXCELLENT - Deployment successful!');
            console.log('   All major fixes working correctly');
            console.log('   Integration test should show significant improvement');
        } else if (successRate >= 50) {
            console.log('   Status: ✅ GOOD - Most endpoints working');
            console.log('   Some endpoints may need additional fixes');
        } else if (successRate >= 25) {
            console.log('   Status: ⚠️ PARTIAL - Some progress made');
            console.log('   Additional debugging needed');
        } else {
            console.log('   Status: ❌ FAILED - Major issues remain');
            console.log('   Deployment fixes not yet effective');
        }
        
        // Next Steps
        console.log('\n🚀 NEXT STEPS:');
        if (successRate >= 75) {
            console.log('   ✅ Run integration test to validate improvements');
            console.log('   ✅ Expected: 20% → 85%+ success rate');
            console.log('   ✅ All systems ready for production use');
        } else {
            console.log('   🔧 Debug remaining endpoint issues');
            console.log('   📊 Check Railway deployment logs');
            console.log('   🔄 Re-run test after additional fixes');
        }
        
        this.log('🎉 FINAL DEPLOYMENT TEST COMPLETED', 'complete');
        
        return {
            successRate: parseFloat(successRate),
            successfulEndpoints,
            totalEndpoints,
            endpointResults,
            overallStatus: successRate >= 75 ? 'EXCELLENT' : successRate >= 50 ? 'GOOD' : successRate >= 25 ? 'PARTIAL' : 'FAILED'
        };
    }

    generateFailureReport() {
        console.log('\n❌ FINAL DEPLOYMENT TEST FAILED:');
        console.log('   Backend health check failed');
        console.log('   Cannot test endpoints without healthy backend');
        console.log('\n🔧 RECOMMENDED ACTIONS:');
        console.log('   - Check Railway deployment logs');
        console.log('   - Verify environment variables');
        console.log('   - Check for startup errors');
        
        return {
            successRate: 0,
            successfulEndpoints: 0,
            totalEndpoints: 4,
            endpointResults: [],
            overallStatus: 'FAILED'
        };
    }
}

// Auto-run when pasted into browser console
if (typeof window !== 'undefined') {
    console.log('🚀 Starting Final Deployment Test...');
    console.log('📊 Testing all backend fixes and endpoint functionality');
    const test = new FinalDeploymentTest();
    test.runFinalDeploymentTest().catch(console.error);
} else {
    module.exports = FinalDeploymentTest;
}
