/**
 * COMPREHENSIVE UI COMPONENT TESTER
 * Navigate to optimal pages and test semantic UI components
 */

class ComprehensiveUIComponentTester {
    constructor() {
        this.results = [];
        this.baseUrl = 'https://frontend-psi-seven-85.vercel.app';
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
            'nav': '🧭',
            'ui': '🎨',
            'trigger': '🎯'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} [${timestamp}] ${message}`);
        if (data) {
            console.log('Data:', data);
        }
    }

    async navigateToOptimalPage() {
        this.log('🧭 FINDING OPTIMAL PAGE FOR UI COMPONENT TESTING', 'nav');
        
        // Check current page and find navigation options
        const currentPath = window.location.pathname;
        this.log(`Current page: ${currentPath}`, 'info');

        // Look for project links
        const projectLinks = Array.from(document.querySelectorAll('a[href*="/project/"]')).map(a => ({
            href: a.href,
            text: a.textContent?.trim() || '',
            visible: a.offsetParent !== null
        }));

        // Look for collection links
        const collectionLinks = Array.from(document.querySelectorAll('a[href*="/collection"]')).map(a => ({
            href: a.href,
            text: a.textContent?.trim() || '',
            visible: a.offsetParent !== null
        }));

        // Look for generate-review links
        const generateReviewLinks = Array.from(document.querySelectorAll('a[href*="generate-review"]')).map(a => ({
            href: a.href,
            text: a.textContent?.trim() || '',
            visible: a.offsetParent !== null
        }));

        const navigationOptions = {
            currentPath,
            projectLinks: projectLinks.slice(0, 5),
            collectionLinks: collectionLinks.slice(0, 3),
            generateReviewLinks: generateReviewLinks.slice(0, 3),
            totalOptions: projectLinks.length + collectionLinks.length + generateReviewLinks.length
        };

        this.log('🧭 Navigation options found:', 'nav', navigationOptions);

        // Provide navigation instructions
        if (projectLinks.length > 0) {
            this.log('🎯 RECOMMENDED: Navigate to a project page for optimal UI testing', 'trigger', {
                suggestion: 'Click on a project link to access generate-review and deep-dive buttons',
                firstProjectLink: projectLinks[0]?.href,
                reason: 'Project pages typically have semantic analysis buttons that render UI components'
            });
        } else if (generateReviewLinks.length > 0) {
            this.log('🎯 ALTERNATIVE: Navigate to generate-review page', 'trigger', {
                suggestion: 'Use generate-review page for direct semantic testing',
                firstGenerateLink: generateReviewLinks[0]?.href
            });
        } else {
            this.log('⚠️ LIMITED OPTIONS: Consider manual navigation', 'warning', {
                suggestions: [
                    'Navigate to /project/[any-project-id]',
                    'Navigate to /generate-review',
                    'Navigate to /collections/[any-collection-id]'
                ]
            });
        }

        return navigationOptions;
    }

    scanForSemanticUIComponents() {
        this.log('🎨 SCANNING FOR SEMANTIC UI COMPONENTS', 'ui');
        
        const componentSelectors = {
            // Primary semantic components
            semanticEnhancedResultsCard: '[data-testid="semantic-enhanced-results-card"]',
            semanticDeepDiveCard: '[data-testid="semantic-deep-dive-card"]',
            
            // Feature-specific selectors
            contentQualityMetrics: '[data-feature="content-quality-metrics"]',
            expandableSemanticAnalysis: '[data-feature="expandable-semantic-analysis"]',
            personalizedInsights: '[data-feature="personalized-insights"]',
            crossDomainConnections: '[data-feature="cross-domain-connections"]',
            userRelevanceScoring: '[data-feature="user-relevance-scoring"]',
            relatedPapersCategorization: '[data-feature="related-papers-categorization"]',
            aiPoweredRecommendations: '[data-feature="ai-powered-recommendations"]',
            personalResearchConnections: '[data-feature="personal-research-connections"]',
            interactiveExpandableSections: '[data-feature="interactive-expandable-sections"]',
            
            // General semantic indicators
            semanticBadges: '[data-semantic], .semantic-badge',
            enhancementIcons: '[data-enhancement], .enhancement-icon',
            crossDomainTags: '[data-cross-domain], .cross-domain-tag',
            relevanceScores: '[data-relevance], .relevance-score',
            conceptMappings: '[data-concept], .concept-mapping',
            progressBars: '[data-progress-bar], .progress-bar, [role="progressbar"]',
            qualityMetrics: '[data-quality-metric], .quality-metric',
            categoryElements: '[data-category], .category-tag'
        };

        const componentScan = {};
        Object.entries(componentSelectors).forEach(([key, selector]) => {
            const elements = document.querySelectorAll(selector);
            componentScan[key] = {
                count: elements.length,
                found: elements.length > 0,
                elements: elements.length > 0 ? Array.from(elements).slice(0, 3).map(el => ({
                    id: el.id || '',
                    className: el.className || '',
                    visible: el.offsetParent !== null,
                    textContent: el.textContent?.substring(0, 50) || ''
                })) : []
            };
        });

        const summary = {
            totalComponentsFound: Object.values(componentScan).reduce((sum, comp) => sum + comp.count, 0),
            primaryComponentsFound: componentScan.semanticEnhancedResultsCard.found || componentScan.semanticDeepDiveCard.found,
            featureComponentsFound: Object.entries(componentScan).filter(([key, comp]) => 
                key.includes('feature') && comp.found
            ).length,
            generalIndicatorsFound: Object.entries(componentScan).filter(([key, comp]) => 
                ['semanticBadges', 'enhancementIcons', 'crossDomainTags', 'relevanceScores', 'conceptMappings'].includes(key) && comp.found
            ).length
        };

        this.log('🎨 UI Component Scan Results:', 'ui', {
            summary,
            primaryComponents: {
                semanticEnhancedResultsCard: componentScan.semanticEnhancedResultsCard.found,
                semanticDeepDiveCard: componentScan.semanticDeepDiveCard.found
            },
            featureComponents: Object.fromEntries(
                Object.entries(componentScan).filter(([key]) => key.includes('feature'))
                .map(([key, comp]) => [key, comp.found])
            )
        });

        return { componentScan, summary };
    }

    async triggerSemanticAnalysis() {
        this.log('🎯 ATTEMPTING TO TRIGGER SEMANTIC ANALYSIS', 'trigger');
        
        // Look for semantic trigger buttons
        const triggerButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
            const text = btn.textContent?.toLowerCase() || '';
            const id = btn.id?.toLowerCase() || '';
            const className = btn.className?.toLowerCase() || '';
            
            return (text.includes('generate') && text.includes('review')) ||
                   (text.includes('deep') && text.includes('dive')) ||
                   text.includes('semantic') ||
                   text.includes('analyze') ||
                   id.includes('semantic') ||
                   className.includes('semantic');
        });

        this.log(`🎯 Found ${triggerButtons.length} potential trigger buttons`, 'info', 
            triggerButtons.map(btn => ({
                text: btn.textContent?.trim(),
                id: btn.id,
                className: btn.className,
                disabled: btn.disabled,
                visible: btn.offsetParent !== null
            }))
        );

        // Try to trigger semantic analysis
        let triggered = false;
        for (const button of triggerButtons) {
            if (!button.disabled && button.offsetParent !== null) {
                try {
                    this.log(`🎯 Attempting to click: ${button.textContent?.trim()}`, 'trigger');
                    button.click();
                    triggered = true;
                    
                    // Wait for potential UI updates
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    
                    // Re-scan for components after trigger
                    const postTriggerScan = this.scanForSemanticUIComponents();
                    this.log('🔄 Post-trigger component scan:', 'ui', postTriggerScan.summary);
                    
                    break;
                } catch (error) {
                    this.log(`❌ Failed to click button: ${error.message}`, 'error');
                }
            }
        }

        if (!triggered) {
            this.log('⚠️ No semantic triggers could be activated', 'warning', {
                suggestion: 'Navigate to a project page or generate-review page for better trigger options'
            });
        }

        return { triggered, triggerButtons: triggerButtons.length };
    }

    async testSemanticEndpointsWithUIContext() {
        this.log('🧪 TESTING SEMANTIC ENDPOINTS WITH UI CONTEXT', 'ui');
        
        // Test generate-review-semantic with UI-focused payload
        const uiTestPayload = {
            molecule: 'CRISPR gene editing in diabetes treatment',
            objective: 'UI component testing with semantic enhancements',
            semantic_expansion: true,
            domain_focus: ['biotechnology', 'medicine', 'genetics'],
            cross_domain_exploration: true,
            user_context: {
                research_domains: ['genetics', 'medicine'],
                recent_searches: ['CRISPR', 'diabetes', 'gene therapy'],
                saved_papers: ['32887946', '38428389'],
                interaction_history: []
            },
            ui_enhancement_request: true,
            include_quality_metrics: true,
            max_results: 5
        };

        try {
            const response = await fetch('/api/proxy/generate-review-semantic', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': 'fredericle77@gmail.com'
                },
                body: JSON.stringify(uiTestPayload)
            });

            if (response.ok) {
                const data = await response.json();
                this.log('✅ Semantic endpoint successful with UI context', 'success', {
                    status: response.status,
                    resultsCount: data.results?.length || 0,
                    hasSemanticAnalysis: !!data.semantic_analysis,
                    hasPersonalization: !!data.personalization,
                    hasContentQuality: !!data.content_quality,
                    responseStructure: Object.keys(data)
                });

                // Wait a moment then re-scan for UI components
                await new Promise(resolve => setTimeout(resolve, 2000));
                const postEndpointScan = this.scanForSemanticUIComponents();
                
                return { success: true, data, postEndpointScan };
            } else {
                this.log('❌ Semantic endpoint failed', 'error', response.status);
                return { success: false, error: response.status };
            }
        } catch (error) {
            this.log('❌ Semantic endpoint error', 'error', error.message);
            return { success: false, error: error.message };
        }
    }

    provideUITestingGuidance() {
        this.log('🧭 PROVIDING UI TESTING GUIDANCE', 'nav');
        
        const guidance = {
            currentPageOptimization: [
                'If on dashboard: Look for project cards to click',
                'If on project page: Look for generate-review/deep-dive buttons',
                'If on generate-review page: Fill form and submit to trigger UI components'
            ],
            navigationSuggestions: [
                {
                    page: 'Project Page',
                    url: '/project/[projectId]',
                    action: 'Click on any project card from dashboard',
                    expectedComponents: ['Generate Review buttons', 'Deep Dive buttons', 'SemanticEnhancedResultsCard after analysis']
                },
                {
                    page: 'Generate Review Page',
                    url: '/generate-review',
                    action: 'Navigate directly or through menu',
                    expectedComponents: ['Semantic form fields', 'SemanticEnhancedResultsCard in results', 'Quality metrics visualization']
                },
                {
                    page: 'Collection Page',
                    url: '/collections/[collectionId]',
                    action: 'Click on collections link',
                    expectedComponents: ['Bulk analysis options', 'SemanticDeepDiveCard for papers', 'Cross-paper semantic connections']
                }
            ],
            componentTriggerMethods: [
                'Execute semantic generate-review from project page',
                'Execute semantic deep-dive on specific papers',
                'Use bulk analysis features in collections',
                'Submit semantic analysis forms'
            ]
        };

        this.log('📋 UI Testing Guidance:', 'nav', guidance);
        return guidance;
    }

    async runComprehensiveUITest() {
        this.log('🚀 STARTING COMPREHENSIVE UI COMPONENT TEST', 'ui');
        
        // Step 1: Find optimal navigation
        const navigationOptions = await this.navigateToOptimalPage();
        
        // Step 2: Scan current page for components
        const initialScan = this.scanForSemanticUIComponents();
        
        // Step 3: Try to trigger semantic analysis
        const triggerResult = await this.triggerSemanticAnalysis();
        
        // Step 4: Test semantic endpoints with UI context
        const endpointTest = await this.testSemanticEndpointsWithUIContext();
        
        // Step 5: Final component scan
        const finalScan = this.scanForSemanticUIComponents();
        
        // Step 6: Provide guidance
        const guidance = this.provideUITestingGuidance();

        // Comprehensive summary
        const testResults = {
            navigationOptions,
            initialScan: initialScan.summary,
            triggerResult,
            endpointTest: endpointTest.success,
            finalScan: finalScan.summary,
            guidance,
            recommendations: [
                finalScan.summary.primaryComponentsFound ? 
                    '✅ Primary semantic components found - test their features' : 
                    '⚠️ Navigate to project page to trigger semantic components',
                triggerResult.triggered ? 
                    '✅ Semantic analysis triggered - check for UI updates' : 
                    '🎯 Look for generate-review/deep-dive buttons on project pages',
                endpointTest.success ? 
                    '✅ Semantic endpoints working - UI should render enhanced components' : 
                    '❌ Check semantic endpoint functionality'
            ]
        };

        // Store results
        window.comprehensiveUITest = {
            testResults,
            navigationOptions,
            initialScan,
            triggerResult,
            endpointTest,
            finalScan,
            guidance,
            timestamp: new Date().toISOString(),
            logs: this.results
        };

        this.log('✅ Comprehensive UI test complete. Results stored in window.comprehensiveUITest', 'success');
        this.log('🎯 NEXT STEPS: Navigate to suggested pages and re-run test for optimal results', 'nav');
        
        return window.comprehensiveUITest;
    }
}

// Auto-execute when script is loaded
(async () => {
    const tester = new ComprehensiveUIComponentTester();
    await tester.runComprehensiveUITest();
})();
