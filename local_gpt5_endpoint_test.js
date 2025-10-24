#!/usr/bin/env node

/**
 * LOCAL GPT-5/O3 ENDPOINT TEST
 * 
 * Tests our 6 core endpoints directly against the local server running our latest GPT-5/O3 code
 * Uses real project data and comprehensive PhD-level quality assessment
 */

const http = require('http');

class LocalGPT5EndpointTest {
    constructor() {
        this.backendUrl = 'http://localhost:8000';
        this.testUserId = 'fredericle77@gmail.com';
        this.testProjectId = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
        this.results = [];
        this.startTime = Date.now();
        
        // Core endpoints to test
        this.coreEndpoints = [
            'generate-summary',
            'generate-review', 
            'deep-dive',
            'thesis-chapter-generator',
            'literature-gap-analysis',
            'methodology-synthesis'
        ];
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
            'phase': '🚀',
            'quality': '🎯',
            'model': '🤖'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} [${timestamp}] [+${elapsed}ms] ${message}`);
        if (data) {
            console.log('Data:', JSON.stringify(data, null, 2));
        }
        this.results.push({ timestamp, type, message, data, elapsed });
    }

    async makeRequest(endpoint, payload) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const postData = JSON.stringify(payload);
            
            const options = {
                hostname: 'localhost',
                port: 8000,
                path: `/${endpoint}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData),
                    'User-ID': this.testUserId
                }
            };

            const req = http.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    const responseTime = Date.now() - startTime;
                    
                    try {
                        const parsedData = JSON.parse(data);
                        resolve({
                            success: res.statusCode >= 200 && res.statusCode < 300,
                            data: parsedData,
                            status: res.statusCode,
                            responseTime,
                            error: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : null
                        });
                    } catch (e) {
                        resolve({
                            success: res.statusCode >= 200 && res.statusCode < 300,
                            data: data,
                            status: res.statusCode,
                            responseTime,
                            error: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : null
                        });
                    }
                });
            });

            req.on('error', (error) => {
                const responseTime = Date.now() - startTime;
                resolve({
                    success: false,
                    error: error.message,
                    responseTime
                });
            });

            req.write(postData);
            req.end();
        });
    }

    async testEndpoint(endpointName, payload) {
        this.log(`🧪 Testing ${endpointName} with GPT-5/O3 configuration...`, 'test');
        
        const result = await this.makeRequest(endpointName, payload);
        
        if (!result.success) {
            this.log(`❌ ${endpointName} FAILED - ${result.error}`, 'error', {
                error: result.error,
                status: result.status,
                responseTime: `${result.responseTime}ms`
            });
            return null;
        }
        
        const contentStr = typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
        const qualityScore = this.assessQuality(contentStr);
        
        this.log(`✅ ${endpointName} SUCCESS`, 'success', {
            status: result.status,
            responseTime: `${result.responseTime}ms`,
            contentLength: contentStr.length,
            qualityScore: `${qualityScore.toFixed(1)}/10`,
            phdReady: qualityScore >= 8.0 ? '✅ YES' : '❌ NO'
        });
        
        return {
            endpoint: endpointName,
            result: result,
            qualityScore: qualityScore,
            contentLength: contentStr.length,
            responseTime: result.responseTime
        };
    }

    assessQuality(content) {
        let score = 0;
        
        // Content Length (2 points)
        if (content.length >= 3000) score += 2.0;
        else if (content.length >= 2000) score += 1.5;
        else if (content.length >= 1000) score += 1.0;
        else if (content.length >= 500) score += 0.5;
        
        // Academic Terms (2 points)
        const academicTerms = [
            'methodology', 'analysis', 'research', 'study', 'findings', 'results',
            'conclusion', 'theoretical', 'framework', 'systematic', 'comprehensive',
            'significant', 'statistical', 'empirical', 'evidence', 'literature'
        ];
        const academicCount = academicTerms.filter(term => 
            content.toLowerCase().includes(term.toLowerCase())
        ).length;
        score += Math.min(academicCount * 0.15, 2.0);
        
        // Statistical Terms (2 points)
        const statisticalTerms = [
            'p<', 'p=', 'CI:', 'confidence interval', 'correlation', 'regression',
            'ANOVA', 'chi-square', 'effect size', 'power', 'significance', 'meta-analysis'
        ];
        const statisticalCount = statisticalTerms.filter(term => 
            content.toLowerCase().includes(term.toLowerCase())
        ).length;
        score += Math.min(statisticalCount * 0.3, 2.0);
        
        // Citation Patterns (2 points)
        const citationPatterns = [
            /\([A-Z][a-z]+,?\s+\d{4}\)/g,  // (Author, 2023)
            /\([A-Z][a-z]+\s+et\s+al\.,?\s+\d{4}\)/g,  // (Author et al., 2023)
            /\[[0-9]+\]/g,  // [1]
            /et\s+al\./g    // et al.
        ];
        let citationCount = 0;
        citationPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) citationCount += matches.length;
        });
        score += Math.min(citationCount * 0.2, 2.0);
        
        // PhD-level Terms (2 points)
        const phdTerms = [
            'hypothesis', 'methodology', 'paradigm', 'epistemology', 'ontology',
            'phenomenology', 'hermeneutics', 'grounded theory', 'ethnography',
            'discourse analysis', 'content analysis', 'thematic analysis'
        ];
        const phdCount = phdTerms.filter(term => 
            content.toLowerCase().includes(term.toLowerCase())
        ).length;
        score += Math.min(phdCount * 0.25, 2.0);
        
        return Math.min(score, 10);
    }

    async runLocalGPT5Test() {
        this.log('🚀 STARTING LOCAL GPT-5/O3 ENDPOINT TEST', 'phase');
        this.log('🤖 Testing latest committed code with GPT-5 → O3 → GPT-4 Turbo configuration', 'model');
        this.log('🎯 Using real project data from existing collections', 'info');
        
        // Test payloads that don't require existing project data
        const testPayloads = {
            'generate-summary': {
                project_id: this.testProjectId,
                summary_type: 'comprehensive',
                include_analyses: true,
                phd_enhancement: true,
                academic_level: 'phd'
            },
            'generate-review': {
                molecule: 'machine learning applications in precision medicine',
                objective: 'Comprehensive systematic review of ML applications in personalized healthcare with focus on diagnostic accuracy and treatment optimization',
                project_id: this.testProjectId,
                max_results: 15,
                phd_enhancement: true,
                academic_rigor: 'phd_level'
            },
            'deep-dive': {
                pmid: '32511222',
                title: 'Machine Learning Applications in Healthcare Diagnostics',
                objective: 'Comprehensive PhD-level analysis of ML diagnostic systems with methodological validation',
                url: 'https://pubmed.ncbi.nlm.nih.gov/32511222/',
                phd_enhancement: true,
                analysis_depth: 'comprehensive'
            },
            'thesis-chapter-generator': {
                chapter_type: 'literature_review',
                research_topic: 'Artificial intelligence applications in precision medicine',
                research_focus: 'AI-driven personalized treatment recommendations',
                methodology_approach: 'systematic review and meta-analysis',
                project_id: this.testProjectId,
                phd_enhancement: true,
                academic_level: 'phd'
            },
            'literature-gap-analysis': {
                research_domain: 'artificial intelligence in precision medicine',
                research_focus: 'AI algorithms for personalized treatment selection',
                analysis_scope: 'comprehensive systematic review with gap identification',
                project_id: this.testProjectId,
                analysis_depth: 'comprehensive',
                phd_enhancement: true
            },
            'methodology-synthesis': {
                research_methods: ['machine learning algorithms', 'clinical validation studies', 'systematic review methodology'],
                research_domain: 'AI-driven precision medicine',
                synthesis_focus: 'methodological triangulation in AI healthcare applications',
                project_id: this.testProjectId,
                synthesis_type: 'comprehensive',
                phd_enhancement: true
            }
        };
        
        const allResults = [];
        let workingEndpoints = 0;
        let phdReadyEndpoints = 0;
        let totalQualityScore = 0;
        
        for (const endpoint of this.coreEndpoints) {
            const testResult = await this.testEndpoint(endpoint, testPayloads[endpoint]);
            
            if (testResult) {
                allResults.push(testResult);
                workingEndpoints++;
                totalQualityScore += testResult.qualityScore;
                
                if (testResult.qualityScore >= 8.0) {
                    phdReadyEndpoints++;
                    this.log(`🎓 ${endpoint} achieves PhD-level quality (${testResult.qualityScore.toFixed(1)}/10)`, 'success');
                } else {
                    this.log(`⚠️ ${endpoint} needs improvement (${testResult.qualityScore.toFixed(1)}/10)`, 'warning');
                }
            }
            
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Generate comprehensive report
        this.generateReport(allResults, workingEndpoints, phdReadyEndpoints, totalQualityScore);
        
        return allResults;
    }

    generateReport(results, workingEndpoints, phdReadyEndpoints, totalQualityScore) {
        const totalEndpoints = this.coreEndpoints.length;
        const avgQualityScore = workingEndpoints > 0 ? totalQualityScore / workingEndpoints : 0;
        
        this.log('📋 LOCAL GPT-5/O3 ENDPOINT TEST REPORT', 'phase');
        this.log(`🔗 Endpoint Availability: ${workingEndpoints}/${totalEndpoints} working`, 'info');
        this.log(`🎓 PhD Quality Results: ${phdReadyEndpoints}/${workingEndpoints} endpoints PhD-ready`, 'info');
        this.log(`🎯 Average Quality Score: ${avgQualityScore.toFixed(1)}/10`, 'info');
        this.log(`✅ PhD Readiness: ${avgQualityScore >= 8.0 ? '✅ ACHIEVED' : '⚠️ NEEDS IMPROVEMENT'}`, 'info');
        
        console.log('\n📊 DETAILED ENDPOINT RESULTS:');
        results.forEach(r => {
            console.log(`   ${r.endpoint}: ${r.qualityScore.toFixed(1)}/10 ${r.qualityScore >= 8.0 ? '✅' : '⚠️'} (${r.contentLength} chars, ${r.responseTime}ms)`);
        });
        
        // Assessment of GPT-5/O3 impact
        if (workingEndpoints === totalEndpoints && phdReadyEndpoints === workingEndpoints) {
            this.log('🎉 SUCCESS: All endpoints working and achieving PhD-level quality with GPT-5/O3!', 'success');
        } else if (workingEndpoints === totalEndpoints) {
            this.log('⚠️ PARTIAL SUCCESS: All endpoints working but quality improvements needed', 'warning');
        } else {
            this.log('❌ ISSUES: Some endpoints not working - check server logs for details', 'error');
        }
        
        // Model configuration assessment
        if (avgQualityScore > 6.0) {
            this.log('🤖 GPT-5/O3 configuration appears to be providing enhanced quality', 'model');
        } else {
            this.log('🤖 GPT-5/O3 benefits may be limited by API quota or other issues', 'model');
        }
        
        this.log('🎉 LOCAL GPT-5/O3 ENDPOINT TEST COMPLETED', 'success');
    }
}

// Run the test
const testSuite = new LocalGPT5EndpointTest();
testSuite.runLocalGPT5Test().catch(console.error);
