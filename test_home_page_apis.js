/**
 * HOME PAGE API DIAGNOSTIC TEST
 * Tests the exact same API calls that the home page makes
 */

const axios = require('axios');

class HomePageAPIDiagnostic {
    constructor() {
        this.baseUrl = 'https://frontend-psi-seven-85.vercel.app';
        this.userId = 'fredericle77@gmail.com';
        this.results = [];
    }

    log(message, type = 'info', data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, type, message, data };
        this.results.push(logEntry);
        
        const emoji = {
            'info': 'ℹ️',
            'success': '✅',
            'error': '❌',
            'warning': '⚠️'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} [${timestamp}] ${message}`);
        if (data) {
            console.log('   Data:', JSON.stringify(data, null, 2));
        }
    }

    async testAPI(name, endpoint) {
        try {
            this.log(`Testing ${name}...`, 'info');
            
            const response = await axios.get(`${this.baseUrl}${endpoint}`, {
                headers: {
                    'User-ID': this.userId,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            const data = response.data;
            
            // Extract papers from different possible response formats
            const papers = data.papers || 
                          data.recommendations || 
                          data[name.toLowerCase().replace(/\s+/g, '_')] ||
                          (data.recommendations && data.recommendations[name.toLowerCase().replace(/\s+/g, '_')]) ||
                          [];

            this.log(`${name} SUCCESS`, 'success', {
                status: response.status,
                paperCount: Array.isArray(papers) ? papers.length : 0,
                responseKeys: Object.keys(data),
                firstPaper: Array.isArray(papers) && papers.length > 0 ? {
                    title: papers[0].title?.substring(0, 50) + '...',
                    authors: papers[0].authors,
                    pmid: papers[0].pmid
                } : null
            });

            return {
                success: true,
                paperCount: Array.isArray(papers) ? papers.length : 0,
                papers: papers,
                response: data
            };

        } catch (error) {
            this.log(`${name} FAILED`, 'error', {
                error: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText
            });

            return {
                success: false,
                error: error.message,
                status: error.response?.status
            };
        }
    }

    async runDiagnostic() {
        this.log('🏠 HOME PAGE API DIAGNOSTIC STARTING', 'info');
        this.log(`Testing APIs for user: ${this.userId}`, 'info');

        // Test all 4 APIs that the home page should call
        const apis = [
            {
                name: 'Cross Pollination',
                endpoint: `/api/proxy/recommendations/cross-pollination/${this.userId}`
            },
            {
                name: 'Trending',
                endpoint: `/api/proxy/recommendations/trending/${this.userId}`
            },
            {
                name: 'Papers For You',
                endpoint: `/api/proxy/recommendations/papers-for-you/${this.userId}`
            },
            {
                name: 'Citation Opportunities',
                endpoint: `/api/proxy/recommendations/citation-opportunities/${this.userId}`
            }
        ];

        const results = {};
        
        for (const api of apis) {
            const result = await this.testAPI(api.name, api.endpoint);
            results[api.name] = result;
            
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Summary
        this.log('📊 DIAGNOSTIC SUMMARY', 'info');
        
        let totalPapers = 0;
        let successfulAPIs = 0;
        
        for (const [name, result] of Object.entries(results)) {
            if (result.success) {
                successfulAPIs++;
                totalPapers += result.paperCount || 0;
                this.log(`✅ ${name}: ${result.paperCount} papers`, 'success');
            } else {
                this.log(`❌ ${name}: FAILED (${result.error})`, 'error');
            }
        }

        this.log(`🎯 FINAL RESULTS`, 'info', {
            successfulAPIs: `${successfulAPIs}/4`,
            totalPapers: totalPapers,
            citationOpportunitiesWorking: results['Citation Opportunities']?.success || false,
            citationOpportunitiesPapers: results['Citation Opportunities']?.paperCount || 0
        });

        // Specific Citation Opportunities analysis
        if (results['Citation Opportunities']?.success) {
            if (results['Citation Opportunities'].paperCount > 0) {
                this.log('🎉 Citation Opportunities API is working and returning papers!', 'success');
                this.log('   This means the section should appear on the home page.', 'info');
            } else {
                this.log('⚠️ Citation Opportunities API works but returns 0 papers', 'warning');
                this.log('   This explains why the section is not visible.', 'info');
            }
        } else {
            this.log('❌ Citation Opportunities API is failing', 'error');
            this.log('   This explains why the section is missing.', 'info');
        }

        return results;
    }
}

// Run the diagnostic
async function main() {
    const diagnostic = new HomePageAPIDiagnostic();
    await diagnostic.runDiagnostic();
}

main().catch(console.error);
