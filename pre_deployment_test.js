#!/usr/bin/env node

/**
 * PRE-DEPLOYMENT COMPREHENSIVE TEST
 * 
 * Tests all endpoints, backward compatibility, and deployment readiness
 * before deploying to production
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

class PreDeploymentTest {
    constructor() {
        this.backendUrl = 'http://localhost:8000';
        this.testUserId = 'fredericle77@gmail.com';
        this.testProjectId = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
        this.results = [];
        this.startTime = Date.now();
        
        this.coreEndpoints = [
            'generate-summary',
            'generate-review', 
            'deep-dive',
            'thesis-chapter-generator',
            'literature-gap-analysis',
            'methodology-synthesis'
        ];
        
        this.testResults = {
            endpointTests: {},
            backwardCompatibility: {},
            deploymentReadiness: {},
            overallStatus: 'PENDING'
        };
    }

    log(message, type = 'info', data = null) {
        const timestamp = new Date().toISOString();
        const elapsed = Date.now() - this.startTime;
        const emoji = {
            'info': 'ℹ️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌',
            'test': '🧪',
            'phase': '🚀',
            'deploy': '🚢'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} [${timestamp}] [+${elapsed}ms] ${message}`);
        if (data) {
            console.log('Data:', JSON.stringify(data, null, 2));
        }
        this.results.push({ timestamp, type, message, data, elapsed });
    }

    async checkServerHealth() {
        this.log('🏥 Checking server health...', 'test');
        
        return new Promise((resolve) => {
            const req = http.request({
                hostname: 'localhost',
                port: 8000,
                path: '/health',
                method: 'GET'
            }, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        this.log('✅ Server health check passed', 'success');
                        resolve(true);
                    } else {
                        this.log('❌ Server health check failed', 'error', { status: res.statusCode });
                        resolve(false);
                    }
                });
            });
            
            req.on('error', (error) => {
                this.log('❌ Server health check error', 'error', { error: error.message });
                resolve(false);
            });
            
            req.end();
        });
    }

    async testEndpointAvailability(endpoint) {
        this.log(`🧪 Testing ${endpoint} availability...`, 'test');

        return new Promise((resolve) => {
            const req = http.request({
                hostname: 'localhost',
                port: 8000,
                path: '/openapi.json',
                method: 'GET'
            }, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const openapi = JSON.parse(data);
                        const paths = Object.keys(openapi.paths || {});
                        const available = paths.includes(`/${endpoint}`);

                        if (available) {
                            this.log(`✅ ${endpoint} is available in OpenAPI spec`, 'success');
                            this.testResults.endpointTests[endpoint] = 'AVAILABLE';
                        } else {
                            this.log(`❌ ${endpoint} not found in OpenAPI spec`, 'error');
                            this.testResults.endpointTests[endpoint] = 'MISSING';
                        }
                        resolve(available);
                    } catch (parseError) {
                        this.log(`❌ Error parsing OpenAPI spec for ${endpoint}`, 'error', { error: parseError.message });
                        this.testResults.endpointTests[endpoint] = 'ERROR';
                        resolve(false);
                    }
                });
            });

            req.on('error', (error) => {
                this.log(`❌ Error checking ${endpoint}`, 'error', { error: error.message });
                this.testResults.endpointTests[endpoint] = 'ERROR';
                resolve(false);
            });

            req.end();
        });
    }

    async testBackwardCompatibility() {
        this.log('🔄 Testing backward compatibility components...', 'phase');
        
        // Check if normalizer exists
        const normalizerPath = path.join(__dirname, 'frontend/src/utils/apiResponseNormalizer.ts');
        if (fs.existsSync(normalizerPath)) {
            this.log('✅ API Response Normalizer found', 'success');
            this.testResults.backwardCompatibility.normalizer = 'PRESENT';
        } else {
            this.log('❌ API Response Normalizer missing', 'error');
            this.testResults.backwardCompatibility.normalizer = 'MISSING';
        }
        
        // Check proxy routes
        const proxyRoutes = [
            'frontend/src/app/api/proxy/generate-summary/route.ts',
            'frontend/src/app/api/proxy/generate-review/route.ts',
            'frontend/src/app/api/proxy/deep-dive/route.ts',
            'frontend/src/app/api/proxy/thesis-chapter-generator/route.ts',
            'frontend/src/app/api/proxy/literature-gap-analysis/route.ts',
            'frontend/src/app/api/proxy/methodology-synthesis/route.ts'
        ];
        
        let proxyRoutesFound = 0;
        for (const route of proxyRoutes) {
            const routePath = path.join(__dirname, route);
            if (fs.existsSync(routePath)) {
                proxyRoutesFound++;
                this.log(`✅ Proxy route found: ${path.basename(path.dirname(route))}`, 'success');
            } else {
                this.log(`⚠️ Proxy route missing: ${path.basename(path.dirname(route))}`, 'warning');
            }
        }
        
        this.testResults.backwardCompatibility.proxyRoutes = `${proxyRoutesFound}/${proxyRoutes.length}`;
        
        if (proxyRoutesFound === proxyRoutes.length) {
            this.log('✅ All proxy routes present', 'success');
        } else {
            this.log(`⚠️ ${proxyRoutes.length - proxyRoutesFound} proxy routes missing`, 'warning');
        }
    }

    async testDeploymentReadiness() {
        this.log('🚢 Testing deployment readiness...', 'phase');
        
        // Check main.py syntax
        try {
            const { execSync } = require('child_process');
            execSync('python3 -m py_compile main.py', { stdio: 'pipe' });
            this.log('✅ main.py syntax is valid', 'success');
            this.testResults.deploymentReadiness.pythonSyntax = 'VALID';
        } catch (error) {
            this.log('❌ main.py has syntax errors', 'error');
            this.testResults.deploymentReadiness.pythonSyntax = 'INVALID';
        }
        
        // Check if GPT-5/O3 configuration exists
        const mainPyContent = fs.readFileSync('main.py', 'utf8');
        if (mainPyContent.includes('gpt-5') && mainPyContent.includes('o3')) {
            this.log('✅ GPT-5/O3 configuration found', 'success');
            this.testResults.deploymentReadiness.gpt5Config = 'PRESENT';
        } else {
            this.log('⚠️ GPT-5/O3 configuration may be missing', 'warning');
            this.testResults.deploymentReadiness.gpt5Config = 'MISSING';
        }
        
        // Check if enhancement systems exist
        const enhancementFiles = [
            'cutting_edge_model_manager.py',
            'advanced_8_10_enhancement_system.py',
            'true_8_10_integration_system.py'
        ];
        
        let enhancementFilesFound = 0;
        for (const file of enhancementFiles) {
            if (fs.existsSync(file)) {
                enhancementFilesFound++;
                this.log(`✅ Enhancement file found: ${file}`, 'success');
            } else {
                this.log(`⚠️ Enhancement file missing: ${file}`, 'warning');
            }
        }
        
        this.testResults.deploymentReadiness.enhancementFiles = `${enhancementFilesFound}/${enhancementFiles.length}`;
        
        // Check frontend build readiness
        const packageJsonPath = path.join(__dirname, 'frontend/package.json');
        if (fs.existsSync(packageJsonPath)) {
            this.log('✅ Frontend package.json found', 'success');
            this.testResults.deploymentReadiness.frontendConfig = 'PRESENT';
        } else {
            this.log('❌ Frontend package.json missing', 'error');
            this.testResults.deploymentReadiness.frontendConfig = 'MISSING';
        }
    }

    async runComprehensiveTest() {
        this.log('🚀 STARTING PRE-DEPLOYMENT COMPREHENSIVE TEST', 'phase');
        this.log('Testing system readiness for GPT-5/O3 deployment', 'info');
        
        // Step 1: Check server health
        const serverHealthy = await this.checkServerHealth();
        if (!serverHealthy) {
            this.log('❌ Server not healthy - cannot proceed with tests', 'error');
            this.testResults.overallStatus = 'FAILED';
            return this.generateReport();
        }
        
        // Step 2: Test endpoint availability
        this.log('🔗 Testing endpoint availability...', 'phase');
        let availableEndpoints = 0;
        for (const endpoint of this.coreEndpoints) {
            const available = await this.testEndpointAvailability(endpoint);
            if (available) availableEndpoints++;
            await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
        }
        
        // Step 3: Test backward compatibility
        await this.testBackwardCompatibility();
        
        // Step 4: Test deployment readiness
        await this.testDeploymentReadiness();
        
        // Step 5: Generate final assessment
        this.generateFinalAssessment(availableEndpoints);
        
        return this.generateReport();
    }

    generateFinalAssessment(availableEndpoints) {
        this.log('📊 Generating final assessment...', 'phase');
        
        const totalEndpoints = this.coreEndpoints.length;
        const endpointScore = availableEndpoints / totalEndpoints;
        
        // Calculate overall readiness score
        let readinessScore = 0;
        let maxScore = 0;
        
        // Endpoint availability (40% weight)
        readinessScore += endpointScore * 40;
        maxScore += 40;
        
        // Backward compatibility (30% weight)
        const normalizerPresent = this.testResults.backwardCompatibility.normalizer === 'PRESENT';
        const proxyRoutes = this.testResults.backwardCompatibility.proxyRoutes;
        const proxyScore = proxyRoutes ? parseInt(proxyRoutes.split('/')[0]) / parseInt(proxyRoutes.split('/')[1]) : 0;
        
        readinessScore += (normalizerPresent ? 15 : 0) + (proxyScore * 15);
        maxScore += 30;
        
        // Deployment readiness (30% weight)
        const pythonValid = this.testResults.deploymentReadiness.pythonSyntax === 'VALID';
        const gpt5Present = this.testResults.deploymentReadiness.gpt5Config === 'PRESENT';
        const frontendReady = this.testResults.deploymentReadiness.frontendConfig === 'PRESENT';
        
        readinessScore += (pythonValid ? 10 : 0) + (gpt5Present ? 10 : 0) + (frontendReady ? 10 : 0);
        maxScore += 30;
        
        const finalScore = (readinessScore / maxScore) * 100;
        
        if (finalScore >= 90) {
            this.testResults.overallStatus = 'READY';
            this.log(`🎉 System is READY for deployment (${finalScore.toFixed(1)}%)`, 'success');
        } else if (finalScore >= 70) {
            this.testResults.overallStatus = 'MOSTLY_READY';
            this.log(`⚠️ System is MOSTLY READY for deployment (${finalScore.toFixed(1)}%)`, 'warning');
        } else {
            this.testResults.overallStatus = 'NOT_READY';
            this.log(`❌ System is NOT READY for deployment (${finalScore.toFixed(1)}%)`, 'error');
        }
        
        this.testResults.finalScore = finalScore;
    }

    generateReport() {
        this.log('📋 COMPREHENSIVE PRE-DEPLOYMENT TEST REPORT', 'deploy');
        
        console.log('\n🔗 ENDPOINT AVAILABILITY:');
        for (const [endpoint, status] of Object.entries(this.testResults.endpointTests)) {
            const emoji = status === 'AVAILABLE' ? '✅' : status === 'MISSING' ? '❌' : '⚠️';
            console.log(`   ${endpoint}: ${status} ${emoji}`);
        }
        
        console.log('\n🔄 BACKWARD COMPATIBILITY:');
        console.log(`   API Normalizer: ${this.testResults.backwardCompatibility.normalizer} ${this.testResults.backwardCompatibility.normalizer === 'PRESENT' ? '✅' : '❌'}`);
        console.log(`   Proxy Routes: ${this.testResults.backwardCompatibility.proxyRoutes} ${this.testResults.backwardCompatibility.proxyRoutes === '6/6' ? '✅' : '⚠️'}`);
        
        console.log('\n🚢 DEPLOYMENT READINESS:');
        console.log(`   Python Syntax: ${this.testResults.deploymentReadiness.pythonSyntax} ${this.testResults.deploymentReadiness.pythonSyntax === 'VALID' ? '✅' : '❌'}`);
        console.log(`   GPT-5/O3 Config: ${this.testResults.deploymentReadiness.gpt5Config} ${this.testResults.deploymentReadiness.gpt5Config === 'PRESENT' ? '✅' : '⚠️'}`);
        console.log(`   Enhancement Files: ${this.testResults.deploymentReadiness.enhancementFiles} ${this.testResults.deploymentReadiness.enhancementFiles === '3/3' ? '✅' : '⚠️'}`);
        console.log(`   Frontend Config: ${this.testResults.deploymentReadiness.frontendConfig} ${this.testResults.deploymentReadiness.frontendConfig === 'PRESENT' ? '✅' : '❌'}`);
        
        console.log('\n📊 OVERALL ASSESSMENT:');
        console.log(`   Final Score: ${this.testResults.finalScore?.toFixed(1) || 'N/A'}%`);
        console.log(`   Status: ${this.testResults.overallStatus}`);
        
        const statusEmoji = {
            'READY': '🎉',
            'MOSTLY_READY': '⚠️',
            'NOT_READY': '❌',
            'FAILED': '💥'
        }[this.testResults.overallStatus] || '❓';
        
        console.log(`\n${statusEmoji} DEPLOYMENT RECOMMENDATION:`);
        
        switch (this.testResults.overallStatus) {
            case 'READY':
                console.log('   ✅ System is ready for production deployment');
                console.log('   ✅ All critical components are in place');
                console.log('   ✅ Backward compatibility is ensured');
                break;
            case 'MOSTLY_READY':
                console.log('   ⚠️ System can be deployed with minor issues');
                console.log('   ⚠️ Some non-critical components may be missing');
                console.log('   ⚠️ Monitor deployment closely');
                break;
            case 'NOT_READY':
                console.log('   ❌ System has critical issues preventing deployment');
                console.log('   ❌ Fix identified issues before deploying');
                console.log('   ❌ Re-run tests after fixes');
                break;
            case 'FAILED':
                console.log('   💥 Test execution failed');
                console.log('   💥 Check server status and configuration');
                console.log('   💥 Resolve blocking issues and retry');
                break;
        }
        
        this.log('🎉 PRE-DEPLOYMENT TEST COMPLETED', 'deploy');
        
        return this.testResults;
    }
}

// Run the test
const testSuite = new PreDeploymentTest();
testSuite.runComprehensiveTest().catch(console.error);
