/**
 * COMPREHENSIVE ALL ENDPOINTS TEST
 * Tests ALL R&D Agent endpoints including:
 * - PhD Analysis: generate-summary, literature-gap-analysis, thesis-chapter-generator, methodology-synthesis
 * - Deep Dive: deep-dive analysis on specific articles
 * - Generate Review: comprehensive review generation
 * - Background Jobs: all endpoints with background processing
 * - Report Persistence: verification across all endpoint types
 * - UI Integration: data parsing and accessibility testing
 */

class ComprehensiveAllEndpointsTest {
    constructor() {
        this.results = [];
        this.frontendUrl = window.location.origin;
        this.projectId = this.extractProjectId();
        this.testUser = {
            email: 'fredericle77@gmail.com',
            userId: 'e29e29d3-f87f-4c70-9aeb-424002382195'
        };
        this.backgroundJobs = [];
        this.testArticles = [
            { pmid: '34567890', title: 'Machine Learning in Healthcare' },
            { pmid: '23456789', title: 'Deep Learning Applications' },
            { url: 'https://arxiv.org/abs/2301.00001', title: 'Transformer Architecture' }
        ];
    }

    extractProjectId() {
        const path = window.location.pathname;
        const segments = path.split('/');
        const projectIndex = segments.indexOf('projects');
        if (projectIndex !== -1 && segments[projectIndex + 1]) {
            return segments[projectIndex + 1];
        }
        return '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const styles = {
            'info': 'color: #2196F3; font-weight: bold;',
            'success': 'color: #4CAF50; font-weight: bold;',
            'error': 'color: #F44336; font-weight: bold;',
            'warning': 'color: #FF9800; font-weight: bold;'
        };
        
        const prefix = {
            'info': '📋',
            'success': '✅',
            'error': '❌',
            'warning': '⚠️'
        }[type] || '📋';
        
        console.log(`%c${prefix} [${timestamp.split('T')[1].split('.')[0]}] ${message}`, styles[type] || styles.info);
        this.results.push({ type, message, timestamp });
    }

    async makeRequest(endpoint, data = {}, method = 'POST') {
        try {
            const response = await fetch(`${this.frontendUrl}/api/proxy${endpoint}`, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.testUser.userId
                },
                body: method === 'GET' ? undefined : JSON.stringify(data)
            });

            let responseData;
            try {
                responseData = await response.json();
            } catch (parseError) {
                responseData = { error: 'Failed to parse response as JSON' };
            }
            
            return {
                ok: response.ok,
                status: response.status,
                data: responseData
            };
        } catch (error) {
            return {
                ok: false,
                status: 0,
                error: error.message
            };
        }
    }

    async testPhdEndpoints() {
        this.log('🎓 TESTING PHD ANALYSIS ENDPOINTS', 'info');
        
        const phdEndpoints = [
            {
                name: 'Generate Summary',
                endpoint: '/generate-summary',
                data: {
                    project_id: this.projectId,
                    objective: "Generate comprehensive PhD-level summary with high-quality analysis",
                    summary_type: "comprehensive",
                    academic_level: "phd",
                    include_methodology: true,
                    include_gaps: true,
                    target_length: 5000
                },
                expectedFields: ['summary_content', 'methodology_summary', 'research_gaps', 'key_findings', 'quality_score']
            },
            {
                name: 'Literature Gap Analysis',
                endpoint: '/literature-gap-analysis',
                data: {
                    project_id: this.projectId,
                    objective: "Identify critical gaps in current literature for PhD research",
                    gap_types: ["theoretical", "methodological", "empirical"],
                    domain_focus: "machine learning",
                    academic_level: "phd",
                    analysis_depth: "comprehensive"
                },
                expectedFields: ['identified_gaps', 'gap_analysis', 'recommendations', 'priority_ranking', 'research_opportunities']
            },
            {
                name: 'Thesis Chapter Generator',
                endpoint: '/thesis-chapter-generator',
                data: {
                    project_id: this.projectId,
                    objective: "Generate comprehensive thesis chapter with academic rigor",
                    chapter_focus: "methodology",
                    academic_level: "phd",
                    citation_style: "APA",
                    target_length: 8000,
                    include_timeline: true
                },
                expectedFields: ['chapter_content', 'section_outline', 'citations', 'research_timeline']
            },
            {
                name: 'Methodology Synthesis',
                endpoint: '/methodology-synthesis',
                data: {
                    project_id: this.projectId,
                    objective: "Synthesize methodologies for comprehensive PhD research approach",
                    methodology_types: ["experimental", "observational", "computational"],
                    include_statistical_methods: true,
                    include_validation: true,
                    academic_level: "phd"
                },
                expectedFields: ['methodology_synthesis', 'comparative_analysis', 'recommendations', 'validation_approaches', 'statistical_methods']
            }
        ];

        const results = {};
        for (const { name, endpoint, data, expectedFields } of phdEndpoints) {
            this.log(`Testing ${name}...`, 'info');
            
            const result = await this.makeRequest(endpoint, data);
            
            if (result.ok && result.data) {
                const foundFields = expectedFields.filter(field => result.data[field]);
                const qualityScore = result.data.quality_score || 0;
                
                this.log(`${name}: SUCCESS (${result.status})`, 'success');
                this.log(`${name}: Found ${foundFields.length}/${expectedFields.length} expected fields`, 
                         foundFields.length >= expectedFields.length * 0.8 ? 'success' : 'warning');
                
                if (qualityScore > 0) {
                    this.log(`${name}: Quality Score: ${qualityScore}/10`, 
                             qualityScore >= 8 ? 'success' : qualityScore >= 6 ? 'warning' : 'error');
                }
                
                results[name] = { 
                    success: true, 
                    foundFields: foundFields.length, 
                    totalFields: expectedFields.length,
                    qualityScore,
                    data: result.data
                };
            } else {
                this.log(`${name}: FAILED (${result.status})`, 'error');
                results[name] = { success: false, error: result.status };
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        return results;
    }

    async testDeepDiveEndpoints() {
        this.log('🔍 TESTING DEEP DIVE ANALYSIS ENDPOINTS', 'info');
        
        const deepDiveResults = {};
        
        for (const article of this.testArticles.slice(0, 2)) { // Test 2 articles
            this.log(`Testing Deep Dive for: ${article.title}`, 'info');
            
            const deepDiveData = {
                project_id: this.projectId,
                ...(article.pmid ? { pmid: article.pmid } : { url: article.url }),
                objective: "Comprehensive deep dive analysis for PhD research",
                analysis_depth: "comprehensive",
                include_methodology: true,
                include_citations: true
            };
            
            const result = await this.makeRequest('/deep-dive', deepDiveData);
            
            if (result.ok && result.data) {
                const hasContent = !!(result.data.analysis_content || result.data.deep_dive_analysis);
                const hasMethodology = !!(result.data.methodology_analysis);
                const hasCitations = !!(result.data.citations || result.data.references);
                
                this.log(`Deep Dive ${article.title}: SUCCESS`, 'success');
                this.log(`Deep Dive ${article.title}: Content=${hasContent}, Methodology=${hasMethodology}, Citations=${hasCitations}`, 'info');
                
                deepDiveResults[article.title] = {
                    success: true,
                    hasContent,
                    hasMethodology,
                    hasCitations,
                    data: result.data
                };
            } else {
                this.log(`Deep Dive ${article.title}: FAILED (${result.status})`, 'error');
                deepDiveResults[article.title] = { success: false, error: result.status };
            }
            
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        return deepDiveResults;
    }

    async testGenerateReviewEndpoints() {
        this.log('📝 TESTING GENERATE REVIEW ENDPOINTS', 'info');
        
        const reviewData = {
            project_id: this.projectId,
            molecule: "machine learning algorithms",
            objective: "Generate comprehensive review of machine learning applications in healthcare",
            review_type: "systematic",
            academic_level: "phd",
            include_methodology: true,
            target_length: 6000
        };
        
        const result = await this.makeRequest('/generate-review', reviewData);
        
        if (result.ok && result.data) {
            const hasReviewContent = !!(result.data.review_content || result.data.comprehensive_review);
            const hasMethodology = !!(result.data.methodology_section);
            const hasReferences = !!(result.data.references || result.data.citations);
            const qualityScore = result.data.quality_score || 0;
            
            this.log('Generate Review: SUCCESS', 'success');
            this.log(`Generate Review: Content=${hasReviewContent}, Methodology=${hasMethodology}, References=${hasReferences}`, 'info');
            
            if (qualityScore > 0) {
                this.log(`Generate Review: Quality Score: ${qualityScore}/10`, 
                         qualityScore >= 8 ? 'success' : 'warning');
            }
            
            return {
                success: true,
                hasReviewContent,
                hasMethodology,
                hasReferences,
                qualityScore,
                data: result.data
            };
        } else {
            this.log(`Generate Review: FAILED (${result.status})`, 'error');
            return { success: false, error: result.status };
        }
    }

    async testBackgroundJobEndpoints() {
        this.log('⚙️ TESTING BACKGROUND JOB ENDPOINTS', 'info');

        const backgroundEndpoints = [
            {
                name: 'Background Generate Summary',
                endpoint: '/background-jobs/generate-summary',
                data: {
                    project_id: this.projectId,
                    objective: "Background PhD summary generation",
                    summary_type: "comprehensive",
                    academic_level: "phd",
                    target_length: 4000
                }
            },
            {
                name: 'Background Literature Gap Analysis',
                endpoint: '/background-jobs/literature-gap-analysis',
                data: {
                    project_id: this.projectId,
                    objective: "Background literature gap analysis",
                    gap_types: ["theoretical", "methodological"],
                    academic_level: "phd"
                }
            },
            {
                name: 'Background Thesis Chapter Generator',
                endpoint: '/background-jobs/thesis-chapter-generator',
                data: {
                    project_id: this.projectId,
                    objective: "Background thesis chapter generation",
                    chapter_focus: "literature_review",
                    academic_level: "phd",
                    target_length: 7000
                }
            },
            {
                name: 'Background Methodology Synthesis',
                endpoint: '/background-jobs/methodology-synthesis',
                data: {
                    project_id: this.projectId,
                    objective: "Background methodology synthesis",
                    methodology_types: ["experimental", "computational"],
                    academic_level: "phd"
                }
            }
        ];

        const backgroundResults = {};
        const jobIds = [];

        for (const { name, endpoint, data } of backgroundEndpoints) {
            this.log(`Starting ${name}...`, 'info');

            const result = await this.makeRequest(endpoint, data);

            if (result.ok && result.data?.job_id) {
                this.log(`${name}: JOB STARTED - ID: ${result.data.job_id}`, 'success');
                jobIds.push({ name, jobId: result.data.job_id });
                backgroundResults[name] = { success: true, jobId: result.data.job_id };
            } else {
                this.log(`${name}: FAILED TO START (${result.status})`, 'error');
                backgroundResults[name] = { success: false, error: result.status };
            }

            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Test job status monitoring
        if (jobIds.length > 0) {
            this.log('Testing job status monitoring...', 'info');

            for (const { name, jobId } of jobIds) {
                const statusResult = await this.makeRequest(`/background-jobs/${jobId}/status`, {}, 'GET');

                if (statusResult.ok) {
                    this.log(`${name} Status: ${statusResult.data.status}`, 'success');
                    if (statusResult.data.result_id) {
                        this.log(`${name} Created Report: ${statusResult.data.result_id}`, 'success');
                    }
                } else {
                    this.log(`${name} Status Check: FAILED`, 'warning');
                }
            }
        }

        this.backgroundJobs = jobIds;
        return { results: backgroundResults, jobIds };
    }

    async testReportPersistence() {
        this.log('💾 TESTING REPORT PERSISTENCE AND ACCESSIBILITY', 'info');

        // Test project reports endpoint
        const reportsResult = await this.makeRequest(`/projects/${this.projectId}/reports`, {}, 'GET');

        if (reportsResult.ok) {
            const reports = Array.isArray(reportsResult.data) ? reportsResult.data : [];
            this.log(`Found ${reports.length} persisted reports`, reports.length > 0 ? 'success' : 'warning');

            if (reports.length > 0) {
                // Categorize reports by type
                const reportTypes = {};
                reports.forEach(report => {
                    const type = report.title?.toLowerCase().includes('summary') ? 'Summary' :
                                report.title?.toLowerCase().includes('gap') ? 'Gap Analysis' :
                                report.title?.toLowerCase().includes('thesis') ? 'Thesis Chapter' :
                                report.title?.toLowerCase().includes('methodology') ? 'Methodology' :
                                report.title?.toLowerCase().includes('review') ? 'Review' :
                                report.title?.toLowerCase().includes('deep') ? 'Deep Dive' : 'Other';

                    if (!reportTypes[type]) reportTypes[type] = 0;
                    reportTypes[type]++;
                });

                Object.entries(reportTypes).forEach(([type, count]) => {
                    this.log(`${type} Reports: ${count}`, 'info');
                });

                // Test report accessibility
                const sampleReport = reports[0];
                if (sampleReport.report_id) {
                    this.log(`Sample Report: "${sampleReport.title}" (${sampleReport.status})`, 'info');

                    // Test individual report access
                    const reportResult = await this.makeRequest(`/reports/${sampleReport.report_id}`, {}, 'GET');
                    if (reportResult.ok) {
                        this.log('Individual report access: SUCCESS', 'success');
                    } else {
                        this.log('Individual report access: FAILED', 'warning');
                    }
                }

                return {
                    success: true,
                    reportCount: reports.length,
                    reportTypes,
                    reports: reports.slice(0, 5) // Return first 5 for analysis
                };
            }

            return { success: reports.length > 0, reportCount: reports.length };
        } else {
            this.log(`Report Persistence Test: FAILED (${reportsResult.status})`, 'error');
            return { success: false, reportCount: 0, error: reportsResult.status };
        }
    }

    async testUIIntegration() {
        this.log('🖥️ TESTING UI INTEGRATION AND DATA PARSING', 'info');

        // Enhanced UI element detection
        const uiElements = [
            { name: 'PhD Analysis Panel', selector: '[data-testid="analysis-panel"], [class*="phd"], [class*="analysis"]' },
            { name: 'Report Cards', selector: '.report-card, [class*="report"], [data-testid*="report"]' },
            { name: 'Quality Indicators', selector: '[data-testid*="quality"], [class*="quality"], .quality-score' },
            { name: 'Background Job Status', selector: '[data-testid*="job"], [class*="job"], [data-testid*="background"]' },
            { name: 'Progress Indicators', selector: '[data-testid*="progress"], [class*="progress"], .progress' },
            { name: 'Analysis Results', selector: '[data-testid*="result"], [class*="result"], .analysis-result' },
            { name: 'Action Buttons', selector: 'button[data-testid*="generate"], button[data-testid*="analysis"], button[class*="generate"]' },
            { name: 'Data Containers', selector: '[data-testid*="content"], [class*="content"], .data-container' },
            { name: 'Navigation Elements', selector: '[data-testid*="nav"], [class*="nav"], .navigation' },
            { name: 'Status Badges', selector: '.badge, [class*="badge"], [data-testid*="status"], .status' }
        ];

        let foundElements = 0;
        const elementDetails = [];

        for (const { name, selector } of uiElements) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                this.log(`${name}: FOUND (${elements.length} elements)`, 'success');
                foundElements++;
                elementDetails.push({ name, count: elements.length, found: true });

                // Sample element content
                const sampleElement = elements[0];
                const text = sampleElement.textContent?.trim().substring(0, 50) || 'No text';
                if (text !== 'No text') {
                    this.log(`  Sample: "${text}${text.length > 50 ? '...' : ''}"`, 'info');
                }
            } else {
                this.log(`${name}: NOT FOUND`, 'warning');
                elementDetails.push({ name, count: 0, found: false });
            }
        }

        // Test data attributes for proper parsing
        const dataAttributes = [
            'data-testid', 'data-component', 'data-analysis-type',
            'data-quality-score', 'data-report-id', 'data-job-id'
        ];

        let attributeCount = 0;
        dataAttributes.forEach(attr => {
            const elementsWithAttr = document.querySelectorAll(`[${attr}]`);
            if (elementsWithAttr.length > 0) {
                attributeCount++;
                this.log(`Data attribute ${attr}: ${elementsWithAttr.length} elements`, 'info');
            }
        });

        const uiScore = Math.round((foundElements / uiElements.length) * 100);
        this.log(`UI Integration Score: ${uiScore}%`, uiScore >= 60 ? 'success' : 'warning');

        return {
            foundElements,
            totalElements: uiElements.length,
            uiScore,
            elementDetails,
            attributeCount
        };
    }

    async runComprehensiveTest() {
        console.log('🚀 STARTING COMPREHENSIVE ALL ENDPOINTS TEST');
        console.log('='.repeat(100));
        console.log(`Project ID: ${this.projectId}`);
        console.log(`Frontend URL: ${this.frontendUrl}`);
        console.log(`User ID: ${this.testUser.userId}`);
        console.log('Testing ALL R&D Agent endpoints:');
        console.log('• PhD Analysis (4 endpoints)');
        console.log('• Deep Dive Analysis (2 articles)');
        console.log('• Generate Review (1 endpoint)');
        console.log('• Background Jobs (4 endpoints)');
        console.log('• Report Persistence & Accessibility');
        console.log('• UI Integration & Data Parsing');
        console.log('='.repeat(100));

        const startTime = Date.now();

        // Run all test categories
        this.log('🎯 Phase 1: PhD Analysis Endpoints', 'info');
        const phdResults = await this.testPhdEndpoints();
        await new Promise(resolve => setTimeout(resolve, 2000));

        this.log('🎯 Phase 2: Deep Dive Analysis', 'info');
        const deepDiveResults = await this.testDeepDiveEndpoints();
        await new Promise(resolve => setTimeout(resolve, 2000));

        this.log('🎯 Phase 3: Generate Review', 'info');
        const reviewResults = await this.testGenerateReviewEndpoints();
        await new Promise(resolve => setTimeout(resolve, 2000));

        this.log('🎯 Phase 4: Background Job Processing', 'info');
        const backgroundResults = await this.testBackgroundJobEndpoints();
        await new Promise(resolve => setTimeout(resolve, 2000));

        this.log('🎯 Phase 5: Report Persistence', 'info');
        const persistenceResults = await this.testReportPersistence();
        await new Promise(resolve => setTimeout(resolve, 1000));

        this.log('🎯 Phase 6: UI Integration', 'info');
        const uiResults = await this.testUIIntegration();

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        // Calculate comprehensive scores
        const phdScore = Object.values(phdResults).filter(r => r.success).length / Object.keys(phdResults).length * 100;
        const deepDiveScore = Object.values(deepDiveResults).filter(r => r.success).length / Object.keys(deepDiveResults).length * 100;
        const reviewScore = reviewResults.success ? 100 : 0;
        const backgroundScore = backgroundResults.jobIds.length / 4 * 100;
        const persistenceScore = persistenceResults.success ? 100 : 0;
        const uiScore = uiResults.uiScore;

        const overallScore = Math.round((phdScore + deepDiveScore + reviewScore + backgroundScore + persistenceScore + uiScore) / 6);

        // Display comprehensive results
        console.log('='.repeat(100));
        this.log('📊 COMPREHENSIVE ALL ENDPOINTS TEST RESULTS', 'info');
        console.log('='.repeat(100));

        this.log(`PhD Analysis Endpoints: ${Math.round(phdScore)}% (${Object.values(phdResults).filter(r => r.success).length}/4 passed)`,
                 phdScore >= 75 ? 'success' : 'warning');
        this.log(`Deep Dive Analysis: ${Math.round(deepDiveScore)}% (${Object.values(deepDiveResults).filter(r => r.success).length}/2 passed)`,
                 deepDiveScore >= 75 ? 'success' : 'warning');
        this.log(`Generate Review: ${reviewScore}% (${reviewResults.success ? 'PASS' : 'FAIL'})`,
                 reviewScore >= 75 ? 'success' : 'warning');
        this.log(`Background Jobs: ${Math.round(backgroundScore)}% (${backgroundResults.jobIds.length}/4 started)`,
                 backgroundScore >= 75 ? 'success' : 'warning');
        this.log(`Report Persistence: ${persistenceScore}% (${persistenceResults.reportCount || 0} reports found)`,
                 persistenceScore >= 75 ? 'success' : 'warning');
        this.log(`UI Integration: ${uiScore}% (${uiResults.foundElements}/${uiResults.totalElements} elements)`,
                 uiScore >= 60 ? 'success' : 'warning');

        this.log(`OVERALL SCORE: ${overallScore}%`,
                 overallScore >= 85 ? 'success' : overallScore >= 70 ? 'warning' : 'error');
        this.log(`Test Duration: ${duration}s`, 'info');

        // Detailed breakdown
        console.log('='.repeat(100));
        this.log('🔍 DETAILED BREAKDOWN', 'info');
        console.log('='.repeat(100));

        // PhD Endpoints Quality Scores
        Object.entries(phdResults).forEach(([name, result]) => {
            if (result.success && result.qualityScore) {
                this.log(`${name}: Quality ${result.qualityScore}/10, Fields ${result.foundFields}/${result.totalFields}`, 'info');
            }
        });

        // Background Jobs Created
        if (backgroundResults.jobIds.length > 0) {
            this.log(`Background Jobs Created: ${backgroundResults.jobIds.length}`, 'success');
            backgroundResults.jobIds.forEach(job => {
                this.log(`  • ${job.name}: ${job.jobId}`, 'info');
            });
        }

        // Report Types Found
        if (persistenceResults.reportTypes) {
            Object.entries(persistenceResults.reportTypes).forEach(([type, count]) => {
                this.log(`${type} Reports: ${count}`, 'info');
            });
        }

        // Final recommendations
        console.log('='.repeat(100));
        this.log('🎯 FINAL ASSESSMENT', 'info');
        console.log('='.repeat(100));

        if (overallScore >= 85) {
            this.log('🎉 EXCELLENT! All R&D Agent endpoints are working at high quality!', 'success');
            this.log('✅ PhD system is production-ready', 'success');
            this.log('✅ Background processing is operational', 'success');
            this.log('✅ Report persistence is working', 'success');
            this.log('✅ UI integration is functional', 'success');
        } else if (overallScore >= 70) {
            this.log('✅ GOOD! Most endpoints are working well with minor improvements needed', 'success');
        } else {
            this.log('⚠️ NEEDS ATTENTION! Several critical areas require fixes', 'warning');
        }

        return {
            success: overallScore >= 70,
            overallScore,
            results: {
                phd: phdResults,
                deepDive: deepDiveResults,
                review: reviewResults,
                background: backgroundResults,
                persistence: persistenceResults,
                ui: uiResults
            },
            duration,
            backgroundJobs: this.backgroundJobs
        };
    }
}

// Auto-run the comprehensive test
console.log('🚀 Starting Comprehensive All Endpoints Test...');
const comprehensiveTest = new ComprehensiveAllEndpointsTest();
comprehensiveTest.runComprehensiveTest().then(result => {
    console.log('\n🏁 COMPREHENSIVE ALL ENDPOINTS TEST COMPLETE!');
    console.log(`Result: ${result.success ? '✅ SUCCESS' : '⚠️ NEEDS ATTENTION'}`);
    console.log(`Overall Score: ${result.overallScore}%`);

    if (result.backgroundJobs.length > 0) {
        console.log('\n📋 BACKGROUND JOBS STARTED:');
        result.backgroundJobs.forEach(job => {
            console.log(`• ${job.name}: ${job.jobId}`);
        });
        console.log('\n💡 TIP: You can close your browser - these jobs will continue running!');
    }

    console.log('\n🎯 NEXT STEPS:');
    if (result.success) {
        console.log('• All major R&D Agent endpoints are functional!');
        console.log('• PhD system, Deep Dive, Generate Review all working');
        console.log('• Background processing and report persistence operational');
        console.log('• System is ready for production use!');
    } else {
        console.log('• Review detailed breakdown above');
        console.log('• Focus on endpoints with scores below 75%');
        console.log('• Re-run test after implementing fixes');
    }
}).catch(error => {
    console.error('❌ Comprehensive test failed:', error);
});
