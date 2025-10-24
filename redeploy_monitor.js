#!/usr/bin/env node

/**
 * REDEPLOYMENT MONITORING SCRIPT
 * 
 * Monitors the fresh deployment of both Railway and Vercel after the redeploy trigger
 */

const https = require('https');

class RedeployMonitor {
    constructor() {
        this.frontendUrl = 'https://frontend-psi-seven-85.vercel.app';
        this.backendUrl = 'https://r-dagent-production.up.railway.app';
        this.testUserId = 'fredericle77@gmail.com';
        this.projectId = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
        this.startTime = Date.now();
        this.checkInterval = 30000; // Check every 30 seconds
        this.maxWaitTime = 900000; // Wait up to 15 minutes
    }

    log(message, type = 'info', data = null) {
        const timestamp = new Date().toISOString();
        const elapsed = Date.now() - this.startTime;
        const emoji = {
            'info': 'ℹ️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌',
            'deploy': '🚢',
            'test': '🧪',
            'monitor': '👁️'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} [${timestamp}] [+${Math.round(elapsed/1000)}s] ${message}`);
        if (data) {
            console.log('   Data:', JSON.stringify(data, null, 2));
        }
    }

    async makeRequest(url, options = {}) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            
            const req = https.request(url, {
                method: options.method || 'GET',
                headers: options.headers || {},
                timeout: options.timeout || 30000
            }, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    const responseTime = Date.now() - startTime;
                    resolve({
                        status: res.statusCode,
                        data: data,
                        responseTime,
                        headers: res.headers
                    });
                });
            });

            req.on('error', (error) => {
                const responseTime = Date.now() - startTime;
                resolve({
                    status: 0,
                    error: error.message,
                    responseTime
                });
            });

            req.on('timeout', () => {
                req.destroy();
                const responseTime = Date.now() - startTime;
                resolve({
                    status: 0,
                    error: 'Request timeout',
                    responseTime
                });
            });

            if (options.body) {
                req.write(options.body);
            }
            req.end();
        });
    }

    async checkBackendStatus() {
        const response = await this.makeRequest(`${this.backendUrl}/health`);
        
        if (response.status === 200) {
            try {
                const healthData = JSON.parse(response.data);
                return {
                    status: 'healthy',
                    responseTime: response.responseTime,
                    version: healthData.version,
                    features: healthData.features
                };
            } catch (e) {
                return {
                    status: 'responding',
                    responseTime: response.responseTime,
                    note: 'Non-JSON response'
                };
            }
        } else {
            return {
                status: 'unhealthy',
                error: response.error || `HTTP ${response.status}`,
                responseTime: response.responseTime
            };
        }
    }

    async checkFrontendStatus() {
        const response = await this.makeRequest(this.frontendUrl);
        
        if (response.status === 200) {
            const hasTitle = response.data.includes('R&D Agent');
            return {
                status: hasTitle ? 'healthy' : 'responding',
                responseTime: response.responseTime,
                hasCorrectContent: hasTitle
            };
        } else {
            return {
                status: 'unhealthy',
                error: response.error || `HTTP ${response.status}`,
                responseTime: response.responseTime
            };
        }
    }

    async testGPT5Endpoint() {
        this.log('🤖 Testing GPT-5/O3 enhanced endpoint...', 'test');
        
        const response = await this.makeRequest(`${this.backendUrl}/generate-review`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-ID': this.testUserId
            },
            body: JSON.stringify({
                molecule: 'GPT-5 deployment test',
                objective: 'Verify enhanced AI research capabilities',
                max_results: 3
            }),
            timeout: 90000  // 90 seconds for GPT-5 processing
        });
        
        if (response.status === 200) {
            try {
                const data = JSON.parse(response.data);
                const hasResults = data.results && data.results.length > 0;
                const hasQualityIndicators = JSON.stringify(data).toLowerCase().includes('quality') || 
                                           JSON.stringify(data).toLowerCase().includes('phd') ||
                                           JSON.stringify(data).length > 2000;
                
                return {
                    status: 'working',
                    responseTime: response.responseTime,
                    hasResults,
                    hasQualityIndicators,
                    dataSize: JSON.stringify(data).length
                };
            } catch (e) {
                return {
                    status: 'responding',
                    responseTime: response.responseTime,
                    error: 'Invalid JSON'
                };
            }
        } else {
            return {
                status: 'failed',
                error: response.error || `HTTP ${response.status}`,
                responseTime: response.responseTime
            };
        }
    }

    async monitorDeployments() {
        this.log('🚢 STARTING REDEPLOYMENT MONITORING', 'deploy');
        this.log('Monitoring fresh deployment of GPT-5/O3 enhanced system', 'info');
        
        let attempts = 0;
        const maxAttempts = Math.floor(this.maxWaitTime / this.checkInterval);
        
        while (attempts < maxAttempts) {
            attempts++;
            const elapsed = Date.now() - this.startTime;
            
            this.log(`👁️ Deployment check ${attempts}/${maxAttempts} (${Math.round(elapsed/1000)}s elapsed)`, 'monitor');
            
            // Check backend status
            const backendStatus = await this.checkBackendStatus();
            this.log(`Railway Backend: ${backendStatus.status.toUpperCase()}`, 
                    backendStatus.status === 'healthy' ? 'success' : 
                    backendStatus.status === 'responding' ? 'warning' : 'error', 
                    backendStatus);
            
            // Check frontend status
            const frontendStatus = await this.checkFrontendStatus();
            this.log(`Vercel Frontend: ${frontendStatus.status.toUpperCase()}`, 
                    frontendStatus.status === 'healthy' ? 'success' : 
                    frontendStatus.status === 'responding' ? 'warning' : 'error', 
                    frontendStatus);
            
            // If both are healthy, test GPT-5 functionality
            if (backendStatus.status === 'healthy' && frontendStatus.status === 'healthy') {
                this.log('🎉 Both services are healthy! Testing GPT-5/O3 functionality...', 'success');
                
                const gpt5Status = await this.testGPT5Endpoint();
                this.log(`GPT-5/O3 Test: ${gpt5Status.status.toUpperCase()}`, 
                        gpt5Status.status === 'working' ? 'success' : 
                        gpt5Status.status === 'responding' ? 'warning' : 'error', 
                        gpt5Status);
                
                if (gpt5Status.status === 'working') {
                    this.log('🎉 DEPLOYMENT SUCCESSFUL!', 'success');
                    this.log('GPT-5/O3 enhanced system is fully operational', 'success');
                    
                    console.log('\n🚀 DEPLOYMENT COMPLETE:');
                    console.log('   ✅ Railway Backend: HEALTHY');
                    console.log('   ✅ Vercel Frontend: HEALTHY');
                    console.log('   ✅ GPT-5/O3 System: WORKING');
                    console.log(`   ⏱️ Total Deployment Time: ${Math.round(elapsed/1000)}s`);
                    console.log('\n🎯 READY FOR PRODUCTION USE!');
                    
                    return true;
                }
            }
            
            // Wait before next check
            if (attempts < maxAttempts) {
                this.log(`⏳ Waiting ${this.checkInterval/1000}s before next check...`, 'info');
                await new Promise(resolve => setTimeout(resolve, this.checkInterval));
            }
        }
        
        // Timeout reached
        this.log('⏰ Maximum wait time reached', 'warning');
        this.log('Deployment may still be in progress - check dashboards manually', 'warning');
        
        return false;
    }
}

// Run the redeployment monitoring
const monitor = new RedeployMonitor();
monitor.monitorDeployments().catch(console.error);
