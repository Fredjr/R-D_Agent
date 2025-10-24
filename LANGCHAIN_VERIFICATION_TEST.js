/**
 * 🚀 LANGCHAIN VERIFICATION TEST
 * Tests if LangChain is working and content generation is restored
 */

class LangChainVerificationTest {
    constructor() {
        this.baseUrl = 'https://frontend-psi-seven-85.vercel.app/api/proxy';
        this.userId = 'e29e29d3-f87f-4c70-9aeb-424002382195';
        this.projectId = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
        this.results = [];
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logMessage = `${timestamp} [${type.toUpperCase()}] ${message}`;
        console.log(logMessage);
        this.results.push({ timestamp, type, message });
    }

    async makeRequest(endpoint, data) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.userId
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            return {
                ok: response.ok,
                status: response.status,
                data: result
            };
        } catch (error) {
            return {
                ok: false,
                status: 0,
                error: error.message
            };
        }
    }

    async testGenerateReview() {
        this.log('🧪 Testing Generate Review with Finerenone...');
        
        const data = {
            project_id: this.projectId,
            molecule: "Finerenone",
            objective: "Summarize the inflammatory mechanism of aldosterone and the anti-inflammatory mechanism of finerenone in the HFpEF",
            review_type: "systematic",
            academic_level: "phd",
            include_methodology: true,
            target_length: 3000
        };

        const result = await this.makeRequest('/generate-review', data);
        
        if (result.ok && result.data) {
            // Extract content from results array
            let content = '';
            if (result.data.results && Array.isArray(result.data.results)) {
                content = result.data.results.map(r => r.result || r.content || '').join(' ');
            }
            
            const contentLength = content.length;
            const hasFinerenone = content.toLowerCase().includes('finerenone');
            const hasAldosterone = content.toLowerCase().includes('aldosterone');
            const hasInflammatory = content.toLowerCase().includes('inflammatory');
            
            this.log(`✅ Generate Review SUCCESS: ${contentLength} chars`, 'success');
            this.log(`   Keywords: Finerenone=${hasFinerenone}, Aldosterone=${hasAldosterone}, Inflammatory=${hasInflammatory}`);
            
            if (contentLength > 500 && hasFinerenone && hasAldosterone) {
                this.log('🎉 LANGCHAIN WORKING: Generate Review producing quality content!', 'success');
                return true;
            } else {
                this.log('⚠️ Content quality issues: Short or missing keywords', 'warning');
                return false;
            }
        } else {
            this.log(`❌ Generate Review FAILED: ${result.status} - ${result.error || JSON.stringify(result.data)}`, 'error');
            return false;
        }
    }

    async testDeepDive() {
        this.log('🧪 Testing Deep Dive with PMID 33099609...');
        
        const data = {
            project_id: this.projectId,
            pmid: '33099609',
            objective: "Deep dive analysis of finerenone cardiovascular outcomes study",
            analysis_depth: "comprehensive",
            include_methodology: true,
            include_citations: true
        };

        const result = await this.makeRequest('/deep-dive', data);
        
        if (result.ok && result.data) {
            // Extract content from various analysis fields
            let content = '';
            if (result.data.scientific_model_analysis) {
                content += result.data.scientific_model_analysis;
            }
            if (result.data.experimental_methods_analysis) {
                content += ' ' + result.data.experimental_methods_analysis;
            }
            if (result.data.results_interpretation_analysis) {
                content += ' ' + result.data.results_interpretation_analysis;
            }
            
            const contentLength = content.length;
            const hasFinerenone = content.toLowerCase().includes('finerenone');
            const hasCardiovascular = content.toLowerCase().includes('cardiovascular');
            
            this.log(`✅ Deep Dive SUCCESS: ${contentLength} chars`, 'success');
            this.log(`   Keywords: Finerenone=${hasFinerenone}, Cardiovascular=${hasCardiovascular}`);
            
            if (contentLength > 300 && (hasFinerenone || hasCardiovascular)) {
                this.log('🎉 LANGCHAIN WORKING: Deep Dive producing quality content!', 'success');
                return true;
            } else {
                this.log('⚠️ Content quality issues: Short or missing keywords', 'warning');
                return false;
            }
        } else {
            this.log(`❌ Deep Dive FAILED: ${result.status} - ${result.error || JSON.stringify(result.data)}`, 'error');
            return false;
        }
    }

    async testPhdEndpoint() {
        this.log('🧪 Testing PhD Generate Summary...');
        
        const data = {
            project_id: this.projectId,
            objective: "Test PhD content generation with LangChain",
            academic_level: "phd",
            summary_type: "comprehensive",
            include_methodology: true,
            target_length: 2000
        };

        const result = await this.makeRequest('/phd/generate-summary', data);
        
        if (result.ok && result.data) {
            const content = result.data.summary_content || '';
            const contentLength = content.length;
            
            this.log(`✅ PhD Generate Summary SUCCESS: ${contentLength} chars`, 'success');
            
            if (contentLength > 200) {
                this.log('🎉 LANGCHAIN WORKING: PhD endpoints producing content!', 'success');
                return true;
            } else {
                this.log('⚠️ PhD content too short', 'warning');
                return false;
            }
        } else {
            this.log(`❌ PhD Generate Summary FAILED: ${result.status} - ${result.error || JSON.stringify(result.data)}`, 'error');
            return false;
        }
    }

    async runAllTests() {
        this.log('🚀 STARTING LANGCHAIN VERIFICATION TEST');
        this.log('================================================================================');
        this.log('Testing if LangChain is enabled and content generation is working...');
        this.log('');

        const tests = [
            { name: 'Generate Review', test: () => this.testGenerateReview() },
            { name: 'Deep Dive', test: () => this.testDeepDive() },
            { name: 'PhD Endpoint', test: () => this.testPhdEndpoint() }
        ];

        let passedTests = 0;
        const totalTests = tests.length;

        for (const { name, test } of tests) {
            try {
                const passed = await test();
                if (passed) {
                    passedTests++;
                }
                this.log('');
            } catch (error) {
                this.log(`❌ ${name} ERROR: ${error.message}`, 'error');
                this.log('');
            }
        }

        // Final Results
        this.log('================================================================================');
        this.log('🎯 LANGCHAIN VERIFICATION RESULTS:');
        this.log(`✅ Tests Passed: ${passedTests}/${totalTests}`);
        
        if (passedTests === totalTests) {
            this.log('🎉 SUCCESS: LangChain is working! All content generation restored!', 'success');
        } else if (passedTests > 0) {
            this.log('⚠️ PARTIAL: Some endpoints working, others may need more time to deploy', 'warning');
        } else {
            this.log('❌ FAILURE: LangChain still not working. Check deployment logs.', 'error');
        }
        
        this.log('');
        this.log('💡 TIP: If tests are still failing, wait 2-3 minutes for Railway deployment to complete');
        this.log('💡 Then re-run: copy and paste this script in browser console again');
        
        return passedTests === totalTests;
    }
}

// Auto-run the test
const langchainTest = new LangChainVerificationTest();
langchainTest.runAllTests().then(success => {
    if (success) {
        console.log('🎉 ALL TESTS PASSED - LANGCHAIN IS WORKING!');
    } else {
        console.log('⚠️ Some tests failed - may need more deployment time');
    }
});
