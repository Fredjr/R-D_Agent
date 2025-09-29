/**
 * SEMANTIC UI COMPONENT VALIDATOR
 * Comprehensive testing for SemanticEnhancedResultsCard and SemanticDeepDiveCard
 */

class SemanticUIComponentValidator {
    constructor() {
        this.results = [];
    }

    log(message, type = 'info', data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, type, message, data };
        this.results.push(logEntry);
        
        const emoji = {
            'info': 'ℹ️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌',
            'test': '🧪'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} [${timestamp}] ${message}`);
        if (data) {
            console.log('Data:', data);
        }
    }

    validateSemanticEnhancedResultsCard() {
        this.log('🎨 VALIDATING SemanticEnhancedResultsCard', 'test');
        
        const selectors = {
            main: '[data-testid="semantic-enhanced-results-card"]',
            contentQualityMetrics: '[data-feature="content-quality-metrics"]',
            expandableAnalysis: '[data-feature="expandable-semantic-analysis"]',
            personalizedInsights: '[data-feature="personalized-insights"]',
            crossDomainConnections: '[data-feature="cross-domain-connections"]',
            qualityVisualization: '[data-quality-metric], .quality-metric, .quality-score',
            expandableSections: '[data-expandable], .expandable-section',
            insightCards: '[data-insight], .insight-card',
            connectionMaps: '[data-connection], .connection-map'
        };

        const validation = {
            componentFound: false,
            features: {},
            interactivity: {},
            visualizations: {},
            accessibility: {}
        };

        const mainElement = document.querySelector(selectors.main);
        validation.componentFound = !!mainElement;

        if (mainElement) {
            this.log('✅ SemanticEnhancedResultsCard found', 'success');
            
            // Test core features
            Object.entries(selectors).forEach(([key, selector]) => {
                if (key !== 'main') {
                    const elements = mainElement.querySelectorAll(selector);
                    validation.features[key] = elements.length;
                    
                    if (elements.length > 0) {
                        this.log(`  ✅ ${key}: ${elements.length} elements found`, 'success');
                    } else {
                        this.log(`  ⚠️ ${key}: No elements found`, 'warning');
                    }
                }
            });

            // Test interactivity
            validation.interactivity = this.testInteractivity(mainElement, 'SemanticEnhancedResultsCard');
            
            // Test visualizations
            validation.visualizations = this.testVisualizations(mainElement, 'SemanticEnhancedResultsCard');
            
            // Test accessibility
            validation.accessibility = this.testAccessibility(mainElement, 'SemanticEnhancedResultsCard');
            
        } else {
            this.log('❌ SemanticEnhancedResultsCard not found in DOM', 'error');
            this.log('💡 Component may need to be triggered by executing semantic generate-review', 'info');
        }

        return validation;
    }

    validateSemanticDeepDiveCard() {
        this.log('🔬 VALIDATING SemanticDeepDiveCard', 'test');
        
        const selectors = {
            main: '[data-testid="semantic-deep-dive-card"]',
            userRelevanceScoring: '[data-feature="user-relevance-scoring"]',
            relatedPapersCategorization: '[data-feature="related-papers-categorization"]',
            aiRecommendations: '[data-feature="ai-powered-recommendations"]',
            personalConnections: '[data-feature="personal-research-connections"]',
            expandableSections: '[data-feature="interactive-expandable-sections"]',
            progressBars: '[data-progress-bar], .progress-bar, [role="progressbar"]',
            categoryTags: '[data-category], .category-tag',
            recommendationCards: '[data-recommendation], .recommendation-card',
            connectionIndicators: '[data-connection], .connection-indicator'
        };

        const validation = {
            componentFound: false,
            features: {},
            interactivity: {},
            visualizations: {},
            accessibility: {}
        };

        const mainElement = document.querySelector(selectors.main);
        validation.componentFound = !!mainElement;

        if (mainElement) {
            this.log('✅ SemanticDeepDiveCard found', 'success');
            
            // Test core features
            Object.entries(selectors).forEach(([key, selector]) => {
                if (key !== 'main') {
                    const elements = mainElement.querySelectorAll(selector);
                    validation.features[key] = elements.length;
                    
                    if (elements.length > 0) {
                        this.log(`  ✅ ${key}: ${elements.length} elements found`, 'success');
                    } else {
                        this.log(`  ⚠️ ${key}: No elements found`, 'warning');
                    }
                }
            });

            // Test interactivity
            validation.interactivity = this.testInteractivity(mainElement, 'SemanticDeepDiveCard');
            
            // Test visualizations
            validation.visualizations = this.testVisualizations(mainElement, 'SemanticDeepDiveCard');
            
            // Test accessibility
            validation.accessibility = this.testAccessibility(mainElement, 'SemanticDeepDiveCard');
            
        } else {
            this.log('❌ SemanticDeepDiveCard not found in DOM', 'error');
            this.log('💡 Component may need to be triggered by executing semantic deep-dive', 'info');
        }

        return validation;
    }

    testInteractivity(element, componentName) {
        this.log(`🖱️ Testing interactivity for ${componentName}`, 'info');
        
        const interactivity = {
            clickableElements: element.querySelectorAll('[onclick], [data-click], button, .clickable').length,
            expandableElements: element.querySelectorAll('[data-expandable], .expandable').length,
            hoverElements: element.querySelectorAll('[data-hover], .hoverable').length,
            formElements: element.querySelectorAll('input, select, textarea').length
        };

        this.log(`  Clickable elements: ${interactivity.clickableElements}`, 'info');
        this.log(`  Expandable elements: ${interactivity.expandableElements}`, 'info');
        this.log(`  Hover elements: ${interactivity.hoverElements}`, 'info');
        this.log(`  Form elements: ${interactivity.formElements}`, 'info');

        return interactivity;
    }

    testVisualizations(element, componentName) {
        this.log(`📊 Testing visualizations for ${componentName}`, 'info');
        
        const visualizations = {
            progressBars: element.querySelectorAll('[role="progressbar"], .progress-bar').length,
            charts: element.querySelectorAll('svg, canvas, .chart').length,
            badges: element.querySelectorAll('.badge, .tag, .label').length,
            icons: element.querySelectorAll('svg, .icon, [data-icon]').length,
            colorCoding: element.querySelectorAll('[data-color], .color-coded').length
        };

        this.log(`  Progress bars: ${visualizations.progressBars}`, 'info');
        this.log(`  Charts/Graphics: ${visualizations.charts}`, 'info');
        this.log(`  Badges/Tags: ${visualizations.badges}`, 'info');
        this.log(`  Icons: ${visualizations.icons}`, 'info');
        this.log(`  Color coding: ${visualizations.colorCoding}`, 'info');

        return visualizations;
    }

    testAccessibility(element, componentName) {
        this.log(`♿ Testing accessibility for ${componentName}`, 'info');
        
        const accessibility = {
            ariaLabels: element.querySelectorAll('[aria-label]').length,
            ariaDescriptions: element.querySelectorAll('[aria-describedby]').length,
            roles: element.querySelectorAll('[role]').length,
            tabIndex: element.querySelectorAll('[tabindex]').length,
            altTexts: element.querySelectorAll('img[alt]').length
        };

        this.log(`  ARIA labels: ${accessibility.ariaLabels}`, 'info');
        this.log(`  ARIA descriptions: ${accessibility.ariaDescriptions}`, 'info');
        this.log(`  Roles: ${accessibility.roles}`, 'info');
        this.log(`  Tab indices: ${accessibility.tabIndex}`, 'info');
        this.log(`  Alt texts: ${accessibility.altTexts}`, 'info');

        return accessibility;
    }

    validateConsistentProcessing() {
        this.log('🔄 VALIDATING CONSISTENT PROCESSING INDICATORS', 'test');
        
        const processingIndicators = {
            extractionSettings: document.querySelectorAll('[data-extraction-settings]').length,
            qualityThresholds: document.querySelectorAll('[data-quality-threshold]').length,
            fallbackMechanisms: document.querySelectorAll('[data-fallback]').length,
            methodologyExtraction: document.querySelectorAll('[data-methodology]').length,
            statisticalAnalysis: document.querySelectorAll('[data-statistics]').length
        };

        this.log('Processing indicators found:', 'info', processingIndicators);
        
        return processingIndicators;
    }

    async runComprehensiveValidation() {
        this.log('🚀 STARTING COMPREHENSIVE SEMANTIC UI VALIDATION', 'test');
        
        const results = {
            semanticEnhancedResultsCard: null,
            semanticDeepDiveCard: null,
            consistentProcessing: null,
            overallScore: 0
        };

        // Validate SemanticEnhancedResultsCard
        results.semanticEnhancedResultsCard = this.validateSemanticEnhancedResultsCard();
        
        // Validate SemanticDeepDiveCard
        results.semanticDeepDiveCard = this.validateSemanticDeepDiveCard();
        
        // Validate consistent processing
        results.consistentProcessing = this.validateConsistentProcessing();

        // Calculate overall score
        let score = 0;
        if (results.semanticEnhancedResultsCard.componentFound) score += 50;
        if (results.semanticDeepDiveCard.componentFound) score += 50;
        
        results.overallScore = score;

        // Summary
        this.log('📊 SEMANTIC UI VALIDATION SUMMARY', 'test');
        this.log(`SemanticEnhancedResultsCard: ${results.semanticEnhancedResultsCard.componentFound ? '✅ Found' : '❌ Not Found'}`, 'info');
        this.log(`SemanticDeepDiveCard: ${results.semanticDeepDiveCard.componentFound ? '✅ Found' : '❌ Not Found'}`, 'info');
        this.log(`Overall Score: ${results.overallScore}/100`, 'info');

        // Store results globally
        window.semanticUIValidationResults = {
            results,
            detailedLogs: this.results,
            timestamp: new Date().toISOString()
        };
        
        this.log('Results stored in window.semanticUIValidationResults', 'info');
        
        return results;
    }
}

// Auto-execute when script is loaded
(async () => {
    const validator = new SemanticUIComponentValidator();
    await validator.runComprehensiveValidation();
})();
