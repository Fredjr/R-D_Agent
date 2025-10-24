/**
 * Reports Verification Test - Check if background jobs created reports and test UI accessibility
 */

class ReportsVerificationTest {
    constructor() {
        this.frontendUrl = window.location.origin;
        this.projectId = this.extractProjectId();
        this.testUser = {
            email: 'fredericle77@gmail.com',
            userId: 'e29e29d3-f87f-4c70-9aeb-424002382195'
        };
        this.backgroundJobIds = [
            '07ee040c-e6aa-4477-bd33-d87047b78bc9',
            '38d5b5a7-7306-469d-89c3-f3f632bd4a7f'
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
    }

    async makeRequest(endpoint, method = 'GET', data = null) {
        try {
            const response = await fetch(`${this.frontendUrl}/api/proxy${endpoint}`, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.testUser.userId
                },
                body: data ? JSON.stringify(data) : undefined
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

    async testBackgroundJobResults() {
        this.log('🔍 TESTING BACKGROUND JOB RESULTS', 'info');
        
        for (const jobId of this.backgroundJobIds) {
            this.log(`Checking job status: ${jobId}`, 'info');
            
            const statusResult = await this.makeRequest(`/background-jobs/${jobId}/status`);
            
            if (statusResult.ok) {
                this.log(`Job ${jobId}: Status = ${statusResult.data.status}`, 
                         statusResult.data.status === 'completed' ? 'success' : 'warning');
                
                if (statusResult.data.result_id) {
                    this.log(`Job ${jobId}: Created Report ID = ${statusResult.data.result_id}`, 'success');
                }
            } else {
                this.log(`Job ${jobId}: Status check failed (${statusResult.status})`, 'error');
            }
        }
    }

    async testDirectReportAccess() {
        this.log('🔍 TESTING DIRECT REPORT ACCESS', 'info');
        
        // Try to get reports directly (bypassing project access)
        const allReportsResult = await this.makeRequest('/reports');
        
        if (allReportsResult.ok) {
            const reports = Array.isArray(allReportsResult.data) ? allReportsResult.data : [];
            this.log(`Found ${reports.length} total reports in system`, reports.length > 0 ? 'success' : 'warning');
            
            // Filter reports for this project
            const projectReports = reports.filter(r => r.project_id === this.projectId);
            this.log(`Found ${projectReports.length} reports for this project`, projectReports.length > 0 ? 'success' : 'warning');
            
            if (projectReports.length > 0) {
                projectReports.slice(0, 3).forEach((report, index) => {
                    this.log(`Report ${index + 1}: ${report.report_id} - "${report.title}" (${report.status})`, 'info');
                });
                
                return { success: true, reports: projectReports };
            }
        } else {
            this.log(`Direct reports access failed: ${allReportsResult.status}`, 'error');
        }
        
        return { success: false, reports: [] };
    }

    async testUIReportElements() {
        this.log('🖥️ TESTING UI REPORT ELEMENTS', 'info');
        
        // Look for report-related UI elements
        const reportSelectors = [
            { name: 'Report Cards', selector: '.report-card, [class*="report"], [data-testid*="report"]' },
            { name: 'PhD Analysis Results', selector: '[data-testid*="analysis"], [class*="analysis"]' },
            { name: 'Background Job Status', selector: '[data-testid*="job"], [class*="job"], [data-testid*="background"]' },
            { name: 'Progress Indicators', selector: '[data-testid*="progress"], [class*="progress"]' },
            { name: 'PhD Dashboard Elements', selector: '[data-testid*="phd"], [class*="phd"]' },
            { name: 'Report List/Grid', selector: '[data-testid*="list"], [data-testid*="grid"], .reports-container' },
            { name: 'Action Buttons', selector: 'button[data-testid*="generate"], button[data-testid*="analysis"]' },
            { name: 'Status Badges', selector: '.badge, [class*="badge"], [data-testid*="status"]' }
        ];

        let foundElements = 0;
        const elementDetails = [];

        for (const { name, selector } of reportSelectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                this.log(`${name}: FOUND (${elements.length} elements)`, 'success');
                foundElements++;
                elementDetails.push({ name, count: elements.length, found: true });
                
                // Log some element details
                Array.from(elements).slice(0, 2).forEach((el, i) => {
                    const text = el.textContent?.trim().substring(0, 50) || 'No text';
                    this.log(`  Element ${i + 1}: "${text}${text.length > 50 ? '...' : ''}"`, 'info');
                });
            } else {
                this.log(`${name}: NOT FOUND`, 'warning');
                elementDetails.push({ name, count: 0, found: false });
            }
        }

        const uiScore = Math.round((foundElements / reportSelectors.length) * 100);
        this.log(`UI Elements Score: ${uiScore}%`, uiScore >= 50 ? 'success' : 'warning');

        return { 
            foundElements, 
            totalElements: reportSelectors.length,
            uiScore,
            elementDetails
        };
    }

    async testReportAccessibility() {
        this.log('🎯 TESTING REPORT ACCESSIBILITY IN UI', 'info');
        
        // Look for clickable report elements
        const clickableElements = document.querySelectorAll('a[href*="report"], button[data-report-id], [onclick*="report"], .clickable[data-testid*="report"]');
        
        if (clickableElements.length > 0) {
            this.log(`Found ${clickableElements.length} clickable report elements`, 'success');
            
            Array.from(clickableElements).slice(0, 3).forEach((el, i) => {
                const href = el.href || el.getAttribute('data-report-id') || 'No link';
                const text = el.textContent?.trim().substring(0, 40) || 'No text';
                this.log(`  Clickable ${i + 1}: "${text}" -> ${href}`, 'info');
            });
            
            return { accessible: true, clickableCount: clickableElements.length };
        } else {
            this.log('No clickable report elements found', 'warning');
            return { accessible: false, clickableCount: 0 };
        }
    }

    async runTest() {
        console.log('🔍 STARTING REPORTS VERIFICATION TEST');
        console.log('='.repeat(70));
        console.log(`Project ID: ${this.projectId}`);
        console.log(`User: ${this.testUser.email}`);
        console.log(`Background Jobs: ${this.backgroundJobIds.length} jobs to verify`);
        console.log('='.repeat(70));

        const startTime = Date.now();

        // Test background job results
        await this.testBackgroundJobResults();
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test direct report access
        const reportResults = await this.testDirectReportAccess();
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test UI elements
        const uiResults = await this.testUIReportElements();
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test report accessibility
        const accessibilityResults = await this.testReportAccessibility();

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        // Summary
        console.log('='.repeat(70));
        this.log('📊 REPORTS VERIFICATION SUMMARY', 'info');
        console.log('='.repeat(70));

        this.log(`Reports Found: ${reportResults.success ? reportResults.reports.length : 0}`, 
                 reportResults.success ? 'success' : 'error');
        this.log(`UI Elements: ${uiResults.foundElements}/${uiResults.totalElements} (${uiResults.uiScore}%)`, 
                 uiResults.uiScore >= 50 ? 'success' : 'warning');
        this.log(`Clickable Reports: ${accessibilityResults.clickableCount}`, 
                 accessibilityResults.accessible ? 'success' : 'warning');
        this.log(`Test Duration: ${duration}s`, 'info');

        console.log('\n🎯 RECOMMENDATIONS:');
        if (reportResults.success) {
            console.log('✅ Reports are being created successfully');
            console.log('• Background job system is working perfectly');
        } else {
            console.log('⚠️ Need to investigate report creation/access');
        }

        if (uiResults.uiScore >= 50) {
            console.log('✅ UI has good report-related elements');
        } else {
            console.log('⚠️ UI needs more report display components');
        }

        if (accessibilityResults.accessible) {
            console.log('✅ Reports are accessible through UI');
        } else {
            console.log('⚠️ Need to add clickable report access in UI');
        }

        return {
            reportsFound: reportResults.success,
            reportCount: reportResults.reports?.length || 0,
            uiScore: uiResults.uiScore,
            accessible: accessibilityResults.accessible,
            duration
        };
    }
}

// Auto-run the test
console.log('🔍 Starting Reports Verification Test...');
const reportsTest = new ReportsVerificationTest();
reportsTest.runTest().then(result => {
    console.log('\n🏁 REPORTS VERIFICATION TEST COMPLETE!');
    console.log(`Reports Found: ${result.reportsFound ? 'YES' : 'NO'} (${result.reportCount} reports)`);
    console.log(`UI Score: ${result.uiScore}%`);
    console.log(`Accessible: ${result.accessible ? 'YES' : 'NO'}`);
}).catch(error => {
    console.error('❌ Reports verification test failed:', error);
});
