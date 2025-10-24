/**
 * COMPREHENSIVE R&D AGENT PLATFORM TEST v2.0
 * 
 * Tests all critical endpoints and UI components:
 * 1. Quick Actions (New Report, Generate Summary, Deep Dive Analysis, etc.)
 * 2. Project Workspace UI (Reports, Report Iterations, Deep Dive Analyses)
 * 3. Data accessibility and parsing verification
 * 4. PhD Analysis tab functionality
 * 5. Network View integration
 */

class ComprehensiveRDAgentTest {
    constructor() {
        // Force use of production frontend URL when running from file://
        this.frontendUrl = (window.location.protocol === 'file:')
            ? 'https://frontend-psi-seven-85.vercel.app'
            : window.location.origin;
        this.projectId = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
        this.testUserId = 'fredericle77@gmail.com';
        this.results = [];
        this.startTime = Date.now();
        this.testData = {
            reports: [],
            analyses: [],
            iterations: [],
            errors: []
        };
    }

    log(message, type = 'info', data = null) {
        const timestamp = new Date().toISOString();
        const elapsed = Date.now() - this.startTime;
        const emoji = {
            'info': 'ℹ️', 'success': '✅', 'warning': '⚠️', 'error': '❌',
            'test': '🧪', 'ui': '🎨', 'api': '🌐', 'data': '📊'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} [${timestamp}] [+${elapsed}ms] ${message}`);
        if (data) console.log('   Data:', data);
        this.results.push({ timestamp, type, message, data, elapsed });
    }

    async testQuickActionsEndpoints() {
        this.log('🚀 Testing Quick Actions Endpoints', 'test');
        
        const quickActions = [
            {
                name: 'New Report',
                endpoint: `/api/proxy/projects/${this.projectId}/generate-summary-report`,
                method: 'POST',
                payload: {
                    molecule: 'machine learning in healthcare diagnostics',
                    objective: 'Comprehensive analysis of ML applications in medical diagnostics',
                    preference: 'precision',
                    clinical_mode: true
                }
            },
            {
                name: 'Generate Summary',
                endpoint: `/api/proxy/generate-summary`,
                method: 'POST',
                payload: {
                    project_id: this.projectId,
                    objective: 'Generate comprehensive project summary',
                    summary_type: 'comprehensive',
                    academic_level: 'phd'
                }
            },
            {
                name: 'Deep Dive Analysis',
                endpoint: `/api/proxy/deep-dive-analyses`,
                method: 'POST',
                payload: {
                    objective: 'Test deep dive analysis generation for machine learning in medical diagnostics',
                    article_pmid: '38278529',  // CORRECTED: was 'pmid'
                    article_title: 'Machine Learning in Medical Diagnostics: A Comprehensive Review',  // CORRECTED: was 'title'
                    article_url: 'https://pubmed.ncbi.nlm.nih.gov/38278529/'  // CORRECTED: was 'url'
                }
            },
            {
                name: 'Comprehensive Analysis',
                endpoint: `/api/proxy/projects/${this.projectId}/generate-comprehensive-summary`,
                method: 'POST',
                payload: {
                    analysis_type: 'comprehensive',
                    include_methodology_synthesis: true,
                    include_gap_analysis: true,
                    academic_level: 'phd'
                }
            },
            {
                name: 'Literature Gap Analysis',
                endpoint: `/api/proxy/literature-gap-analysis`,
                method: 'POST',
                payload: {
                    project_id: this.projectId,
                    objective: 'Identify research gaps in machine learning applications for medical diagnostics',
                    gap_types: ['theoretical', 'methodological', 'empirical'],
                    domain_focus: 'medical_diagnostics',
                    severity_threshold: 'moderate',
                    academic_level: 'phd',
                    analysis_depth: 'comprehensive',
                    include_methodology_gaps: true
                }
            },
            {
                name: 'Methodology Synthesis',
                endpoint: `/api/proxy/methodology-synthesis`,
                method: 'POST',
                payload: {
                    project_id: this.projectId,
                    objective: 'Synthesize research methodologies for machine learning in medical diagnostics',
                    methodology_types: ['experimental', 'observational', 'computational'],
                    include_statistical_methods: true,
                    include_validation: true,
                    comparison_depth: 'detailed',
                    academic_level: 'phd',
                    synthesis_type: 'comprehensive_comparative'
                }
            },
            {
                name: 'Thesis Chapter Generator',
                endpoint: `/api/proxy/thesis-chapter-generator`,
                method: 'POST',
                payload: {
                    project_id: this.projectId,
                    objective: 'Generate thesis chapter structure for machine learning in medical diagnostics research',
                    chapter_focus: 'comprehensive',
                    academic_level: 'phd',
                    citation_style: 'apa',
                    target_length: 80000,
                    include_timeline: true
                }
            }
        ];

        const endpointResults = {};

        for (const action of quickActions) {
            this.log(`🧪 Testing ${action.name}...`, 'test');
            
            try {
                const response = await fetch(action.endpoint, {
                    method: action.method,
                    headers: {
                        'Content-Type': 'application/json',
                        'User-ID': this.testUserId
                    },
                    body: JSON.stringify(action.payload)
                });

                const responseData = await response.json();

                endpointResults[action.name] = {
                    status: response.status,
                    ok: response.ok,
                    hasData: !!responseData,
                    dataKeys: Object.keys(responseData || {}),
                    error: !response.ok ? responseData.error : null
                };

                if (response.ok) {
                    this.log(`✅ ${action.name}: SUCCESS`, 'success', {
                        status: response.status,
                        dataKeys: Object.keys(responseData || {}).slice(0, 5)
                    });
                    
                    // Store successful results for later testing
                    if (action.name.includes('Report') || action.name.includes('Summary')) {
                        this.testData.reports.push(responseData);
                    } else if (action.name.includes('Analysis')) {
                        this.testData.analyses.push(responseData);
                    }
                } else {
                    this.log(`❌ ${action.name}: FAILED`, 'error', {
                        status: response.status,
                        error: responseData.error
                    });
                    this.testData.errors.push({ action: action.name, error: responseData.error });
                }

            } catch (error) {
                this.log(`❌ ${action.name}: NETWORK ERROR`, 'error', error.message);
                endpointResults[action.name] = {
                    status: 0,
                    ok: false,
                    error: error.message
                };
                this.testData.errors.push({ action: action.name, error: error.message });
            }

            // Wait between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return endpointResults;
    }

    async testProjectWorkspaceData() {
        this.log('📊 Testing Project Workspace Data Retrieval', 'data');
        
        const workspaceEndpoints = [
            {
                name: 'Reports List',
                endpoint: `/api/proxy/projects/${this.projectId}/reports`,
                method: 'GET'
            },
            {
                name: 'Deep Dive Analyses List',
                endpoint: `/api/proxy/projects/${this.projectId}/deep-dive-analyses`,
                method: 'GET'
            },
            {
                name: 'Collections List',
                endpoint: `/api/proxy/projects/${this.projectId}/collections`,
                method: 'GET'
            }
        ];

        const workspaceData = {};

        for (const endpoint of workspaceEndpoints) {
            try {
                const response = await fetch(endpoint.endpoint, {
                    method: endpoint.method,
                    headers: {
                        'Content-Type': 'application/json',
                        'User-ID': this.testUserId
                    }
                });

                const data = await response.json();
                
                workspaceData[endpoint.name] = {
                    status: response.status,
                    ok: response.ok,
                    count: Array.isArray(data) ? data.length : (data.reports?.length || data.analyses?.length || 0),
                    items: Array.isArray(data) ? data.slice(0, 3) : (data.reports?.slice(0, 3) || data.analyses?.slice(0, 3) || [])
                };

                if (response.ok) {
                    this.log(`✅ ${endpoint.name}: ${workspaceData[endpoint.name].count} items found`, 'success');
                } else {
                    this.log(`❌ ${endpoint.name}: Failed to fetch`, 'error');
                }

            } catch (error) {
                this.log(`❌ ${endpoint.name}: Network error`, 'error', error.message);
                workspaceData[endpoint.name] = { status: 0, ok: false, error: error.message };
            }
        }

        return workspaceData;
    }

    async testIndividualReportAccess() {
        this.log('📄 Testing Individual Report/Analysis Access', 'test');
        
        // Test specific report IDs from your examples
        const testItems = [
            { type: 'report', id: 'ea457710-c706-4275-b1cc-84aa65292d35' },
            { type: 'report', id: 'caf44086-3a9c-4399-b323-ddc43a6cca13' },
            { type: 'analysis', id: 'ff45c139-c343-4c84-9403-381c9d773b20' }
        ];

        const accessResults = {};

        for (const item of testItems) {
            const endpoint = item.type === 'report'
                ? `/api/proxy/reports/${item.id}`
                : `/api/proxy/analyses/${item.id}`;  // Note: This endpoint works for individual analysis access

            try {
                const response = await fetch(endpoint, {
                    headers: {
                        'Content-Type': 'application/json',
                        'User-ID': this.testUserId
                    }
                });

                const data = await response.json();

                accessResults[`${item.type}_${item.id}`] = {
                    status: response.status,
                    ok: response.ok,
                    hasContent: this.validateContentStructure(data, item.type),
                    contentKeys: Object.keys(data || {}),
                    processingStatus: data.processing_status,
                    contentLength: this.getContentLength(data),
                    isEmpty: this.isContentEmpty(data)
                };

                if (response.ok) {
                    this.log(`✅ ${item.type} ${item.id}: Accessible`, 'success', {
                        status: data.processing_status,
                        hasContent: !this.isContentEmpty(data),
                        contentLength: this.getContentLength(data)
                    });
                } else {
                    this.log(`❌ ${item.type} ${item.id}: Not accessible`, 'error', response.status);
                }

            } catch (error) {
                this.log(`❌ ${item.type} ${item.id}: Network error`, 'error', error.message);
                accessResults[`${item.type}_${item.id}`] = { status: 0, ok: false, error: error.message };
            }
        }

        return accessResults;
    }

    validateContentStructure(data, type) {
        if (!data) return false;

        if (type === 'report') {
            return !!(data.title && (data.content || data.objective));
        } else if (type === 'analysis') {
            return !!(data.article_title && (
                data.scientific_model_analysis || 
                data.experimental_methods_analysis || 
                data.results_interpretation_analysis
            ));
        }
        return false;
    }

    getContentLength(data) {
        if (!data) return 0;
        
        let totalLength = 0;
        
        // For reports
        if (data.content) {
            if (typeof data.content === 'string') {
                totalLength += data.content.length;
            } else if (typeof data.content === 'object') {
                totalLength += JSON.stringify(data.content).length;
            }
        }
        
        // For analyses
        ['scientific_model_analysis', 'experimental_methods_analysis', 'results_interpretation_analysis'].forEach(key => {
            if (data[key]) {
                totalLength += JSON.stringify(data[key]).length;
            }
        });
        
        return totalLength;
    }

    isContentEmpty(data) {
        if (!data) return true;
        
        const contentLength = this.getContentLength(data);
        
        // Check for placeholder patterns
        const dataStr = JSON.stringify(data).toLowerCase();
        const hasPlaceholders = dataStr.includes('placeholder') || 
                               dataStr.includes('test data') ||
                               dataStr.includes('key assumption 1') ||
                               dataStr.includes('method 1');
        
        return contentLength < 100 || hasPlaceholders;
    }

    async testNetworkViewIntegration() {
        this.log('🌐 Testing Network View Integration', 'test');
        
        const testPmid = '38278529';
        const networkEndpoints = [
            `/api/proxy/pubmed/network?pmid=${testPmid}&type=mixed&limit=20`,
            `/api/proxy/articles/${testPmid}/citations-network?limit=10`,
            `/api/proxy/articles/${testPmid}/references-network?limit=10`
        ];

        const networkResults = {};

        for (const endpoint of networkEndpoints) {
            try {
                const response = await fetch(endpoint, {
                    headers: { 'User-ID': this.testUserId }
                });

                const data = await response.json();
                
                networkResults[endpoint] = {
                    status: response.status,
                    ok: response.ok,
                    nodes: data.nodes?.length || 0,
                    edges: data.edges?.length || 0,
                    hasRichData: (data.nodes?.length || 0) > 1
                };

                if (response.ok && data.nodes?.length > 1) {
                    this.log(`✅ Network endpoint working: ${endpoint}`, 'success', {
                        nodes: data.nodes.length,
                        edges: data.edges?.length || 0,
                        hasRichData: true
                    });
                } else {
                    this.log(`⚠️ Network endpoint limited data: ${endpoint}`, 'warning', {
                        nodes: data.nodes?.length || 0,
                        status: response.status
                    });
                }

            } catch (error) {
                this.log(`❌ Network endpoint failed: ${endpoint}`, 'error', error.message);
                networkResults[endpoint] = { status: 0, ok: false, error: error.message };
            }
        }

        return networkResults;
    }

    async testUIDataParsing() {
        this.log('🎨 Testing UI Data Parsing and Display', 'ui');

        // Test if we can access the current page's data
        const currentUrl = window.location.href;
        const uiTests = {
            currentPage: currentUrl,
            pageType: this.detectPageType(currentUrl),
            domElements: {},
            dataPresence: {}
        };

        // Check for key UI elements
        const keySelectors = [
            { name: 'Reports Section', selector: '[data-testid="reports-section"], .reports-section, h2:contains("Reports")' },
            { name: 'Deep Dive Analyses', selector: '[data-testid="analyses-section"], .analyses-section, h2:contains("Deep Dive")' },
            { name: 'Report Iterations', selector: '[data-testid="iterations-section"], .iterations-section, h2:contains("Iterations")' },
            { name: 'PhD Analysis Tab', selector: '[data-testid="phd-analysis"], .phd-analysis, [role="tab"]:contains("PhD")' },
            { name: 'Network View', selector: '[data-testid="network-view"], .network-view, .react-flow' },
            { name: 'Content Area', selector: '[data-testid="content"], .content, main, .main-content' }
        ];

        keySelectors.forEach(({ name, selector }) => {
            try {
                const elements = document.querySelectorAll(selector);
                uiTests.domElements[name] = {
                    found: elements.length > 0,
                    count: elements.length,
                    visible: Array.from(elements).some(el => el.offsetParent !== null)
                };
            } catch (e) {
                uiTests.domElements[name] = { found: false, error: e.message };
            }
        });

        // Check for data in the page
        const pageText = document.body.textContent || '';
        uiTests.dataPresence = {
            hasReports: pageText.includes('report') || pageText.includes('Report'),
            hasAnalyses: pageText.includes('analysis') || pageText.includes('Analysis'),
            hasContent: pageText.length > 1000,
            hasPlaceholders: pageText.includes('placeholder') || pageText.includes('No data') || pageText.includes('Loading'),
            isEmpty: pageText.trim().length < 100
        };

        this.log('🎨 UI Data Parsing Results', 'ui', uiTests);
        return uiTests;
    }

    detectPageType(url) {
        if (url.includes('/report/')) return 'report';
        if (url.includes('/analysis/')) return 'analysis';
        if (url.includes('/project/')) return 'project';
        return 'unknown';
    }

    async testSpecificReportParsing() {
        this.log('📄 Testing Specific Report Content Parsing', 'test');

        // Test the specific reports you mentioned
        const reportIds = [
            'ea457710-c706-4275-b1cc-84aa65292d35',
            'caf44086-3a9c-4399-b323-ddc43a6cca13'
        ];

        const analysisId = 'ff45c139-c343-4c84-9403-381c9d773b20';

        const parsingResults = {};

        // Test reports
        for (const reportId of reportIds) {
            try {
                const response = await fetch(`/api/proxy/reports/${reportId}`, {
                    headers: { 'User-ID': this.testUserId }
                });

                const data = await response.json();

                parsingResults[`report_${reportId}`] = {
                    status: response.status,
                    ok: response.ok,
                    structure: this.analyzeDataStructure(data),
                    contentAnalysis: this.analyzeContent(data),
                    parsingIssues: this.identifyParsingIssues(data)
                };

            } catch (error) {
                parsingResults[`report_${reportId}`] = { error: error.message };
            }
        }

        // Test analysis
        try {
            const response = await fetch(`/api/proxy/analyses/${analysisId}`, {
                headers: { 'User-ID': this.testUserId }
            });  // Note: This endpoint works for individual analysis access

            const data = await response.json();

            parsingResults[`analysis_${analysisId}`] = {
                status: response.status,
                ok: response.ok,
                structure: this.analyzeDataStructure(data),
                contentAnalysis: this.analyzeContent(data),
                parsingIssues: this.identifyParsingIssues(data)
            };

        } catch (error) {
            parsingResults[`analysis_${analysisId}`] = { error: error.message };
        }

        return parsingResults;
    }

    analyzeDataStructure(data) {
        if (!data) return { valid: false, reason: 'No data' };

        return {
            valid: true,
            keys: Object.keys(data),
            hasTitle: !!(data.title || data.article_title),
            hasContent: !!(data.content || data.scientific_model_analysis || data.experimental_methods_analysis),
            hasStatus: !!data.processing_status,
            dataType: typeof data,
            nestedObjects: Object.values(data).filter(v => typeof v === 'object' && v !== null).length
        };
    }

    analyzeContent(data) {
        if (!data) return { empty: true };

        const dataStr = JSON.stringify(data);

        return {
            totalLength: dataStr.length,
            hasPlaceholderData: dataStr.includes('placeholder') || dataStr.includes('Key assumption 1') || dataStr.includes('Method 1'),
            hasRealContent: dataStr.length > 500 && !dataStr.includes('placeholder'),
            contentTypes: {
                hasText: typeof data.content === 'string',
                hasObject: typeof data.content === 'object',
                hasAnalysis: !!(data.scientific_model_analysis || data.experimental_methods_analysis),
                hasObjective: !!data.objective
            }
        };
    }

    identifyParsingIssues(data) {
        const issues = [];

        if (!data) {
            issues.push('No data received');
            return issues;
        }

        // Check for common parsing issues
        if (data.processing_status === 'processing') {
            issues.push('Still in processing state');
        }

        if (data.content && typeof data.content === 'string' && data.content.startsWith('{')) {
            try {
                JSON.parse(data.content);
                issues.push('Content is JSON string instead of parsed object');
            } catch (e) {
                issues.push('Content appears to be malformed JSON string');
            }
        }

        if (data.objective && typeof data.objective === 'object') {
            issues.push('Objective is object instead of string (may cause React rendering errors)');
        }

        const dataStr = JSON.stringify(data);
        if (dataStr.includes('Key assumption 1') || dataStr.includes('Method 1')) {
            issues.push('Contains placeholder/test data instead of real analysis');
        }

        if (dataStr.length < 200) {
            issues.push('Content appears too short for meaningful analysis');
        }

        return issues;
    }

    async runComprehensiveTest() {
        this.log('🚀 STARTING COMPREHENSIVE R&D AGENT PLATFORM TEST', 'test');
        this.log(`Testing project: ${this.projectId}`, 'info');
        this.log(`Frontend URL: ${this.frontendUrl}`, 'info');

        const testResults = {
            quickActions: {},
            workspaceData: {},
            individualAccess: {},
            networkView: {},
            uiParsing: {},
            specificReports: {},
            summary: {
                totalTests: 0,
                passedTests: 0,
                failedTests: 0,
                issues: []
            }
        };

        // Test 1: Quick Actions Endpoints
        this.log('📋 Phase 1: Testing Quick Actions Endpoints', 'test');
        testResults.quickActions = await this.testQuickActionsEndpoints();

        // Test 2: Project Workspace Data
        this.log('📋 Phase 2: Testing Project Workspace Data', 'test');
        testResults.workspaceData = await this.testProjectWorkspaceData();

        // Test 3: Individual Report/Analysis Access
        this.log('📋 Phase 3: Testing Individual Report/Analysis Access', 'test');
        testResults.individualAccess = await this.testIndividualReportAccess();

        // Test 4: Network View Integration
        this.log('📋 Phase 4: Testing Network View Integration', 'test');
        testResults.networkView = await this.testNetworkViewIntegration();

        // Test 5: UI Data Parsing
        this.log('📋 Phase 5: Testing UI Data Parsing', 'test');
        testResults.uiParsing = await this.testUIDataParsing();

        // Test 6: Specific Report Content Parsing
        this.log('📋 Phase 6: Testing Specific Report Content Parsing', 'test');
        testResults.specificReports = await this.testSpecificReportParsing();

        // Generate comprehensive report
        this.generateComprehensiveReport(testResults);

        return testResults;
    }

    generateComprehensiveReport(testResults) {
        this.log('📋 COMPREHENSIVE R&D AGENT TEST REPORT', 'test');
        
        console.log('\n🎯 COMPREHENSIVE R&D AGENT PLATFORM TEST RESULTS');
        console.log('==================================================');
        console.log(`   Test Duration: ${Math.round((Date.now() - this.startTime) / 1000)}s`);
        console.log(`   Project ID: ${this.projectId}`);
        console.log(`   Test User: ${this.testUserId}`);
        
        // Quick Actions Results
        console.log('\n🚀 QUICK ACTIONS ENDPOINTS:');
        Object.entries(testResults.quickActions).forEach(([action, result]) => {
            const status = result.ok ? '✅' : '❌';
            console.log(`   ${status} ${action}: ${result.status} ${result.ok ? 'SUCCESS' : 'FAILED'}`);
            if (result.error) console.log(`      Error: ${result.error}`);
        });

        // Workspace Data Results
        console.log('\n📊 PROJECT WORKSPACE DATA:');
        Object.entries(testResults.workspaceData).forEach(([endpoint, result]) => {
            const status = result.ok ? '✅' : '❌';
            console.log(`   ${status} ${endpoint}: ${result.count || 0} items`);
        });

        // Individual Access Results
        console.log('\n📄 INDIVIDUAL REPORT/ANALYSIS ACCESS:');
        Object.entries(testResults.individualAccess).forEach(([item, result]) => {
            const status = result.ok ? '✅' : '❌';
            const contentStatus = result.isEmpty ? '(EMPTY)' : result.hasContent ? '(HAS CONTENT)' : '(NO CONTENT)';
            console.log(`   ${status} ${item}: ${result.status} ${contentStatus}`);
            if (result.processingStatus) console.log(`      Status: ${result.processingStatus}`);
            if (result.contentLength) console.log(`      Content Length: ${result.contentLength} chars`);
        });

        // Network View Results
        console.log('\n🌐 NETWORK VIEW INTEGRATION:');
        Object.entries(testResults.networkView).forEach(([endpoint, result]) => {
            const status = result.hasRichData ? '✅' : '⚠️';
            console.log(`   ${status} Network: ${result.nodes || 0} nodes, ${result.edges || 0} edges`);
        });

        // Issues Summary
        console.log('\n🔍 IDENTIFIED ISSUES:');
        const issues = [];
        
        // Check for empty content
        Object.entries(testResults.individualAccess).forEach(([item, result]) => {
            if (result.ok && result.isEmpty) {
                issues.push(`${item}: Content appears empty or contains placeholder data`);
            }
        });
        
        // Check for failed endpoints
        Object.entries(testResults.quickActions).forEach(([action, result]) => {
            if (!result.ok) {
                issues.push(`${action}: Endpoint not working (${result.status})`);
            }
        });

        if (issues.length === 0) {
            console.log('   🎉 No critical issues found!');
        } else {
            issues.forEach(issue => console.log(`   ❌ ${issue}`));
        }

        // Overall Assessment
        const totalEndpoints = Object.keys(testResults.quickActions).length + 
                              Object.keys(testResults.workspaceData).length + 
                              Object.keys(testResults.individualAccess).length;
        
        const workingEndpoints = Object.values(testResults.quickActions).filter(r => r.ok).length +
                                Object.values(testResults.workspaceData).filter(r => r.ok).length +
                                Object.values(testResults.individualAccess).filter(r => r.ok).length;

        const successRate = ((workingEndpoints / totalEndpoints) * 100).toFixed(1);

        console.log(`\n🎯 OVERALL ASSESSMENT:`);
        console.log(`   Working Endpoints: ${workingEndpoints}/${totalEndpoints}`);
        console.log(`   Success Rate: ${successRate}%`);
        console.log(`   Critical Issues: ${issues.length}`);
        
        if (successRate >= 90 && issues.length === 0) {
            console.log('   Status: 🎉 EXCELLENT - Platform fully functional');
        } else if (successRate >= 75) {
            console.log('   Status: ✅ GOOD - Minor issues remain');
        } else {
            console.log('   Status: ⚠️ NEEDS ATTENTION - Significant issues found');
        }
        
        console.log('\n🎯 COMPREHENSIVE TEST COMPLETED');
        
        return {
            successRate: parseFloat(successRate),
            workingEndpoints,
            totalEndpoints,
            issues: issues.length,
            status: successRate >= 90 && issues.length === 0 ? 'EXCELLENT' : successRate >= 75 ? 'GOOD' : 'NEEDS_ATTENTION'
        };
    }
}

// Auto-run the test
window.testRDAgent = new ComprehensiveRDAgentTest();

// Quick test function
window.runRDAgentTest = () => {
    return window.testRDAgent.runComprehensiveTest();
};

console.log('🎯 Comprehensive R&D Agent Test loaded!');
console.log('Run: runRDAgentTest() to start the complete test');
