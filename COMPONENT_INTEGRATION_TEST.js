/**
 * COMPONENT INTEGRATION TEST v1.0
 * 
 * Tests UI component integration and real-time features
 * Verifies components work correctly on actual project pages
 */

class ComponentIntegrationTest {
    constructor() {
        this.results = [];
        this.startTime = Date.now();
        this.testProjectId = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
    }

    log(message, type = 'info', data = null) {
        const timestamp = new Date().toISOString();
        const emoji = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${emoji} [${timestamp}] ${message}`);
        if (data) console.log('Data:', data);
        this.results.push({ timestamp, type, message, data });
    }

    testCurrentPageComponents() {
        this.log('🧩 TESTING CURRENT PAGE COMPONENTS', 'info');
        
        const components = [
            { name: 'NotificationCenter', selectors: ['[data-testid="notification-center"]', '.notification-center', '#notification-center'] },
            { name: 'ActivityFeed', selectors: ['[data-testid="activity-feed"]', '.activity-feed', '#activity-feed'] },
            { name: 'AnnotationsFeed', selectors: ['[data-testid="annotations-feed"]', '.annotations-feed', '#annotations-feed'] },
            { name: 'WebSocket Status', selectors: ['[data-testid="websocket-status"]', '.websocket-status'] },
            { name: 'Real-time Indicators', selectors: ['[data-testid="realtime-indicator"]', '.realtime-indicator', '.connection-status'] }
        ];

        const foundComponents = [];
        const missingComponents = [];

        components.forEach(component => {
            let found = false;
            let element = null;
            
            for (const selector of component.selectors) {
                element = document.querySelector(selector);
                if (element) {
                    found = true;
                    break;
                }
            }

            if (found) {
                foundComponents.push(component.name);
                this.log(`✅ ${component.name} found`, 'success', {
                    selector: component.selectors.find(s => document.querySelector(s)),
                    visible: element.offsetParent !== null,
                    hasContent: element.textContent.trim().length > 0
                });
            } else {
                missingComponents.push(component.name);
                this.log(`⚠️ ${component.name} not found on current page`, 'warning');
            }
        });

        return { foundComponents, missingComponents };
    }

    testWebSocketIntegration() {
        this.log('🔌 TESTING WEBSOCKET INTEGRATION', 'info');
        
        // Check for WebSocket connections in window
        const wsConnections = [];
        
        // Check useNotifications hook
        if (window.useNotifications) {
            wsConnections.push('useNotifications hook available');
            this.log('✅ useNotifications hook found', 'success');
        }

        // Check for WebSocket instances
        const wsInstances = Object.keys(window).filter(key => 
            window[key] && 
            typeof window[key] === 'object' && 
            window[key].constructor && 
            window[key].constructor.name === 'WebSocket'
        );

        if (wsInstances.length > 0) {
            this.log(`✅ Found ${wsInstances.length} WebSocket instances`, 'success', wsInstances);
        } else {
            this.log('⚠️ No WebSocket instances found in window', 'warning');
        }

        return { wsConnections, wsInstances };
    }

    testNavigationToProjectPage() {
        this.log('🔗 TESTING NAVIGATION TO PROJECT PAGE', 'info');
        
        const currentUrl = window.location.href;
        const isProjectPage = currentUrl.includes('/project/');
        
        if (isProjectPage) {
            this.log('✅ Already on project page', 'success', { url: currentUrl });
            return true;
        } else {
            this.log('ℹ️ Not on project page, suggesting navigation', 'info', { 
                currentUrl,
                suggestedUrl: `${window.location.origin}/project/${this.testProjectId}`
            });
            return false;
        }
    }

    async testRealTimeFeatures() {
        this.log('⚡ TESTING REAL-TIME FEATURES', 'info');
        
        // Test if we can trigger real-time updates
        const tests = [
            {
                name: 'WebSocket Ping Test',
                test: () => {
                    // Look for WebSocket pong messages in console
                    const originalLog = console.log;
                    let pongReceived = false;
                    
                    console.log = function(...args) {
                        if (args.some(arg => typeof arg === 'string' && arg.includes('pong'))) {
                            pongReceived = true;
                        }
                        originalLog.apply(console, args);
                    };
                    
                    setTimeout(() => {
                        console.log = originalLog;
                        if (pongReceived) {
                            this.log('✅ WebSocket pong detected', 'success');
                        } else {
                            this.log('⚠️ No WebSocket pong detected in 5s', 'warning');
                        }
                    }, 5000);
                }
            }
        ];

        // Run tests
        tests.forEach(test => {
            try {
                test.test();
                this.log(`🧪 Started ${test.name}`, 'info');
            } catch (error) {
                this.log(`❌ ${test.name} failed`, 'error', { error: error.message });
            }
        });
    }

    async runComponentIntegrationTest() {
        this.log('🚀 STARTING COMPONENT INTEGRATION TEST', 'info');
        
        const componentResults = this.testCurrentPageComponents();
        const wsResults = this.testWebSocketIntegration();
        const navigationResults = this.testNavigationToProjectPage();
        
        await this.testRealTimeFeatures();
        
        const summary = {
            componentsFound: componentResults.foundComponents.length,
            componentsMissing: componentResults.missingComponents.length,
            webSocketConnections: wsResults.wsInstances.length,
            onProjectPage: navigationResults,
            recommendations: []
        };

        // Generate recommendations
        if (summary.componentsMissing > 0) {
            summary.recommendations.push('Some components not found - may be normal depending on current page');
        }
        if (summary.webSocketConnections === 0) {
            summary.recommendations.push('No WebSocket connections detected - check real-time features');
        }
        if (!summary.onProjectPage) {
            summary.recommendations.push(`Navigate to project page to test all components: /project/${this.testProjectId}`);
        }
        if (summary.recommendations.length === 0) {
            summary.recommendations.push('All component integration tests passed!');
        }

        this.log('📊 COMPONENT INTEGRATION TEST COMPLETED', 'info');
        this.log('💡 RECOMMENDATIONS:', 'info');
        summary.recommendations.forEach(rec => this.log(rec, 'info'));

        // Store results
        window.componentIntegrationResults = {
            results: this.results,
            summary,
            componentResults,
            wsResults
        };

        return window.componentIntegrationResults;
    }
}

// Auto-load
console.log('🧩 Component Integration Test v1.0 loaded');
console.log('📋 Usage: const test = new ComponentIntegrationTest(); await test.runComponentIntegrationTest();');
window.ComponentIntegrationTest = ComponentIntegrationTest;
