#!/usr/bin/env node

/**
 * COMPREHENSIVE ENDPOINT QUALITY TEST
 * 
 * Tests all endpoints with GPT-5/O3 model configuration across 5 PhD-level quality dimensions:
 * 1. Content Depth (theoretical frameworks, synthesis quality, critical analysis)
 * 2. Research Rigor (statistical sophistication, methodological validation, bias recognition)
 * 3. Academic Standards (logical structure, gap identification, citation accuracy, contribution clarity)
 * 4. Professional Output (content length, technical precision, originality, peer review readiness)
 * 5. Overall PhD Readiness (comprehensive assessment across all dimensions)
 */

const https = require('https');
const http = require('http');

class ComprehensiveEndpointQualityTest {
    constructor() {
        this.backendUrl = 'http://localhost:8000';  // Test local server with latest code
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
        
        // All endpoints that must be working
        this.testEndpoints = [
            'generate-summary',
            'generate-review',
            'deep-dive',
            'thesis-chapter-generator',
            'literature-gap-analysis',
            'methodology-synthesis'
        ];
        
        // Expected model configuration (GPT-5/O3 with fallbacks)
        this.expectedModels = {
            premium: ['gpt-5', 'o3', 'gpt-4-turbo'],
            fast: ['o3-mini', 'gpt-4o-mini']
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
            'test': '🧪',
            'phase': '🚀',
            'quality': '🎯',
            'dimension': '📊',
            'endpoint': '🔗',
            'assessment': '🔬',
            'summary': '📋',
            'model': '🤖'
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

    async testEndpointAvailability(endpointName, testPayload) {
        this.log(`🧪 Testing ${endpointName} availability and functionality...`, 'test');
        
        const endpoint = `${this.backendUrl}/${endpointName}`;
        const result = await this.makeRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify(testPayload),
            headers: {
                'User-ID': this.testUserId
            }
        });
        
        if (!result.success) {
            this.log(`❌ ${endpointName} FAILED - ${result.error}`, 'error', {
                error: result.error,
                status: result.status,
                responseTime: `${result.responseTime}ms`
            });
            return null;
        }
        
        this.log(`✅ ${endpointName} WORKING`, 'success', {
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
            'conceptual framework', 'theoretical perspective', 'theoretical approach',
            'theoretical basis', 'theoretical underpinning'
        ];
        const frameworkCount = frameworkTerms.filter(term => 
            content.toLowerCase().includes(term.toLowerCase())
        ).length;
        indicators.theoreticalFrameworks = Math.min(frameworkCount * 0.4, 3.5);
        score += indicators.theoreticalFrameworks;
        
        // Synthesis Quality (3.5 points)
        const synthesisTerms = [
            'synthesis', 'integration', 'convergent', 'divergent', 'triangulation',
            'meta-analysis', 'systematic', 'comprehensive', 'holistic', 'unified',
            'interdisciplinary', 'multifaceted', 'convergence', 'synthesis of'
        ];
        const synthesisCount = synthesisTerms.filter(term => 
            content.toLowerCase().includes(term.toLowerCase())
        ).length;
        indicators.synthesisQuality = Math.min(synthesisCount * 0.5, 3.5);
        score += indicators.synthesisQuality;
        
        // Critical Analysis (3.0 points)
        const criticalTerms = [
            'critical', 'analysis', 'evaluate', 'assess', 'critique', 'examine',
            'limitations', 'strengths', 'weaknesses', 'implications', 'critical evaluation',
            'analytical', 'scrutinize', 'appraise', 'critical thinking'
        ];
        const criticalCount = criticalTerms.filter(term => 
            content.toLowerCase().includes(term.toLowerCase())
        ).length;
        indicators.criticalAnalysis = Math.min(criticalCount * 0.3, 3.0);
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
            'Cronbach\'s alpha', 'ICC', 'reliability', 'validity', 'statistical significance',
            'regression', 'correlation', 'ANOVA', 'chi-square'
        ];
        const statisticalCount = statisticalTerms.filter(term => 
            content.toLowerCase().includes(term.toLowerCase())
        ).length;
        indicators.statisticalSophistication = Math.min(statisticalCount * 0.4, 4.0);
        score += indicators.statisticalSophistication;
        
        // Methodological Validation (3.5 points)
        const methodologyTerms = [
            'validity', 'reliability', 'methodology', 'systematic', 'rigorous',
            'robust', 'comprehensive', 'thorough', 'validation', 'verification',
            'methodological', 'empirical', 'evidence-based', 'peer-reviewed'
        ];
        const methodologyCount = methodologyTerms.filter(term => 
            content.toLowerCase().includes(term.toLowerCase())
        ).length;
        indicators.methodologicalValidation = Math.min(methodologyCount * 0.4, 3.5);
        score += indicators.methodologicalValidation;
        
        // Bias Recognition (2.5 points)
        const biasTerms = [
            'bias', 'limitation', 'confound', 'control', 'random', 'systematic',
            'selection bias', 'publication bias', 'confirmation bias', 'sampling bias',
            'observer bias', 'response bias', 'confounding variable'
        ];
        const biasCount = biasTerms.filter(term => 
            content.toLowerCase().includes(term.toLowerCase())
        ).length;
        indicators.biasRecognition = Math.min(biasCount * 0.4, 2.5);
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
            'furthermore', 'moreover', 'however', 'therefore', 'consequently',
            'firstly', 'secondly', 'finally', 'in summary', 'to conclude'
        ];
        const structureCount = structureTerms.filter(term => 
            content.toLowerCase().includes(term.toLowerCase())
        ).length;
        indicators.logicalStructure = Math.min(structureCount * 0.3, 2.5);
        score += indicators.logicalStructure;
        
        // Gap Identification (2.5 points)
        const gapTerms = [
            'gap', 'limitation', 'future research', 'further study', 'unexplored',
            'insufficient', 'lacking', 'missing', 'need for', 'requires',
            'research gap', 'knowledge gap', 'literature gap', 'empirical gap'
        ];
        const gapCount = gapTerms.filter(term => 
            content.toLowerCase().includes(term.toLowerCase())
        ).length;
        indicators.gapIdentification = Math.min(gapCount * 0.4, 2.5);
        score += indicators.gapIdentification;
        
        // Citation Accuracy (2.5 points)
        const citationPatterns = [
            /\([A-Z][a-z]+,?\s+\d{4}\)/g,  // (Author, 2023)
            /\([A-Z][a-z]+\s+et\s+al\.,?\s+\d{4}\)/g,  // (Author et al., 2023)
            /\[[0-9]+\]/g,  // [1]
            /et\s+al\./g,   // et al.
            /doi:/g,        // DOI references
            /PMID:/g        // PubMed IDs
        ];
        let citationCount = 0;
        citationPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) citationCount += matches.length;
        });
        indicators.citationAccuracy = Math.min(citationCount * 0.2, 2.5);
        score += indicators.citationAccuracy;
        
        // Contribution Clarity (2.5 points)
        const contributionTerms = [
            'contribution', 'novel', 'original', 'innovative', 'significant',
            'implication', 'advancement', 'breakthrough', 'discovery', 'insight',
            'novelty', 'originality', 'significance', 'impact', 'contribution to knowledge'
        ];
        const contributionCount = contributionTerms.filter(term => 
            content.toLowerCase().includes(term.toLowerCase())
        ).length;
        indicators.contributionClarity = Math.min(contributionCount * 0.3, 2.5);
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
        
        // Content Length (2.5 points) - PhD-level content should be substantial
        if (content.length >= 3000) {
            indicators.contentLength = 2.5;
        } else if (content.length >= 2500) {
            indicators.contentLength = 2.0;
        } else if (content.length >= 2000) {
            indicators.contentLength = 1.5;
        } else if (content.length >= 1500) {
            indicators.contentLength = 1.0;
        } else if (content.length >= 1000) {
            indicators.contentLength = 0.5;
        } else {
            indicators.contentLength = 0.2;
        }
        score += indicators.contentLength;
        
        // Technical Precision (2.5 points)
        const technicalTerms = [
            'precise', 'specific', 'exact', 'accurate', 'detailed', 'comprehensive',
            'systematic', 'rigorous', 'thorough', 'meticulous', 'methodical',
            'empirical', 'quantitative', 'qualitative', 'analytical'
        ];
        const technicalCount = technicalTerms.filter(term => 
            content.toLowerCase().includes(term.toLowerCase())
        ).length;
        indicators.technicalPrecision = Math.min(technicalCount * 0.3, 2.5);
        score += indicators.technicalPrecision;
        
        // Originality (2.5 points)
        const originalityTerms = [
            'novel', 'original', 'innovative', 'unique', 'new', 'first',
            'unprecedented', 'groundbreaking', 'pioneering', 'cutting-edge',
            'state-of-the-art', 'emerging', 'contemporary', 'recent advances'
        ];
        const originalityCount = originalityTerms.filter(term => 
            content.toLowerCase().includes(term.toLowerCase())
        ).length;
        indicators.originality = Math.min(originalityCount * 0.3, 2.5);
        score += indicators.originality;
        
        // Peer Review Readiness (2.5 points)
        const readinessTerms = [
            'peer review', 'publication', 'journal', 'manuscript', 'academic',
            'scholarly', 'research', 'study', 'investigation', 'analysis',
            'findings', 'results', 'conclusions', 'recommendations', 'implications'
        ];
        const readinessCount = readinessTerms.filter(term => 
            content.toLowerCase().includes(term.toLowerCase())
        ).length;
        indicators.peerReviewReadiness = Math.min(readinessCount * 0.25, 2.5);
        score += indicators.peerReviewReadiness;
        
        return {
            score: Math.min(score, 10),
            indicators,
            maxScore: 10
        };
    }

    async runComprehensiveTest() {
        this.log('🚀 STARTING COMPREHENSIVE ENDPOINT QUALITY TEST', 'phase');
        this.log('🎯 Testing all endpoints with GPT-5/O3 configuration across 5 PhD-level quality dimensions', 'info');
        this.log('🤖 Expected models: GPT-5 → O3 → GPT-4 Turbo (premium), O3-mini → GPT-4o-mini (fast)', 'model');
        
        const testPayloads = {
            'generate-summary': {
                project_id: this.testProjectId,
                summary_type: 'comprehensive',
                include_analyses: true,
                phd_enhancement: true
            },
            'generate-review': {
                molecule: 'machine learning in healthcare diagnostics',
                objective: 'Comprehensive PhD-level systematic review of ML applications in medical diagnosis',
                project_id: this.testProjectId,
                max_results: 15,
                phd_enhancement: true
            },
            'deep-dive': {
                pmid: '32511222',
                title: 'Advanced Machine Learning Applications in Healthcare Diagnostics',
                objective: 'Comprehensive PhD-level deep dive analysis of ML diagnostic systems',
                url: 'https://pubmed.ncbi.nlm.nih.gov/32511222/',
                phd_enhancement: true
            },
            'thesis-chapter-generator': {
                chapter_type: 'literature_review',
                research_topic: 'Artificial intelligence applications in precision medicine',
                research_focus: 'AI-driven personalized treatment recommendations',
                methodology_approach: 'systematic review and meta-analysis',
                project_id: this.testProjectId,
                phd_enhancement: true
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
        let failedEndpoints = 0;
        
        for (const endpoint of this.testEndpoints) {
            this.log(`🔗 Testing endpoint: ${endpoint}`, 'endpoint');
            
            const testResult = await this.testEndpointAvailability(endpoint, testPayloads[endpoint]);
            
            if (testResult) {
                allResults.push(testResult);
                workingEndpoints++;
                
                const assessment = testResult.qualityAssessment;
                if (assessment.phdReady) {
                    this.log(`✅ ${endpoint} achieves PhD-level quality (${assessment.overallScore.toFixed(1)}/10)`, 'success');
                } else {
                    this.log(`⚠️ ${endpoint} needs improvement (${assessment.overallScore.toFixed(1)}/10)`, 'warning');
                }
            } else {
                failedEndpoints++;
            }
            
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        // Generate comprehensive report
        this.generateComprehensiveReport(allResults, workingEndpoints, failedEndpoints);
        
        return allResults;
    }

    generateComprehensiveReport(results, workingEndpoints, failedEndpoints) {
        const totalEndpoints = this.testEndpoints.length;
        const phdReadyEndpoints = results.filter(r => r.qualityAssessment.phdReady).length;
        
        // Calculate average scores
        const avgContentDepth = this.qualityMetrics.contentDepth.reduce((a, b) => a + b, 0) / this.qualityMetrics.contentDepth.length || 0;
        const avgResearchRigor = this.qualityMetrics.researchRigor.reduce((a, b) => a + b, 0) / this.qualityMetrics.researchRigor.length || 0;
        const avgAcademicStandards = this.qualityMetrics.academicStandards.reduce((a, b) => a + b, 0) / this.qualityMetrics.academicStandards.length || 0;
        const avgProfessionalOutput = this.qualityMetrics.professionalOutput.reduce((a, b) => a + b, 0) / this.qualityMetrics.professionalOutput.length || 0;
        const avgOverallScore = this.qualityMetrics.overallScores.reduce((a, b) => a + b, 0) / this.qualityMetrics.overallScores.length || 0;
        
        this.log('📋 COMPREHENSIVE ENDPOINT QUALITY TEST REPORT', 'summary');
        this.log(`🔗 Endpoint Availability: ${workingEndpoints}/${totalEndpoints} working (${failedEndpoints} failed)`, 'info');
        this.log(`📊 PhD Quality Results: ${phdReadyEndpoints}/${workingEndpoints} endpoints PhD-ready`, 'info');
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
        
        // Critical assessment
        if (failedEndpoints > 0) {
            this.log(`❌ CRITICAL: ${failedEndpoints} endpoints are not working - this violates the requirement that ALL endpoints must be functional`, 'error');
        }
        
        if (workingEndpoints === totalEndpoints && phdReadyEndpoints === workingEndpoints) {
            this.log('🎉 SUCCESS: All endpoints working and achieving PhD-level quality with GPT-5/O3 configuration!', 'success');
        } else if (workingEndpoints === totalEndpoints) {
            this.log('⚠️ PARTIAL SUCCESS: All endpoints working but quality improvements needed', 'warning');
        } else {
            this.log('❌ FAILURE: Some endpoints not working - immediate fixes required', 'error');
        }
        
        this.log('🎉 COMPREHENSIVE ENDPOINT QUALITY TEST COMPLETED', 'success');
    }
}

// Run the comprehensive test
const testSuite = new ComprehensiveEndpointQualityTest();
testSuite.runComprehensiveTest().catch(console.error);
