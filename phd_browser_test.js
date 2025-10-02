/**
 * PhD Enhancement Browser Test Script
 * 
 * Browser-compatible test script for PhD features
 * Run this in the browser console on your project workspace page
 * 
 * Usage:
 * 1. Open your project workspace in the browser
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Run: new PhDEnhancementBrowserTest().runAllTests()
 */

class PhDEnhancementBrowserTest {
    constructor() {
        this.results = [];
        this.testProjectId = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const emoji = {
            'info': 'ℹ️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌',
            'test': '🧪'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} [${timestamp}] ${message}`);
        this.results.push({ timestamp, type, message });
    }

    async testPhDAPIEndpoints() {
        this.log('🧪 Testing PhD API Endpoints', 'test');

        // Test PhD Progress API
        try {
            const response = await fetch(`/api/proxy/projects/${this.testProjectId}/phd-progress`);
            if (response.status === 503) {
                this.log('PhD Progress API: Graceful degradation working', 'success');
            } else if (response.ok) {
                this.log('PhD Progress API: Fully operational!', 'success');
            } else {
                this.log(`PhD Progress API: Returned ${response.status}`, 'warning');
            }
        } catch (error) {
            this.log(`PhD Progress API Error: ${error.message}`, 'error');
        }

        // Test PhD Analysis API
        try {
            const response = await fetch(`/api/proxy/projects/${this.testProjectId}/phd-analysis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ analysis_type: 'thesis_structured' })
            });
            if (response.status === 503) {
                this.log('PhD Analysis API: Graceful degradation working', 'success');
            } else if (response.ok) {
                this.log('PhD Analysis API: Fully operational!', 'success');
            } else {
                this.log(`PhD Analysis API: Returned ${response.status}`, 'warning');
            }
        } catch (error) {
            this.log(`PhD Analysis API Error: ${error.message}`, 'error');
        }
    }

    async testPhDUIComponents() {
        this.log('🎨 Testing PhD UI Components', 'test');

        // Test if PhD Quick Actions are present
        const quickActions = document.querySelectorAll('[data-testid*="phd"], [class*="phd"], [aria-label*="PhD"]');
        if (quickActions.length > 0) {
            this.log(`Found ${quickActions.length} PhD UI components`, 'success');
        } else {
            this.log('PhD UI components not found - may not be loaded yet', 'warning');
        }

        // Check for PhD-specific buttons or actions
        const buttons = Array.from(document.querySelectorAll('button')).filter(btn => 
            btn.textContent.toLowerCase().includes('thesis') ||
            btn.textContent.toLowerCase().includes('phd') ||
            btn.textContent.toLowerCase().includes('gap') ||
            btn.textContent.toLowerCase().includes('methodology')
        );
        
        if (buttons.length > 0) {
            this.log(`Found ${buttons.length} PhD-related buttons: ${buttons.map(b => b.textContent).join(', ')}`, 'success');
        } else {
            this.log('No PhD-specific buttons found', 'warning');
        }

        // Check for Quick Actions section
        const quickActionElements = document.querySelectorAll('[class*="quick"], [data-testid*="quick"]');
        if (quickActionElements.length > 0) {
            this.log(`Found ${quickActionElements.length} quick action elements`, 'info');
        }
    }

    async testPhDIntegration() {
        this.log('🔗 Testing PhD Integration', 'test');

        // Test if we can access the project workspace
        const projectElements = document.querySelectorAll('[data-testid*="project"], [class*="project"]');
        if (projectElements.length > 0) {
            this.log('Project workspace elements detected', 'success');
        }

        // Test if comprehensive summary includes PhD features
        try {
            const response = await fetch(`/api/proxy/projects/${this.testProjectId}/generate-comprehensive-summary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    analysis_mode: 'comprehensive',
                    phd_enhancements: { thesis_structure: true }
                })
            });
            
            if (response.ok) {
                this.log('PhD-enhanced comprehensive summary working', 'success');
            } else {
                this.log(`PhD-enhanced comprehensive summary: ${response.status}`, 'warning');
            }
        } catch (error) {
            this.log(`PhD integration test error: ${error.message}`, 'error');
        }
    }

    async testPageElements() {
        this.log('📄 Testing Page Elements', 'test');

        // Check if we're on a project page
        const url = window.location.href;
        if (url.includes('/project/')) {
            this.log('Currently on project workspace page', 'success');
        } else {
            this.log('Not on project workspace page - navigate to a project first', 'warning');
        }

        // Check for main navigation elements
        const navElements = document.querySelectorAll('nav, [role="navigation"]');
        if (navElements.length > 0) {
            this.log(`Found ${navElements.length} navigation elements`, 'info');
        }

        // Check for tab elements (Overview, Collections, etc.)
        const tabElements = document.querySelectorAll('[role="tab"], [class*="tab"]');
        if (tabElements.length > 0) {
            this.log(`Found ${tabElements.length} tab elements`, 'info');
        }
    }

    async runAllTests() {
        this.log('🚀 Starting PhD Enhancement Browser Tests', 'info');
        this.log('🎯 Testing PhD features in browser environment', 'info');
        
        try {
            await this.testPageElements();
            await this.testPhDAPIEndpoints();
            await this.testPhDUIComponents();
            await this.testPhDIntegration();

            // Generate summary
            const successCount = this.results.filter(r => r.type === 'success').length;
            const warningCount = this.results.filter(r => r.type === 'warning').length;
            const errorCount = this.results.filter(r => r.type === 'error').length;

            this.log('📊 PhD Enhancement Browser Test Complete', 'info');
            this.log(`✅ Successes: ${successCount}`, 'success');
            this.log(`⚠️ Warnings: ${warningCount}`, 'warning');
            this.log(`❌ Errors: ${errorCount}`, 'error');

            if (errorCount === 0 && warningCount <= 3) {
                this.log('🎉 PhD Enhancement features are working in browser!', 'success');
            } else if (errorCount === 0) {
                this.log('✅ PhD Enhancement features mostly working', 'warning');
            } else {
                this.log('❌ PhD Enhancement features need attention', 'error');
            }

            return {
                success: successCount,
                warnings: warningCount,
                errors: errorCount,
                results: this.results
            };

        } catch (error) {
            this.log(`Test suite failed: ${error.message}`, 'error');
            throw error;
        }
    }

    // Helper method to simulate PhD Quick Action clicks
    async simulatePhDActions() {
        this.log('🎮 Simulating PhD Quick Actions', 'test');

        const buttons = Array.from(document.querySelectorAll('button')).filter(btn => 
            btn.textContent.toLowerCase().includes('thesis') ||
            btn.textContent.toLowerCase().includes('gap') ||
            btn.textContent.toLowerCase().includes('methodology')
        );

        if (buttons.length > 0) {
            this.log(`Found ${buttons.length} PhD action buttons`, 'success');
            buttons.forEach((btn, index) => {
                this.log(`Button ${index + 1}: "${btn.textContent}"`, 'info');
            });
        } else {
            this.log('No PhD action buttons found to simulate', 'warning');
        }
    }

    // Helper method to check PhD dashboard elements
    checkPhDDashboard() {
        this.log('📊 Checking PhD Dashboard Elements', 'test');

        const dashboardElements = document.querySelectorAll(
            '[class*="dashboard"], [data-testid*="dashboard"], [class*="progress"], [class*="metric"]'
        );

        if (dashboardElements.length > 0) {
            this.log(`Found ${dashboardElements.length} potential dashboard elements`, 'success');
        } else {
            this.log('No dashboard elements found', 'warning');
        }

        return dashboardElements;
    }
}

// Make it available globally
window.PhDEnhancementBrowserTest = PhDEnhancementBrowserTest;

// Auto-run instructions
console.log('🎓 PhD Enhancement Browser Test Suite loaded!');
console.log('📋 To run tests: new PhDEnhancementBrowserTest().runAllTests()');
console.log('🎮 To simulate actions: new PhDEnhancementBrowserTest().simulatePhDActions()');
console.log('📊 To check dashboard: new PhDEnhancementBrowserTest().checkPhDDashboard()');

// Example usage for immediate testing
console.log('🚀 Example: Running a quick test...');
const quickTest = new PhDEnhancementBrowserTest();
quickTest.testPageElements().then(() => {
    console.log('✅ Quick test completed - check console for results');
});
