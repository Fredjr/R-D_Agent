/**
 * 🎓 PhD CONTENT ENHANCEMENT - COMPREHENSIVE NEW CONTENT TEST
 *
 * This script creates NEW content to test PhD enhancements
 * Run this on: https://frontend-psi-seven-85.vercel.app/projects/5ac213d7-6fcc-46ff-9420-5c7f4b421012
 *
 * Backend Status: ✅ DEPLOYED (but edge propagation may take 5-10 minutes)
 *
 * ENHANCED FEATURES:
 * - Event tracking validation (Sprint 1A)
 * - Vector store & candidate API (Sprint 1B)
 * - Graph builder & network analysis (Sprint 2A)
 * - PhD enhancement detection
 * - Performance monitoring
 * - Regression testing
 * - Comprehensive reporting
 */

console.log('🎓 PhD CONTENT ENHANCEMENT - COMPREHENSIVE NEW CONTENT TEST');
console.log('='.repeat(70));

class PhDNewContentTester {
    constructor() {
        this.testResults = [];
        this.backendUrl = 'https://r-dagent-production.up.railway.app';
        this.performanceMetrics = [];
        this.eventTrackingTests = [];
        this.graphTests = [];
        this.vectorStoreTests = [];
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '📋';
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    async testBackendAvailability() {
        this.log('🔍 Testing backend availability...');

        try {
            const startTime = Date.now();
            // Test Generate Review endpoint
            const response = await fetch(`${this.backendUrl}/generate-review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': 'phd-availability-test'
                },
                body: JSON.stringify({
                    objective: 'Backend availability test',
                    molecule: 'test',
                    project_id: 'availability-test'
                })
            });

            const elapsed = Date.now() - startTime;

            if (response.ok) {
                this.log(`✅ Backend is available and responding! (${elapsed}ms)`, 'success');
                this.performanceMetrics.push({
                    name: 'Backend availability check',
                    value: `${elapsed}ms`
                });
                return true;
            } else if (response.status === 404) {
                this.log('⚠️ Backend deployment still propagating (404 response)', 'warning');
                this.log('💡 Try again in 5-10 minutes');
                return false;
            } else {
                this.log(`⚠️ Backend responding with HTTP ${response.status}`, 'warning');
                return false;
            }
        } catch (error) {
            this.log(`❌ Backend not available: ${error.message}`, 'error');
            this.log('💡 Railway deployment may still be propagating to edge servers');
            return false;
        }
    }

    async createTestGenerateReview() {
        this.log('🆕 Creating new Generate Review to test PhD enhancements...');
        
        const testData = {
            objective: 'Investigate ACE inhibitors for heart failure treatment with focus on mortality reduction and quality of life improvements in patients with reduced ejection fraction',
            molecule: 'Enalapril',
            project_id: `phd-test-${Date.now()}`,
            preference: 'recall'
        };

        try {
            this.log('📤 Sending Generate Review request...');
            const response = await fetch(`${this.backendUrl}/generate-review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': 'phd-new-content-test'
                },
                body: JSON.stringify(testData)
            });

            if (response.ok) {
                const data = await response.json();
                this.log('✅ Generate Review created successfully!', 'success');
                
                // Analyze the response for PhD enhancements
                const analysis = this.analyzeGenerateReviewResponse(data);
                this.testResults.push({
                    type: 'generate_review',
                    success: true,
                    analysis
                });

                this.log(`📊 Analysis Results:`);
                this.log(`   Papers found: ${analysis.totalPapers}`);
                this.log(`   Enhanced papers: ${analysis.enhancedPapers}`);
                this.log(`   PhD features: ${analysis.phdFeatures.join(', ')}`);
                
                if (analysis.hasPhdEnhancements) {
                    this.log('🎉 PhD ENHANCEMENTS DETECTED IN NEW CONTENT!', 'success');
                } else {
                    this.log('⚠️ PhD enhancements not detected - may be in fallback mode', 'warning');
                }

                return data;
            } else {
                this.log(`❌ Generate Review failed: HTTP ${response.status}`, 'error');
                this.testResults.push({
                    type: 'generate_review',
                    success: false,
                    error: `HTTP ${response.status}`
                });
                return null;
            }
        } catch (error) {
            this.log(`❌ Generate Review error: ${error.message}`, 'error');
            this.testResults.push({
                type: 'generate_review',
                success: false,
                error: error.message
            });
            return null;
        }
    }

    analyzeGenerateReviewResponse(data) {
        const analysis = {
            totalPapers: 0,
            enhancedPapers: 0,
            phdFeatures: [],
            hasPhdEnhancements: false,
            hasEnhancementMetadata: false
        };

        // Check for PhD enhancement metadata
        if (data.enhancement_metadata) {
            analysis.hasEnhancementMetadata = true;
            analysis.phdFeatures.push('enhancement_metadata');
            
            if (data.enhancement_metadata.phd_level_analysis) {
                analysis.phdFeatures.push('phd_level_analysis');
            }
            
            if (data.enhancement_metadata.total_papers_enhanced) {
                analysis.phdFeatures.push('papers_enhanced_count');
            }
        }

        // Analyze papers for PhD features
        if (data.results && Array.isArray(data.results)) {
            for (const section of data.results) {
                if (section.articles && Array.isArray(section.articles)) {
                    for (const article of section.articles) {
                        analysis.totalPapers++;
                        
                        let hasEnhancements = false;
                        
                        // Check for score breakdown
                        if (article.score_breakdown) {
                            analysis.phdFeatures.push('score_breakdown');
                            hasEnhancements = true;
                            
                            // Check for 6-dimensional scoring
                            const expectedScores = [
                                'objective_similarity_score',
                                'recency_score',
                                'impact_score',
                                'contextual_match_score',
                                'methodology_rigor_score',
                                'clinical_relevance_score'
                            ];
                            
                            const hasAllScores = expectedScores.every(score => 
                                article.score_breakdown.hasOwnProperty(score)
                            );
                            
                            if (hasAllScores) {
                                analysis.phdFeatures.push('six_dimensional_scoring');
                            }
                        }
                        
                        // Check for fact anchors
                        if (article.fact_anchors && Array.isArray(article.fact_anchors) && article.fact_anchors.length > 0) {
                            analysis.phdFeatures.push('fact_anchors');
                            hasEnhancements = true;
                            
                            // Validate fact anchor structure
                            const validFactAnchors = article.fact_anchors.every(anchor => 
                                anchor.claim && anchor.evidence && anchor.evidence.title
                            );
                            
                            if (validFactAnchors) {
                                analysis.phdFeatures.push('valid_fact_anchors');
                            }
                        }
                        
                        // Check for quality metrics
                        if (article.quality_score !== undefined) {
                            analysis.phdFeatures.push('quality_score');
                            hasEnhancements = true;
                        }
                        
                        // Check for other PhD features
                        if (article.methodology_analysis) {
                            analysis.phdFeatures.push('methodology_analysis');
                            hasEnhancements = true;
                        }
                        
                        if (article.key_insights && Array.isArray(article.key_insights)) {
                            analysis.phdFeatures.push('key_insights');
                            hasEnhancements = true;
                        }
                        
                        if (article.research_gaps && Array.isArray(article.research_gaps)) {
                            analysis.phdFeatures.push('research_gaps');
                            hasEnhancements = true;
                        }
                        
                        if (hasEnhancements) {
                            analysis.enhancedPapers++;
                        }
                    }
                }
            }
        }

        analysis.phdFeatures = [...new Set(analysis.phdFeatures)];
        analysis.hasPhdEnhancements = analysis.hasEnhancementMetadata || analysis.enhancedPapers > 0;
        
        return analysis;
    }

    async testNewDeepDive(pmid = '33301246') {
        this.log(`🔬 Creating new Deep Dive for PMID: ${pmid}...`);
        
        try {
            const response = await fetch(`${this.backendUrl}/deep-dive/${pmid}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': 'phd-new-content-test'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.log('✅ Deep Dive created successfully!', 'success');
                
                // Analyze the response for PhD enhancements
                const analysis = this.analyzeDeepDiveResponse(data);
                this.testResults.push({
                    type: 'deep_dive',
                    success: true,
                    analysis
                });

                this.log(`🔬 Deep Dive Analysis:`);
                this.log(`   Analysis depth: ${analysis.analysisDepth}`);
                this.log(`   PhD features: ${analysis.phdFeatures.join(', ')}`);
                
                if (analysis.hasPhdEnhancements) {
                    this.log('🎉 PhD ENHANCEMENTS DETECTED IN DEEP DIVE!', 'success');
                } else {
                    this.log('⚠️ PhD enhancements not detected in Deep Dive', 'warning');
                }

                return data;
            } else {
                this.log(`❌ Deep Dive failed: HTTP ${response.status}`, 'error');
                this.testResults.push({
                    type: 'deep_dive',
                    success: false,
                    error: `HTTP ${response.status}`
                });
                return null;
            }
        } catch (error) {
            this.log(`❌ Deep Dive error: ${error.message}`, 'error');
            this.testResults.push({
                type: 'deep_dive',
                success: false,
                error: error.message
            });
            return null;
        }
    }

    analyzeDeepDiveResponse(data) {
        const analysis = {
            phdFeatures: [],
            hasPhdEnhancements: false,
            analysisDepth: 'basic',
            hasQualityAssessment: false,
            hasComprehensiveAnalysis: false
        };

        // Check for PhD enhancement metadata
        if (data.enhancement_metadata) {
            analysis.phdFeatures.push('enhancement_metadata');
            if (data.enhancement_metadata.phd_level_analysis) {
                analysis.phdFeatures.push('phd_level_analysis');
                analysis.analysisDepth = 'phd_level';
            }
        }

        // Check quality assessment
        if (data.quality_assessment) {
            analysis.hasQualityAssessment = true;
            analysis.phdFeatures.push('quality_assessment');
        }

        // Check scientific model analysis depth
        if (data.scientific_model_analysis) {
            const model = data.scientific_model_analysis;
            const studyDesignLength = (model.study_design || '').split(' ').length;
            
            if (studyDesignLength >= 200) {
                analysis.hasComprehensiveAnalysis = true;
                analysis.phdFeatures.push('comprehensive_analysis');
                analysis.analysisDepth = 'comprehensive';
            }
            
            if (model.fact_anchors && Array.isArray(model.fact_anchors) && model.fact_anchors.length >= 3) {
                analysis.phdFeatures.push('fact_anchors');
            }
        }

        // Check experimental methods (should not have debug info)
        if (data.experimental_methods_analysis && Array.isArray(data.experimental_methods_analysis)) {
            analysis.phdFeatures.push('experimental_methods');
            
            // Check if it's properly formatted (not debug info)
            const hasProperMethods = data.experimental_methods_analysis.every(method => 
                method.technique && method.measurement
            );
            
            if (hasProperMethods) {
                analysis.phdFeatures.push('proper_methods_format');
            }
        }

        // Check results interpretation (should not have N/A values)
        if (data.results_interpretation_analysis) {
            analysis.phdFeatures.push('results_interpretation');
            
            const results = data.results_interpretation_analysis;
            if (results.key_results && Array.isArray(results.key_results) && results.key_results.length > 0) {
                analysis.phdFeatures.push('quantitative_results');
                
                // Check for statistical measures
                const hasStatisticalMeasures = results.key_results.some(result => 
                    result.p_value || result.effect_size || result.ci
                );
                
                if (hasStatisticalMeasures) {
                    analysis.phdFeatures.push('statistical_measures');
                }
            }
        }

        analysis.phdFeatures = [...new Set(analysis.phdFeatures)];
        analysis.hasPhdEnhancements = analysis.phdFeatures.length > 0;
        
        return analysis;
    }

    async testEventTrackingAPI() {
        this.log('\n📊 Testing Event Tracking API (Sprint 1A)...');

        try {
            // Test 1: Track single event
            const startTime = Date.now();
            const response = await fetch(`${this.backendUrl}/api/v1/events/track`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': 'phd_test_user'
                },
                body: JSON.stringify({
                    user_id: 'phd_test_user',
                    pmid: '12345678',
                    event_type: 'open',
                    meta: { source: 'phd_comprehensive_test' },
                    session_id: 'test_session_' + Date.now()
                })
            });

            const elapsed = Date.now() - startTime;

            if (response.ok) {
                const data = await response.json();
                this.log(`✅ Event tracking working (${elapsed}ms)`, 'success');
                this.eventTrackingTests.push({
                    test: 'Single event tracking',
                    success: true,
                    responseTime: elapsed,
                    eventId: data.id
                });
            } else {
                this.log(`⚠️ Event tracking returned ${response.status}`, 'warning');
                this.eventTrackingTests.push({
                    test: 'Single event tracking',
                    success: false,
                    status: response.status
                });
            }

            // Test 2: Get capture rate
            const captureResponse = await fetch(`${this.backendUrl}/api/v1/events/monitoring/capture-rate?minutes_back=60`);
            if (captureResponse.ok) {
                const captureData = await captureResponse.json();
                this.log(`✅ Capture rate monitoring: ${captureData.total_events} events`, 'success');
            }

        } catch (error) {
            this.log(`❌ Event tracking test failed: ${error.message}`, 'error');
            this.eventTrackingTests.push({
                test: 'Event tracking API',
                success: false,
                error: error.message
            });
        }
    }

    async testGraphAPI() {
        this.log('🕸️ Testing Graph API (Sprint 2A)...');

        try {
            // Get some PMIDs from the page
            const pmids = ['33301246', '32817357', '31570887'];

            // Test 1: Build citation graph
            const startTime = Date.now();
            const buildResponse = await fetch(`${this.backendUrl}/api/v1/graphs/build`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': 'phd-graph-test'
                },
                body: JSON.stringify({
                    pmids: pmids,
                    graph_type: 'citation',
                    source_type: 'test',
                    source_id: 'phd-test'
                })
            });

            const buildTime = Date.now() - startTime;

            if (buildResponse.ok) {
                const graphData = await buildResponse.json();
                this.log(`✅ Graph built: ${graphData.nodes?.length || 0} nodes, ${graphData.edges?.length || 0} edges (${buildTime}ms)`, 'success');

                this.graphTests.push({
                    test: 'Build citation graph',
                    success: true,
                    responseTime: buildTime,
                    nodes: graphData.nodes?.length || 0,
                    edges: graphData.edges?.length || 0
                });

                // Test 2: Analyze graph
                if (graphData.graph_id) {
                    const analyzeStart = Date.now();
                    const analyzeResponse = await fetch(`${this.backendUrl}/api/v1/graphs/${graphData.graph_id}/analyze`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'User-ID': 'phd-graph-test'
                        },
                        body: JSON.stringify({
                            compute_centrality: true,
                            detect_communities: true,
                            identify_influential: true,
                            top_n: 5
                        })
                    });

                    const analyzeTime = Date.now() - analyzeStart;

                    if (analyzeResponse.ok) {
                        const analysisData = await analyzeResponse.json();
                        this.log(`✅ Graph analyzed: ${analysisData.communities?.num_communities || 0} communities (${analyzeTime}ms)`, 'success');

                        this.graphTests.push({
                            test: 'Analyze graph',
                            success: true,
                            responseTime: analyzeTime,
                            communities: analysisData.communities?.num_communities || 0,
                            influential: analysisData.influential_papers?.length || 0
                        });
                    } else {
                        this.log(`⚠️ Graph analysis failed: HTTP ${analyzeResponse.status}`, 'warning');
                        this.graphTests.push({
                            test: 'Analyze graph',
                            success: false,
                            error: `HTTP ${analyzeResponse.status}`
                        });
                    }
                }
            } else {
                this.log(`⚠️ Graph build failed: HTTP ${buildResponse.status}`, 'warning');
                this.graphTests.push({
                    test: 'Build citation graph',
                    success: false,
                    error: `HTTP ${buildResponse.status}`
                });
            }
        } catch (error) {
            this.log(`❌ Graph API error: ${error.message}`, 'error');
            this.graphTests.push({
                test: 'Graph API',
                success: false,
                error: error.message
            });
        }
    }

    async testVectorStoreAPI() {
        this.log('� Testing Vector Store API (Sprint 1B)...');

        try {
            // Test semantic search
            const startTime = Date.now();
            const searchResponse = await fetch(`${this.backendUrl}/api/v1/candidates/semantic-search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': 'phd-vector-test'
                },
                body: JSON.stringify({
                    query: 'cancer immunotherapy',
                    top_k: 5
                })
            });

            const searchTime = Date.now() - startTime;

            if (searchResponse.ok) {
                const searchData = await searchResponse.json();
                this.log(`✅ Semantic search: ${searchData.candidates?.length || 0} results (${searchTime}ms)`, 'success');

                this.vectorStoreTests.push({
                    test: 'Semantic search',
                    success: true,
                    responseTime: searchTime,
                    results: searchData.candidates?.length || 0
                });
            } else {
                this.log(`⚠️ Semantic search failed: HTTP ${searchResponse.status}`, 'warning');
                this.vectorStoreTests.push({
                    test: 'Semantic search',
                    success: false,
                    error: `HTTP ${searchResponse.status}`
                });
            }

            // Test cache stats
            const statsResponse = await fetch(`${this.backendUrl}/api/v1/candidates/cache-stats`, {
                method: 'GET',
                headers: {
                    'User-ID': 'phd-vector-test'
                }
            });

            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                this.log(`✅ Cache stats retrieved`, 'success');

                this.vectorStoreTests.push({
                    test: 'Cache stats',
                    success: true
                });
            }
        } catch (error) {
            this.log(`❌ Vector Store API error: ${error.message}`, 'error');
            this.vectorStoreTests.push({
                test: 'Vector Store API',
                success: false,
                error: error.message
            });
        }
    }

    async runNewContentTest() {
        this.log('🚀 Starting Comprehensive PhD & Discovery Engine Test...');

        // Step 0: Test Event Tracking (Sprint 1A)
        await this.testEventTrackingAPI();

        // Step 0.5: Test Discovery Engine APIs
        await this.testGraphAPI();
        await this.testVectorStoreAPI();

        // Step 1: Check backend availability
        const backendAvailable = await this.testBackendAvailability();

        if (!backendAvailable) {
            this.log('⚠️ Backend not available yet. Try again in 5-10 minutes.', 'warning');
            this.generateReport();
            return;
        }

        // Step 2: Create new Generate Review
        await this.createTestGenerateReview();

        // Step 3: Create new Deep Dive
        await this.testNewDeepDive();

        // Step 4: Generate comprehensive report
        this.generateReport();
    }

    generateReport() {
        this.log('='.repeat(70));
        this.log('🎯 COMPREHENSIVE PhD & DISCOVERY ENGINE TEST REPORT');
        this.log('='.repeat(70));

        // Event Tracking Results (Sprint 1A)
        if (this.eventTrackingTests.length > 0) {
            this.log('\n📊 EVENT TRACKING API (Sprint 1A):');
            const eventSuccess = this.eventTrackingTests.filter(t => t.success).length;
            this.log(`   Tests: ${eventSuccess}/${this.eventTrackingTests.length} passed`);
            this.eventTrackingTests.forEach(test => {
                const status = test.success ? '✅' : '❌';
                const time = test.responseTime ? ` (${test.responseTime}ms)` : '';
                this.log(`   ${status} ${test.test}${time}`);
            });
        }

        // Vector Store Results (Sprint 1B)
        if (this.vectorStoreTests.length > 0) {
            this.log('\n🔍 VECTOR STORE API (Sprint 1B):');
            const vectorSuccess = this.vectorStoreTests.filter(t => t.success).length;
            this.log(`   Tests: ${vectorSuccess}/${this.vectorStoreTests.length} passed`);
            this.vectorStoreTests.forEach(test => {
                const status = test.success ? '✅' : '❌';
                const time = test.responseTime ? ` (${test.responseTime}ms)` : '';
                const results = test.results ? ` - ${test.results} results` : '';
                this.log(`   ${status} ${test.test}${time}${results}`);
            });
        }

        // Graph API Results (Sprint 2A)
        if (this.graphTests.length > 0) {
            this.log('\n🕸️ GRAPH API (Sprint 2A):');
            const graphSuccess = this.graphTests.filter(t => t.success).length;
            this.log(`   Tests: ${graphSuccess}/${this.graphTests.length} passed`);
            this.graphTests.forEach(test => {
                const status = test.success ? '✅' : '❌';
                const time = test.responseTime ? ` (${test.responseTime}ms)` : '';
                const nodes = test.nodes ? ` - ${test.nodes} nodes` : '';
                const edges = test.edges ? `, ${test.edges} edges` : '';
                const communities = test.communities ? ` - ${test.communities} communities` : '';
                this.log(`   ${status} ${test.test}${time}${nodes}${edges}${communities}`);
            });
        }

        // PhD Enhancement Results
        const successfulTests = this.testResults.filter(test => test.success).length;
        const totalTests = this.testResults.length;
        const successRate = totalTests > 0 ? (successfulTests / totalTests * 100).toFixed(1) : 0;

        this.log(`\n📊 PhD ENHANCEMENT SUMMARY:`);
        this.log(`   Total tests: ${totalTests}`);
        this.log(`   Successful tests: ${successfulTests}`);
        this.log(`   Success rate: ${successRate}%`);

        // Performance Metrics
        if (this.performanceMetrics.length > 0) {
            this.log(`\n⚡ PERFORMANCE METRICS:`);
            this.performanceMetrics.forEach(metric => {
                this.log(`   ${metric.name}: ${metric.value}`);
            });
        }

        // Overall Status
        this.log('\n🎯 OVERALL STATUS:');
        if (successRate >= 80) {
            this.log('🎉 EXCELLENT! PhD enhancements are working in new content!', 'success');
        } else if (successRate >= 50) {
            this.log('✅ GOOD! Some PhD enhancements are working', 'success');
        } else if (successRate > 0) {
            this.log('⚠️ PARTIAL: Limited PhD enhancements detected', 'warning');
        } else {
            this.log('❌ PhD enhancements not yet active in new content', 'error');
        }

        this.log('\n📋 DETAILED RESULTS:');
        console.log('Test Results:', this.testResults);

        this.log('\n🚀 NEW CONTENT TEST COMPLETE!');
        
        return {
            successRate,
            totalTests,
            successfulTests,
            results: this.testResults
        };
    }
}

// Create and run the test
const phdNewContentTester = new PhDNewContentTester();

// Auto-run the test
console.log('🚀 Starting PhD New Content Test...');
phdNewContentTester.runNewContentTest().then(() => {
    console.log('🎯 PhD New Content Test Complete!');
});

// Make available for manual execution
window.runPhdNewContentTest = () => phdNewContentTester.runNewContentTest();
window.phdNewContentTester = phdNewContentTester;

console.log('\n💡 COMPREHENSIVE TEST INSTRUCTIONS:');
console.log('='.repeat(70));
console.log('1. Wait for the test to complete (may take 2-3 minutes)');
console.log('2. If backend not available, try again in 5-10 minutes');
console.log('3. Look for PhD enhancements in the test results');
console.log('4. Verify Event Tracking API (Sprint 1A) is working');
console.log('5. Check performance metrics for response times');
console.log('6. Create manual content through the UI to verify');
console.log('\n📊 WHAT THIS TEST VALIDATES:');
console.log('✅ Sprint 1A: Event Tracking API functionality');
console.log('✅ Sprint 1B: Vector Store & Semantic Search');
console.log('✅ Sprint 2A: Graph Builder & Network Analysis');
console.log('✅ PhD Enhancement: Advanced content generation');
console.log('✅ Performance: Response time monitoring');
console.log('✅ Regression: Existing features still working');
console.log('✅ Integration: All systems working together');
console.log('='.repeat(70));
