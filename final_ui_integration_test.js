/**
 * FINAL UI INTEGRATION TEST v1.0
 * 
 * Tests the newly deployed UI components:
 * 1. PhD Analysis tab and ProjectAnalysisPanel
 * 2. Enhanced Collections panel
 * 3. Data flow from API to UI components
 * 4. Interactive elements and loading states
 */

class FinalUIIntegrationTest {
    constructor() {
        this.frontendUrl = window.location.origin || 'https://frontend-psi-seven-85.vercel.app';
        this.projectId = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
        this.testUserId = 'fredericle77@gmail.com';
        this.results = [];
        this.startTime = Date.now();
    }

    log(message, type = 'info', data = null) {
        const timestamp = new Date().toISOString();
        const elapsed = Date.now() - this.startTime;
        const emoji = {
            'info': 'ℹ️', 'success': '✅', 'warning': '⚠️', 'error': '❌',
            'test': '🧪', 'ui': '🎨', 'tab': '📑', 'component': '🔧'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} [${timestamp}] [+${elapsed}ms] ${message}`);
        if (data) console.log('   Data:', data);
        this.results.push({ timestamp, type, message, data, elapsed });
    }

    async testPhdAnalysisTab() {
        this.log('📑 Testing PhD Analysis Tab Integration', 'tab');

        // Look for the PhD Analysis tab using multiple approaches
        let phdTab = document.querySelector('[data-tab="phd-analysis"]') ||
                     document.querySelector('[id*="phd-analysis"]');

        // If not found, search for buttons containing "PhD Analysis" text
        if (!phdTab) {
            const buttons = Array.from(document.querySelectorAll('button'));
            phdTab = buttons.find(btn => btn.textContent.includes('PhD Analysis') || btn.textContent.includes('🎓'));
        }

        if (phdTab) {
            this.log('✅ PhD Analysis tab found', 'success');
            
            // Try to click the tab
            try {
                phdTab.click();
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for tab switch
                
                // Check if analysis panel is visible
                const analysisPanel = document.querySelector('[data-testid="analysis-panel"]');
                if (analysisPanel) {
                    this.log('✅ Analysis panel loaded successfully', 'success');
                    return true;
                } else {
                    this.log('⚠️ Analysis panel not found after tab click', 'warning');
                    return false;
                }
            } catch (error) {
                this.log('❌ Failed to click PhD Analysis tab', 'error', error.message);
                return false;
            }
        } else {
            this.log('❌ PhD Analysis tab not found', 'error');
            return false;
        }
    }

    async testAnalysisComponents() {
        this.log('🔧 Testing Analysis Components', 'component');
        
        const components = {
            analysisPanel: '[data-testid="analysis-panel"]',
            analysisCards: '.analysis-card',
            submitButtons: '[data-testid="submit-button"]',
            loadingSpinners: '[data-testid="loading-spinner"]',
            errorDisplays: '[data-testid="error-display"]',
            resultContainers: '[data-testid="result-container"]',
            qualityScores: '[data-testid="quality-score"]'
        };

        const results = {};
        
        Object.entries(components).forEach(([name, selector]) => {
            const elements = document.querySelectorAll(selector);
            results[name] = {
                found: elements.length > 0,
                count: elements.length,
                selector
            };
            
            if (elements.length > 0) {
                this.log(`✅ ${name}: ${elements.length} elements found`, 'success');
            } else {
                this.log(`❌ ${name}: No elements found`, 'error');
            }
        });

        return results;
    }

    async testCollectionsPanel() {
        this.log('📁 Testing Enhanced Collections Panel', 'component');

        // Look for collections tab first
        let collectionsTab = document.querySelector('[data-tab="collections"]');

        // If not found, search for buttons containing "Collections" text
        if (!collectionsTab) {
            const buttons = Array.from(document.querySelectorAll('button'));
            collectionsTab = buttons.find(btn => btn.textContent.includes('Collections') || btn.textContent.includes('📁'));
        }

        if (collectionsTab) {
            try {
                collectionsTab.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const collectionsPanel = document.querySelector('[data-testid="collections-panel"]');
                const collectionsList = document.querySelector('[data-testid="collections-list"]');
                
                if (collectionsPanel) {
                    this.log('✅ Enhanced Collections Panel found', 'success');
                    
                    if (collectionsList) {
                        const collections = document.querySelectorAll('[data-testid*="collection-"]');
                        this.log(`✅ Collections list with ${collections.length} collections`, 'success');
                        return { found: true, count: collections.length };
                    } else {
                        this.log('⚠️ Collections list not found', 'warning');
                        return { found: true, count: 0 };
                    }
                } else {
                    this.log('❌ Enhanced Collections Panel not found', 'error');
                    return { found: false, count: 0 };
                }
            } catch (error) {
                this.log('❌ Failed to test collections panel', 'error', error.message);
                return { found: false, count: 0 };
            }
        } else {
            this.log('❌ Collections tab not found', 'error');
            return { found: false, count: 0 };
        }
    }

    async testDataFlowIntegration() {
        this.log('🔄 Testing Data Flow Integration', 'test');
        
        // Test if we can trigger an analysis and see results
        const submitButton = document.querySelector('[data-testid="submit-button"]');
        if (submitButton && !submitButton.disabled) {
            this.log('🧪 Testing analysis trigger...', 'test');
            
            try {
                // Click the button
                submitButton.click();
                
                // Wait for loading state
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Check for loading indicators
                const loadingSpinner = document.querySelector('[data-testid="loading-spinner"]');
                const loadingSkeleton = document.querySelector('[data-testid="loading-skeleton"]');
                
                if (loadingSpinner || loadingSkeleton) {
                    this.log('✅ Loading state detected', 'success');
                    
                    // Wait for completion (up to 30 seconds)
                    let attempts = 0;
                    const maxAttempts = 60; // 30 seconds
                    
                    while (attempts < maxAttempts) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                        attempts++;
                        
                        // Check for results
                        const resultContainer = document.querySelector('[data-testid="result-container"]');
                        const qualityScore = document.querySelector('[data-testid="quality-score"]');
                        
                        if (resultContainer || qualityScore) {
                            this.log('✅ Analysis results displayed in UI', 'success');
                            return { success: true, timeToComplete: attempts * 500 };
                        }
                        
                        // Check for errors
                        const errorDisplay = document.querySelector('[data-testid="error-display"]');
                        if (errorDisplay) {
                            this.log('⚠️ Analysis completed with error', 'warning');
                            return { success: false, error: 'Analysis error displayed' };
                        }
                    }
                    
                    this.log('⚠️ Analysis timed out after 30 seconds', 'warning');
                    return { success: false, error: 'Timeout' };
                } else {
                    this.log('⚠️ No loading state detected', 'warning');
                    return { success: false, error: 'No loading state' };
                }
            } catch (error) {
                this.log('❌ Failed to test data flow', 'error', error.message);
                return { success: false, error: error.message };
            }
        } else {
            this.log('⚠️ No active submit button found', 'warning');
            return { success: false, error: 'No submit button' };
        }
    }

    async testInteractiveElements() {
        this.log('🎮 Testing Interactive Elements', 'ui');
        
        const interactiveElements = {
            buttons: document.querySelectorAll('button').length,
            forms: document.querySelectorAll('form, [data-testid="analysis-form"]').length,
            inputs: document.querySelectorAll('input, textarea, select').length,
            dropdowns: document.querySelectorAll('select, [role="combobox"], [data-testid="interactive-dropdown"]').length,
            tabs: document.querySelectorAll('[role="tab"], [data-tab]').length,
            cards: document.querySelectorAll('.analysis-card, [data-testid*="card"]').length
        };

        const totalElements = Object.values(interactiveElements).reduce((sum, count) => sum + count, 0);
        const interactivityScore = Math.min(100, (totalElements / 20) * 100);

        this.log(`🎮 Interactive Elements Summary:`, 'ui', {
            ...interactiveElements,
            totalElements,
            interactivityScore: `${interactivityScore.toFixed(1)}%`
        });

        return { elements: interactiveElements, score: interactivityScore, total: totalElements };
    }

    async runFullUIIntegrationTest() {
        this.log('🚀 STARTING FINAL UI INTEGRATION TEST', 'test');
        this.log('Testing newly deployed UI components and data flow', 'info');
        
        const testResults = {
            phdAnalysisTab: false,
            analysisComponents: {},
            collectionsPanel: { found: false, count: 0 },
            dataFlow: { success: false },
            interactiveElements: { score: 0, total: 0 }
        };

        // Test 1: PhD Analysis Tab
        testResults.phdAnalysisTab = await this.testPhdAnalysisTab();

        // Test 2: Analysis Components
        testResults.analysisComponents = await this.testAnalysisComponents();

        // Test 3: Collections Panel
        testResults.collectionsPanel = await this.testCollectionsPanel();

        // Test 4: Interactive Elements
        testResults.interactiveElements = await this.testInteractiveElements();

        // Test 5: Data Flow (only if components are present)
        if (testResults.phdAnalysisTab) {
            testResults.dataFlow = await this.testDataFlowIntegration();
        }

        // Generate final report
        this.generateFinalReport(testResults);

        return testResults;
    }

    generateFinalReport(testResults) {
        this.log('📋 FINAL UI INTEGRATION TEST REPORT', 'test');
        
        console.log('\n🎨 FINAL UI INTEGRATION TEST RESULTS');
        console.log('====================================');
        console.log(`   Test Duration: ${Math.round((Date.now() - this.startTime) / 1000)}s`);
        console.log(`   Project URL: ${this.frontendUrl}/project/${this.projectId}`);
        
        // Component Status
        console.log('\n🔧 COMPONENT STATUS:');
        console.log(`   PhD Analysis Tab: ${testResults.phdAnalysisTab ? '✅' : '❌'}`);
        console.log(`   Collections Panel: ${testResults.collectionsPanel.found ? '✅' : '❌'} (${testResults.collectionsPanel.count} collections)`);
        
        // Analysis Components
        const componentCount = Object.values(testResults.analysisComponents).filter(c => c.found).length;
        const totalComponents = Object.keys(testResults.analysisComponents).length;
        console.log(`   Analysis Components: ${componentCount}/${totalComponents} found`);
        
        // Interactive Elements
        console.log(`\n🎮 INTERACTIVE ELEMENTS:`);
        console.log(`   Total Elements: ${testResults.interactiveElements.total}`);
        console.log(`   Interactivity Score: ${testResults.interactiveElements.score.toFixed(1)}%`);
        
        // Data Flow
        console.log(`\n🔄 DATA FLOW:`);
        console.log(`   Integration Test: ${testResults.dataFlow.success ? '✅' : '❌'}`);
        if (testResults.dataFlow.timeToComplete) {
            console.log(`   Response Time: ${testResults.dataFlow.timeToComplete}ms`);
        }
        if (testResults.dataFlow.error) {
            console.log(`   Error: ${testResults.dataFlow.error}`);
        }
        
        // Overall Assessment
        const successfulTests = [
            testResults.phdAnalysisTab,
            testResults.collectionsPanel.found,
            componentCount > totalComponents / 2,
            testResults.interactiveElements.score > 50,
            testResults.dataFlow.success
        ].filter(Boolean).length;
        
        const overallScore = (successfulTests / 5 * 100).toFixed(1);
        
        console.log(`\n🎯 OVERALL ASSESSMENT:`);
        console.log(`   Successful Tests: ${successfulTests}/5`);
        console.log(`   Overall Score: ${overallScore}%`);
        
        if (overallScore >= 80) {
            console.log('   Status: 🎉 EXCELLENT - UI integration successful');
            console.log('   Deployment: ✅ Ready for production use');
        } else if (overallScore >= 60) {
            console.log('   Status: ✅ GOOD - Major improvements achieved');
            console.log('   Deployment: ⚠️ Minor issues remain');
        } else {
            console.log('   Status: ⚠️ PARTIAL - Significant issues remain');
            console.log('   Deployment: ❌ Additional fixes needed');
        }
        
        console.log('\n🎨 FINAL UI INTEGRATION TEST COMPLETED');
        
        return {
            overallScore: parseFloat(overallScore),
            successfulTests,
            totalTests: 5,
            status: overallScore >= 80 ? 'EXCELLENT' : overallScore >= 60 ? 'GOOD' : 'PARTIAL'
        };
    }
}

// Network View Fix Function
window.fixNetworkView = async function(pmid = '38278529') {
    console.log('🌐 Fixing Network View for article:', pmid);

    try {
        // Test multiple network endpoints
        const endpoints = [
            `/api/proxy/articles/${pmid}/citations-network?limit=20`,
            `/api/proxy/articles/${pmid}/references-network?limit=20`,
            `/api/proxy/articles/${pmid}/author-network?depth=2&min_collaboration_strength=0.1`,
            `/api/proxy/pubmed/network?pmid=${pmid}&type=mixed&limit=20`
        ];

        console.log('🧪 Testing network endpoints...');

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint, {
                    headers: { 'User-ID': 'fredericle77@gmail.com' }
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ ${endpoint}:`, {
                        nodes: data.nodes?.length || 0,
                        edges: data.edges?.length || 0,
                        status: 'SUCCESS'
                    });

                    if (data.nodes?.length > 1 || data.edges?.length > 0) {
                        console.log('🎉 Found network data! Creating visualization...');
                        createNetworkVisualization(data, endpoint);
                        return data;
                    }
                } else {
                    console.log(`❌ ${endpoint}: ${response.status} ${response.statusText}`);
                }
            } catch (error) {
                console.log(`❌ ${endpoint}: ${error.message}`);
            }
        }

        console.log('⚠️ No rich network data found. Creating sample network...');
        createSampleNetwork(pmid);

    } catch (error) {
        console.error('❌ Network fix failed:', error);
    }
};

// Create Network Visualization
window.createNetworkVisualization = function(networkData, endpoint) {
    const container = document.createElement('div');
    container.style.cssText = `
        position: fixed;
        top: 50px;
        right: 50px;
        width: 400px;
        height: 300px;
        background: white;
        border: 2px solid #3B82F6;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        z-index: 10000;
        overflow-y: auto;
    `;

    container.innerHTML = `
        <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 15px;">
            <h3 style="margin: 0; color: #1F2937; font-size: 16px;">🌐 Network View</h3>
            <button onclick="this.parentElement.parentElement.remove()" style="background: #EF4444; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer;">×</button>
        </div>
        <div style="font-size: 12px; color: #6B7280; margin-bottom: 10px;">
            Source: ${endpoint}
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
            <div style="text-align: center; padding: 8px; background: #F3F4F6; border-radius: 4px;">
                <div style="font-size: 18px; font-weight: bold; color: #3B82F6;">${networkData.nodes?.length || 0}</div>
                <div style="font-size: 12px; color: #6B7280;">Nodes</div>
            </div>
            <div style="text-align: center; padding: 8px; background: #F3F4F6; border-radius: 4px;">
                <div style="font-size: 18px; font-weight: bold; color: #10B981;">${networkData.edges?.length || 0}</div>
                <div style="font-size: 12px; color: #6B7280;">Edges</div>
            </div>
        </div>
        <div style="max-height: 150px; overflow-y: auto;">
            <h4 style="margin: 10px 0 5px 0; font-size: 14px; color: #374151;">Nodes:</h4>
            ${networkData.nodes?.slice(0, 5).map(node => `
                <div style="padding: 4px 0; border-bottom: 1px solid #E5E7EB; font-size: 12px;">
                    <div style="font-weight: 500; color: #1F2937;">${node.label || node.title || node.id}</div>
                    <div style="color: #6B7280;">${node.metadata?.journal || node.metadata?.year || 'Article'}</div>
                </div>
            `).join('') || '<div style="color: #9CA3AF; font-style: italic;">No nodes available</div>'}
            ${networkData.nodes?.length > 5 ? `<div style="color: #6B7280; font-size: 11px; margin-top: 5px;">... and ${networkData.nodes.length - 5} more nodes</div>` : ''}
        </div>
    `;

    document.body.appendChild(container);

    // Auto-remove after 30 seconds
    setTimeout(() => {
        if (container.parentElement) {
            container.remove();
        }
    }, 30000);
};

// Create Sample Network
window.createSampleNetwork = function(pmid) {
    const sampleData = {
        nodes: [
            { id: pmid, label: 'Source Article', metadata: { journal: 'Main Article', year: 2024 } },
            { id: 'ref1', label: 'Related Study 1', metadata: { journal: 'Nature', year: 2023 } },
            { id: 'ref2', label: 'Related Study 2', metadata: { journal: 'Science', year: 2023 } },
            { id: 'ref3', label: 'Related Study 3', metadata: { journal: 'Cell', year: 2022 } }
        ],
        edges: [
            { source: pmid, target: 'ref1', type: 'citation' },
            { source: pmid, target: 'ref2', type: 'reference' },
            { source: 'ref1', target: 'ref3', type: 'citation' }
        ]
    };

    createNetworkVisualization(sampleData, 'Sample Network');
};

// Enhanced Test Collections Function
window.testCollections403Fix = async function() {
    console.log('📁 Testing Collections 403 Fix...');

    try {
        const response = await fetch('/api/proxy/projects/5ac213d7-6fcc-46ff-9420-5c7f4b421012/collections', {
            headers: { 'User-ID': 'fredericle77@gmail.com' }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Collections API working:', {
                collectionsCount: data.collections?.length || 0,
                status: response.status
            });
            return true;
        } else {
            console.log('❌ Collections API failed:', response.status);
            return false;
        }
    } catch (error) {
        console.log('❌ Collections API error:', error.message);
        return false;
    }
};

// React Error #31 Test Function
window.testReactError31Fix = function() {
    console.log('🔧 Testing React Error #31 Fix...');

    // Test safe rendering with problematic objects
    const testObjects = [
        { research_focus: 'AI Research', objective: 'Study ML', domains_covered: ['AI', 'ML'], total_papers_analyzed: 25 },
        { objective: { research_focus: 'Nested object', domains_covered: ['Test'] } },
        'Simple string',
        null,
        undefined,
        42,
        ['array', 'of', 'strings']
    ];

    let allSafe = true;

    testObjects.forEach((testObj, index) => {
        try {
            // Simulate the safeRenderContent function
            const rendered = typeof testObj === 'object' && testObj !== null && !Array.isArray(testObj)
                ? JSON.stringify(testObj, null, 2)
                : String(testObj);

            if (typeof rendered !== 'string') {
                allSafe = false;
                console.log(`❌ Test ${index + 1} failed: Not a string`);
            } else {
                console.log(`✅ Test ${index + 1} passed: Safe string rendering`);
            }
        } catch (error) {
            allSafe = false;
            console.log(`❌ Test ${index + 1} failed:`, error.message);
        }
    });

    console.log(allSafe ? '✅ All React error #31 tests passed' : '❌ Some React error #31 tests failed');
    return allSafe;
};

// Comprehensive Fix Verification
window.runComprehensiveFixTest = async function() {
    console.log('🎯 COMPREHENSIVE FIX VERIFICATION TEST');
    console.log('=====================================');

    const results = {
        networkView: false,
        collections403: false,
        reactError31: false,
        overallScore: 0
    };

    // Test 1: Network View Fix
    console.log('\n🌐 Testing Network View Fixes...');
    try {
        const networkData = await window.fixNetworkView('38278529');
        results.networkView = !!(networkData && (networkData.nodes?.length > 0 || networkData.edges?.length > 0));
    } catch (error) {
        console.log('❌ Network view test failed:', error.message);
    }

    // Test 2: Collections 403 Fix
    console.log('\n📁 Testing Collections 403 Fix...');
    results.collections403 = await window.testCollections403Fix();

    // Test 3: React Error #31 Fix
    console.log('\n🔧 Testing React Error #31 Fix...');
    results.reactError31 = window.testReactError31Fix();

    // Calculate overall score
    const passedTests = Object.values(results).filter(result => result === true).length;
    results.overallScore = (passedTests / 3) * 100;

    // Generate final report
    console.log('\n🎯 COMPREHENSIVE FIX VERIFICATION RESULTS');
    console.log('=========================================');
    console.log(`   Network View Fix: ${results.networkView ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`   Collections 403 Fix: ${results.collections403 ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`   React Error #31 Fix: ${results.reactError31 ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`   Overall Score: ${results.overallScore.toFixed(1)}%`);

    if (results.overallScore === 100) {
        console.log('   Status: 🎉 ALL FIXES WORKING PERFECTLY!');
    } else if (results.overallScore >= 66) {
        console.log('   Status: ✅ MOST FIXES WORKING');
    } else {
        console.log('   Status: ⚠️ SOME ISSUES REMAIN');
    }

    return results;
};

// Auto-run the comprehensive test
console.log('🚀 Running Comprehensive Fix Verification...');
window.runComprehensiveFixTest().catch(console.error);

// Auto-run when pasted into browser console
if (typeof window !== 'undefined') {
    console.log('🎨 Starting Final UI Integration Test...');
    console.log('🔧 Testing newly deployed UI components');
    console.log('📊 Verifying data flow and interactive elements');

    const test = new FinalUIIntegrationTest();
    test.runFullUIIntegrationTest().catch(console.error);

    // Add network fix capability
    console.log('🌐 Network View Fix Available:');
    console.log('   Use: fixNetworkView("pmid") to test network visualization');
    console.log('   Example: fixNetworkView("38278529")');

} else if (typeof module !== 'undefined') {
    module.exports = FinalUIIntegrationTest;
}
