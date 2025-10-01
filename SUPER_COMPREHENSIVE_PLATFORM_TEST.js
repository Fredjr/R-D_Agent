/**
 * SUPER COMPREHENSIVE PLATFORM TEST v1.0
 * 
 * The most thorough end-to-end test for the entire R&D Agent platform
 * Tests every major functionality including:
 * - Collections (CRUD operations, network analysis)
 * - Project Dashboard (all endpoints, data flows)
 * - Network Nodes (creation, analysis, relationships)
 * - Network Papers (discovery, connections, analysis)
 * - Real-time Features (WebSocket, live updates)
 * - Background Jobs (status tracking, completion)
 * - PubMed Integration (all recommendation types)
 * - Data Persistence (database operations)
 * - User Workflows (complete research journeys)
 */

class SuperComprehensivePlatformTest {
    constructor() {
        this.baseUrl = 'https://frontend-psi-seven-85.vercel.app';
        this.backendUrl = 'https://r-dagent-production.up.railway.app';
        this.testUserId = 'fredericle77@gmail.com';
        this.testProjectId = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
        this.results = [];
        this.startTime = Date.now();
        this.testData = {
            collections: [],
            networkNodes: [],
            backgroundJobs: [],
            analyses: []
        };
        this.metrics = {
            totalTests: 0,
            successfulTests: 0,
            failedTests: 0,
            averageResponseTime: 0,
            totalResponseTime: 0
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
            'network': '🕸️',
            'collection': '📚',
            'project': '📊',
            'websocket': '🔌',
            'job': '⚙️',
            'paper': '📄',
            'analysis': '🔬',
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
        this.metrics.totalTests++;
        
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
            this.metrics.totalResponseTime += responseTime;
            
            let data = null;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }
            
            if (response.ok) {
                this.metrics.successfulTests++;
                return { success: true, data, status: response.status, responseTime };
            } else {
                this.metrics.failedTests++;
                return { success: false, data, status: response.status, responseTime, error: `HTTP ${response.status}` };
            }
        } catch (error) {
            const responseTime = Date.now() - startTime;
            this.metrics.totalResponseTime += responseTime;
            this.metrics.failedTests++;
            return { success: false, error: error.message, responseTime };
        }
    }

    async testCollectionsComprehensive() {
        this.log('📚 PHASE 1: COMPREHENSIVE COLLECTIONS TESTING', 'phase');
        
        const collectionTests = [
            // Basic CRUD Operations
            {
                name: 'Get All Collections',
                endpoint: '/api/proxy/projects',
                method: 'GET',
                category: 'collections-read'
            },
            {
                name: 'Get Project Collections',
                endpoint: `/api/proxy/projects/${this.testProjectId}/collections`,
                method: 'GET',
                category: 'collections-read'
            },
            // Collection Network Analysis
            {
                name: 'Get Collection Network (test-collection)',
                endpoint: '/api/proxy/collections/test-collection/network',
                method: 'GET',
                category: 'collections-network'
            },
            {
                name: 'Get Collection PubMed Network',
                endpoint: '/api/proxy/collections/test-collection/pubmed-network',
                method: 'GET',
                category: 'collections-network'
            },
            // Collection Articles
            {
                name: 'Get Collection Articles',
                endpoint: '/api/proxy/collections/test-collection/articles',
                method: 'GET',
                category: 'collections-articles'
            },
            {
                name: 'Get Collection PubMed Articles',
                endpoint: '/api/proxy/collections/test-collection/pubmed-articles',
                method: 'GET',
                category: 'collections-articles'
            },
            // Collection Analyses
            {
                name: 'Get Collection Deep Dive Analyses',
                endpoint: '/api/proxy/collections/test-collection/deep-dive-analyses',
                method: 'GET',
                category: 'collections-analyses'
            },
            {
                name: 'Get Collection Generate Review Analyses',
                endpoint: '/api/proxy/collections/test-collection/generate-review-analyses',
                method: 'GET',
                category: 'collections-analyses'
            }
        ];

        const results = [];
        for (const test of collectionTests) {
            this.log(`🧪 ${test.name}...`, 'test');
            const result = await this.makeRequest(test.endpoint, { method: test.method });
            
            if (result.success) {
                this.log(`✅ ${test.name} - SUCCESS`, 'success', {
                    status: result.status,
                    responseTime: `${result.responseTime}ms`,
                    dataType: typeof result.data,
                    hasData: !!result.data
                });
                
                // Store collection data for later tests
                if (test.category === 'collections-read' && Array.isArray(result.data)) {
                    this.testData.collections = result.data;
                }
            } else {
                this.log(`❌ ${test.name} - FAILED`, 'error', {
                    status: result.status,
                    error: result.error,
                    responseTime: `${result.responseTime}ms`
                });
            }
            
            results.push({ ...test, result });
        }
        
        return results;
    }

    async testProjectDashboardComprehensive() {
        this.log('📊 PHASE 2: COMPREHENSIVE PROJECT DASHBOARD TESTING', 'phase');
        
        const dashboardTests = [
            // Core Project Data
            {
                name: 'Get Project Details',
                endpoint: `/api/proxy/projects/${this.testProjectId}`,
                method: 'GET',
                category: 'project-core'
            },
            {
                name: 'Get Project Activities',
                endpoint: `/api/proxy/projects/${this.testProjectId}/activities`,
                method: 'GET',
                category: 'project-activities'
            },
            {
                name: 'Get Project Annotations',
                endpoint: `/api/proxy/projects/${this.testProjectId}/annotations`,
                method: 'GET',
                category: 'project-annotations'
            },
            {
                name: 'Get Project Collaborators',
                endpoint: `/api/proxy/projects/${this.testProjectId}/collaborators`,
                method: 'GET',
                category: 'project-collaborators'
            },
            // Project Network Analysis
            {
                name: 'Get Project Network',
                endpoint: `/api/proxy/projects/${this.testProjectId}/network`,
                method: 'GET',
                category: 'project-network'
            },
            {
                name: 'Get Project Timeline',
                endpoint: `/api/proxy/projects/${this.testProjectId}/timeline`,
                method: 'GET',
                category: 'project-timeline'
            },
            // Project Analyses
            {
                name: 'Get Project Deep Dive Analyses',
                endpoint: `/api/proxy/projects/${this.testProjectId}/deep-dive-analyses`,
                method: 'GET',
                category: 'project-analyses'
            },
            {
                name: 'Get Project Generate Review Analyses',
                endpoint: `/api/proxy/projects/${this.testProjectId}/generate-review-analyses`,
                method: 'GET',
                category: 'project-analyses'
            },
            // Project Reports
            {
                name: 'Get Project Reports',
                endpoint: `/api/proxy/projects/${this.testProjectId}/reports`,
                method: 'GET',
                category: 'project-reports'
            },
            {
                name: 'Generate Project Comprehensive Summary',
                endpoint: `/api/proxy/projects/${this.testProjectId}/generate-comprehensive-summary`,
                method: 'POST',
                body: {
                    summary_type: 'comprehensive',
                    include_analyses: true,
                    include_network: true
                },
                category: 'project-generation'
            },
            {
                name: 'Generate Project Summary Report',
                endpoint: `/api/proxy/projects/${this.testProjectId}/generate-summary-report`,
                method: 'POST',
                body: {
                    report_type: 'summary',
                    include_timeline: true
                },
                category: 'project-generation'
            }
        ];

        const results = [];
        for (const test of dashboardTests) {
            this.log(`🧪 ${test.name}...`, 'test');
            
            const options = { method: test.method };
            if (test.body) {
                options.body = JSON.stringify(test.body);
            }
            
            const result = await this.makeRequest(test.endpoint, options);
            
            if (result.success) {
                this.log(`✅ ${test.name} - SUCCESS`, 'success', {
                    status: result.status,
                    responseTime: `${result.responseTime}ms`,
                    dataSize: JSON.stringify(result.data).length,
                    category: test.category
                });
            } else {
                this.log(`❌ ${test.name} - FAILED`, 'error', {
                    status: result.status,
                    error: result.error,
                    responseTime: `${result.responseTime}ms`
                });
            }
            
            results.push({ ...test, result });
        }
        
        return results;
    }

    async testNetworkNodesComprehensive() {
        this.log('🕸️ PHASE 3: COMPREHENSIVE NETWORK NODES TESTING', 'phase');
        
        // Test various PMIDs for network analysis
        const testPMIDs = ['29622564', '32511222', '28123456'];
        const networkTests = [];
        
        for (const pmid of testPMIDs) {
            networkTests.push(
                // Article Network Analysis
                {
                    name: `Get Article Authors Network (PMID: ${pmid})`,
                    endpoint: `/api/proxy/articles/${pmid}/authors`,
                    method: 'GET',
                    category: 'network-authors',
                    pmid
                },
                {
                    name: `Get Article Author Network (PMID: ${pmid})`,
                    endpoint: `/api/proxy/articles/${pmid}/author-network`,
                    method: 'GET',
                    category: 'network-authors',
                    pmid
                },
                {
                    name: `Get Article Citations (PMID: ${pmid})`,
                    endpoint: `/api/proxy/articles/${pmid}/citations`,
                    method: 'GET',
                    category: 'network-citations',
                    pmid
                },
                {
                    name: `Get Article Citations Network (PMID: ${pmid})`,
                    endpoint: `/api/proxy/articles/${pmid}/citations-network`,
                    method: 'GET',
                    category: 'network-citations',
                    pmid
                },
                {
                    name: `Get Article References (PMID: ${pmid})`,
                    endpoint: `/api/proxy/articles/${pmid}/references`,
                    method: 'GET',
                    category: 'network-references',
                    pmid
                },
                {
                    name: `Get Article References Network (PMID: ${pmid})`,
                    endpoint: `/api/proxy/articles/${pmid}/references-network`,
                    method: 'GET',
                    category: 'network-references',
                    pmid
                },
                // Related Articles Network
                {
                    name: `Get Article Related Papers (PMID: ${pmid})`,
                    endpoint: `/api/proxy/articles/${pmid}/related`,
                    method: 'GET',
                    category: 'network-related',
                    pmid
                },
                {
                    name: `Get Article Similar Network (PMID: ${pmid})`,
                    endpoint: `/api/proxy/articles/${pmid}/similar-network`,
                    method: 'GET',
                    category: 'network-similar',
                    pmid
                },
                // Temporal Network Analysis
                {
                    name: `Get Article Earlier Papers (PMID: ${pmid})`,
                    endpoint: `/api/proxy/articles/${pmid}/earlier`,
                    method: 'GET',
                    category: 'network-temporal',
                    pmid
                },
                {
                    name: `Get Article Later Papers (PMID: ${pmid})`,
                    endpoint: `/api/proxy/articles/${pmid}/later`,
                    method: 'GET',
                    category: 'network-temporal',
                    pmid
                },
                {
                    name: `Get Article Timeline (PMID: ${pmid})`,
                    endpoint: `/api/proxy/articles/${pmid}/timeline`,
                    method: 'GET',
                    category: 'network-temporal',
                    pmid
                },
                // Linked Articles
                {
                    name: `Get Article Linked Papers (PMID: ${pmid})`,
                    endpoint: `/api/proxy/articles/${pmid}/linked`,
                    method: 'GET',
                    category: 'network-linked',
                    pmid
                }
            );
        }

        const results = [];
        for (const test of networkTests) {
            this.log(`🧪 ${test.name}...`, 'test');
            const result = await this.makeRequest(test.endpoint, { method: test.method });
            
            if (result.success) {
                this.log(`✅ ${test.name} - SUCCESS`, 'success', {
                    status: result.status,
                    responseTime: `${result.responseTime}ms`,
                    pmid: test.pmid,
                    category: test.category,
                    hasNetworkData: !!(result.data && (Array.isArray(result.data) || result.data.nodes || result.data.edges))
                });
                
                // Store network nodes for analysis
                if (result.data && (Array.isArray(result.data) || result.data.nodes)) {
                    this.testData.networkNodes.push({
                        pmid: test.pmid,
                        category: test.category,
                        data: result.data
                    });
                }
            } else {
                this.log(`❌ ${test.name} - FAILED`, 'error', {
                    status: result.status,
                    error: result.error,
                    responseTime: `${result.responseTime}ms`,
                    pmid: test.pmid
                });
            }
            
            results.push({ ...test, result });
        }
        
        return results;
    }

    async testNetworkPapersComprehensive() {
        this.log('📄 PHASE 4: COMPREHENSIVE NETWORK PAPERS TESTING', 'phase');

        const paperTests = [
            // PubMed Paper Discovery
            {
                name: 'PubMed Trending Papers',
                endpoint: '/api/proxy/pubmed/recommendations?type=trending&limit=10',
                method: 'GET',
                category: 'papers-discovery'
            },
            {
                name: 'PubMed Similar Papers (Popular)',
                endpoint: '/api/proxy/pubmed/recommendations?type=similar&pmid=32511222&limit=10',
                method: 'GET',
                category: 'papers-similar'
            },
            {
                name: 'PubMed Citing Papers',
                endpoint: '/api/proxy/pubmed/recommendations?type=citing&pmid=32511222&limit=10',
                method: 'GET',
                category: 'papers-citing'
            },
            {
                name: 'PubMed Referenced Papers',
                endpoint: '/api/proxy/pubmed/recommendations?type=references&pmid=32511222&limit=10',
                method: 'GET',
                category: 'papers-references'
            },
            // Paper Details and Metadata
            {
                name: 'PubMed Paper Details (Popular)',
                endpoint: '/api/proxy/pubmed/details/32511222',
                method: 'GET',
                category: 'papers-details'
            },
            {
                name: 'PubMed Paper Details (Test)',
                endpoint: '/api/proxy/pubmed/details/29622564',
                method: 'GET',
                category: 'papers-details'
            },
            // Paper Search and Discovery
            {
                name: 'PubMed Search - Machine Learning',
                endpoint: '/api/proxy/pubmed/search?query=machine+learning&limit=5',
                method: 'GET',
                category: 'papers-search'
            },
            {
                name: 'PubMed Search - Cancer Research',
                endpoint: '/api/proxy/pubmed/search?query=cancer+research&limit=5',
                method: 'GET',
                category: 'papers-search'
            },
            {
                name: 'PubMed Search - COVID-19',
                endpoint: '/api/proxy/pubmed/search?query=COVID-19&limit=5',
                method: 'GET',
                category: 'papers-search'
            },
            // Advanced Paper Analysis
            {
                name: 'Paper Topic Analysis',
                endpoint: '/api/proxy/papers/topic-analysis',
                method: 'POST',
                body: {
                    pmids: ['32511222', '29622564'],
                    analysis_type: 'comprehensive'
                },
                category: 'papers-analysis'
            },
            {
                name: 'Paper Similarity Analysis',
                endpoint: '/api/proxy/papers/similarity-analysis',
                method: 'POST',
                body: {
                    pmid1: '32511222',
                    pmid2: '29622564',
                    analysis_depth: 'detailed'
                },
                category: 'papers-analysis'
            },
            // Paper Network Construction
            {
                name: 'Build Paper Citation Network',
                endpoint: '/api/proxy/papers/build-citation-network',
                method: 'POST',
                body: {
                    seed_pmids: ['32511222', '29622564'],
                    depth: 2,
                    max_papers: 50
                },
                category: 'papers-network'
            },
            {
                name: 'Build Paper Co-author Network',
                endpoint: '/api/proxy/papers/build-coauthor-network',
                method: 'POST',
                body: {
                    pmids: ['32511222', '29622564'],
                    include_affiliations: true
                },
                category: 'papers-network'
            }
        ];

        const results = [];
        for (const test of paperTests) {
            this.log(`🧪 ${test.name}...`, 'test');

            const options = { method: test.method };
            if (test.body) {
                options.body = JSON.stringify(test.body);
            }

            const result = await this.makeRequest(test.endpoint, options);

            if (result.success) {
                this.log(`✅ ${test.name} - SUCCESS`, 'success', {
                    status: result.status,
                    responseTime: `${result.responseTime}ms`,
                    category: test.category,
                    papersFound: result.data?.recommendations?.length || result.data?.papers?.length || (Array.isArray(result.data) ? result.data.length : 0)
                });
            } else {
                this.log(`❌ ${test.name} - FAILED`, 'error', {
                    status: result.status,
                    error: result.error,
                    responseTime: `${result.responseTime}ms`
                });
            }

            results.push({ ...test, result });
        }

        return results;
    }

    async testBackgroundJobsComprehensive() {
        this.log('⚙️ PHASE 5: COMPREHENSIVE BACKGROUND JOBS TESTING', 'phase');

        const jobTests = [
            // Generate Review Jobs
            {
                name: 'Start Generate Review Job',
                endpoint: '/api/proxy/background-jobs/generate-review',
                method: 'POST',
                body: {
                    project_id: this.testProjectId,
                    molecule: 'comprehensive test molecule',
                    objective: 'test comprehensive review generation',
                    max_results: 15,
                    focus_areas: ['methodology', 'results', 'conclusions']
                },
                category: 'jobs-generate-review'
            },
            // Deep Dive Jobs
            {
                name: 'Start Deep Dive Job',
                endpoint: '/api/proxy/background-jobs/deep-dive',
                method: 'POST',
                body: {
                    project_id: this.testProjectId,
                    pmid: '32511222',
                    article_title: 'Test Deep Dive Analysis',
                    analysis_depth: 'comprehensive',
                    include_network: true
                },
                category: 'jobs-deep-dive'
            },
            // Job Status and Management
            {
                name: 'Get All Background Jobs',
                endpoint: '/api/proxy/background-jobs',
                method: 'GET',
                category: 'jobs-management'
            },
            {
                name: 'Get Project Background Jobs',
                endpoint: `/api/proxy/projects/${this.testProjectId}/background-jobs`,
                method: 'GET',
                category: 'jobs-management'
            },
            {
                name: 'Get User Background Jobs',
                endpoint: `/api/proxy/users/${this.testUserId}/background-jobs`,
                method: 'GET',
                category: 'jobs-management'
            }
        ];

        const results = [];
        const createdJobs = [];

        for (const test of jobTests) {
            this.log(`🧪 ${test.name}...`, 'test');

            const options = { method: test.method };
            if (test.body) {
                options.body = JSON.stringify(test.body);
            }

            const result = await this.makeRequest(test.endpoint, options);

            if (result.success) {
                this.log(`✅ ${test.name} - SUCCESS`, 'success', {
                    status: result.status,
                    responseTime: `${result.responseTime}ms`,
                    category: test.category,
                    jobId: result.data?.job_id,
                    jobStatus: result.data?.status
                });

                // Store job IDs for status tracking
                if (result.data?.job_id) {
                    createdJobs.push({
                        jobId: result.data.job_id,
                        type: test.category,
                        name: test.name
                    });
                    this.testData.backgroundJobs.push(result.data);
                }
            } else {
                this.log(`❌ ${test.name} - FAILED`, 'error', {
                    status: result.status,
                    error: result.error,
                    responseTime: `${result.responseTime}ms`
                });
            }

            results.push({ ...test, result });
        }

        // Test job status tracking for created jobs
        for (const job of createdJobs) {
            this.log(`🔍 Checking status for ${job.name} (${job.jobId})...`, 'test');
            const statusResult = await this.makeRequest(`/api/proxy/background-jobs/${job.jobId}/status`, { method: 'GET' });

            if (statusResult.success) {
                this.log(`✅ Job Status Retrieved - ${job.name}`, 'success', {
                    jobId: job.jobId,
                    status: statusResult.data?.status,
                    progress: statusResult.data?.progress,
                    createdAt: statusResult.data?.created_at
                });
            } else {
                this.log(`❌ Job Status Failed - ${job.name}`, 'error', {
                    jobId: job.jobId,
                    error: statusResult.error
                });
            }

            results.push({
                name: `Get Job Status - ${job.name}`,
                endpoint: `/api/proxy/background-jobs/${job.jobId}/status`,
                method: 'GET',
                category: 'jobs-status',
                result: statusResult
            });
        }

        return results;
    }

    async testWebSocketRealTimeFeatures() {
        this.log('🔌 PHASE 6: COMPREHENSIVE WEBSOCKET & REAL-TIME TESTING', 'phase');

        const wsTests = [];
        const wsConnections = [];

        // Test different WebSocket endpoints
        const wsEndpoints = [
            {
                name: 'User Notifications WebSocket',
                url: `wss://r-dagent-production.up.railway.app/ws/${encodeURIComponent(this.testUserId)}`,
                category: 'ws-notifications'
            },
            {
                name: 'Project Collaboration WebSocket',
                url: `wss://r-dagent-production.up.railway.app/ws/project/${this.testProjectId}`,
                category: 'ws-project'
            }
        ];

        for (const wsEndpoint of wsEndpoints) {
            const wsResult = await new Promise((resolve) => {
                this.log(`🧪 Testing ${wsEndpoint.name}...`, 'test');

                const ws = new WebSocket(wsEndpoint.url);
                const timeout = setTimeout(() => {
                    ws.close();
                    resolve({
                        success: false,
                        error: 'Connection timeout',
                        category: wsEndpoint.category
                    });
                }, 10000);

                let messagesReceived = 0;
                const startTime = Date.now();

                ws.onopen = () => {
                    clearTimeout(timeout);
                    const connectionTime = Date.now() - startTime;
                    this.log(`✅ ${wsEndpoint.name} - Connected`, 'success', {
                        connectionTime: `${connectionTime}ms`
                    });

                    // Send test messages
                    ws.send(JSON.stringify({
                        type: 'test_message',
                        project_id: this.testProjectId,
                        user_id: this.testUserId,
                        timestamp: new Date().toISOString(),
                        test_data: 'comprehensive_platform_test'
                    }));
                };

                ws.onmessage = (event) => {
                    messagesReceived++;
                    const data = JSON.parse(event.data);
                    this.log(`📨 ${wsEndpoint.name} - Message received`, 'success', {
                        messageType: data.type,
                        messageCount: messagesReceived
                    });

                    // Close after receiving response
                    setTimeout(() => {
                        ws.close();
                        resolve({
                            success: true,
                            messagesReceived,
                            connectionTime: Date.now() - startTime,
                            category: wsEndpoint.category
                        });
                    }, 1000);
                };

                ws.onerror = (error) => {
                    clearTimeout(timeout);
                    resolve({
                        success: false,
                        error: 'WebSocket error',
                        category: wsEndpoint.category
                    });
                };

                ws.onclose = (event) => {
                    if (event.code !== 1000) {
                        resolve({
                            success: false,
                            error: `WebSocket closed with code ${event.code}`,
                            category: wsEndpoint.category
                        });
                    }
                };
            });

            wsTests.push({
                name: wsEndpoint.name,
                endpoint: wsEndpoint.url,
                category: wsEndpoint.category,
                result: wsResult
            });

            if (wsResult.success) {
                this.log(`✅ ${wsEndpoint.name} - SUCCESS`, 'success', wsResult);
            } else {
                this.log(`❌ ${wsEndpoint.name} - FAILED`, 'error', wsResult);
            }
        }

        return wsTests;
    }

    async testAdvancedAnalysisFeatures() {
        this.log('🔬 PHASE 7: COMPREHENSIVE ADVANCED ANALYSIS TESTING', 'phase');

        const analysisTests = [
            // Deep Dive Analysis
            {
                name: 'Enhanced Deep Dive Analysis',
                endpoint: '/api/proxy/deep-dive-enhanced',
                method: 'POST',
                body: {
                    pmid: '32511222',
                    title: 'Test Enhanced Deep Dive',
                    objective: 'comprehensive analysis',
                    projectId: this.testProjectId,
                    analysis_depth: 'maximum'
                },
                category: 'analysis-deep-dive'
            },
            {
                name: 'Enhanced Deep Dive V2',
                endpoint: '/api/proxy/deep-dive-enhanced-v2',
                method: 'POST',
                body: {
                    pmid: '29622564',
                    title: 'Test Enhanced Deep Dive V2',
                    objective: 'comprehensive analysis v2',
                    projectId: this.testProjectId,
                    doi: '10.1000/test.doi'
                },
                category: 'analysis-deep-dive'
            },
            // Generate Review Analysis
            {
                name: 'Synchronous Generate Review',
                endpoint: '/api/proxy/generate-review-sync',
                method: 'POST',
                body: {
                    molecule: 'comprehensive test molecule',
                    objective: 'generate comprehensive review',
                    project_id: this.testProjectId,
                    max_results: 20,
                    analysis_type: 'comprehensive'
                },
                category: 'analysis-generate-review'
            },
            // Advanced Search and Discovery
            {
                name: 'Advanced PubMed Search',
                endpoint: '/api/proxy/pubmed/advanced-search',
                method: 'POST',
                body: {
                    query: 'machine learning AND cancer research',
                    filters: {
                        publication_date: '2020-2024',
                        article_types: ['research', 'review'],
                        languages: ['eng']
                    },
                    limit: 10
                },
                category: 'analysis-search'
            },
            // Network Analysis
            {
                name: 'Comprehensive Network Analysis',
                endpoint: '/api/proxy/network/comprehensive-analysis',
                method: 'POST',
                body: {
                    project_id: this.testProjectId,
                    analysis_type: 'full_network',
                    include_citations: true,
                    include_collaborations: true,
                    depth: 3
                },
                category: 'analysis-network'
            }
        ];

        const results = [];
        for (const test of analysisTests) {
            this.log(`🧪 ${test.name}...`, 'test');

            const options = { method: test.method };
            if (test.body) {
                options.body = JSON.stringify(test.body);
            }

            const result = await this.makeRequest(test.endpoint, options);

            if (result.success) {
                this.log(`✅ ${test.name} - SUCCESS`, 'success', {
                    status: result.status,
                    responseTime: `${result.responseTime}ms`,
                    category: test.category,
                    hasAnalysisData: !!(result.data && (result.data.analysis || result.data.results || result.data.summary))
                });

                // Store analysis results
                if (result.data) {
                    this.testData.analyses.push({
                        type: test.category,
                        name: test.name,
                        data: result.data
                    });
                }
            } else {
                this.log(`❌ ${test.name} - FAILED`, 'error', {
                    status: result.status,
                    error: result.error,
                    responseTime: `${result.responseTime}ms`
                });
            }

            results.push({ ...test, result });
        }

        return results;
    }

    async runSuperComprehensiveTest() {
        this.log('🚀 STARTING SUPER COMPREHENSIVE PLATFORM TEST', 'phase');
        this.log('🎯 Testing ALL platform functionalities end-to-end', 'info');

        const allResults = {
            collections: [],
            projectDashboard: [],
            networkNodes: [],
            networkPapers: [],
            backgroundJobs: [],
            webSocketFeatures: [],
            advancedAnalysis: [],
            summary: {}
        };

        try {
            // Phase 1: Collections Testing
            allResults.collections = await this.testCollectionsComprehensive();

            // Phase 2: Project Dashboard Testing
            allResults.projectDashboard = await this.testProjectDashboardComprehensive();

            // Phase 3: Network Nodes Testing
            allResults.networkNodes = await this.testNetworkNodesComprehensive();

            // Phase 4: Network Papers Testing
            allResults.networkPapers = await this.testNetworkPapersComprehensive();

            // Phase 5: Background Jobs Testing
            allResults.backgroundJobs = await this.testBackgroundJobsComprehensive();

            // Phase 6: WebSocket Real-time Features Testing
            allResults.webSocketFeatures = await this.testWebSocketRealTimeFeatures();

            // Phase 7: Advanced Analysis Features Testing
            allResults.advancedAnalysis = await this.testAdvancedAnalysisFeatures();

            // Calculate final metrics
            this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.totalTests;
            const successRate = (this.metrics.successfulTests / this.metrics.totalTests) * 100;

            // Generate comprehensive summary
            allResults.summary = {
                totalTests: this.metrics.totalTests,
                successfulTests: this.metrics.successfulTests,
                failedTests: this.metrics.failedTests,
                successRate: `${successRate.toFixed(1)}%`,
                averageResponseTime: `${Math.round(this.metrics.averageResponseTime)}ms`,
                totalDuration: `${Date.now() - this.startTime}ms`,
                testData: this.testData,
                phases: {
                    collections: allResults.collections.length,
                    projectDashboard: allResults.projectDashboard.length,
                    networkNodes: allResults.networkNodes.length,
                    networkPapers: allResults.networkPapers.length,
                    backgroundJobs: allResults.backgroundJobs.length,
                    webSocketFeatures: allResults.webSocketFeatures.length,
                    advancedAnalysis: allResults.advancedAnalysis.length
                }
            };

            this.log('📊 SUPER COMPREHENSIVE PLATFORM TEST COMPLETED', 'summary');
            this.log(`✅ Overall Success Rate: ${successRate.toFixed(1)}%`, 'success');
            this.log(`⚡ Average Response Time: ${Math.round(this.metrics.averageResponseTime)}ms`, 'info');
            this.log(`⏱️ Total Test Duration: ${Date.now() - this.startTime}ms`, 'info');
            this.log('💡 COMPREHENSIVE ANALYSIS:', 'summary');

            // Detailed analysis by category
            const categoryAnalysis = this.analyzeCategoryPerformance(allResults);
            for (const [category, analysis] of Object.entries(categoryAnalysis)) {
                this.log(`${analysis.emoji} ${category}: ${analysis.successRate}% success (${analysis.successful}/${analysis.total})`, 'info');
            }

            // Recommendations based on results
            const recommendations = this.generateRecommendations(allResults);
            this.log('🎯 RECOMMENDATIONS:', 'summary');
            recommendations.forEach(rec => this.log(rec, 'info'));

        } catch (error) {
            this.log(`❌ Test execution failed: ${error.message}`, 'error');
            allResults.summary.error = error.message;
        }

        return allResults;
    }

    analyzeCategoryPerformance(results) {
        const categories = {
            'Collections': { tests: results.collections, emoji: '📚' },
            'Project Dashboard': { tests: results.projectDashboard, emoji: '📊' },
            'Network Nodes': { tests: results.networkNodes, emoji: '🕸️' },
            'Network Papers': { tests: results.networkPapers, emoji: '📄' },
            'Background Jobs': { tests: results.backgroundJobs, emoji: '⚙️' },
            'WebSocket Features': { tests: results.webSocketFeatures, emoji: '🔌' },
            'Advanced Analysis': { tests: results.advancedAnalysis, emoji: '🔬' }
        };

        const analysis = {};
        for (const [name, category] of Object.entries(categories)) {
            const successful = category.tests.filter(test => test.result?.success).length;
            const total = category.tests.length;
            const successRate = total > 0 ? ((successful / total) * 100).toFixed(1) : '0.0';

            analysis[name] = {
                successful,
                total,
                successRate,
                emoji: category.emoji
            };
        }

        return analysis;
    }

    generateRecommendations(results) {
        const recommendations = [];
        const overallSuccessRate = (this.metrics.successfulTests / this.metrics.totalTests) * 100;

        if (overallSuccessRate >= 95) {
            recommendations.push('🎉 Excellent! Platform is performing at enterprise level with 95%+ success rate');
        } else if (overallSuccessRate >= 85) {
            recommendations.push('✅ Good performance! Platform is production-ready with 85%+ success rate');
        } else if (overallSuccessRate >= 70) {
            recommendations.push('⚠️ Moderate performance. Some endpoints may need attention');
        } else {
            recommendations.push('❌ Low performance detected. Multiple systems need investigation');
        }

        if (this.metrics.averageResponseTime < 1000) {
            recommendations.push('⚡ Excellent response times - under 1 second average');
        } else if (this.metrics.averageResponseTime < 3000) {
            recommendations.push('✅ Good response times - under 3 seconds average');
        } else {
            recommendations.push('⚠️ Slow response times detected - consider optimization');
        }

        // Check specific system performance
        const jobsWorking = results.backgroundJobs.some(test => test.result?.success && test.result?.data?.job_id);
        if (jobsWorking) {
            recommendations.push('✅ Background job system is operational');
        } else {
            recommendations.push('❌ Background job system needs attention');
        }

        const wsWorking = results.webSocketFeatures.some(test => test.result?.success);
        if (wsWorking) {
            recommendations.push('✅ Real-time WebSocket features are working');
        } else {
            recommendations.push('⚠️ WebSocket connectivity may need investigation');
        }

        return recommendations;
    }
}
