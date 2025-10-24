/**
 * BROWSER VERIFICATION SCRIPT v1.0
 * 
 * Run this script in the browser console at:
 * https://frontend-psi-seven-85.vercel.app/project/5ac213d7-6fcc-46ff-9420-5c7f4b421012
 * 
 * Tests UI integration and data flow from frontend to backend
 */

class BrowserVerificationScript {
    constructor() {
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
            'test': '🧪', 'ui': '🎨', 'data': '📊'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} [${timestamp}] [+${elapsed}ms] ${message}`);
        if (data) console.log('   Data:', data);
        this.results.push({ timestamp, type, message, data, elapsed });
    }

    async testUIElement(selector, elementName) {
        try {
            const element = document.querySelector(selector);
            if (element) {
                this.log(`✅ UI Element Found: ${elementName}`, 'success', {
                    selector,
                    visible: element.offsetParent !== null,
                    text: element.textContent?.substring(0, 50) || 'No text'
                });
                return true;
            } else {
                this.log(`❌ UI Element Missing: ${elementName}`, 'error', { selector });
                return false;
            }
        } catch (error) {
            this.log(`❌ UI Element Error: ${elementName}`, 'error', { selector, error: error.message });
            return false;
        }
    }

    async testAPIEndpoint(endpointName, endpoint, payload) {
        this.log(`🧪 Testing ${endpointName} API...`, 'test');
        
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.testUserId
                },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.log(`✅ ${endpointName} API: SUCCESS`, 'success', {
                    status: response.status,
                    dataKeys: Object.keys(data).length,
                    qualityScore: data.quality_score || 'N/A'
                });
                return { success: true, data };
            } else {
                this.log(`❌ ${endpointName} API: FAILED`, 'error', {
                    status: response.status,
                    error: data.detail || data.error || 'Unknown error'
                });
                return { success: false, error: data };
            }
        } catch (error) {
            this.log(`❌ ${endpointName} API: EXCEPTION`, 'error', { error: error.message });
            return { success: false, error: error.message };
        }
    }

    async testDataFlow(endpointName, apiResult) {
        this.log(`📊 Testing ${endpointName} Data Flow...`, 'data');
        
        if (!apiResult.success) {
            this.log(`⚠️ ${endpointName}: Skipping data flow test (API failed)`, 'warning');
            return false;
        }
        
        // Check if data appears in UI after API call
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for UI update
        
        // Look for common data indicators in the UI
        const dataIndicators = [
            '[data-testid*="result"]',
            '[class*="result"]',
            '[class*="analysis"]',
            '[class*="summary"]',
            '.quality-score',
            '.processing-time',
            '.metadata'
        ];
        
        let dataFound = false;
        for (const selector of dataIndicators) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                dataFound = true;
                this.log(`✅ ${endpointName}: Data indicators found in UI`, 'success', {
                    selector,
                    count: elements.length
                });
                break;
            }
        }
        
        if (!dataFound) {
            this.log(`⚠️ ${endpointName}: No data indicators found in UI`, 'warning');
        }
        
        return dataFound;
    }

    async runBrowserVerification() {
        this.log('🚀 STARTING BROWSER VERIFICATION', 'test');
        this.log('Testing UI integration and data flow', 'info');
        this.log(`Current URL: ${window.location.href}`, 'info');
        this.log(`Project ID: ${this.projectId}`, 'info');
        
        const testResults = [];
        
        // Test 1: Page Structure
        this.log('🎨 Testing Page Structure...', 'ui');
        const pageStructure = {
            'Project Header': await this.testUIElement('h1, [data-testid="project-title"]', 'Project Title'),
            'Navigation Menu': await this.testUIElement('nav, [role="navigation"]', 'Navigation'),
            'Main Content': await this.testUIElement('main, [role="main"]', 'Main Content Area'),
            'Collections Panel': await this.testUIElement('[data-testid*="collection"], .collection', 'Collections'),
            'Analysis Panel': await this.testUIElement('[data-testid*="analysis"], .analysis', 'Analysis Panel')
        };
        
        // Test 2: API Endpoints with Data Flow
        const endpointTests = [
            {
                name: 'Generate Review',
                endpoint: '/api/proxy/background-jobs/generate-review',
                payload: {
                    molecule: 'COVID-19 therapeutics',
                    objective: 'Comprehensive review of treatment efficacy',
                    project_id: this.projectId
                }
            },
            {
                name: 'Thesis Chapter Generator',
                endpoint: '/api/proxy/thesis-chapter-generator',
                payload: {
                    project_id: this.projectId,
                    objective: 'Generate comprehensive thesis structure',
                    chapter_focus: 'literature_review',
                    academic_level: 'phd'
                }
            },
            {
                name: 'Literature Gap Analysis',
                endpoint: '/api/proxy/literature-gap-analysis',
                payload: {
                    project_id: this.projectId,
                    objective: 'Identify research gaps and opportunities',
                    gap_types: ['theoretical', 'methodological', 'empirical'],
                    academic_level: 'phd'
                }
            },
            {
                name: 'Methodology Synthesis',
                endpoint: '/api/proxy/methodology-synthesis',
                payload: {
                    project_id: this.projectId,
                    objective: 'Synthesize research methodologies',
                    methodology_types: ['experimental', 'observational', 'computational'],
                    academic_level: 'phd'
                }
            }
        ];
        
        for (const test of endpointTests) {
            const apiResult = await this.testAPIEndpoint(test.name, test.endpoint, test.payload);
            const dataFlow = await this.testDataFlow(test.name, apiResult);
            
            testResults.push({
                name: test.name,
                apiSuccess: apiResult.success,
                dataFlow,
                data: apiResult.data,
                error: apiResult.error
            });
        }
        
        // Test 3: Interactive Elements
        this.log('🎨 Testing Interactive Elements...', 'ui');
        const interactiveElements = {
            'Buttons': await this.testUIElement('button', 'Interactive Buttons'),
            'Forms': await this.testUIElement('form, input', 'Form Elements'),
            'Dropdowns': await this.testUIElement('select, [role="combobox"]', 'Dropdown Menus'),
            'Loading States': await this.testUIElement('[class*="loading"], [class*="spinner"]', 'Loading Indicators'),
            'Error States': await this.testUIElement('[class*="error"], [role="alert"]', 'Error Displays')
        };
        
        // Generate Report
        this.generateBrowserReport(pageStructure, testResults, interactiveElements);
        
        return { pageStructure, testResults, interactiveElements };
    }

    generateBrowserReport(pageStructure, testResults, interactiveElements) {
        console.log('\n🎨 BROWSER VERIFICATION REPORT');
        console.log('=====================================');
        
        // Page Structure Results
        console.log('\n📱 PAGE STRUCTURE:');
        Object.entries(pageStructure).forEach(([element, found]) => {
            const status = found ? '✅' : '❌';
            console.log(`   ${element}: ${status}`);
        });
        
        const structureScore = (Object.values(pageStructure).filter(Boolean).length / Object.keys(pageStructure).length * 100).toFixed(1);
        console.log(`   Structure Score: ${structureScore}%`);
        
        // API Integration Results
        console.log('\n🔗 API INTEGRATION:');
        testResults.forEach(result => {
            const apiStatus = result.apiSuccess ? '✅' : '❌';
            const dataStatus = result.dataFlow ? '✅' : '❌';
            
            console.log(`\n   ${result.name}:`);
            console.log(`     API Call: ${apiStatus}`);
            console.log(`     Data Flow: ${dataStatus}`);
            
            if (result.data && result.data.quality_score) {
                console.log(`     Quality Score: ${result.data.quality_score}/10`);
            }
            
            if (result.error) {
                console.log(`     Error: ${result.error.toString().substring(0, 80)}...`);
            }
        });
        
        const apiSuccessRate = (testResults.filter(r => r.apiSuccess).length / testResults.length * 100).toFixed(1);
        const dataFlowRate = (testResults.filter(r => r.dataFlow).length / testResults.length * 100).toFixed(1);
        
        console.log(`\n   API Success Rate: ${apiSuccessRate}%`);
        console.log(`   Data Flow Rate: ${dataFlowRate}%`);
        
        // Interactive Elements Results
        console.log('\n🎮 INTERACTIVE ELEMENTS:');
        Object.entries(interactiveElements).forEach(([element, found]) => {
            const status = found ? '✅' : '❌';
            console.log(`   ${element}: ${status}`);
        });
        
        const interactivityScore = (Object.values(interactiveElements).filter(Boolean).length / Object.keys(interactiveElements).length * 100).toFixed(1);
        console.log(`   Interactivity Score: ${interactivityScore}%`);
        
        // Overall Assessment
        console.log('\n🎯 OVERALL ASSESSMENT:');
        const overallScore = ((parseFloat(structureScore) + parseFloat(apiSuccessRate) + parseFloat(interactivityScore)) / 3).toFixed(1);
        console.log(`   Overall Score: ${overallScore}%`);
        
        if (overallScore >= 85) {
            console.log('   Status: 🎉 EXCELLENT - UI fully integrated');
        } else if (overallScore >= 70) {
            console.log('   Status: ✅ GOOD - Minor UI issues');
        } else if (overallScore >= 50) {
            console.log('   Status: ⚠️ PARTIAL - Significant UI gaps');
        } else {
            console.log('   Status: ❌ CRITICAL - Major UI problems');
        }
        
        console.log('\n💡 NEXT STEPS:');
        if (parseFloat(apiSuccessRate) < 80) {
            console.log('   🔧 Fix failing API endpoints');
        }
        if (parseFloat(dataFlowRate) < 80) {
            console.log('   📊 Improve data flow visualization');
        }
        if (parseFloat(structureScore) < 80) {
            console.log('   🎨 Complete UI structure implementation');
        }
        if (parseFloat(interactivityScore) < 80) {
            console.log('   🎮 Add missing interactive elements');
        }
        
        console.log('\n🎉 BROWSER VERIFICATION COMPLETED');
    }
}

// Auto-run when pasted into browser console
console.log('🚀 Starting Browser Verification Script...');
console.log('📱 Testing UI integration and data flow');
console.log('🎨 Run this in the project workspace for best results');

const browserVerification = new BrowserVerificationScript();
browserVerification.runBrowserVerification().catch(console.error);
