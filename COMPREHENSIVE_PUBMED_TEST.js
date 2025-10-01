/**
 * COMPREHENSIVE PUBMED TEST v1.0
 * 
 * Standalone comprehensive test for all PubMed recommendation functionality
 * Tests all endpoints, data quality, performance, and edge cases
 * 
 * Usage: Copy and paste this script into browser console
 */

class ComprehensivePubMedTest {
    constructor() {
        this.baseUrl = 'https://frontend-psi-seven-85.vercel.app';
        this.backendUrl = 'https://r-dagent-production.up.railway.app';
        this.testUserId = 'fredericle77@gmail.com';
        this.results = [];
        this.startTime = Date.now();
        this.testResults = {
            totalTests: 0,
            successfulTests: 0,
            failedTests: 0,
            totalPapersFound: 0,
            averageResponseTime: 0,
            endpointResults: {}
        };
    }

    log(message, type = 'info', data = null) {
        const timestamp = new Date().toISOString();
        const elapsed = Date.now() - this.startTime;
        const logEntry = { timestamp, type, message, data, elapsed };
        this.results.push(logEntry);
        
        const emoji = {
            'info': 'ℹ️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌',
            'test': '🧪',
            'endpoint': '🔗',
            'performance': '⚡',
            'summary': '📊'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} [${timestamp}] [+${elapsed}ms] ${message}`);
        if (data) {
            console.log('Data:', data);
        }
    }

    async testEndpoint(name, url, method = 'GET', body = null) {
        this.log(`🧪 Testing ${name}...`, 'test');
        const startTime = Date.now();
        
        try {
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.testUserId
                }
            };
            
            if (body) {
                options.body = JSON.stringify(body);
            }
            
            const response = await fetch(url, options);
            const responseTime = Date.now() - startTime;
            
            if (response.ok) {
                const data = await response.json();
                const papersFound = data.recommendations?.length || 0;
                
                this.testResults.totalTests++;
                this.testResults.successfulTests++;
                this.testResults.totalPapersFound += papersFound;
                
                this.testResults.endpointResults[name] = {
                    success: true,
                    status: response.status,
                    responseTime: responseTime,
                    papersFound: papersFound,
                    dataQuality: this.assessDataQuality(data)
                };
                
                this.log(`✅ ${name} - SUCCESS`, 'success', {
                    status: response.status,
                    responseTime: `${responseTime}ms`,
                    papersFound: papersFound,
                    type: data.type
                });
                
                return { success: true, data, responseTime, papersFound };
            } else {
                this.testResults.totalTests++;
                this.testResults.failedTests++;
                
                const errorText = await response.text();
                this.testResults.endpointResults[name] = {
                    success: false,
                    status: response.status,
                    responseTime: responseTime,
                    error: errorText
                };
                
                this.log(`❌ ${name} - FAILED`, 'error', {
                    status: response.status,
                    error: errorText
                });
                
                return { success: false, error: errorText, responseTime };
            }
        } catch (error) {
            this.testResults.totalTests++;
            this.testResults.failedTests++;
            
            this.testResults.endpointResults[name] = {
                success: false,
                error: error.message,
                responseTime: Date.now() - startTime
            };
            
            this.log(`❌ ${name} - ERROR`, 'error', { error: error.message });
            return { success: false, error: error.message };
        }
    }

    assessDataQuality(data) {
        const quality = {
            hasRecommendations: !!data.recommendations,
            recommendationCount: data.recommendations?.length || 0,
            hasValidStructure: !!(data.status && data.type),
            hasMetadata: !!data.generated_at,
            paperQuality: 0
        };
        
        if (data.recommendations && data.recommendations.length > 0) {
            const firstPaper = data.recommendations[0];
            let paperScore = 0;
            
            if (firstPaper.pmid) paperScore += 20;
            if (firstPaper.title) paperScore += 20;
            if (firstPaper.authors && firstPaper.authors.length > 0) paperScore += 20;
            if (firstPaper.journal) paperScore += 20;
            if (firstPaper.year) paperScore += 20;
            
            quality.paperQuality = paperScore;
        }
        
        return quality;
    }

    async runComprehensiveTest() {
        this.log('🚀 STARTING COMPREHENSIVE PUBMED TEST SUITE', 'test');
        this.log(`Testing against: ${this.baseUrl}`, 'info');
        this.log(`Test User: ${this.testUserId}`, 'info');
        
        // Test all PubMed recommendation endpoints
        const tests = [
            {
                name: 'Trending Recommendations',
                url: '/api/proxy/pubmed/recommendations?type=trending&limit=5',
                method: 'GET'
            },
            {
                name: 'Similar Papers (Popular PMID)',
                url: '/api/proxy/pubmed/recommendations?type=similar&pmid=32511222&limit=5',
                method: 'GET'
            },
            {
                name: 'Similar Papers (Test PMID)',
                url: '/api/proxy/pubmed/recommendations?type=similar&pmid=29622564&limit=5',
                method: 'GET'
            },
            {
                name: 'Citing Papers',
                url: '/api/proxy/pubmed/recommendations?type=citing&pmid=32511222&limit=5',
                method: 'GET'
            },
            {
                name: 'Referenced Papers',
                url: '/api/proxy/pubmed/recommendations?type=references&pmid=32511222&limit=5',
                method: 'GET'
            },
            {
                name: 'POST Similar Papers',
                url: '/api/proxy/pubmed/recommendations',
                method: 'POST',
                body: {
                    type: 'similar',
                    pmid: '32511222',
                    limit: 3
                }
            },
            {
                name: 'POST Trending',
                url: '/api/proxy/pubmed/recommendations',
                method: 'POST',
                body: {
                    type: 'trending',
                    limit: 3
                }
            }
        ];
        
        // Run all tests
        const testPromises = tests.map(test => 
            this.testEndpoint(test.name, test.url, test.method, test.body)
        );
        
        const results = await Promise.all(testPromises);
        
        // Calculate metrics
        const responseTimes = results
            .filter(r => r.responseTime)
            .map(r => r.responseTime);
        
        this.testResults.averageResponseTime = responseTimes.length > 0 
            ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
            : 0;
        
        // Generate summary
        this.generateSummary();
        
        // Store results globally
        window.comprehensivePubMedTestResults = {
            testResults: this.testResults,
            detailedResults: results,
            logs: this.results,
            summary: this.getSummary()
        };
        
        return window.comprehensivePubMedTestResults;
    }

    generateSummary() {
        const successRate = this.testResults.totalTests > 0 
            ? Math.round((this.testResults.successfulTests / this.testResults.totalTests) * 100)
            : 0;
        
        this.log('📊 COMPREHENSIVE PUBMED TEST COMPLETED', 'summary');
        this.log(`✅ Success Rate: ${successRate}% (${this.testResults.successfulTests}/${this.testResults.totalTests})`, 'success');
        this.log(`📚 Total Papers Found: ${this.testResults.totalPapersFound}`, 'success');
        this.log(`⚡ Average Response Time: ${this.testResults.averageResponseTime}ms`, 'performance');
        this.log(`⏱️ Total Test Duration: ${Date.now() - this.startTime}ms`, 'info');
        
        // Recommendations
        const recommendations = [];
        if (successRate < 80) {
            recommendations.push('🔧 Some endpoints may need investigation');
        }
        if (this.testResults.averageResponseTime > 3000) {
            recommendations.push('⚡ Consider optimizing API response times');
        }
        if (this.testResults.totalPapersFound < 10) {
            recommendations.push('📚 PubMed API might be returning fewer results than expected');
        }
        if (recommendations.length === 0) {
            recommendations.push('🎉 All PubMed recommendation systems are performing excellently!');
        }
        
        this.log('💡 RECOMMENDATIONS:', 'summary');
        recommendations.forEach(rec => this.log(rec, 'info'));
    }

    getSummary() {
        const successRate = this.testResults.totalTests > 0 
            ? Math.round((this.testResults.successfulTests / this.testResults.totalTests) * 100)
            : 0;
        
        return {
            successRate,
            totalTests: this.testResults.totalTests,
            successfulTests: this.testResults.successfulTests,
            failedTests: this.testResults.failedTests,
            totalPapersFound: this.testResults.totalPapersFound,
            averageResponseTime: this.testResults.averageResponseTime,
            testDuration: Date.now() - this.startTime
        };
    }
}

// Auto-execute when script is loaded
console.log('🧪 Comprehensive PubMed Test v1.0 loaded');
console.log('📋 Usage: const test = new ComprehensivePubMedTest(); await test.runComprehensiveTest();');

// Create global instance
window.ComprehensivePubMedTest = ComprehensivePubMedTest;
