/**
 * QUICK API ENDPOINT VERIFICATION SCRIPT
 * 
 * This is a simplified script to quickly test individual API endpoints
 * Use this if the main comprehensive test is too complex or fails
 * 
 * Usage: Copy and paste into browser console on frontend-psi-seven-85.vercel.app
 */

class QuickAPITester {
    constructor() {
        this.userId = 'fredericle77@gmail.com';
        this.baseUrl = 'https://frontend-psi-seven-85.vercel.app';
    }

    async testEndpoint(name, url, expectedFields = []) {
        console.log(`\n🧪 Testing ${name}...`);
        console.log(`📡 URL: ${url}`);
        
        try {
            const startTime = Date.now();
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.userId
                }
            });
            
            const responseTime = Date.now() - startTime;
            const data = await response.json();
            
            console.log(`⏱️ Response time: ${responseTime}ms`);
            console.log(`📊 Status: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
                console.log(`❌ ${name} FAILED:`, data);
                return { success: false, error: data };
            }
            
            // Check data structure
            if (data.papers && Array.isArray(data.papers)) {
                console.log(`✅ ${name} SUCCESS: ${data.papers.length} papers returned`);
                
                if (data.papers.length > 0) {
                    const firstPaper = data.papers[0];
                    console.log(`📄 Sample paper:`, {
                        pmid: firstPaper.pmid,
                        title: firstPaper.title?.substring(0, 60) + '...',
                        category: firstPaper.category
                    });
                    
                    // Check expected fields
                    const missingFields = expectedFields.filter(field => !(field in firstPaper));
                    if (missingFields.length === 0) {
                        console.log(`✅ All expected fields present`);
                    } else {
                        console.log(`⚠️ Missing fields: ${missingFields.join(', ')}`);
                    }
                }
                
                return { success: true, data, paperCount: data.papers.length };
            } else if (data.recommendations) {
                // Weekly recommendations format
                const sections = ['papers_for_you', 'trending_in_field', 'cross_pollination', 'citation_opportunities'];
                const counts = {};
                let totalPapers = 0;
                
                sections.forEach(section => {
                    if (data.recommendations[section] && Array.isArray(data.recommendations[section])) {
                        counts[section] = data.recommendations[section].length;
                        totalPapers += data.recommendations[section].length;
                    }
                });
                
                console.log(`✅ ${name} SUCCESS: ${totalPapers} total papers`);
                console.log(`📊 Section counts:`, counts);
                
                return { success: true, data, sectionCounts: counts, totalPapers };
            } else {
                console.log(`⚠️ ${name} returned unexpected format:`, data);
                return { success: false, error: 'Unexpected response format' };
            }
            
        } catch (error) {
            console.log(`❌ ${name} ERROR:`, error.message);
            return { success: false, error: error.message };
        }
    }

    async testSemanticEndpoint(name, url, payload) {
        console.log(`\n🧠 Testing ${name}...`);
        console.log(`📡 URL: ${url}`);
        console.log(`📝 Payload:`, payload);
        
        try {
            const startTime = Date.now();
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.userId
                },
                body: JSON.stringify(payload)
            });
            
            const responseTime = Date.now() - startTime;
            const data = await response.json();
            
            console.log(`⏱️ Response time: ${responseTime}ms`);
            console.log(`📊 Status: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
                console.log(`❌ ${name} FAILED:`, data);
                return { success: false, error: data };
            }
            
            console.log(`✅ ${name} SUCCESS`);
            console.log(`📄 Response structure:`, {
                hasAnalysis: !!data.analysis,
                hasPapers: !!data.papers,
                hasRelatedPapers: !!data.related_papers,
                paperCount: data.papers?.length || 0,
                relatedPaperCount: data.related_papers?.length || 0
            });
            
            return { success: true, data };
            
        } catch (error) {
            console.log(`❌ ${name} ERROR:`, error.message);
            return { success: false, error: error.message };
        }
    }

    async runQuickTests() {
        console.log('🚀 QUICK API ENDPOINT VERIFICATION');
        console.log('==================================');
        console.log(`👤 Testing with user: ${this.userId}`);
        
        const results = {};
        
        // Test 1: Weekly Recommendations (Global Deduplication)
        results.weekly = await this.testEndpoint(
            'Weekly Recommendations',
            `/api/proxy/recommendations/weekly/${encodeURIComponent(this.userId)}`
        );
        
        // Test 2: Trending Recommendations
        results.trending = await this.testEndpoint(
            'Trending Recommendations',
            `/api/proxy/recommendations/trending/${encodeURIComponent(this.userId)}`,
            ['pmid', 'title', 'trending_score']
        );
        
        // Test 3: Papers For You
        results.papersForYou = await this.testEndpoint(
            'Papers For You',
            `/api/proxy/recommendations/papers-for-you/${encodeURIComponent(this.userId)}?limit=5`,
            ['pmid', 'title', 'relevance_score']
        );
        
        // Test 4: Cross-Domain Discoveries
        results.crossDomain = await this.testEndpoint(
            'Cross-Domain Discoveries',
            `/api/proxy/recommendations/cross-pollination/${encodeURIComponent(this.userId)}`,
            ['pmid', 'title', 'cross_pollination_score']
        );
        
        // Test 5: Semantic Generate-Review
        results.semanticGenReview = await this.testSemanticEndpoint(
            'Semantic Generate-Review',
            '/api/proxy/generate-review-semantic',
            {
                molecule: 'CRISPR gene editing',
                semantic_expansion: true,
                domain_focus: ['genetics', 'biotechnology'],
                cross_domain_exploration: true,
                fullTextOnly: false
            }
        );
        
        // Test 6: Semantic Deep-Dive
        results.semanticDeepDive = await this.testSemanticEndpoint(
            'Semantic Deep-Dive',
            '/api/proxy/deep-dive-semantic',
            {
                pmid: '32887946',
                semantic_context: true,
                find_related_papers: true,
                cross_domain_analysis: true
            }
        );
        
        // Summary
        console.log('\n📊 QUICK TEST SUMMARY');
        console.log('====================');
        
        const successCount = Object.values(results).filter(r => r.success).length;
        const totalTests = Object.keys(results).length;
        
        console.log(`✅ Successful tests: ${successCount}/${totalTests}`);
        
        Object.entries(results).forEach(([test, result]) => {
            const status = result.success ? '✅' : '❌';
            console.log(`${status} ${test}: ${result.success ? 'PASS' : 'FAIL'}`);
            if (!result.success) {
                console.log(`   Error: ${result.error}`);
            }
        });
        
        // Deduplication check for weekly recommendations
        if (results.weekly.success && results.weekly.data.recommendations) {
            console.log('\n🔄 DEDUPLICATION CHECK');
            console.log('=====================');
            
            const recs = results.weekly.data.recommendations;
            const allPmids = [];
            
            ['papers_for_you', 'trending_in_field', 'cross_pollination', 'citation_opportunities'].forEach(section => {
                if (recs[section] && Array.isArray(recs[section])) {
                    const pmids = recs[section].map(p => p.pmid).filter(Boolean);
                    allPmids.push(...pmids);
                }
            });
            
            const uniquePmids = [...new Set(allPmids)];
            const duplicateCount = allPmids.length - uniquePmids.length;
            
            if (duplicateCount === 0) {
                console.log(`✅ DEDUPLICATION SUCCESS: No duplicates found`);
                console.log(`📊 Total papers: ${allPmids.length}, All unique: ${uniquePmids.length}`);
            } else {
                console.log(`❌ DEDUPLICATION FAILED: ${duplicateCount} duplicates found`);
                console.log(`📊 Total papers: ${allPmids.length}, Unique: ${uniquePmids.length}`);
            }
        }
        
        // Store results globally for inspection
        window.quickTestResults = results;
        console.log('\n🔍 Results stored in window.quickTestResults for detailed inspection');
        
        return results;
    }
}

// Auto-execute
console.log('🧪 QUICK API ENDPOINT VERIFICATION SCRIPT');
console.log('==========================================');

const quickTester = new QuickAPITester();
quickTester.runQuickTests();
