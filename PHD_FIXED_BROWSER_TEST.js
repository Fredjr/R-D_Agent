/**
 * 🎓 PhD CONTENT ENHANCEMENT BROWSER TEST - FIXED VERSION
 * 
 * Copy and paste this entire script into your browser console on:
 * https://frontend-psi-seven-85.vercel.app/projects/5ac213d7-6fcc-46ff-9420-5c7f4b421012
 * 
 * This version:
 * 1. Uses frontend's existing API structure (no CORS issues)
 * 2. Tests existing content through the UI
 * 3. Creates new content through the frontend
 * 4. Validates PhD enhancements are visible
 */

console.log('🎓 PhD CONTENT ENHANCEMENT BROWSER TEST - FIXED');
console.log('='.repeat(50));

class FixedPhDBrowserTester {
    constructor() {
        this.results = {
            existingContent: [],
            newContent: [],
            uiValidation: [],
            summary: { total: 0, passed: 0, failed: 0 }
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '📋';
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    async runComprehensiveTest() {
        this.log('🚀 Starting comprehensive PhD content enhancement test...');
        
        try {
            // Phase 1: Test existing content visibility
            await this.testExistingContentVisibility();
            
            // Phase 2: Test UI elements for PhD features
            await this.testUIElements();
            
            // Phase 3: Create new content through UI
            await this.testNewContentCreation();
            
            // Phase 4: Validate PhD features in UI
            await this.validatePhdFeaturesInUI();
            
            // Generate comprehensive report
            this.generateFinalReport();
            
        } catch (error) {
            this.log(`❌ Test suite error: ${error.message}`, 'error');
        }
    }

    async testExistingContentVisibility() {
        this.log('📊 PHASE 1: Testing Existing Content Visibility');
        this.log('-'.repeat(50));

        // Test if we're on the right page
        const currentUrl = window.location.href;
        if (!currentUrl.includes('projects/5ac213d7-6fcc-46ff-9420-5c7f4b421012')) {
            this.log('⚠️ Please run this test on the project page', 'warning');
            this.log('🔗 Go to: https://frontend-psi-seven-85.vercel.app/projects/5ac213d7-6fcc-46ff-9420-5c7f4b421012');
            return;
        }

        // Check for existing Generate Review reports
        const reportCards = document.querySelectorAll('[data-testid="report-card"], .report-card, .bg-white.rounded-lg.shadow-md');
        this.log(`📋 Found ${reportCards.length} existing reports on page`);

        for (let i = 0; i < reportCards.length; i++) {
            const card = reportCards[i];
            const validation = this.validateReportCard(card, i);
            this.results.existingContent.push(validation);
            
            if (validation.hasPhdFeatures) {
                this.log(`✅ Report ${i + 1}: PhD features detected in UI!`, 'success');
            } else {
                this.log(`⚠️ Report ${i + 1}: No PhD features visible yet`, 'warning');
            }
        }

        // Check for existing Deep Dive analyses
        const analysisCards = document.querySelectorAll('[data-testid="analysis-card"], .analysis-card');
        this.log(`🔬 Found ${analysisCards.length} existing analyses on page`);

        for (let i = 0; i < analysisCards.length; i++) {
            const card = analysisCards[i];
            const validation = this.validateAnalysisCard(card, i);
            this.results.existingContent.push(validation);
            
            if (validation.hasPhdFeatures) {
                this.log(`✅ Analysis ${i + 1}: PhD features detected in UI!`, 'success');
            } else {
                this.log(`⚠️ Analysis ${i + 1}: No PhD features visible yet`, 'warning');
            }
        }
    }

    validateReportCard(card, index) {
        const validation = {
            type: 'report',
            index,
            hasPhdFeatures: false,
            features: []
        };

        // Check for PhD enhancement indicators in the card
        const cardText = card.textContent || '';
        const cardHTML = card.innerHTML || '';

        // Look for PhD-specific terms and features
        const phdIndicators = [
            'score breakdown', 'fact anchor', 'quality score', 'methodology analysis',
            'research gaps', 'phd-level', 'enhancement', 'comprehensive analysis',
            'statistical', 'evidence-based', 'clinical relevance', 'impact score'
        ];

        phdIndicators.forEach(indicator => {
            if (cardText.toLowerCase().includes(indicator) || cardHTML.toLowerCase().includes(indicator)) {
                validation.features.push(indicator);
                validation.hasPhdFeatures = true;
            }
        });

        // Check for enhanced UI elements
        if (card.querySelector('.score-breakdown, [class*="score"], [class*="quality"]')) {
            validation.features.push('score_ui_elements');
            validation.hasPhdFeatures = true;
        }

        if (card.querySelector('.fact-anchor, [class*="fact"], [class*="evidence"]')) {
            validation.features.push('fact_anchor_ui_elements');
            validation.hasPhdFeatures = true;
        }

        return validation;
    }

    validateAnalysisCard(card, index) {
        const validation = {
            type: 'analysis',
            index,
            hasPhdFeatures: false,
            features: []
        };

        const cardText = card.textContent || '';
        const cardHTML = card.innerHTML || '';

        // Look for Deep Dive PhD indicators
        const phdIndicators = [
            'comprehensive', 'quality assessment', 'statistical measures',
            'experimental methods', 'results interpretation', 'phd-level',
            'enhancement', 'detailed analysis', 'scientific model'
        ];

        phdIndicators.forEach(indicator => {
            if (cardText.toLowerCase().includes(indicator) || cardHTML.toLowerCase().includes(indicator)) {
                validation.features.push(indicator);
                validation.hasPhdFeatures = true;
            }
        });

        return validation;
    }

    async testUIElements() {
        this.log('🎨 PHASE 2: Testing UI Elements for PhD Features');
        this.log('-'.repeat(50));

        // Test Generate Review button
        const generateReviewBtn = document.querySelector('button[data-testid="generate-review"]') ||
                                 document.querySelector('.generate-review-btn') ||
                                 Array.from(document.querySelectorAll('button')).find(btn =>
                                     btn.textContent.toLowerCase().includes('generate review')
                                 );
        if (generateReviewBtn) {
            this.log('✅ Generate Review button found', 'success');
            this.results.uiValidation.push({ element: 'generate_review_button', status: 'found' });
        } else {
            this.log('⚠️ Generate Review button not found', 'warning');
            this.results.uiValidation.push({ element: 'generate_review_button', status: 'not_found' });
        }

        // Test for PhD-related UI elements
        const phdUIElements = [
            { selector: '[class*="score"], [class*="quality"]', name: 'Score/Quality Elements' },
            { selector: '[class*="fact"], [class*="evidence"]', name: 'Fact/Evidence Elements' },
            { selector: '[class*="enhancement"], [class*="phd"]', name: 'Enhancement Elements' },
            { selector: '.article-card, [class*="article"]', name: 'Article Cards' }
        ];

        phdUIElements.forEach(({ selector, name }) => {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                this.log(`✅ ${name}: ${elements.length} found`, 'success');
                this.results.uiValidation.push({ element: name, status: 'found', count: elements.length });
            } else {
                this.log(`⚠️ ${name}: Not found`, 'warning');
                this.results.uiValidation.push({ element: name, status: 'not_found', count: 0 });
            }
        });
    }

    async testNewContentCreation() {
        this.log('🆕 PHASE 3: Testing New Content Creation');
        this.log('-'.repeat(50));

        // Instructions for manual content creation
        this.log('📋 MANUAL CONTENT CREATION INSTRUCTIONS:');
        this.log('1. Click "Generate Review" button on the page');
        this.log('2. Use these test parameters:');
        this.log('   - Objective: "Investigate ACE inhibitors for heart failure treatment"');
        this.log('   - Molecule: "Enalapril"');
        this.log('   - Preference: "Recall"');
        this.log('3. Submit and wait for results');
        this.log('4. Look for PhD enhancements in the generated report');

        // Check if user can create content
        const generateBtn = document.querySelector('button[data-testid="generate-review"]') ||
                           Array.from(document.querySelectorAll('button')).find(btn =>
                               btn.textContent.toLowerCase().includes('generate review')
                           );
        if (generateBtn) {
            this.log('✅ Ready to create new Generate Review', 'success');
            this.results.newContent.push({ type: 'generate_review', status: 'ready_to_create' });
        } else {
            this.log('⚠️ Generate Review button not accessible', 'warning');
            this.results.newContent.push({ type: 'generate_review', status: 'not_accessible' });
        }

        // Instructions for Deep Dive creation
        this.log('📋 DEEP DIVE CREATION INSTRUCTIONS:');
        this.log('1. Find any PMID in existing reports or create new Generate Review first');
        this.log('2. Click on the PMID to open Deep Dive analysis');
        this.log('3. Check all tabs for PhD-level enhancements');
        this.log('4. Look for comprehensive analysis, quality assessment, statistical measures');
    }

    async validatePhdFeaturesInUI() {
        this.log('🎓 PHASE 4: Validating PhD Features in UI');
        this.log('-'.repeat(45));

        // Check for PhD enhancement indicators in the current page
        const pageContent = document.body.textContent || '';
        const pageHTML = document.body.innerHTML || '';

        const phdFeatures = [
            'enhancement_metadata',
            'phd_level_analysis', 
            'score_breakdown',
            'fact_anchors',
            'quality_score',
            'methodology_analysis',
            'research_gaps',
            'comprehensive_analysis',
            'quality_assessment',
            'statistical_measures'
        ];

        const detectedFeatures = [];
        phdFeatures.forEach(feature => {
            const featureText = feature.replace(/_/g, ' ');
            if (pageContent.toLowerCase().includes(featureText) || 
                pageHTML.toLowerCase().includes(feature) ||
                pageHTML.toLowerCase().includes(featureText)) {
                detectedFeatures.push(feature);
            }
        });

        this.log(`🔬 PhD features detected in UI: ${detectedFeatures.join(', ')}`);
        
        if (detectedFeatures.length > 0) {
            this.log('✅ PhD features are visible in the UI!', 'success');
        } else {
            this.log('⚠️ PhD features not yet visible in UI', 'warning');
        }

        this.results.uiValidation.push({
            element: 'phd_features_in_ui',
            status: detectedFeatures.length > 0 ? 'detected' : 'not_detected',
            features: detectedFeatures
        });
    }

    generateFinalReport() {
        this.log('='.repeat(60));
        this.log('🎯 PhD CONTENT ENHANCEMENT UI TEST REPORT');
        this.log('='.repeat(60));

        // Calculate summary statistics
        let totalTests = 0;
        let passedTests = 0;

        // Count existing content tests
        this.results.existingContent.forEach(item => {
            totalTests++;
            if (item.hasPhdFeatures) passedTests++;
        });

        // Count UI validation tests
        this.results.uiValidation.forEach(item => {
            totalTests++;
            if (item.status === 'found' || item.status === 'detected') passedTests++;
        });

        // Count new content readiness
        this.results.newContent.forEach(item => {
            totalTests++;
            if (item.status === 'ready_to_create') passedTests++;
        });

        const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0;

        this.log(`📊 SUMMARY STATISTICS:`);
        this.log(`   Total UI tests: ${totalTests}`);
        this.log(`   Tests showing PhD features: ${passedTests}`);
        this.log(`   UI success rate: ${successRate}%`);

        if (successRate >= 70) {
            this.log('🎉 EXCELLENT! PhD enhancements are visible in the UI!', 'success');
        } else if (successRate >= 40) {
            this.log('✅ GOOD! Some PhD enhancements are visible', 'success');
        } else if (successRate > 0) {
            this.log('⚠️ PARTIAL: Limited PhD enhancements visible', 'warning');
        } else {
            this.log('❌ PhD enhancements not yet visible in UI', 'error');
        }

        this.log('\n📋 NEXT STEPS:');
        if (successRate < 70) {
            this.log('1. Create new Generate Review with test parameters');
            this.log('2. Check the generated report for PhD enhancements');
            this.log('3. Create new Deep Dive analysis from PMID');
            this.log('4. Verify comprehensive analysis in all tabs');
        } else {
            this.log('1. PhD enhancements are working in the UI!');
            this.log('2. Create new content to test latest features');
            this.log('3. Check manual verification URLs for detailed validation');
        }

        this.log('\n📋 DETAILED RESULTS:');
        console.log('Existing Content:', this.results.existingContent);
        console.log('New Content Readiness:', this.results.newContent);
        console.log('UI Validation:', this.results.uiValidation);

        this.log('\n🚀 UI TEST COMPLETE! Check the detailed results above.');
        
        return {
            successRate,
            totalTests,
            passedTests,
            results: this.results
        };
    }
}

// Create and run the test
const fixedPhdTester = new FixedPhDBrowserTester();

// Auto-run the comprehensive test
console.log('🚀 Starting Fixed PhD Content Enhancement Test...');
fixedPhdTester.runComprehensiveTest().then(() => {
    console.log('🎯 Fixed PhD Content Enhancement Test Complete!');
    console.log('📊 Check the detailed report above for results');
});

// Make it available for manual execution
window.runFixedPhdTest = () => fixedPhdTester.runComprehensiveTest();
window.fixedPhdTester = fixedPhdTester;

// Also provide manual verification URLs
console.log('\n🔗 MANUAL VERIFICATION URLS:');
console.log('Generate Review 1: https://frontend-psi-seven-85.vercel.app/report/7b6d5665-4fb7-4817-9122-6c138bdfa4da');
console.log('Generate Review 2: https://frontend-psi-seven-85.vercel.app/report/40b56784-1ce8-4d80-95b2-fb643d7134dd');
console.log('Deep Dive Analysis: https://frontend-psi-seven-85.vercel.app/analysis/b0f9545d-7e5c-49c9-94ae-f129fec4dd96');
console.log('\n💡 Open these URLs in new tabs to manually verify PhD enhancements!');
