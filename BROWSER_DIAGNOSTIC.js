/**
 * Browser-Compatible Vercel Deployment Diagnostic Script
 * Run this directly in the browser console (F12 -> Console -> paste and run)
 */

class BrowserDiagnostic {
    constructor() {
        this.frontendUrl = 'https://frontend-psi-seven-85.vercel.app';
        this.backendUrl = 'https://r-dagent-production.up.railway.app';
        this.testResults = [];
        this.testUser = {
            email: 'fredericle77@gmail.com',
            password: 'qwerty1234',
            userId: null
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const styles = {
            'info': 'color: #2196F3; font-weight: bold;',
            'success': 'color: #4CAF50; font-weight: bold;',
            'error': 'color: #F44336; font-weight: bold;',
            'warning': 'color: #FF9800; font-weight: bold;',
            'websocket': 'color: #9C27B0; font-weight: bold;'
        };
        
        const prefix = {
            'info': '📋',
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'websocket': '🔌'
        }[type] || '📋';
        
        console.log(`%c${prefix} [${timestamp.split('T')[1].split('.')[0]}] ${message}`, styles[type] || styles.info);
    }

    async makeRequest(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            let data;
            try {
                data = await response.json();
            } catch {
                data = {};
            }
            
            return {
                success: response.ok,
                status: response.status,
                data,
                error: response.ok ? null : data.detail || data.message || 'Unknown error'
            };
        } catch (error) {
            return {
                success: false,
                status: 0,
                data: null,
                error: error.message
            };
        }
    }

    async testBackendHealth() {
        this.log('🏥 TESTING BACKEND HEALTH (via frontend proxy)', 'info');

        // Use frontend proxy to avoid CORS issues
        const result = await this.makeRequest(`${this.frontendUrl}/api/proxy/health`);

        if (result.success) {
            this.log('Backend health check passed', 'success');
            this.testResults.push({ test: 'Backend Health', status: 'PASS', details: result.data });
        } else {
            this.log(`Backend health check failed: ${result.error}`, 'error');
            this.testResults.push({ test: 'Backend Health', status: 'FAIL', details: result.error });
        }

        return result.success;
    }

    async testAuthentication() {
        this.log('🔐 TESTING AUTHENTICATION SYSTEM', 'info');
        
        // Test signin with existing user
        this.log('Testing signin with existing credentials...', 'info');
        const signinResult = await this.makeRequest(`${this.frontendUrl}/api/proxy/auth/signin`, {
            method: 'POST',
            body: JSON.stringify({
                email: this.testUser.email,
                password: this.testUser.password
            })
        });

        if (signinResult.success) {
            this.log('Signin test passed', 'success');
            this.testUser.userId = signinResult.data.user_id;
            this.testResults.push({ 
                test: 'Authentication Signin', 
                status: 'PASS', 
                details: { userId: this.testUser.userId, email: signinResult.data.email }
            });
            return true;
        } else {
            this.log(`Signin test failed: ${signinResult.error}`, 'error');
            this.testResults.push({ 
                test: 'Authentication Signin', 
                status: 'FAIL', 
                details: signinResult.error 
            });
            return false;
        }
    }

    async testWebSocketConnections() {
        this.log('🔌 TESTING WEBSOCKET CONNECTIONS', 'websocket');
        
        if (!this.testUser.userId) {
            this.log('Cannot test WebSocket - no user ID available', 'warning');
            return false;
        }

        const tests = [
            {
                name: 'User Notifications WebSocket',
                url: `wss://r-dagent-production.up.railway.app/ws/${encodeURIComponent(this.testUser.userId)}`,
                timeout: 10000
            },
            {
                name: 'Project WebSocket',
                url: `wss://r-dagent-production.up.railway.app/ws/project/test-project-diagnostic`,
                timeout: 10000
            }
        ];

        const results = [];
        
        for (const test of tests) {
            this.log(`Testing ${test.name}...`, 'websocket');
            
            const result = await this.testWebSocketConnection(test.url, test.timeout);
            results.push(result);
            
            if (result.success) {
                this.log(`${test.name} connection successful`, 'success');
                this.testResults.push({ 
                    test: test.name, 
                    status: 'PASS', 
                    details: result.details 
                });
            } else {
                this.log(`${test.name} connection failed: ${result.error}`, 'error');
                this.testResults.push({ 
                    test: test.name, 
                    status: 'FAIL', 
                    details: result.error 
                });
            }
        }

        return results.every(r => r.success);
    }

    async testWebSocketConnection(url, timeout = 10000) {
        return new Promise((resolve) => {
            // Check if WebSocket is available
            if (typeof WebSocket === 'undefined') {
                resolve({
                    success: false,
                    error: 'WebSocket not available in this environment',
                    details: { url, error: 'WebSocket API not supported' }
                });
                return;
            }

            let ws;
            let resolved = false;

            try {
                ws = new WebSocket(url);
            } catch (error) {
                resolve({
                    success: false,
                    error: `Failed to create WebSocket: ${error.message}`,
                    details: { url, error: error.message }
                });
                return;
            }

            const timer = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    if (ws && ws.readyState === WebSocket.CONNECTING) {
                        ws.close();
                    }
                    resolve({
                        success: false,
                        error: 'Connection timeout',
                        details: { url, timeout }
                    });
                }
            }, timeout);

            ws.onopen = () => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timer);

                    // Send test message
                    try {
                        ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
                    } catch (error) {
                        this.log(`Failed to send ping: ${error.message}`, 'warning');
                    }

                    // Wait for response or close after success
                    setTimeout(() => {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.close();
                        }
                        resolve({
                            success: true,
                            details: { url, connected: true }
                        });
                    }, 1000);
                }
            };

            ws.onerror = (error) => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timer);
                    resolve({
                        success: false,
                        error: error.message || 'WebSocket connection error',
                        details: { url, error: error.message || 'Connection failed' }
                    });
                }
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.log(`WebSocket message received: ${JSON.stringify(message)}`, 'websocket');
                } catch (e) {
                    this.log(`WebSocket raw message: ${event.data}`, 'websocket');
                }
            };
        });
    }

    async testCriticalEndpoints() {
        this.log('🔗 TESTING CRITICAL API ENDPOINTS', 'info');
        
        const endpoints = [
            {
                name: 'Projects List',
                url: `${this.frontendUrl}/api/proxy/projects?user_id=${this.testUser.userId || 'test'}`,
                method: 'GET'
            },
            {
                name: 'Health Check',
                url: `${this.frontendUrl}/api/proxy/health`,
                method: 'GET'
            }
        ];

        let allPassed = true;

        for (const endpoint of endpoints) {
            this.log(`Testing ${endpoint.name}...`, 'info');
            
            const result = await this.makeRequest(endpoint.url, {
                method: endpoint.method,
                headers: {
                    'User-ID': this.testUser.userId || 'test'
                }
            });

            if (result.success) {
                this.log(`${endpoint.name} test passed`, 'success');
                this.testResults.push({ 
                    test: endpoint.name, 
                    status: 'PASS', 
                    details: { status: result.status }
                });
            } else {
                this.log(`${endpoint.name} test failed: ${result.error}`, 'error');
                this.testResults.push({ 
                    test: endpoint.name, 
                    status: 'FAIL', 
                    details: result.error 
                });
                allPassed = false;
            }
        }

        return allPassed;
    }

    async runDiagnostic() {
        this.log('🚀 STARTING BROWSER DIAGNOSTIC', 'info');
        console.log('='.repeat(60));
        
        const startTime = Date.now();
        
        // Run all tests
        const backendHealthy = await this.testBackendHealth();
        const authWorking = await this.testAuthentication();
        const websocketsWorking = await this.testWebSocketConnections();
        const endpointsWorking = await this.testCriticalEndpoints();
        
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        // Generate summary
        console.log('='.repeat(60));
        this.log('📊 DIAGNOSTIC SUMMARY', 'info');
        console.log('='.repeat(60));
        
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        
        this.log(`Total Tests: ${this.testResults.length}`, 'info');
        this.log(`Passed: ${passed}`, passed > 0 ? 'success' : 'info');
        this.log(`Failed: ${failed}`, failed > 0 ? 'error' : 'info');
        this.log(`Duration: ${duration}s`, 'info');
        
        // Detailed results
        console.log('\n📋 DETAILED RESULTS:');
        this.testResults.forEach(result => {
            const status = result.status === 'PASS' ? '✅' : '❌';
            this.log(`${status} ${result.test}: ${result.status}`, 'info');
            if (result.status === 'FAIL') {
                this.log(`   Error: ${JSON.stringify(result.details)}`, 'error');
            }
        });
        
        // Recommendations
        console.log('\n🔧 RECOMMENDATIONS:');
        
        if (!backendHealthy) {
            this.log('• Backend health check failed - verify Railway deployment', 'warning');
        }
        
        if (!authWorking) {
            this.log('• Authentication failed - check credentials and API proxy', 'warning');
        }
        
        if (!websocketsWorking) {
            this.log('• WebSocket connections failed - notification system will show red dot', 'warning');
            this.log('• Check WebSocket URL configuration in frontend', 'warning');
        }
        
        if (!endpointsWorking) {
            this.log('• Some API endpoints failed - check proxy configuration', 'warning');
        }
        
        if (passed === this.testResults.length) {
            this.log('🎉 ALL TESTS PASSED! Deployment is healthy.', 'success');
        } else {
            this.log('⚠️ Some tests failed. Review the issues above.', 'warning');
        }
        
        return {
            success: passed === this.testResults.length,
            results: this.testResults,
            summary: { passed, failed, duration }
        };
    }
}

// Auto-run diagnostic
console.log('🚀 Starting Browser Diagnostic...');
const diagnostic = new BrowserDiagnostic();
diagnostic.runDiagnostic().then(result => {
    console.log('\n🎯 DIAGNOSTIC COMPLETE!');
    console.log('Result:', result.success ? '✅ SUCCESS' : '❌ FAILED');
}).catch(error => {
    console.error('❌ Diagnostic failed:', error);
});
