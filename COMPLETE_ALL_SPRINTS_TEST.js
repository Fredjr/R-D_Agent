/**
 * 🚀 COMPLETE ALL SPRINTS TEST (Sprint 1A → Sprint 4)
 *
 * Comprehensive test covering ALL development from Sprint 1A through Sprint 4:
 * - Sprint 1A: Event Tracking Foundation
 * - Sprint 1B: Vector Store & Candidate API
 * - Sprint 2A: Graph Builder & Network Analysis
 * - Sprint 2B: Clustering V1
 * - Sprint 3A: Explainability API V1
 * - Sprint 3B: Weekly Mix Enhancement
 * - Sprint 4: Discovery Tree & Cluster-Aware Navigation
 *
 * Run this on: https://frontend-psi-seven-85.vercel.app/projects/5ac213d7-6fcc-46ff-9420-5c7f4b421012
 * Backend: https://r-dagent-production.up.railway.app
 */

console.log('🚀 COMPLETE ALL SPRINTS TEST - Sprint 1A through Sprint 4');
console.log('='.repeat(80));

class CompleteAllSprintsTest {
    constructor() {
        this.backendUrl = 'https://r-dagent-production.up.railway.app';
        this.userId = `all_sprints_test_${Date.now()}`;
        this.testResults = {
            sprint1a: [],
            sprint1b: [],
            sprint2a: [],
            sprint2b: [],
            sprint3a: [],
            sprint3b: [],
            sprint4: []
        };
        this.performanceMetrics = [];
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
        this.startTime = Date.now();
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
        const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '📋';
        console.log(`${prefix} [${timestamp}] [+${elapsed}s] ${message}`);
    }

    recordTest(sprint, testName, success, details = {}) {
        this.totalTests++;
        if (success) {
            this.passedTests++;
        } else {
            this.failedTests++;
        }

        this.testResults[sprint].push({
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
    // SPRINT 1A: EVENT TRACKING FOUNDATION
    // ============================================================================
    async testSprint1A() {
        this.log('\n🎯 SPRINT 1A: EVENT TRACKING FOUNDATION', 'info');
        this.log('='.repeat(80));

        // Test 1: Track paper view event
        this.log('\n📊 Test 1A-1: Track Paper View Event');
        try {
            const startTime = Date.now();
            const response = await fetch(`${this.backendUrl}/api/v1/events/track`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': this.userId
                },
                body: JSON.stringify({
                    event_type: 'paper_view',
                    paper_id: '12345678',
                    metadata: { source: 'test', duration: 30 }
                })
            });
            const duration = Date.now() - startTime;

            if (response.ok) {
                const data = await response.json();
                this.log(`✅ Event tracked (${duration}ms)`, 'success');
                this.recordTest('sprint1a', 'Track Paper View Event', true, { duration });
                this.recordPerformance('POST /api/v1/events/track', duration, 100);
            } else {
                this.log(`❌ Failed: HTTP ${response.status}`, 'error');
                this.recordTest('sprint1a', 'Track Paper View Event', false, { status: response.status });
            }
        } catch (error) {
            this.log(`❌ Error: ${error.message}`, 'error');
            this.recordTest('sprint1a', 'Track Paper View Event', false, { error: error.message });
        }

        // Test 2: Get user events
        this.log('\n📊 Test 1A-2: Get User Events');
        try {
            const startTime = Date.now();
            const response = await fetch(`${this.backendUrl}/api/v1/events/user?limit=10`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': this.userId
                }
            });
            const duration = Date.now() - startTime;

            if (response.ok) {
                const data = await response.json();
                this.log(`✅ Events retrieved: ${data.events?.length || 0} events (${duration}ms)`, 'success');
                this.recordTest('sprint1a', 'Get User Events', true, { duration, eventCount: data.events?.length || 0 });
            } else {
                this.log(`❌ Failed: HTTP ${response.status}`, 'error');
                this.recordTest('sprint1a', 'Get User Events', false, { status: response.status });
            }
        } catch (error) {
            this.log(`❌ Error: ${error.message}`, 'error');
            this.recordTest('sprint1a', 'Get User Events', false, { error: error.message });
        }
    }

    // ============================================================================
    // SPRINT 1B: VECTOR STORE & CANDIDATE API
    // ============================================================================
    async testSprint1B() {
        this.log('\n🎯 SPRINT 1B: VECTOR STORE & CANDIDATE API', 'info');
        this.log('='.repeat(80));

        // Test 1: Get similar papers (candidates)
        this.log('\n📊 Test 1B-1: Get Similar Papers (Candidates)');
        try {
            const startTime = Date.now();
            const response = await fetch(
                `${this.backendUrl}/api/v1/candidates/similar?pmid=12345678&limit=10`,
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
                this.log(`✅ Candidates retrieved: ${data.candidates?.length || 0} papers (${duration}ms)`, 'success');
                this.recordTest('sprint1b', 'Get Similar Papers', true, { duration, candidateCount: data.candidates?.length || 0 });
                this.recordPerformance('GET /api/v1/candidates/similar', duration, 500);
            } else {
                this.log(`❌ Failed: HTTP ${response.status}`, 'error');
                this.recordTest('sprint1b', 'Get Similar Papers', false, { status: response.status });
            }
        } catch (error) {
            this.log(`❌ Error: ${error.message}`, 'error');
            this.recordTest('sprint1b', 'Get Similar Papers', false, { error: error.message });
        }

        // Test 2: Get collection centroid
        this.log('\n📊 Test 1B-2: Get Collection Centroid');
        try {
            const startTime = Date.now();
            const response = await fetch(
                `${this.backendUrl}/api/v1/candidates/collection-centroid`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-ID': this.userId
                    },
                    body: JSON.stringify({
                        pmids: ['12345678', '87654321']
                    })
                }
            );
            const duration = Date.now() - startTime;

            if (response.ok) {
                const data = await response.json();
                this.log(`✅ Centroid calculated (${duration}ms)`, 'success');
                this.recordTest('sprint1b', 'Get Collection Centroid', true, { duration });
            } else {
                this.log(`❌ Failed: HTTP ${response.status}`, 'error');
                this.recordTest('sprint1b', 'Get Collection Centroid', false, { status: response.status });
            }
        } catch (error) {
            this.log(`❌ Error: ${error.message}`, 'error');
            this.recordTest('sprint1b', 'Get Collection Centroid', false, { error: error.message });
        }
    }

    // ============================================================================
    // SPRINT 2A: GRAPH BUILDER & NETWORK ANALYSIS
    // ============================================================================
    async testSprint2A() {
        this.log('\n🎯 SPRINT 2A: GRAPH BUILDER & NETWORK ANALYSIS', 'info');
        this.log('='.repeat(80));

        // Test 1: Build citation graph
        this.log('\n📊 Test 2A-1: Build Citation Graph');
        try {
            const startTime = Date.now();
            const response = await fetch(
                `${this.backendUrl}/api/v1/graphs/build`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-ID': this.userId
                    },
                    body: JSON.stringify({
                        pmids: ['12345678', '87654321'],
                        graph_type: 'citation'
                    })
                }
            );
            const duration = Date.now() - startTime;

            if (response.ok) {
                const data = await response.json();
                this.log(`✅ Graph built: ${data.graph?.node_count || 0} nodes, ${data.graph?.edge_count || 0} edges (${duration}ms)`, 'success');
                this.recordTest('sprint2a', 'Build Citation Graph', true, { duration, nodeCount: data.graph?.node_count || 0 });
                this.recordPerformance('POST /api/v1/graphs/build', duration, 1000);
            } else {
                this.log(`❌ Failed: HTTP ${response.status}`, 'error');
                this.recordTest('sprint2a', 'Build Citation Graph', false, { status: response.status });
            }
        } catch (error) {
            this.log(`❌ Error: ${error.message}`, 'error');
            this.recordTest('sprint2a', 'Build Citation Graph', false, { error: error.message });
        }

        // Test 2: Analyze network
        this.log('\n📊 Test 2A-2: Analyze Network');
        try {
            const startTime = Date.now();
            const response = await fetch(
                `${this.backendUrl}/api/v1/graphs/analyze`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-ID': this.userId
                    },
                    body: JSON.stringify({
                        pmids: ['12345678', '87654321'],
                        metrics: ['degree_centrality', 'betweenness_centrality']
                    })
                }
            );
            const duration = Date.now() - startTime;

            if (response.ok) {
                const data = await response.json();
                this.log(`✅ Network analyzed (${duration}ms)`, 'success');
                this.recordTest('sprint2a', 'Analyze Network', true, { duration });
                this.recordPerformance('POST /api/v1/graphs/analyze', duration, 500);
            } else {
                this.log(`❌ Failed: HTTP ${response.status}`, 'error');
                this.recordTest('sprint2a', 'Analyze Network', false, { status: response.status });
            }
        } catch (error) {
            this.log(`❌ Error: ${error.message}`, 'error');
            this.recordTest('sprint2a', 'Analyze Network', false, { error: error.message });
        }
    }

    // ============================================================================
    // SPRINT 2B: CLUSTERING V1
    // ============================================================================
    async testSprint2B() {
        this.log('\n🎯 SPRINT 2B: CLUSTERING V1', 'info');
        this.log('='.repeat(80));

        // Test 1: Generate clusters
        this.log('\n📊 Test 2B-1: Generate Clusters');
        try {
            const startTime = Date.now();
            const response = await fetch(
                `${this.backendUrl}/api/v1/clusters/generate`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-ID': this.userId
                    },
                    body: JSON.stringify({
                        pmids: ['12345678', '87654321', '11111111', '22222222']
                    })
                }
            );
            const duration = Date.now() - startTime;

            if (response.ok) {
                const data = await response.json();
                this.log(`✅ Clusters generated: ${data.clusters?.length || 0} clusters (${duration}ms)`, 'success');
                this.recordTest('sprint2b', 'Generate Clusters', true, { duration, clusterCount: data.clusters?.length || 0 });
                this.recordPerformance('POST /api/v1/clusters/generate', duration, 1000);
                return data.clusters;
            } else {
                this.log(`❌ Failed: HTTP ${response.status}`, 'error');
                this.recordTest('sprint2b', 'Generate Clusters', false, { status: response.status });
                return null;
            }
        } catch (error) {
            this.log(`❌ Error: ${error.message}`, 'error');
            this.recordTest('sprint2b', 'Generate Clusters', false, { error: error.message });
            return null;
        }
    }

    // ============================================================================
    // SPRINT 3A: EXPLAINABILITY API V1
    // ============================================================================
    async testSprint3A() {
        this.log('\n🎯 SPRINT 3A: EXPLAINABILITY API V1', 'info');
        this.log('='.repeat(80));

        // Test 1: Get paper explanation
        this.log('\n📊 Test 3A-1: Get Paper Explanation');
        try {
            const startTime = Date.now();
            const response = await fetch(
                `${this.backendUrl}/api/v1/explanations/paper/12345678?explanation_type=relevance`,
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
                this.log(`✅ Explanation retrieved (${duration}ms)`, 'success');
                this.recordTest('sprint3a', 'Get Paper Explanation', true, { duration });
                this.recordPerformance('GET /api/v1/explanations/paper/{pmid}', duration, 200);
            } else {
                this.log(`❌ Failed: HTTP ${response.status}`, 'error');
                this.recordTest('sprint3a', 'Get Paper Explanation', false, { status: response.status });
            }
        } catch (error) {
            this.log(`❌ Error: ${error.message}`, 'error');
            this.recordTest('sprint3a', 'Get Paper Explanation', false, { error: error.message });
        }

        // Test 2: Get batch explanations
        this.log('\n📊 Test 3A-2: Get Batch Explanations');
        try {
            const startTime = Date.now();
            const response = await fetch(
                `${this.backendUrl}/api/v1/explanations/batch`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-ID': this.userId
                    },
                    body: JSON.stringify({
                        pmids: ['12345678', '87654321'],
                        explanation_type: 'relevance'
                    })
                }
            );
            const duration = Date.now() - startTime;

            if (response.ok) {
                const data = await response.json();
                this.log(`✅ Batch explanations retrieved: ${data.explanations?.length || 0} (${duration}ms)`, 'success');
                this.recordTest('sprint3a', 'Get Batch Explanations', true, { duration, count: data.explanations?.length || 0 });
            } else {
                this.log(`❌ Failed: HTTP ${response.status}`, 'error');
                this.recordTest('sprint3a', 'Get Batch Explanations', false, { status: response.status });
            }
        } catch (error) {
            this.log(`❌ Error: ${error.message}`, 'error');
            this.recordTest('sprint3a', 'Get Batch Explanations', false, { error: error.message });
        }
    }

    // ============================================================================
    // SPRINT 3B: WEEKLY MIX ENHANCEMENT
    // ============================================================================
    async testSprint3B() {
        this.log('\n🎯 SPRINT 3B: WEEKLY MIX ENHANCEMENT', 'info');
        this.log('='.repeat(80));

        // Test 1: Get current weekly mix
        this.log('\n📊 Test 3B-1: Get Current Weekly Mix');
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
                this.log(`✅ Weekly mix retrieved: ${data.mix?.papers?.length || 0} papers (${duration}ms)`, 'success');
                this.recordTest('sprint3b', 'Get Current Weekly Mix', true, { duration, paperCount: data.mix?.papers?.length || 0 });
                this.recordPerformance('GET /api/v1/weekly-mix/current', duration, 500);
            } else if (response.status === 404) {
                this.log('⚠️  No weekly mix found (404) - expected for new user', 'warning');
                this.recordTest('sprint3b', 'Get Current Weekly Mix', true, { status: 404, note: 'No mix - expected' });
            } else {
                this.log(`❌ Failed: HTTP ${response.status}`, 'error');
                this.recordTest('sprint3b', 'Get Current Weekly Mix', false, { status: response.status });
            }
        } catch (error) {
            this.log(`❌ Error: ${error.message}`, 'error');
            this.recordTest('sprint3b', 'Get Current Weekly Mix', false, { error: error.message });
        }

        // Test 2: Generate weekly mix
        this.log('\n📊 Test 3B-2: Generate Weekly Mix');
        try {
            const startTime = Date.now();
            const response = await fetch(
                `${this.backendUrl}/api/v1/weekly-mix/generate`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-ID': this.userId
                    },
                    body: JSON.stringify({
                        force_refresh: true
                    })
                }
            );
            const duration = Date.now() - startTime;

            if (response.ok) {
                const data = await response.json();
                this.log(`✅ Weekly mix generated: ${data.mix?.papers?.length || 0} papers (${duration}ms)`, 'success');
                this.recordTest('sprint3b', 'Generate Weekly Mix', true, { duration, paperCount: data.mix?.papers?.length || 0 });
            } else {
                this.log(`❌ Failed: HTTP ${response.status}`, 'error');
                this.recordTest('sprint3b', 'Generate Weekly Mix', false, { status: response.status });
            }
        } catch (error) {
            this.log(`❌ Error: ${error.message}`, 'error');
            this.recordTest('sprint3b', 'Generate Weekly Mix', false, { error: error.message });
        }
    }

    // ============================================================================
    // SPRINT 4: DISCOVERY TREE & CLUSTER-AWARE NAVIGATION
    // ============================================================================
    async testSprint4() {
        this.log('\n🎯 SPRINT 4: DISCOVERY TREE & CLUSTER-AWARE NAVIGATION', 'info');
        this.log('='.repeat(80));

        // Test 1: Get discovery tree
        this.log('\n📊 Test 4-1: Get Discovery Tree');
        try {
            const startTime = Date.now();
            const response = await fetch(
                `${this.backendUrl}/api/v1/discovery-tree`,
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
                this.log(`✅ Discovery tree retrieved: ${data.tree?.total_clusters || 0} clusters (${duration}ms)`, 'success');
                this.recordTest('sprint4', 'Get Discovery Tree', true, { duration, clusterCount: data.tree?.total_clusters || 0 });
                this.recordPerformance('GET /api/v1/discovery-tree', duration, 500);
                return data.tree;
            } else {
                this.log(`❌ Failed: HTTP ${response.status}`, 'error');
                this.recordTest('sprint4', 'Get Discovery Tree', false, { status: response.status });
                return null;
            }
        } catch (error) {
            this.log(`❌ Error: ${error.message}`, 'error');
            this.recordTest('sprint4', 'Get Discovery Tree', false, { error: error.message });
            return null;
        }
    }

    async testSprint4ClusterDetails(clusterId) {
        // Test 2: Get cluster details
        this.log('\n📊 Test 4-2: Get Cluster Details');
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
                this.recordTest('sprint4', 'Get Cluster Details', true, { duration });
                this.recordPerformance('GET /api/v1/discovery-tree/cluster/{id}', duration, 200);
            } else {
                this.log(`❌ Failed: HTTP ${response.status}`, 'error');
                this.recordTest('sprint4', 'Get Cluster Details', false, { status: response.status });
            }
        } catch (error) {
            this.log(`❌ Error: ${error.message}`, 'error');
            this.recordTest('sprint4', 'Get Cluster Details', false, { error: error.message });
        }
    }

    async testSprint4Recommendations() {
        // Test 3: Get cluster recommendations
        this.log('\n📊 Test 4-3: Get Cluster Recommendations');
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
                this.log(`✅ Recommendations retrieved: ${data.recommendations?.length || 0} (${duration}ms)`, 'success');
                this.recordTest('sprint4', 'Get Cluster Recommendations', true, { duration, count: data.recommendations?.length || 0 });
                this.recordPerformance('GET /api/v1/discovery-tree/recommendations', duration, 300);
            } else {
                this.log(`❌ Failed: HTTP ${response.status}`, 'error');
                this.recordTest('sprint4', 'Get Cluster Recommendations', false, { status: response.status });
            }
        } catch (error) {
            this.log(`❌ Error: ${error.message}`, 'error');
            this.recordTest('sprint4', 'Get Cluster Recommendations', false, { error: error.message });
        }
    }

    // ============================================================================
    // RUN ALL TESTS
    // ============================================================================
    async runAllTests() {
        this.log('\n🚀 STARTING COMPLETE ALL SPRINTS TEST', 'info');
        this.log('='.repeat(80));
        this.log(`Backend: ${this.backendUrl}`);
        this.log(`User ID: ${this.userId}`);
        this.log(`Timestamp: ${new Date().toISOString()}`);
        this.log('='.repeat(80));

        // Sprint 1A: Event Tracking
        await this.testSprint1A();
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Sprint 1B: Vector Store & Candidates
        await this.testSprint1B();
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Sprint 2A: Graph Builder & Network Analysis
        await this.testSprint2A();
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Sprint 2B: Clustering
        const clusters = await this.testSprint2B();
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Sprint 3A: Explainability
        await this.testSprint3A();
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Sprint 3B: Weekly Mix
        await this.testSprint3B();
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Sprint 4: Discovery Tree
        const tree = await this.testSprint4();
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Sprint 4: Additional tests if we have a cluster
        if (tree && tree.clusters && tree.clusters.length > 0) {
            const clusterId = tree.clusters[0].cluster_id;
            await this.testSprint4ClusterDetails(clusterId);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        await this.testSprint4Recommendations();

        // Generate final report
        return this.generateReport();
    }

    // ============================================================================
    // GENERATE COMPREHENSIVE REPORT
    // ============================================================================
    generateReport() {
        this.log('\n' + '='.repeat(80));
        this.log('📊 COMPLETE ALL SPRINTS TEST REPORT');
        this.log('='.repeat(80));

        // Overall summary
        const successRate = ((this.passedTests / this.totalTests) * 100).toFixed(1);
        const totalDuration = ((Date.now() - this.startTime) / 1000).toFixed(1);

        this.log(`\n📈 OVERALL RESULTS:`);
        this.log(`   Total Tests: ${this.totalTests}`);
        this.log(`   Passed: ${this.passedTests} ✅`);
        this.log(`   Failed: ${this.failedTests} ❌`);
        this.log(`   Success Rate: ${successRate}%`);
        this.log(`   Total Duration: ${totalDuration}s`);

        // Sprint breakdown
        this.log(`\n📋 SPRINT BREAKDOWN:`);
        const sprintNames = {
            sprint1a: 'Sprint 1A: Event Tracking',
            sprint1b: 'Sprint 1B: Vector Store & Candidates',
            sprint2a: 'Sprint 2A: Graph Builder & Network Analysis',
            sprint2b: 'Sprint 2B: Clustering V1',
            sprint3a: 'Sprint 3A: Explainability API V1',
            sprint3b: 'Sprint 3B: Weekly Mix Enhancement',
            sprint4: 'Sprint 4: Discovery Tree & Cluster Navigation'
        };

        for (const [sprint, tests] of Object.entries(this.testResults)) {
            if (tests.length > 0) {
                const passed = tests.filter(t => t.success).length;
                const total = tests.length;
                const rate = ((passed / total) * 100).toFixed(0);
                const status = rate >= 90 ? '✅' : rate >= 70 ? '⚠️' : '❌';
                this.log(`   ${status} ${sprintNames[sprint]}: ${passed}/${total} (${rate}%)`);
            }
        }

        // Performance metrics
        if (this.performanceMetrics.length > 0) {
            this.log(`\n⚡ PERFORMANCE METRICS:`);
            for (const metric of this.performanceMetrics) {
                const status = metric.meetsTarget ? '✅' : '⚠️';
                this.log(`   ${status} ${metric.endpoint}: ${metric.duration}ms (target: ${metric.target}ms) - ${metric.ratio}`);
            }
        }

        // Final verdict
        this.log('\n' + '='.repeat(80));
        if (successRate >= 90) {
            this.log('🎉 EXCELLENT! All sprints are production-ready!', 'success');
        } else if (successRate >= 70) {
            this.log('✅ GOOD! Most features working, minor issues to address', 'success');
        } else if (successRate >= 50) {
            this.log('⚠️  FAIR! Several issues need attention', 'warning');
        } else {
            this.log('❌ NEEDS WORK! Major issues detected', 'error');
        }
        this.log('='.repeat(80));

        return {
            totalTests: this.totalTests,
            passedTests: this.passedTests,
            failedTests: this.failedTests,
            successRate: parseFloat(successRate),
            totalDuration: parseFloat(totalDuration),
            testResults: this.testResults,
            performanceMetrics: this.performanceMetrics
        };
    }
}

// ============================================================================
// EXECUTE TESTS
// ============================================================================
console.log('🎯 Initializing Complete All Sprints Tester...');
const tester = new CompleteAllSprintsTest();

console.log('📋 Running all tests from Sprint 1A through Sprint 4...');
tester.runAllTests().then(results => {
    console.log('\n✅ All tests complete!');
    console.log(`📊 Success Rate: ${results.successRate}%`);
    console.log(`⏱️  Total Duration: ${results.totalDuration}s`);
    console.log('📊 Results available in: window.allSprintsTester.testResults');
    console.log('⚡ Performance metrics in: window.allSprintsTester.performanceMetrics');
}).catch(error => {
    console.error('❌ Test execution failed:', error);
});

// Make tester available globally for inspection
window.allSprintsTester = tester;

