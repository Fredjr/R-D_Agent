/**
 * Enhanced PhD System Browser Test - REDEPLOYED FOR COMPREHENSIVE TESTING
 * Tests all PhD enhancement features with improved backend data
 * Updated for comprehensive endpoint testing including Deep Dive and Generate Review
 */

class EnhancedPhDSystemTest {
    constructor() {
        this.results = {
            successes: 0,
            warnings: 0,
            errors: 0,
            details: []
        };
    }

    log(level, message) {
        const timestamp = new Date().toISOString();
        const emoji = level === 'success' ? '✅' : level === 'warning' ? '⚠️' : level === 'error' ? '❌' : 'ℹ️';
        console.log(`${emoji} [${timestamp}] ${message}`);
        
        this.results[level === 'success' ? 'successes' : level === 'warning' ? 'warnings' : 'errors']++;
        this.results.details.push({ level, message, timestamp });
    }

    async runAllTests() {
        this.log('info', '🚀 Starting Enhanced PhD System Tests');
        this.log('info', '🎯 Testing improved backend data quality and UI components');

        // Test 1: PhD Progress Dashboard with Enhanced Data
        await this.testEnhancedProgressDashboard();

        // Test 2: Enhanced Thesis Chapter Generation
        await this.testEnhancedThesisGeneration();

        // Test 3: Improved Gap Analysis
        await this.testImprovedGapAnalysis();

        // Test 4: Enhanced Methodology Synthesis
        await this.testEnhancedMethodologySynthesis();

        // Test 5: UI Component Loading States
        await this.testUILoadingStates();

        // Test 6: Error Handling
        await this.testErrorHandling();

        // Test 7: Data Integration
        await this.testDataIntegration();

        this.printSummary();
    }

    async testEnhancedProgressDashboard() {
        this.log('info', '📊 Testing Enhanced PhD Progress Dashboard');
        
        try {
            // Check if dashboard shows real research themes
            const dashboard = document.querySelector('[data-testid="phd-progress-dashboard"]') || 
                            document.querySelector('.phd-progress-dashboard') ||
                            document.querySelector('div[class*="gradient"]');
            
            if (dashboard) {
                this.log('success', 'PhD Progress Dashboard component found');
                
                // Check for research themes display
                const themeElements = dashboard.querySelectorAll('[class*="theme"], [class*="framework"]');
                if (themeElements.length > 0) {
                    this.log('success', `Research themes displayed: ${themeElements.length} elements found`);
                } else {
                    this.log('warning', 'Research themes not visually displayed (may be in data only)');
                }
                
                // Check for progress metrics
                const progressElements = dashboard.querySelectorAll('[class*="progress"], .text-2xl');
                if (progressElements.length >= 3) {
                    this.log('success', `Progress metrics displayed: ${progressElements.length} metrics found`);
                } else {
                    this.log('warning', 'Limited progress metrics displayed');
                }
            } else {
                this.log('warning', 'PhD Progress Dashboard not found on current page');
            }
        } catch (error) {
            this.log('error', `PhD Progress Dashboard test failed: ${error.message}`);
        }
    }

    async testEnhancedThesisGeneration() {
        this.log('info', '📖 Testing Enhanced Thesis Chapter Generation');
        
        try {
            // Look for thesis chapter button
            const thesisButton = Array.from(document.querySelectorAll('button')).find(btn => 
                btn.textContent.includes('Thesis') || btn.textContent.includes('Chapter')
            );
            
            if (thesisButton) {
                this.log('success', 'Thesis Chapter Generation button found');
                
                // Check if button is functional (not disabled)
                if (!thesisButton.disabled) {
                    this.log('success', 'Thesis Chapter Generation button is enabled');
                } else {
                    this.log('warning', 'Thesis Chapter Generation button is disabled');
                }
            } else {
                this.log('warning', 'Thesis Chapter Generation button not found');
            }

            // Check for existing thesis structure display
            const thesisStructure = document.querySelector('[data-component="thesis-structure"]');
            if (thesisStructure) {
                this.log('success', 'Thesis Structure component found');
                
                // Check for chapter elements
                const chapters = thesisStructure.querySelectorAll('[class*="chapter"], [class*="border"]');
                if (chapters.length > 0) {
                    this.log('success', `Thesis chapters displayed: ${chapters.length} chapters found`);
                } else {
                    this.log('info', 'No thesis chapters currently displayed (may need generation)');
                }
            } else {
                this.log('info', 'Thesis Structure component not currently displayed');
            }
        } catch (error) {
            this.log('error', `Enhanced Thesis Generation test failed: ${error.message}`);
        }
    }

    async testImprovedGapAnalysis() {
        this.log('info', '🔍 Testing Improved Gap Analysis');
        
        try {
            // Look for gap analysis button
            const gapButton = Array.from(document.querySelectorAll('button')).find(btn => 
                btn.textContent.includes('Gap') || btn.textContent.includes('Literature')
            );
            
            if (gapButton) {
                this.log('success', 'Gap Analysis button found');
            } else {
                this.log('warning', 'Gap Analysis button not found');
            }

            // Check for existing gap analysis display
            const gapAnalysis = document.querySelector('[data-component="gap-analysis"]');
            if (gapAnalysis) {
                this.log('success', 'Gap Analysis component found');
                
                // Check for gap elements
                const gaps = gapAnalysis.querySelectorAll('[class*="gap"], [class*="border"]');
                if (gaps.length > 0) {
                    this.log('success', `Research gaps displayed: ${gaps.length} gaps found`);
                } else {
                    this.log('info', 'No research gaps currently displayed');
                }
            } else {
                this.log('info', 'Gap Analysis component not currently displayed');
            }
        } catch (error) {
            this.log('error', `Improved Gap Analysis test failed: ${error.message}`);
        }
    }

    async testEnhancedMethodologySynthesis() {
        this.log('info', '🧪 Testing Enhanced Methodology Synthesis');
        
        try {
            // Look for methodology button
            const methodButton = Array.from(document.querySelectorAll('button')).find(btn => 
                btn.textContent.includes('Methodology') || btn.textContent.includes('Method')
            );
            
            if (methodButton) {
                this.log('success', 'Methodology Synthesis button found');
            } else {
                this.log('warning', 'Methodology Synthesis button not found');
            }

            // Check for existing methodology display
            const methodSynthesis = document.querySelector('[data-component="methodology-synthesis"]');
            if (methodSynthesis) {
                this.log('success', 'Methodology Synthesis component found');
                
                // Check for methodology elements
                const methods = methodSynthesis.querySelectorAll('[class*="method"], [class*="border"]');
                if (methods.length > 0) {
                    this.log('success', `Methodologies displayed: ${methods.length} methods found`);
                } else {
                    this.log('info', 'No methodologies currently displayed');
                }
            } else {
                this.log('info', 'Methodology Synthesis component not currently displayed');
            }
        } catch (error) {
            this.log('error', `Enhanced Methodology Synthesis test failed: ${error.message}`);
        }
    }

    async testUILoadingStates() {
        this.log('info', '⏳ Testing UI Loading States');
        
        try {
            // Check if loading states are implemented (look for skeleton loaders)
            const skeletonElements = document.querySelectorAll('[class*="animate-pulse"], [class*="skeleton"]');
            
            if (skeletonElements.length > 0) {
                this.log('success', `Loading states implemented: ${skeletonElements.length} skeleton elements found`);
            } else {
                this.log('info', 'No loading states currently visible (components may be loaded)');
            }

            // Check for loading indicators in buttons
            const loadingButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
                btn.textContent.includes('Loading') || btn.textContent.includes('Generating') || btn.disabled
            );
            
            if (loadingButtons.length > 0) {
                this.log('success', `Loading buttons found: ${loadingButtons.length} buttons in loading state`);
            } else {
                this.log('info', 'No buttons currently in loading state');
            }
        } catch (error) {
            this.log('error', `UI Loading States test failed: ${error.message}`);
        }
    }

    async testErrorHandling() {
        this.log('info', '🚨 Testing Error Handling');
        
        try {
            // Check for error displays
            const errorElements = document.querySelectorAll('[class*="error"], [class*="red-"], .bg-red-50');
            
            if (errorElements.length > 0) {
                this.log('warning', `Error states visible: ${errorElements.length} error elements found`);
            } else {
                this.log('success', 'No error states currently visible (good!)');
            }

            // Check for retry buttons
            const retryButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
                btn.textContent.includes('Retry') || btn.textContent.includes('Try Again')
            );
            
            if (retryButtons.length > 0) {
                this.log('info', `Retry functionality available: ${retryButtons.length} retry buttons found`);
            } else {
                this.log('info', 'No retry buttons currently visible');
            }
        } catch (error) {
            this.log('error', `Error Handling test failed: ${error.message}`);
        }
    }

    async testDataIntegration() {
        this.log('info', '🔗 Testing Data Integration');

        try {
            // Test API endpoints using proper proxy routes
            const projectId = window.location.pathname.split('/').pop();

            if (projectId && projectId.length > 10) {
                this.log('success', `Project ID detected: ${projectId}`);

                // Test PhD Progress endpoint via proxy
                try {
                    const response = await fetch(`/api/proxy/projects/${projectId}/phd-progress`);
                    if (response.ok) {
                        const data = await response.json();
                        this.log('success', 'PhD Progress API endpoint working');

                        if (data.dissertation_progress && data.literature_coverage) {
                            this.log('success', 'PhD Progress data structure is correct');
                        } else {
                            this.log('warning', 'PhD Progress data structure may be incomplete');
                        }
                    } else {
                        this.log('warning', `PhD Progress API returned ${response.status}`);
                    }
                } catch (apiError) {
                    this.log('warning', `PhD Progress API test failed: ${apiError.message}`);
                }

                // Test PhD endpoints via proxy (these should use frontend proxy routes)
                const phdEndpoints = [
                    { name: 'Generate Summary', endpoint: `/api/proxy/generate-summary` },
                    { name: 'Literature Gap Analysis', endpoint: `/api/proxy/literature-gap-analysis` },
                    { name: 'Thesis Chapter Generator', endpoint: `/api/proxy/thesis-chapter-generator` },
                    { name: 'Methodology Synthesis', endpoint: `/api/proxy/methodology-synthesis` }
                ];

                for (const { name, endpoint } of phdEndpoints) {
                    try {
                        // Test with minimal payload
                        const testResponse = await fetch(endpoint, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'User-ID': 'test-user'
                            },
                            body: JSON.stringify({
                                project_id: projectId,
                                user_id: 'test-user',
                                test: true
                            })
                        });

                        if (testResponse.ok) {
                            this.log('success', `${name} endpoint accessible via proxy`);
                        } else if (testResponse.status === 404) {
                            this.log('warning', `${name} endpoint not found (may need implementation)`);
                        } else {
                            this.log('warning', `${name} endpoint returned ${testResponse.status}`);
                        }
                    } catch (endpointError) {
                        this.log('warning', `${name} endpoint test failed: ${endpointError.message}`);
                    }
                }
            } else {
                this.log('warning', 'Could not detect valid project ID from URL');
            }
        } catch (error) {
            this.log('error', `Data Integration test failed: ${error.message}`);
        }
    }

    printSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 ENHANCED PhD SYSTEM TEST SUMMARY');
        console.log('='.repeat(60));
        
        this.log('success', `✅ Successes: ${this.results.successes}`);
        this.log('warning', `⚠️ Warnings: ${this.results.warnings}`);
        this.log('error', `❌ Errors: ${this.results.errors}`);
        
        const totalTests = this.results.successes + this.results.warnings + this.results.errors;
        const successRate = ((this.results.successes / totalTests) * 100).toFixed(1);
        
        console.log(`\n📈 Success Rate: ${successRate}%`);
        
        if (this.results.errors === 0 && this.results.warnings <= 3) {
            this.log('success', '🎉 Enhanced PhD System is working excellently!');
        } else if (this.results.errors <= 2) {
            this.log('warning', '⚡ Enhanced PhD System is mostly functional with minor issues');
        } else {
            this.log('error', '🔧 Enhanced PhD System needs attention');
        }
        
        console.log('\n' + '='.repeat(60));
    }
}

// Auto-run test when script is loaded
if (typeof window !== 'undefined') {
    window.EnhancedPhDSystemTest = EnhancedPhDSystemTest;

    // Add a global function to run the test
    window.testEnhancedPhDSystem = () => {
        const test = new EnhancedPhDSystemTest();
        return test.runAllTests();
    };

    // Add a debug function for data flow issues
    window.debugPhdDataFlow = () => {
        console.log('🔍 DEBUGGING PhD DATA FLOW ISSUE');

        // Find gap analysis button and trigger it with data monitoring
        const gapButton = Array.from(document.querySelectorAll('button')).find(btn =>
            btn.textContent.includes('Literature Gap Analysis') ||
            btn.textContent.includes('Gap Analysis')
        );

        if (gapButton) {
            console.log('🎯 Found Gap Analysis button, triggering with data monitoring...');

            // Monitor console for success messages
            const originalLog = console.log;
            console.log = function(...args) {
                if (args[0] && args[0].includes && args[0].includes('Gap analysis generated successfully')) {
                    const data = args[1];

                    console.log('🔍 INTERCEPTED GAP ANALYSIS DATA:');
                    console.log('📊 Full data structure:', data);

                    // Check the exact path the component expects
                    const expectedPath = data?.agent_results?.gap_analysis?.identified_gaps;
                    console.log('📊 Expected component path (agent_results.gap_analysis.identified_gaps):', expectedPath);
                    console.log('📊 Expected path length:', expectedPath?.length || 0);

                    // Check alternative paths
                    console.log('🔍 Alternative data locations:');
                    console.log('📊 phd_outputs.gap_analysis:', data?.phd_outputs?.gap_analysis);
                    console.log('📊 agent_results keys:', Object.keys(data?.agent_results || {}));

                    if (data?.agent_results?.gap_analysis) {
                        console.log('📊 gap_analysis keys:', Object.keys(data.agent_results.gap_analysis));
                    }

                    // Check if gaps are in a different format
                    if (expectedPath && expectedPath.length === 0) {
                        console.log('❌ PROBLEM: identified_gaps array is empty!');
                        console.log('🔍 Checking if gaps are in different locations...');

                        // Check all possible gap locations
                        const possibleGapLocations = [
                            data?.agent_results?.gap_analysis?.gaps,
                            data?.agent_results?.gap_analysis?.research_gaps,
                            data?.phd_outputs?.gap_analysis?.identified_gaps,
                            data?.phd_outputs?.gap_analysis?.gaps,
                            data?.gap_analysis?.identified_gaps,
                            data?.gaps
                        ];

                        possibleGapLocations.forEach((location, index) => {
                            if (location && Array.isArray(location) && location.length > 0) {
                                console.log(`✅ FOUND GAPS at location ${index}:`, location.slice(0, 2));
                            }
                        });
                    } else if (expectedPath && expectedPath.length > 0) {
                        console.log('✅ SUCCESS: Found gaps in expected location:', expectedPath.slice(0, 2));
                    }

                    // Check component state after 3 seconds
                    setTimeout(() => {
                        const gapComponent = document.querySelector('[data-component="gap-analysis"]');
                        if (gapComponent) {
                            const hasEmptyState = gapComponent.textContent.includes('No literature gaps identified yet');
                            console.log('📊 Component still showing empty state:', hasEmptyState);

                            if (hasEmptyState) {
                                console.log('❌ DATA FLOW BROKEN: Backend has data but component shows empty state');
                            } else {
                                console.log('✅ DATA FLOW WORKING: Component now shows data');
                            }
                        }
                    }, 3000);
                }
                originalLog.apply(console, args);
            };

            // Click the button
            gapButton.click();

            // Restore console.log after 20 seconds
            setTimeout(() => {
                console.log = originalLog;
                console.log('🔍 Data flow debug completed');
            }, 20000);
        } else {
            console.log('❌ Gap Analysis button not found');
        }
    };

    console.log('🧪 Enhanced PhD System Test loaded. Run testEnhancedPhDSystem() to start testing.');
    console.log('🔍 Run debugPhdDataFlow() to debug data flow issues.');
}
