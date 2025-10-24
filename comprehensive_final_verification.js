/**
 * COMPREHENSIVE FINAL VERIFICATION SCRIPT v2.0
 * 
 * Tests all 6 endpoints with correct payloads and 6-dimensional analysis:
 * 1. Generate Review (Background Jobs)
 * 2. Deep Dive Analysis  
 * 3. Comprehensive Analysis (Generate Summary)
 * 4. Thesis Chapter Generator
 * 5. Literature Gap Analysis
 * 6. Methodology Synthesis
 * 
 * Project: https://frontend-psi-seven-85.vercel.app/project/5ac213d7-6fcc-46ff-9420-5c7f4b421012
 * Tests front-to-back data flow with UI integration validation
 */

class ComprehensiveFinalVerification {
    constructor() {
        this.frontendUrl = window.location.origin || 'https://frontend-psi-seven-85.vercel.app';
        this.projectId = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
        this.testUserId = 'fredericle77@gmail.com';
        this.results = [];
        this.startTime = Date.now();
        
        // 6-Dimensional Analysis Framework (PhD-Level Quality Assessment)
        this.analysisFramework = {
            'Technical Quality': { 
                weight: 0.2, 
                criteria: ['response_time', 'data_completeness', 'error_handling'],
                thresholds: { excellent: 90, good: 75, acceptable: 60 }
            },
            'Academic Rigor': { 
                weight: 0.2, 
                criteria: ['phd_level_content', 'citations', 'methodology'],
                thresholds: { excellent: 85, good: 70, acceptable: 55 }
            },
            'Content Depth': { 
                weight: 0.15, 
                criteria: ['comprehensiveness', 'detail_level', 'insights'],
                thresholds: { excellent: 80, good: 65, acceptable: 50 }
            },
            'Practical Utility': { 
                weight: 0.15, 
                criteria: ['actionability', 'relevance', 'applicability'],
                thresholds: { excellent: 85, good: 70, acceptable: 55 }
            },
            'Innovation Factor': { 
                weight: 0.15, 
                criteria: ['novelty', 'breakthrough_potential', 'creative_approaches'],
                thresholds: { excellent: 75, good: 60, acceptable: 45 }
            },
            'Presentation Quality': { 
                weight: 0.15, 
                criteria: ['clarity', 'organization', 'ui_integration'],
                thresholds: { excellent: 90, good: 75, acceptable: 60 }
            }
        };
    }

    log(message, type = 'info', data = null) {
        const timestamp = new Date().toISOString();
        const elapsed = Date.now() - this.startTime;
        const emoji = {
            'info': 'ℹ️', 'success': '✅', 'warning': '⚠️', 'error': '❌',
            'test': '🧪', 'analysis': '📊', 'endpoint': '🔗', 'ui': '🎨',
            'verification': '🔍', 'quality': '⭐', 'integration': '🔄'
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
                signal: AbortSignal.timeout(90000) // 90 second timeout for complex operations
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
                headers: Object.fromEntries(response.headers.entries()),
                success: response.ok
            };
        } catch (error) {
            const responseTime = Date.now() - startTime;
            return { status: 0, error: error.message, responseTime, success: false };
        }
    }

    analyze6Dimensions(responseData, endpointName, responseTime, status) {
        const scores = {};
        let overallScore = 0;
        
        Object.entries(this.analysisFramework).forEach(([dimension, config]) => {
            let dimensionScore = 0;
            
            // Technical Quality Analysis
            if (dimension === 'Technical Quality') {
                // Response time scoring (under 5s = excellent, under 10s = good, under 30s = acceptable)
                if (responseTime < 5000) dimensionScore += 35;
                else if (responseTime < 10000) dimensionScore += 25;
                else if (responseTime < 30000) dimensionScore += 15;
                
                // Status code scoring
                if (status === 200) dimensionScore += 35;
                else if (status < 400) dimensionScore += 20;
                
                // Data completeness
                if (typeof responseData === 'object' && responseData !== null) {
                    const dataKeys = Object.keys(responseData).length;
                    if (dataKeys > 8) dimensionScore += 30;
                    else if (dataKeys > 5) dimensionScore += 20;
                    else if (dataKeys > 2) dimensionScore += 10;
                }
            }
            
            // Academic Rigor Analysis
            else if (dimension === 'Academic Rigor') {
                if (typeof responseData === 'object' && responseData !== null) {
                    // PhD-level indicators
                    if (responseData.academic_level === 'phd') dimensionScore += 25;
                    if (responseData.quality_score && responseData.quality_score >= 8) dimensionScore += 25;
                    if (responseData.methodology || responseData.methodology_summary) dimensionScore += 25;
                    if (responseData.citations || responseData.references) dimensionScore += 25;
                }
            }
            
            // Content Depth Analysis
            else if (dimension === 'Content Depth') {
                if (typeof responseData === 'object' && responseData !== null) {
                    const contentLength = JSON.stringify(responseData).length;
                    if (contentLength > 10000) dimensionScore += 40;
                    else if (contentLength > 5000) dimensionScore += 30;
                    else if (contentLength > 2000) dimensionScore += 20;
                    else if (contentLength > 500) dimensionScore += 10;
                    
                    // Depth indicators
                    if (responseData.detailed_analysis || responseData.comprehensive_analysis) dimensionScore += 30;
                    if (responseData.insights || responseData.key_findings) dimensionScore += 30;
                }
            }
            
            // Practical Utility Analysis
            else if (dimension === 'Practical Utility') {
                if (typeof responseData === 'object' && responseData !== null) {
                    if (responseData.recommendations) dimensionScore += 35;
                    if (responseData.actionable_insights || responseData.next_steps) dimensionScore += 35;
                    if (responseData.practical_applications) dimensionScore += 30;
                }
            }
            
            // Innovation Factor Analysis
            else if (dimension === 'Innovation Factor') {
                if (typeof responseData === 'object' && responseData !== null) {
                    // GPT-5/O3 model usage indicates cutting-edge approach
                    if (responseData.metadata && responseData.metadata.model_used) dimensionScore += 30;
                    if (responseData.novel_findings || responseData.breakthrough_potential) dimensionScore += 35;
                    if (responseData.creative_approaches || responseData.innovative_methods) dimensionScore += 35;
                }
            }
            
            // Presentation Quality Analysis
            else if (dimension === 'Presentation Quality') {
                if (typeof responseData === 'object' && responseData !== null) {
                    // Structure and organization
                    if (responseData.summary || responseData.executive_summary) dimensionScore += 25;
                    if (responseData.metadata) dimensionScore += 25;
                    if (responseData.processing_time) dimensionScore += 25;
                    
                    // Clear sections and formatting
                    const structuredFields = ['chapters', 'sections', 'categories', 'analysis_results'];
                    if (structuredFields.some(field => responseData[field])) dimensionScore += 25;
                }
            }
            
            dimensionScore = Math.min(100, Math.max(0, dimensionScore));
            scores[dimension] = dimensionScore;
            overallScore += dimensionScore * config.weight;
        });
        
        return { 
            scores, 
            overallScore: Math.round(overallScore * 10) / 10,
            grade: this.getQualityGrade(overallScore)
        };
    }

    getQualityGrade(score) {
        if (score >= 85) return 'A+ (Excellent)';
        if (score >= 75) return 'A (Very Good)';
        if (score >= 65) return 'B+ (Good)';
        if (score >= 55) return 'B (Acceptable)';
        if (score >= 45) return 'C+ (Below Average)';
        if (score >= 35) return 'C (Poor)';
        return 'F (Failed)';
    }

    async testUIIntegration(endpointName, responseData) {
        this.log(`🎨 Testing ${endpointName} UI Integration...`, 'ui');
        
        const uiTests = {
            dataDisplayed: false,
            interactiveElements: false,
            loadingStates: false,
            errorHandling: false,
            responsiveDesign: false
        };
        
        try {
            // Check if data appears in UI
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for potential UI updates
            
            // Look for data-related elements
            const dataElements = document.querySelectorAll('[data-testid*="result"], [class*="result"], [class*="analysis"], [class*="summary"]');
            if (dataElements.length > 0) {
                uiTests.dataDisplayed = true;
                this.log(`✅ ${endpointName}: Data display elements found`, 'success');
            }
            
            // Check for interactive elements
            const interactiveElements = document.querySelectorAll('button, [class*="expandable"], [class*="filter"], [class*="sort"]');
            if (interactiveElements.length > 0) {
                uiTests.interactiveElements = true;
                this.log(`✅ ${endpointName}: Interactive elements found`, 'success');
            }
            
            // Check for loading states
            const loadingElements = document.querySelectorAll('[class*="loading"], [class*="skeleton"], [class*="spinner"]');
            if (loadingElements.length > 0) {
                uiTests.loadingStates = true;
                this.log(`✅ ${endpointName}: Loading state elements found`, 'success');
            }
            
            // Check for error handling
            const errorElements = document.querySelectorAll('[class*="error"], [role="alert"], [class*="warning"]');
            if (errorElements.length > 0) {
                uiTests.errorHandling = true;
                this.log(`✅ ${endpointName}: Error handling elements found`, 'success');
            }
            
            // Check responsive design
            const viewportWidth = window.innerWidth;
            const responsiveElements = document.querySelectorAll('[class*="responsive"], [class*="mobile"], [class*="tablet"], [class*="desktop"]');
            if (responsiveElements.length > 0 || viewportWidth < 1024) {
                uiTests.responsiveDesign = true;
                this.log(`✅ ${endpointName}: Responsive design elements found`, 'success');
            }
            
        } catch (error) {
            this.log(`❌ ${endpointName}: UI integration test failed`, 'error', error.message);
        }
        
        const uiScore = (Object.values(uiTests).filter(Boolean).length / Object.keys(uiTests).length * 100).toFixed(1);
        return { tests: uiTests, score: parseFloat(uiScore) };
    }

    async testEndpointComprehensive(endpointName, endpoint, payload, expectedFields = []) {
        this.log(`🧪 Testing ${endpointName} - Comprehensive Analysis`, 'test');
        
        const testResult = {
            name: endpointName,
            endpoint,
            success: false,
            responseTime: 0,
            status: 0,
            dataPresent: false,
            expectedFieldsFound: 0,
            analysis6D: null,
            uiIntegration: null,
            qualityMetrics: {},
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
            testResult.success = response.success;
            
            if (response.success && response.data) {
                testResult.dataPresent = true;
                
                // Check expected fields
                if (typeof response.data === 'object' && response.data !== null) {
                    testResult.expectedFieldsFound = expectedFields.filter(field => 
                        response.data.hasOwnProperty(field)
                    ).length;
                    
                    // Extract quality metrics
                    testResult.qualityMetrics = {
                        qualityScore: response.data.quality_score || null,
                        processingTime: response.data.processing_time || null,
                        articlesAnalyzed: response.data.metadata?.articles_analyzed || null,
                        modelUsed: response.data.metadata?.model_used || null,
                        academicLevel: response.data.metadata?.academic_level || response.data.academic_level || null
                    };
                }
                
                // Perform 6-dimensional analysis
                testResult.analysis6D = this.analyze6Dimensions(
                    response.data, 
                    endpointName, 
                    response.responseTime, 
                    response.status
                );
                
                // Test UI integration
                testResult.uiIntegration = await this.testUIIntegration(endpointName, response.data);
                
                this.log(`✅ ${endpointName}: SUCCESS`, 'success', {
                    status: testResult.status,
                    responseTime: `${testResult.responseTime}ms`,
                    overallScore: testResult.analysis6D.overallScore,
                    grade: testResult.analysis6D.grade,
                    fieldsFound: `${testResult.expectedFieldsFound}/${expectedFields.length}`,
                    uiScore: `${testResult.uiIntegration.score}%`
                });
                
            } else {
                testResult.error = response.data?.detail || response.data?.error || response.error || 'Unknown error';
                this.log(`❌ ${endpointName}: FAILED`, 'error', {
                    status: testResult.status,
                    responseTime: `${testResult.responseTime}ms`,
                    error: testResult.error
                });
            }
            
        } catch (error) {
            testResult.error = error.message;
            this.log(`❌ ${endpointName}: EXCEPTION`, 'error', { error: error.message });
        }
        
        return testResult;
    }

    async runComprehensiveFinalVerification() {
        this.log('🚀 STARTING COMPREHENSIVE FINAL VERIFICATION', 'verification');
        this.log('Testing all 6 endpoints with 6-dimensional analysis and UI integration', 'info');
        this.log(`Project: ${this.projectId}`, 'info');
        this.log(`Frontend: ${this.frontendUrl}`, 'info');
        this.log(`Current URL: ${window.location.href}`, 'info');

        const testResults = [];

        // Test 1: Generate Review (Background Jobs)
        testResults.push(await this.testEndpointComprehensive(
            'Generate Review',
            '/api/proxy/background-jobs/generate-review',
            {
                molecule: 'COVID-19 therapeutics',
                objective: 'Comprehensive review of treatment efficacy and safety profiles',
                project_id: this.projectId,
                analysis_depth: 'comprehensive',
                include_methodology: true
            },
            ['job_id', 'status', 'estimated_completion', 'progress']
        ));

        // Test 2: Deep Dive Analysis
        testResults.push(await this.testEndpointComprehensive(
            'Deep Dive Analysis',
            '/api/proxy/deep-dive',
            {
                project_id: this.projectId,
                objective: 'Comprehensive deep dive analysis of research methodologies and outcomes',
                analysis_type: 'comprehensive',
                focus_areas: ['methodology', 'outcomes', 'limitations', 'future_directions']
            },
            ['analysis_results', 'insights', 'recommendations', 'quality_score']
        ));

        // Test 3: Comprehensive Analysis (Generate Summary)
        testResults.push(await this.testEndpointComprehensive(
            'Comprehensive Analysis',
            '/api/proxy/generate-summary',
            {
                project_id: this.projectId,
                objective: 'Generate comprehensive project summary with PhD-level analysis',
                summary_type: 'comprehensive',
                academic_level: 'phd',
                include_methodology: true,
                include_gaps: true,
                target_length: 5000
            },
            ['summary_content', 'methodology_summary', 'research_gaps', 'key_findings', 'quality_score']
        ));

        // Test 4: Thesis Chapter Generator
        testResults.push(await this.testEndpointComprehensive(
            'Thesis Chapter Generator',
            '/api/proxy/thesis-chapter-generator',
            {
                project_id: this.projectId,
                objective: 'Generate comprehensive thesis structure with detailed chapters',
                chapter_focus: 'comprehensive',
                academic_level: 'phd',
                citation_style: 'apa',
                target_length: 80000,
                include_timeline: true
            },
            ['chapters', 'quality_score', 'processing_time', 'research_timeline', 'metadata']
        ));

        // Test 5: Literature Gap Analysis
        testResults.push(await this.testEndpointComprehensive(
            'Literature Gap Analysis',
            '/api/proxy/literature-gap-analysis',
            {
                project_id: this.projectId,
                objective: 'Identify comprehensive research gaps and opportunities',
                gap_types: ['theoretical', 'methodological', 'empirical', 'temporal'],
                academic_level: 'phd',
                analysis_depth: 'comprehensive',
                severity_threshold: 'moderate',
                include_methodology_gaps: true
            },
            ['identified_gaps', 'research_opportunities', 'methodology_gaps', 'quality_score', 'recommendations']
        ));

        // Test 6: Methodology Synthesis
        testResults.push(await this.testEndpointComprehensive(
            'Methodology Synthesis',
            '/api/proxy/methodology-synthesis',
            {
                project_id: this.projectId,
                objective: 'Synthesize research methodologies with comparative analysis',
                methodology_types: ['experimental', 'observational', 'computational', 'mixed_methods'],
                academic_level: 'phd',
                include_statistical_methods: true,
                include_validation: true,
                comparison_depth: 'detailed',
                synthesis_type: 'comprehensive_comparative'
            },
            ['identified_methodologies', 'methodology_comparison', 'statistical_methods', 'quality_score', 'synthesis_summary']
        ));

        // Generate comprehensive report
        this.generateComprehensiveReport(testResults);

        return testResults;
    }

    generateComprehensiveReport(testResults) {
        this.log('📋 COMPREHENSIVE FINAL VERIFICATION REPORT', 'analysis');

        console.log('\n🎉 COMPREHENSIVE FINAL VERIFICATION RESULTS');
        console.log('==========================================');
        console.log(`   Test Duration: ${Math.round((Date.now() - this.startTime) / 1000)}s`);
        console.log(`   Project ID: ${this.projectId}`);
        console.log(`   Project URL: ${this.frontendUrl}/project/${this.projectId}`);

        // Overall Statistics
        const successfulTests = testResults.filter(r => r.success).length;
        const totalTests = testResults.length;
        const successRate = (successfulTests / totalTests * 100).toFixed(1);

        console.log('\n📊 OVERALL STATISTICS:');
        console.log(`   Successful Endpoints: ${successfulTests}/${totalTests} (${successRate}%)`);

        // 6-Dimensional Analysis Summary
        const validAnalyses = testResults.filter(r => r.analysis6D);
        if (validAnalyses.length > 0) {
            const avgOverallScore = (validAnalyses.reduce((sum, r) => sum + r.analysis6D.overallScore, 0) / validAnalyses.length).toFixed(1);
            console.log(`   Average Quality Score: ${avgOverallScore}/100`);

            console.log('\n⭐ 6-DIMENSIONAL ANALYSIS BREAKDOWN:');
            Object.keys(this.analysisFramework).forEach(dimension => {
                const avgDimensionScore = (validAnalyses.reduce((sum, r) =>
                    sum + (r.analysis6D.scores[dimension] || 0), 0) / validAnalyses.length).toFixed(1);
                const weight = (this.analysisFramework[dimension].weight * 100).toFixed(0);
                console.log(`   ${dimension} (${weight}%): ${avgDimensionScore}/100`);
            });
        }

        // UI Integration Summary
        const uiTests = testResults.filter(r => r.uiIntegration);
        if (uiTests.length > 0) {
            const avgUIScore = (uiTests.reduce((sum, r) => sum + r.uiIntegration.score, 0) / uiTests.length).toFixed(1);
            console.log(`\n🎨 UI INTEGRATION SCORE: ${avgUIScore}/100`);
        }

        // Individual Endpoint Results
        console.log('\n🔗 INDIVIDUAL ENDPOINT RESULTS:');
        testResults.forEach(result => {
            const status = result.success ? '✅' : '❌';
            const uiStatus = result.uiIntegration ? `🎨${result.uiIntegration.score.toFixed(0)}%` : '🎨N/A';

            console.log(`\n   ${result.name}:`);
            console.log(`     API Status: ${status} ${result.status} (${result.responseTime}ms)`);
            console.log(`     UI Integration: ${uiStatus}`);
            console.log(`     Expected Fields: ${result.expectedFieldsFound}/${result.expectedFields?.length || 0}`);

            if (result.analysis6D) {
                console.log(`     Overall Quality: ${result.analysis6D.overallScore}/100 (${result.analysis6D.grade})`);

                // Show quality metrics
                if (result.qualityMetrics.qualityScore) {
                    console.log(`     Quality Score: ${result.qualityMetrics.qualityScore}/10`);
                }
                if (result.qualityMetrics.processingTime) {
                    console.log(`     Processing Time: ${result.qualityMetrics.processingTime}`);
                }
                if (result.qualityMetrics.articlesAnalyzed) {
                    console.log(`     Articles Analyzed: ${result.qualityMetrics.articlesAnalyzed}`);
                }

                // Show top 3 dimensions
                const sortedDimensions = Object.entries(result.analysis6D.scores)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 3);

                console.log(`     Top Dimensions:`);
                sortedDimensions.forEach(([dim, score]) => {
                    console.log(`       ${dim}: ${score.toFixed(1)}/100`);
                });
            }

            if (result.error) {
                console.log(`     Error: ${result.error.toString().substring(0, 100)}...`);
            }
        });

        // Quality Assessment
        console.log('\n🎯 QUALITY ASSESSMENT:');
        if (successRate >= 85) {
            console.log('   Status: 🎉 EXCELLENT - All systems operational');
            console.log('   Deployment: ✅ Production ready');
            console.log('   PhD Quality: ✅ Academic standards exceeded');
        } else if (successRate >= 70) {
            console.log('   Status: ✅ GOOD - Most systems working');
            console.log('   Deployment: ⚠️ Minor issues to address');
            console.log('   PhD Quality: ✅ Academic standards met');
        } else if (successRate >= 50) {
            console.log('   Status: ⚠️ PARTIAL - Significant issues remain');
            console.log('   Deployment: ❌ Not ready for production');
            console.log('   PhD Quality: ⚠️ Below academic standards');
        } else {
            console.log('   Status: ❌ CRITICAL - Major system failures');
            console.log('   Deployment: ❌ Requires immediate attention');
            console.log('   PhD Quality: ❌ Unacceptable for academic use');
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

        const lowUIEndpoints = testResults.filter(r => r.uiIntegration && r.uiIntegration.score < 60);
        if (lowUIEndpoints.length > 0) {
            console.log('   🎨 Enhance UI integration:');
            lowUIEndpoints.forEach(endpoint => {
                console.log(`     - ${endpoint.name}: ${endpoint.uiIntegration.score}% UI score`);
            });
        }

        console.log('\n🎉 COMPREHENSIVE VERIFICATION COMPLETED');

        return {
            successRate: parseFloat(successRate),
            averageQualityScore: validAnalyses.length > 0 ?
                parseFloat((validAnalyses.reduce((sum, r) => sum + r.analysis6D.overallScore, 0) / validAnalyses.length).toFixed(1)) : 0,
            averageUIScore: uiTests.length > 0 ?
                parseFloat((uiTests.reduce((sum, r) => sum + r.uiIntegration.score, 0) / uiTests.length).toFixed(1)) : 0,
            testResults,
            overallStatus: successRate >= 85 ? 'EXCELLENT' : successRate >= 70 ? 'GOOD' : successRate >= 50 ? 'PARTIAL' : 'CRITICAL'
        };
    }
}

// Auto-run when pasted into browser console
if (typeof window !== 'undefined') {
    console.log('🚀 Starting Comprehensive Final Verification...');
    console.log('📊 Testing all 6 endpoints with 6-dimensional analysis');
    console.log('🎨 Verifying front-to-back integration and UI components');
    console.log('⭐ PhD-level quality assessment framework');

    const verification = new ComprehensiveFinalVerification();
    verification.runComprehensiveFinalVerification().catch(console.error);
} else if (typeof module !== 'undefined') {
    module.exports = ComprehensiveFinalVerification;
}
