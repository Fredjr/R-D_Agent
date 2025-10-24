#!/usr/bin/env node

/**
 * DEPLOYMENT MONITORING SCRIPT
 * 
 * Monitors the deployment status of both Vercel frontend and Railway backend
 * after the GPT-5/O3 enhanced system deployment
 */

const http = require('http');
const https = require('https');

class DeploymentMonitor {
    constructor() {
        this.frontendUrl = 'https://frontend-psi-seven-85.vercel.app';
        this.backendUrl = 'https://r-dagent-production.up.railway.app';
        this.testUserId = 'fredericle77@gmail.com';
        this.results = [];
        this.startTime = Date.now();
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
            'test': '🧪'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} [${timestamp}] [+${elapsed}ms] ${message}`);
        if (data) {
            console.log('   Data:', JSON.stringify(data, null, 2));
        }
        this.results.push({ timestamp, type, message, data, elapsed });
    }

    async makeRequest(url, options = {}) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const protocol = url.startsWith('https:') ? https : http;
            
            const req = protocol.request(url, {
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

    async checkBackendHealth() {
        this.log('🏥 Checking Railway backend health...', 'test');
        
        const response = await this.makeRequest(`${this.backendUrl}/health`);
        
        if (response.status === 200) {
            try {
                const healthData = JSON.parse(response.data);
                this.log('✅ Railway backend is healthy', 'success', {
                    status: response.status,
                    responseTime: `${response.responseTime}ms`,
                    version: healthData.version,
                    features: healthData.features
                });
                return true;
            } catch (e) {
                this.log('⚠️ Railway backend responded but data is not JSON', 'warning', {
                    status: response.status,
                    responseTime: `${response.responseTime}ms`
                });
                return false;
            }
        } else {
            this.log('❌ Railway backend health check failed', 'error', {
                status: response.status,
                error: response.error,
                responseTime: `${response.responseTime}ms`
            });
            return false;
        }
    }

    async checkFrontendHealth() {
        this.log('🌐 Checking Vercel frontend health...', 'test');
        
        const response = await this.makeRequest(this.frontendUrl);
        
        if (response.status === 200) {
            const hasTitle = response.data.includes('R&D Agent');
            if (hasTitle) {
                this.log('✅ Vercel frontend is healthy', 'success', {
                    status: response.status,
                    responseTime: `${response.responseTime}ms`,
                    hasTitle: true
                });
                return true;
            } else {
                this.log('⚠️ Vercel frontend responded but content seems wrong', 'warning', {
                    status: response.status,
                    responseTime: `${response.responseTime}ms`,
                    hasTitle: false
                });
                return false;
            }
        } else {
            this.log('❌ Vercel frontend health check failed', 'error', {
                status: response.status,
                error: response.error,
                responseTime: `${response.responseTime}ms`
            });
            return false;
        }
    }

    async checkBackendEndpoints() {
        this.log('🔗 Checking backend endpoints availability...', 'test');
        
        const response = await this.makeRequest(`${this.backendUrl}/openapi.json`);
        
        if (response.status === 200) {
            try {
                const openapi = JSON.parse(response.data);
                const paths = Object.keys(openapi.paths || {});
                
                const coreEndpoints = [
                    '/generate-summary',
                    '/generate-review',
                    '/deep-dive',
                    '/thesis-chapter-generator',
                    '/literature-gap-analysis',
                    '/methodology-synthesis'
                ];
                
                const availableEndpoints = coreEndpoints.filter(endpoint => 
                    paths.includes(endpoint)
                );
                
                this.log(`✅ Backend endpoints checked`, 'success', {
                    totalPaths: paths.length,
                    coreEndpoints: `${availableEndpoints.length}/${coreEndpoints.length}`,
                    availableEndpoints
                });
                
                return availableEndpoints.length;
            } catch (e) {
                this.log('❌ Failed to parse OpenAPI spec', 'error', {
                    error: e.message
                });
                return 0;
            }
        } else {
            this.log('❌ Failed to get OpenAPI spec', 'error', {
                status: response.status,
                error: response.error
            });
            return 0;
        }
    }

    async testSimpleEndpoint() {
        this.log('🧪 Testing simple endpoint functionality...', 'test');
        
        const testPayload = {
            molecule: 'test',
            objective: 'Simple deployment test',
            max_results: 1
        };
        
        const response = await this.makeRequest(`${this.backendUrl}/generate-review`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-ID': this.testUserId
            },
            body: JSON.stringify(testPayload),
            timeout: 60000  // 60 second timeout
        });
        
        if (response.status === 200) {
            try {
                const data = JSON.parse(response.data);
                this.log('✅ Simple endpoint test successful', 'success', {
                    status: response.status,
                    responseTime: `${response.responseTime}ms`,
                    hasResults: !!data.results,
                    resultsCount: data.results?.length || 0
                });
                return true;
            } catch (e) {
                this.log('⚠️ Endpoint responded but data is not JSON', 'warning', {
                    status: response.status,
                    responseTime: `${response.responseTime}ms`
                });
                return false;
            }
        } else {
            this.log('❌ Simple endpoint test failed', 'error', {
                status: response.status,
                error: response.error,
                responseTime: `${response.responseTime}ms`
            });
            return false;
        }
    }

    async runDeploymentMonitoring() {
        this.log('🚢 STARTING DEPLOYMENT MONITORING', 'deploy');
        this.log('Checking GPT-5/O3 enhanced system deployment status', 'info');
        
        // Step 1: Check backend health
        const backendHealthy = await this.checkBackendHealth();
        
        // Step 2: Check frontend health
        const frontendHealthy = await this.checkFrontendHealth();
        
        // Step 3: Check endpoint availability
        const availableEndpoints = await this.checkBackendEndpoints();
        
        // Step 4: Test simple functionality (only if backend is healthy)
        let functionalityWorking = false;
        if (backendHealthy) {
            functionalityWorking = await this.testSimpleEndpoint();
        }
        
        // Generate deployment report
        this.generateDeploymentReport(backendHealthy, frontendHealthy, availableEndpoints, functionalityWorking);
        
        return {
            backendHealthy,
            frontendHealthy,
            availableEndpoints,
            functionalityWorking
        };
    }

    generateDeploymentReport(backendHealthy, frontendHealthy, availableEndpoints, functionalityWorking) {
        this.log('📋 DEPLOYMENT MONITORING REPORT', 'deploy');
        
        console.log('\n🚢 DEPLOYMENT STATUS:');
        console.log(`   Railway Backend: ${backendHealthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
        console.log(`   Vercel Frontend: ${frontendHealthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
        console.log(`   Available Endpoints: ${availableEndpoints}/6`);
        console.log(`   Basic Functionality: ${functionalityWorking ? '✅ WORKING' : '❌ NOT WORKING'}`);
        
        console.log('\n📊 OVERALL ASSESSMENT:');
        const totalScore = (backendHealthy ? 25 : 0) + (frontendHealthy ? 25 : 0) + 
                          (availableEndpoints * 4) + (functionalityWorking ? 26 : 0);
        
        console.log(`   Deployment Score: ${totalScore}/100`);
        
        if (totalScore >= 90) {
            console.log('   Status: 🎉 DEPLOYMENT SUCCESSFUL');
            console.log('   Recommendation: ✅ System is ready for production use');
        } else if (totalScore >= 70) {
            console.log('   Status: ⚠️ DEPLOYMENT PARTIALLY SUCCESSFUL');
            console.log('   Recommendation: ⚠️ Some issues need attention');
        } else {
            console.log('   Status: ❌ DEPLOYMENT FAILED');
            console.log('   Recommendation: ❌ Critical issues need immediate attention');
        }
        
        console.log('\n🔍 NEXT STEPS:');
        if (!backendHealthy) {
            console.log('   - Check Railway deployment logs');
            console.log('   - Verify environment variables are set');
            console.log('   - Check for build/startup errors');
        }
        if (!frontendHealthy) {
            console.log('   - Check Vercel deployment logs');
            console.log('   - Verify build completed successfully');
        }
        if (availableEndpoints < 6) {
            console.log('   - Some endpoints may not be deployed yet');
            console.log('   - Check if deployment is still in progress');
        }
        if (!functionalityWorking && backendHealthy) {
            console.log('   - Check API functionality and database connections');
            console.log('   - Verify OpenAI API key is configured');
        }
        
        this.log('🎉 DEPLOYMENT MONITORING COMPLETED', 'deploy');
    }
}

// Run the deployment monitoring
const monitor = new DeploymentMonitor();
monitor.runDeploymentMonitoring().catch(console.error);
