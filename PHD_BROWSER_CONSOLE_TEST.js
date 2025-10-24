/**
 * 🎓 PhD CONTENT ENHANCEMENT BROWSER CONSOLE TEST
 * 
 * Copy and paste this entire script into your browser console on:
 * https://frontend-psi-seven-85.vercel.app/projects/5ac213d7-6fcc-46ff-9420-5c7f4b421012
 * 
 * This will:
 * 1. Test existing Generate Review reports for PhD enhancements
 * 2. Create new Generate Review with PhD features
 * 3. Test existing Deep Dive analyses for PhD enhancements  
 * 4. Create new Deep Dive with comprehensive analysis
 * 5. Validate all PhD-level features are working
 */

console.log('🎓 PhD CONTENT ENHANCEMENT BROWSER TEST');
console.log('=' * 50);

class PhDBrowserTester {
    constructor() {
        this.results = {
            existingReports: [],
            newGenerateReview: null,
            existingDeepDives: [],
            newDeepDive: null,
            phdFeatures: [],
            summary: { total: 0, passed: 0, failed: 0 }
        };
        this.backendUrl = 'https://rd-agent-backend-production.up.railway.app';
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '📋';
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    async runComprehensiveTest() {
        this.log('🚀 Starting comprehensive PhD content enhancement test...');
        
        try {
            // Phase 1: Test existing Generate Review reports
            await this.testExistingGenerateReviews();
            
            // Phase 2: Create new Generate Review with PhD enhancements
            await this.createNewGenerateReview();
            
            // Phase 3: Test existing Deep Dive analyses
            await this.testExistingDeepDives();
            
            // Phase 4: Create new Deep Dive with PhD enhancements
            await this.createNewDeepDive();
            
            // Phase 5: Validate PhD-specific features
            await this.validatePhdFeatures();
            
            // Generate comprehensive report
            this.generateFinalReport();
            
        } catch (error) {
            this.log(`❌ Test suite error: ${error.message}`, 'error');
        }
    }

    async testExistingGenerateReviews() {
        this.log('📊 PHASE 1: Testing Existing Generate Review Reports');
        this.log('-' * 50);

        const reportIds = [
            '7b6d5665-4fb7-4817-9122-6c138bdfa4da',
            '40b56784-1ce8-4d80-95b2-fb643d7134dd'
        ];

        for (const reportId of reportIds) {
            try {
                this.log(`📋 Testing Report: ${reportId}`);
                
                const response = await fetch(`/api/proxy/reports/${reportId}`, {
                    headers: { 'User-ID': 'phd-browser-test' }
                });

                if (response.ok) {
                    const data = await response.json();
                    const validation = this.validateGenerateReviewData(data, reportId);
                    this.results.existingReports.push(validation);
                    
                    if (validation.hasPhdEnhancements) {
                        this.log(`✅ Report ${reportId}: PhD enhancements detected!`, 'success');
                    } else {
                        this.log(`⚠️ Report ${reportId}: No PhD enhancements yet`, 'warning');
                    }
                } else {
                    this.log(`❌ Report ${reportId}: HTTP ${response.status}`, 'error');
                }
            } catch (error) {
                this.log(`❌ Report ${reportId}: ${error.message}`, 'error');
            }
        }
    }

    validateGenerateReviewData(data, reportId) {
        const validation = {
            reportId,
            hasPhdEnhancements: false,
            hasEnhancementMetadata: false,
            hasPhdLevelAnalysis: false,
            enhancedPapers: 0,
            totalPapers: 0,
            features: []
        };

        // Check for PhD enhancement metadata
        if (data.enhancement_metadata) {
            validation.hasEnhancementMetadata = true;
            validation.features.push('enhancement_metadata');
            
            if (data.enhancement_metadata.phd_level_analysis) {
                validation.hasPhdLevelAnalysis = true;
                validation.features.push('phd_level_analysis');
            }
        }

        // Check papers for PhD enhancements
        if (data.results && Array.isArray(data.results)) {
            for (const section of data.results) {
                if (section.articles && Array.isArray(section.articles)) {
                    for (const article of section.articles) {
                        validation.totalPapers++;
                        
                        let hasEnhancements = false;
                        
                        if (article.score_breakdown) {
                            validation.features.push('score_breakdown');
                            hasEnhancements = true;
                        }
                        
                        if (article.fact_anchors && Array.isArray(article.fact_anchors) && article.fact_anchors.length > 0) {
                            validation.features.push('fact_anchors');
                            hasEnhancements = true;
                        }
                        
                        if (article.quality_score !== undefined) {
                            validation.features.push('quality_score');
                            hasEnhancements = true;
                        }
                        
                        if (article.methodology_analysis) {
                            validation.features.push('methodology_analysis');
                            hasEnhancements = true;
                        }
                        
                        if (hasEnhancements) {
                            validation.enhancedPapers++;
                        }
                    }
                }
            }
        }

        validation.hasPhdEnhancements = validation.hasEnhancementMetadata || validation.enhancedPapers > 0;
        validation.features = [...new Set(validation.features)];
        
        return validation;
    }

    async createNewGenerateReview() {
        this.log('🆕 PHASE 2: Creating New Generate Review with PhD Enhancements');
        this.log('-' * 60);

        try {
            const testData = {
                objective: 'Investigate ACE inhibitors for heart failure treatment with focus on mortality reduction and quality of life improvements',
                molecule: 'Enalapril',
                project_id: 'phd-browser-test-' + Date.now(),
                preference: 'recall'
            };

            this.log('📤 Sending Generate Review request...');
            const response = await fetch(`${this.backendUrl}/generate-review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': 'phd-browser-test'
                },
                body: JSON.stringify(testData)
            });

            if (response.ok) {
                const data = await response.json();
                this.results.newGenerateReview = this.validateGenerateReviewData(data, 'NEW_REPORT');
                
                this.log('✅ New Generate Review created successfully!', 'success');
                this.log(`📊 Papers found: ${this.results.newGenerateReview.totalPapers}`);
                this.log(`🎓 Enhanced papers: ${this.results.newGenerateReview.enhancedPapers}`);
                this.log(`🔬 PhD features: ${this.results.newGenerateReview.features.join(', ')}`);
                
                if (this.results.newGenerateReview.hasPhdEnhancements) {
                    this.log('🎉 PhD ENHANCEMENTS WORKING IN NEW REPORTS!', 'success');
                } else {
                    this.log('⚠️ PhD enhancements not detected in new report', 'warning');
                }
            } else {
                this.log(`❌ Generate Review failed: HTTP ${response.status}`, 'error');
                this.results.newGenerateReview = { error: `HTTP ${response.status}` };
            }
        } catch (error) {
            this.log(`❌ Generate Review error: ${error.message}`, 'error');
            this.results.newGenerateReview = { error: error.message };
        }
    }

    async testExistingDeepDives() {
        this.log('🔬 PHASE 3: Testing Existing Deep Dive Analyses');
        this.log('-' * 50);

        const analysisIds = [
            'b0f9545d-7e5c-49c9-94ae-f129fec4dd96'
        ];

        for (const analysisId of analysisIds) {
            try {
                this.log(`🧪 Testing Deep Dive: ${analysisId}`);
                
                const response = await fetch(`/api/proxy/analysis/${analysisId}`, {
                    headers: { 'User-ID': 'phd-browser-test' }
                });

                if (response.ok) {
                    const data = await response.json();
                    const validation = this.validateDeepDiveData(data, analysisId);
                    this.results.existingDeepDives.push(validation);
                    
                    if (validation.hasPhdEnhancements) {
                        this.log(`✅ Deep Dive ${analysisId}: PhD enhancements detected!`, 'success');
                    } else {
                        this.log(`⚠️ Deep Dive ${analysisId}: No PhD enhancements yet`, 'warning');
                    }
                } else {
                    this.log(`❌ Deep Dive ${analysisId}: HTTP ${response.status}`, 'error');
                }
            } catch (error) {
                this.log(`❌ Deep Dive ${analysisId}: ${error.message}`, 'error');
            }
        }
    }

    validateDeepDiveData(data, analysisId) {
        const validation = {
            analysisId,
            hasPhdEnhancements: false,
            hasQualityAssessment: false,
            hasComprehensiveAnalysis: false,
            features: [],
            analysisDepth: 'basic'
        };

        // Check for PhD enhancement metadata
        if (data.enhancement_metadata) {
            validation.features.push('enhancement_metadata');
            if (data.enhancement_metadata.phd_level_analysis) {
                validation.features.push('phd_level_analysis');
                validation.analysisDepth = 'phd_level';
            }
        }

        // Check quality assessment
        if (data.quality_assessment) {
            validation.hasQualityAssessment = true;
            validation.features.push('quality_assessment');
        }

        // Check scientific model analysis depth
        if (data.scientific_model_analysis) {
            const model = data.scientific_model_analysis;
            const studyDesignLength = (model.study_design || '').split(' ').length;
            
            if (studyDesignLength >= 200) {
                validation.hasComprehensiveAnalysis = true;
                validation.features.push('comprehensive_analysis');
                validation.analysisDepth = 'comprehensive';
            }
            
            if (model.fact_anchors && Array.isArray(model.fact_anchors) && model.fact_anchors.length >= 3) {
                validation.features.push('fact_anchors');
            }
        }

        // Check experimental methods
        if (data.experimental_methods_analysis && Array.isArray(data.experimental_methods_analysis)) {
            validation.features.push('experimental_methods');
        }

        // Check results interpretation
        if (data.results_interpretation_analysis) {
            validation.features.push('results_interpretation');
            
            const results = data.results_interpretation_analysis;
            if (results.key_results && Array.isArray(results.key_results) && results.key_results.length > 0) {
                validation.features.push('quantitative_results');
            }
        }

        validation.hasPhdEnhancements = validation.features.length > 0;
        validation.features = [...new Set(validation.features)];
        
        return validation;
    }

    async createNewDeepDive() {
        this.log('🆕 PHASE 4: Creating New Deep Dive with PhD Enhancements');
        this.log('-' * 55);

        try {
            // Use a well-known PMID for testing
            const testPmid = '33301246'; // COVID-19 research paper
            
            this.log(`📤 Sending Deep Dive request for PMID: ${testPmid}`);
            const response = await fetch(`${this.backendUrl}/deep-dive/${testPmid}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': 'phd-browser-test'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.results.newDeepDive = this.validateDeepDiveData(data, 'NEW_DEEP_DIVE');
                
                this.log('✅ New Deep Dive created successfully!', 'success');
                this.log(`🎓 Analysis depth: ${this.results.newDeepDive.analysisDepth}`);
                this.log(`🔬 PhD features: ${this.results.newDeepDive.features.join(', ')}`);
                
                if (this.results.newDeepDive.hasPhdEnhancements) {
                    this.log('🎉 PhD ENHANCEMENTS WORKING IN NEW DEEP DIVES!', 'success');
                } else {
                    this.log('⚠️ PhD enhancements not detected in new deep dive', 'warning');
                }
            } else {
                this.log(`❌ Deep Dive failed: HTTP ${response.status}`, 'error');
                this.results.newDeepDive = { error: `HTTP ${response.status}` };
            }
        } catch (error) {
            this.log(`❌ Deep Dive error: ${error.message}`, 'error');
            this.results.newDeepDive = { error: error.message };
        }
    }

    async validatePhdFeatures() {
        this.log('🎓 PHASE 5: Validating PhD-Specific Features');
        this.log('-' * 45);

        // Test backend health
        try {
            const healthResponse = await fetch(`${this.backendUrl}/`);
            this.results.phdFeatures.push({
                feature: 'Backend Health',
                status: healthResponse.ok ? 'healthy' : 'unhealthy',
                details: `HTTP ${healthResponse.status}`
            });
            this.log(`🏥 Backend health: ${healthResponse.ok ? '✅ Healthy' : '❌ Unhealthy'}`);
        } catch (error) {
            this.results.phdFeatures.push({
                feature: 'Backend Health',
                status: 'error',
                details: error.message
            });
            this.log(`❌ Backend health check failed: ${error.message}`, 'error');
        }

        // Summarize PhD feature detection
        const allFeatures = new Set();
        
        this.results.existingReports.forEach(report => {
            report.features.forEach(feature => allFeatures.add(feature));
        });
        
        if (this.results.newGenerateReview && this.results.newGenerateReview.features) {
            this.results.newGenerateReview.features.forEach(feature => allFeatures.add(feature));
        }
        
        this.results.existingDeepDives.forEach(dive => {
            dive.features.forEach(feature => allFeatures.add(feature));
        });
        
        if (this.results.newDeepDive && this.results.newDeepDive.features) {
            this.results.newDeepDive.features.forEach(feature => allFeatures.add(feature));
        }

        this.log(`🔬 PhD features detected: ${Array.from(allFeatures).join(', ')}`);
        this.results.phdFeatures.push({
            feature: 'PhD Features Detected',
            status: allFeatures.size > 0 ? 'active' : 'inactive',
            details: Array.from(allFeatures)
        });
    }

    generateFinalReport() {
        this.log('=' * 60);
        this.log('🎯 PhD CONTENT ENHANCEMENT TEST REPORT');
        this.log('=' * 60);

        // Calculate summary statistics
        let totalTests = 0;
        let passedTests = 0;

        // Existing reports
        this.results.existingReports.forEach(report => {
            totalTests++;
            if (report.hasPhdEnhancements) passedTests++;
        });

        // New Generate Review
        if (this.results.newGenerateReview) {
            totalTests++;
            if (this.results.newGenerateReview.hasPhdEnhancements) passedTests++;
        }

        // Existing Deep Dives
        this.results.existingDeepDives.forEach(dive => {
            totalTests++;
            if (dive.hasPhdEnhancements) passedTests++;
        });

        // New Deep Dive
        if (this.results.newDeepDive) {
            totalTests++;
            if (this.results.newDeepDive.hasPhdEnhancements) passedTests++;
        }

        const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0;

        this.log(`📊 SUMMARY STATISTICS:`);
        this.log(`   Total tests: ${totalTests}`);
        this.log(`   Tests with PhD enhancements: ${passedTests}`);
        this.log(`   Success rate: ${successRate}%`);

        if (successRate >= 80) {
            this.log('🎉 EXCELLENT! PhD enhancements are working great!', 'success');
        } else if (successRate >= 50) {
            this.log('✅ GOOD! PhD enhancements are partially working', 'success');
        } else if (successRate > 0) {
            this.log('⚠️ PARTIAL: Some PhD enhancements detected', 'warning');
        } else {
            this.log('❌ PhD enhancements not yet active', 'error');
        }

        this.log('\n📋 DETAILED RESULTS:');
        this.log('Existing Reports:', this.results.existingReports);
        this.log('New Generate Review:', this.results.newGenerateReview);
        this.log('Existing Deep Dives:', this.results.existingDeepDives);
        this.log('New Deep Dive:', this.results.newDeepDive);
        this.log('PhD Features:', this.results.phdFeatures);

        this.log('\n🚀 TEST COMPLETE! Check the detailed results above.');
        
        return {
            successRate,
            totalTests,
            passedTests,
            results: this.results
        };
    }
}

// Create and run the test
const phdTester = new PhDBrowserTester();

// Auto-run the comprehensive test
console.log('🚀 Starting PhD Content Enhancement Test...');
phdTester.runComprehensiveTest().then(() => {
    console.log('🎯 PhD Content Enhancement Test Complete!');
    console.log('📊 Check the detailed report above for results');
});

// Also make it available for manual execution
window.runPhdTest = () => phdTester.runComprehensiveTest();
window.phdTester = phdTester;
