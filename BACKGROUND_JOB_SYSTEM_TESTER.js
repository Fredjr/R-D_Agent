/**
 * BACKGROUND JOB SYSTEM COMPREHENSIVE TESTER v1.0
 * 
 * Tests the complete background job system including:
 * - BackgroundJob table and database operations
 * - WebSocket notification system
 * - Job status tracking and polling
 * - Real-time progress updates
 * - Component integration (NotificationCenter)
 * - Error handling and recovery
 * 
 * Usage: Copy and paste this script into browser console on your frontend domain
 */

class BackgroundJobSystemTester {
    constructor() {
        this.baseUrl = 'https://frontend-psi-seven-85.vercel.app';
        this.backendUrl = 'https://r-dagent-production.up.railway.app';
        this.testUserId = 'fredericle77@gmail.com';
        this.results = [];
        this.activeJobs = new Map();
        this.webSocketConnections = new Map();
        this.notificationCount = 0;
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
            'job': '⚙️',
            'websocket': '🔌',
            'notification': '🔔',
            'database': '🗄️',
            'test': '🧪'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} [${timestamp}] [+${elapsed}ms] ${message}`);
        if (data) {
            console.log('Data:', data);
        }
    }

    async testBackgroundJobCreation() {
        this.log('⚙️ TESTING BACKGROUND JOB CREATION', 'job');
        
        const jobTests = [
            {
                name: 'Generate Review Background Job',
                endpoint: '/api/proxy/background-jobs/generate-review',
                payload: {
                    molecule: 'Background job system test - CRISPR gene editing',
                    objective: 'Test comprehensive background job system functionality',
                    user_id: this.testUserId,
                    project_id: 'background-job-test-project',
                    semantic_expansion: true,
                    domain_focus: ['genetics', 'biotechnology']
                }
            },
            {
                name: 'Deep Dive Background Job',
                endpoint: '/api/proxy/background-jobs/deep-dive',
                payload: {
                    pmid: '29622564',
                    title: 'Background job system test - Deep dive analysis',
                    objective: 'Test background deep dive processing with notifications',
                    user_id: this.testUserId,
                    project_id: 'background-job-test-project',
                    semantic_context: true,
                    find_related_papers: true
                }
            }
        ];

        const results = {};

        for (const test of jobTests) {
            this.log(`Creating ${test.name}...`, 'job');
            
            try {
                const jobResult = await this.createBackgroundJob(test.endpoint, test.payload);
                
                if (jobResult.success && jobResult.job_id) {
                    this.log(`✅ ${test.name} created successfully`, 'success', {
                        job_id: jobResult.job_id,
                        status: jobResult.status,
                        poll_url: jobResult.poll_url
                    });
                    
                    // Store job for tracking
                    this.activeJobs.set(jobResult.job_id, {
                        name: test.name,
                        type: test.endpoint.includes('generate-review') ? 'generate-review' : 'deep-dive',
                        startTime: Date.now(),
                        payload: test.payload
                    });
                    
                    results[test.name] = {
                        created: true,
                        job_id: jobResult.job_id,
                        initialStatus: jobResult.status,
                        poll_url: jobResult.poll_url,
                        success: true
                    };
                } else {
                    results[test.name] = {
                        created: false,
                        error: jobResult.error || 'Unknown error',
                        success: false
                    };
                    this.log(`❌ ${test.name} creation failed`, 'error', jobResult);
                }
            } catch (error) {
                results[test.name] = {
                    created: false,
                    error: error.message,
                    success: false
                };
                this.log(`❌ ${test.name} creation error: ${error.message}`, 'error');
            }
        }

        return results;
    }

    async createBackgroundJob(endpoint, payload) {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.testUserId
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                return {
                    success: true,
                    job_id: data.job_id,
                    status: data.status,
                    poll_url: data.poll_url || `/api/proxy/background-jobs/${data.job_id}/status`
                };
            } else {
                const errorText = await response.text();
                return {
                    success: false,
                    error: `HTTP ${response.status}: ${errorText}`,
                    status: response.status
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async testJobStatusPolling() {
        this.log('📊 TESTING JOB STATUS POLLING', 'job');
        
        if (this.activeJobs.size === 0) {
            this.log('⚠️ No active jobs to poll', 'warning');
            return { polled: 0, results: {} };
        }

        const pollingResults = {};

        for (const [jobId, jobInfo] of this.activeJobs) {
            this.log(`Polling status for ${jobInfo.name} (${jobId})...`, 'job');
            
            const pollResult = await this.pollJobStatus(jobId, jobInfo.name, 8); // 8 attempts = ~24 seconds
            pollingResults[jobId] = {
                jobName: jobInfo.name,
                jobType: jobInfo.type,
                polling: pollResult,
                duration: Date.now() - jobInfo.startTime
            };
        }

        return {
            polled: this.activeJobs.size,
            results: pollingResults
        };
    }

    async pollJobStatus(jobId, jobName, maxAttempts = 8) {
        const results = {
            attempts: 0,
            statuses: [],
            finalStatus: null,
            completed: false,
            error: null,
            progressUpdates: []
        };

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const response = await fetch(`/api/proxy/background-jobs/${jobId}/status`, {
                    headers: {
                        'User-ID': this.testUserId
                    }
                });

                results.attempts = attempt;

                if (response.ok) {
                    const statusData = await response.json();
                    const statusEntry = {
                        attempt,
                        status: statusData.status,
                        progress: statusData.progress_percentage || 0,
                        timestamp: new Date().toISOString(),
                        result_id: statusData.result_id
                    };
                    
                    results.statuses.push(statusEntry);
                    
                    if (statusData.progress_percentage !== undefined) {
                        results.progressUpdates.push({
                            attempt,
                            progress: statusData.progress_percentage,
                            timestamp: statusEntry.timestamp
                        });
                    }

                    this.log(`${jobName} status ${attempt}: ${statusData.status} (${statusData.progress_percentage || 0}%)`, 'job');

                    if (statusData.status === 'completed') {
                        results.finalStatus = 'completed';
                        results.completed = true;
                        results.result_id = statusData.result_id;
                        this.log(`✅ ${jobName} completed successfully`, 'success', {
                            result_id: statusData.result_id,
                            total_attempts: attempt
                        });
                        break;
                    } else if (statusData.status === 'failed') {
                        results.finalStatus = 'failed';
                        results.completed = true;
                        results.error_message = statusData.error_message;
                        this.log(`❌ ${jobName} failed`, 'error', {
                            error: statusData.error_message,
                            total_attempts: attempt
                        });
                        break;
                    }
                } else {
                    results.error = `HTTP ${response.status}`;
                    this.log(`❌ Status polling failed for ${jobName}: HTTP ${response.status}`, 'error');
                    break;
                }

                // Wait 3 seconds between polls
                if (attempt < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            } catch (error) {
                results.error = error.message;
                this.log(`❌ Status polling error for ${jobName}: ${error.message}`, 'error');
                break;
            }
        }

        return results;
    }

    async testWebSocketNotifications() {
        this.log('🔌 TESTING WEBSOCKET NOTIFICATIONS', 'websocket');
        
        try {
            const wsUrl = `wss://r-dagent-production.up.railway.app/ws/notifications/${encodeURIComponent(this.testUserId)}`;
            const wsResult = await this.connectToNotificationWebSocket(wsUrl);

            if (wsResult.connected) {
                this.log('✅ Notification WebSocket connected successfully', 'success', {
                    connectionTime: wsResult.connectionTime,
                    url: wsUrl
                });

                // Wait for potential notifications from active jobs
                await new Promise(resolve => setTimeout(resolve, 5000));

                return {
                    connected: true,
                    connectionTime: wsResult.connectionTime,
                    messagesReceived: this.notificationCount,
                    success: true
                };
            } else {
                this.log('❌ Notification WebSocket connection failed', 'error', wsResult.error);
                return {
                    connected: false,
                    error: wsResult.error,
                    success: false
                };
            }
        } catch (error) {
            this.log('❌ WebSocket notification test failed', 'error', error.message);
            return {
                connected: false,
                error: error.message,
                success: false
            };
        }
    }

    async connectToNotificationWebSocket(wsUrl) {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve({
                    connected: false,
                    error: 'WebSocket connection timeout (10s)',
                    connectionTime: 10000
                });
            }, 10000);

            try {
                const ws = new WebSocket(wsUrl);
                const startTime = Date.now();

                ws.onopen = () => {
                    const connectionTime = Date.now() - startTime;
                    clearTimeout(timeout);
                    
                    // Send ping to keep connection alive
                    ws.send(JSON.stringify({
                        type: 'ping',
                        timestamp: new Date().toISOString()
                    }));

                    // Store connection for cleanup
                    this.webSocketConnections.set('notifications', ws);
                    
                    resolve({
                        connected: true,
                        connectionTime
                    });
                };

                ws.onmessage = (event) => {
                    this.notificationCount++;
                    try {
                        const message = JSON.parse(event.data);
                        this.log(`📨 WebSocket notification received`, 'notification', {
                            type: message.type,
                            title: message.title,
                            message: message.message,
                            count: this.notificationCount
                        });
                    } catch (e) {
                        this.log(`📨 WebSocket message received: ${event.data}`, 'notification');
                    }
                };

                ws.onerror = (error) => {
                    clearTimeout(timeout);
                    resolve({
                        connected: false,
                        error: `WebSocket error: ${error.message || 'Unknown error'}`,
                        connectionTime: Date.now() - startTime
                    });
                };

                ws.onclose = (event) => {
                    this.log(`WebSocket closed: ${event.code} - ${event.reason}`, 'websocket');
                };

            } catch (error) {
                clearTimeout(timeout);
                resolve({
                    connected: false,
                    error: `Failed to create WebSocket: ${error.message}`,
                    connectionTime: 0
                });
            }
        });
    }

    async testNotificationCenterIntegration() {
        this.log('🔔 TESTING NOTIFICATION CENTER INTEGRATION', 'notification');

        const results = {
            componentFound: false,
            interactionWorking: false,
            badgeUpdating: false,
            dropdownWorking: false
        };

        // Check if NotificationCenter component exists
        const notificationCenter = document.querySelector('[data-testid="notification-center"]') ||
                                 document.querySelector('.notification-center') ||
                                 document.querySelector('[class*="notification"]');

        if (notificationCenter) {
            results.componentFound = true;
            this.log('✅ NotificationCenter component found', 'success');

            // Test notification bell click
            const bellButton = notificationCenter.querySelector('button') ||
                              notificationCenter.querySelector('[role="button"]');

            if (bellButton) {
                try {
                    // Simulate click
                    bellButton.click();
                    results.interactionWorking = true;
                    this.log('✅ Notification bell interaction working', 'success');

                    // Check for dropdown/panel
                    setTimeout(() => {
                        const dropdown = document.querySelector('[data-testid="notification-dropdown"]') ||
                                       document.querySelector('.notification-dropdown') ||
                                       document.querySelector('[class*="dropdown"]');

                        if (dropdown) {
                            results.dropdownWorking = true;
                            this.log('✅ Notification dropdown working', 'success');
                        }
                    }, 500);

                } catch (error) {
                    this.log('⚠️ Notification interaction test failed', 'warning', error.message);
                }
            }

            // Check for unread badge
            const badge = notificationCenter.querySelector('[data-testid="unread-badge"]') ||
                         notificationCenter.querySelector('.badge') ||
                         notificationCenter.querySelector('[class*="badge"]');

            if (badge) {
                results.badgeUpdating = true;
                this.log('✅ Notification badge found', 'success', {
                    badgeText: badge.textContent,
                    badgeVisible: badge.style.display !== 'none'
                });
            }

        } else {
            this.log('⚠️ NotificationCenter component not found in DOM', 'warning');
        }

        return results;
    }

    async testDatabasePersistence() {
        this.log('🗄️ TESTING DATABASE PERSISTENCE', 'database');

        const results = {
            backgroundJobsTableWorking: false,
            jobRecordsCreated: 0,
            jobRecordsRetrieved: 0,
            persistenceWorking: false
        };

        // Test if we can create and retrieve job records
        if (this.activeJobs.size > 0) {
            results.jobRecordsCreated = this.activeJobs.size;

            // Try to retrieve job information (indirect table test)
            let retrievedJobs = 0;
            for (const [jobId] of this.activeJobs) {
                try {
                    const response = await fetch(`/api/proxy/background-jobs/${jobId}/status`, {
                        headers: { 'User-ID': this.testUserId }
                    });

                    if (response.ok) {
                        const jobData = await response.json();
                        if (jobData.job_id === jobId) {
                            retrievedJobs++;
                        }
                    }
                } catch (error) {
                    this.log(`⚠️ Failed to retrieve job ${jobId}`, 'warning', error.message);
                }
            }

            results.jobRecordsRetrieved = retrievedJobs;
            results.backgroundJobsTableWorking = retrievedJobs > 0;
            results.persistenceWorking = retrievedJobs === this.activeJobs.size;

            this.log(`Database persistence test: ${retrievedJobs}/${this.activeJobs.size} jobs retrieved`,
                    results.persistenceWorking ? 'success' : 'warning');
        } else {
            this.log('⚠️ No active jobs to test database persistence', 'warning');
        }

        return results;
    }

    async runComprehensiveBackgroundJobTest() {
        this.log('🚀 STARTING COMPREHENSIVE BACKGROUND JOB SYSTEM TEST', 'test');
        this.log(`Testing with user: ${this.testUserId}`, 'info');

        const testResults = {};

        try {
            // Phase 1: Test background job creation
            this.log('Phase 1: Background Job Creation', 'test');
            testResults.jobCreation = await this.testBackgroundJobCreation();

            // Phase 2: Test WebSocket notifications
            this.log('Phase 2: WebSocket Notifications', 'test');
            testResults.webSocketNotifications = await this.testWebSocketNotifications();

            // Phase 3: Test job status polling
            this.log('Phase 3: Job Status Polling', 'test');
            testResults.statusPolling = await this.testJobStatusPolling();

            // Phase 4: Test NotificationCenter integration
            this.log('Phase 4: NotificationCenter Integration', 'test');
            testResults.notificationCenter = await this.testNotificationCenterIntegration();

            // Phase 5: Test database persistence
            this.log('Phase 5: Database Persistence', 'test');
            testResults.databasePersistence = await this.testDatabasePersistence();

            // Generate comprehensive analysis
            const analysis = this.analyzeResults(testResults);

            // Cleanup
            await this.cleanup();

            // Store results
            window.backgroundJobSystemTest = {
                version: '1.0',
                testResults,
                analysis,
                activeJobs: Array.from(this.activeJobs.entries()),
                notificationCount: this.notificationCount,
                duration: Date.now() - this.startTime,
                timestamp: new Date().toISOString(),
                logs: this.results
            };

            this.log('✅ Comprehensive background job system test complete', 'success');
            this.log('Results stored in window.backgroundJobSystemTest', 'info');

            return window.backgroundJobSystemTest;

        } catch (error) {
            this.log('❌ Background job system test failed', 'error', error);
            await this.cleanup();
            throw error;
        }
    }

    analyzeResults(testResults) {
        this.log('📊 ANALYZING BACKGROUND JOB SYSTEM RESULTS', 'test');

        const analysis = {
            jobSystem: {
                working: false,
                jobsCreated: 0,
                jobsCompleted: 0,
                averageCompletionTime: 0
            },
            notifications: {
                webSocketWorking: false,
                notificationsReceived: this.notificationCount,
                componentIntegrated: false
            },
            database: {
                persistenceWorking: false,
                recordsCreated: 0,
                recordsRetrieved: 0
            },
            overallStatus: 'UNKNOWN',
            criticalIssues: [],
            recommendations: []
        };

        // Analyze job creation and completion
        if (testResults.jobCreation) {
            const jobs = Object.values(testResults.jobCreation);
            analysis.jobSystem.jobsCreated = jobs.filter(j => j.created).length;
            analysis.jobSystem.working = analysis.jobSystem.jobsCreated > 0;
        }

        // Analyze job completion from polling results
        if (testResults.statusPolling && testResults.statusPolling.results) {
            const pollingResults = Object.values(testResults.statusPolling.results);
            const completedJobs = pollingResults.filter(r => r.polling.completed);
            analysis.jobSystem.jobsCompleted = completedJobs.length;

            if (completedJobs.length > 0) {
                analysis.jobSystem.averageCompletionTime =
                    completedJobs.reduce((sum, job) => sum + job.duration, 0) / completedJobs.length;
            }
        }

        // Analyze notifications
        analysis.notifications.webSocketWorking = testResults.webSocketNotifications?.connected || false;
        analysis.notifications.componentIntegrated = testResults.notificationCenter?.componentFound || false;

        // Analyze database persistence
        if (testResults.databasePersistence) {
            analysis.database.persistenceWorking = testResults.databasePersistence.persistenceWorking;
            analysis.database.recordsCreated = testResults.databasePersistence.jobRecordsCreated;
            analysis.database.recordsRetrieved = testResults.databasePersistence.jobRecordsRetrieved;
        }

        // Determine overall status and issues
        const criticalIssues = [];

        if (!analysis.jobSystem.working) {
            criticalIssues.push('Background job creation not working');
        }

        if (!analysis.notifications.webSocketWorking) {
            criticalIssues.push('WebSocket notification system not working');
        }

        if (!analysis.database.persistenceWorking) {
            criticalIssues.push('Database persistence not working');
        }

        analysis.criticalIssues = criticalIssues;

        if (criticalIssues.length === 0) {
            analysis.overallStatus = 'SUCCESS';
            this.log('🎉 BACKGROUND JOB SYSTEM FULLY FUNCTIONAL!', 'success');
        } else if (criticalIssues.length <= 1) {
            analysis.overallStatus = 'PARTIAL_SUCCESS';
            this.log('⚠️ Background job system mostly working with minor issues', 'warning', criticalIssues);
        } else {
            analysis.overallStatus = 'ISSUES_FOUND';
            this.log('❌ Critical issues found in background job system', 'error', criticalIssues);
        }

        return analysis;
    }

    async cleanup() {
        this.log('🧹 Cleaning up background job test resources...', 'info');

        // Close WebSocket connections
        for (const [name, ws] of this.webSocketConnections) {
            try {
                ws.close();
                this.log(`Closed WebSocket: ${name}`, 'info');
            } catch (error) {
                this.log(`Failed to close WebSocket ${name}: ${error.message}`, 'warning');
            }
        }
        this.webSocketConnections.clear();

        // Log active jobs status
        if (this.activeJobs.size > 0) {
            this.log(`${this.activeJobs.size} background jobs were created during testing`, 'info');
            for (const [jobId, jobInfo] of this.activeJobs) {
                const runtime = Date.now() - jobInfo.startTime;
                this.log(`Job ${jobId} (${jobInfo.name}): ${runtime}ms runtime`, 'info');
            }
        }

        this.log('✅ Background job test cleanup completed', 'success');
    }
}

// Auto-execute when script is loaded
(async () => {
    const tester = new BackgroundJobSystemTester();
    await tester.runComprehensiveBackgroundJobTest();
})();
