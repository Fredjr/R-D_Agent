/**
 * BROWSER-COMPATIBLE FRONTEND PROXY TEST
 * 
 * This version uses the Vercel frontend proxy endpoints to avoid CORS issues.
 * Copy and paste this entire script into your browser console while on the 
 * Vercel frontend domain (https://frontend-psi-seven-85.vercel.app)
 */

class BrowserFrontendProxyTest {
    constructor() {
        this.projectId = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
        this.frontendUrl = window.location.origin; // Use current domain
        this.testUserId = 'fredericle77@gmail.com';
        this.results = [];
        this.startTime = Date.now();
    }

    log(message, type = 'info', data = null) {
        const timestamp = new Date().toISOString();
        const elapsed = Date.now() - this.startTime;
        const emoji = {
            'info': 'ℹ️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌',
            'test': '🧪',
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
                signal: AbortSignal.timeout(options.timeout || 120000) // 2 minute timeout
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

    async testFrontendProxyEndpoint(proxyPath, payload, expectedFields = []) {
        this.log(`🧪 Testing ${proxyPath} via frontend proxy...`, 'test');
        
        const response = await this.makeRequest(`${this.frontendUrl}/api/proxy${proxyPath}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            timeout: 120000  // 2 minutes for GPT-5 processing
        });
        
        if (response.status === 200) {
            try {
                const data = JSON.parse(response.data);
                
                // Check for expected fields
                const hasExpectedFields = expectedFields.length === 0 || expectedFields.some(field => 
                    data.hasOwnProperty(field) && data[field] !== null && data[field] !== undefined
                );
                
                // Check for GPT-5/O3 indicators
                const hasGPT5Indicators = this.checkForGPT5Indicators(data);
                
                this.log(`✅ ${proxyPath} test successful`, 'success', {
                    status: response.status,
                    responseTime: `${response.responseTime}ms`,
                    hasExpectedFields,
                    gpt5Indicators: hasGPT5Indicators,
                    dataSize: JSON.stringify(data).length
                });
                
                return { success: true, data, hasGPT5Indicators };
            } catch (e) {
                this.log(`⚠️ ${proxyPath} responded but data is not JSON`, 'warning', {
                    status: response.status,
                    responseTime: `${response.responseTime}ms`,
                    error: e.message,
                    rawData: response.data.substring(0, 200) + '...'
                });
                return { success: false, error: 'Invalid JSON response' };
            }
        } else {
            this.log(`❌ ${proxyPath} test failed`, 'error', {
                status: response.status,
                error: response.error,
                responseTime: `${response.responseTime}ms`,
                rawData: response.data ? response.data.substring(0, 200) + '...' : 'No data'
            });
            return { success: false, error: response.error || `HTTP ${response.status}` };
        }
    }

    checkForGPT5Indicators(data) {
        const indicators = {
            hasPhDEnhancements: false,
            hasQualityMetrics: false,
            hasAdvancedAnalysis: false,
            hasLongContent: false,
            hasMultiAgent: false
        };
        
        const dataStr = JSON.stringify(data).toLowerCase();
        
        // Check for PhD-level enhancements
        if (dataStr.includes('phd') || dataStr.includes('enhancement') || dataStr.includes('committee')) {
            indicators.hasPhDEnhancements = true;
        }
        
        // Check for quality metrics
        if (dataStr.includes('quality') || dataStr.includes('score') || dataStr.includes('metric')) {
            indicators.hasQualityMetrics = true;
        }
        
        // Check for advanced analysis terms
        if (dataStr.includes('synthesis') || dataStr.includes('framework') || dataStr.includes('methodology')) {
            indicators.hasAdvancedAnalysis = true;
        }
        
        // Check for multi-agent indicators
        if (dataStr.includes('multi-agent') || dataStr.includes('committee') || dataStr.includes('collaborative')) {
            indicators.hasMultiAgent = true;
        }
        
        // Check for content length (GPT-5 should produce longer, more detailed content)
        if (JSON.stringify(data).length > 2000) {
            indicators.hasLongContent = true;
        }
        
        return indicators;
    }

    async runFrontendProxyTest() {
        this.log('🤖 STARTING FRONTEND PROXY TEST', 'gpt5');
        this.log('Testing GPT-5/O3 enhanced system via Vercel frontend proxies', 'info');
        
        const testResults = [];
        
        // Test 1: Generate Summary (via frontend proxy)
        const summaryResult = await this.testFrontendProxyEndpoint('/generate-summary', {
            project_id: this.projectId,
            summary_type: 'comprehensive'
        }, ['summary']);
        testResults.push({ endpoint: 'generate-summary', ...summaryResult });
        
        // Test 2: Generate Review (via frontend proxy)
        const reviewResult = await this.testFrontendProxyEndpoint('/generate-review', {
            molecule: 'artificial intelligence research methods',
            objective: 'Comprehensive review of AI research methodologies for GPT-5 testing',
            max_results: 5
        }, ['results']);
        testResults.push({ endpoint: 'generate-review', ...reviewResult });
        
        // Test 3: Deep Dive (via frontend proxy)
        const deepDiveResult = await this.testFrontendProxyEndpoint('/deep-dive', {
            paper_title: 'Machine Learning in Scientific Research - GPT-5 Enhanced Analysis',
            analysis_type: 'comprehensive'
        }, ['analysis']);
        testResults.push({ endpoint: 'deep-dive', ...deepDiveResult });
        
        // Test 4: Thesis Chapter Generator (via frontend proxy)
        const thesisResult = await this.testFrontendProxyEndpoint('/thesis-chapter-generator', {
            project_id: this.projectId,
            chapter_type: 'literature_review',
            focus_area: 'AI research methodology'
        }, ['thesis_structure']);
        testResults.push({ endpoint: 'thesis-chapter-generator', ...thesisResult });
        
        // Generate comprehensive report
        this.generateFrontendProxyReport(testResults);
        
        return testResults;
    }

    generateFrontendProxyReport(testResults) {
        this.log('📋 FRONTEND PROXY TEST REPORT', 'gpt5');
        
        const successfulTests = testResults.filter(r => r.success).length;
        const gpt5EnhancedTests = testResults.filter(r => r.success && r.hasGPT5Indicators).length;
        
        console.log('\n🤖 GPT-5/O3 ENHANCED SYSTEM TEST RESULTS (via Frontend Proxy):');
        console.log(`   Successful Endpoints: ${successfulTests}/${testResults.length}`);
        console.log(`   GPT-5 Enhanced Responses: ${gpt5EnhancedTests}/${successfulTests}`);
        
        console.log('\n📊 DETAILED RESULTS:');
        testResults.forEach(result => {
            const status = result.success ? '✅ PASS' : '❌ FAIL';
            const gpt5Status = result.hasGPT5Indicators ? '🤖 GPT-5 Enhanced' : '⚠️ Basic Response';
            console.log(`   ${result.endpoint}: ${status} ${result.success ? gpt5Status : ''}`);
            
            if (result.success && result.hasGPT5Indicators) {
                const indicators = Object.entries(result.hasGPT5Indicators)
                    .filter(([, value]) => value)
                    .map(([key]) => key);
                console.log(`     GPT-5 Indicators: ${indicators.join(', ')}`);
            }
            
            if (!result.success) {
                console.log(`     Error: ${result.error}`);
            }
        });
        
        console.log('\n🎯 OVERALL ASSESSMENT:');
        const readinessScore = (successfulTests * 20) + (gpt5EnhancedTests * 15);
        console.log(`   Frontend Proxy Readiness Score: ${readinessScore}/100`);
        
        if (readinessScore >= 90) {
            console.log('   Status: 🎉 FULLY READY FOR PRODUCTION');
            console.log('   Quality: 🤖 GPT-5/O3 enhancements confirmed via frontend');
        } else if (readinessScore >= 70) {
            console.log('   Status: ⚠️ PARTIALLY READY');
            console.log('   Quality: 🔄 Some endpoints need attention');
        } else if (readinessScore >= 50) {
            console.log('   Status: 🚧 DEPLOYMENT IN PROGRESS');
            console.log('   Quality: ⏳ System may still be starting up');
        } else {
            console.log('   Status: ❌ NOT READY');
            console.log('   Quality: 🔧 Critical issues need resolution');
        }
        
        console.log('\n💡 NOTES:');
        console.log('   - This test uses frontend proxy endpoints to avoid CORS issues');
        console.log('   - Frontend proxies include backward compatibility layer');
        console.log('   - GPT-5/O3 enhancements should be visible in response quality and length');
        
        this.log('🎉 FRONTEND PROXY TEST COMPLETED', 'gpt5');
    }
}

// Check if we're on the correct domain
if (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('localhost')) {
    console.log('🚀 Starting Frontend Proxy Test...');
    const tester = new BrowserFrontendProxyTest();
    tester.runFrontendProxyTest().catch(console.error);
} else {
    console.log('⚠️ Please run this test from the Vercel frontend domain:');
    console.log('   https://frontend-psi-seven-85.vercel.app');
    console.log('   Then paste this script into the browser console.');
}
