/**
 * SEMANTIC NAVIGATION TESTER
 * Navigate to optimal pages and test semantic functionality
 */

class SemanticNavigationTester {
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
            'test': '🧪'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} [${timestamp}] ${message}`);
        if (data) {
            console.log('Data:', data);
        }
    }

    analyzeCurrentDashboard() {
        this.log('🧭 ANALYZING CURRENT DASHBOARD FOR SEMANTIC OPPORTUNITIES', 'nav');
        
        // Look for project cards or links
        const projectElements = [
            'a[href*="/project/"]',
            '[data-testid*="project"]',
            '.project-card',
            '[class*="project"]'
        ];

        const projects = [];
        projectElements.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                const href = el.href || el.getAttribute('href');
                if (href && href.includes('/project/')) {
                    projects.push({
                        href,
                        text: el.textContent?.trim() || '',
                        selector
                    });
                }
            });
        });

        // Look for collections
        const collectionElements = document.querySelectorAll('a[href*="/collection"]');
        const collections = Array.from(collectionElements).map(el => ({
            href: el.href,
            text: el.textContent?.trim() || ''
        }));

        // Look for generate-review or analysis buttons
        const analysisButtons = Array.from(document.querySelectorAll('button, a')).filter(el => {
            const text = el.textContent?.toLowerCase() || '';
            return text.includes('generate') || text.includes('review') || 
                   text.includes('analyze') || text.includes('semantic');
        });

        const analysis = {
            currentUrl: window.location.href,
            projectsFound: projects.length,
            collectionsFound: collections.length,
            analysisButtonsFound: analysisButtons.length,
            projects: projects.slice(0, 5), // First 5 projects
            collections: collections.slice(0, 3), // First 3 collections
            analysisButtons: analysisButtons.slice(0, 3).map(btn => ({
                text: btn.textContent?.trim(),
                tag: btn.tagName,
                href: btn.href || null,
                disabled: btn.disabled || false
            }))
        };

        this.log('📊 Dashboard Analysis:', 'info', analysis);
        return analysis;
    }

    async testSemanticEndpointsFromDashboard() {
        this.log('🧪 TESTING SEMANTIC ENDPOINTS FROM DASHBOARD', 'test');
        
        // Test generate-review-semantic
        const generateReviewPayload = {
            molecule: 'Machine learning in drug discovery',
            objective: 'Dashboard semantic test',
            semantic_expansion: true,
            max_results: 3
        };

        try {
            this.log('🧠 Testing generate-review-semantic from dashboard...', 'test');
            const response = await fetch('/api/proxy/generate-review-semantic', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': 'fredericle77@gmail.com'
                },
                body: JSON.stringify(generateReviewPayload)
            });

            if (response.ok) {
                const data = await response.json();
                this.log('✅ Generate-review-semantic successful from dashboard', 'success', {
                    status: response.status,
                    resultsCount: data.results?.length || 0,
                    hasSemanticAnalysis: !!data.semantic_analysis,
                    hasPersonalization: !!data.personalization
                });
                return { generateReview: data, success: true };
            } else {
                this.log('❌ Generate-review-semantic failed from dashboard', 'error', response.status);
                return { generateReview: null, success: false };
            }
        } catch (error) {
            this.log('❌ Generate-review-semantic error from dashboard', 'error', error.message);
            return { generateReview: null, success: false };
        }
    }

    async testDeepDiveFromDashboard() {
        this.log('🔬 TESTING DEEP-DIVE-SEMANTIC FROM DASHBOARD', 'test');
        
        const deepDivePayload = {
            pmid: '32887946',
            title: 'Gut microbiota in human metabolic health and disease',
            objective: 'Dashboard deep-dive test',
            semantic_context: true,
            find_related_papers: true
        };

        try {
            const response = await fetch('/api/proxy/deep-dive-semantic', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': 'fredericle77@gmail.com'
                },
                body: JSON.stringify(deepDivePayload)
            });

            if (response.ok) {
                const data = await response.json();
                this.log('✅ Deep-dive-semantic successful from dashboard', 'success', {
                    status: response.status,
                    hasSemanticAnalysis: !!data.semantic_analysis,
                    hasRelatedPapers: !!data.related_papers,
                    hasUserInsights: !!data.user_insights
                });
                return { deepDive: data, success: true };
            } else {
                this.log('❌ Deep-dive-semantic failed from dashboard', 'error', response.status);
                return { deepDive: null, success: false };
            }
        } catch (error) {
            this.log('❌ Deep-dive-semantic error from dashboard', 'error', error.message);
            return { deepDive: null, success: false };
        }
    }

    provideNavigationInstructions() {
        this.log('🧭 PROVIDING NAVIGATION INSTRUCTIONS FOR SEMANTIC TESTING', 'nav');
        
        const instructions = [
            {
                step: 1,
                action: 'Navigate to a Project Page',
                instruction: 'Click on any project card or link to go to /project/[projectId]',
                reason: 'Project pages typically have generate-review and deep-dive buttons for papers',
                expectedFeatures: ['Generate Review buttons', 'Deep Dive buttons', 'Paper analysis options']
            },
            {
                step: 2,
                action: 'Look for Analysis Buttons',
                instruction: 'Once on a project page, look for "Generate Review" or "Deep Dive" buttons',
                reason: 'These buttons trigger semantic analysis and should render semantic UI components',
                expectedFeatures: ['SemanticEnhancedResultsCard', 'SemanticDeepDiveCard', 'Quality metrics']
            },
            {
                step: 3,
                action: 'Test Collections Page',
                instruction: 'Navigate to /collections to test bulk semantic analysis',
                reason: 'Collections may have batch semantic analysis features',
                expectedFeatures: ['Bulk analysis options', 'Collection-wide insights', 'Cross-paper analysis']
            },
            {
                step: 4,
                action: 'Use Direct Generate-Review',
                instruction: 'Navigate to /generate-review for direct semantic testing',
                reason: 'Direct access to semantic generate-review with full UI components',
                expectedFeatures: ['Full semantic form', 'Enhanced results display', 'Personalization options']
            }
        ];

        this.log('📋 Step-by-step navigation instructions:', 'nav', instructions);
        return instructions;
    }

    async checkRecommendationsAPI() {
        this.log('🎵 TESTING WEEKLY RECOMMENDATIONS API', 'test');
        
        try {
            const response = await fetch('/api/proxy/recommendations/weekly/fredericle77@gmail.com');
            if (response.ok) {
                const data = await response.json();
                this.log('✅ Weekly recommendations API working', 'success', {
                    status: response.status,
                    hasRecommendations: !!data.recommendations,
                    sections: Object.keys(data.recommendations || {}),
                    totalPapers: Object.values(data.recommendations || {}).reduce((sum, section) => sum + (section?.length || 0), 0)
                });
                return { recommendations: data, success: true };
            } else {
                this.log('❌ Weekly recommendations API failed', 'error', response.status);
                return { recommendations: null, success: false };
            }
        } catch (error) {
            this.log('❌ Weekly recommendations API error', 'error', error.message);
            return { recommendations: null, success: false };
        }
    }

    async runComprehensiveTest() {
        this.log('🚀 STARTING COMPREHENSIVE SEMANTIC NAVIGATION TEST', 'nav');
        
        // Step 1: Analyze current dashboard
        const dashboardAnalysis = this.analyzeCurrentDashboard();
        
        // Step 2: Test semantic endpoints from dashboard
        const generateReviewTest = await this.testSemanticEndpointsFromDashboard();
        
        // Step 3: Test deep-dive from dashboard
        const deepDiveTest = await this.testDeepDiveFromDashboard();
        
        // Step 4: Test recommendations API
        const recommendationsTest = await this.checkRecommendationsAPI();
        
        // Step 5: Provide navigation instructions
        const navigationInstructions = this.provideNavigationInstructions();

        // Comprehensive summary
        const summary = {
            dashboardAnalysis,
            semanticTests: {
                generateReview: generateReviewTest.success,
                deepDive: deepDiveTest.success,
                recommendations: recommendationsTest.success
            },
            navigationInstructions,
            nextSteps: [
                'Navigate to a project page to test UI components',
                'Look for generate-review/deep-dive buttons on project pages',
                'Test semantic analysis from project context',
                'Validate SemanticEnhancedResultsCard and SemanticDeepDiveCard rendering'
            ]
        };

        this.log('📊 COMPREHENSIVE TEST SUMMARY:', 'nav', summary);

        // Store results
        window.semanticNavigationTest = {
            summary,
            dashboardAnalysis,
            generateReviewTest,
            deepDiveTest,
            recommendationsTest,
            navigationInstructions,
            timestamp: new Date().toISOString(),
            logs: this.results
        };

        this.log('✅ Comprehensive navigation test complete. Results stored in window.semanticNavigationTest', 'success');
        
        return window.semanticNavigationTest;
    }
}

// Auto-execute when script is loaded
(async () => {
    const tester = new SemanticNavigationTester();
    await tester.runComprehensiveTest();
})();
