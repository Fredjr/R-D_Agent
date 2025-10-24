/**
 * Browser-Compatible PhD Endpoints Test
 * Run this script in the browser console on the frontend domain
 * to test PhD endpoints through the frontend's API proxy
 */

// Configuration
const PROJECT_ID = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
const USER_ID = 'fredericle77@gmail.com';

class BrowserPHDTester {
    constructor() {
        this.results = {
            endpoints_tested: 0,
            endpoints_passed: 0,
            database_saves: 0,
            content_generated: 0,
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

    async testEndpoint(name, endpoint, payload) {
        this.log(`Testing ${name}...`, 'info');
        this.results.endpoints_tested++;

        try {
            // Use relative URLs to avoid CORS issues
            const response = await fetch(`/api/proxy/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': USER_ID
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Check if content was generated
            let contentGenerated = false;
            let contentSize = 0;

            if (data.summary_content) {
                contentSize += data.summary_content.length;
                contentGenerated = true;
            }
            if (data.chapters) {
                contentSize += JSON.stringify(data.chapters).length;
                contentGenerated = true;
            }
            if (data.identified_gaps) {
                contentSize += JSON.stringify(data.identified_gaps).length;
                contentGenerated = true;
            }
            if (data.identified_methodologies) {
                contentSize += JSON.stringify(data.identified_methodologies).length;
                contentGenerated = true;
            }

            if (contentGenerated) {
                this.results.endpoints_passed++;
                this.results.content_generated++;
                this.log(`${name}: Content generated (${contentSize} chars)`, 'success');
                
                if (data.quality_score) {
                    this.log(`${name}: Quality Score ${data.quality_score}/10`, 'info');
                }
                if (data.processing_time) {
                    this.log(`${name}: Processing Time ${data.processing_time}`, 'info');
                }
            } else {
                this.log(`${name}: No content generated`, 'warning');
            }

            return { success: true, data };

        } catch (error) {
            this.log(`${name}: FAILED - ${error.message}`, 'error');
            this.results.errors.push(`${name}: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    async testDatabasePersistence() {
        this.log('Testing database persistence...', 'info');

        try {
            // Get current report count using relative URL
            const reportsResponse = await fetch(`/api/proxy/projects/${PROJECT_ID}/reports`, {
                headers: { 'User-ID': USER_ID }
            });

            if (!reportsResponse.ok) {
                throw new Error(`Failed to fetch reports: ${reportsResponse.status}`);
            }

            const reportsData = await reportsResponse.json();
            const reportCount = reportsData.reports.length;
            
            // Count reports with content
            let reportsWithContent = 0;
            let totalContentChars = 0;
            
            for (const report of reportsData.reports) {
                if (report.content && typeof report.content === 'object') {
                    const contentStr = JSON.stringify(report.content);
                    if (contentStr.length > 10) { // More than just "{}"
                        reportsWithContent++;
                        totalContentChars += contentStr.length;
                    }
                }
            }

            this.log(`Current reports in database: ${reportCount}`, 'info');
            this.log(`Reports with content: ${reportsWithContent}/${reportCount}`, 'info');
            this.log(`Total content characters: ${totalContentChars}`, 'info');
            
            this.results.database_saves = reportsWithContent;

        } catch (error) {
            this.log(`Database persistence test failed: ${error.message}`, 'error');
            this.results.errors.push(`Database: ${error.message}`);
        }
    }

    async runAllTests() {
        this.log('🚀 Starting Browser PhD Endpoints Test', 'info');
        this.log('=' * 60, 'info');

        // Test all PhD endpoints using relative URLs
        const endpoints = [
            {
                name: 'Generate Summary',
                endpoint: 'generate-summary',
                payload: {
                    project_id: PROJECT_ID,
                    objective: "Browser test: Generate PhD summary",
                    summary_type: "comprehensive",
                    academic_level: "phd",
                    include_methodology: true,
                    target_length: 1500
                }
            },
            {
                name: 'Thesis Chapter Generator',
                endpoint: 'thesis-chapter-generator',
                payload: {
                    project_id: PROJECT_ID,
                    objective: "Browser test: Generate thesis chapters",
                    chapter_focus: "literature_review",
                    academic_level: "phd",
                    citation_style: "apa",
                    target_length: 5000
                }
            },
            {
                name: 'Literature Gap Analysis',
                endpoint: 'literature-gap-analysis',
                payload: {
                    project_id: PROJECT_ID,
                    objective: "Browser test: Identify research gaps",
                    analysis_depth: "comprehensive",
                    gap_types: ["methodological", "theoretical"],
                    academic_level: "phd"
                }
            },
            {
                name: 'Methodology Synthesis',
                endpoint: 'methodology-synthesis',
                payload: {
                    project_id: PROJECT_ID,
                    objective: "Browser test: Synthesize methodologies",
                    synthesis_type: "comprehensive",
                    methodology_types: ["quantitative"],
                    academic_level: "phd"
                }
            }
        ];

        // Test each endpoint
        for (const endpoint of endpoints) {
            await this.testEndpoint(endpoint.name, endpoint.endpoint, endpoint.payload);
            
            // Wait between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Test database persistence
        await this.testDatabasePersistence();

        // Print final results
        this.printResults();
    }

    printResults() {
        this.log('=' * 60, 'info');
        this.log('🎯 FINAL TEST RESULTS', 'info');
        this.log('=' * 60, 'info');
        
        this.log(`📊 Endpoints Tested: ${this.results.endpoints_tested}`, 'info');
        this.log(`✅ Endpoints Passed: ${this.results.endpoints_passed}`, 'success');
        this.log(`💾 Database Saves: ${this.results.database_saves}`, 'info');
        this.log(`📝 Content Generated: ${this.results.content_generated}`, 'info');
        
        if (this.results.errors.length > 0) {
            this.log(`❌ Errors: ${this.results.errors.length}`, 'error');
            this.results.errors.forEach(error => this.log(`   ${error}`, 'error'));
        }

        const successRate = this.results.endpoints_tested > 0 ? 
            (this.results.endpoints_passed / this.results.endpoints_tested * 100).toFixed(1) : 0;
        
        this.log(`🎯 Success Rate: ${successRate}%`, successRate >= 75 ? 'success' : 'warning');

        this.log('=' * 60, 'info');
        this.log(`🌐 Frontend URL: ${window.location.origin}/projects/${PROJECT_ID}`, 'info');
        this.log('📋 Next Steps:', 'info');
        this.log('   1. Open the frontend URL to test UI display', 'info');
        this.log('   2. Click on reports to verify content is accessible', 'info');
        this.log('   3. Test PhD analysis buttons in the UI', 'info');
        this.log('=' * 60, 'info');

        if (this.results.endpoints_passed >= 3 && this.results.database_saves >= 5) {
            this.log('🎉 SUCCESS: PhD endpoints are working correctly!', 'success');
        } else if (this.results.endpoints_passed > 0) {
            this.log('⚠️ PARTIAL SUCCESS: Some endpoints working, may need investigation', 'warning');
        } else {
            this.log('❌ FAILURE: PhD endpoints not working correctly', 'error');
        }
    }
}

// Auto-run the test when script is loaded
console.log('🔧 Browser PhD Endpoints Tester Loaded');
console.log('📋 To run the test, execute: new BrowserPHDTester().runAllTests()');

// Export for manual execution
window.BrowserPHDTester = BrowserPHDTester;
