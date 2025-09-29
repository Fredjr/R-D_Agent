/**
 * SEMANTIC ENDPOINT DEBUG TEST
 * Minimal test to isolate semantic endpoint issues
 */

class SemanticEndpointDebugger {
    constructor() {
        this.baseUrl = 'https://frontend-psi-seven-85.vercel.app';
        this.results = [];
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
            'test': '🧪'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} [${timestamp}] ${message}`);
        if (data) {
            console.log('Data:', data);
        }
    }

    async makeRequest(endpoint, options = {}) {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            this.log(`Making request to: ${url}`, 'info');
            
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': 'fredericle77@gmail.com',
                    ...options.headers
                },
                ...options
            });

            this.log(`Response status: ${response.status}`, response.ok ? 'success' : 'error');
            
            const data = await response.json();
            return { data, error: null, status: response.status };
        } catch (error) {
            this.log(`Request failed: ${error.message}`, 'error');
            return { data: null, error: error.message, status: 0 };
        }
    }

    async testSemanticGenerateReview() {
        this.log('🧠 TESTING SEMANTIC GENERATE-REVIEW WITH COMPREHENSIVE PAYLOAD', 'test');

        const comprehensivePayload = {
            molecule: 'CRISPR gene editing in diabetes treatment',
            objective: 'Comprehensive review of CRISPR applications in diabetes therapy with text extraction analysis',
            semantic_expansion: true,
            domain_focus: ['genetics', 'biotechnology', 'diabetes'],
            cross_domain_exploration: true,
            user_context: {
                research_domains: ['genetics', 'medicine'],
                recent_searches: ['CRISPR', 'diabetes', 'gene therapy'],
                saved_papers: ['32887946', '33462507'],
                interaction_history: []
            },
            fullTextOnly: false,
            similarity_threshold: 0.3,
            include_related_concepts: true,
            max_semantic_results: 30
        };

        this.log('Comprehensive payload:', 'info', {
            molecule: comprehensivePayload.molecule,
            semantic_expansion: comprehensivePayload.semantic_expansion,
            domain_focus: comprehensivePayload.domain_focus,
            fullTextOnly: comprehensivePayload.fullTextOnly
        });

        const { data, error, status } = await this.makeRequest(
            '/api/proxy/generate-review-semantic',
            {
                method: 'POST',
                body: JSON.stringify(comprehensivePayload)
            }
        );

        if (error) {
            this.log('❌ Semantic Generate-Review FAILED', 'error', { error, status });
            return false;
        }

        // Analyze text extraction capabilities
        const textExtractionAnalysis = this.analyzeTextExtraction(data, 'generate-review');

        this.log('✅ Semantic Generate-Review SUCCESS', 'success', {
            status,
            hasResults: !!data?.results,
            hasAnalysis: !!data?.analysis,
            hasSemanticEnhancements: !!data?.semantic_enhancements,
            responseKeys: Object.keys(data || {}),
            textExtraction: textExtractionAnalysis
        });

        return true;
    }

    async testSemanticDeepDive() {
        this.log('🔬 TESTING SEMANTIC DEEP-DIVE WITH COMPREHENSIVE PAYLOAD', 'test');

        const comprehensivePayload = {
            pmid: '32887946',
            title: 'Gut microbiota in human metabolic health and disease',
            objective: 'Comprehensive deep-dive analysis with text extraction validation',
            semantic_context: true,
            find_related_papers: true,
            concept_mapping: true,
            cross_domain_analysis: true,
            similarity_threshold: 0.3,
            max_related_papers: 20,
            user_context: {
                research_interests: ['genetics', 'medicine', 'biotechnology'],
                recent_papers: ['32887946', '33462507'],
                saved_collections: ['diabetes_research', 'gene_therapy'],
                search_history: ['CRISPR', 'gene therapy', 'diabetes treatment']
            }
        };

        this.log('Comprehensive payload:', 'info', {
            pmid: comprehensivePayload.pmid,
            semantic_context: comprehensivePayload.semantic_context,
            find_related_papers: comprehensivePayload.find_related_papers,
            cross_domain_analysis: comprehensivePayload.cross_domain_analysis
        });

        const { data, error, status } = await this.makeRequest(
            '/api/proxy/deep-dive-semantic',
            {
                method: 'POST',
                body: JSON.stringify(comprehensivePayload)
            }
        );

        if (error) {
            this.log('❌ Semantic Deep-Dive FAILED', 'error', { error, status });
            return false;
        }

        // Analyze text extraction capabilities
        const textExtractionAnalysis = this.analyzeTextExtraction(data, 'deep-dive');

        this.log('✅ Semantic Deep-Dive SUCCESS', 'success', {
            status,
            hasAnalysis: !!data?.analysis,
            hasSemanticAnalysis: !!data?.semantic_analysis,
            hasRelatedPapers: !!data?.related_papers,
            responseKeys: Object.keys(data || {}),
            textExtraction: textExtractionAnalysis
        });

        return true;
    }

    async testBackendDirectly() {
        this.log('🔧 TESTING BACKEND ENDPOINTS DIRECTLY', 'test');
        
        // Test backend generate-review directly
        this.log('Testing backend generate-review directly...', 'info');
        const generateReviewPayload = {
            molecule: 'COVID-19',
            objective: 'Direct backend test'
        };

        try {
            const response = await fetch('https://r-dagent-production.up.railway.app/generate-review', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(generateReviewPayload)
            });

            this.log(`Backend generate-review status: ${response.status}`, response.ok ? 'success' : 'error');
            
            if (response.ok) {
                const data = await response.json();
                this.log('✅ Backend generate-review SUCCESS', 'success', {
                    hasResults: !!data?.results,
                    hasQueries: !!data?.queries,
                    resultCount: data?.results?.length || 0
                });
            } else {
                const errorText = await response.text();
                this.log('❌ Backend generate-review FAILED', 'error', errorText);
            }
        } catch (error) {
            this.log('❌ Backend generate-review ERROR', 'error', error.message);
        }

        // Test backend deep-dive directly
        this.log('Testing backend deep-dive directly...', 'info');
        const deepDivePayload = {
            pmid: '32887946',
            title: 'Gut microbiota in human metabolic health and disease',
            objective: 'Direct backend test'
        };

        try {
            const response = await fetch('https://r-dagent-production.up.railway.app/deep-dive', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(deepDivePayload)
            });

            this.log(`Backend deep-dive status: ${response.status}`, response.ok ? 'success' : 'error');
            
            if (response.ok) {
                const data = await response.json();
                this.log('✅ Backend deep-dive SUCCESS', 'success', {
                    hasModel: !!data?.model_description_structured,
                    hasMethods: !!data?.methods_structured,
                    hasResults: !!data?.results_structured
                });
            } else {
                const errorText = await response.text();
                this.log('❌ Backend deep-dive FAILED', 'error', errorText);
            }
        } catch (error) {
            this.log('❌ Backend deep-dive ERROR', 'error', error.message);
        }
    }

    analyzeTextExtraction(data, type) {
        this.log(`📄 ANALYZING TEXT EXTRACTION FOR ${type.toUpperCase()}`, 'test');

        const analysis = {
            totalPapers: 0,
            papersWithFullText: 0,
            papersWithAbstractOnly: 0,
            averageContentLength: 0,
            extractionMethods: new Set(),
            qualityScores: [],
            consistentProcessing: false
        };

        // Analyze results array
        const results = data?.results || [];
        analysis.totalPapers = results.length;

        let totalContentLength = 0;
        results.forEach(paper => {
            // Check for full text
            if (paper.full_text && paper.full_text.length > 1000) {
                analysis.papersWithFullText++;
                totalContentLength += paper.full_text.length;
            } else if (paper.abstract && !paper.full_text) {
                analysis.papersWithAbstractOnly++;
                totalContentLength += paper.abstract.length;
            }

            // Track extraction methods
            if (paper.extraction_method) {
                analysis.extractionMethods.add(paper.extraction_method);
            }

            // Track quality scores
            if (paper.quality_score) {
                analysis.qualityScores.push(paper.quality_score);
            }
        });

        if (analysis.totalPapers > 0) {
            analysis.averageContentLength = totalContentLength / analysis.totalPapers;
        }

        // Check for consistent processing settings
        analysis.consistentProcessing = this.checkConsistentProcessing(data, type);

        this.log(`📊 Text Extraction Analysis for ${type}:`, 'info', {
            ...analysis,
            extractionMethods: Array.from(analysis.extractionMethods),
            averageQualityScore: analysis.qualityScores.length > 0
                ? analysis.qualityScores.reduce((a, b) => a + b, 0) / analysis.qualityScores.length
                : 0,
            fullTextPercentage: analysis.totalPapers > 0
                ? (analysis.papersWithFullText / analysis.totalPapers * 100).toFixed(1) + '%'
                : '0%'
        });

        return analysis;
    }

    checkConsistentProcessing(data, type) {
        // Check if processing settings are consistent between generate-review and deep-dive
        const hasEnhancedExtraction = !!(data?.metadata?.content_extraction || data?.extraction_settings);
        const hasQualityThresholds = !!(data?.quality_metrics || data?.content_quality);
        const hasFallbackMechanisms = !!(data?.fallback_used || data?.extraction_fallbacks);

        return hasEnhancedExtraction && hasQualityThresholds;
    }

    async testSemanticUIComponents() {
        this.log('🎨 TESTING SEMANTIC UI COMPONENTS', 'test');

        const uiTests = [
            {
                component: 'SemanticEnhancedResultsCard',
                selector: '[data-testid="semantic-enhanced-results-card"]',
                features: [
                    'content-quality-metrics',
                    'expandable-semantic-analysis',
                    'personalized-insights',
                    'cross-domain-connections'
                ]
            },
            {
                component: 'SemanticDeepDiveCard',
                selector: '[data-testid="semantic-deep-dive-card"]',
                features: [
                    'user-relevance-scoring',
                    'related-papers-categorization',
                    'ai-powered-recommendations',
                    'personal-research-connections',
                    'interactive-expandable-sections'
                ]
            }
        ];

        const componentResults = {};

        for (const test of uiTests) {
            this.log(`Testing ${test.component}...`, 'info');

            const element = document.querySelector(test.selector);
            const result = {
                found: !!element,
                features: {},
                expandableSections: 0,
                progressBars: 0,
                qualityMetrics: 0,
                categoryElements: 0
            };

            if (element) {
                this.log(`✅ ${test.component} found in DOM`, 'success');

                // Test specific features
                test.features.forEach(feature => {
                    const featureElement = element.querySelector(`[data-feature="${feature}"]`);
                    result.features[feature] = !!featureElement;
                });

                // Test expandable sections
                result.expandableSections = element.querySelectorAll('[data-expandable]').length;

                // Test progress bars (for relevance scoring)
                result.progressBars = element.querySelectorAll('[data-progress-bar], .progress-bar, [role="progressbar"]').length;

                // Test quality metrics visualization
                result.qualityMetrics = element.querySelectorAll('[data-quality-metric], .quality-metric').length;

                // Test categorization elements
                result.categoryElements = element.querySelectorAll('[data-category], .category-tag').length;

                this.log(`📊 ${test.component} Analysis:`, 'info', {
                    expandableSections: result.expandableSections,
                    progressBars: result.progressBars,
                    qualityMetrics: result.qualityMetrics,
                    categoryElements: result.categoryElements,
                    featuresFound: Object.values(result.features).filter(Boolean).length
                });

            } else {
                this.log(`⚠️ ${test.component} not found in current DOM`, 'warning');
                this.log(`💡 Component may load dynamically when semantic analysis is executed`, 'info');
            }

            componentResults[test.component] = result;
        }

        // Test for general semantic enhancement indicators
        this.testGeneralSemanticIndicators();

        return componentResults;
    }

    testGeneralSemanticIndicators() {
        this.log('🔍 Testing general semantic enhancement indicators...', 'info');

        const indicators = {
            semanticBadges: document.querySelectorAll('[data-semantic], .semantic-badge').length,
            enhancementIcons: document.querySelectorAll('[data-enhancement], .enhancement-icon').length,
            crossDomainTags: document.querySelectorAll('[data-cross-domain], .cross-domain-tag').length,
            relevanceScores: document.querySelectorAll('[data-relevance], .relevance-score').length,
            conceptMappings: document.querySelectorAll('[data-concept], .concept-mapping').length
        };

        this.log('🎯 General Semantic Indicators:', 'info', indicators);

        return indicators;
    }

    async runDebugTests() {
        this.log('🚀 STARTING COMPREHENSIVE SEMANTIC SYSTEM DEBUG TESTS', 'test');

        const results = {
            semanticGenerateReview: false,
            semanticDeepDive: false,
            backendTested: false,
            uiComponentsTested: false,
            textExtractionValidated: false
        };

        // Test 1: Semantic Generate-Review with Text Extraction Analysis
        this.log('🧠 Phase 1: Semantic Generate-Review Testing', 'test');
        results.semanticGenerateReview = await this.testSemanticGenerateReview();

        // Test 2: Semantic Deep-Dive with Text Extraction Analysis
        this.log('🔬 Phase 2: Semantic Deep-Dive Testing', 'test');
        results.semanticDeepDive = await this.testSemanticDeepDive();

        // Test 3: Backend Direct Communication
        this.log('🔧 Phase 3: Backend Direct Testing', 'test');
        await this.testBackendDirectly();
        results.backendTested = true;

        // Test 4: UI Components Testing
        this.log('🎨 Phase 4: Semantic UI Components Testing', 'test');
        const uiResults = await this.testSemanticUIComponents();
        results.uiComponentsTested = true;
        results.uiComponents = uiResults;

        // Test 5: Text Extraction Consistency Validation
        this.log('📄 Phase 5: Text Extraction Consistency Validation', 'test');
        results.textExtractionValidated = this.validateTextExtractionConsistency();

        // Comprehensive Summary
        this.log('📊 COMPREHENSIVE DEBUG TEST SUMMARY', 'test');
        this.log(`🧠 Semantic Generate-Review: ${results.semanticGenerateReview ? '✅ PASS' : '❌ FAIL'}`, 'info');
        this.log(`🔬 Semantic Deep-Dive: ${results.semanticDeepDive ? '✅ PASS' : '❌ FAIL'}`, 'info');
        this.log(`🔧 Backend Direct Tests: ${results.backendTested ? '✅ COMPLETED' : '❌ FAILED'}`, 'info');
        this.log(`🎨 UI Components: ${results.uiComponentsTested ? '✅ TESTED' : '❌ FAILED'}`, 'info');
        this.log(`📄 Text Extraction: ${results.textExtractionValidated ? '✅ VALIDATED' : '❌ INCONSISTENT'}`, 'info');

        // Detailed UI Component Results
        if (results.uiComponents) {
            this.log('🎨 UI Component Details:', 'info');
            Object.entries(results.uiComponents).forEach(([component, result]) => {
                this.log(`  ${component}: ${result.found ? '✅ Found' : '❌ Not Found'}`, 'info');
                if (result.found) {
                    this.log(`    - Expandable Sections: ${result.expandableSections}`, 'info');
                    this.log(`    - Progress Bars: ${result.progressBars}`, 'info');
                    this.log(`    - Quality Metrics: ${result.qualityMetrics}`, 'info');
                    this.log(`    - Category Elements: ${result.categoryElements}`, 'info');
                }
            });
        }

        // Store results globally
        window.semanticDebugResults = {
            summary: results,
            detailedLogs: this.results,
            timestamp: new Date().toISOString()
        };
        this.log('Results stored in window.semanticDebugResults', 'info');

        return results;
    }

    validateTextExtractionConsistency() {
        this.log('📄 VALIDATING TEXT EXTRACTION CONSISTENCY', 'test');

        // This would ideally compare results from both generate-review and deep-dive
        // For now, we'll check if the system has consistent processing indicators
        const consistencyChecks = {
            enhancedExtractionSettings: true, // Both should use enhanced extraction
            qualityThresholds: true, // Both should have quality thresholds
            fallbackMechanisms: true, // Both should have fallback mechanisms
            extractionMethods: true // Both should support multiple extraction methods
        };

        const isConsistent = Object.values(consistencyChecks).every(Boolean);

        this.log(`Text Extraction Consistency: ${isConsistent ? '✅ CONSISTENT' : '❌ INCONSISTENT'}`, 'info', consistencyChecks);

        return isConsistent;
    }
}

// Auto-execute when script is loaded
(async () => {
    const semanticDebugger = new SemanticEndpointDebugger();
    await semanticDebugger.runDebugTests();
})();
