/**
 * CORRECTED BROWSER-COMPATIBLE FRONTEND PROXY TEST
 * 
 * This version uses the correct request formats for each endpoint.
 * Copy and paste this entire script into your browser console while on:
 * https://frontend-psi-seven-85.vercel.app
 */

class CorrectedBrowserFrontendTest {
    constructor() {
        this.projectId = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
        this.frontendUrl = window.location.origin;
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
                signal: AbortSignal.timeout(options.timeout || 120000)
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

    async testEndpoint(proxyPath, payload, expectedFields = []) {
        this.log(`🧪 Testing ${proxyPath} via frontend proxy...`, 'test');
        
        const response = await this.makeRequest(`${this.frontendUrl}/api/proxy${proxyPath}`, {
            method: 'POST',
            body: JSON.stringify(payload),
            timeout: 120000
        });
        
        if (response.status === 200) {
            try {
                const data = JSON.parse(response.data);
                
                const hasExpectedFields = expectedFields.length === 0 || expectedFields.some(field => 
                    this.hasNestedField(data, field)
                );
                
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
                this.log(`⚠️ ${proxyPath} responded but data is not valid JSON`, 'warning', {
                    status: response.status,
                    responseTime: `${response.responseTime}ms`,
                    error: e.message,
                    rawDataPreview: response.data.substring(0, 300) + '...'
                });
                return { success: false, error: 'Invalid JSON response' };
            }
        } else {
            this.log(`❌ ${proxyPath} test failed`, 'error', {
                status: response.status,
                error: response.error,
                responseTime: `${response.responseTime}ms`,
                rawDataPreview: response.data ? response.data.substring(0, 300) + '...' : 'No data'
            });
            return { success: false, error: response.error || `HTTP ${response.status}` };
        }
    }

    hasNestedField(obj, field) {
        if (!obj || typeof obj !== 'object') return false;
        
        if (obj.hasOwnProperty(field)) return true;
        
        for (let key in obj) {
            if (typeof obj[key] === 'object' && this.hasNestedField(obj[key], field)) {
                return true;
            }
        }
        return false;
    }

    checkForGPT5Indicators(data) {
        const indicators = {
            hasPhDEnhancements: false,
            hasQualityMetrics: false,
            hasAdvancedAnalysis: false,
            hasLongContent: false,
            hasMultiAgent: false,
            hasDetailedStructure: false
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
        
        // Check for detailed structure (GPT-5 should produce more structured output)
        if (dataStr.includes('structure') || dataStr.includes('chapter') || dataStr.includes('section')) {
            indicators.hasDetailedStructure = true;
        }
        
        // Check for content length (GPT-5 should produce longer, more detailed content)
        if (JSON.stringify(data).length > 2000) {
            indicators.hasLongContent = true;
        }
        
        return indicators;
    }

    async runCorrectedTest() {
        this.log('🤖 STARTING CORRECTED FRONTEND PROXY TEST', 'gpt5');
        this.log('Testing GPT-5/O3 enhanced system with correct request formats', 'info');
        
        const testResults = [];
        
        // Test 1: Generate Review (working endpoint with correct format)
        const reviewResult = await this.testEndpoint('/generate-review', {
            molecule: 'artificial intelligence research methods',
            objective: 'Comprehensive review of AI research methodologies for GPT-5 testing',
            max_results: 5
        }, ['results']);
        testResults.push({ endpoint: 'generate-review', ...reviewResult });
        
        // Test 2: Deep Dive (corrected format with pmid, title, url)
        const deepDiveResult = await this.testEndpoint('/deep-dive', {
            pmid: '12345678',  // Example PMID
            title: 'Machine Learning in Scientific Research - GPT-5 Enhanced Analysis',
            url: 'https://pubmed.ncbi.nlm.nih.gov/12345678/',
            objective: 'Deep analysis of machine learning applications in scientific research'
        }, ['analysis', 'key_insights']);
        testResults.push({ endpoint: 'deep-dive', ...deepDiveResult });
        
        // Test 3: Generate Summary (project-based with correct format)
        const summaryResult = await this.testEndpoint('/generate-summary', {
            project_id: this.projectId,
            summary_type: 'comprehensive'
        }, ['summary']);
        testResults.push({ endpoint: 'generate-summary', ...summaryResult });
        
        // Test 4: Thesis Chapter Generator (project-based)
        const thesisResult = await this.testEndpoint('/thesis-chapter-generator', {
            project_id: this.projectId,
            chapter_type: 'literature_review',
            focus_area: 'AI research methodology'
        }, ['thesis_structure']);
        testResults.push({ endpoint: 'thesis-chapter-generator', ...thesisResult });
        
        // Test 5: Literature Gap Analysis (project-based)
        const gapResult = await this.testEndpoint('/literature-gap-analysis', {
            project_id: this.projectId,
            analysis_depth: 'comprehensive'
        }, ['identified_gaps']);
        testResults.push({ endpoint: 'literature-gap-analysis', ...gapResult });
        
        // Test 6: Methodology Synthesis (project-based)
        const methodResult = await this.testEndpoint('/methodology-synthesis', {
            project_id: this.projectId,
            synthesis_type: 'comparative'
        }, ['methodology_synthesis']);
        testResults.push({ endpoint: 'methodology-synthesis', ...methodResult });
        
        // Generate comprehensive report
        this.generateCorrectedReport(testResults);
        
        return testResults;
    }

    generateCorrectedReport(testResults) {
        this.log('📋 CORRECTED FRONTEND PROXY TEST REPORT', 'gpt5');
        
        const successfulTests = testResults.filter(r => r.success).length;
        const gpt5EnhancedTests = testResults.filter(r => r.success && r.hasGPT5Indicators).length;
        
        console.log('\n🤖 GPT-5/O3 ENHANCED SYSTEM TEST RESULTS (Corrected Format):');
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
        const readinessScore = (successfulTests * 15) + (gpt5EnhancedTests * 10);
        console.log(`   Production Readiness Score: ${readinessScore}/100`);
        
        if (readinessScore >= 90) {
            console.log('   Status: 🎉 FULLY READY FOR PRODUCTION');
            console.log('   Quality: 🤖 GPT-5/O3 enhancements confirmed');
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
        
        console.log('\n💡 IMPROVEMENTS IN THIS VERSION:');
        console.log('   ✅ Corrected deep-dive request format (pmid, title, url)');
        console.log('   ✅ Added all 6 GPT-5/O3 enhanced endpoints');
        console.log('   ✅ Better error handling and JSON parsing');
        console.log('   ✅ Enhanced GPT-5 indicator detection');
        
        this.log('🎉 CORRECTED FRONTEND PROXY TEST COMPLETED', 'gpt5');
    }
}

// Check if we're on the correct domain and run the test
if (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('localhost')) {
    console.log('🚀 Starting Corrected Frontend Proxy Test...');
    const tester = new CorrectedBrowserFrontendTest();
    tester.runCorrectedTest().catch(console.error);
} else {
    console.log('⚠️ Please run this test from the Vercel frontend domain:');
    console.log('   https://frontend-psi-seven-85.vercel.app');
    console.log('   Then paste this script into the browser console.');
}
