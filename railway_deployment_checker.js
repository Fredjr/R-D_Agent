/**
 * Railway Deployment Status Checker
 * Monitors Railway deployment progress and validates PhD enhancements
 */

console.log('🚂 RAILWAY DEPLOYMENT STATUS CHECKER');
console.log('=' * 50);

const RAILWAY_CONFIG = {
    BACKEND_URL: 'https://rd-agent-backend-production.up.railway.app',
    CHECK_INTERVAL: 15000, // 15 seconds
    MAX_DEPLOYMENT_TIME: 600000, // 10 minutes
    ENDPOINTS_TO_TEST: [
        '/',
        '/docs',
        '/generate-review',
        '/deep-dive/12345678'
    ]
};

class RailwayDeploymentChecker {
    constructor() {
        this.deploymentStartTime = Date.now();
        this.checkCount = 0;
        this.deploymentStatus = 'checking';
        this.endpointStatus = {};
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '📋';
        const logMessage = `${prefix} [${timestamp}] ${message}`;
        console.log(logMessage);
    }

    async checkEndpoint(endpoint, method = 'GET', body = null) {
        try {
            const url = `${RAILWAY_CONFIG.BACKEND_URL}${endpoint}`;
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': 'railway-deployment-checker'
                }
            };

            if (body && method !== 'GET') {
                options.body = JSON.stringify(body);
            }

            const response = await fetch(url, options);
            
            return {
                endpoint,
                status: response.status,
                ok: response.ok,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                responseTime: Date.now()
            };

        } catch (error) {
            return {
                endpoint,
                status: 0,
                ok: false,
                error: error.message,
                responseTime: Date.now()
            };
        }
    }

    async checkAllEndpoints() {
        this.log(`🔍 Deployment check #${++this.checkCount}`);
        
        const results = {};
        
        // Check basic endpoints
        for (const endpoint of RAILWAY_CONFIG.ENDPOINTS_TO_TEST) {
            let result;
            
            if (endpoint === '/generate-review') {
                // POST request with test data
                result = await this.checkEndpoint(endpoint, 'POST', {
                    objective: 'Railway deployment test',
                    molecule: 'test compound',
                    project_id: 'railway-test'
                });
            } else if (endpoint.startsWith('/deep-dive/')) {
                // GET request for deep dive
                result = await this.checkEndpoint(endpoint, 'GET');
            } else {
                // Regular GET request
                result = await this.checkEndpoint(endpoint, 'GET');
            }
            
            results[endpoint] = result;
            this.endpointStatus[endpoint] = result;
            
            // Log result
            if (result.ok) {
                this.log(`✅ ${endpoint}: HTTP ${result.status}`, 'success');
            } else if (result.status === 404) {
                this.log(`⚠️ ${endpoint}: HTTP ${result.status} (deployment in progress)`, 'warning');
            } else if (result.status === 0) {
                this.log(`❌ ${endpoint}: Connection failed - ${result.error}`, 'error');
            } else {
                this.log(`⚠️ ${endpoint}: HTTP ${result.status} - ${result.statusText}`, 'warning');
            }
        }

        return results;
    }

    async testPhdEnhancements() {
        this.log('🎓 Testing PhD enhancements...');
        
        try {
            // Test Generate Review with PhD features
            const generateReviewResult = await this.checkEndpoint('/generate-review', 'POST', {
                objective: 'Test PhD-level analysis for cardiovascular research',
                molecule: 'ACE inhibitors',
                project_id: 'phd-railway-test',
                preference: 'recall'
            });

            if (generateReviewResult.ok) {
                // Try to get response body to check for PhD enhancements
                const response = await fetch(`${RAILWAY_CONFIG.BACKEND_URL}/generate-review`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-ID': 'phd-enhancement-test'
                    },
                    body: JSON.stringify({
                        objective: 'Test PhD-level analysis for cardiovascular research',
                        molecule: 'ACE inhibitors',
                        project_id: 'phd-railway-test',
                        preference: 'recall'
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    
                    // Check for PhD enhancement indicators
                    const hasEnhancementMetadata = !!data.enhancement_metadata;
                    const hasPhdLevelAnalysis = data.enhancement_metadata?.phd_level_analysis;
                    const hasEnhancedPapers = data.results?.some(section => 
                        section.articles?.some(article => 
                            article.score_breakdown || article.fact_anchors || article.quality_score
                        )
                    );

                    this.log(`Enhancement metadata: ${hasEnhancementMetadata}`, hasEnhancementMetadata ? 'success' : 'warning');
                    this.log(`PhD-level analysis: ${hasPhdLevelAnalysis}`, hasPhdLevelAnalysis ? 'success' : 'warning');
                    this.log(`Enhanced papers: ${hasEnhancedPapers}`, hasEnhancedPapers ? 'success' : 'warning');

                    return {
                        available: true,
                        hasEnhancementMetadata,
                        hasPhdLevelAnalysis,
                        hasEnhancedPapers,
                        overallEnhanced: hasEnhancementMetadata || hasPhdLevelAnalysis || hasEnhancedPapers
                    };
                }
            }

            return { available: false, reason: `HTTP ${generateReviewResult.status}` };

        } catch (error) {
            this.log(`❌ PhD enhancement test error: ${error.message}`, 'error');
            return { available: false, error: error.message };
        }
    }

    analyzeDeploymentStatus(endpointResults) {
        const totalEndpoints = Object.keys(endpointResults).length;
        const successfulEndpoints = Object.values(endpointResults).filter(r => r.ok).length;
        const notFoundEndpoints = Object.values(endpointResults).filter(r => r.status === 404).length;
        const errorEndpoints = Object.values(endpointResults).filter(r => r.status === 0).length;

        let status = 'unknown';
        let message = '';

        if (successfulEndpoints === totalEndpoints) {
            status = 'deployed';
            message = 'All endpoints responding successfully';
        } else if (successfulEndpoints > 0) {
            status = 'partial';
            message = `${successfulEndpoints}/${totalEndpoints} endpoints responding`;
        } else if (notFoundEndpoints === totalEndpoints) {
            status = 'deploying';
            message = 'All endpoints returning 404 - deployment in progress';
        } else if (errorEndpoints === totalEndpoints) {
            status = 'failed';
            message = 'All endpoints failing - deployment may have failed';
        } else {
            status = 'mixed';
            message = 'Mixed endpoint responses - deployment unstable';
        }

        return { status, message, successfulEndpoints, totalEndpoints };
    }

    async monitorDeployment() {
        this.log('🚂 Starting Railway deployment monitoring...');
        
        let deploymentComplete = false;
        let phdEnhancementsReady = false;
        
        while (!deploymentComplete && (Date.now() - this.deploymentStartTime) < RAILWAY_CONFIG.MAX_DEPLOYMENT_TIME) {
            // Check all endpoints
            const endpointResults = await this.checkAllEndpoints();
            const deploymentAnalysis = this.analyzeDeploymentStatus(endpointResults);
            
            this.log(`📊 Deployment status: ${deploymentAnalysis.status} - ${deploymentAnalysis.message}`);
            
            if (deploymentAnalysis.status === 'deployed') {
                this.log('🎉 Deployment appears complete! Testing PhD enhancements...', 'success');
                
                // Test PhD enhancements
                const phdTest = await this.testPhdEnhancements();
                
                if (phdTest.available && phdTest.overallEnhanced) {
                    this.log('🎓 PhD enhancements are working!', 'success');
                    phdEnhancementsReady = true;
                    deploymentComplete = true;
                } else if (phdTest.available) {
                    this.log('⚠️ Backend deployed but PhD enhancements not fully active', 'warning');
                    // Continue monitoring for a bit more
                } else {
                    this.log('❌ Backend deployed but not responding correctly', 'error');
                }
            } else if (deploymentAnalysis.status === 'failed') {
                this.log('❌ Deployment appears to have failed', 'error');
                break;
            }
            
            if (!deploymentComplete) {
                this.log(`⏳ Waiting ${RAILWAY_CONFIG.CHECK_INTERVAL/1000}s before next check...`);
                await new Promise(resolve => setTimeout(resolve, RAILWAY_CONFIG.CHECK_INTERVAL));
            }
        }
        
        const totalTime = ((Date.now() - this.deploymentStartTime) / 60000).toFixed(1);
        
        this.log('=' * 50);
        this.log('🎯 RAILWAY DEPLOYMENT MONITORING REPORT');
        this.log('=' * 50);
        this.log(`⏱️ Total monitoring time: ${totalTime} minutes`);
        this.log(`🔄 Checks performed: ${this.checkCount}`);
        this.log(`🚂 Deployment complete: ${deploymentComplete ? '✅ YES' : '❌ NO'}`);
        this.log(`🎓 PhD enhancements ready: ${phdEnhancementsReady ? '✅ YES' : '❌ NO'}`);
        
        if (deploymentComplete && phdEnhancementsReady) {
            this.log('🎉 DEPLOYMENT SUCCESSFUL!', 'success');
            this.log('✅ Railway backend is operational');
            this.log('✅ PhD content enhancement system is active');
            this.log('🚀 Ready for comprehensive testing!');
        } else if (deploymentComplete) {
            this.log('⚠️ PARTIAL SUCCESS', 'warning');
            this.log('✅ Railway backend is operational');
            this.log('⚠️ PhD enhancements may need more time to initialize');
        } else {
            this.log('❌ DEPLOYMENT MONITORING TIMEOUT', 'error');
            this.log('⚠️ Deployment may still be in progress');
            this.log('💡 Check Railway dashboard for deployment status');
        }
        
        return {
            success: deploymentComplete && phdEnhancementsReady,
            deploymentComplete,
            phdEnhancementsReady,
            totalTime: totalTime,
            checkCount: this.checkCount,
            endpointStatus: this.endpointStatus
        };
    }
}

// Global deployment checker
window.railwayDeploymentChecker = new RailwayDeploymentChecker();

// Auto-start monitoring
console.log('🚀 Starting Railway deployment monitoring...');
window.railwayDeploymentChecker.monitorDeployment().then(report => {
    console.log('\n🎯 RAILWAY DEPLOYMENT MONITORING COMPLETED');
    console.log('📊 Final Report:', report);
    
    if (report.success) {
        console.log('🚀 Ready to run comprehensive PhD content validation!');
        console.log('💡 You can now run the comprehensive validation tests');
    } else {
        console.log('⚠️ Deployment monitoring completed with issues');
        console.log('💡 Check Railway dashboard or wait for deployment to complete');
    }
});
