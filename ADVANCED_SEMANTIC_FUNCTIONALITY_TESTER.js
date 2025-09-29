/**
 * ADVANCED SEMANTIC FUNCTIONALITY TESTER
 * Comprehensive testing of semantic features and capabilities
 */

class AdvancedSemanticFunctionalityTester {
    constructor() {
        this.results = [];
        this.testScenarios = [];
    }

    log(message, type = 'info', data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, type, message, data };
        this.results.push(logEntry);
        
        const emoji = {
            'info': 'ℹ️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌',
            'test': '🧪',
            'semantic': '🧠',
            'performance': '⚡'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} [${timestamp}] ${message}`);
        if (data) {
            console.log('Data:', data);
        }
    }

    async testSemanticGenerateReviewScenarios() {
        this.log('🧠 TESTING SEMANTIC GENERATE-REVIEW SCENARIOS', 'semantic');
        
        const scenarios = [
            {
                name: 'Cross-Domain Analysis',
                payload: {
                    molecule: 'Machine learning applications in drug discovery',
                    objective: 'Cross-domain semantic analysis test',
                    semantic_expansion: true,
                    domain_focus: ['artificial intelligence', 'pharmacology', 'biotechnology'],
                    cross_domain_exploration: true,
                    similarity_threshold: 0.3,
                    max_results: 5
                }
            },
            {
                name: 'Personalized Research',
                payload: {
                    molecule: 'CRISPR gene therapy for rare diseases',
                    objective: 'Personalized semantic recommendations',
                    semantic_expansion: true,
                    user_context: {
                        research_interests: ['gene therapy', 'rare diseases', 'CRISPR'],
                        recent_papers: ['32887946', '38428389'],
                        saved_collections: ['gene_therapy_research'],
                        expertise_level: 'advanced'
                    },
                    include_related_concepts: true,
                    max_semantic_results: 8
                }
            },
            {
                name: 'Quality-Focused Analysis',
                payload: {
                    molecule: 'Immunotherapy mechanisms in cancer treatment',
                    objective: 'High-quality semantic analysis with text extraction',
                    semantic_expansion: true,
                    quality_threshold: 0.8,
                    fullTextOnly: false,
                    include_methodology_analysis: true,
                    include_statistical_analysis: true,
                    max_results: 6
                }
            }
        ];

        const scenarioResults = [];
        
        for (const scenario of scenarios) {
            this.log(`🧪 Testing scenario: ${scenario.name}`, 'test');
            const startTime = Date.now();
            
            try {
                const response = await fetch('/api/proxy/generate-review-semantic', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-ID': 'fredericle77@gmail.com'
                    },
                    body: JSON.stringify(scenario.payload)
                });

                const responseTime = Date.now() - startTime;
                
                if (response.ok) {
                    const data = await response.json();
                    
                    // Analyze response quality
                    const analysis = this.analyzeSemanticResponse(data, 'generate-review');
                    
                    scenarioResults.push({
                        scenario: scenario.name,
                        success: true,
                        responseTime,
                        analysis,
                        data
                    });
                    
                    this.log(`✅ ${scenario.name} successful`, 'success', {
                        responseTime: `${responseTime}ms`,
                        resultsCount: data.results?.length || 0,
                        semanticQuality: analysis.semanticQuality,
                        textExtractionQuality: analysis.textExtractionQuality
                    });
                } else {
                    scenarioResults.push({
                        scenario: scenario.name,
                        success: false,
                        responseTime,
                        error: response.status
                    });
                    this.log(`❌ ${scenario.name} failed`, 'error', response.status);
                }
            } catch (error) {
                scenarioResults.push({
                    scenario: scenario.name,
                    success: false,
                    responseTime: Date.now() - startTime,
                    error: error.message
                });
                this.log(`❌ ${scenario.name} error`, 'error', error.message);
            }
        }

        return scenarioResults;
    }

    async testSemanticDeepDiveScenarios() {
        this.log('🔬 TESTING SEMANTIC DEEP-DIVE SCENARIOS', 'semantic');
        
        const scenarios = [
            {
                name: 'Comprehensive Paper Analysis',
                payload: {
                    pmid: '32887946',
                    title: 'Gut microbiota in human metabolic health and disease',
                    objective: 'Comprehensive semantic deep-dive analysis',
                    semantic_context: true,
                    find_related_papers: true,
                    concept_mapping: true,
                    cross_domain_analysis: true,
                    max_related_papers: 10
                }
            },
            {
                name: 'User-Contextualized Analysis',
                payload: {
                    pmid: '38428389',
                    title: 'Past, present, and future of CRISPR genome editing technologies',
                    objective: 'User-contextualized deep-dive with personalization',
                    semantic_context: true,
                    user_context: {
                        research_interests: ['CRISPR', 'gene editing', 'biotechnology'],
                        recent_papers: ['32887946', '38462606'],
                        saved_collections: ['crispr_research', 'gene_therapy'],
                        search_history: ['CRISPR applications', 'gene editing ethics']
                    },
                    find_related_papers: true,
                    similarity_threshold: 0.4
                }
            },
            {
                name: 'Cross-Domain Connection Analysis',
                payload: {
                    pmid: '38462606',
                    title: "Updates on mouse models of Alzheimer's disease",
                    objective: 'Cross-domain connection mapping and analysis',
                    semantic_context: true,
                    cross_domain_analysis: true,
                    concept_mapping: true,
                    find_related_papers: true,
                    domain_expansion: ['neuroscience', 'genetics', 'pharmacology', 'biotechnology']
                }
            }
        ];

        const scenarioResults = [];
        
        for (const scenario of scenarios) {
            this.log(`🧪 Testing deep-dive scenario: ${scenario.name}`, 'test');
            const startTime = Date.now();
            
            try {
                const response = await fetch('/api/proxy/deep-dive-semantic', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-ID': 'fredericle77@gmail.com'
                    },
                    body: JSON.stringify(scenario.payload)
                });

                const responseTime = Date.now() - startTime;
                
                if (response.ok) {
                    const data = await response.json();
                    
                    // Analyze response quality
                    const analysis = this.analyzeSemanticResponse(data, 'deep-dive');
                    
                    scenarioResults.push({
                        scenario: scenario.name,
                        success: true,
                        responseTime,
                        analysis,
                        data
                    });
                    
                    this.log(`✅ ${scenario.name} successful`, 'success', {
                        responseTime: `${responseTime}ms`,
                        hasSemanticAnalysis: !!data.semantic_analysis,
                        hasRelatedPapers: !!data.related_papers,
                        hasUserInsights: !!data.user_insights,
                        semanticQuality: analysis.semanticQuality
                    });
                } else {
                    scenarioResults.push({
                        scenario: scenario.name,
                        success: false,
                        responseTime,
                        error: response.status
                    });
                    this.log(`❌ ${scenario.name} failed`, 'error', response.status);
                }
            } catch (error) {
                scenarioResults.push({
                    scenario: scenario.name,
                    success: false,
                    responseTime: Date.now() - startTime,
                    error: error.message
                });
                this.log(`❌ ${scenario.name} error`, 'error', error.message);
            }
        }

        return scenarioResults;
    }

    analyzeSemanticResponse(data, type) {
        this.log(`🔍 Analyzing ${type} response quality`, 'semantic');
        
        const analysis = {
            responseStructure: {
                hasResults: !!data.results,
                hasSemanticAnalysis: !!data.semantic_analysis,
                hasPersonalization: !!data.personalization,
                hasContentQuality: !!data.content_quality,
                hasMetadata: !!data.metadata
            },
            semanticQuality: 0,
            textExtractionQuality: 0,
            personalizationQuality: 0,
            contentQualityMetrics: {}
        };

        // Analyze semantic analysis quality
        if (data.semantic_analysis) {
            const semantic = data.semantic_analysis;
            let semanticScore = 0;
            
            if (semantic.expanded_queries?.length > 0) semanticScore += 20;
            if (semantic.concept_mappings && Object.keys(semantic.concept_mappings).length > 0) semanticScore += 20;
            if (semantic.domain_bridges?.length > 0) semanticScore += 20;
            if (semantic.related_concepts?.length > 0) semanticScore += 20;
            if (semantic.semantic_clusters?.length > 0) semanticScore += 20;
            
            analysis.semanticQuality = semanticScore;
        }

        // Analyze text extraction quality
        if (data.results && Array.isArray(data.results)) {
            const results = data.results;
            let textScore = 0;
            let papersWithText = 0;
            
            results.forEach(result => {
                if (result.articles && result.articles.length > 0) {
                    const article = result.articles[0];
                    if (article.title) textScore += 10;
                    if (article.abstract && article.abstract.length > 100) textScore += 20;
                    if (article.full_text && article.full_text.length > 1000) textScore += 30;
                    if (article.pmid) textScore += 10;
                    papersWithText++;
                }
            });
            
            analysis.textExtractionQuality = results.length > 0 ? textScore / results.length : 0;
        }

        // Analyze personalization quality
        if (data.personalization) {
            const personalization = data.personalization;
            let personalizationScore = 0;
            
            if (personalization.relevance_scores && Object.keys(personalization.relevance_scores).length > 0) personalizationScore += 25;
            if (personalization.user_interest_alignment && Object.keys(personalization.user_interest_alignment).length > 0) personalizationScore += 25;
            if (personalization.recommendation_reasons && Object.keys(personalization.recommendation_reasons).length > 0) personalizationScore += 25;
            if (personalization.follow_up_suggestions?.length > 0) personalizationScore += 25;
            
            analysis.personalizationQuality = personalizationScore;
        }

        // Analyze content quality metrics
        if (data.content_quality) {
            analysis.contentQualityMetrics = data.content_quality;
        }

        return analysis;
    }

    async testPerformanceMetrics() {
        this.log('⚡ TESTING PERFORMANCE METRICS', 'performance');
        
        const performanceTests = [
            {
                name: 'Quick Response Test',
                payload: {
                    molecule: 'COVID-19 treatment',
                    objective: 'Quick response test',
                    max_results: 3
                }
            },
            {
                name: 'Comprehensive Analysis Test',
                payload: {
                    molecule: 'Artificial intelligence in healthcare',
                    objective: 'Comprehensive analysis performance test',
                    semantic_expansion: true,
                    cross_domain_exploration: true,
                    max_results: 10,
                    include_related_concepts: true
                }
            }
        ];

        const performanceResults = [];
        
        for (const test of performanceTests) {
            const startTime = Date.now();
            
            try {
                const response = await fetch('/api/proxy/generate-review-semantic', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-ID': 'fredericle77@gmail.com'
                    },
                    body: JSON.stringify(test.payload)
                });

                const responseTime = Date.now() - startTime;
                
                if (response.ok) {
                    const data = await response.json();
                    
                    performanceResults.push({
                        test: test.name,
                        responseTime,
                        resultsCount: data.results?.length || 0,
                        throughput: (data.results?.length || 0) / (responseTime / 1000), // results per second
                        success: true
                    });
                } else {
                    performanceResults.push({
                        test: test.name,
                        responseTime,
                        success: false,
                        error: response.status
                    });
                }
            } catch (error) {
                performanceResults.push({
                    test: test.name,
                    responseTime: Date.now() - startTime,
                    success: false,
                    error: error.message
                });
            }
        }

        return performanceResults;
    }

    async runAdvancedSemanticTests() {
        this.log('🚀 STARTING ADVANCED SEMANTIC FUNCTIONALITY TESTS', 'semantic');
        
        // Test 1: Generate-Review Scenarios
        const generateReviewResults = await this.testSemanticGenerateReviewScenarios();
        
        // Test 2: Deep-Dive Scenarios
        const deepDiveResults = await this.testSemanticDeepDiveScenarios();
        
        // Test 3: Performance Metrics
        const performanceResults = await this.testPerformanceMetrics();

        // Comprehensive analysis
        const overallResults = {
            generateReviewTests: {
                total: generateReviewResults.length,
                successful: generateReviewResults.filter(r => r.success).length,
                averageResponseTime: generateReviewResults.reduce((sum, r) => sum + r.responseTime, 0) / generateReviewResults.length,
                results: generateReviewResults
            },
            deepDiveTests: {
                total: deepDiveResults.length,
                successful: deepDiveResults.filter(r => r.success).length,
                averageResponseTime: deepDiveResults.reduce((sum, r) => sum + r.responseTime, 0) / deepDiveResults.length,
                results: deepDiveResults
            },
            performanceTests: {
                total: performanceResults.length,
                successful: performanceResults.filter(r => r.success).length,
                averageResponseTime: performanceResults.reduce((sum, r) => sum + r.responseTime, 0) / performanceResults.length,
                results: performanceResults
            }
        };

        // Store results
        window.advancedSemanticTests = {
            overallResults,
            generateReviewResults,
            deepDiveResults,
            performanceResults,
            timestamp: new Date().toISOString(),
            logs: this.results
        };

        this.log('✅ Advanced semantic functionality tests complete', 'success');
        this.log('📊 Overall Results:', 'info', {
            generateReviewSuccessRate: `${overallResults.generateReviewTests.successful}/${overallResults.generateReviewTests.total}`,
            deepDiveSuccessRate: `${overallResults.deepDiveTests.successful}/${overallResults.deepDiveTests.total}`,
            performanceSuccessRate: `${overallResults.performanceTests.successful}/${overallResults.performanceTests.total}`,
            averageResponseTimes: {
                generateReview: `${Math.round(overallResults.generateReviewTests.averageResponseTime)}ms`,
                deepDive: `${Math.round(overallResults.deepDiveTests.averageResponseTime)}ms`,
                performance: `${Math.round(overallResults.performanceTests.averageResponseTime)}ms`
            }
        });

        this.log('Results stored in window.advancedSemanticTests', 'info');
        
        return window.advancedSemanticTests;
    }
}

// Auto-execute when script is loaded
(async () => {
    const tester = new AdvancedSemanticFunctionalityTester();
    await tester.runAdvancedSemanticTests();
})();
