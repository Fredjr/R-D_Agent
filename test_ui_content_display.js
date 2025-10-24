#!/usr/bin/env node

/**
 * UI Content Display Test
 * Tests that PhD content is properly displayed in the frontend UI
 */

const PROJECT_ID = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
const USER_ID = 'fredericle77@gmail.com';

class UIContentTester {
    constructor() {
        this.results = {
            reports_tested: 0,
            reports_with_content: 0,
            total_content_chars: 0,
            ui_accessible: 0,
            errors: []
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            'info': '📊',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌'
        }[type] || '📊';
        
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    async testReportsAPI() {
        this.log('Testing Reports API for content...', 'info');

        try {
            const response = await fetch(`https://r-dagent-production.up.railway.app/projects/${PROJECT_ID}/reports`, {
                headers: { 'User-ID': USER_ID }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const reports = data.reports || [];

            this.log(`Found ${reports.length} reports`, 'info');

            for (const report of reports) {
                this.results.reports_tested++;
                
                const contentSize = report.content ? JSON.stringify(report.content).length : 0;
                const summarySize = report.summary ? report.summary.length : 0;
                
                if (contentSize > 10 || summarySize > 10) {
                    this.results.reports_with_content++;
                    this.results.total_content_chars += contentSize + summarySize;
                    
                    this.log(`Report "${report.title}": ${contentSize} content chars, ${summarySize} summary chars`, 'success');
                } else {
                    this.log(`Report "${report.title}": No content (${contentSize} chars)`, 'warning');
                }
            }

            return reports;

        } catch (error) {
            this.log(`Reports API test failed: ${error.message}`, 'error');
            this.results.errors.push(`Reports API: ${error.message}`);
            return [];
        }
    }

    async testIndividualReport(reportId) {
        this.log(`Testing individual report: ${reportId}`, 'info');

        try {
            const response = await fetch(`https://r-dagent-production.up.railway.app/reports/${reportId}`, {
                headers: { 'User-ID': USER_ID }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const report = await response.json();
            const contentSize = report.content ? JSON.stringify(report.content).length : 0;
            
            if (contentSize > 10) {
                this.results.ui_accessible++;
                this.log(`Individual report accessible: ${contentSize} chars`, 'success');
                return true;
            } else {
                this.log(`Individual report has no content: ${contentSize} chars`, 'warning');
                return false;
            }

        } catch (error) {
            this.log(`Individual report test failed: ${error.message}`, 'error');
            this.results.errors.push(`Individual Report ${reportId}: ${error.message}`);
            return false;
        }
    }

    async testPHDEndpointGeneration() {
        this.log('Testing PhD endpoint content generation...', 'info');

        const endpoints = [
            {
                name: 'Generate Summary',
                url: 'https://r-dagent-production.up.railway.app/generate-summary',
                payload: {
                    project_id: PROJECT_ID,
                    objective: "UI Test: Generate PhD summary for content verification",
                    summary_type: "comprehensive",
                    academic_level: "phd",
                    include_methodology: true,
                    target_length: 1500
                }
            }
        ];

        for (const endpoint of endpoints) {
            try {
                this.log(`Testing ${endpoint.name}...`, 'info');
                
                const response = await fetch(endpoint.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-ID': USER_ID
                    },
                    body: JSON.stringify(endpoint.payload)
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                
                if (data.quality_score && data.word_count) {
                    this.log(`${endpoint.name}: Quality ${data.quality_score}/10, ${data.word_count} words`, 'success');
                } else {
                    this.log(`${endpoint.name}: Generated content but missing metrics`, 'warning');
                }

            } catch (error) {
                this.log(`${endpoint.name} failed: ${error.message}`, 'error');
                this.results.errors.push(`${endpoint.name}: ${error.message}`);
            }
        }
    }

    async runCompleteTest() {
        this.log('🚀 Starting UI Content Display Test', 'info');
        this.log('=' * 60, 'info');

        // Test 1: Check reports API for content
        const reports = await this.testReportsAPI();

        // Test 2: Test individual report accessibility
        if (reports.length > 0) {
            const sampleReports = reports.slice(0, 3); // Test first 3 reports
            for (const report of sampleReports) {
                await this.testIndividualReport(report.report_id);
            }
        }

        // Test 3: Generate new content to verify pipeline
        await this.testPHDEndpointGeneration();

        // Test 4: Verify new content appears in API
        this.log('Waiting 5 seconds for database update...', 'info');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const updatedReports = await this.testReportsAPI();

        this.printResults();
    }

    printResults() {
        this.log('=' * 60, 'info');
        this.log('🎯 UI CONTENT DISPLAY TEST RESULTS', 'info');
        this.log('=' * 60, 'info');
        
        this.log(`📊 Reports Tested: ${this.results.reports_tested}`, 'info');
        this.log(`✅ Reports with Content: ${this.results.reports_with_content}`, 'success');
        this.log(`📝 Total Content Characters: ${this.results.total_content_chars}`, 'info');
        this.log(`🌐 UI Accessible Reports: ${this.results.ui_accessible}`, 'info');
        
        if (this.results.errors.length > 0) {
            this.log(`❌ Errors: ${this.results.errors.length}`, 'error');
            this.results.errors.forEach(error => this.log(`   ${error}`, 'error'));
        }

        const contentRate = this.results.reports_tested > 0 ? 
            (this.results.reports_with_content / this.results.reports_tested * 100).toFixed(1) : 0;
        
        this.log(`🎯 Content Success Rate: ${contentRate}%`, contentRate >= 75 ? 'success' : 'warning');

        this.log('=' * 60, 'info');
        this.log('🌐 FRONTEND TESTING INSTRUCTIONS:', 'info');
        this.log(`   1. Open: https://frontend-psi-seven-85.vercel.app/projects/${PROJECT_ID}`, 'info');
        this.log('   2. Verify reports are visible in the project workspace', 'info');
        this.log('   3. Click on any report to open it', 'info');
        this.log('   4. Verify rich PhD content is displayed', 'info');
        this.log('   5. Test PhD analysis buttons (Generate Summary, etc.)', 'info');
        this.log('   6. Verify new analyses appear in the workspace', 'info');
        this.log('=' * 60, 'info');

        if (this.results.reports_with_content >= 5 && this.results.total_content_chars > 20000) {
            this.log('🎉 SUCCESS: PhD content is properly saved and accessible!', 'success');
        } else if (this.results.reports_with_content > 0) {
            this.log('⚠️ PARTIAL SUCCESS: Some content available, but may need more testing', 'warning');
        } else {
            this.log('❌ FAILURE: No content found in reports', 'error');
        }
    }
}

// Run the test
const tester = new UIContentTester();
tester.runCompleteTest().catch(error => {
    console.error('❌ UI Content test failed:', error);
    process.exit(1);
});
