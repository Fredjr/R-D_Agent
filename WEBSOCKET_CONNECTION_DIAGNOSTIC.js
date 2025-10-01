/**
 * WEBSOCKET CONNECTION DIAGNOSTIC v1.0
 * 
 * Diagnostic script to test WebSocket connections and identify issues
 * causing infinite retry loops and page loading problems.
 * 
 * Usage: Copy and paste this script into browser console on your frontend domain
 */

class WebSocketConnectionDiagnostic {
    constructor() {
        this.baseUrl = 'https://frontend-psi-seven-85.vercel.app';
        this.backendUrl = 'https://r-dagent-production.up.railway.app';
        this.testUserId = 'fredericle77@gmail.com';
        this.testProjectId = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
        this.results = [];
        this.startTime = Date.now();
    }

    log(message, type = 'info', data = null) {
        const timestamp = new Date().toISOString();
        const elapsed = Date.now() - this.startTime;
        const logEntry = { timestamp, type, message, data, elapsed };
        this.results.push(logEntry);
        
        const emoji = {
            'info': 'ℹ️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌',
            'websocket': '🔌',
            'test': '🧪'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} [${timestamp}] [+${elapsed}ms] ${message}`);
        if (data) {
            console.log('Data:', data);
        }
    }

    async testBackendHealth() {
        this.log('🔌 Testing backend health and availability', 'websocket');
        
        try {
            const response = await fetch(`${this.backendUrl}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.log('✅ Backend health check passed', 'success', data);
                return { success: true, data };
            } else {
                this.log(`❌ Backend health check failed: HTTP ${response.status}`, 'error');
                return { success: false, status: response.status };
            }
        } catch (error) {
            this.log(`❌ Backend health check error: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    async testUserNotificationWebSocket() {
        this.log('🔌 Testing user notification WebSocket connection', 'websocket');
        
        return new Promise((resolve) => {
            const wsUrl = `wss://r-dagent-production.up.railway.app/ws/${encodeURIComponent(this.testUserId)}`;
            this.log(`Attempting connection to: ${wsUrl}`, 'info');
            
            let connectionResult = {
                success: false,
                url: wsUrl,
                error: null,
                connectionTime: null,
                messageReceived: false
            };

            try {
                const startTime = Date.now();
                const ws = new WebSocket(wsUrl);
                
                // Set timeout for connection
                const timeout = setTimeout(() => {
                    if (ws.readyState === WebSocket.CONNECTING) {
                        connectionResult.error = 'Connection timeout (10s)';
                        ws.close();
                        this.log('❌ User notification WebSocket connection timeout', 'error');
                        resolve(connectionResult);
                    }
                }, 10000);

                ws.onopen = () => {
                    clearTimeout(timeout);
                    connectionResult.success = true;
                    connectionResult.connectionTime = Date.now() - startTime;
                    this.log(`✅ User notification WebSocket connected in ${connectionResult.connectionTime}ms`, 'success');
                    
                    // Send a test ping
                    ws.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }));
                    
                    // Wait for response or timeout
                    setTimeout(() => {
                        ws.close(1000, 'Test complete');
                        resolve(connectionResult);
                    }, 5000);
                };

                ws.onmessage = (event) => {
                    connectionResult.messageReceived = true;
                    this.log(`📥 User notification WebSocket message received: ${event.data}`, 'success');
                };

                ws.onclose = (event) => {
                    clearTimeout(timeout);
                    this.log(`🔌 User notification WebSocket closed: ${event.code} - ${event.reason}`, 'info');
                    if (!connectionResult.success && !connectionResult.error) {
                        connectionResult.error = `Connection closed: ${event.code} - ${event.reason}`;
                    }
                    resolve(connectionResult);
                };

                ws.onerror = (error) => {
                    clearTimeout(timeout);
                    connectionResult.error = 'WebSocket error occurred';
                    this.log('❌ User notification WebSocket error', 'error', error);
                    resolve(connectionResult);
                };

            } catch (error) {
                connectionResult.error = error.message;
                this.log(`❌ User notification WebSocket creation failed: ${error.message}`, 'error');
                resolve(connectionResult);
            }
        });
    }

    async testProjectWebSocket() {
        this.log('🔌 Testing project WebSocket connection', 'websocket');
        
        return new Promise((resolve) => {
            const wsUrl = `wss://r-dagent-production.up.railway.app/ws/project/${this.testProjectId}`;
            this.log(`Attempting connection to: ${wsUrl}`, 'info');
            
            let connectionResult = {
                success: false,
                url: wsUrl,
                error: null,
                connectionTime: null,
                messageReceived: false
            };

            try {
                const startTime = Date.now();
                const ws = new WebSocket(wsUrl);
                
                // Set timeout for connection
                const timeout = setTimeout(() => {
                    if (ws.readyState === WebSocket.CONNECTING) {
                        connectionResult.error = 'Connection timeout (10s)';
                        ws.close();
                        this.log('❌ Project WebSocket connection timeout', 'error');
                        resolve(connectionResult);
                    }
                }, 10000);

                ws.onopen = () => {
                    clearTimeout(timeout);
                    connectionResult.success = true;
                    connectionResult.connectionTime = Date.now() - startTime;
                    this.log(`✅ Project WebSocket connected in ${connectionResult.connectionTime}ms`, 'success');
                    
                    // Send a test ping
                    ws.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }));
                    
                    // Wait for response or timeout
                    setTimeout(() => {
                        ws.close(1000, 'Test complete');
                        resolve(connectionResult);
                    }, 5000);
                };

                ws.onmessage = (event) => {
                    connectionResult.messageReceived = true;
                    this.log(`📥 Project WebSocket message received: ${event.data}`, 'success');
                };

                ws.onclose = (event) => {
                    clearTimeout(timeout);
                    this.log(`🔌 Project WebSocket closed: ${event.code} - ${event.reason}`, 'info');
                    if (!connectionResult.success && !connectionResult.error) {
                        connectionResult.error = `Connection closed: ${event.code} - ${event.reason}`;
                    }
                    resolve(connectionResult);
                };

                ws.onerror = (error) => {
                    clearTimeout(timeout);
                    connectionResult.error = 'WebSocket error occurred';
                    this.log('❌ Project WebSocket error', 'error', error);
                    resolve(connectionResult);
                };

            } catch (error) {
                connectionResult.error = error.message;
                this.log(`❌ Project WebSocket creation failed: ${error.message}`, 'error');
                resolve(connectionResult);
            }
        });
    }

    async testAPIEndpoints() {
        this.log('🔌 Testing critical API endpoints', 'test');
        
        const endpoints = [
            `/api/proxy/projects/${this.testProjectId}`,
            `/api/proxy/projects/${this.testProjectId}/collections`,
            '/api/debug',
            '/api/proxy/pubmed/recommendations'
        ];

        const results = {};

        for (const endpoint of endpoints) {
            try {
                const startTime = Date.now();
                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-ID': this.testUserId
                    }
                });
                const responseTime = Date.now() - startTime;

                results[endpoint] = {
                    success: response.ok,
                    status: response.status,
                    responseTime: responseTime
                };

                if (response.ok) {
                    this.log(`✅ ${endpoint}: HTTP ${response.status} (${responseTime}ms)`, 'success');
                } else {
                    this.log(`❌ ${endpoint}: HTTP ${response.status} (${responseTime}ms)`, 'error');
                }
            } catch (error) {
                results[endpoint] = {
                    success: false,
                    error: error.message
                };
                this.log(`❌ ${endpoint}: ${error.message}`, 'error');
            }
        }

        return results;
    }

    async runComprehensiveDiagnostic() {
        this.log('🧪 STARTING WEBSOCKET CONNECTION DIAGNOSTIC', 'test');
        this.log(`Frontend: ${this.baseUrl}`, 'info');
        this.log(`Backend: ${this.backendUrl}`, 'info');
        this.log(`Test User: ${this.testUserId}`, 'info');
        this.log(`Test Project: ${this.testProjectId}`, 'info');
        
        const diagnosticResults = {
            startTime: new Date().toISOString(),
            configuration: {
                baseUrl: this.baseUrl,
                backendUrl: this.backendUrl,
                testUserId: this.testUserId,
                testProjectId: this.testProjectId
            },
            tests: {}
        };

        // Run all diagnostic tests
        diagnosticResults.tests.backendHealth = await this.testBackendHealth();
        diagnosticResults.tests.userNotificationWebSocket = await this.testUserNotificationWebSocket();
        diagnosticResults.tests.projectWebSocket = await this.testProjectWebSocket();
        diagnosticResults.tests.apiEndpoints = await this.testAPIEndpoints();

        // Generate summary
        const allTests = Object.values(diagnosticResults.tests);
        const successfulTests = allTests.filter(test => 
            typeof test.success === 'boolean' ? test.success : 
            Object.values(test).some(subTest => subTest.success)
        ).length;
        
        diagnosticResults.summary = {
            totalTests: allTests.length,
            successfulTests: successfulTests,
            failedTests: allTests.length - successfulTests,
            successRate: Math.round((successfulTests / allTests.length) * 100),
            endTime: new Date().toISOString(),
            duration: Date.now() - this.startTime
        };

        // Analyze issues
        diagnosticResults.issues = [];
        if (!diagnosticResults.tests.backendHealth.success) {
            diagnosticResults.issues.push('Backend is not responding - this will cause all WebSocket connections to fail');
        }
        if (!diagnosticResults.tests.userNotificationWebSocket.success) {
            diagnosticResults.issues.push('User notification WebSocket is failing - this causes infinite retry loops');
        }
        if (!diagnosticResults.tests.projectWebSocket.success) {
            diagnosticResults.issues.push('Project WebSocket is failing - real-time updates will not work');
        }

        // Generate recommendations
        diagnosticResults.recommendations = [];
        if (diagnosticResults.issues.length === 0) {
            diagnosticResults.recommendations.push('🎉 All WebSocket connections are working correctly!');
        } else {
            diagnosticResults.recommendations.push('🔧 Consider implementing WebSocket connection fallbacks');
            diagnosticResults.recommendations.push('⏰ Add connection timeouts to prevent infinite retry loops');
            diagnosticResults.recommendations.push('🚫 Disable WebSocket features when backend is unavailable');
        }

        this.log('🎉 WEBSOCKET CONNECTION DIAGNOSTIC COMPLETED', 'success');
        this.log(`✅ Success Rate: ${diagnosticResults.summary.successRate}%`, 'success');
        this.log(`⏱️ Total Duration: ${diagnosticResults.summary.duration}ms`, 'info');

        // Log issues and recommendations
        if (diagnosticResults.issues.length > 0) {
            this.log('🚨 ISSUES IDENTIFIED:', 'warning');
            diagnosticResults.issues.forEach(issue => this.log(`  • ${issue}`, 'warning'));
        }

        this.log('💡 RECOMMENDATIONS:', 'info');
        diagnosticResults.recommendations.forEach(rec => this.log(`  • ${rec}`, 'info'));

        // Store results globally
        window.websocketDiagnosticResults = diagnosticResults;
        window.websocketDiagnosticLogs = this.results;

        return diagnosticResults;
    }
}

// Auto-execute when script is loaded
console.log('🧪 WebSocket Connection Diagnostic v1.0 loaded');
console.log('📋 Usage: const diagnostic = new WebSocketConnectionDiagnostic(); await diagnostic.runComprehensiveDiagnostic();');
console.log('📊 Results will be stored in: window.websocketDiagnosticResults');
console.log('📝 Logs will be stored in: window.websocketDiagnosticLogs');

// Create global instance for easy access
window.WebSocketConnectionDiagnostic = WebSocketConnectionDiagnostic;
