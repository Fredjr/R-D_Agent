/**
 * PhD Content Enhancement Validation Test
 * Tests the enhanced backend content generation with PhD-level analysis
 */

console.log('🎯 PhD CONTENT ENHANCEMENT VALIDATION TEST LOADED');
console.log('📋 This will test the enhanced backend content generation');

// Test configuration
const TEST_CONFIG = {
    BACKEND_URL: 'https://rd-agent-backend-production.up.railway.app',
    FRONTEND_URL: 'https://frontend-psi-seven-85.vercel.app',
    TEST_TIMEOUT: 60000, // 60 seconds
    EXPECTED_ENHANCEMENTS: {
        score_breakdown: true,
        fact_anchors: true,
        phd_level_analysis: true,
        enhanced_metadata: true
    }
};

// Test data
const TEST_CASES = [
    {
        name: 'Enhanced Generate Review - Cardiology',
        objective: 'Analyze cardiovascular interventions for heart failure treatment',
        molecule: 'ACE inhibitors',
        expectedSections: 3,
        expectedEnhancements: ['score_breakdown', 'fact_anchors', 'quality_score']
    },
    {
        name: 'Enhanced Generate Review - Oncology',
        objective: 'Investigate novel cancer immunotherapy approaches',
        molecule: 'PD-1 inhibitors',
        expectedSections: 3,
        expectedEnhancements: ['relevance_score', 'methodology_analysis', 'clinical_relevance']
    },
    {
        name: 'Enhanced Deep Dive Analysis',
        pmid: '35000000', // Example PMID
        title: 'Novel therapeutic approaches in precision medicine',
        expectedComponents: ['scientific_model_analysis', 'experimental_methods_analysis', 'results_interpretation_analysis']
    }
];

class PhDContentValidator {
    constructor() {
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            details: []
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '📋';
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    async testEnhancedGenerateReview(testCase) {
        this.log(`🚀 Testing Enhanced Generate Review: ${testCase.name}`);
        
        try {
            const requestBody = {
                objective: testCase.objective,
                molecule: testCase.molecule,
                project_id: 'phd-test-project',
                preference: 'recall' // Use recall for more comprehensive results
            };

            this.log(`📤 Sending request: ${JSON.stringify(requestBody, null, 2)}`);

            const response = await fetch(`${TEST_CONFIG.BACKEND_URL}/generate-review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': 'phd-test-user'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.log(`📥 Response received: ${JSON.stringify(data, null, 2).substring(0, 500)}...`);

            // Validate PhD enhancements
            const validationResults = this.validateGenerateReviewEnhancements(data, testCase);
            
            if (validationResults.passed) {
                this.log(`✅ ${testCase.name} - PASSED`, 'success');
                this.results.passed++;
            } else {
                this.log(`❌ ${testCase.name} - FAILED: ${validationResults.errors.join(', ')}`, 'error');
                this.results.failed++;
            }

            this.results.details.push({
                test: testCase.name,
                passed: validationResults.passed,
                errors: validationResults.errors,
                enhancements_found: validationResults.enhancements_found,
                response_sample: {
                    sections: data.results?.length || 0,
                    has_enhancement_metadata: !!data.enhancement_metadata,
                    phd_level_analysis: !!data.phd_level_analysis
                }
            });

        } catch (error) {
            this.log(`❌ ${testCase.name} - ERROR: ${error.message}`, 'error');
            this.results.failed++;
            this.results.details.push({
                test: testCase.name,
                passed: false,
                errors: [error.message],
                enhancements_found: []
            });
        }

        this.results.total++;
    }

    validateGenerateReviewEnhancements(data, testCase) {
        const errors = [];
        const enhancements_found = [];

        // Check basic structure
        if (!data.results || !Array.isArray(data.results)) {
            errors.push('Missing or invalid results array');
            return { passed: false, errors, enhancements_found };
        }

        // Check for PhD enhancement metadata
        if (data.enhancement_metadata) {
            enhancements_found.push('enhancement_metadata');
            if (data.enhancement_metadata.phd_level_analysis) {
                enhancements_found.push('phd_level_analysis');
            }
        }

        // Check articles in sections for enhancements
        let articlesWithEnhancements = 0;
        let totalArticles = 0;

        for (const section of data.results) {
            if (section.articles && Array.isArray(section.articles)) {
                for (const article of section.articles) {
                    totalArticles++;
                    
                    // Check for enhanced scoring
                    if (article.score_breakdown) {
                        enhancements_found.push('score_breakdown');
                        articlesWithEnhancements++;
                    }
                    
                    // Check for fact anchors
                    if (article.fact_anchors && Array.isArray(article.fact_anchors)) {
                        enhancements_found.push('fact_anchors');
                    }
                    
                    // Check for quality metrics
                    if (article.quality_score !== undefined) {
                        enhancements_found.push('quality_score');
                    }
                    
                    // Check for relevance score
                    if (article.relevance_score !== undefined) {
                        enhancements_found.push('relevance_score');
                    }
                    
                    // Check for methodology analysis
                    if (article.methodology_analysis) {
                        enhancements_found.push('methodology_analysis');
                    }
                }
            }
        }

        // Validation criteria
        if (data.results.length < testCase.expectedSections) {
            errors.push(`Expected at least ${testCase.expectedSections} sections, got ${data.results.length}`);
        }

        // Check if expected enhancements are present
        for (const expectedEnhancement of testCase.expectedEnhancements) {
            if (!enhancements_found.includes(expectedEnhancement)) {
                errors.push(`Missing expected enhancement: ${expectedEnhancement}`);
            }
        }

        // Check if at least some articles have enhancements
        if (totalArticles > 0 && articlesWithEnhancements === 0) {
            errors.push('No articles found with PhD-level enhancements');
        }

        return {
            passed: errors.length === 0,
            errors,
            enhancements_found: [...new Set(enhancements_found)] // Remove duplicates
        };
    }

    async testEnhancedDeepDive(testCase) {
        this.log(`🔬 Testing Enhanced Deep Dive Analysis: ${testCase.name}`);
        
        try {
            const requestBody = {
                pmid: testCase.pmid,
                article_title: testCase.title,
                objective: 'PhD-level comprehensive analysis'
            };

            this.log(`📤 Sending Deep Dive request: ${JSON.stringify(requestBody, null, 2)}`);

            const response = await fetch(`${TEST_CONFIG.BACKEND_URL}/deep-dive-analysis`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': 'phd-test-user'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.log(`📥 Deep Dive response received: ${JSON.stringify(data, null, 2).substring(0, 500)}...`);

            // Validate PhD enhancements
            const validationResults = this.validateDeepDiveEnhancements(data, testCase);
            
            if (validationResults.passed) {
                this.log(`✅ ${testCase.name} - PASSED`, 'success');
                this.results.passed++;
            } else {
                this.log(`❌ ${testCase.name} - FAILED: ${validationResults.errors.join(', ')}`, 'error');
                this.results.failed++;
            }

            this.results.details.push({
                test: testCase.name,
                passed: validationResults.passed,
                errors: validationResults.errors,
                enhancements_found: validationResults.enhancements_found,
                response_sample: {
                    has_scientific_model: !!data.scientific_model_analysis,
                    has_experimental_methods: !!data.experimental_methods_analysis,
                    has_results_interpretation: !!data.results_interpretation_analysis,
                    has_enhancement_metadata: !!data.enhancement_metadata
                }
            });

        } catch (error) {
            this.log(`❌ ${testCase.name} - ERROR: ${error.message}`, 'error');
            this.results.failed++;
            this.results.details.push({
                test: testCase.name,
                passed: false,
                errors: [error.message],
                enhancements_found: []
            });
        }

        this.results.total++;
    }

    validateDeepDiveEnhancements(data, testCase) {
        const errors = [];
        const enhancements_found = [];

        // Check for expected components
        for (const component of testCase.expectedComponents) {
            if (data[component]) {
                enhancements_found.push(component);
            } else {
                errors.push(`Missing expected component: ${component}`);
            }
        }

        // Check for PhD enhancement metadata
        if (data.enhancement_metadata) {
            enhancements_found.push('enhancement_metadata');
            if (data.enhancement_metadata.phd_level_analysis) {
                enhancements_found.push('phd_level_analysis');
            }
        }

        // Check quality assessment
        if (data.quality_assessment) {
            enhancements_found.push('quality_assessment');
        }

        // Validate scientific model analysis depth
        if (data.scientific_model_analysis) {
            const model = data.scientific_model_analysis;
            if (model.study_design && model.study_design.length > 100) {
                enhancements_found.push('detailed_study_design');
            }
            if (model.fact_anchors && Array.isArray(model.fact_anchors)) {
                enhancements_found.push('scientific_model_fact_anchors');
            }
        }

        return {
            passed: errors.length === 0,
            errors,
            enhancements_found
        };
    }

    async runAllTests() {
        this.log('🚀 STARTING PhD CONTENT ENHANCEMENT VALIDATION');
        this.log('====================================================');

        const startTime = Date.now();

        // Test Enhanced Generate Review
        for (const testCase of TEST_CASES.filter(tc => tc.objective)) {
            await this.testEnhancedGenerateReview(testCase);
        }

        // Test Enhanced Deep Dive
        for (const testCase of TEST_CASES.filter(tc => tc.pmid)) {
            await this.testEnhancedDeepDive(testCase);
        }

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(1);

        this.log('====================================================');
        this.log('🏁 PhD CONTENT ENHANCEMENT VALIDATION COMPLETED');
        this.log(`⏱️ Total Duration: ${duration}s`);
        this.log(`📊 Results: ${this.results.passed}/${this.results.total} tests passed`);
        
        if (this.results.failed > 0) {
            this.log(`❌ Failed Tests: ${this.results.failed}`, 'error');
        }

        // Detailed results
        this.log('\n📋 DETAILED RESULTS:');
        for (const detail of this.results.details) {
            this.log(`\n🔍 ${detail.test}:`);
            this.log(`   Status: ${detail.passed ? '✅ PASSED' : '❌ FAILED'}`);
            if (detail.errors.length > 0) {
                this.log(`   Errors: ${detail.errors.join(', ')}`);
            }
            this.log(`   Enhancements Found: ${detail.enhancements_found.join(', ')}`);
            if (detail.response_sample) {
                this.log(`   Response Sample: ${JSON.stringify(detail.response_sample, null, 2)}`);
            }
        }

        return {
            success: this.results.failed === 0,
            summary: `${this.results.passed}/${this.results.total} tests passed in ${duration}s`,
            duration,
            details: this.results.details
        };
    }
}

// Auto-run the test
(async () => {
    const validator = new PhDContentValidator();
    const results = await validator.runAllTests();
    
    console.log('\n🎯 TEST COMPLETED!');
    console.log(`📊 ${results.summary}`);
    
    if (results.success) {
        console.log('✅ All PhD content enhancements are working correctly!');
    } else {
        console.log('❌ Some PhD content enhancements need attention.');
        console.log('🔍 Check the detailed results above for specific issues.');
    }
    
    return results;
})();
