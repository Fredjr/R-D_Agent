/**
 * Simple Browser Test for Vercel Deployment
 * Tests only what's accessible from the browser without CORS issues
 */

class SimpleBrowserTest {
    constructor() {
        this.frontendUrl = window.location.origin; // Use current origin
        this.testResults = [];
        this.testUser = {
            email: 'fredericle77@gmail.com',
            password: 'qwerty1234',
            userId: null
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
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
        
        console.log(`%c${prefix} [${timestamp}] ${message}`, styles[type] || styles.info);
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
                data = await response.text();
            }
            
            return {
                success: response.ok,
                status: response.status,
                data,
                error: response.ok ? null : (typeof data === 'object' ? data.detail || data.message : data) || 'Unknown error'
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

    async testAuthentication() {
        this.log('🔐 TESTING AUTHENTICATION', 'info');
        
        const signinResult = await this.makeRequest(`${this.frontendUrl}/api/proxy/auth/signin`, {
            method: 'POST',
            body: JSON.stringify({
                email: this.testUser.email,
                password: this.testUser.password
            })
        });

        if (signinResult.success) {
            this.log('✅ Authentication test PASSED', 'success');
            this.testUser.userId = signinResult.data.user_id;
            this.testResults.push({ test: 'Authentication', status: 'PASS', details: signinResult.data });
            return true;
        } else {
            this.log(`❌ Authentication test FAILED: ${signinResult.error}`, 'error');
            this.testResults.push({ test: 'Authentication', status: 'FAIL', details: signinResult.error });
            return false;
        }
    }

    async testAPIEndpoints() {
        this.log('🔗 TESTING API ENDPOINTS', 'info');
        
        const endpoints = [
            {
                name: 'Health Check',
                url: `${this.frontendUrl}/api/proxy/health`,
                method: 'GET'
            },
            {
                name: 'Projects List',
                url: `${this.frontendUrl}/api/proxy/projects?user_id=${this.testUser.userId || 'test'}`,
                method: 'GET'
            }
        ];

        let allPassed = true;

        for (const endpoint of endpoints) {
            const result = await this.makeRequest(endpoint.url, {
                method: endpoint.method,
                headers: {
                    'User-ID': this.testUser.userId || 'test'
                }
            });

            if (result.success) {
                this.log(`✅ ${endpoint.name} PASSED`, 'success');
                this.testResults.push({ test: endpoint.name, status: 'PASS', details: result.status });
            } else {
                this.log(`❌ ${endpoint.name} FAILED: ${result.error}`, 'error');
                this.testResults.push({ test: endpoint.name, status: 'FAIL', details: result.error });
                allPassed = false;
            }
        }

        return allPassed;
    }

    testWebSocketAvailability() {
        this.log('🔌 TESTING WEBSOCKET AVAILABILITY', 'websocket');
        
        if (typeof WebSocket !== 'undefined') {
            this.log('✅ WebSocket API is available', 'success');
            this.testResults.push({ test: 'WebSocket API', status: 'PASS', details: 'Available' });
            return true;
        } else {
            this.log('❌ WebSocket API is not available', 'error');
            this.testResults.push({ test: 'WebSocket API', status: 'FAIL', details: 'Not available' });
            return false;
        }
    }

    async testWebSocketConnection() {
        this.log('🔌 TESTING WEBSOCKET CONNECTION', 'websocket');
        
        if (!this.testUser.userId) {
            this.log('⚠️ Cannot test WebSocket - no user ID', 'warning');
            return false;
        }

        if (typeof WebSocket === 'undefined') {
            this.log('❌ WebSocket not available', 'error');
            return false;
        }

        return new Promise((resolve) => {
            const wsUrl = `wss://r-dagent-production.up.railway.app/ws/${encodeURIComponent(this.testUser.userId)}`;
            this.log(`Connecting to: ${wsUrl}`, 'websocket');
            
            let ws;
            let resolved = false;
            
            try {
                ws = new WebSocket(wsUrl);
            } catch (error) {
                this.log(`❌ Failed to create WebSocket: ${error.message}`, 'error');
                this.testResults.push({ test: 'WebSocket Connection', status: 'FAIL', details: error.message });
                resolve(false);
                return;
            }
            
            const timer = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    if (ws && ws.readyState === WebSocket.CONNECTING) {
                        ws.close();
                    }
                    this.log('❌ WebSocket connection timeout', 'error');
                    this.testResults.push({ test: 'WebSocket Connection', status: 'FAIL', details: 'Timeout' });
                    resolve(false);
                }
            }, 10000);

            ws.onopen = () => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timer);
                    this.log('✅ WebSocket connection PASSED', 'success');
                    this.testResults.push({ test: 'WebSocket Connection', status: 'PASS', details: 'Connected' });
                    
                    // Send test ping
                    try {
                        ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
                    } catch (error) {
                        this.log(`⚠️ Failed to send ping: ${error.message}`, 'warning');
                    }
                    
                    setTimeout(() => {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.close();
                        }
                        resolve(true);
                    }, 2000);
                }
            };

            ws.onerror = (error) => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timer);
                    this.log(`❌ WebSocket connection FAILED: ${error.message || 'Connection error'}`, 'error');
                    this.testResults.push({ test: 'WebSocket Connection', status: 'FAIL', details: error.message || 'Connection error' });
                    resolve(false);
                }
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.log(`📨 WebSocket message: ${JSON.stringify(message)}`, 'websocket');
                } catch (e) {
                    this.log(`📨 WebSocket raw: ${event.data}`, 'websocket');
                }
            };
        });
    }

    checkNotificationStatus() {
        this.log('🔔 CHECKING NOTIFICATION STATUS', 'info');
        
        // Check if user is logged in
        const user = JSON.parse(localStorage.getItem('rd_agent_user') || 'null');
        if (user) {
            this.log(`✅ User logged in: ${user.email}`, 'success');
            this.testResults.push({ test: 'User Session', status: 'PASS', details: user.email });
            return true;
        } else {
            this.log('⚠️ No user session found', 'warning');
            this.testResults.push({ test: 'User Session', status: 'FAIL', details: 'Not logged in' });
            return false;
        }
    }

    async runAllTests() {
        this.log('🚀 STARTING SIMPLE BROWSER TESTS', 'info');
        console.log('='.repeat(60));
        
        const startTime = Date.now();
        
        // Run tests
        const sessionOk = this.checkNotificationStatus();
        const authOk = await this.testAuthentication();
        const apiOk = await this.testAPIEndpoints();
        const wsAvailable = this.testWebSocketAvailability();
        const wsOk = wsAvailable ? await this.testWebSocketConnection() : false;
        
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        // Summary
        console.log('='.repeat(60));
        this.log('📊 TEST SUMMARY', 'info');
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
        });
        
        if (passed === this.testResults.length) {
            this.log('🎉 ALL TESTS PASSED! Deployment is healthy.', 'success');
        } else {
            this.log(`⚠️ ${failed} test(s) failed. Check the issues above.`, 'warning');
        }
        
        return {
            success: passed === this.testResults.length,
            results: this.testResults,
            summary: { passed, failed, duration }
        };
    }
}

// Auto-run
console.log('🚀 Starting Simple Browser Tests...');
const test = new SimpleBrowserTest();
test.runAllTests().then(result => {
    console.log('\n🎯 TESTS COMPLETE!');
    console.log('Result:', result.success ? '✅ SUCCESS' : '❌ SOME FAILURES');
    
    // Provide manual test instructions
    console.log('\n🔧 MANUAL TESTS YOU CAN DO:');
    console.log('1. Check notification bell in top-right corner');
    console.log('2. Try signing out and signing back in');
    console.log('3. Look for green dot (connected) vs red dot (disconnected)');
    console.log('4. Test creating a new project or collection');
}).catch(error => {
    console.error('❌ Tests failed:', error);
});
