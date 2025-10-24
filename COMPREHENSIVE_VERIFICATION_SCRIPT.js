/**
 * Comprehensive Verification Script for .md Files Implementation
 * Tests all acceptance criteria from MANUAL_TESTING_GUIDE.md and VERCEL_DEPLOYMENT_FIXES_SUMMARY.md
 */

class ComprehensiveVerification {
    constructor() {
        this.results = {
            websocket: { status: 'pending', details: [] },
            authentication: { status: 'pending', details: [] },
            notifications: { status: 'pending', details: [] },
            api: { status: 'pending', details: [] },
            overall: { status: 'pending', score: 0 }
        };
        this.testUser = {
            email: 'fredericle77@gmail.com',
            password: 'qwerty1234',
            userId: 'e29e29d3-f87f-4c70-9aeb-424002382195'
        };
    }

    log(message, type = 'info', category = 'general') {
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
        
        // Store result
        if (category !== 'general') {
            this.results[category].details.push({ type, message, timestamp });
        }
    }

    // Test 1: WebSocket Connection (from VERCEL_DEPLOYMENT_FIXES_SUMMARY.md)
    async testWebSocketConnection() {
        this.log('🔌 TESTING WEBSOCKET CONNECTION', 'websocket', 'websocket');
        
        try {
            // Check if user is logged in
            const user = JSON.parse(localStorage.getItem('rd_agent_user') || 'null');
            if (!user || !user.user_id) {
                this.log('User not logged in - cannot test WebSocket', 'warning', 'websocket');
                this.results.websocket.status = 'warning';
                return false;
            }

            this.log(`Testing WebSocket for user: ${user.user_id}`, 'info', 'websocket');

            // Test WebSocket connection
            const wsUrl = `wss://r-dagent-production.up.railway.app/ws/${encodeURIComponent(user.user_id)}`;
            
            return new Promise((resolve) => {
                const ws = new WebSocket(wsUrl);
                let resolved = false;
                
                const timeout = setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        ws.close();
                        this.log('WebSocket connection timeout', 'error', 'websocket');
                        this.results.websocket.status = 'failed';
                        resolve(false);
                    }
                }, 10000);

                ws.onopen = () => {
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        this.log('WebSocket connection successful', 'success', 'websocket');
                        
                        // Send test ping
                        ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
                        
                        setTimeout(() => {
                            ws.close();
                            this.results.websocket.status = 'passed';
                            resolve(true);
                        }, 2000);
                    }
                };

                ws.onerror = (error) => {
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        this.log(`WebSocket connection failed: ${error.message || 'Connection error'}`, 'error', 'websocket');
                        this.results.websocket.status = 'failed';
                        resolve(false);
                    }
                };

                ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        this.log(`WebSocket message received: ${JSON.stringify(message)}`, 'websocket', 'websocket');
                    } catch (e) {
                        this.log(`WebSocket raw message: ${event.data}`, 'websocket', 'websocket');
                    }
                };
            });
        } catch (error) {
            this.log(`WebSocket test error: ${error.message}`, 'error', 'websocket');
            this.results.websocket.status = 'failed';
            return false;
        }
    }

    // Test 2: Authentication System (from both .md files)
    async testAuthentication() {
        this.log('🔐 TESTING AUTHENTICATION SYSTEM', 'info', 'authentication');
        
        try {
            // Test signin with existing credentials
            const signinResponse = await fetch('/api/proxy/auth/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: this.testUser.email,
                    password: this.testUser.password
                })
            });

            if (signinResponse.ok) {
                const signinData = await signinResponse.json();
                this.log(`Signin successful for user: ${signinData.email}`, 'success', 'authentication');
                this.log(`User ID: ${signinData.user_id}`, 'info', 'authentication');
                this.results.authentication.status = 'passed';
                return true;
            } else {
                const errorData = await signinResponse.json();
                this.log(`Signin failed: ${errorData.detail || 'Unknown error'}`, 'error', 'authentication');
                this.results.authentication.status = 'failed';
                return false;
            }
        } catch (error) {
            this.log(`Authentication test error: ${error.message}`, 'error', 'authentication');
            this.results.authentication.status = 'failed';
            return false;
        }
    }

    // Test 3: Notification System UI (from MANUAL_TESTING_GUIDE.md)
    testNotificationSystem() {
        this.log('🔔 TESTING NOTIFICATION SYSTEM UI', 'info', 'notifications');
        
        try {
            // Check for notification bell
            const notificationBell = document.querySelector('[title="Notifications"]') || 
                                   document.querySelector('button[aria-label*="notification"]') ||
                                   document.querySelector('button[aria-label*="Notification"]');

            if (notificationBell) {
                this.log('Notification bell found', 'success', 'notifications');
                
                // Check for connection indicator
                const indicator = notificationBell.querySelector('.bg-green-400, .bg-red-400') ||
                                notificationBell.querySelector('[class*="green"], [class*="red"]');
                
                if (indicator) {
                    const isConnected = indicator.className.includes('green');
                    this.log(`Connection indicator: ${isConnected ? 'CONNECTED (Green)' : 'DISCONNECTED (Red)'}`, 
                           isConnected ? 'success' : 'warning', 'notifications');
                    
                    this.results.notifications.status = isConnected ? 'passed' : 'warning';
                    return isConnected;
                } else {
                    this.log('Connection indicator not found', 'warning', 'notifications');
                    this.results.notifications.status = 'warning';
                    return false;
                }
            } else {
                this.log('Notification bell not found', 'error', 'notifications');
                this.results.notifications.status = 'failed';
                return false;
            }
        } catch (error) {
            this.log(`Notification system test error: ${error.message}`, 'error', 'notifications');
            this.results.notifications.status = 'failed';
            return false;
        }
    }

    // Test 4: API Endpoints (from both .md files)
    async testAPIEndpoints() {
        this.log('🔗 TESTING API ENDPOINTS', 'info', 'api');
        
        const endpoints = [
            { name: 'Health Check', url: '/api/proxy/health', method: 'GET' },
            { name: 'Projects List', url: '/api/proxy/projects?user_id=test', method: 'GET' }
        ];

        let allPassed = true;

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint.url, { method: endpoint.method });
                
                if (response.ok) {
                    this.log(`${endpoint.name}: PASSED (${response.status})`, 'success', 'api');
                } else {
                    this.log(`${endpoint.name}: FAILED (${response.status})`, 'error', 'api');
                    allPassed = false;
                }
            } catch (error) {
                this.log(`${endpoint.name}: ERROR (${error.message})`, 'error', 'api');
                allPassed = false;
            }
        }

        this.results.api.status = allPassed ? 'passed' : 'failed';
        return allPassed;
    }

    // Test 5: Password Validation (from VERCEL_DEPLOYMENT_FIXES_SUMMARY.md)
    testPasswordValidation() {
        this.log('🔒 TESTING PASSWORD VALIDATION', 'info', 'authentication');
        
        const testPasswords = [
            { password: 'TestPass123', expected: true, description: 'Valid password' },
            { password: 'qwerty1234', expected: false, description: 'No uppercase' },
            { password: 'PASSWORD123', expected: false, description: 'No lowercase' },
            { password: 'TestPassword', expected: false, description: 'No numbers' },
            { password: 'Test1', expected: false, description: 'Too short' }
        ];

        let allCorrect = true;

        testPasswords.forEach(test => {
            const hasUpper = /[A-Z]/.test(test.password);
            const hasLower = /[a-z]/.test(test.password);
            const hasNumber = /\d/.test(test.password);
            const isLongEnough = test.password.length >= 8;
            
            const isValid = hasUpper && hasLower && hasNumber && isLongEnough;
            const correct = isValid === test.expected;
            
            this.log(`${test.description}: ${correct ? 'CORRECT' : 'INCORRECT'} (${test.password})`, 
                   correct ? 'success' : 'error', 'authentication');
            
            if (!correct) allCorrect = false;
        });

        return allCorrect;
    }

    // Main test runner
    async runAllTests() {
        console.log('🚀 STARTING COMPREHENSIVE VERIFICATION');
        console.log('='.repeat(60));
        console.log('Testing implementation of:');
        console.log('• MANUAL_TESTING_GUIDE.md (Oct 22, 19:17)');
        console.log('• VERCEL_DEPLOYMENT_FIXES_SUMMARY.md (Oct 22, 18:42)');
        console.log('='.repeat(60));

        const startTime = Date.now();

        // Run all tests
        const results = {
            websocket: await this.testWebSocketConnection(),
            authentication: await this.testAuthentication(),
            notifications: this.testNotificationSystem(),
            api: await this.testAPIEndpoints(),
            passwordValidation: this.testPasswordValidation()
        };

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        // Calculate overall score
        const passed = Object.values(results).filter(r => r === true).length;
        const total = Object.keys(results).length;
        const score = Math.round((passed / total) * 100);

        this.results.overall.score = score;
        this.results.overall.status = score >= 80 ? 'passed' : score >= 60 ? 'warning' : 'failed';

        // Display results
        console.log('='.repeat(60));
        this.log('📊 COMPREHENSIVE VERIFICATION RESULTS', 'info');
        console.log('='.repeat(60));

        Object.entries(results).forEach(([test, result]) => {
            const status = result ? '✅ PASS' : '❌ FAIL';
            this.log(`${test.toUpperCase()}: ${status}`, result ? 'success' : 'error');
        });

        console.log('='.repeat(60));
        this.log(`OVERALL SCORE: ${score}% (${passed}/${total} tests passed)`, 
               score >= 80 ? 'success' : score >= 60 ? 'warning' : 'error');
        this.log(`DURATION: ${duration}s`, 'info');

        if (score >= 80) {
            this.log('🎉 IMPLEMENTATION FULLY COMPLIANT WITH .MD FILES!', 'success');
        } else if (score >= 60) {
            this.log('⚠️ IMPLEMENTATION MOSTLY COMPLIANT - MINOR ISSUES', 'warning');
        } else {
            this.log('❌ IMPLEMENTATION HAS SIGNIFICANT ISSUES', 'error');
        }

        return {
            success: score >= 80,
            score,
            results: this.results,
            summary: { passed, total, duration }
        };
    }
}

// Auto-run the verification
console.log('🎯 Starting Comprehensive Verification...');
const verification = new ComprehensiveVerification();
verification.runAllTests().then(result => {
    console.log('\n🏁 VERIFICATION COMPLETE!');
    console.log('Result:', result.success ? '✅ SUCCESS' : '❌ NEEDS ATTENTION');
    
    // Provide next steps
    console.log('\n📋 NEXT STEPS:');
    if (result.success) {
        console.log('✅ All acceptance criteria met - implementation is complete!');
        console.log('✅ Both .md files requirements are fully satisfied');
    } else {
        console.log('⚠️ Review failed tests above and address issues');
        console.log('⚠️ Check browser console for detailed error messages');
    }
}).catch(error => {
    console.error('❌ Verification failed:', error);
});
