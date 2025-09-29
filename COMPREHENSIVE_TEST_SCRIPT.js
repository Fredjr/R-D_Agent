/**
 * COMPREHENSIVE TEST SCRIPT FOR SEMANTIC RECOMMENDATION SYSTEM
 * 
 * This script tests all the functionalities developed:
 * 1. 3-Section Discover Page APIs
 * 2. AI Systems Architecture (5 distinct systems)
 * 3. Semantic Integration with Generate-Review/Deep-Dive
 * 4. Global Deduplication System
 * 5. Search History Integration
 * 
 * Usage: Copy and paste this entire script into your browser console
 * Make sure you're on your frontend domain (frontend-psi-seven-85.vercel.app)
 */

class ComprehensiveTestSuite {
    constructor() {
        this.baseUrl = 'https://frontend-psi-seven-85.vercel.app';
        this.backendUrl = 'https://r-dagent-production.up.railway.app';
        this.testUserId = 'test@example.com';
        this.realUserId = 'fredericle77@gmail.com';
        this.results = [];
        this.startTime = Date.now();
    }

    log(message, type = 'info', data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            type,
            message,
            data,
            elapsed: Date.now() - this.startTime
        };
        
        console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
        if (data) {
            console.log('Data:', data);
        }
        
        this.results.push(logEntry);
    }

    async makeRequest(url, options = {}) {
        const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
        this.log(`Making request to: ${fullUrl}`, 'request');
        
        try {
            const response = await fetch(fullUrl, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.realUserId,
                    ...options.headers
                }
            });
            
            const responseData = await response.json();
            
            this.log(`Response status: ${response.status}`, response.ok ? 'success' : 'error', {
                status: response.status,
                statusText: response.statusText,
                data: responseData
            });
            
            return { response, data: responseData };
        } catch (error) {
            this.log(`Request failed: ${error.message}`, 'error', error);
            return { error };
        }
    }

    // TEST 1: 3-Section Discover Page APIs
    async testDiscoverPageAPIs() {
        this.log('🎯 TESTING 3-SECTION DISCOVER PAGE APIs', 'test');
        
        const sections = [
            {
                name: 'Trending Now',
                url: `/api/proxy/recommendations/trending/${encodeURIComponent(this.realUserId)}`,
                expectedFields: ['pmid', 'title', 'trending_score', 'category']
            },
            {
                name: 'For You (Papers for You)',
                url: `/api/proxy/recommendations/papers-for-you/${encodeURIComponent(this.realUserId)}?limit=12`,
                expectedFields: ['pmid', 'title', 'relevance_score', 'category']
            },
            {
                name: 'Cross-Domain Discoveries',
                url: `/api/proxy/recommendations/cross-pollination/${encodeURIComponent(this.realUserId)}`,
                expectedFields: ['pmid', 'title', 'cross_pollination_score', 'category']
            }
        ];

        for (const section of sections) {
            this.log(`Testing ${section.name} API`, 'test');
            const { data, error } = await this.makeRequest(section.url);
            
            if (error) {
                this.log(`❌ ${section.name} API failed`, 'error', error);
                continue;
            }

            // Validate response structure
            if (data && data.papers && Array.isArray(data.papers)) {
                this.log(`✅ ${section.name} API returned ${data.papers.length} papers`, 'success');
                
                // Check for expected fields in first paper
                if (data.papers.length > 0) {
                    const firstPaper = data.papers[0];
                    const missingFields = section.expectedFields.filter(field => !(field in firstPaper));
                    
                    if (missingFields.length === 0) {
                        this.log(`✅ ${section.name} has all expected fields`, 'success');
                    } else {
                        this.log(`⚠️ ${section.name} missing fields: ${missingFields.join(', ')}`, 'warning');
                    }
                    
                    // Log sample paper for inspection
                    this.log(`Sample paper from ${section.name}:`, 'info', {
                        pmid: firstPaper.pmid,
                        title: firstPaper.title?.substring(0, 100) + '...',
                        category: firstPaper.category,
                        scores: {
                            relevance: firstPaper.relevance_score,
                            trending: firstPaper.trending_score,
                            cross_pollination: firstPaper.cross_pollination_score
                        }
                    });
                }
            } else {
                this.log(`❌ ${section.name} API returned invalid structure`, 'error', data);
            }
        }
    }

    // TEST 2: Weekly Recommendations (Global Deduplication)
    async testGlobalDeduplication() {
        this.log('🔄 TESTING GLOBAL DEDUPLICATION SYSTEM', 'test');
        
        const { data, error } = await this.makeRequest(
            `/api/proxy/recommendations/weekly/${encodeURIComponent(this.realUserId)}`
        );
        
        if (error) {
            this.log('❌ Weekly recommendations API failed', 'error', error);
            return;
        }

        if (!data || !data.recommendations) {
            this.log('❌ Invalid weekly recommendations structure', 'error', data);
            return;
        }

        const { recommendations } = data;
        const allPmids = [];
        const sectionCounts = {};

        // Collect all PMIDs and count papers per section
        ['papers_for_you', 'trending_in_field', 'cross_pollination', 'citation_opportunities'].forEach(section => {
            if (recommendations[section] && Array.isArray(recommendations[section])) {
                const sectionPmids = recommendations[section].map(paper => paper.pmid);
                allPmids.push(...sectionPmids);
                sectionCounts[section] = sectionPmids.length;
                
                this.log(`${section}: ${sectionPmids.length} papers`, 'info', sectionPmids);
            }
        });

        // Check for duplicates
        const uniquePmids = [...new Set(allPmids)];
        const duplicateCount = allPmids.length - uniquePmids.length;
        
        if (duplicateCount === 0) {
            this.log('✅ GLOBAL DEDUPLICATION WORKING: No duplicate PMIDs found', 'success', {
                totalPapers: allPmids.length,
                uniquePapers: uniquePmids.length,
                sectionCounts
            });
        } else {
            this.log(`❌ GLOBAL DEDUPLICATION FAILED: ${duplicateCount} duplicates found`, 'error', {
                totalPapers: allPmids.length,
                uniquePapers: uniquePmids.length,
                duplicates: duplicateCount,
                sectionCounts
            });
        }
    }

    // TEST 3: Comprehensive Semantic Generate-Review Testing
    async testSemanticGenerateReview() {
        this.log('📝 TESTING SEMANTIC GENERATE-REVIEW INTEGRATION', 'test');

        // Test multiple scenarios for comprehensive coverage
        const testScenarios = [
            {
                name: 'Basic Semantic Enhancement',
                payload: {
                    molecule: 'CRISPR gene editing in diabetes treatment',
                    objective: 'Comprehensive review of CRISPR applications in diabetes therapy',
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
                }
            },
            {
                name: 'Full-Text Only Mode',
                payload: {
                    molecule: 'COVID-19 vaccine effectiveness',
                    objective: 'Analyze vaccine effectiveness data',
                    semantic_expansion: true,
                    domain_focus: ['immunology', 'epidemiology'],
                    cross_domain_exploration: false,
                    fullTextOnly: true,
                    similarity_threshold: 0.4,
                    max_semantic_results: 20
                }
            },
            {
                name: 'Cross-Domain Exploration',
                payload: {
                    molecule: 'Machine learning in drug discovery',
                    objective: 'Explore AI applications in pharmaceutical research',
                    semantic_expansion: true,
                    domain_focus: ['machine_learning', 'pharmacology'],
                    cross_domain_exploration: true,
                    fullTextOnly: false,
                    similarity_threshold: 0.25,
                    max_semantic_results: 40
                }
            }
        ];

        for (const scenario of testScenarios) {
            this.log(`Testing ${scenario.name}`, 'test');

            const startTime = Date.now();
            const { data, error } = await this.makeRequest(
                '/api/proxy/generate-review-semantic',
                {
                    method: 'POST',
                    body: JSON.stringify(scenario.payload)
                }
            );
            const responseTime = Date.now() - startTime;

            if (error) {
                this.log(`❌ ${scenario.name} failed`, 'error', {
                    error: error,
                    payload: scenario.payload,
                    responseTime: responseTime
                });
                continue;
            }

            // Detailed response analysis
            this.analyzeSemanticGenerateReviewResponse(data, scenario.name, responseTime);
        }

        // Test UI Component Integration
        await this.testSemanticGenerateReviewUI();
    }

    analyzeSemanticGenerateReviewResponse(data, scenarioName, responseTime) {
        this.log(`📊 Analyzing ${scenarioName} Response`, 'info');

        // Check response structure
        const structure = {
            hasResults: !!data?.results,
            hasQueries: !!data?.queries,
            hasAnalysis: !!data?.analysis,
            hasPapers: !!data?.papers,
            hasMetadata: !!data?.metadata,
            hasSemanticEnhancements: false,
            hasTextExtraction: false,
            hasQualityMetrics: false
        };

        // Check for semantic enhancement fields
        const semanticFields = [
            'semantic_analysis',
            'cross_domain_insights',
            'user_relevance',
            'related_concepts',
            'personalized_insights',
            'domain_connections',
            'semantic_keywords',
            'concept_mapping'
        ];

        structure.hasSemanticEnhancements = semanticFields.some(field =>
            data && (field in data ||
                    (data.analysis && field in data.analysis) ||
                    (data.metadata && field in data.metadata))
        );

        // Check text extraction quality
        if (data?.results && Array.isArray(data.results)) {
            const textExtractionMetrics = {
                totalPapers: data.results.length,
                papersWithFullText: 0,
                papersWithAbstractOnly: 0,
                averageContentLength: 0,
                extractionMethods: new Set(),
                qualityScores: []
            };

            data.results.forEach(paper => {
                if (paper.full_text && paper.full_text.length > 1000) {
                    textExtractionMetrics.papersWithFullText++;
                }
                if (paper.abstract && !paper.full_text) {
                    textExtractionMetrics.papersWithAbstractOnly++;
                }
                if (paper.content_length) {
                    textExtractionMetrics.averageContentLength += paper.content_length;
                }
                if (paper.extraction_method) {
                    textExtractionMetrics.extractionMethods.add(paper.extraction_method);
                }
                if (paper.quality_score) {
                    textExtractionMetrics.qualityScores.push(paper.quality_score);
                }
            });

            textExtractionMetrics.averageContentLength /= textExtractionMetrics.totalPapers;
            structure.hasTextExtraction = textExtractionMetrics.papersWithFullText > 0;

            this.log(`📄 Text Extraction Analysis for ${scenarioName}:`, 'info', {
                ...textExtractionMetrics,
                extractionMethods: Array.from(textExtractionMetrics.extractionMethods),
                averageQualityScore: textExtractionMetrics.qualityScores.length > 0
                    ? textExtractionMetrics.qualityScores.reduce((a, b) => a + b, 0) / textExtractionMetrics.qualityScores.length
                    : 0
            });
        }

        // Check quality metrics
        structure.hasQualityMetrics = !!(data?.quality_metrics || data?.content_quality || data?.extraction_quality);

        // Performance analysis
        const performance = {
            responseTime: responseTime,
            isAcceptable: responseTime < 30000, // 30 seconds
            paperCount: data?.results?.length || 0,
            queryCount: data?.queries?.length || 0
        };

        this.log(`⚡ Performance Metrics for ${scenarioName}:`, 'info', performance);
        this.log(`🏗️ Response Structure for ${scenarioName}:`, 'info', structure);

        // Success/failure determination
        if (structure.hasResults && structure.hasSemanticEnhancements && performance.isAcceptable) {
            this.log(`✅ ${scenarioName} - Comprehensive Success`, 'success');
        } else if (structure.hasResults) {
            this.log(`⚠️ ${scenarioName} - Partial Success (missing enhancements)`, 'warning');
        } else {
            this.log(`❌ ${scenarioName} - Failed`, 'error');
        }
    }

    async testSemanticGenerateReviewUI() {
        this.log('🎨 TESTING SEMANTIC GENERATE-REVIEW UI COMPONENTS', 'test');

        // Check if SemanticEnhancedResultsCard component exists and is functional
        const uiTests = [
            {
                component: 'SemanticEnhancedResultsCard',
                selector: '[data-testid="semantic-enhanced-results-card"]',
                expectedFeatures: [
                    'content-quality-metrics',
                    'expandable-semantic-analysis',
                    'personalized-insights',
                    'cross-domain-connections'
                ]
            }
        ];

        for (const test of uiTests) {
            const element = document.querySelector(test.selector);
            if (element) {
                this.log(`✅ ${test.component} component found in DOM`, 'success');

                // Test expandable sections
                const expandableElements = element.querySelectorAll('[data-expandable]');
                this.log(`📋 Found ${expandableElements.length} expandable sections`, 'info');

                // Test quality metrics visualization
                const qualityMetrics = element.querySelectorAll('[data-quality-metric]');
                this.log(`📊 Found ${qualityMetrics.length} quality metric visualizations`, 'info');

            } else {
                this.log(`⚠️ ${test.component} component not found in current DOM`, 'warning');
                this.log(`💡 Component may load dynamically when generate-review is executed`, 'info');
            }
        }
    }

    // TEST 4: Comprehensive Semantic Deep-Dive Testing
    async testSemanticDeepDive() {
        this.log('🔬 TESTING SEMANTIC DEEP-DIVE INTEGRATION', 'test');

        // Get papers from weekly recommendations for testing
        const { data: weeklyData } = await this.makeRequest(
            `/api/proxy/recommendations/weekly/${encodeURIComponent(this.realUserId)}`
        );

        const availablePapers = [
            ...(weeklyData?.recommendations?.papers_for_you || []),
            ...(weeklyData?.recommendations?.trending_in_field || []),
            ...(weeklyData?.recommendations?.cross_pollination || [])
        ];

        if (availablePapers.length === 0) {
            this.log('⚠️ No test papers available for deep-dive', 'warning');
            return;
        }

        // Test multiple deep-dive scenarios
        const testScenarios = [
            {
                name: 'Full Semantic Analysis',
                paper: availablePapers[0],
                payload: {
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
                }
            },
            {
                name: 'Cross-Domain Focus',
                paper: availablePapers[Math.min(1, availablePapers.length - 1)],
                payload: {
                    semantic_context: true,
                    find_related_papers: true,
                    cross_domain_analysis: true,
                    user_research_domains: ['machine_learning', 'bioinformatics'],
                    similarity_threshold: 0.25,
                    max_related_papers: 15
                }
            }
        ];

        for (const scenario of testScenarios) {
            await this.executeSemanticDeepDiveScenario(scenario);
        }

        // Test UI Component Integration
        await this.testSemanticDeepDiveUI();
    }

    async executeSemanticDeepDiveScenario(scenario) {
        this.log(`🔬 Testing ${scenario.name}`, 'test');

        const testPayload = {
            pmid: scenario.paper.pmid,
            title: scenario.paper.title,
            objective: `Comprehensive analysis of "${scenario.paper.title}" with focus on ${scenario.name.toLowerCase()}`,
            ...scenario.payload
        };

        const startTime = Date.now();
        const { data, error } = await this.makeRequest(
            '/api/proxy/deep-dive-semantic',
            {
                method: 'POST',
                body: JSON.stringify(testPayload)
            }
        );
        const responseTime = Date.now() - startTime;

        if (error) {
            this.log(`❌ ${scenario.name} failed`, 'error', {
                error: error,
                pmid: scenario.paper.pmid,
                title: scenario.paper.title,
                payload: testPayload,
                responseTime: responseTime
            });
            return;
        }

        // Detailed response analysis
        this.analyzeSemanticDeepDiveResponse(data, scenario.name, responseTime, scenario.paper);
    }

    analyzeSemanticDeepDiveResponse(data, scenarioName, responseTime, testPaper) {
        this.log(`📊 Analyzing ${scenarioName} Deep-Dive Response`, 'info');

        // Check response structure
        const structure = {
            hasAnalysis: !!data?.analysis,
            hasSections: !!data?.sections,
            hasRelatedPapers: !!data?.related_papers,
            hasSemanticContext: !!data?.semantic_context,
            hasUserRelevance: !!data?.user_relevance_score,
            hasCrossDomainConnections: !!data?.cross_domain_connections,
            hasConceptMapping: !!data?.concept_mapping,
            hasTextExtraction: false,
            hasQualityMetrics: false
        };

        // Check for semantic enhancement fields
        const semanticFields = [
            'semantic_context',
            'related_papers',
            'cross_domain_connections',
            'user_relevance_score',
            'concept_mapping',
            'research_domain',
            'methodology_analysis',
            'personal_research_connections'
        ];

        const foundSemanticFields = semanticFields.filter(field =>
            data && (field in data ||
                    (data.analysis && field in data.analysis) ||
                    (data.semantic_enhancements && field in data.semantic_enhancements))
        );

        structure.hasSemanticEnhancements = foundSemanticFields.length > 0;

        // Performance and quality metrics
        const performance = {
            responseTime: responseTime,
            isAcceptable: responseTime < 45000, // 45 seconds for deep-dive
            pmid: testPaper.pmid,
            title: testPaper.title.substring(0, 50) + '...',
            foundSemanticFields: foundSemanticFields
        };

        this.log(`⚡ Performance Metrics for ${scenarioName}:`, 'info', performance);
        this.log(`🏗️ Response Structure for ${scenarioName}:`, 'info', structure);

        // Success/failure determination
        if (structure.hasAnalysis && structure.hasSemanticEnhancements && performance.isAcceptable) {
            this.log(`✅ ${scenarioName} - Comprehensive Success`, 'success');
        } else if (structure.hasAnalysis) {
            this.log(`⚠️ ${scenarioName} - Partial Success (missing enhancements)`, 'warning');
        } else {
            this.log(`❌ ${scenarioName} - Failed`, 'error');
        }
    }

    async testSemanticDeepDiveUI() {
        this.log('🎨 TESTING SEMANTIC DEEP-DIVE UI COMPONENTS', 'test');

        // Check if SemanticDeepDiveCard component exists and is functional
        const uiTests = [
            {
                component: 'SemanticDeepDiveCard',
                selector: '[data-testid="semantic-deep-dive-card"]',
                expectedFeatures: [
                    'user-relevance-scoring',
                    'related-papers-categorization',
                    'ai-powered-recommendations',
                    'personal-research-connections',
                    'interactive-expandable-sections'
                ]
            }
        ];

        for (const test of uiTests) {
            const element = document.querySelector(test.selector);
            if (element) {
                this.log(`✅ ${test.component} component found in DOM`, 'success');

                // Test progress bars for relevance scoring
                const progressBars = element.querySelectorAll('[data-progress-bar]');
                this.log(`📊 Found ${progressBars.length} progress bar visualizations`, 'info');

                // Test expandable sections
                const expandableElements = element.querySelectorAll('[data-expandable]');
                this.log(`📋 Found ${expandableElements.length} expandable sections`, 'info');

                // Test categorization elements
                const categoryElements = element.querySelectorAll('[data-category]');
                this.log(`🏷️ Found ${categoryElements.length} categorization elements`, 'info');

            } else {
                this.log(`⚠️ ${test.component} component not found in current DOM`, 'warning');
                this.log(`💡 Component may load dynamically when deep-dive is executed`, 'info');
            }
        }
    }

    // TEST 5: Search History Integration
    async testSearchHistoryIntegration() {
        this.log('🔍 TESTING SEARCH HISTORY INTEGRATION', 'test');
        
        // Test if recommendations change based on user context
        const contexts = [
            {
                name: 'Medical Research Context',
                domains: ['medicine', 'clinical_research'],
                searches: ['diabetes treatment', 'clinical trials']
            },
            {
                name: 'AI Research Context', 
                domains: ['machine_learning', 'artificial_intelligence'],
                searches: ['neural networks', 'deep learning']
            }
        ];

        for (const context of contexts) {
            this.log(`Testing with ${context.name}`, 'test');
            
            const { data, error } = await this.makeRequest(
                `/api/proxy/recommendations/papers-for-you/${encodeURIComponent(this.realUserId)}?limit=5`,
                {
                    headers: {
                        'User-Context': JSON.stringify({
                            research_domains: context.domains,
                            recent_searches: context.searches
                        })
                    }
                }
            );

            if (error) {
                this.log(`❌ ${context.name} test failed`, 'error', error);
                continue;
            }

            if (data?.papers?.length > 0) {
                this.log(`✅ ${context.name} returned ${data.papers.length} papers`, 'success');
                
                // Log paper titles to see if they match the context
                const titles = data.papers.slice(0, 2).map(p => p.title?.substring(0, 80) + '...');
                this.log(`Sample titles for ${context.name}:`, 'info', titles);
            }
        }
    }

    // TEST 6: Cross-System Integration
    async testCrossSystemIntegration() {
        this.log('🌐 TESTING CROSS-SYSTEM INTEGRATION', 'test');
        
        // Test that different systems return different but complementary results
        const systems = [
            {
                name: 'Recommendation Engine',
                url: `/api/proxy/recommendations/papers-for-you/${encodeURIComponent(this.realUserId)}?limit=3`
            },
            {
                name: 'Cross-Domain Discovery',
                url: `/api/proxy/recommendations/cross-pollination/${encodeURIComponent(this.realUserId)}`
            },
            {
                name: 'Trending Discovery',
                url: `/api/proxy/recommendations/trending/${encodeURIComponent(this.realUserId)}`
            }
        ];

        const systemResults = {};

        for (const system of systems) {
            const { data, error } = await this.makeRequest(system.url);
            
            if (error) {
                this.log(`❌ ${system.name} failed`, 'error', error);
                continue;
            }

            if (data?.papers?.length > 0) {
                systemResults[system.name] = data.papers.map(p => ({
                    pmid: p.pmid,
                    title: p.title?.substring(0, 50) + '...',
                    category: p.category
                }));
                
                this.log(`✅ ${system.name} returned ${data.papers.length} papers`, 'success');
            }
        }

        // Check for system diversity (different papers from different systems)
        const allSystemPmids = Object.values(systemResults).flat().map(p => p.pmid);
        const uniqueSystemPmids = [...new Set(allSystemPmids)];
        
        const diversityRatio = uniqueSystemPmids.length / allSystemPmids.length;
        
        if (diversityRatio > 0.7) {
            this.log(`✅ Good cross-system diversity: ${(diversityRatio * 100).toFixed(1)}%`, 'success');
        } else {
            this.log(`⚠️ Low cross-system diversity: ${(diversityRatio * 100).toFixed(1)}%`, 'warning');
        }

        this.log('Cross-system results summary:', 'info', systemResults);
    }

    // Main test runner
    async runAllTests() {
        this.log('🚀 STARTING COMPREHENSIVE TEST SUITE', 'test');
        this.log(`Testing with user: ${this.realUserId}`, 'info');
        
        try {
            await this.testDiscoverPageAPIs();
            await this.testGlobalDeduplication();
            await this.testSemanticGenerateReview();
            await this.testSemanticDeepDive();
            await this.testSearchHistoryIntegration();
            await this.testCrossSystemIntegration();
            
            this.generateSummaryReport();
            
        } catch (error) {
            this.log('❌ Test suite failed with error', 'error', error);
        }
    }

    generateSummaryReport() {
        const totalTime = Date.now() - this.startTime;
        const successCount = this.results.filter(r => r.type === 'success').length;
        const errorCount = this.results.filter(r => r.type === 'error').length;
        const warningCount = this.results.filter(r => r.type === 'warning').length;
        
        this.log('📊 TEST SUITE SUMMARY REPORT', 'test');
        this.log(`Total execution time: ${totalTime}ms`, 'info');
        this.log(`✅ Successes: ${successCount}`, 'success');
        this.log(`⚠️ Warnings: ${warningCount}`, 'warning');
        this.log(`❌ Errors: ${errorCount}`, 'error');
        
        // Export results for detailed analysis
        console.log('\n🔍 DETAILED RESULTS (copy this for analysis):');
        console.log(JSON.stringify(this.results, null, 2));
        
        // Store in window for easy access
        window.testResults = this.results;
        this.log('Results stored in window.testResults for further analysis', 'info');
    }
}

// Auto-execute the test suite
console.log('🎯 COMPREHENSIVE SEMANTIC RECOMMENDATION SYSTEM TEST SUITE');
console.log('=========================================================');

const testSuite = new ComprehensiveTestSuite();
testSuite.runAllTests();
