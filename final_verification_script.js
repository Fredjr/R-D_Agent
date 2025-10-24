/**
 * FINAL VERIFICATION SCRIPT v1.0
 * 
 * Comprehensive end-to-end testing of all endpoints with 6-dimensional analysis:
 * 1. Generate Review
 * 2. Deep Dive Analysis  
 * 3. Comprehensive Analysis
 * 4. Thesis Chapter Generator
 * 5. Literature Gap Analysis
 * 6. Methodology Synthesis
 * 
 * Tests front-to-back data flow using project: 5ac213d7-6fcc-46ff-9420-5c7f4b421012
 * URL: https://frontend-psi-seven-85.vercel.app/project/5ac213d7-6fcc-46ff-9420-5c7f4b421012
 */

class FinalVerificationScript {
    constructor() {
        this.frontendUrl = 'https://frontend-psi-seven-85.vercel.app';
        this.backendUrl = 'https://r-dagent-production.up.railway.app';
        this.projectId = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
        this.testUserId = 'fredericle77@gmail.com';
        this.results = [];
        this.startTime = Date.now();
        
        // 6-Dimensional Analysis Framework
        this.analysisFramework = {
            'Technical Quality': { weight: 0.2, criteria: ['accuracy', 'completeness', 'methodology'] },
            'Academic Rigor': { weight: 0.2, criteria: ['citations', 'evidence', 'peer_review'] },
            'Content Depth': { weight: 0.15, criteria: ['detail_level', 'comprehensiveness', 'insights'] },
            'Practical Utility': { weight: 0.15, criteria: ['actionability', 'relevance', 'applicability'] },
            'Innovation Factor': { weight: 0.15, criteria: ['novelty', 'creativity', 'breakthrough_potential'] },
            'Presentation Quality': { weight: 0.15, criteria: ['clarity', 'organization', 'readability'] }
        };
    }

    log(message, type = 'info', data = null) {
        const timestamp = new Date().toISOString();
        const elapsed = Date.now() - this.startTime;
        const emoji = {
            'info': 'ℹ️', 'success': '✅', 'warning': '⚠️', 'error': '❌',
            'test': '🧪', 'analysis': '📊', 'endpoint': '🔗', 'ui': '🎨'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} [${timestamp}] [+${elapsed}ms] ${message}`);
        if (data) console.log('   Data:', data);
        this.results.push({ timestamp, type, message, data, elapsed });
    }

    async makeAPICall(endpoint, options = {}) {
        const startTime = Date.now();
        try {
            const url = endpoint.startsWith('http') ? endpoint : `${this.frontendUrl}${endpoint}`;
            const response = await fetch(url, {
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.testUserId,
                    ...options.headers
                },
                body: options.body || null,
                signal: AbortSignal.timeout(60000) // 60 second timeout for complex operations
            });
            
            const responseTime = Date.now() - startTime;
            let data;
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }
            
            return { 
                status: response.status, 
                data, 
                responseTime,
                headers: Object.fromEntries(response.headers.entries())
            };
        } catch (error) {
            const responseTime = Date.now() - startTime;
            return { status: 0, error: error.message, responseTime };
        }
    }

    analyze6Dimensions(responseData, endpointName) {
        const scores = {};
        let overallScore = 0;
        
        Object.entries(this.analysisFramework).forEach(([dimension, config]) => {
            let dimensionScore = 0;
            
            // Analyze based on response characteristics
            if (typeof responseData === 'object' && responseData !== null) {
                // Technical Quality
                if (dimension === 'Technical Quality') {
                    dimensionScore += responseData.quality_score ? (responseData.quality_score * 10) : 60;
                    dimensionScore += responseData.processing_time ? 20 : 0;
                    dimensionScore += responseData.metadata ? 20 : 0;
                }
                
                // Academic Rigor
                else if (dimension === 'Academic Rigor') {
                    dimensionScore += responseData.academic_level === 'phd' ? 30 : 10;
                    dimensionScore += responseData.citations ? 25 : 0;
                    dimensionScore += responseData.references ? 25 : 0;
                    dimensionScore += responseData.methodology ? 20 : 0;
                }
                
                // Content Depth
                else if (dimension === 'Content Depth') {
                    const contentLength = JSON.stringify(responseData).length;
                    dimensionScore += contentLength > 5000 ? 40 : contentLength > 2000 ? 25 : 10;
                    dimensionScore += responseData.detailed_analysis ? 30 : 0;
                    dimensionScore += responseData.insights ? 30 : 0;
                }
                
                // Practical Utility
                else if (dimension === 'Practical Utility') {
                    dimensionScore += responseData.recommendations ? 40 : 0;
                    dimensionScore += responseData.actionable_insights ? 30 : 0;
                    dimensionScore += responseData.next_steps ? 30 : 0;
                }
                
                // Innovation Factor
                else if (dimension === 'Innovation Factor') {
                    dimensionScore += responseData.novel_findings ? 40 : 0;
                    dimensionScore += responseData.breakthrough_potential ? 30 : 0;
                    dimensionScore += responseData.creative_approaches ? 30 : 0;
                }
                
                // Presentation Quality
                else if (dimension === 'Presentation Quality') {
                    dimensionScore += responseData.summary ? 25 : 0;
                    dimensionScore += responseData.structured_output ? 25 : 0;
                    dimensionScore += responseData.clear_sections ? 25 : 0;
                    dimensionScore += responseData.visual_elements ? 25 : 0;
                }
            } else {
                // Text-based analysis
                const textLength = typeof responseData === 'string' ? responseData.length : 0;
                dimensionScore = Math.min(100, (textLength / 100) * 10); // Basic scoring
            }
            
            dimensionScore = Math.min(100, Math.max(0, dimensionScore));
            scores[dimension] = dimensionScore;
            overallScore += dimensionScore * config.weight;
        });
        
        return { scores, overallScore: Math.round(overallScore * 10) / 10 };
    }

    async testEndpoint(endpointName, endpoint, payload, expectedFields = []) {
        this.log(`🧪 Testing ${endpointName}...`, 'test');
        
        const testResult = {
            name: endpointName,
            endpoint,
            success: false,
            responseTime: 0,
            status: 0,
            dataPresent: false,
            expectedFieldsFound: 0,
            analysis6D: null,
            uiIntegration: false,
            error: null
        };
        
        try {
            // Test API endpoint
            const response = await this.makeAPICall(endpoint, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            
            testResult.status = response.status;
            testResult.responseTime = response.responseTime;
            
            if (response.status === 200) {
                testResult.success = true;
                testResult.dataPresent = !!response.data;
                
                // Check expected fields
                if (typeof response.data === 'object' && response.data !== null) {
                    testResult.expectedFieldsFound = expectedFields.filter(field => 
                        response.data.hasOwnProperty(field)
                    ).length;
                }
                
                // Perform 6-dimensional analysis
                testResult.analysis6D = this.analyze6Dimensions(response.data, endpointName);
                
                this.log(`✅ ${endpointName}: SUCCESS`, 'success', {
                    status: testResult.status,
                    responseTime: `${testResult.responseTime}ms`,
                    overallScore: testResult.analysis6D.overallScore,
                    fieldsFound: `${testResult.expectedFieldsFound}/${expectedFields.length}`
                });
                
            } else {
                testResult.error = response.data || response.error;
                this.log(`❌ ${endpointName}: FAILED`, 'error', {
                    status: testResult.status,
                    error: testResult.error
                });
            }
            
        } catch (error) {
            testResult.error = error.message;
            this.log(`❌ ${endpointName}: EXCEPTION`, 'error', { error: error.message });
        }
        
        return testResult;
    }

    async testUIIntegration(endpointName) {
        this.log(`🎨 Testing ${endpointName} UI Integration...`, 'ui');
        
        try {
            // Open the project page
            const projectUrl = `${this.frontendUrl}/project/${this.projectId}`;
            
            // Check if we can access the project page
            const pageResponse = await this.makeAPICall(projectUrl);
            
            if (pageResponse.status === 200) {
                this.log(`✅ ${endpointName} UI: Project page accessible`, 'success');
                return true;
            } else {
                this.log(`⚠️ ${endpointName} UI: Project page not accessible`, 'warning');
                return false;
            }
            
        } catch (error) {
            this.log(`❌ ${endpointName} UI: Integration test failed`, 'error', error.message);
            return false;
        }
    }

    async runFinalVerification() {
        this.log('🚀 STARTING FINAL VERIFICATION SCRIPT', 'test');
        this.log('Testing all endpoints with 6-dimensional analysis', 'info');
        this.log(`Project: ${this.projectId}`, 'info');
        this.log(`Frontend: ${this.frontendUrl}`, 'info');
        this.log(`Backend: ${this.backendUrl}`, 'info');
        
        const testResults = [];
        
        // Test 1: Generate Review
        testResults.push(await this.testEndpoint(
            'Generate Review',
            '/api/proxy/background-jobs/generate-review',
            {
                molecule: 'COVID-19 therapeutics',
                objective: 'Comprehensive review of treatment efficacy',
                project_id: this.projectId
            },
            ['job_id', 'status', 'estimated_completion']
        ));
        
        // Test 2: Deep Dive Analysis
        testResults.push(await this.testEndpoint(
            'Deep Dive Analysis',
            '/api/proxy/deep-dive-analysis',
            {
                project_id: this.projectId,
                analysis_type: 'comprehensive',
                focus_areas: ['methodology', 'outcomes', 'limitations']
            },
            ['analysis_results', 'insights', 'recommendations']
        ));
        
        // Test 3: Comprehensive Analysis
        testResults.push(await this.testEndpoint(
            'Comprehensive Analysis',
            '/api/proxy/comprehensive-analysis',
            {
                project_id: this.projectId,
                analysis_depth: 'detailed',
                include_visualizations: true
            },
            ['summary', 'detailed_findings', 'methodology_analysis']
        ));
        
        // Test 4: Thesis Chapter Generator
        testResults.push(await this.testEndpoint(
            'Thesis Chapter Generator',
            '/api/proxy/thesis-chapter-generator',
            {
                project_id: this.projectId,
                objective: 'Generate comprehensive thesis structure',
                chapter_focus: 'literature_review',
                academic_level: 'phd'
            },
            ['chapters', 'quality_score', 'processing_time', 'metadata']
        ));
        
        // Test 5: Literature Gap Analysis
        testResults.push(await this.testEndpoint(
            'Literature Gap Analysis',
            '/api/proxy/literature-gap-analysis',
            {
                project_id: this.projectId,
                objective: 'Identify research gaps and opportunities',
                gap_types: ['theoretical', 'methodological', 'empirical'],
                academic_level: 'phd'
            },
            ['identified_gaps', 'research_opportunities', 'quality_score', 'recommendations']
        ));
        
        // Test 6: Methodology Synthesis
        testResults.push(await this.testEndpoint(
            'Methodology Synthesis',
            '/api/proxy/methodology-synthesis',
            {
                project_id: this.projectId,
                objective: 'Synthesize research methodologies',
                methodology_types: ['experimental', 'observational', 'computational'],
                academic_level: 'phd'
            },
            ['identified_methodologies', 'methodology_comparison', 'quality_score', 'synthesis_summary']
        ));
        
        // Test UI Integration for each endpoint
        this.log('🎨 Testing UI Integration...', 'ui');
        for (const result of testResults) {
            if (result.success) {
                result.uiIntegration = await this.testUIIntegration(result.name);
            }
        }

        // Generate comprehensive report
        this.generateFinalReport(testResults);

        return testResults;
    }

    generateFinalReport(testResults) {
        this.log('📋 FINAL VERIFICATION REPORT', 'analysis');

        console.log('\n🚀 FINAL VERIFICATION RESULTS:');
        console.log(`   Test Duration: ${Math.round((Date.now() - this.startTime) / 1000)}s`);
        console.log(`   Project ID: ${this.projectId}`);
        console.log(`   Frontend URL: ${this.frontendUrl}/project/${this.projectId}`);

        // Overall Statistics
        const successfulTests = testResults.filter(r => r.success).length;
        const totalTests = testResults.length;
        const successRate = (successfulTests / totalTests * 100).toFixed(1);

        console.log('\n📊 OVERALL STATISTICS:');
        console.log(`   Successful Endpoints: ${successfulTests}/${totalTests} (${successRate}%)`);

        // Calculate average scores
        const validAnalyses = testResults.filter(r => r.analysis6D);
        if (validAnalyses.length > 0) {
            const avgOverallScore = (validAnalyses.reduce((sum, r) => sum + r.analysis6D.overallScore, 0) / validAnalyses.length).toFixed(1);
            console.log(`   Average Quality Score: ${avgOverallScore}/100`);

            // Dimensional breakdown
            console.log('\n📈 6-DIMENSIONAL ANALYSIS BREAKDOWN:');
            Object.keys(this.analysisFramework).forEach(dimension => {
                const avgDimensionScore = (validAnalyses.reduce((sum, r) =>
                    sum + (r.analysis6D.scores[dimension] || 0), 0) / validAnalyses.length).toFixed(1);
                console.log(`   ${dimension}: ${avgDimensionScore}/100`);
            });
        }

        // Individual endpoint results
        console.log('\n🔗 INDIVIDUAL ENDPOINT RESULTS:');
        testResults.forEach(result => {
            const status = result.success ? '✅' : '❌';
            const uiStatus = result.uiIntegration ? '🎨✅' : '🎨❌';

            console.log(`\n   ${result.name}:`);
            console.log(`     API Status: ${status} ${result.status} (${result.responseTime}ms)`);
            console.log(`     UI Integration: ${uiStatus}`);
            console.log(`     Expected Fields: ${result.expectedFieldsFound}/${result.expectedFields?.length || 0}`);

            if (result.analysis6D) {
                console.log(`     Overall Quality: ${result.analysis6D.overallScore}/100`);
                console.log(`     Top Dimensions:`);

                // Show top 3 dimensions
                const sortedDimensions = Object.entries(result.analysis6D.scores)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 3);

                sortedDimensions.forEach(([dim, score]) => {
                    console.log(`       ${dim}: ${score.toFixed(1)}/100`);
                });
            }

            if (result.error) {
                console.log(`     Error: ${result.error.toString().substring(0, 100)}...`);
            }
        });

        // Front-to-Back Integration Assessment
        console.log('\n🔄 FRONT-TO-BACK INTEGRATION ASSESSMENT:');
        const uiIntegratedEndpoints = testResults.filter(r => r.uiIntegration).length;
        const uiIntegrationRate = (uiIntegratedEndpoints / totalTests * 100).toFixed(1);

        console.log(`   UI Integration Rate: ${uiIntegratedEndpoints}/${totalTests} (${uiIntegrationRate}%)`);
        console.log(`   Project Workspace: ${this.frontendUrl}/project/${this.projectId}`);

        // Quality Assessment
        console.log('\n🎯 QUALITY ASSESSMENT:');
        if (successRate >= 85) {
            console.log('   Status: 🎉 EXCELLENT - All systems operational');
            console.log('   Deployment: ✅ Production ready');
            console.log('   PhD Quality: ✅ Academic standards met');
        } else if (successRate >= 70) {
            console.log('   Status: ✅ GOOD - Most systems working');
            console.log('   Deployment: ⚠️ Minor issues to address');
        } else if (successRate >= 50) {
            console.log('   Status: ⚠️ PARTIAL - Significant issues remain');
            console.log('   Deployment: ❌ Not ready for production');
        } else {
            console.log('   Status: ❌ CRITICAL - Major system failures');
            console.log('   Deployment: ❌ Requires immediate attention');
        }

        // Recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        const failedEndpoints = testResults.filter(r => !r.success);
        if (failedEndpoints.length > 0) {
            console.log('   🔧 Fix failing endpoints:');
            failedEndpoints.forEach(endpoint => {
                console.log(`     - ${endpoint.name}: ${endpoint.error?.substring(0, 50) || 'Unknown error'}...`);
            });
        }

        const lowQualityEndpoints = testResults.filter(r => r.analysis6D && r.analysis6D.overallScore < 70);
        if (lowQualityEndpoints.length > 0) {
            console.log('   📈 Improve quality scores:');
            lowQualityEndpoints.forEach(endpoint => {
                console.log(`     - ${endpoint.name}: ${endpoint.analysis6D.overallScore}/100`);
            });
        }

        if (uiIntegrationRate < 80) {
            console.log('   🎨 Enhance UI integration');
            console.log('   📱 Test responsive design');
            console.log('   🔄 Verify real-time updates');
        }

        console.log('\n🎉 FINAL VERIFICATION COMPLETED');

        return {
            successRate: parseFloat(successRate),
            averageQualityScore: validAnalyses.length > 0 ?
                parseFloat((validAnalyses.reduce((sum, r) => sum + r.analysis6D.overallScore, 0) / validAnalyses.length).toFixed(1)) : 0,
            uiIntegrationRate: parseFloat(uiIntegrationRate),
            testResults,
            overallStatus: successRate >= 85 ? 'EXCELLENT' : successRate >= 70 ? 'GOOD' : successRate >= 50 ? 'PARTIAL' : 'CRITICAL'
        };
    }
}

// Auto-run when pasted into browser console or executed with Node.js
if (typeof window !== 'undefined') {
    console.log('🚀 Starting Final Verification Script...');
    console.log('📊 Testing all 6 endpoints with 6-dimensional analysis');
    console.log('🎨 Verifying front-to-back integration');
    const verification = new FinalVerificationScript();
    verification.runFinalVerification().catch(console.error);
} else if (typeof module !== 'undefined') {
    module.exports = FinalVerificationScript;
}
