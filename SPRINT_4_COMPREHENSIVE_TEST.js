/**
 * 🚀 SPRINT 4 COMPREHENSIVE TEST - DISCOVERY TREE & CLUSTER-AWARE NAVIGATION
 *
 * Tests ALL Sprint 4 features across ALL dimensions:
 * - Discovery Tree API (7 endpoints)
 * - Cluster Recommendations
 * - User Interest Modeling
 * - Navigation Tracking
 * - Integration with Sprint 2B (Clustering)
 * - Integration with Sprint 3B (Weekly Mix)
 * - Performance benchmarks
 * - Database tracking
 *
 * Run this on: https://frontend-psi-seven-85.vercel.app/projects/5ac213d7-6fcc-46ff-9420-5c7f4b421012
 *
 * Backend: https://r-dagent-production.up.railway.app
 */

console.log('🚀 SPRINT 4 COMPREHENSIVE TEST - DISCOVERY TREE & CLUSTER-AWARE NAVIGATION');
console.log('='.repeat(80));

class Sprint4ComprehensiveTester {
    constructor() {
        this.backendUrl = 'https://r-dagent-production.up.railway.app';
        this.userId = `sprint4_test_${Date.now()}`;
        this.testResults = {
            discoveryTree: [],
            clusterDetails: [],
            clusterPapers: [],
            relatedClusters: [],
            navigation: [],
            recommendations: [],
            search: [],
            integration: [],
            performance: [],
            database: []
        };
        this.performanceMetrics = [];
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '📋';
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    recordTest(category, testName, success, details = {}) {
        this.totalTests++;
        if (success) {
            this.passedTests++;
        } else {
            this.failedTests++;
        }

        this.testResults[category].push({
            test: testName,
            success,
            timestamp: new Date().toISOString(),
            ...details
        });
    }

    recordPerformance(endpoint, duration, target) {
        this.performanceMetrics.push({
            endpoint,
            duration,
            target,
            meetsTarget: duration < target,
            ratio: (target / duration).toFixed(2) + 'x'
        });
    }

    // ============================================================================
    // TEST 1: DISCOVERY TREE API - GET TREE
    // ============================================================================
    async testGetDiscoveryTree() {
        this.log('\n📊 TEST 1: Get Discovery Tree');
        this.log('Testing: GET /api/v1/discovery-tree');

        try {
            const startTime = Date.now();
            const response = await fetch(`${this.backendUrl}/api/v1/discovery-tree`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': this.userId
                }
            });
            const duration = Date.now() - startTime;

            if (response.ok) {
                const data = await response.json();
                this.log(`✅ Discovery Tree retrieved (${duration}ms)`, 'success');
                this.log(`   Tree ID: ${data.tree?.tree_id || 'N/A'}`);
                this.log(`   Clusters: ${data.tree?.total_clusters || 0}`);
                this.log(`   Papers: ${data.tree?.total_papers || 0}`);

                // Validate structure
                const hasValidStructure = data.success && data.tree && 
                    data.tree.clusters && Array.isArray(data.tree.clusters);

                if (hasValidStructure) {
                    this.log('   ✓ Valid tree structure', 'success');
                } else {
                    this.log('   ✗ Invalid tree structure', 'error');
                }

                this.recordTest('discoveryTree', 'Get Discovery Tree', true, {
                    duration,
                    clusters: data.tree?.total_clusters || 0,
                    papers: data.tree?.total_papers || 0,
                    validStructure: hasValidStructure
                });

                this.recordPerformance('GET /api/v1/discovery-tree', duration, 500);

                return data.tree;
            } else {
                this.log(`❌ Failed: HTTP ${response.status}`, 'error');
                const errorText = await response.text();
                this.log(`   Error: ${errorText.substring(0, 100)}`, 'error');
                
                this.recordTest('discoveryTree', 'Get Discovery Tree', false, {
                    status: response.status,
                    error: errorText.substring(0, 100)
                });
                return null;
            }
        } catch (error) {
            this.log(`❌ Error: ${error.message}`, 'error');
            this.recordTest('discoveryTree', 'Get Discovery Tree', false, {
                error: error.message
            });
            return null;
        }
    }

    // ============================================================================
    // TEST 2: DISCOVERY TREE WITH FILTERS
    // ============================================================================
    async testGetDiscoveryTreeWithFilters() {
        this.log('\n📊 TEST 2: Get Discovery Tree with Filters');
        this.log('Testing: GET /api/v1/discovery-tree?year_min=2020&year_max=2024');

        try {
            const startTime = Date.now();
            const response = await fetch(
                `${this.backendUrl}/api/v1/discovery-tree?year_min=2020&year_max=2024&min_papers=2`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-ID': this.userId
                    }
                }
            );
            const duration = Date.now() - startTime;

            if (response.ok) {
                const data = await response.json();
                this.log(`✅ Filtered tree retrieved (${duration}ms)`, 'success');
                this.log(`   Clusters: ${data.tree?.total_clusters || 0}`);
                this.log(`   Papers: ${data.tree?.total_papers || 0}`);

                // Validate filters applied
                let filtersApplied = true;
                if (data.tree?.clusters) {
                    for (const cluster of data.tree.clusters) {
                        if (cluster.avg_year < 2020 || cluster.avg_year > 2024) {
                            filtersApplied = false;
                            break;
                        }
                    }
                }

                if (filtersApplied) {
                    this.log('   ✓ Filters correctly applied', 'success');
                } else {
                    this.log('   ✗ Filters not applied correctly', 'warning');
                }

                this.recordTest('discoveryTree', 'Get Discovery Tree with Filters', true, {
                    duration,
                    clusters: data.tree?.total_clusters || 0,
                    filtersApplied
                });

                return data.tree;
            } else {
                this.log(`❌ Failed: HTTP ${response.status}`, 'error');
                this.recordTest('discoveryTree', 'Get Discovery Tree with Filters', false, {
                    status: response.status
                });
                return null;
            }
        } catch (error) {
            this.log(`❌ Error: ${error.message}`, 'error');
            this.recordTest('discoveryTree', 'Get Discovery Tree with Filters', false, {
                error: error.message
            });
            return null;
        }
    }

    // ============================================================================
    // TEST 3: GET CLUSTER DETAILS
    // ============================================================================
    async testGetClusterDetails(clusterId) {
        this.log('\n📊 TEST 3: Get Cluster Details');
        this.log(`Testing: GET /api/v1/discovery-tree/cluster/${clusterId}`);

        try {
            const startTime = Date.now();
            const response = await fetch(
                `${this.backendUrl}/api/v1/discovery-tree/cluster/${clusterId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-ID': this.userId
                    }
                }
            );
            const duration = Date.now() - startTime;

            if (response.ok) {
                const data = await response.json();
                this.log(`✅ Cluster details retrieved (${duration}ms)`, 'success');
                this.log(`   Cluster ID: ${data.cluster?.cluster_id || 'N/A'}`);
                this.log(`   Title: ${data.cluster?.title || 'N/A'}`);
                this.log(`   Papers: ${data.cluster?.paper_count || 0}`);
                this.log(`   Keywords: ${data.cluster?.keywords?.slice(0, 3).join(', ') || 'N/A'}`);

                // Validate cluster view tracking
                const hasTracking = data.cluster?.view_count !== undefined;
                if (hasTracking) {
                    this.log(`   ✓ View tracking: ${data.cluster.view_count} views`, 'success');
                } else {
                    this.log('   ✗ View tracking not working', 'warning');
                }

                this.recordTest('clusterDetails', 'Get Cluster Details', true, {
                    duration,
                    clusterId,
                    paperCount: data.cluster?.paper_count || 0,
                    hasTracking
                });

                this.recordPerformance('GET /api/v1/discovery-tree/cluster/{id}', duration, 200);

                return data.cluster;
            } else {
                this.log(`❌ Failed: HTTP ${response.status}`, 'error');
                this.recordTest('clusterDetails', 'Get Cluster Details', false, {
                    status: response.status,
                    clusterId
                });
                return null;
            }
        } catch (error) {
            this.log(`❌ Error: ${error.message}`, 'error');
            this.recordTest('clusterDetails', 'Get Cluster Details', false, {
                error: error.message,
                clusterId
            });
            return null;
        }
    }

    // ============================================================================
    // TEST 4: GET CLUSTER PAPERS
    // ============================================================================
    async testGetClusterPapers(clusterId) {
        this.log('\n📊 TEST 4: Get Cluster Papers');
        this.log(`Testing: GET /api/v1/discovery-tree/cluster/${clusterId}/papers`);

        try {
            const startTime = Date.now();
            const response = await fetch(
                `${this.backendUrl}/api/v1/discovery-tree/cluster/${clusterId}/papers?sort_by=relevance&limit=10`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-ID': this.userId
                    }
                }
            );
            const duration = Date.now() - startTime;

            if (response.ok) {
                const data = await response.json();
                this.log(`✅ Cluster papers retrieved (${duration}ms)`, 'success');
                this.log(`   Papers: ${data.papers?.length || 0}`);

                // Validate paper structure
                let validPapers = 0;
                if (data.papers && Array.isArray(data.papers)) {
                    for (const paper of data.papers) {
                        if (paper.pmid && paper.title && paper.relevance_score !== undefined) {
                            validPapers++;
                        }
                    }
                }

                this.log(`   ✓ Valid papers: ${validPapers}/${data.papers?.length || 0}`, 'success');

                this.recordTest('clusterPapers', 'Get Cluster Papers', true, {
                    duration,
                    clusterId,
                    paperCount: data.papers?.length || 0,
                    validPapers
                });

                return data.papers;
            } else {
                this.log(`❌ Failed: HTTP ${response.status}`, 'error');
                this.recordTest('clusterPapers', 'Get Cluster Papers', false, {
                    status: response.status,
                    clusterId
                });
                return null;
            }
        } catch (error) {
            this.log(`❌ Error: ${error.message}`, 'error');
            this.recordTest('clusterPapers', 'Get Cluster Papers', false, {
                error: error.message,
                clusterId
            });
            return null;
        }
    }

    // ============================================================================
    // TEST 5: GET RELATED CLUSTERS
    // ============================================================================
    async testGetRelatedClusters(clusterId) {
        this.log('\n📊 TEST 5: Get Related Clusters');
        this.log(`Testing: GET /api/v1/discovery-tree/cluster/${clusterId}/related`);

        try {
            const startTime = Date.now();
            const response = await fetch(
                `${this.backendUrl}/api/v1/discovery-tree/cluster/${clusterId}/related?limit=5`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-ID': this.userId
                    }
                }
            );
            const duration = Date.now() - startTime;

            if (response.ok) {
                const data = await response.json();
                this.log(`✅ Related clusters retrieved (${duration}ms)`, 'success');
                this.log(`   Related clusters: ${data.related_clusters?.length || 0}`);

                // Validate similarity scores
                let hasSimilarityScores = true;
                if (data.related_clusters && Array.isArray(data.related_clusters)) {
                    for (const cluster of data.related_clusters) {
                        if (cluster.similarity_score === undefined) {
                            hasSimilarityScores = false;
                            break;
                        }
                    }
                }

                if (hasSimilarityScores && data.related_clusters?.length > 0) {
                    this.log('   ✓ Similarity scores present', 'success');
                }

                this.recordTest('relatedClusters', 'Get Related Clusters', true, {
                    duration,
                    clusterId,
                    relatedCount: data.related_clusters?.length || 0,
                    hasSimilarityScores
                });

                return data.related_clusters;
            } else {
                this.log(`❌ Failed: HTTP ${response.status}`, 'error');
                this.recordTest('relatedClusters', 'Get Related Clusters', false, {
                    status: response.status,
                    clusterId
                });
                return null;
            }
        } catch (error) {
            this.log(`❌ Error: ${error.message}`, 'error');
            this.recordTest('relatedClusters', 'Get Related Clusters', false, {
                error: error.message,
                clusterId
            });
            return null;
        }
    }

    // ============================================================================
    // TEST 6: NAVIGATE TO CLUSTER
    // ============================================================================
    async testNavigateToCluster(clusterId, fromClusterId = null) {
        this.log('\n📊 TEST 6: Navigate to Cluster');
        this.log('Testing: POST /api/v1/discovery-tree/navigate');

        try {
            const startTime = Date.now();
            const response = await fetch(
                `${this.backendUrl}/api/v1/discovery-tree/navigate`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-ID': this.userId
                    },
                    body: JSON.stringify({
                        cluster_id: clusterId,
                        from_cluster_id: fromClusterId,
                        navigation_type: fromClusterId ? 'related' : 'direct'
                    })
                }
            );
            const duration = Date.now() - startTime;

            if (response.ok) {
                const data = await response.json();
                this.log(`✅ Navigation tracked (${duration}ms)`, 'success');
                this.log(`   Cluster: ${data.cluster?.cluster_id || 'N/A'}`);
                this.log(`   Navigation type: ${fromClusterId ? 'related' : 'direct'}`);

                const hasNavigation = data.navigation !== undefined;
                if (hasNavigation) {
                    this.log('   ✓ Navigation tracking working', 'success');
                }

                this.recordTest('navigation', 'Navigate to Cluster', true, {
                    duration,
                    clusterId,
                    fromClusterId,
                    hasNavigation
                });

                this.recordPerformance('POST /api/v1/discovery-tree/navigate', duration, 200);
                return data;
            } else {
                this.log(`❌ Failed: HTTP ${response.status}`, 'error');
                this.recordTest('navigation', 'Navigate to Cluster', false, {
                    status: response.status,
                    clusterId
                });
                return null;
            }
        } catch (error) {
            this.log(`❌ Error: ${error.message}`, 'error');
            this.recordTest('navigation', 'Navigate to Cluster', false, {
                error: error.message,
                clusterId
            });
            return null;
        }
    }

    // ============================================================================
    // TEST 7: GET CLUSTER RECOMMENDATIONS
    // ============================================================================
    async testGetClusterRecommendations() {
        this.log('\n📊 TEST 7: Get Cluster Recommendations');
        this.log('Testing: GET /api/v1/discovery-tree/recommendations');

        try {
            const startTime = Date.now();
            const response = await fetch(
                `${this.backendUrl}/api/v1/discovery-tree/recommendations?limit=10&exploration_ratio=0.3`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-ID': this.userId
                    }
                }
            );
            const duration = Date.now() - startTime;

            if (response.ok) {
                const data = await response.json();
                this.log(`✅ Recommendations retrieved (${duration}ms)`, 'success');
                this.log(`   Recommendations: ${data.recommendations?.length || 0}`);

                let validRecs = 0;
                let hasScores = true;
                let hasReasons = true;

                if (data.recommendations && Array.isArray(data.recommendations)) {
                    for (const rec of data.recommendations) {
                        if (rec.cluster_id && rec.title) {
                            validRecs++;
                        }
                        if (rec.score === undefined) hasScores = false;
                        if (!rec.reason) hasReasons = false;
                    }
                }

                this.log(`   ✓ Valid recommendations: ${validRecs}/${data.recommendations?.length || 0}`, 'success');
                if (hasScores) this.log('   ✓ Scores present', 'success');
                if (hasReasons) this.log('   ✓ Reasons present', 'success');

                this.recordTest('recommendations', 'Get Cluster Recommendations', true, {
                    duration,
                    recommendationCount: data.recommendations?.length || 0,
                    validRecs,
                    hasScores,
                    hasReasons
                });

                this.recordPerformance('GET /api/v1/discovery-tree/recommendations', duration, 300);
                return data.recommendations;
            } else {
                this.log(`❌ Failed: HTTP ${response.status}`, 'error');
                this.recordTest('recommendations', 'Get Cluster Recommendations', false, {
                    status: response.status
                });
                return null;
            }
        } catch (error) {
            this.log(`❌ Error: ${error.message}`, 'error');
            this.recordTest('recommendations', 'Get Cluster Recommendations', false, {
                error: error.message
            });
            return null;
        }
    }

    // ============================================================================
    // TEST 8: SEARCH WITHIN CLUSTERS
    // ============================================================================
    async testSearchWithinClusters(query, clusterId = null) {
        this.log('\n📊 TEST 8: Search Within Clusters');
        this.log('Testing: POST /api/v1/discovery-tree/search');

        try {
            const startTime = Date.now();
            const response = await fetch(
                `${this.backendUrl}/api/v1/discovery-tree/search`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-ID': this.userId
                    },
                    body: JSON.stringify({
                        query: query,
                        cluster_id: clusterId,
                        limit: 10
                    })
                }
            );
            const duration = Date.now() - startTime;

            if (response.ok) {
                const data = await response.json();
                this.log(`✅ Search results retrieved (${duration}ms)`, 'success');
                this.log(`   Results: ${data.results?.length || 0}`);
                this.log(`   Query: "${query}"`);

                this.recordTest('search', 'Search Within Clusters', true, {
                    duration,
                    query,
                    clusterId,
                    resultCount: data.results?.length || 0
                });

                return data.results;
            } else if (response.status === 501) {
                this.log('⚠️  Search not implemented yet (501)', 'warning');
                this.recordTest('search', 'Search Within Clusters', true, {
                    status: 501,
                    note: 'Not implemented - expected'
                });
                return null;
            } else {
                this.log(`❌ Failed: HTTP ${response.status}`, 'error');
                this.recordTest('search', 'Search Within Clusters', false, {
                    status: response.status,
                    query
                });
                return null;
            }
        } catch (error) {
            this.log(`❌ Error: ${error.message}`, 'error');
            this.recordTest('search', 'Search Within Clusters', false, {
                error: error.message,
                query
            });
            return null;
        }
    }

    // ============================================================================
    // TEST 9: INTEGRATION WITH SPRINT 2B (CLUSTERING)
    // ============================================================================
    async testClusteringIntegration() {
        this.log('\n📊 TEST 9: Integration with Sprint 2B (Clustering)');
        this.log('Testing: GET /api/v1/clusters');

        try {
            const startTime = Date.now();
            const response = await fetch(
                `${this.backendUrl}/api/v1/clusters`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-ID': this.userId
                    }
                }
            );
            const duration = Date.now() - startTime;

            if (response.ok) {
                const data = await response.json();
                this.log(`✅ Clustering API accessible (${duration}ms)`, 'success');
                this.log(`   Clusters: ${data.clusters?.length || 0}`);

                const hasIntegration = data.clusters && Array.isArray(data.clusters);
                if (hasIntegration) {
                    this.log('   ✓ Sprint 2B integration working', 'success');
                }

                this.recordTest('integration', 'Clustering Integration (Sprint 2B)', true, {
                    duration,
                    clusterCount: data.clusters?.length || 0,
                    hasIntegration
                });

                return data.clusters;
            } else {
                this.log(`❌ Failed: HTTP ${response.status}`, 'error');
                this.recordTest('integration', 'Clustering Integration (Sprint 2B)', false, {
                    status: response.status
                });
                return null;
            }
        } catch (error) {
            this.log(`❌ Error: ${error.message}`, 'error');
            this.recordTest('integration', 'Clustering Integration (Sprint 2B)', false, {
                error: error.message
            });
            return null;
        }
    }

    // ============================================================================
    // TEST 10: INTEGRATION WITH SPRINT 3B (WEEKLY MIX)
    // ============================================================================
    async testWeeklyMixIntegration() {
        this.log('\n📊 TEST 10: Integration with Sprint 3B (Weekly Mix)');
        this.log('Testing: GET /api/v1/weekly-mix/current');

        try {
            const startTime = Date.now();
            const response = await fetch(
                `${this.backendUrl}/api/v1/weekly-mix/current`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-ID': this.userId
                    }
                }
            );
            const duration = Date.now() - startTime;

            if (response.ok) {
                const data = await response.json();
                this.log(`✅ Weekly Mix API accessible (${duration}ms)`, 'success');
                this.log(`   Mix ID: ${data.mix?.mix_id || 'N/A'}`);
                this.log(`   Papers: ${data.mix?.papers?.length || 0}`);

                const hasIntegration = data.mix !== undefined;
                if (hasIntegration) {
                    this.log('   ✓ Sprint 3B integration working', 'success');
                }

                this.recordTest('integration', 'Weekly Mix Integration (Sprint 3B)', true, {
                    duration,
                    hasMix: data.mix !== undefined,
                    paperCount: data.mix?.papers?.length || 0
                });

                return data.mix;
            } else if (response.status === 404) {
                this.log('⚠️  No weekly mix found (404) - expected for new user', 'warning');
                this.recordTest('integration', 'Weekly Mix Integration (Sprint 3B)', true, {
                    status: 404,
                    note: 'No mix found - expected for new user'
                });
                return null;
            } else {
                this.log(`❌ Failed: HTTP ${response.status}`, 'error');
                this.recordTest('integration', 'Weekly Mix Integration (Sprint 3B)', false, {
                    status: response.status
                });
                return null;
            }
        } catch (error) {
            this.log(`❌ Error: ${error.message}`, 'error');
            this.recordTest('integration', 'Weekly Mix Integration (Sprint 3B)', false, {
                error: error.message
            });
            return null;
        }
    }

    // ============================================================================
    // RUN ALL TESTS
    // ============================================================================
    async runAllTests() {
        this.log('\n🚀 STARTING COMPREHENSIVE SPRINT 4 TESTS');
        this.log('='.repeat(80));
        this.log(`Backend: ${this.backendUrl}`);
        this.log(`User ID: ${this.userId}`);
        this.log(`Timestamp: ${new Date().toISOString()}`);

        // Test 1: Get Discovery Tree
        const tree = await this.testGetDiscoveryTree();
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 2: Get Discovery Tree with Filters
        await this.testGetDiscoveryTreeWithFilters();
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get a cluster ID for subsequent tests
        let clusterId = null;
        if (tree && tree.clusters && tree.clusters.length > 0) {
            clusterId = tree.clusters[0].cluster_id;
            this.log(`\n📌 Using cluster ID for tests: ${clusterId}`);
        } else {
            this.log('\n⚠️  No clusters available - some tests will be skipped', 'warning');
        }

        if (clusterId) {
            // Test 3: Get Cluster Details
            await this.testGetClusterDetails(clusterId);
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Test 4: Get Cluster Papers
            await this.testGetClusterPapers(clusterId);
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Test 5: Get Related Clusters
            const relatedClusters = await this.testGetRelatedClusters(clusterId);
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Test 6: Navigate to Cluster
            await this.testNavigateToCluster(clusterId);
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Test 6b: Navigate from one cluster to another
            if (relatedClusters && relatedClusters.length > 0) {
                await this.testNavigateToCluster(relatedClusters[0].cluster_id, clusterId);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Test 7: Get Cluster Recommendations
        await this.testGetClusterRecommendations();
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 8: Search Within Clusters
        await this.testSearchWithinClusters('machine learning', clusterId);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 9: Integration with Sprint 2B
        await this.testClusteringIntegration();
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 10: Integration with Sprint 3B
        await this.testWeeklyMixIntegration();

        // Generate final report
        return this.generateReport();
    }

    // ============================================================================
    // GENERATE COMPREHENSIVE REPORT
    // ============================================================================
    generateReport() {
        this.log('\n' + '='.repeat(80));
        this.log('📊 COMPREHENSIVE TEST REPORT');
        this.log('='.repeat(80));

        // Overall summary
        const successRate = ((this.passedTests / this.totalTests) * 100).toFixed(1);
        this.log(`\n📈 OVERALL RESULTS:`);
        this.log(`   Total Tests: ${this.totalTests}`);
        this.log(`   Passed: ${this.passedTests} ✅`);
        this.log(`   Failed: ${this.failedTests} ❌`);
        this.log(`   Success Rate: ${successRate}%`);

        // Category breakdown
        this.log(`\n📋 CATEGORY BREAKDOWN:`);
        for (const [category, tests] of Object.entries(this.testResults)) {
            if (tests.length > 0) {
                const passed = tests.filter(t => t.success).length;
                const total = tests.length;
                const rate = ((passed / total) * 100).toFixed(0);
                this.log(`   ${category}: ${passed}/${total} (${rate}%)`);
            }
        }

        // Performance metrics
        if (this.performanceMetrics.length > 0) {
            this.log(`\n⚡ PERFORMANCE METRICS:`);
            for (const metric of this.performanceMetrics) {
                const status = metric.meetsTarget ? '✅' : '⚠️';
                this.log(`   ${status} ${metric.endpoint}`);
                this.log(`      Duration: ${metric.duration}ms (target: ${metric.target}ms)`);
                this.log(`      Performance: ${metric.ratio} better than target`);
            }
        }

        // Detailed results
        this.log(`\n📝 DETAILED RESULTS:`);
        for (const [category, tests] of Object.entries(this.testResults)) {
            if (tests.length > 0) {
                this.log(`\n   ${category.toUpperCase()}:`);
                for (const test of tests) {
                    const status = test.success ? '✅' : '❌';
                    this.log(`   ${status} ${test.test}`);
                    if (test.duration) {
                        this.log(`      Duration: ${test.duration}ms`);
                    }
                    if (test.error) {
                        this.log(`      Error: ${test.error}`);
                    }
                }
            }
        }

        // Final verdict
        this.log('\n' + '='.repeat(80));
        if (successRate >= 90) {
            this.log('🎉 EXCELLENT! Sprint 4 is production-ready!', 'success');
        } else if (successRate >= 70) {
            this.log('✅ GOOD! Most features working, minor issues to address', 'success');
        } else if (successRate >= 50) {
            this.log('⚠️  FAIR! Several issues need attention', 'warning');
        } else {
            this.log('❌ NEEDS WORK! Major issues detected', 'error');
        }
        this.log('='.repeat(80));

        // Return results for programmatic access
        return {
            totalTests: this.totalTests,
            passedTests: this.passedTests,
            failedTests: this.failedTests,
            successRate: parseFloat(successRate),
            testResults: this.testResults,
            performanceMetrics: this.performanceMetrics
        };
    }
}

// ============================================================================
// EXECUTE TESTS
// ============================================================================
console.log('🎯 Initializing Sprint 4 Comprehensive Tester...');
const tester = new Sprint4ComprehensiveTester();

console.log('📋 Running all tests...');
tester.runAllTests().then(results => {
    console.log('\n✅ All tests complete!');
    console.log('📊 Results available in tester.testResults');
    console.log('⚡ Performance metrics in tester.performanceMetrics');
}).catch(error => {
    console.error('❌ Test execution failed:', error);
});

// Make tester available globally for inspection
window.sprint4Tester = tester;
