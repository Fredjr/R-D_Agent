#!/usr/bin/env node

/**
 * PHD 8/10 QUALITY COMPREHENSIVE TEST - Node.js Version
 * 
 * Tests our advanced 8/10 enhancement system across all 5 PhD-level quality dimensions
 */

const https = require('https');
const http = require('http');

class PhD8_10QualityTest {
    constructor() {
        this.backendUrl = 'https://r-dagent-production.up.railway.app';
        this.testUserId = 'fredericle77@gmail.com';
        this.testProjectId = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
        this.results = [];
        this.startTime = Date.now();
        this.qualityMetrics = {
            contentDepth: [],
            researchRigor: [],
            academicStandards: [],
            professionalOutput: [],
            overallScores: []
        };
        
        this.testEndpoints = [
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
            'dimension': '📊',
            'endpoint': '🔗',
            'assessment': '🔬',
            'summary': '📋'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} [${timestamp}] [+${elapsed}ms] ${message}`);
        if (data) {
            console.log('Data:', JSON.stringify(data, null, 2));
        }
        this.results.push({ timestamp, type, message, data, elapsed });
    }

    async makeRequest(endpoint, options = {}) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const url = new URL(endpoint);
            
            const requestOptions = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname + url.search,
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.testUserId,
                    ...options.headers
                }
            };

            if (options.body) {
                requestOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
            }

            const client = url.protocol === 'https:' ? https : http;
            
            const req = client.request(requestOptions, (res) => {
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

            if (options.body) {
                req.write(options.body);
            }
            
            req.end();
        });
    }

    assessPhDQuality(content, endpointName) {
        const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
        
        // Dimension 1: Content Depth Assessment
        const contentDepth = this.assessContentDepth(contentStr);
        
        // Dimension 2: Research Rigor Assessment
        const researchRigor = this.assessResearchRigor(contentStr);
        
        // Dimension 3: Academic Standards Assessment
        const academicStandards = this.assessAcademicStandards(contentStr);
        
        // Dimension 4: Professional Output Assessment
        const professionalOutput = this.assessProfessionalOutput(contentStr);
        
        // Calculate overall score
        const overallScore = (contentDepth.score + researchRigor.score + academicStandards.score + professionalOutput.score) / 4;
        
        const assessment = {
            endpoint: endpointName,
            dimensions: {
                contentDepth,
                researchRigor,
                academicStandards,
                professionalOutput
            },
            overallScore: overallScore,
            phdReady: overallScore >= 8.0,
            contentLength: contentStr.length,
            timestamp: new Date().toISOString()
        };
        
        // Store metrics for analysis
        this.qualityMetrics.contentDepth.push(contentDepth.score);
        this.qualityMetrics.researchRigor.push(researchRigor.score);
        this.qualityMetrics.academicStandards.push(academicStandards.score);
        this.qualityMetrics.professionalOutput.push(professionalOutput.score);
        this.qualityMetrics.overallScores.push(overallScore);
        
        this.log(`📊 Quality Assessment for ${endpointName}:`, 'assessment', {
            contentDepth: `${contentDepth.score.toFixed(1)}/10`,
            researchRigor: `${researchRigor.score.toFixed(1)}/10`,
            academicStandards: `${academicStandards.score.toFixed(1)}/10`,
            professionalOutput: `${professionalOutput.score.toFixed(1)}/10`,
            overallScore: `${overallScore.toFixed(1)}/10`,
            phdReady: assessment.phdReady ? '✅ YES' : '❌ NO'
        });
        
        return assessment;
    }

    assessContentDepth(content) {
        let score = 0;
        const indicators = {
            theoreticalFrameworks: 0,
            synthesisQuality: 0,
            criticalAnalysis: 0
        };
        
        // Theoretical Frameworks (3.5 points)
        const frameworkTerms = [
            'theory', 'framework', 'model', 'paradigm', 'theoretical foundation',
            'conceptual framework', 'theoretical perspective', 'theoretical approach'
        ];
        const frameworkCount = frameworkTerms.filter(term => 
            content.toLowerCase().includes(term.toLowerCase())
        ).length;
        indicators.theoreticalFrameworks = Math.min(frameworkCount * 0.5, 3.5);
        score += indicators.theoreticalFrameworks;
        
        // Synthesis Quality (3.5 points)
        const synthesisTerms = [
            'synthesis', 'integration', 'convergent', 'divergent', 'triangulation',
            'meta-analysis', 'systematic', 'comprehensive', 'holistic', 'unified'
        ];
        const synthesisCount = synthesisTerms.filter(term => 
            content.toLowerCase().includes(term.toLowerCase())
        ).length;
        indicators.synthesisQuality = Math.min(synthesisCount * 0.6, 3.5);
        score += indicators.synthesisQuality;
        
        // Critical Analysis (3.0 points)
        const criticalTerms = [
            'critical', 'analysis', 'evaluate', 'assess', 'critique', 'examine',
            'limitations', 'strengths', 'weaknesses', 'implications'
        ];
        const criticalCount = criticalTerms.filter(term => 
            content.toLowerCase().includes(term.toLowerCase())
        ).length;
        indicators.criticalAnalysis = Math.min(criticalCount * 0.4, 3.0);
        score += indicators.criticalAnalysis;
        
        return {
            score: Math.min(score, 10),
            indicators,
            maxScore: 10
        };
    }

    assessResearchRigor(content) {
        let score = 0;
        const indicators = {
            statisticalSophistication: 0,
            methodologicalValidation: 0,
            biasRecognition: 0
        };
        
        // Statistical Sophistication (4.0 points)
        const statisticalTerms = [
            'p<', 'p=', 'CI:', 'Cohen\'s d', 'OR=', 'HR=', 'F(', 't(', 'χ²', 
            'r=', 'β=', 'α=', 'η²', 'I²', '95% CI', 'confidence interval',
            'effect size', 'power', 'AUC', 'κ=', 'meta-analysis', 'SD=', 'SE=',
            'Cronbach\'s alpha', 'ICC', 'reliability', 'validity'
        ];
        const statisticalCount = statisticalTerms.filter(term => 
            content.toLowerCase().includes(term.toLowerCase())
        ).length;
        indicators.statisticalSophistication = Math.min(statisticalCount * 0.5, 4.0);
        score += indicators.statisticalSophistication;
        
        // Methodological Validation (3.5 points)
        const methodologyTerms = [
            'validity', 'reliability', 'methodology', 'systematic', 'rigorous',
            'robust', 'comprehensive', 'thorough', 'validation', 'verification'
        ];
        const methodologyCount = methodologyTerms.filter(term => 
            content.toLowerCase().includes(term.toLowerCase())
        ).length;
        indicators.methodologicalValidation = Math.min(methodologyCount * 0.5, 3.5);
        score += indicators.methodologicalValidation;
        
        // Bias Recognition (2.5 points)
        const biasTerms = [
            'bias', 'limitation', 'confound', 'control', 'random', 'systematic',
            'selection bias', 'publication bias', 'confirmation bias'
        ];
        const biasCount = biasTerms.filter(term => 
            content.toLowerCase().includes(term.toLowerCase())
        ).length;
        indicators.biasRecognition = Math.min(biasCount * 0.5, 2.5);
        score += indicators.biasRecognition;
        
        return {
            score: Math.min(score, 10),
            indicators,
            maxScore: 10
        };
    }

    assessAcademicStandards(content) {
        let score = 0;
        const indicators = {
            logicalStructure: 0,
            gapIdentification: 0,
            citationAccuracy: 0,
            contributionClarity: 0
        };
        
        // Logical Structure (2.5 points)
        const structureTerms = [
            'introduction', 'methodology', 'results', 'discussion', 'conclusion',
            'furthermore', 'moreover', 'however', 'therefore', 'consequently'
        ];
        const structureCount = structureTerms.filter(term => 
            content.toLowerCase().includes(term.toLowerCase())
        ).length;
        indicators.logicalStructure = Math.min(structureCount * 0.4, 2.5);
        score += indicators.logicalStructure;
        
        // Gap Identification (2.5 points)
        const gapTerms = [
            'gap', 'limitation', 'future research', 'further study', 'unexplored',
            'insufficient', 'lacking', 'missing', 'need for', 'requires'
        ];
        const gapCount = gapTerms.filter(term => 
            content.toLowerCase().includes(term.toLowerCase())
        ).length;
        indicators.gapIdentification = Math.min(gapCount * 0.5, 2.5);
        score += indicators.gapIdentification;
        
        // Citation Accuracy (2.5 points)
        const citationPatterns = [
            /\([A-Z][a-z]+,?\s+\d{4}\)/g,  // (Author, 2023)
            /\([A-Z][a-z]+\s+et\s+al\.,?\s+\d{4}\)/g,  // (Author et al., 2023)
            /\[[0-9]+\]/g,  // [1]
            /et\s+al\./g   // et al.
        ];
        let citationCount = 0;
        citationPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) citationCount += matches.length;
        });
        indicators.citationAccuracy = Math.min(citationCount * 0.25, 2.5);
        score += indicators.citationAccuracy;
        
        // Contribution Clarity (2.5 points)
        const contributionTerms = [
            'contribution', 'novel', 'original', 'innovative', 'significant',
            'implication', 'advancement', 'breakthrough', 'discovery', 'insight'
        ];
        const contributionCount = contributionTerms.filter(term => 
            content.toLowerCase().includes(term.toLowerCase())
        ).length;
        indicators.contributionClarity = Math.min(contributionCount * 0.4, 2.5);
        score += indicators.contributionClarity;
        
        return {
            score: Math.min(score, 10),
            indicators,
            maxScore: 10
        };
    }

    assessProfessionalOutput(content) {
        let score = 0;
        const indicators = {
            contentLength: 0,
            technicalPrecision: 0,
            originality: 0,
            peerReviewReadiness: 0
        };
        
        // Content Length (2.5 points)
        if (content.length >= 2500) {
            indicators.contentLength = 2.5;
        } else if (content.length >= 2000) {
            indicators.contentLength = 2.0;
        } else if (content.length >= 1500) {
            indicators.contentLength = 1.5;
        } else if (content.length >= 1000) {
            indicators.contentLength = 1.0;
        } else {
            indicators.contentLength = 0.5;
        }
        score += indicators.contentLength;
        
        // Technical Precision (2.5 points)
        const technicalTerms = [
            'precise', 'specific', 'exact', 'accurate', 'detailed', 'comprehensive',
            'systematic', 'rigorous', 'thorough', 'meticulous'
        ];
        const technicalCount = technicalTerms.filter(term => 
            content.toLowerCase().includes(term.toLowerCase())
        ).length;
        indicators.technicalPrecision = Math.min(technicalCount * 0.4, 2.5);
        score += indicators.technicalPrecision;
        
        // Originality (2.5 points)
        const originalityTerms = [
            'novel', 'original', 'innovative', 'unique', 'new', 'first',
            'unprecedented', 'groundbreaking', 'pioneering', 'cutting-edge'
        ];
        const originalityCount = originalityTerms.filter(term => 
            content.toLowerCase().includes(term.toLowerCase())
        ).length;
        indicators.originality = Math.min(originalityCount * 0.4, 2.5);
        score += indicators.originality;
        
        // Peer Review Readiness (2.5 points)
        const readinessTerms = [
            'peer review', 'publication', 'journal', 'manuscript', 'academic',
            'scholarly', 'research', 'study', 'investigation', 'analysis'
        ];
        const readinessCount = readinessTerms.filter(term => 
            content.toLowerCase().includes(term.toLowerCase())
        ).length;
        indicators.peerReviewReadiness = Math.min(readinessCount * 0.4, 2.5);
        score += indicators.peerReviewReadiness;
        
        return {
            score: Math.min(score, 10),
            indicators,
            maxScore: 10
        };
    }

    async testEndpointQuality(endpointName, testPayload) {
        this.log(`🧪 Testing ${endpointName} for PhD-level quality...`, 'test');

        const endpoint = `${this.backendUrl}/${endpointName}`;
        const result = await this.makeRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify(testPayload),
            headers: {
                'User-ID': this.testUserId
            }
        });
        
        if (!result.success) {
            this.log(`❌ ${endpointName} request failed`, 'error', {
                error: result.error,
                status: result.status,
                responseTime: `${result.responseTime}ms`
            });
            return null;
        }
        
        this.log(`✅ ${endpointName} request successful`, 'success', {
            status: result.status,
            responseTime: `${result.responseTime}ms`,
            contentLength: typeof result.data === 'string' ? result.data.length : JSON.stringify(result.data).length
        });
        
        // Assess quality across 5 dimensions
        const qualityAssessment = this.assessPhDQuality(result.data, endpointName);
        
        return {
            endpoint: endpointName,
            result: result,
            qualityAssessment: qualityAssessment,
            responseTime: result.responseTime
        };
    }

    async runComprehensiveTest() {
        this.log('🚀 STARTING COMPREHENSIVE PHD 8/10 QUALITY TESTING', 'phase');
        this.log('🎯 Testing all endpoints across 5 PhD-level quality dimensions', 'info');
        
        const testPayloads = {
            'generate-summary': {
                project_id: this.testProjectId,
                summary_type: 'comprehensive',
                include_analyses: true,
                phd_enhancement: true
            },
            'generate-review': {
                molecule: 'CRISPR gene editing in diabetes treatment',
                objective: 'Comprehensive PhD-level review of CRISPR applications in diabetes therapy',
                project_id: this.testProjectId,
                max_results: 25,
                phd_enhancement: true
            },
            'deep-dive': {
                pmid: '32511222',
                title: 'Advanced CRISPR Gene Editing Mechanisms in Diabetes Treatment',
                objective: 'Comprehensive PhD-level deep dive analysis of CRISPR applications in diabetes therapy',
                url: 'https://pubmed.ncbi.nlm.nih.gov/32511222/',
                phd_enhancement: true
            },
            'thesis-chapter-generator': {
                chapter_type: 'literature_review',
                research_topic: 'Machine learning applications in healthcare diagnostics',
                research_focus: 'AI-driven diagnostic systems for early disease detection',
                methodology_approach: 'systematic review and meta-analysis',
                project_id: this.testProjectId,
                phd_enhancement: true
            },
            'literature-gap-analysis': {
                research_domain: 'artificial intelligence in medical diagnostics',
                research_focus: 'machine learning algorithms for early disease detection',
                analysis_scope: 'comprehensive systematic review',
                project_id: this.testProjectId,
                analysis_depth: 'comprehensive',
                phd_enhancement: true
            },
            'methodology-synthesis': {
                research_methods: ['quantitative analysis', 'qualitative assessment', 'mixed-methods approach'],
                research_domain: 'healthcare AI applications',
                synthesis_focus: 'methodological triangulation in AI healthcare research',
                project_id: this.testProjectId,
                synthesis_type: 'comprehensive',
                phd_enhancement: true
            }
        };
        
        const allResults = [];
        
        for (const endpoint of this.testEndpoints) {
            this.log(`🔗 Testing endpoint: ${endpoint}`, 'endpoint');
            
            const testResult = await this.testEndpointQuality(endpoint, testPayloads[endpoint]);
            
            if (testResult) {
                allResults.push(testResult);
                
                const assessment = testResult.qualityAssessment;
                if (assessment.phdReady) {
                    this.log(`✅ ${endpoint} achieves PhD-level quality (${assessment.overallScore.toFixed(1)}/10)`, 'success');
                } else {
                    this.log(`⚠️ ${endpoint} needs improvement (${assessment.overallScore.toFixed(1)}/10)`, 'warning');
                }
            }
            
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        // Generate comprehensive report
        this.generateComprehensiveReport(allResults);
        
        return allResults;
    }

    generateComprehensiveReport(results) {
        const totalEndpoints = results.length;
        const phdReadyEndpoints = results.filter(r => r.qualityAssessment.phdReady).length;
        
        // Calculate average scores
        const avgContentDepth = this.qualityMetrics.contentDepth.reduce((a, b) => a + b, 0) / this.qualityMetrics.contentDepth.length;
        const avgResearchRigor = this.qualityMetrics.researchRigor.reduce((a, b) => a + b, 0) / this.qualityMetrics.researchRigor.length;
        const avgAcademicStandards = this.qualityMetrics.academicStandards.reduce((a, b) => a + b, 0) / this.qualityMetrics.academicStandards.length;
        const avgProfessionalOutput = this.qualityMetrics.professionalOutput.reduce((a, b) => a + b, 0) / this.qualityMetrics.professionalOutput.length;
        const avgOverallScore = this.qualityMetrics.overallScores.reduce((a, b) => a + b, 0) / this.qualityMetrics.overallScores.length;
        
        this.log('📋 COMPREHENSIVE PHD 8/10 QUALITY TEST REPORT', 'summary');
        this.log(`📊 Overall Results: ${phdReadyEndpoints}/${totalEndpoints} endpoints PhD-ready`, 'info');
        this.log(`🎯 Average Quality Score: ${avgOverallScore.toFixed(1)}/10`, 'info');
        this.log(`✅ PhD Readiness: ${avgOverallScore >= 8.0 ? '✅ ACHIEVED' : '⚠️ NEEDS IMPROVEMENT'}`, 'info');
        
        console.log('\n🔍 DETAILED QUALITY DIMENSIONS:');
        console.log(`   Content Depth: ${avgContentDepth.toFixed(1)}/10 ${avgContentDepth >= 8.0 ? '✅' : '⚠️'}`);
        console.log(`   Research Rigor: ${avgResearchRigor.toFixed(1)}/10 ${avgResearchRigor >= 8.0 ? '✅' : '⚠️'}`);
        console.log(`   Academic Standards: ${avgAcademicStandards.toFixed(1)}/10 ${avgAcademicStandards >= 8.0 ? '✅' : '⚠️'}`);
        console.log(`   Professional Output: ${avgProfessionalOutput.toFixed(1)}/10 ${avgProfessionalOutput >= 8.0 ? '✅' : '⚠️'}`);
        
        console.log('\n📊 ENDPOINT RESULTS:');
        results.forEach(r => {
            console.log(`   ${r.endpoint}: ${r.qualityAssessment.overallScore.toFixed(1)}/10 ${r.qualityAssessment.phdReady ? '✅' : '⚠️'} (${r.qualityAssessment.contentLength} chars, ${r.responseTime}ms)`);
        });
        
        this.log('🎉 PHD 8/10 QUALITY COMPREHENSIVE TEST COMPLETED', 'success');
    }
}

// Run the test
const testSuite = new PhD8_10QualityTest();
testSuite.runComprehensiveTest().catch(console.error);
