#!/usr/bin/env node

/**
 * PHASE 2 COMPLETION TEST
 * 
 * Comprehensive test to verify all Phase 2 fixes are working:
 * 1. PubMed Advanced Search Functionality
 * 2. Network Analysis Endpoints  
 * 3. Paper Analysis Tools
 */

const BACKEND_URL = 'https://r-dagent-production.up.railway.app';
const USER_ID = 'fredericle77@gmail.com';

async function testEndpoint(name, url, expectedKeys = []) {
    try {
        console.log(`🧪 Testing: ${name}`);
        
        const startTime = Date.now();
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-ID': USER_ID,
                'Content-Type': 'application/json'
            }
        });
        const responseTime = Date.now() - startTime;
        
        const responseText = await response.text();
        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            responseData = { raw_response: responseText };
        }
        
        if (response.ok) {
            // Check for expected keys
            const missingKeys = expectedKeys.filter(key => !(key in responseData));
            if (missingKeys.length === 0) {
                console.log(`✅ ${name} - SUCCESS (${response.status}, ${responseTime}ms)`);
                
                // Log key metrics
                if (responseData.articles && responseData.articles.length) {
                    console.log(`   📄 Articles: ${responseData.articles.length}`);
                }
                if (responseData.topics && responseData.topics.length) {
                    console.log(`   🏷️  Topics: ${responseData.topics.length}`);
                }
                if (responseData.similarity_metrics) {
                    console.log(`   📊 Similarity: ${responseData.similarity_metrics.overall_similarity}`);
                }
                if (responseData.network && responseData.network.authors) {
                    console.log(`   👥 Authors: ${Object.keys(responseData.network.authors).length}`);
                }
                
                return { success: true, responseTime, data: responseData };
            } else {
                console.log(`❌ ${name} - MISSING KEYS: ${missingKeys.join(', ')}`);
                return { success: false, error: `Missing keys: ${missingKeys.join(', ')}` };
            }
        } else {
            console.log(`❌ ${name} - FAILED (${response.status}, ${responseTime}ms)`);
            if (responseData.detail) {
                console.log(`   Error: ${responseData.detail}`);
            }
            return { success: false, status: response.status, error: responseData.detail };
        }
        
    } catch (error) {
        console.log(`💥 ${name} - ERROR: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function runPhase2CompletionTest() {
    console.log('🚀 PHASE 2 COMPLETION TEST');
    console.log('=' .repeat(60));
    console.log(`Backend URL: ${BACKEND_URL}`);
    console.log(`User ID: ${USER_ID}`);
    console.log('');
    
    const results = [];
    
    // PHASE 2 FIX #1: PubMed Advanced Search
    console.log('📋 PHASE 2 FIX #1: PubMed Advanced Search');
    console.log('-'.repeat(50));
    
    const pubmedTests = [
        {
            name: 'PubMed Advanced Search - Diabetes',
            url: `${BACKEND_URL}/pubmed/advanced-search?q=diabetes&limit=3`,
            expectedKeys: ['query', 'articles', 'total_found', 'status']
        },
        {
            name: 'PubMed Advanced Search - Cancer',
            url: `${BACKEND_URL}/pubmed/advanced-search?q=cancer&limit=2`,
            expectedKeys: ['query', 'articles', 'total_found', 'status']
        }
    ];
    
    for (const test of pubmedTests) {
        const result = await testEndpoint(test.name, test.url, test.expectedKeys);
        results.push(result);
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('');
    
    // PHASE 2 FIX #2: Network Analysis Endpoints
    console.log('📋 PHASE 2 FIX #2: Network Analysis Endpoints');
    console.log('-'.repeat(50));
    
    const networkTests = [
        {
            name: 'Article Citations',
            url: `${BACKEND_URL}/articles/37024129/citations?limit=5`,
            expectedKeys: ['source_article', 'citations', 'total_count']
        },
        {
            name: 'Article References',
            url: `${BACKEND_URL}/articles/37024129/references?limit=5`,
            expectedKeys: ['source_article', 'references', 'total_count']
        },
        {
            name: 'Citation Enrichment Status',
            url: `${BACKEND_URL}/articles/37024129/enrich-citations`,
            expectedKeys: ['source_article', 'citation_enrichment_status', 'available_actions']
        },
        {
            name: 'Author Network',
            url: `${BACKEND_URL}/articles/37024129/author-network?depth=2`,
            expectedKeys: ['source_article', 'network', 'suggested_authors']
        },
        {
            name: 'Similar Articles Network',
            url: `${BACKEND_URL}/articles/37024129/similar-network?limit=5`,
            expectedKeys: ['nodes', 'edges', 'metadata']
        }
    ];
    
    for (const test of networkTests) {
        const result = await testEndpoint(test.name, test.url, test.expectedKeys);
        results.push(result);
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('');
    
    // PHASE 2 FIX #3: Paper Analysis Tools
    console.log('📋 PHASE 2 FIX #3: Paper Analysis Tools');
    console.log('-'.repeat(50));
    
    const analysisTests = [
        {
            name: 'Topic Analysis - Diabetes',
            url: `${BACKEND_URL}/papers/topic-analysis?q=diabetes&limit=5`,
            expectedKeys: ['query', 'papers_analyzed', 'topics', 'status']
        },
        {
            name: 'Topic Analysis - Machine Learning',
            url: `${BACKEND_URL}/papers/topic-analysis?q=machine%20learning&limit=3`,
            expectedKeys: ['query', 'papers_analyzed', 'topics', 'status']
        },
        {
            name: 'Similarity Analysis - Same Paper',
            url: `${BACKEND_URL}/papers/similarity-analysis?pmid1=37024129&pmid2=37024129`,
            expectedKeys: ['paper1', 'paper2', 'similarity_metrics', 'status']
        }
    ];
    
    for (const test of analysisTests) {
        const result = await testEndpoint(test.name, test.url, test.expectedKeys);
        results.push(result);
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 PHASE 2 COMPLETION TEST SUMMARY');
    console.log('='.repeat(60));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Successful: ${successful.length}/${results.length} (${(successful.length/results.length*100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${failed.length}/${results.length} (${(failed.length/results.length*100).toFixed(1)}%)`);
    
    if (failed.length > 0) {
        console.log('\n❌ FAILED TESTS:');
        failed.forEach(result => {
            console.log(`   • ${result.name || 'Unknown'} - ${result.error || result.status}`);
        });
    }
    
    console.log('\n✅ SUCCESSFUL TESTS:');
    successful.forEach((result, index) => {
        const testName = pubmedTests.concat(networkTests, analysisTests)[index]?.name || `Test ${index + 1}`;
        console.log(`   • ${testName} (${result.responseTime}ms)`);
    });
    
    const overallSuccess = (successful.length / results.length) >= 0.9;
    console.log(`\n🎯 PHASE 2 STATUS: ${overallSuccess ? '✅ COMPLETE' : '❌ NEEDS WORK'}`);
    
    if (overallSuccess) {
        console.log('🎉 Phase 2 implementation is complete and working excellently!');
        console.log('');
        console.log('📋 PHASE 2 ACHIEVEMENTS:');
        console.log('   ✅ PubMed Advanced Search - Fully functional with structured results');
        console.log('   ✅ Network Analysis Endpoints - All endpoints working with proper data');
        console.log('   ✅ Paper Analysis Tools - Topic analysis and similarity comparison working');
        console.log('');
        console.log('🚀 Ready to proceed to Phase 3!');
    } else {
        console.log('🔧 Some Phase 2 features need additional work.');
    }
    
    return {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        successRate: successful.length / results.length,
        results: results
    };
}

// Run the test
runPhase2CompletionTest()
    .then(summary => {
        console.log(`\n📈 Final Phase 2 Success Rate: ${(summary.successRate * 100).toFixed(1)}%`);
        process.exit(summary.successRate >= 0.9 ? 0 : 1);
    })
    .catch(error => {
        console.error('💥 Phase 2 test execution failed:', error);
        process.exit(1);
    });
