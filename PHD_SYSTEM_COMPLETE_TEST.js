/**
 * PhD System Complete Test - Validates All Requirements
 * Tests: Data accuracy, UI parsing, report persistence, background processing
 */

class PhDSystemCompleteTest {
    constructor() {
        this.results = [];
        this.frontendUrl = window.location.origin;
        this.projectId = this.extractProjectId();
        this.testUser = {
            email: 'fredericle77@gmail.com',
            userId: 'e29e29d3-f87f-4c70-9aeb-424002382195'
        };
        this.backgroundJobs = [];
    }

    extractProjectId() {
        const path = window.location.pathname;
        const segments = path.split('/');
        const projectIndex = segments.indexOf('projects');
        if (projectIndex !== -1 && segments[projectIndex + 1]) {
            return segments[projectIndex + 1];
        }
        return '5ac213d7-6fcc-46ff-9420-5c7f4b421012'; // Default test project
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

    async testDataAccuracy() {
        this.log('🎯 TESTING DATA ACCURACY AND CONTEXTUAL CONTENT', 'info');
        
        const testData = {
            project_id: this.projectId,
            objective: "Generate comprehensive PhD-level analysis with highly accurate contextual data",
            summary_type: "comprehensive",
            academic_level: "phd",
            include_methodology: true,
            include_gaps: true,
            target_length: 5000
        };

        const result = await this.makeRequest('/generate-summary', testData);
        
        if (result.ok && result.data) {
            // Check for contextual accuracy indicators
            const accuracyChecks = {
                hasContent: !!result.data.summary_content,
                hasMethodology: !!result.data.methodology_summary,
                hasGaps: !!result.data.research_gaps,
                hasFindings: !!result.data.key_findings,
                hasQualityScore: !!result.data.quality_score,
                qualityAbove7: result.data.quality_score > 7.0,
                hasProcessingTime: !!result.data.processing_time,
                hasWordCount: !!result.data.word_count,
                contentLength: result.data.summary_content?.length || 0
            };

            const passedChecks = Object.values(accuracyChecks).filter(Boolean).length;
            const totalChecks = Object.keys(accuracyChecks).length;
            
            this.log(`Data Accuracy: ${passedChecks}/${totalChecks} checks passed`, 
                     passedChecks >= 7 ? 'success' : 'warning');
            
            if (accuracyChecks.qualityAbove7) {
                this.log(`Quality Score: ${result.data.quality_score}/10 - EXCELLENT`, 'success');
            } else {
                this.log(`Quality Score: ${result.data.quality_score}/10 - NEEDS IMPROVEMENT`, 'warning');
            }

            if (accuracyChecks.contentLength > 1000) {
                this.log(`Content Length: ${accuracyChecks.contentLength} characters - SUBSTANTIAL`, 'success');
            } else {
                this.log(`Content Length: ${accuracyChecks.contentLength} characters - TOO SHORT`, 'warning');
            }

            return { passed: passedChecks >= 7, score: passedChecks, total: totalChecks, data: result.data };
        } else {
            this.log(`Data Accuracy Test: FAILED (${result.status})`, 'error');
            return { passed: false, score: 0, total: 9, data: null };
        }
    }

    async testBackgroundProcessing() {
        this.log('⚙️ TESTING BACKGROUND PROCESSING CAPABILITIES', 'info');
        
        const backgroundEndpoints = [
            {
                name: 'Background Generate Summary',
                endpoint: '/background-jobs/generate-summary',
                data: {
                    project_id: this.projectId,
                    objective: "Background PhD summary generation test",
                    summary_type: "comprehensive",
                    academic_level: "phd",
                    include_methodology: true,
                    target_length: 3000
                }
            },
            {
                name: 'Background Literature Gap Analysis',
                endpoint: '/background-jobs/literature-gap-analysis',
                data: {
                    project_id: this.projectId,
                    objective: "Background literature gap analysis test",
                    gap_types: ["theoretical", "methodological", "empirical"],
                    academic_level: "phd",
                    analysis_depth: "comprehensive"
                }
            }
        ];

        let successfulJobs = 0;
        const jobIds = [];

        for (const { name, endpoint, data } of backgroundEndpoints) {
            const result = await this.makeRequest(endpoint, data);
            
            if (result.ok && result.data?.job_id) {
                this.log(`${name}: JOB STARTED - ID: ${result.data.job_id}`, 'success');
                this.log(`${name}: Estimated completion: ${result.data.estimated_completion}`, 'info');
                jobIds.push({ name, jobId: result.data.job_id });
                successfulJobs++;
            } else {
                this.log(`${name}: FAILED TO START (${result.status})`, 'error');
            }
        }

        // Test job status checking
        if (jobIds.length > 0) {
            this.log('Testing job status monitoring...', 'info');
            
            for (const { name, jobId } of jobIds) {
                const statusResult = await this.makeRequest(`/background-jobs/${jobId}/status`, {}, 'GET');
                
                if (statusResult.ok) {
                    this.log(`${name} Status: ${statusResult.data.status}`, 'success');
                } else {
                    this.log(`${name} Status Check: FAILED`, 'warning');
                }
            }
        }

        this.backgroundJobs = jobIds;
        return { 
            passed: successfulJobs > 0, 
            successfulJobs, 
            totalJobs: backgroundEndpoints.length,
            jobIds 
        };
    }

    async testReportPersistence() {
        this.log('💾 TESTING REPORT PERSISTENCE AND ACCESSIBILITY', 'info');
        
        // Test project reports endpoint
        const reportsResult = await this.makeRequest(`/projects/${this.projectId}/reports`, {}, 'GET');
        
        if (reportsResult.ok) {
            const reports = reportsResult.data;
            const reportCount = Array.isArray(reports) ? reports.length : 0;
            
            this.log(`Found ${reportCount} persisted reports`, reportCount > 0 ? 'success' : 'warning');
            
            if (reportCount > 0) {
                // Test report accessibility
                const firstReport = reports[0];
                if (firstReport.report_id) {
                    this.log(`Sample Report ID: ${firstReport.report_id}`, 'info');
                    this.log(`Sample Report Title: ${firstReport.title}`, 'info');
                    this.log(`Sample Report Created: ${firstReport.created_at}`, 'info');
                    
                    // Check if report is clickable (has proper structure)
                    const hasRequiredFields = !!(firstReport.report_id && firstReport.title && firstReport.created_at);
                    this.log(`Report Structure: ${hasRequiredFields ? 'COMPLETE' : 'INCOMPLETE'}`, 
                             hasRequiredFields ? 'success' : 'warning');
                    
                    return { 
                        passed: true, 
                        reportCount, 
                        accessible: hasRequiredFields,
                        sampleReport: firstReport 
                    };
                }
            }
            
            return { passed: reportCount > 0, reportCount, accessible: false };
        } else {
            this.log(`Report Persistence Test: FAILED (${reportsResult.status})`, 'error');
            return { passed: false, reportCount: 0, accessible: false };
        }
    }

    async testUIDataParsing() {
        this.log('🖥️ TESTING UI DATA PARSING AND DISPLAY', 'info');
        
        // Check for PhD UI components in the DOM
        const uiElements = [
            { name: 'PhD Analysis Panel', selector: '[data-testid="analysis-panel"]' },
            { name: 'PhD Analysis Cards', selector: '.analysis-card' },
            { name: 'Quality Score Display', selector: '[data-testid="quality-score"]' },
            { name: 'Processing Time Display', selector: '[data-testid="processing-time"]' },
            { name: 'Result Container', selector: '[data-testid="result-container"]' },
            { name: 'Error Display', selector: '[data-testid="error-display"]' },
            { name: 'Report Cards', selector: '.report-card, [class*="report"]' },
            { name: 'PhD Components', selector: '[data-component*="phd"], [data-component*="thesis"], [data-component*="gap"]' }
        ];

        let foundElements = 0;
        const elementDetails = [];

        for (const { name, selector } of uiElements) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                this.log(`${name}: FOUND (${elements.length} elements)`, 'success');
                foundElements++;
                elementDetails.push({ name, count: elements.length, found: true });
            } else {
                this.log(`${name}: NOT FOUND`, 'warning');
                elementDetails.push({ name, count: 0, found: false });
            }
        }

        // Check for data attributes that indicate proper parsing
        const dataAttributes = [
            'data-testid',
            'data-component',
            'data-analysis-type',
            'data-quality-score',
            'data-report-id'
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
        this.log(`UI Parsing Score: ${uiScore}%`, uiScore >= 50 ? 'success' : 'warning');

        return { 
            passed: foundElements >= 3, 
            foundElements, 
            totalElements: uiElements.length,
            uiScore,
            elementDetails,
            attributeCount
        };
    }

    async runCompleteTest() {
        console.log('🎓 STARTING PHD SYSTEM COMPLETE TEST');
        console.log('='.repeat(80));
        console.log(`Project ID: ${this.projectId}`);
        console.log(`Frontend URL: ${this.frontendUrl}`);
        console.log(`User ID: ${this.testUser.userId}`);
        console.log('Testing all PhD system requirements:');
        console.log('• Data accuracy and contextual content');
        console.log('• Background processing capabilities');
        console.log('• Report persistence and accessibility');
        console.log('• UI data parsing and display');
        console.log('='.repeat(80));

        const startTime = Date.now();

        // Run all tests
        const dataAccuracyResults = await this.testDataAccuracy();
        await new Promise(resolve => setTimeout(resolve, 2000)); // Delay between tests
        
        const backgroundResults = await this.testBackgroundProcessing();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const persistenceResults = await this.testReportPersistence();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const uiResults = await this.testUIDataParsing();

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        // Calculate overall score
        const scores = [
            dataAccuracyResults.passed ? 100 : (dataAccuracyResults.score / dataAccuracyResults.total) * 100,
            backgroundResults.passed ? 100 : (backgroundResults.successfulJobs / backgroundResults.totalJobs) * 100,
            persistenceResults.passed ? 100 : 0,
            uiResults.uiScore
        ];

        const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

        // Display comprehensive summary
        console.log('='.repeat(80));
        this.log('📊 PHD SYSTEM COMPLETE TEST RESULTS', 'info');
        console.log('='.repeat(80));

        this.log(`Data Accuracy: ${dataAccuracyResults.passed ? 'PASS' : 'FAIL'} (${Math.round(scores[0])}%)`, 
                 dataAccuracyResults.passed ? 'success' : 'error');
        
        this.log(`Background Processing: ${backgroundResults.passed ? 'PASS' : 'FAIL'} (${Math.round(scores[1])}%)`, 
                 backgroundResults.passed ? 'success' : 'error');
        
        this.log(`Report Persistence: ${persistenceResults.passed ? 'PASS' : 'FAIL'} (${Math.round(scores[2])}%)`, 
                 persistenceResults.passed ? 'success' : 'error');
        
        this.log(`UI Data Parsing: ${uiResults.passed ? 'PASS' : 'FAIL'} (${uiResults.uiScore}%)`, 
                 uiResults.passed ? 'success' : 'warning');

        this.log(`Overall Score: ${overallScore}%`, 
                 overallScore >= 80 ? 'success' : overallScore >= 60 ? 'warning' : 'error');
        this.log(`Test Duration: ${duration}s`, 'info');

        // Detailed recommendations
        console.log('='.repeat(80));
        this.log('🎯 DETAILED RECOMMENDATIONS', 'info');
        console.log('='.repeat(80));

        if (!dataAccuracyResults.passed) {
            this.log('• Data Accuracy: Improve content quality and contextual relevance', 'warning');
        }
        if (!backgroundResults.passed) {
            this.log('• Background Processing: Implement missing background job endpoints', 'warning');
        }
        if (!persistenceResults.passed) {
            this.log('• Report Persistence: Fix report storage and retrieval system', 'warning');
        }
        if (!uiResults.passed) {
            this.log('• UI Data Parsing: Enhance component data attributes and display logic', 'warning');
        }

        if (overallScore >= 80) {
            this.log('🎉 EXCELLENT! PhD system meets all requirements!', 'success');
        } else if (overallScore >= 60) {
            this.log('✅ GOOD! PhD system is functional with minor improvements needed', 'success');
        } else {
            this.log('⚠️ NEEDS WORK! Several critical issues need to be addressed', 'warning');
        }

        return {
            success: overallScore >= 80,
            overallScore,
            results: { dataAccuracyResults, backgroundResults, persistenceResults, uiResults },
            duration,
            backgroundJobs: this.backgroundJobs
        };
    }
}

// Auto-run the complete test
console.log('🚀 Starting PhD System Complete Test...');
const phdCompleteTest = new PhDSystemCompleteTest();
phdCompleteTest.runCompleteTest().then(result => {
    console.log('\n🏁 PHD SYSTEM COMPLETE TEST FINISHED!');
    console.log(`Result: ${result.success ? '✅ SUCCESS' : '⚠️ NEEDS ATTENTION'}`);
    console.log(`Overall Score: ${result.overallScore}%`);
    
    if (result.backgroundJobs.length > 0) {
        console.log('\n📋 BACKGROUND JOBS STARTED:');
        result.backgroundJobs.forEach(job => {
            console.log(`• ${job.name}: ${job.jobId}`);
        });
        console.log('\n💡 TIP: You can now close your browser - these jobs will continue running!');
    }
    
    console.log('\n🎯 NEXT STEPS:');
    if (result.success) {
        console.log('• PhD system is ready for production use!');
        console.log('• All requirements have been met successfully');
    } else {
        console.log('• Review the detailed recommendations above');
        console.log('• Focus on areas with scores below 80%');
        console.log('• Re-run this test after implementing fixes');
    }
}).catch(error => {
    console.error('❌ PhD System complete test failed:', error);
});
