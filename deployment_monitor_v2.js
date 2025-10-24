/**
 * DEPLOYMENT MONITOR v2.0
 * 
 * Comprehensive deployment monitoring for:
 * - Vercel Frontend Deployment
 * - Railway Backend Deployment
 * - New API Endpoints Validation
 * - Integration Test Results
 * - Real-time deployment status tracking
 */

class DeploymentMonitorV2 {
    constructor() {
        this.frontendUrl = 'https://frontend-psi-seven-85.vercel.app';
        this.backendUrl = 'https://r-dagent-production.up.railway.app';
        this.projectId = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
        this.testUserId = 'fredericle77@gmail.com';
        this.results = [];
        this.startTime = Date.now();
    }

    log(message, type = 'info', data = null) {
        const timestamp = new Date().toISOString();
        const elapsed = Date.now() - this.startTime;
        const emoji = {
            'info': 'ℹ️', 'success': '✅', 'warning': '⚠️', 'error': '❌',
            'deploy': '🚀', 'test': '🧪', 'monitor': '📊', 'complete': '🎉'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} [${timestamp}] [+${elapsed}ms] ${message}`);
        if (data) console.log('   Data:', data);
        this.results.push({ timestamp, type, message, data, elapsed });
    }

    async checkDeploymentStatus(url, name) {
        try {
            const response = await fetch(url, { 
                method: 'GET',
                signal: AbortSignal.timeout(10000)
            });
            
            return {
                name,
                url,
                status: response.status,
                ok: response.ok,
                statusText: response.statusText
            };
        } catch (error) {
            return {
                name,
                url,
                status: 0,
                ok: false,
                error: error.message
            };
        }
    }

    async checkBackendHealth() {
        try {
            const response = await fetch(`${this.backendUrl}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(10000)
            });
            
            if (response.ok) {
                const data = await response.json();
                return {
                    healthy: true,
                    version: data.version,
                    features: data.features,
                    timestamp: data.timestamp
                };
            } else {
                return {
                    healthy: false,
                    status: response.status,
                    statusText: response.statusText
                };
            }
        } catch (error) {
            return {
                healthy: false,
                error: error.message
            };
        }
    }

    async testNewEndpoints() {
        const endpoints = [
            {
                name: 'Generate Summary',
                path: '/generate-summary',
                payload: {
                    project_id: this.projectId,
                    objective: 'Deployment test summary',
                    summary_type: 'comprehensive',
                    academic_level: 'phd'
                }
            },
            {
                name: 'Thesis Chapter Generator',
                path: '/thesis-chapter-generator',
                payload: {
                    project_id: this.projectId,
                    objective: 'Deployment test thesis',
                    chapter_focus: 'literature_review',
                    academic_level: 'phd'
                }
            },
            {
                name: 'Literature Gap Analysis',
                path: '/literature-gap-analysis',
                payload: {
                    project_id: this.projectId,
                    objective: 'Deployment test gap analysis',
                    gap_types: ['theoretical', 'methodological'],
                    academic_level: 'phd'
                }
            },
            {
                name: 'Methodology Synthesis',
                path: '/methodology-synthesis',
                payload: {
                    project_id: this.projectId,
                    objective: 'Deployment test methodology',
                    methodology_types: ['experimental', 'observational'],
                    academic_level: 'phd'
                }
            }
        ];

        const results = [];
        
        for (const endpoint of endpoints) {
            try {
                const startTime = Date.now();
                
                // Test via frontend proxy
                const frontendResponse = await fetch(`${this.frontendUrl}/api/proxy${endpoint.path}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-ID': this.testUserId
                    },
                    body: JSON.stringify(endpoint.payload),
                    signal: AbortSignal.timeout(15000)
                });
                
                const frontendTime = Date.now() - startTime;
                
                // Test direct backend
                const backendStartTime = Date.now();
                const backendResponse = await fetch(`${this.backendUrl}${endpoint.path}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-ID': this.testUserId
                    },
                    body: JSON.stringify(endpoint.payload),
                    signal: AbortSignal.timeout(15000)
                });
                
                const backendTime = Date.now() - backendStartTime;
                
                results.push({
                    name: endpoint.name,
                    frontend: {
                        status: frontendResponse.status,
                        ok: frontendResponse.ok,
                        responseTime: frontendTime
                    },
                    backend: {
                        status: backendResponse.status,
                        ok: backendResponse.ok,
                        responseTime: backendTime
                    }
                });
                
            } catch (error) {
                results.push({
                    name: endpoint.name,
                    error: error.message,
                    frontend: { ok: false },
                    backend: { ok: false }
                });
            }
        }
        
        return results;
    }

    async runDeploymentMonitor() {
        this.log('🚀 STARTING DEPLOYMENT MONITOR V2.0', 'deploy');
        this.log('Monitoring both Vercel frontend and Railway backend deployments', 'info');
        
        // Phase 1: Check deployment status
        this.log('📊 Phase 1: Checking Deployment Status', 'monitor');
        
        const frontendStatus = await this.checkDeploymentStatus(this.frontendUrl, 'Vercel Frontend');
        const backendStatus = await this.checkDeploymentStatus(this.backendUrl, 'Railway Backend');
        
        this.log(`Frontend Status: ${frontendStatus.ok ? 'ONLINE' : 'OFFLINE'}`, 
                 frontendStatus.ok ? 'success' : 'error', frontendStatus);
        this.log(`Backend Status: ${backendStatus.ok ? 'ONLINE' : 'OFFLINE'}`, 
                 backendStatus.ok ? 'success' : 'error', backendStatus);
        
        // Phase 2: Check backend health
        this.log('🏥 Phase 2: Backend Health Check', 'monitor');
        
        const healthCheck = await this.checkBackendHealth();
        this.log(`Backend Health: ${healthCheck.healthy ? 'HEALTHY' : 'UNHEALTHY'}`, 
                 healthCheck.healthy ? 'success' : 'error', healthCheck);
        
        // Phase 3: Test new endpoints
        this.log('🧪 Phase 3: Testing New API Endpoints', 'test');
        
        const endpointResults = await this.testNewEndpoints();
        
        endpointResults.forEach(result => {
            const frontendOk = result.frontend?.ok || false;
            const backendOk = result.backend?.ok || false;
            const bothOk = frontendOk && backendOk;
            
            this.log(`${result.name}: ${bothOk ? 'SUCCESS' : 'PARTIAL/FAILED'}`, 
                     bothOk ? 'success' : (frontendOk || backendOk ? 'warning' : 'error'), {
                frontend: `${result.frontend?.status || 'ERROR'} (${result.frontend?.responseTime || 0}ms)`,
                backend: `${result.backend?.status || 'ERROR'} (${result.backend?.responseTime || 0}ms)`
            });
        });
        
        // Generate comprehensive report
        this.generateDeploymentReport({
            frontendStatus,
            backendStatus,
            healthCheck,
            endpointResults
        });
    }

    generateDeploymentReport(results) {
        this.log('📋 DEPLOYMENT MONITOR REPORT', 'complete');
        
        console.log('\n🚀 DEPLOYMENT STATUS SUMMARY:');
        console.log(`   Monitor Duration: ${Math.round((Date.now() - this.startTime) / 1000)}s`);
        
        // Deployment Status
        console.log('\n📊 DEPLOYMENT STATUS:');
        console.log(`   Frontend (Vercel): ${results.frontendStatus.ok ? '✅ ONLINE' : '❌ OFFLINE'}`);
        console.log(`     URL: ${results.frontendStatus.url}`);
        console.log(`     Status: ${results.frontendStatus.status} ${results.frontendStatus.statusText || ''}`);
        
        console.log(`   Backend (Railway): ${results.backendStatus.ok ? '✅ ONLINE' : '❌ OFFLINE'}`);
        console.log(`     URL: ${results.backendStatus.url}`);
        console.log(`     Status: ${results.backendStatus.status} ${results.backendStatus.statusText || ''}`);
        
        // Health Check
        console.log('\n🏥 BACKEND HEALTH:');
        if (results.healthCheck.healthy) {
            console.log('   Status: ✅ HEALTHY');
            console.log(`   Version: ${results.healthCheck.version}`);
            console.log(`   Features: ${results.healthCheck.features?.length || 0} active`);
            if (results.healthCheck.features) {
                results.healthCheck.features.forEach(feature => {
                    console.log(`     - ${feature}`);
                });
            }
        } else {
            console.log('   Status: ❌ UNHEALTHY');
            console.log(`   Error: ${results.healthCheck.error || 'Unknown error'}`);
        }
        
        // Endpoint Results
        console.log('\n🧪 NEW ENDPOINTS TEST RESULTS:');
        
        const successfulEndpoints = results.endpointResults.filter(r => 
            r.frontend?.ok && r.backend?.ok
        ).length;
        const totalEndpoints = results.endpointResults.length;
        
        console.log(`   Successful Endpoints: ${successfulEndpoints}/${totalEndpoints} (${(successfulEndpoints/totalEndpoints*100).toFixed(1)}%)`);
        
        results.endpointResults.forEach(result => {
            const frontendStatus = result.frontend?.ok ? '✅' : '❌';
            const backendStatus = result.backend?.ok ? '✅' : '❌';
            
            console.log(`\n   ${result.name}:`);
            console.log(`     Frontend: ${frontendStatus} ${result.frontend?.status || 'ERROR'} (${result.frontend?.responseTime || 0}ms)`);
            console.log(`     Backend:  ${backendStatus} ${result.backend?.status || 'ERROR'} (${result.backend?.responseTime || 0}ms)`);
            
            if (result.error) {
                console.log(`     Error: ${result.error}`);
            }
        });
        
        // Overall Assessment
        console.log('\n🎯 OVERALL DEPLOYMENT ASSESSMENT:');
        
        const frontendOk = results.frontendStatus.ok;
        const backendOk = results.backendStatus.ok && results.healthCheck.healthy;
        const endpointsOk = successfulEndpoints >= totalEndpoints * 0.75;
        
        if (frontendOk && backendOk && endpointsOk) {
            console.log('   Status: 🎉 EXCELLENT - Full deployment successful!');
            console.log('   All systems operational and new endpoints working');
        } else if (frontendOk && backendOk) {
            console.log('   Status: ✅ GOOD - Core systems operational');
            console.log('   Some new endpoints may need additional time to deploy');
        } else if (frontendOk || backendOk) {
            console.log('   Status: ⚠️ PARTIAL - One system operational');
            console.log('   Check deployment logs for the failing system');
        } else {
            console.log('   Status: ❌ FAILED - Deployment issues detected');
            console.log('   Both systems need attention');
        }
        
        this.log('🎉 DEPLOYMENT MONITOR V2.0 COMPLETED', 'complete');
    }
}

// Auto-run when pasted into browser console
if (typeof window !== 'undefined') {
    console.log('🚀 Starting Deployment Monitor V2.0...');
    console.log('📊 Monitoring Vercel frontend and Railway backend deployments');
    console.log('🧪 Testing all newly implemented API endpoints');
    const monitor = new DeploymentMonitorV2();
    monitor.runDeploymentMonitor().catch(console.error);
} else {
    module.exports = DeploymentMonitorV2;
}
