/**
 * UI COMPONENT INVESTIGATION SCRIPT
 * Investigate and trigger semantic UI components
 */

class UIComponentInvestigator {
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
            'search': '🔍',
            'trigger': '🎯'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} [${timestamp}] ${message}`);
        if (data) {
            console.log('Data:', data);
        }
    }

    scanCurrentPage() {
        this.log('🔍 SCANNING CURRENT PAGE FOR SEMANTIC COMPONENTS', 'search');
        
        const pageInfo = {
            url: window.location.href,
            pathname: window.location.pathname,
            title: document.title,
            hasReactRoot: !!document.querySelector('#__next, [data-reactroot]'),
            totalElements: document.querySelectorAll('*').length
        };

        this.log('📄 Current Page Info:', 'info', pageInfo);

        // Look for any semantic-related elements
        const semanticSelectors = [
            '[data-semantic]',
            '[class*="semantic"]',
            '[id*="semantic"]',
            '[data-testid*="semantic"]',
            '.semantic-enhanced',
            '.semantic-analysis',
            '.semantic-card',
            '[data-component*="semantic"]'
        ];

        const foundElements = {};
        semanticSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                foundElements[selector] = elements.length;
                this.log(`Found ${elements.length} elements for: ${selector}`, 'success');
            }
        });

        if (Object.keys(foundElements).length === 0) {
            this.log('⚠️ No semantic-related elements found on current page', 'warning');
        }

        return { pageInfo, foundElements };
    }

    findSemanticTriggers() {
        this.log('🎯 LOOKING FOR SEMANTIC ANALYSIS TRIGGERS', 'trigger');
        
        const triggerSelectors = [
            'button[data-action*="semantic"]',
            'button[data-action*="generate-review"]',
            'button[data-action*="deep-dive"]',
            '[data-testid*="generate-review"]',
            '[data-testid*="deep-dive"]',
            'button:contains("Generate Review")',
            'button:contains("Deep Dive")',
            'button:contains("Semantic")',
            '[onclick*="semantic"]',
            '[onclick*="generate"]',
            '[onclick*="deep-dive"]'
        ];

        const triggers = {};
        triggerSelectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    triggers[selector] = Array.from(elements).map(el => ({
                        text: el.textContent?.trim() || '',
                        id: el.id || '',
                        className: el.className || '',
                        disabled: el.disabled || false
                    }));
                }
            } catch (e) {
                // Skip selectors that cause errors (like :contains which isn't supported)
            }
        });

        // Also look for buttons with semantic-related text
        const allButtons = document.querySelectorAll('button');
        const semanticButtons = Array.from(allButtons).filter(btn => {
            const text = btn.textContent?.toLowerCase() || '';
            return text.includes('generate') || text.includes('review') || 
                   text.includes('deep') || text.includes('dive') || 
                   text.includes('semantic') || text.includes('analyze');
        });

        if (semanticButtons.length > 0) {
            triggers['semantic-text-buttons'] = semanticButtons.map(btn => ({
                text: btn.textContent?.trim() || '',
                id: btn.id || '',
                className: btn.className || '',
                disabled: btn.disabled || false
            }));
        }

        this.log('🎯 Found potential triggers:', 'info', triggers);
        return triggers;
    }

    checkForSemanticPages() {
        this.log('🌐 CHECKING FOR SEMANTIC-RELATED PAGES', 'search');
        
        const currentPath = window.location.pathname;
        const semanticPaths = [
            '/dashboard',
            '/project',
            '/generate-review',
            '/deep-dive',
            '/semantic',
            '/analysis'
        ];

        const relevantPaths = semanticPaths.filter(path => 
            currentPath.includes(path) || currentPath.startsWith(path)
        );

        if (relevantPaths.length > 0) {
            this.log('✅ Current page appears to be semantic-related', 'success', {
                currentPath,
                matchingPaths: relevantPaths
            });
        } else {
            this.log('⚠️ Current page may not be optimal for semantic testing', 'warning', {
                currentPath,
                suggestedPaths: semanticPaths
            });
        }

        return { currentPath, relevantPaths, semanticPaths };
    }

    async simulateSemanticTrigger() {
        this.log('🎯 ATTEMPTING TO SIMULATE SEMANTIC ANALYSIS TRIGGER', 'trigger');
        
        // Look for generate-review or deep-dive buttons
        const generateButtons = document.querySelectorAll('button');
        const semanticButton = Array.from(generateButtons).find(btn => {
            const text = btn.textContent?.toLowerCase() || '';
            return (text.includes('generate') && text.includes('review')) ||
                   (text.includes('deep') && text.includes('dive')) ||
                   text.includes('semantic');
        });

        if (semanticButton) {
            this.log('🎯 Found potential semantic trigger button', 'success', {
                text: semanticButton.textContent?.trim(),
                disabled: semanticButton.disabled,
                className: semanticButton.className
            });

            if (!semanticButton.disabled) {
                this.log('🎯 Attempting to click semantic trigger...', 'trigger');
                try {
                    semanticButton.click();
                    this.log('✅ Clicked semantic trigger button', 'success');
                    
                    // Wait a moment for potential UI updates
                    setTimeout(() => {
                        this.recheckForComponents();
                    }, 2000);
                    
                    return true;
                } catch (error) {
                    this.log('❌ Failed to click semantic trigger', 'error', error.message);
                }
            } else {
                this.log('⚠️ Semantic trigger button is disabled', 'warning');
            }
        } else {
            this.log('⚠️ No semantic trigger buttons found', 'warning');
        }

        return false;
    }

    recheckForComponents() {
        this.log('🔄 RECHECKING FOR SEMANTIC COMPONENTS AFTER TRIGGER', 'search');
        
        const componentSelectors = [
            '[data-testid="semantic-enhanced-results-card"]',
            '[data-testid="semantic-deep-dive-card"]',
            '[data-semantic]',
            '.semantic-enhanced',
            '.semantic-analysis',
            '[data-component*="semantic"]'
        ];

        const foundComponents = {};
        componentSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                foundComponents[selector] = {
                    count: elements.length,
                    elements: Array.from(elements).map(el => ({
                        id: el.id || '',
                        className: el.className || '',
                        visible: el.offsetParent !== null,
                        textContent: el.textContent?.substring(0, 100) || ''
                    }))
                };
            }
        });

        if (Object.keys(foundComponents).length > 0) {
            this.log('✅ Found semantic components after trigger!', 'success', foundComponents);
        } else {
            this.log('⚠️ Still no semantic components found', 'warning');
        }

        return foundComponents;
    }

    provideNavigationSuggestions() {
        this.log('🧭 PROVIDING NAVIGATION SUGGESTIONS FOR SEMANTIC TESTING', 'info');
        
        const suggestions = [
            {
                page: 'Project Dashboard',
                url: '/project/[projectId]',
                reason: 'Project pages often have generate-review and deep-dive buttons',
                action: 'Navigate to a project and look for analysis buttons'
            },
            {
                page: 'Main Dashboard',
                url: '/dashboard',
                reason: 'Dashboard may have semantic analysis features',
                action: 'Check dashboard for semantic analysis options'
            },
            {
                page: 'Generate Review Page',
                url: '/generate-review',
                reason: 'Direct access to semantic generate-review functionality',
                action: 'Use the generate-review form to trigger semantic analysis'
            },
            {
                page: 'Collection View',
                url: '/collections/[collectionId]',
                reason: 'Collections may have bulk semantic analysis features',
                action: 'Navigate to a collection and look for analysis options'
            }
        ];

        this.log('🧭 Suggested pages for semantic testing:', 'info', suggestions);
        
        // Check if we can detect the current app structure
        const links = Array.from(document.querySelectorAll('a[href]')).map(a => a.href);
        const relevantLinks = links.filter(href => 
            href.includes('project') || href.includes('dashboard') || 
            href.includes('generate') || href.includes('collection')
        );

        if (relevantLinks.length > 0) {
            this.log('🔗 Found relevant links on current page:', 'info', relevantLinks.slice(0, 10));
        }

        return { suggestions, relevantLinks };
    }

    async runInvestigation() {
        this.log('🚀 STARTING UI COMPONENT INVESTIGATION', 'search');
        
        // Step 1: Scan current page
        const pageData = this.scanCurrentPage();
        
        // Step 2: Look for semantic triggers
        const triggers = this.findSemanticTriggers();
        
        // Step 3: Check if we're on a semantic-related page
        const pathInfo = this.checkForSemanticPages();
        
        // Step 4: Try to simulate a semantic trigger
        const triggerAttempted = await this.simulateSemanticTrigger();
        
        // Step 5: Provide navigation suggestions
        const suggestions = this.provideNavigationSuggestions();

        // Store results
        window.uiComponentInvestigation = {
            pageData,
            triggers,
            pathInfo,
            triggerAttempted,
            suggestions,
            timestamp: new Date().toISOString(),
            logs: this.results
        };

        this.log('✅ UI Component Investigation complete. Results stored in window.uiComponentInvestigation', 'success');
        
        return window.uiComponentInvestigation;
    }
}

// Auto-execute when script is loaded
(async () => {
    const investigator = new UIComponentInvestigator();
    await investigator.runInvestigation();
})();
