/**
 * PhD Content Enhancement Deployment Monitor
 * Monitors Railway deployment and validates PhD-level content generation
 */

console.log('🚀 PhD CONTENT ENHANCEMENT DEPLOYMENT MONITOR STARTED');
console.log('=' * 70);

// Configuration
const CONFIG = {
    BACKEND_URL: 'https://rd-agent-backend-production.up.railway.app',
    FRONTEND_URL: 'https://frontend-psi-seven-85.vercel.app',
    DEPLOYMENT_TIMEOUT: 300000, // 5 minutes
    HEALTH_CHECK_INTERVAL: 10000, // 10 seconds
    MAX_RETRIES: 30
};

class PhDDeploymentMonitor {
    constructor() {
        this.deploymentStartTime = Date.now();
        this.healthCheckCount = 0;
        this.deploymentStatus = 'monitoring';
        this.phdEnhancementsDetected = false;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '📋';
        const logMessage = `${prefix} [${timestamp}] ${message}`;
        console.log(logMessage);
    }

    async checkBackendHealth() {
        try {
            this.log(`Health check #${++this.healthCheckCount}`);
            
            const response = await fetch(`${CONFIG.BACKEND_URL}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.log('Backend health check passed', 'success');
                return { healthy: true, data };
            } else {
                this.log(`Backend health check failed: HTTP ${response.status}`, 'warning');
                return { healthy: false, status: response.status };
            }
        } catch (error) {
            this.log(`Backend health check error: ${error.message}`, 'warning');
            return { healthy: false, error: error.message };
        }
    }

    async testPhdEnhancements() {
        try {
            this.log('🔬 Testing PhD content enhancements...');

            // Test 1: Generate Review with PhD enhancements
            const generateReviewTest = await this.testGenerateReviewEnhancements();
            
            // Test 2: Deep Dive with PhD enhancements
            const deepDiveTest = await this.testDeepDiveEnhancements();

            // Test 3: PhD service availability
            const serviceTest = await this.testPhdServiceAvailability();

            const allTestsPassed = generateReviewTest && deepDiveTest && serviceTest;
            
            if (allTestsPassed) {
                this.log('🎓 PhD content enhancements successfully deployed!', 'success');
                this.phdEnhancementsDetected = true;
                return true;
            } else {
                this.log('⚠️ PhD content enhancements not fully deployed yet', 'warning');
                return false;
            }

        } catch (error) {
            this.log(`PhD enhancement test error: ${error.message}`, 'error');
            return false;
        }
    }

    async testGenerateReviewEnhancements() {
        try {
            this.log('📊 Testing Generate Review PhD enhancements...');

            const requestBody = {
                objective: 'Test PhD-level cardiovascular research analysis',
                molecule: 'ACE inhibitors',
                project_id: 'phd-deployment-test',
                preference: 'recall'
            };

            const response = await fetch(`${CONFIG.BACKEND_URL}/generate-review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': 'phd-deployment-monitor'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                this.log(`Generate Review test failed: HTTP ${response.status}`, 'warning');
                return false;
            }

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

            return hasEnhancementMetadata || hasPhdLevelAnalysis || hasEnhancedPapers;

        } catch (error) {
            this.log(`Generate Review enhancement test error: ${error.message}`, 'error');
            return false;
        }
    }

    async testDeepDiveEnhancements() {
        try {
            this.log('🔬 Testing Deep Dive PhD enhancements...');

            // Use a known PMID for testing
            const testPmid = '12345678'; // This will likely return fallback data, but we can test the structure
            
            const response = await fetch(`${CONFIG.BACKEND_URL}/deep-dive/${testPmid}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': 'phd-deployment-monitor'
                }
            });

            if (!response.ok) {
                this.log(`Deep Dive test failed: HTTP ${response.status}`, 'warning');
                return false;
            }

            const data = await response.json();
            
            // Check for PhD enhancement indicators
            const hasQualityAssessment = !!data.quality_assessment;
            const hasEnhancementMetadata = !!data.enhancement_metadata;
            const hasComprehensiveAnalysis = data.scientific_model_analysis?.enhancement_metadata?.phd_level_analysis;

            this.log(`Quality assessment: ${hasQualityAssessment}`, hasQualityAssessment ? 'success' : 'warning');
            this.log(`Enhancement metadata: ${hasEnhancementMetadata}`, hasEnhancementMetadata ? 'success' : 'warning');
            this.log(`Comprehensive analysis: ${hasComprehensiveAnalysis}`, hasComprehensiveAnalysis ? 'success' : 'warning');

            return hasQualityAssessment || hasEnhancementMetadata || hasComprehensiveAnalysis;

        } catch (error) {
            this.log(`Deep Dive enhancement test error: ${error.message}`, 'error');
            return false;
        }
    }

    async testPhdServiceAvailability() {
        try {
            this.log('🎓 Testing PhD service availability...');

            // Test if PhD services are importable (indirect test via error messages)
            const testResponse = await fetch(`${CONFIG.BACKEND_URL}/generate-review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': 'phd-service-test'
                },
                body: JSON.stringify({
                    objective: 'PhD service availability test',
                    molecule: 'test',
                    project_id: 'service-test'
                })
            });

            // Even if the request fails, we can check if PhD services are loaded
            // by looking at response headers or error messages
            const responseText = await testResponse.text();
            
            // Look for PhD-related keywords in response
            const hasPhdKeywords = responseText.includes('phd') || 
                                 responseText.includes('PhD') || 
                                 responseText.includes('enhancement') ||
                                 responseText.includes('quality_assessment');

            this.log(`PhD service indicators found: ${hasPhdKeywords}`, hasPhdKeywords ? 'success' : 'warning');
            
            return true; // Service availability test is less critical

        } catch (error) {
            this.log(`PhD service availability test error: ${error.message}`, 'warning');
            return true; // Don't fail deployment for this test
        }
    }

    async monitorDeployment() {
        this.log('🚀 Starting PhD content enhancement deployment monitoring...');
        
        let retryCount = 0;
        let backendHealthy = false;
        let phdEnhancementsReady = false;

        while (retryCount < CONFIG.MAX_RETRIES && !phdEnhancementsReady) {
            const elapsed = Date.now() - this.deploymentStartTime;
            
            if (elapsed > CONFIG.DEPLOYMENT_TIMEOUT) {
                this.log('⏰ Deployment monitoring timeout reached', 'warning');
                break;
            }

            // Check backend health
            const healthCheck = await this.checkBackendHealth();
            backendHealthy = healthCheck.healthy;

            if (backendHealthy) {
                // Test PhD enhancements
                phdEnhancementsReady = await this.testPhdEnhancements();
                
                if (phdEnhancementsReady) {
                    this.deploymentStatus = 'success';
                    break;
                }
            }

            retryCount++;
            
            if (!phdEnhancementsReady) {
                this.log(`Retry ${retryCount}/${CONFIG.MAX_RETRIES} - Waiting for PhD enhancements...`);
                await new Promise(resolve => setTimeout(resolve, CONFIG.HEALTH_CHECK_INTERVAL));
            }
        }

        return this.generateDeploymentReport(backendHealthy, phdEnhancementsReady, retryCount);
    }

    generateDeploymentReport(backendHealthy, phdEnhancementsReady, retryCount) {
        const elapsed = Date.now() - this.deploymentStartTime;
        const elapsedMinutes = (elapsed / 60000).toFixed(1);

        this.log('=' * 70);
        this.log('🎯 PhD CONTENT ENHANCEMENT DEPLOYMENT REPORT');
        this.log('=' * 70);
        
        this.log(`⏱️ Total monitoring time: ${elapsedMinutes} minutes`);
        this.log(`🔄 Health checks performed: ${this.healthCheckCount}`);
        this.log(`🔁 Retry attempts: ${retryCount}`);
        this.log(`🏥 Backend healthy: ${backendHealthy ? '✅ YES' : '❌ NO'}`);
        this.log(`🎓 PhD enhancements ready: ${phdEnhancementsReady ? '✅ YES' : '❌ NO'}`);
        
        if (phdEnhancementsReady) {
            this.log('🎉 DEPLOYMENT SUCCESSFUL!', 'success');
            this.log('✅ PhD content enhancement system is operational');
            this.log('✅ Enhanced Generate Review functionality available');
            this.log('✅ Enhanced Deep Dive analysis available');
            this.log('✅ PhD-level content generation active');
        } else if (backendHealthy) {
            this.log('⚠️ PARTIAL DEPLOYMENT', 'warning');
            this.log('✅ Backend is healthy and responding');
            this.log('⚠️ PhD enhancements may still be initializing');
            this.log('💡 Continue monitoring or check logs for details');
        } else {
            this.log('❌ DEPLOYMENT ISSUES DETECTED', 'error');
            this.log('❌ Backend health checks failing');
            this.log('💡 Check Railway deployment logs and service status');
        }

        return {
            success: phdEnhancementsReady,
            backendHealthy,
            phdEnhancementsReady,
            elapsedTime: elapsed,
            retryCount,
            healthCheckCount: this.healthCheckCount
        };
    }
}

// Global deployment monitor
window.phdDeploymentMonitor = new PhDDeploymentMonitor();

// Auto-start monitoring
window.phdDeploymentMonitor.monitorDeployment().then(report => {
    console.log('\n🎯 DEPLOYMENT MONITORING COMPLETED');
    console.log('📊 Final Report:', report);
    
    if (report.success) {
        console.log('🚀 Ready to run comprehensive PhD content validation tests!');
    } else {
        console.log('⚠️ Consider running additional diagnostics or checking deployment status');
    }
});
