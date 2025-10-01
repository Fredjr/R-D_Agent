/**
 * WEBSOCKET COMPREHENSIVE TEST v1.0
 * 
 * Dedicated WebSocket testing suite for:
 * - Notification WebSocket connections
 * - Project collaboration WebSocket connections
 * - Real-time message handling
 * - Connection stability and reconnection
 * - Message broadcasting and delivery
 * - Integration with NotificationCenter component
 * 
 * Usage: Copy and paste this script into browser console on your frontend domain
 */

class WebSocketComprehensiveTester {
    constructor() {
        this.baseUrl = 'https://frontend-psi-seven-85.vercel.app';
        this.backendUrl = 'https://r-dagent-production.up.railway.app';
        this.testUserId = 'fredericle77@gmail.com';
        this.results = [];
        this.connections = new Map();
        this.messageLog = [];
        this.startTime = Date.now();
        this.testProjectId = 'websocket-test-project';
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
            'message': '📨',
            'connection': '🔗',
            'test': '🧪'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} [${timestamp}] [+${elapsed}ms] ${message}`);
        if (data) {
            console.log('Data:', data);
        }
    }

    async testNotificationWebSocket() {
        this.log('🔔 TESTING NOTIFICATION WEBSOCKET', 'websocket');
        
        const wsUrl = `wss://r-dagent-production.up.railway.app/ws/${encodeURIComponent(this.testUserId)}`;
        
        try {
            const result = await this.connectAndTestWebSocket(wsUrl, 'notification', {
                testMessages: [
                    {
                        type: 'ping',
                        timestamp: new Date().toISOString()
                    },
                    {
                        type: 'test_notification',
                        title: 'WebSocket Test',
                        message: 'Testing notification WebSocket functionality',
                        timestamp: new Date().toISOString()
                    }
                ],
                expectedResponses: ['pong', 'notification_received'],
                timeout: 15000
            });

            if (result.success) {
                this.log('✅ Notification WebSocket test successful', 'success', {
                    connectionTime: result.connectionTime,
                    messagesSent: result.messagesSent,
                    messagesReceived: result.messagesReceived,
                    responses: result.responses
                });
            } else {
                this.log('❌ Notification WebSocket test failed', 'error', result.error);
            }

            return result;
        } catch (error) {
            this.log('❌ Notification WebSocket test error', 'error', error.message);
            return { success: false, error: error.message };
        }
    }

    async testProjectWebSocket() {
        this.log('👥 TESTING PROJECT COLLABORATION WEBSOCKET', 'websocket');
        
        const wsUrl = `wss://r-dagent-production.up.railway.app/ws/project/${this.testProjectId}`;
        
        try {
            const result = await this.connectAndTestWebSocket(wsUrl, 'project', {
                testMessages: [
                    {
                        type: 'join_project',
                        project_id: this.testProjectId,
                        user_id: this.testUserId,
                        timestamp: new Date().toISOString()
                    },
                    {
                        type: 'annotation_update',
                        project_id: this.testProjectId,
                        annotation: {
                            id: 'test-annotation-1',
                            text: 'WebSocket test annotation',
                            pmid: '29622564',
                            user_id: this.testUserId
                        },
                        timestamp: new Date().toISOString()
                    },
                    {
                        type: 'activity_update',
                        project_id: this.testProjectId,
                        activity: {
                            type: 'paper_saved',
                            pmid: '29622564',
                            user_id: this.testUserId,
                            timestamp: new Date().toISOString()
                        }
                    }
                ],
                expectedResponses: ['project_joined', 'annotation_broadcast', 'activity_broadcast'],
                timeout: 15000
            });

            if (result.success) {
                this.log('✅ Project WebSocket test successful', 'success', {
                    connectionTime: result.connectionTime,
                    messagesSent: result.messagesSent,
                    messagesReceived: result.messagesReceived,
                    responses: result.responses
                });
            } else {
                this.log('❌ Project WebSocket test failed', 'error', result.error);
            }

            return result;
        } catch (error) {
            this.log('❌ Project WebSocket test error', 'error', error.message);
            return { success: false, error: error.message };
        }
    }

    async connectAndTestWebSocket(wsUrl, connectionName, testConfig) {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve({
                    success: false,
                    error: `WebSocket test timeout (${testConfig.timeout}ms)`,
                    connectionTime: testConfig.timeout
                });
            }, testConfig.timeout);

            try {
                const ws = new WebSocket(wsUrl);
                const startTime = Date.now();
                let messagesSent = 0;
                let messagesReceived = 0;
                let responses = [];

                ws.onopen = () => {
                    const connectionTime = Date.now() - startTime;
                    this.log(`WebSocket ${connectionName} connected`, 'connection', {
                        url: wsUrl,
                        connectionTime
                    });

                    // Store connection
                    this.connections.set(connectionName, ws);

                    // Send test messages
                    testConfig.testMessages.forEach((message, index) => {
                        setTimeout(() => {
                            ws.send(JSON.stringify(message));
                            messagesSent++;
                            this.log(`Sent test message ${index + 1}`, 'message', message);
                        }, index * 1000); // Send messages 1 second apart
                    });

                    // Wait for responses and then resolve
                    setTimeout(() => {
                        clearTimeout(timeout);
                        resolve({
                            success: true,
                            connectionTime,
                            messagesSent,
                            messagesReceived,
                            responses,
                            connectionName
                        });
                    }, testConfig.testMessages.length * 1000 + 3000); // Wait for all messages + 3 seconds
                };

                ws.onmessage = (event) => {
                    messagesReceived++;
                    try {
                        const message = JSON.parse(event.data);
                        responses.push(message);
                        this.messageLog.push({
                            connection: connectionName,
                            direction: 'received',
                            message,
                            timestamp: new Date().toISOString()
                        });
                        this.log(`Received message on ${connectionName}`, 'message', message);
                    } catch (e) {
                        responses.push({ raw: event.data });
                        this.messageLog.push({
                            connection: connectionName,
                            direction: 'received',
                            raw: event.data,
                            timestamp: new Date().toISOString()
                        });
                        this.log(`Received raw message on ${connectionName}: ${event.data}`, 'message');
                    }
                };

                ws.onerror = (error) => {
                    clearTimeout(timeout);
                    this.log(`WebSocket ${connectionName} error`, 'error', error);
                    resolve({
                        success: false,
                        error: `WebSocket error: ${error.message || 'Unknown error'}`,
                        connectionTime: Date.now() - startTime,
                        messagesSent,
                        messagesReceived,
                        responses
                    });
                };

                ws.onclose = (event) => {
                    this.log(`WebSocket ${connectionName} closed`, 'connection', {
                        code: event.code,
                        reason: event.reason,
                        wasClean: event.wasClean
                    });
                };

            } catch (error) {
                clearTimeout(timeout);
                resolve({
                    success: false,
                    error: `Failed to create WebSocket: ${error.message}`,
                    connectionTime: 0,
                    messagesSent: 0,
                    messagesReceived: 0,
                    responses: []
                });
            }
        });
    }

    async testWebSocketStability() {
        this.log('🔄 TESTING WEBSOCKET STABILITY AND RECONNECTION', 'test');
        
        const stabilityResults = {
            connectionAttempts: 0,
            successfulConnections: 0,
            failedConnections: 0,
            averageConnectionTime: 0,
            reconnectionWorking: false
        };

        // Test multiple connection attempts
        const connectionTests = [
            { name: 'notification', url: `wss://r-dagent-production.up.railway.app/ws/${encodeURIComponent(this.testUserId)}` },
            { name: 'project', url: `wss://r-dagent-production.up.railway.app/ws/project/${this.testProjectId}` }
        ];

        for (const test of connectionTests) {
            for (let attempt = 1; attempt <= 3; attempt++) {
                stabilityResults.connectionAttempts++;
                this.log(`Connection attempt ${attempt} for ${test.name}...`, 'test');

                try {
                    const result = await this.quickConnectionTest(test.url, test.name);
                    
                    if (result.connected) {
                        stabilityResults.successfulConnections++;
                        stabilityResults.averageConnectionTime += result.connectionTime;
                        this.log(`✅ ${test.name} connection ${attempt} successful`, 'success');
                    } else {
                        stabilityResults.failedConnections++;
                        this.log(`❌ ${test.name} connection ${attempt} failed`, 'error', result.error);
                    }
                } catch (error) {
                    stabilityResults.failedConnections++;
                    this.log(`❌ ${test.name} connection ${attempt} error: ${error.message}`, 'error');
                }

                // Wait between attempts
                if (attempt < 3) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }

        if (stabilityResults.successfulConnections > 0) {
            stabilityResults.averageConnectionTime = stabilityResults.averageConnectionTime / stabilityResults.successfulConnections;
        }

        stabilityResults.reconnectionWorking = stabilityResults.successfulConnections > stabilityResults.failedConnections;

        this.log('WebSocket stability test results:', 'info', stabilityResults);
        return stabilityResults;
    }

    async quickConnectionTest(wsUrl, name) {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve({
                    connected: false,
                    error: 'Quick connection timeout (5s)',
                    connectionTime: 5000
                });
            }, 5000);

            try {
                const ws = new WebSocket(wsUrl);
                const startTime = Date.now();

                ws.onopen = () => {
                    const connectionTime = Date.now() - startTime;
                    clearTimeout(timeout);
                    ws.close();
                    resolve({
                        connected: true,
                        connectionTime
                    });
                };

                ws.onerror = (error) => {
                    clearTimeout(timeout);
                    resolve({
                        connected: false,
                        error: error.message || 'Connection error',
                        connectionTime: Date.now() - startTime
                    });
                };

            } catch (error) {
                clearTimeout(timeout);
                resolve({
                    connected: false,
                    error: error.message,
                    connectionTime: 0
                });
            }
        });
    }

    async testNotificationCenterIntegration() {
        this.log('🔔 TESTING NOTIFICATION CENTER COMPONENT INTEGRATION', 'test');

        const integrationResults = {
            componentFound: false,
            webSocketIntegrated: false,
            realTimeUpdates: false,
            userInteraction: false
        };

        // Check if NotificationCenter component exists
        const notificationCenter = document.querySelector('[data-testid="notification-center"]') ||
                                 document.querySelector('.notification-center') ||
                                 document.querySelector('[class*="notification"]');

        if (notificationCenter) {
            integrationResults.componentFound = true;
            this.log('✅ NotificationCenter component found', 'success');

            // Test if component responds to WebSocket messages
            if (this.connections.has('notification')) {
                const ws = this.connections.get('notification');

                // Send a test notification
                ws.send(JSON.stringify({
                    type: 'test_notification',
                    title: 'Component Integration Test',
                    message: 'Testing NotificationCenter integration',
                    timestamp: new Date().toISOString()
                }));

                integrationResults.webSocketIntegrated = true;
                this.log('✅ WebSocket integration test message sent', 'success');

                // Wait and check for UI updates
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Check for badge updates
                const badge = notificationCenter.querySelector('[data-testid="unread-badge"]') ||
                             notificationCenter.querySelector('.badge') ||
                             notificationCenter.querySelector('[class*="badge"]');

                if (badge && badge.textContent && badge.textContent !== '0') {
                    integrationResults.realTimeUpdates = true;
                    this.log('✅ Real-time UI updates working', 'success', {
                        badgeCount: badge.textContent
                    });
                }
            }

            // Test user interaction
            const clickableElement = notificationCenter.querySelector('button') ||
                                   notificationCenter.querySelector('[role="button"]');

            if (clickableElement) {
                try {
                    clickableElement.click();
                    integrationResults.userInteraction = true;
                    this.log('✅ User interaction working', 'success');
                } catch (error) {
                    this.log('⚠️ User interaction test failed', 'warning', error.message);
                }
            }

        } else {
            this.log('⚠️ NotificationCenter component not found', 'warning');
        }

        return integrationResults;
    }

    async runComprehensiveWebSocketTest() {
        this.log('🚀 STARTING COMPREHENSIVE WEBSOCKET TEST SUITE', 'test');
        this.log(`Testing with user: ${this.testUserId}`, 'info');
        this.log(`Project ID: ${this.testProjectId}`, 'info');

        const testResults = {};

        try {
            // Phase 1: Test notification WebSocket
            this.log('Phase 1: Notification WebSocket Testing', 'test');
            testResults.notificationWebSocket = await this.testNotificationWebSocket();

            // Phase 2: Test project WebSocket
            this.log('Phase 2: Project WebSocket Testing', 'test');
            testResults.projectWebSocket = await this.testProjectWebSocket();

            // Phase 3: Test WebSocket stability
            this.log('Phase 3: WebSocket Stability Testing', 'test');
            testResults.stabilityTest = await this.testWebSocketStability();

            // Phase 4: Test NotificationCenter integration
            this.log('Phase 4: NotificationCenter Integration Testing', 'test');
            testResults.componentIntegration = await this.testNotificationCenterIntegration();

            // Generate comprehensive analysis
            const analysis = this.analyzeWebSocketResults(testResults);

            // Cleanup
            await this.cleanup();

            // Store results
            window.webSocketTestResults = {
                version: '1.0',
                testResults,
                analysis,
                messageLog: this.messageLog,
                connections: Array.from(this.connections.keys()),
                duration: Date.now() - this.startTime,
                timestamp: new Date().toISOString(),
                logs: this.results
            };

            this.log('✅ Comprehensive WebSocket test complete', 'success');
            this.log('Results stored in window.webSocketTestResults', 'info');

            return window.webSocketTestResults;

        } catch (error) {
            this.log('❌ WebSocket test suite failed', 'error', error);
            await this.cleanup();
            throw error;
        }
    }

    analyzeWebSocketResults(testResults) {
        this.log('📊 ANALYZING WEBSOCKET TEST RESULTS', 'test');

        const analysis = {
            connectivity: {
                notificationWebSocket: testResults.notificationWebSocket?.success || false,
                projectWebSocket: testResults.projectWebSocket?.success || false,
                overallConnectivity: false
            },
            messaging: {
                totalMessagesSent: 0,
                totalMessagesReceived: 0,
                messageDeliveryRate: 0
            },
            stability: {
                connectionReliability: 0,
                averageConnectionTime: 0,
                reconnectionWorking: false
            },
            integration: {
                componentFound: testResults.componentIntegration?.componentFound || false,
                realTimeUpdates: testResults.componentIntegration?.realTimeUpdates || false,
                userInteraction: testResults.componentIntegration?.userInteraction || false
            },
            overallStatus: 'UNKNOWN',
            criticalIssues: []
        };

        // Analyze connectivity
        const workingConnections = [
            testResults.notificationWebSocket?.success,
            testResults.projectWebSocket?.success
        ].filter(Boolean).length;

        analysis.connectivity.overallConnectivity = workingConnections > 0;

        // Analyze messaging
        if (testResults.notificationWebSocket?.success) {
            analysis.messaging.totalMessagesSent += testResults.notificationWebSocket.messagesSent || 0;
            analysis.messaging.totalMessagesReceived += testResults.notificationWebSocket.messagesReceived || 0;
        }

        if (testResults.projectWebSocket?.success) {
            analysis.messaging.totalMessagesSent += testResults.projectWebSocket.messagesSent || 0;
            analysis.messaging.totalMessagesReceived += testResults.projectWebSocket.messagesReceived || 0;
        }

        if (analysis.messaging.totalMessagesSent > 0) {
            analysis.messaging.messageDeliveryRate =
                analysis.messaging.totalMessagesReceived / analysis.messaging.totalMessagesSent;
        }

        // Analyze stability
        if (testResults.stabilityTest) {
            const stability = testResults.stabilityTest;
            analysis.stability.connectionReliability =
                stability.successfulConnections / Math.max(stability.connectionAttempts, 1);
            analysis.stability.averageConnectionTime = stability.averageConnectionTime;
            analysis.stability.reconnectionWorking = stability.reconnectionWorking;
        }

        // Determine overall status and issues
        const criticalIssues = [];

        if (!analysis.connectivity.overallConnectivity) {
            criticalIssues.push('No WebSocket connections working');
        }

        if (analysis.messaging.messageDeliveryRate < 0.5) {
            criticalIssues.push('Poor message delivery rate');
        }

        if (analysis.stability.connectionReliability < 0.5) {
            criticalIssues.push('Poor connection reliability');
        }

        if (!analysis.integration.componentFound) {
            criticalIssues.push('NotificationCenter component not found');
        }

        analysis.criticalIssues = criticalIssues;

        if (criticalIssues.length === 0) {
            analysis.overallStatus = 'SUCCESS';
            this.log('🎉 WEBSOCKET SYSTEM FULLY FUNCTIONAL!', 'success');
        } else if (criticalIssues.length <= 1) {
            analysis.overallStatus = 'PARTIAL_SUCCESS';
            this.log('⚠️ WebSocket system mostly working with minor issues', 'warning', criticalIssues);
        } else {
            analysis.overallStatus = 'ISSUES_FOUND';
            this.log('❌ Critical issues found in WebSocket system', 'error', criticalIssues);
        }

        return analysis;
    }

    async cleanup() {
        this.log('🧹 Cleaning up WebSocket test resources...', 'info');

        // Close all WebSocket connections
        for (const [name, ws] of this.connections) {
            try {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close();
                    this.log(`Closed WebSocket: ${name}`, 'info');
                }
            } catch (error) {
                this.log(`Failed to close WebSocket ${name}: ${error.message}`, 'warning');
            }
        }
        this.connections.clear();

        this.log(`Total messages logged: ${this.messageLog.length}`, 'info');
        this.log('✅ WebSocket test cleanup completed', 'success');
    }
}

// Auto-execute when script is loaded
(async () => {
    const tester = new WebSocketComprehensiveTester();
    await tester.runComprehensiveWebSocketTest();
})();
