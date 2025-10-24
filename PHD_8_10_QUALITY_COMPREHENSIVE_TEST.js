/**
 * PHD 8/10 QUALITY COMPREHENSIVE TEST v1.0
 * 
 * Tests our advanced 8/10 enhancement system across all 5 PhD-level quality dimensions:
 * 1. Content Depth (theoretical frameworks, synthesis quality, critical analysis)
 * 2. Research Rigor (statistical sophistication, methodological validation, bias recognition)
 * 3. Academic Standards (logical structure, gap identification, citation accuracy, contribution clarity)
 * 4. Professional Output (content length, technical precision, originality, peer review readiness)
 * 5. Overall PhD Readiness (comprehensive assessment across all dimensions)
 * 
 * Usage: Copy and paste this entire script into your browser console
 * Make sure you're on your frontend domain (frontend-psi-seven-85.vercel.app)
 */

class PhD8_10QualityComprehensiveTest {
    constructor() {
        this.baseUrl = 'https://frontend-psi-seven-85.vercel.app';
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
        
        // Test endpoints for PhD-level quality assessment
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
            console.log('Data:', data);
        }
        this.results.push({ timestamp, type, message, data, elapsed });
    }

    async makeRequest(endpoint, options = {}) {
        const startTime = Date.now();
        
        try {
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.testUserId
                }
            };
            
            const mergedOptions = {
                ...defaultOptions,
                ...options,
                headers: { ...defaultOptions.headers, ...options.headers }
            };
            
            const response = await fetch(endpoint, mergedOptions);
            const responseTime = Date.now() - startTime;
            
            let data = null;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }
            
            return { 
                success: response.ok, 
                data, 
                status: response.status, 
                responseTime,
                error: response.ok ? null : `HTTP ${response.status}`
            };
        } catch (error) {
            const responseTime = Date.now() - startTime;
            return { 
                success: false, 
                error: error.message, 
                responseTime 
            };
        }
    }

    async testEndpointQuality(endpointName, testPayload) {
        this.log(`🧪 Testing ${endpointName} for PhD-level quality...`, 'test');
        
        const endpoint = `${this.baseUrl}/api/proxy/${endpointName}`;
        const result = await this.makeRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify(testPayload)
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

    async testAllEndpointsComprehensive() {
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
                title: 'Test Deep Dive Analysis',
                objective: 'Comprehensive PhD-level deep dive analysis',
                project_id: this.testProjectId,
                phd_enhancement: true
            },
            'thesis-chapter-generator': {
                chapter_type: 'literature_review',
                research_topic: 'Machine learning applications in healthcare',
                project_id: this.testProjectId,
                phd_enhancement: true
            },
            'literature-gap-analysis': {
                research_domain: 'artificial intelligence in medicine',
                project_id: this.testProjectId,
                analysis_depth: 'comprehensive',
                phd_enhancement: true
            },
            'methodology-synthesis': {
                research_methods: ['quantitative', 'qualitative', 'mixed-methods'],
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
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
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
        
        const report = {
            testSummary: {
                totalEndpoints,
                phdReadyEndpoints,
                successRate: `${((phdReadyEndpoints / totalEndpoints) * 100).toFixed(1)}%`,
                testDuration: `${Date.now() - this.startTime}ms`
            },
            qualityDimensions: {
                contentDepth: {
                    average: avgContentDepth.toFixed(1),
                    target: '8.0+',
                    achieved: avgContentDepth >= 8.0
                },
                researchRigor: {
                    average: avgResearchRigor.toFixed(1),
                    target: '8.0+',
                    achieved: avgResearchRigor >= 8.0
                },
                academicStandards: {
                    average: avgAcademicStandards.toFixed(1),
                    target: '8.0+',
                    achieved: avgAcademicStandards >= 8.0
                },
                professionalOutput: {
                    average: avgProfessionalOutput.toFixed(1),
                    target: '8.0+',
                    achieved: avgProfessionalOutput >= 8.0
                }
            },
            overallAssessment: {
                averageScore: avgOverallScore.toFixed(1),
                target: '8.0+',
                achieved: avgOverallScore >= 8.0,
                phdReadiness: avgOverallScore >= 8.0 ? '✅ ACHIEVED' : '⚠️ NEEDS IMPROVEMENT'
            },
            endpointResults: results.map(r => ({
                endpoint: r.endpoint,
                score: r.qualityAssessment.overallScore.toFixed(1),
                phdReady: r.qualityAssessment.phdReady,
                contentLength: r.qualityAssessment.contentLength,
                responseTime: `${r.responseTime}ms`
            }))
        };
        
        this.log('📋 COMPREHENSIVE PHD 8/10 QUALITY TEST REPORT', 'summary');
        this.log(`📊 Overall Results: ${phdReadyEndpoints}/${totalEndpoints} endpoints PhD-ready`, 'info');
        this.log(`🎯 Average Quality Score: ${avgOverallScore.toFixed(1)}/10`, 'info');
        this.log(`✅ PhD Readiness: ${report.overallAssessment.phdReadiness}`, 'info');
        
        console.log('\n🔍 DETAILED QUALITY REPORT:');
        console.log(JSON.stringify(report, null, 2));
        
        // Store in window for easy access
        window.phdQualityTestResults = {
            report,
            rawResults: results,
            qualityMetrics: this.qualityMetrics,
            testLog: this.results
        };
        
        this.log('Results stored in window.phdQualityTestResults for detailed analysis', 'info');
        
        return report;
    }

    async runComprehensiveTest() {
        try {
            const results = await this.testAllEndpointsComprehensive();
            const report = this.generateComprehensiveReport(results);
            
            this.log('🎉 PHD 8/10 QUALITY COMPREHENSIVE TEST COMPLETED', 'success');
            return report;
        } catch (error) {
            this.log('❌ Test suite failed with error', 'error', error);
            throw error;
        }
    }
}

// Auto-execute the test suite
console.log('🎯 PHD 8/10 QUALITY COMPREHENSIVE TEST SUITE');
console.log('=============================================');
console.log('Testing advanced 8/10 enhancement system across 5 PhD-level quality dimensions');

const testSuite = new PhD8_10QualityComprehensiveTest();
testSuite.runComprehensiveTest();
