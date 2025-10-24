#!/usr/bin/env node

/**
 * PhD Endpoints End-to-End Test
 * Tests all PhD endpoints for database persistence and UI accessibility
 */

const BACKEND_URL = 'https://r-dagent-production.up.railway.app';
const FRONTEND_URL = 'https://frontend-psi-seven-85.vercel.app';
const API_PROXY_URL = 'https://frontend-psi-seven-85.vercel.app/api/proxy'; // Use frontend API proxy to avoid CORS
const PROJECT_ID = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
const USER_ID = 'fredericle77@gmail.com';

class PhDEndpointTester {
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

    async testEndpoint(name, url, payload, expectedFields) {
        this.log(`Testing ${name}...`, 'info');
        this.results.endpoints_tested++;

        try {
            const response = await fetch(url, {
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
            
            for (const field of expectedFields) {
                if (data[field]) {
                    contentGenerated = true;
                    if (typeof data[field] === 'string') {
                        contentSize += data[field].length;
                    } else if (Array.isArray(data[field])) {
                        contentSize += data[field].length * 100; // Estimate
                    } else if (typeof data[field] === 'object') {
                        contentSize += JSON.stringify(data[field]).length;
                    }
                }
            }

            if (contentGenerated) {
                this.results.content_generated++;
                this.log(`${name}: Content generated (${contentSize} chars)`, 'success');
            } else {
                this.log(`${name}: No content generated`, 'warning');
            }

            // Check quality score if available
            if (data.quality_score) {
                this.log(`${name}: Quality Score ${data.quality_score}/10`, 'info');
            }

            // Check processing time
            if (data.processing_time || data.processing_time_seconds) {
                const time = data.processing_time || `${data.processing_time_seconds}s`;
                this.log(`${name}: Processing Time ${time}`, 'info');
            }

            this.results.endpoints_passed++;
            return { success: true, data, contentSize };

        } catch (error) {
            this.log(`${name}: FAILED - ${error.message}`, 'error');
            this.results.errors.push(`${name}: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    async testDatabasePersistence() {
        this.log('Testing database persistence...', 'info');

        try {
            // Get current report count
            const reportsResponse = await fetch(`${API_PROXY_URL}/projects/${PROJECT_ID}/reports`, {
                headers: { 'User-ID': USER_ID }
            });

            if (!reportsResponse.ok) {
                throw new Error(`Failed to fetch reports: ${reportsResponse.status}`);
            }

            const reportsData = await reportsResponse.json();
            const reportCount = reportsData.reports.length;

            this.log(`Current reports in database: ${reportCount}`, 'info');

            // Check for reports with content
            let reportsWithContent = 0;
            let totalContentChars = 0;

            for (const report of reportsData.reports) {
                if (report.content && JSON.stringify(report.content).length > 10) {
                    reportsWithContent++;
                    totalContentChars += JSON.stringify(report.content).length;
                }
            }

            this.log(`Reports with content: ${reportsWithContent}/${reportCount}`, 'info');
            this.log(`Total content characters: ${totalContentChars}`, 'info');

            this.results.database_saves = reportsWithContent;

            return { reportCount, reportsWithContent, totalContentChars };

        } catch (error) {
            this.log(`Database persistence test failed: ${error.message}`, 'error');
            this.results.errors.push(`Database: ${error.message}`);
            return null;
        }
    }

    async runAllTests() {
        this.log('🚀 Starting PhD Endpoints End-to-End Test', 'info');
        this.log('=' * 60, 'info');

        // Test all PhD endpoints
        const endpoints = [
            {
                name: 'Generate Summary',
                url: `${API_PROXY_URL}/generate-summary`,
                payload: {
                    project_id: PROJECT_ID,
                    objective: "Generate PhD-level summary of finerenone research",
                    summary_type: "comprehensive",
                    academic_level: "phd",
                    include_methodology: true,
                    target_length: 2000
                },
                expectedFields: ['summary_content', 'methodology_summary', 'research_gaps', 'key_findings']
            },
            {
                name: 'Thesis Chapter Generator',
                url: `${API_PROXY_URL}/thesis-chapter-generator`,
                payload: {
                    project_id: PROJECT_ID,
                    objective: "Generate PhD thesis chapters for finerenone research",
                    chapter_focus: "literature_review",
                    academic_level: "phd",
                    citation_style: "apa",
                    target_length: 50000
                },
                expectedFields: ['chapters', 'research_timeline']
            },
            {
                name: 'Literature Gap Analysis',
                url: `${API_PROXY_URL}/literature-gap-analysis`,
                payload: {
                    project_id: PROJECT_ID,
                    objective: "Identify research gaps in finerenone literature",
                    analysis_depth: "comprehensive",
                    gap_types: ["methodological", "theoretical", "empirical"],
                    academic_level: "phd"
                },
                expectedFields: ['identified_gaps', 'research_opportunities', 'recommendations']
            },
            {
                name: 'Methodology Synthesis',
                url: `${API_PROXY_URL}/methodology-synthesis`,
                payload: {
                    project_id: PROJECT_ID,
                    objective: "Synthesize research methodologies in finerenone studies",
                    synthesis_type: "comprehensive",
                    methodology_types: ["quantitative", "qualitative"],
                    academic_level: "phd"
                },
                expectedFields: ['identified_methodologies', 'methodology_comparison', 'synthesis_summary']
            }
        ];

        // Test each endpoint
        for (const endpoint of endpoints) {
            await this.testEndpoint(endpoint.name, endpoint.url, endpoint.payload, endpoint.expectedFields);
            
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

        const successRate = (this.results.endpoints_passed / this.results.endpoints_tested * 100).toFixed(1);
        this.log(`🎯 Success Rate: ${successRate}%`, successRate >= 75 ? 'success' : 'warning');

        this.log('=' * 60, 'info');
        this.log(`🌐 Frontend URL: ${FRONTEND_URL}/projects/${PROJECT_ID}`, 'info');
        this.log('📋 Next Steps:', 'info');
        this.log('   1. Open the frontend URL to test UI display', 'info');
        this.log('   2. Click on reports to verify content is accessible', 'info');
        this.log('   3. Test PhD analysis buttons in the UI', 'info');
        this.log('=' * 60, 'info');
    }
}

// Run the test
const tester = new PhDEndpointTester();
tester.runAllTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
});
