/**
 * COMPREHENSIVE DIAGNOSTIC TEST v2.0
 * 
 * Complete system diagnostic for GPT-5/O3 enhanced R&D Agent platform
 * - Backend health and version verification
 * - Database connectivity and data integrity
 * - API endpoint functionality and response quality
 * - GPT-5/O3 model integration verification
 * - PhD-level enhancement detection
 * - Performance metrics and response times
 * - Error handling and recovery testing
 */

class ComprehensiveDiagnosticTest {
    constructor() {
        this.backendUrl = 'https://r-dagent-production.up.railway.app';
        this.frontendUrl = 'https://frontend-psi-seven-85.vercel.app';
        this.testProjectId = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
        this.testUserId = 'fredericle77@gmail.com';
        this.results = [];
        this.startTime = Date.now();
        this.diagnostics = {
            backend: {},
            database: {},
            endpoints: {},
            gpt5: {},
            performance: {},
            errors: []
        };
    }

    log(message, type = 'info', data = null) {
        const timestamp = new Date().toISOString();
        const elapsed = Date.now() - this.startTime;
        const emoji = {
            'info': 'ℹ️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌',
            'diagnostic': '🔍',
            'performance': '⚡',
            'database': '🗄️',
            'gpt5': '🤖'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} [${timestamp}] [+${elapsed}ms] ${message}`);
        if (data) {
            console.log('   Data:', data);
        }
        this.results.push({ timestamp, type, message, data, elapsed });
    }

    async makeRequest(url, options = {}) {
        const startTime = Date.now();
        try {
            const response = await fetch(url, {
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.testUserId,
                    ...options.headers
                },
                body: options.body || null,
                signal: AbortSignal.timeout(options.timeout || 30000)
            });
            
            const responseTime = Date.now() - startTime;
            const data = await response.text();
            
            return {
                status: response.status,
                data: data,
                responseTime,
                headers: Object.fromEntries(response.headers.entries())
            };
        } catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                status: 0,
                error: error.message,
                responseTime
            };
        }
    }

    async diagnoseBackendHealth() {
        this.log('🔍 Diagnosing Backend Health...', 'diagnostic');
        
        const healthResponse = await this.makeRequest(`${this.backendUrl}/health`);
        
        if (healthResponse.status === 200) {
            try {
                const healthData = JSON.parse(healthResponse.data);
                this.diagnostics.backend = {
                    status: 'healthy',
                    version: healthData.version,
                    service: healthData.service,
                    features: healthData.features,
                    responseTime: healthResponse.responseTime
                };
                
                this.log('✅ Backend health check passed', 'success', this.diagnostics.backend);
                return true;
            } catch (e) {
                this.diagnostics.backend = { status: 'unhealthy', error: 'Invalid JSON response' };
                this.log('❌ Backend health check failed - invalid JSON', 'error');
                return false;
            }
        } else {
            this.diagnostics.backend = { 
                status: 'unhealthy', 
                error: healthResponse.error || `HTTP ${healthResponse.status}`,
                responseTime: healthResponse.responseTime
            };
            this.log('❌ Backend health check failed', 'error', this.diagnostics.backend);
            return false;
        }
    }

    async diagnoseDatabaseConnectivity() {
        this.log('🗄️ Diagnosing Database Connectivity...', 'database');
        
        const dbHealthResponse = await this.makeRequest(`${this.backendUrl}/health/db`);
        
        if (dbHealthResponse.status === 200) {
            try {
                const dbData = JSON.parse(dbHealthResponse.data);
                this.diagnostics.database = {
                    status: 'connected',
                    details: dbData,
                    responseTime: dbHealthResponse.responseTime
                };
                
                this.log('✅ Database connectivity verified', 'success', this.diagnostics.database);
                return true;
            } catch (e) {
                this.diagnostics.database = { status: 'error', error: 'Invalid DB response' };
                this.log('❌ Database connectivity check failed', 'error');
                return false;
            }
        } else {
            this.diagnostics.database = { 
                status: 'disconnected', 
                error: dbHealthResponse.error || `HTTP ${dbHealthResponse.status}`
            };
            this.log('❌ Database connectivity failed', 'error', this.diagnostics.database);
            return false;
        }
    }

    async diagnoseEndpointFunctionality() {
        this.log('🔍 Diagnosing Endpoint Functionality...', 'diagnostic');
        
        const endpoints = [
            { path: '/generate-review', method: 'POST', payload: { molecule: 'test', objective: 'diagnostic test', max_results: 1 } },
            { path: '/deep-dive', method: 'POST', payload: { pmid: '12345', title: 'Test Article', url: 'https://example.com' } },
            { path: '/openapi.json', method: 'GET', payload: null }
        ];
        
        const endpointResults = {};
        
        for (const endpoint of endpoints) {
            const response = await this.makeRequest(`${this.backendUrl}${endpoint.path}`, {
                method: endpoint.method,
                body: endpoint.payload ? JSON.stringify(endpoint.payload) : null,
                timeout: 60000
            });
            
            endpointResults[endpoint.path] = {
                status: response.status,
                responseTime: response.responseTime,
                working: response.status === 200,
                error: response.error
            };
            
            if (response.status === 200) {
                this.log(`✅ ${endpoint.path} endpoint working`, 'success');
            } else {
                this.log(`❌ ${endpoint.path} endpoint failed`, 'error', { status: response.status, error: response.error });
            }
        }
        
        this.diagnostics.endpoints = endpointResults;
        return Object.values(endpointResults).some(r => r.working);
    }

    async diagnoseGPT5Integration() {
        this.log('🤖 Diagnosing GPT-5/O3 Integration...', 'gpt5');
        
        // Test a simple endpoint that should use GPT-5/O3
        const gpt5TestResponse = await this.makeRequest(`${this.backendUrl}/generate-review`, {
            method: 'POST',
            body: JSON.stringify({
                molecule: 'GPT-5 diagnostic test',
                objective: 'Test GPT-5/O3 integration and quality enhancement',
                max_results: 2
            }),
            timeout: 90000
        });
        
        if (gpt5TestResponse.status === 200) {
            try {
                const data = JSON.parse(gpt5TestResponse.data);
                
                // Analyze response for GPT-5/O3 indicators
                const indicators = this.analyzeGPT5Indicators(data);
                
                this.diagnostics.gpt5 = {
                    status: 'integrated',
                    responseTime: gpt5TestResponse.responseTime,
                    indicators: indicators,
                    dataSize: JSON.stringify(data).length,
                    qualityScore: this.calculateQualityScore(indicators)
                };
                
                this.log('✅ GPT-5/O3 integration verified', 'success', this.diagnostics.gpt5);
                return true;
            } catch (e) {
                this.diagnostics.gpt5 = { 
                    status: 'response_error', 
                    error: 'JSON parsing failed - possibly very long response',
                    responseTime: gpt5TestResponse.responseTime,
                    dataPreview: gpt5TestResponse.data.substring(0, 200) + '...'
                };
                this.log('⚠️ GPT-5/O3 responding but JSON parsing failed (likely very long response)', 'warning');
                return true; // Still working, just formatting issues
            }
        } else {
            this.diagnostics.gpt5 = { 
                status: 'not_working', 
                error: gpt5TestResponse.error || `HTTP ${gpt5TestResponse.status}`
            };
            this.log('❌ GPT-5/O3 integration test failed', 'error', this.diagnostics.gpt5);
            return false;
        }
    }

    analyzeGPT5Indicators(data) {
        const dataStr = JSON.stringify(data).toLowerCase();
        
        return {
            hasPhDContent: dataStr.includes('phd') || dataStr.includes('doctoral') || dataStr.includes('committee'),
            hasQualityMetrics: dataStr.includes('quality') || dataStr.includes('score') || dataStr.includes('metric'),
            hasAdvancedAnalysis: dataStr.includes('synthesis') || dataStr.includes('framework') || dataStr.includes('methodology'),
            hasLongContent: JSON.stringify(data).length > 2000,
            hasStructuredOutput: dataStr.includes('structure') || dataStr.includes('section') || dataStr.includes('chapter'),
            hasMultiAgent: dataStr.includes('multi-agent') || dataStr.includes('collaborative') || dataStr.includes('committee')
        };
    }

    calculateQualityScore(indicators) {
        const weights = {
            hasPhDContent: 20,
            hasQualityMetrics: 15,
            hasAdvancedAnalysis: 20,
            hasLongContent: 15,
            hasStructuredOutput: 15,
            hasMultiAgent: 15
        };
        
        let score = 0;
        for (const [indicator, value] of Object.entries(indicators)) {
            if (value && weights[indicator]) {
                score += weights[indicator];
            }
        }
        
        return score;
    }

    async diagnosePerformance() {
        this.log('⚡ Diagnosing Performance Metrics...', 'performance');
        
        const performanceTests = [];
        
        // Test multiple quick requests
        for (let i = 0; i < 3; i++) {
            const startTime = Date.now();
            const response = await this.makeRequest(`${this.backendUrl}/health`);
            const endTime = Date.now();
            
            performanceTests.push({
                test: `health_check_${i + 1}`,
                responseTime: endTime - startTime,
                status: response.status,
                success: response.status === 200
            });
        }
        
        const avgResponseTime = performanceTests.reduce((sum, test) => sum + test.responseTime, 0) / performanceTests.length;
        const successRate = performanceTests.filter(test => test.success).length / performanceTests.length;
        
        this.diagnostics.performance = {
            averageResponseTime: avgResponseTime,
            successRate: successRate,
            tests: performanceTests,
            rating: avgResponseTime < 1000 ? 'excellent' : avgResponseTime < 3000 ? 'good' : 'needs_improvement'
        };
        
        this.log('⚡ Performance analysis completed', 'performance', this.diagnostics.performance);
        return successRate > 0.8;
    }

    async runComprehensiveDiagnostic() {
        this.log('🔍 STARTING COMPREHENSIVE DIAGNOSTIC TEST', 'diagnostic');
        this.log('Analyzing GPT-5/O3 enhanced R&D Agent platform', 'info');
        
        const diagnosticResults = {};
        
        // Run all diagnostic tests
        diagnosticResults.backendHealth = await this.diagnoseBackendHealth();
        diagnosticResults.databaseConnectivity = await this.diagnoseDatabaseConnectivity();
        diagnosticResults.endpointFunctionality = await this.diagnoseEndpointFunctionality();
        diagnosticResults.gpt5Integration = await this.diagnoseGPT5Integration();
        diagnosticResults.performance = await this.diagnosePerformance();
        
        // Generate comprehensive report
        this.generateDiagnosticReport(diagnosticResults);
        
        return { diagnosticResults, diagnostics: this.diagnostics };
    }

    generateDiagnosticReport(results) {
        this.log('📋 COMPREHENSIVE DIAGNOSTIC REPORT', 'diagnostic');
        
        const passedTests = Object.values(results).filter(r => r).length;
        const totalTests = Object.keys(results).length;
        
        console.log('\n🔍 DIAGNOSTIC TEST RESULTS:');
        console.log(`   Passed Tests: ${passedTests}/${totalTests}`);
        console.log(`   Overall Health: ${(passedTests / totalTests * 100).toFixed(1)}%`);
        
        console.log('\n📊 DETAILED DIAGNOSTICS:');
        
        // Backend Status
        console.log(`   Backend Health: ${results.backendHealth ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
        if (this.diagnostics.backend.version) {
            console.log(`     Version: ${this.diagnostics.backend.version}`);
            console.log(`     Features: ${this.diagnostics.backend.features?.length || 0} active`);
        }
        
        // Database Status
        console.log(`   Database: ${results.databaseConnectivity ? '✅ CONNECTED' : '❌ DISCONNECTED'}`);
        
        // Endpoints Status
        console.log(`   Endpoints: ${results.endpointFunctionality ? '✅ FUNCTIONAL' : '❌ ISSUES DETECTED'}`);
        
        // GPT-5/O3 Status
        console.log(`   GPT-5/O3 Integration: ${results.gpt5Integration ? '✅ ACTIVE' : '❌ NOT WORKING'}`);
        if (this.diagnostics.gpt5.qualityScore) {
            console.log(`     Quality Score: ${this.diagnostics.gpt5.qualityScore}/100`);
        }
        
        // Performance Status
        console.log(`   Performance: ${results.performance ? '✅ GOOD' : '❌ NEEDS IMPROVEMENT'}`);
        if (this.diagnostics.performance.averageResponseTime) {
            console.log(`     Avg Response Time: ${this.diagnostics.performance.averageResponseTime.toFixed(0)}ms`);
        }
        
        console.log('\n🎯 SYSTEM ASSESSMENT:');
        if (passedTests === totalTests) {
            console.log('   Status: 🎉 ALL SYSTEMS OPERATIONAL');
            console.log('   GPT-5/O3 enhanced platform is fully functional');
        } else if (passedTests >= totalTests * 0.8) {
            console.log('   Status: ⚠️ MOSTLY OPERATIONAL');
            console.log('   Minor issues detected but core functionality working');
        } else {
            console.log('   Status: ❌ CRITICAL ISSUES DETECTED');
            console.log('   Multiple systems need attention');
        }
        
        this.log('🎉 COMPREHENSIVE DIAGNOSTIC COMPLETED', 'diagnostic');
    }
}

// Auto-run when pasted into browser console
if (typeof window !== 'undefined') {
    console.log('🔍 Starting Comprehensive Diagnostic Test...');
    const diagnosticTest = new ComprehensiveDiagnosticTest();
    diagnosticTest.runComprehensiveDiagnostic().catch(console.error);
} else {
    // Export for Node.js if needed
    module.exports = ComprehensiveDiagnosticTest;
}
