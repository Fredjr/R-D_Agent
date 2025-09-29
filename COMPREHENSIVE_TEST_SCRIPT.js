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

    // TEST 3: Semantic Integration - Generate Review
    async testSemanticGenerateReview() {
        this.log('📝 TESTING SEMANTIC GENERATE-REVIEW INTEGRATION', 'test');
        
        const testPayload = {
            molecule: 'CRISPR gene editing in diabetes treatment',
            semantic_expansion: true,
            domain_focus: ['genetics', 'biotechnology', 'diabetes'],
            cross_domain_exploration: true,
            user_context: {
                research_domains: ['genetics', 'medicine'],
                recent_searches: ['CRISPR', 'diabetes', 'gene therapy']
            },
            fullTextOnly: false
        };

        const { data, error } = await this.makeRequest(
            '/api/proxy/generate-review-semantic',
            {
                method: 'POST',
                body: JSON.stringify(testPayload)
            }
        );

        if (error) {
            this.log('❌ Semantic Generate-Review failed', 'error', error);
            return;
        }

        // Check for semantic enhancement fields
        const expectedSemanticFields = [
            'semantic_analysis',
            'cross_domain_insights',
            'user_relevance',
            'related_concepts'
        ];

        const hasSemanticFields = expectedSemanticFields.some(field => 
            data && (field in data || (data.analysis && field in data.analysis))
        );

        if (hasSemanticFields) {
            this.log('✅ Semantic Generate-Review has enhanced fields', 'success');
        } else {
            this.log('⚠️ Semantic Generate-Review may be missing enhanced fields', 'warning', data);
        }

        this.log('Generate-Review response structure:', 'info', {
            hasAnalysis: !!data?.analysis,
            hasPapers: !!data?.papers,
            paperCount: data?.papers?.length || 0,
            analysisKeys: data?.analysis ? Object.keys(data.analysis) : []
        });
    }

    // TEST 4: Semantic Integration - Deep Dive
    async testSemanticDeepDive() {
        this.log('🔬 TESTING SEMANTIC DEEP-DIVE INTEGRATION', 'test');
        
        // First get a paper PMID from recommendations
        const { data: weeklyData } = await this.makeRequest(
            `/api/proxy/recommendations/weekly/${encodeURIComponent(this.realUserId)}`
        );

        let testPmid = '32887946'; // fallback PMID
        if (weeklyData?.recommendations?.papers_for_you?.[0]?.pmid) {
            testPmid = weeklyData.recommendations.papers_for_you[0].pmid;
        }

        const testPayload = {
            pmid: testPmid,
            semantic_context: true,
            find_related_papers: true,
            cross_domain_analysis: true,
            user_context: {
                research_domains: ['genetics', 'medicine'],
                current_projects: ['diabetes research', 'gene therapy']
            }
        };

        const { data, error } = await this.makeRequest(
            '/api/proxy/deep-dive-semantic',
            {
                method: 'POST',
                body: JSON.stringify(testPayload)
            }
        );

        if (error) {
            this.log('❌ Semantic Deep-Dive failed', 'error', error);
            return;
        }

        // Check for semantic enhancement fields
        const expectedSemanticFields = [
            'user_relevance_score',
            'related_papers',
            'cross_domain_applications',
            'research_recommendations'
        ];

        const hasSemanticFields = expectedSemanticFields.some(field => 
            data && (field in data || (data.analysis && field in data.analysis))
        );

        if (hasSemanticFields) {
            this.log('✅ Semantic Deep-Dive has enhanced fields', 'success');
        } else {
            this.log('⚠️ Semantic Deep-Dive may be missing enhanced fields', 'warning', data);
        }

        this.log('Deep-Dive response structure:', 'info', {
            pmid: testPmid,
            hasAnalysis: !!data?.analysis,
            hasRelatedPapers: !!data?.related_papers,
            relatedPaperCount: data?.related_papers?.length || 0,
            analysisKeys: data?.analysis ? Object.keys(data.analysis) : []
        });
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
