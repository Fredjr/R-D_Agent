/**
 * BROWSER-COMPATIBLE PRODUCTION READINESS TEST
 * 
 * Copy and paste this entire script into your browser console to test
 * the GPT-5/O3 enhanced system with production project data
 */

class BrowserProductionReadinessTest {
    constructor() {
        this.projectId = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
        this.backendUrl = 'https://r-dagent-production.up.railway.app';
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
                    ...options.headers
                },
                body: options.body || null,
                mode: 'cors', // Explicitly set CORS mode
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

    async testProjectBasedEndpoint(endpoint, payload, expectedFields = []) {
        this.log(`🧪 Testing ${endpoint} with project data...`, 'test');
        
        const response = await this.makeRequest(`${this.backendUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-ID': this.testUserId
            },
            body: JSON.stringify(payload),
            timeout: 120000  // 2 minutes for GPT-5 processing
        });
        
        if (response.status === 200) {
            try {
                const data = JSON.parse(response.data);
                
                // Check for expected fields
                const hasExpectedFields = expectedFields.every(field => 
                    data.hasOwnProperty(field) && data[field] !== null && data[field] !== undefined
                );
                
                // Check for GPT-5/O3 indicators
                const hasGPT5Indicators = this.checkForGPT5Indicators(data);
                
                this.log(`✅ ${endpoint} test successful`, 'success', {
                    status: response.status,
                    responseTime: `${response.responseTime}ms`,
                    hasExpectedFields,
                    gpt5Indicators: hasGPT5Indicators,
                    dataSize: JSON.stringify(data).length
                });
                
                return { success: true, data, hasGPT5Indicators };
            } catch (e) {
                this.log(`⚠️ ${endpoint} responded but data is not JSON`, 'warning', {
                    status: response.status,
                    responseTime: `${response.responseTime}ms`,
                    error: e.message
                });
                return { success: false, error: 'Invalid JSON response' };
            }
        } else {
            this.log(`❌ ${endpoint} test failed`, 'error', {
                status: response.status,
                error: response.error,
                responseTime: `${response.responseTime}ms`
            });
            return { success: false, error: response.error || `HTTP ${response.status}` };
        }
    }

    checkForGPT5Indicators(data) {
        const indicators = {
            hasPhDEnhancements: false,
            hasQualityMetrics: false,
            hasAdvancedAnalysis: false,
            hasLongContent: false
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
        
        // Check for content length (GPT-5 should produce longer, more detailed content)
        if (JSON.stringify(data).length > 2000) {
            indicators.hasLongContent = true;
        }
        
        return indicators;
    }

    async runProductionReadinessTest() {
        this.log('🤖 STARTING PRODUCTION READINESS TEST', 'gpt5');
        this.log('Testing GPT-5/O3 enhanced system with production project data', 'info');
        
        const testResults = [];
        
        // Test 1: Generate Summary (project-based)
        const summaryResult = await this.testProjectBasedEndpoint('/generate-summary', {
            project_id: this.projectId,
            summary_type: 'comprehensive'
        }, ['summary', 'word_count']);
        testResults.push({ endpoint: 'generate-summary', ...summaryResult });
        
        // Test 2: Thesis Chapter Generator (project-based)
        const thesisResult = await this.testProjectBasedEndpoint('/thesis-chapter-generator', {
            project_id: this.projectId,
            chapter_type: 'literature_review',
            focus_area: 'AI research methodology'
        }, ['thesis_structure', 'chapters']);
        testResults.push({ endpoint: 'thesis-chapter-generator', ...thesisResult });
        
        // Test 3: Literature Gap Analysis (project-based)
        const gapResult = await this.testProjectBasedEndpoint('/literature-gap-analysis', {
            project_id: this.projectId,
            analysis_depth: 'comprehensive'
        }, ['identified_gaps', 'gap_summary']);
        testResults.push({ endpoint: 'literature-gap-analysis', ...gapResult });
        
        // Test 4: Methodology Synthesis (project-based)
        const methodResult = await this.testProjectBasedEndpoint('/methodology-synthesis', {
            project_id: this.projectId,
            synthesis_type: 'comparative'
        }, ['methodology_synthesis', 'identified_methodologies']);
        testResults.push({ endpoint: 'methodology-synthesis', ...methodResult });
        
        // Test 5: Generate Review (non-project based)
        const reviewResult = await this.testProjectBasedEndpoint('/generate-review', {
            molecule: 'artificial intelligence research methods',
            objective: 'Comprehensive review of AI research methodologies',
            max_results: 10
        }, ['results', 'executive_summary']);
        testResults.push({ endpoint: 'generate-review', ...reviewResult });
        
        // Test 6: Deep Dive (non-project based)
        const deepDiveResult = await this.testProjectBasedEndpoint('/deep-dive', {
            paper_title: 'Machine Learning in Scientific Research',
            analysis_type: 'comprehensive'
        }, ['analysis', 'key_insights']);
        testResults.push({ endpoint: 'deep-dive', ...deepDiveResult });
        
        // Generate comprehensive report
        this.generateProductionReadinessReport(testResults);
        
        return testResults;
    }

    generateProductionReadinessReport(testResults) {
        this.log('📋 PRODUCTION READINESS REPORT', 'gpt5');
        
        const successfulTests = testResults.filter(r => r.success).length;
        const gpt5EnhancedTests = testResults.filter(r => r.success && r.hasGPT5Indicators).length;
        
        console.log('\n🤖 GPT-5/O3 ENHANCED SYSTEM TEST RESULTS:');
        console.log(`   Successful Endpoints: ${successfulTests}/6`);
        console.log(`   GPT-5 Enhanced Responses: ${gpt5EnhancedTests}/${successfulTests}`);
        
        console.log('\n📊 DETAILED RESULTS:');
        testResults.forEach(result => {
            const status = result.success ? '✅ PASS' : '❌ FAIL';
            const gpt5Status = result.hasGPT5Indicators ? '🤖 GPT-5 Enhanced' : '⚠️ Basic Response';
            console.log(`   ${result.endpoint}: ${status} ${result.success ? gpt5Status : ''}`);
            
            if (result.success && result.hasGPT5Indicators) {
                const indicators = Object.entries(result.hasGPT5Indicators)
                    .filter(([key, value]) => value)
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
        
        this.log('🎉 PRODUCTION READINESS TEST COMPLETED', 'gpt5');
    }
}

// Auto-run the test when pasted into browser console
console.log('🚀 Starting Browser Production Readiness Test...');
const tester = new BrowserProductionReadinessTest();
tester.runProductionReadinessTest().catch(console.error);
