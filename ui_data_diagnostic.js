/**
 * UI Data Integration Diagnostic Script
 * Investigates UI element detection and data structure issues
 */

async function diagnoseUIDataIntegration() {
    console.log('🔍 UI DATA INTEGRATION DIAGNOSTIC');
    console.log('================================');
    
    const PROJECT_ID = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
    const USER_ID = 'fredericle77@gmail.com';
    
    // Test 1: Detailed UI Element Analysis
    console.log('🎨 Test 1: Detailed UI Element Analysis');
    console.log('--------------------------------------');
    
    // Check for various possible selectors
    const selectors = [
        // Report selectors
        '[data-testid*="report"]',
        '.report-item',
        '.report-card',
        '.report-container',
        '[class*="report"]',
        
        // Analysis selectors
        '[data-testid*="analysis"]',
        '.analysis-item',
        '.analysis-card',
        '.analysis-container',
        '[class*="analysis"]',
        
        // Collection selectors
        '[data-testid*="collection"]',
        '.collection-item',
        '.collection-card',
        '.collection-container',
        '[class*="collection"]',
        
        // Generic content selectors
        '.card',
        '.item',
        '.list-item',
        '[role="listitem"]',
        '.grid-item'
    ];
    
    console.log('🔍 Scanning for UI elements with various selectors...');
    
    for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            console.log(`✅ Found ${elements.length} elements with selector: ${selector}`);
            
            // Sample first element content
            if (elements[0]) {
                const sampleText = elements[0].innerText?.substring(0, 100) || 'No text content';
                console.log(`   📄 Sample content: "${sampleText}..."`);
            }
        }
    }
    
    // Test 2: Check current page URL and context
    console.log('\n🌐 Test 2: Page Context Analysis');
    console.log('--------------------------------');
    console.log(`📍 Current URL: ${window.location.href}`);
    console.log(`📄 Page Title: ${document.title}`);
    console.log(`🏠 Hostname: ${window.location.hostname}`);
    console.log(`📂 Pathname: ${window.location.pathname}`);
    
    // Check if we're on the right page
    const isProjectPage = window.location.pathname.includes('/project/');
    const isCorrectProject = window.location.pathname.includes(PROJECT_ID);
    
    console.log(`🎯 On project page: ${isProjectPage ? '✅ YES' : '❌ NO'}`);
    console.log(`🎯 Correct project ID: ${isCorrectProject ? '✅ YES' : '❌ NO'}`);
    
    if (!isProjectPage) {
        console.log('⚠️ RECOMMENDATION: Navigate to project workspace for proper UI testing');
        console.log(`   🔗 Go to: https://frontend-psi-seven-85.vercel.app/project/${PROJECT_ID}`);
    }
    
    // Test 3: Detailed API Response Analysis
    console.log('\n💾 Test 3: Detailed API Response Analysis');
    console.log('----------------------------------------');
    
    try {
        console.log('📡 Fetching reports data...');
        const reportsResponse = await fetch(`/api/proxy/projects/${PROJECT_ID}/reports`, {
            headers: { 'User-ID': USER_ID }
        });
        
        console.log(`📊 Reports Response Status: ${reportsResponse.status}`);
        
        if (reportsResponse.ok) {
            const reportsData = await reportsResponse.json();
            console.log('📄 Reports Data Structure:');
            console.log(`   Type: ${typeof reportsData}`);
            console.log(`   Is Array: ${Array.isArray(reportsData)}`);
            console.log(`   Keys: ${typeof reportsData === 'object' ? Object.keys(reportsData) : 'N/A'}`);
            
            if (Array.isArray(reportsData)) {
                console.log(`   ✅ Array Length: ${reportsData.length}`);
                if (reportsData.length > 0) {
                    console.log(`   📄 Sample Report Keys: ${Object.keys(reportsData[0])}`);
                }
            } else if (typeof reportsData === 'object' && reportsData !== null) {
                console.log(`   ⚠️ Object Structure - Keys: ${Object.keys(reportsData)}`);
                // Check if it's wrapped in another property
                for (const key of Object.keys(reportsData)) {
                    if (Array.isArray(reportsData[key])) {
                        console.log(`   🔍 Found array in property "${key}": ${reportsData[key].length} items`);
                    }
                }
            }
        } else {
            const errorText = await reportsResponse.text();
            console.log(`❌ Reports Error: ${errorText.substring(0, 200)}`);
        }
        
        console.log('\n📡 Fetching analyses data...');
        const analysesResponse = await fetch(`/api/proxy/projects/${PROJECT_ID}/deep-dive-analyses`, {
            headers: { 'User-ID': USER_ID }
        });
        
        console.log(`📊 Analyses Response Status: ${analysesResponse.status}`);
        
        if (analysesResponse.ok) {
            const analysesData = await analysesResponse.json();
            console.log('🔍 Analyses Data Structure:');
            console.log(`   Type: ${typeof analysesData}`);
            console.log(`   Is Array: ${Array.isArray(analysesData)}`);
            console.log(`   Keys: ${typeof analysesData === 'object' ? Object.keys(analysesData) : 'N/A'}`);
            
            if (Array.isArray(analysesData)) {
                console.log(`   ✅ Array Length: ${analysesData.length}`);
                if (analysesData.length > 0) {
                    console.log(`   📄 Sample Analysis Keys: ${Object.keys(analysesData[0])}`);
                }
            } else if (typeof analysesData === 'object' && analysesData !== null) {
                console.log(`   ⚠️ Object Structure - Keys: ${Object.keys(analysesData)}`);
                // Check if it's wrapped in another property
                for (const key of Object.keys(analysesData)) {
                    if (Array.isArray(analysesData[key])) {
                        console.log(`   🔍 Found array in property "${key}": ${analysesData[key].length} items`);
                    }
                }
            }
        } else {
            const errorText = await analysesResponse.text();
            console.log(`❌ Analyses Error: ${errorText.substring(0, 200)}`);
        }
        
        console.log('\n📡 Fetching collections data...');
        const collectionsResponse = await fetch(`/api/proxy/projects/${PROJECT_ID}/collections`, {
            headers: { 'User-ID': USER_ID }
        });
        
        console.log(`📊 Collections Response Status: ${collectionsResponse.status}`);
        
        if (collectionsResponse.ok) {
            const collectionsData = await collectionsResponse.json();
            console.log('📚 Collections Data Structure:');
            console.log(`   Type: ${typeof collectionsData}`);
            console.log(`   Is Array: ${Array.isArray(collectionsData)}`);
            console.log(`   Length: ${Array.isArray(collectionsData) ? collectionsData.length : 'N/A'}`);
            
            if (Array.isArray(collectionsData) && collectionsData.length > 0) {
                console.log(`   📄 Sample Collection Keys: ${Object.keys(collectionsData[0])}`);
            }
        }
        
    } catch (error) {
        console.log(`❌ API Analysis Error: ${error.message}`);
    }
    
    // Test 4: DOM Content Analysis
    console.log('\n🔍 Test 4: DOM Content Analysis');
    console.log('-------------------------------');
    
    const bodyText = document.body.innerText;
    const hasReportText = bodyText.toLowerCase().includes('report');
    const hasAnalysisText = bodyText.toLowerCase().includes('analysis');
    const hasCollectionText = bodyText.toLowerCase().includes('collection');
    
    console.log(`📄 Page contains "report": ${hasReportText ? '✅ YES' : '❌ NO'}`);
    console.log(`🔍 Page contains "analysis": ${hasAnalysisText ? '✅ YES' : '❌ NO'}`);
    console.log(`📚 Page contains "collection": ${hasCollectionText ? '✅ YES' : '❌ NO'}`);
    
    // Test 5: React Component Detection
    console.log('\n⚛️ Test 5: React Component Detection');
    console.log('-----------------------------------');
    
    const reactRoot = document.querySelector('#__next') || document.querySelector('[data-reactroot]');
    console.log(`⚛️ React root found: ${reactRoot ? '✅ YES' : '❌ NO'}`);
    
    if (reactRoot) {
        const childElements = reactRoot.querySelectorAll('*').length;
        console.log(`📊 Total DOM elements in React app: ${childElements}`);
    }
    
    // Test 6: Recommendations
    console.log('\n🎯 DIAGNOSTIC RECOMMENDATIONS');
    console.log('============================');
    
    if (!isProjectPage) {
        console.log('1. 🔗 Navigate to the project workspace page');
        console.log(`   URL: https://frontend-psi-seven-85.vercel.app/project/${PROJECT_ID}`);
    }
    
    console.log('2. 🔄 Refresh the page after navigation');
    console.log('3. 🧪 Re-run the validation tests from the project page');
    console.log('4. 📊 Check if data loads after page refresh');
    
    return {
        pageContext: {
            url: window.location.href,
            isProjectPage,
            isCorrectProject
        },
        uiElements: {
            totalSelectors: selectors.length,
            foundElements: selectors.filter(s => document.querySelectorAll(s).length > 0).length
        },
        recommendations: !isProjectPage ? ['Navigate to project page'] : ['Data should be visible']
    };
}

// Make function globally available
window.diagnoseUIDataIntegration = diagnoseUIDataIntegration;

console.log('🔍 UI Data Integration Diagnostic loaded!');
console.log('Run: diagnoseUIDataIntegration()');
