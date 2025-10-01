#!/usr/bin/env node

/**
 * PHASE 2 FIX #2: Network Analysis Endpoints Comprehensive Test
 * 
 * This script tests all network analysis endpoints to verify they are working
 * and identify any missing endpoints that need to be implemented.
 */

const BACKEND_URL = 'https://r-dagent-production.up.railway.app';
const USER_ID = 'fredericle77@gmail.com';

// Test PMIDs that should exist in the database
const TEST_PMIDS = [
    '37024129', // Diabetes paper from previous tests
    '28123456', // Test PMID from comprehensive tests
    '32511222'  // COVID paper from previous tests
];

const networkEndpoints = [
    // Citation Analysis
    { path: '/articles/{pmid}/citations', name: 'Article Citations' },
    { path: '/articles/{pmid}/references', name: 'Article References' },
    { path: '/articles/{pmid}/enrich-citations', name: 'Enrich Citations' },
    
    // Author Networks
    { path: '/articles/{pmid}/authors', name: 'Article Authors' },
    { path: '/articles/{pmid}/author-network', name: 'Author Network' },
    
    // Similarity Networks
    { path: '/articles/{pmid}/similar-network', name: 'Similar Articles Network' },
    
    // Collection Networks
    { path: '/collections/{collection_id}/enrich-citations', name: 'Collection Citation Enrichment' },
    
    // Test endpoints
    { path: '/test-citation-endpoint', name: 'Citation Test Endpoint' },
    { path: '/test-author-endpoint', name: 'Author Test Endpoint' }
];

async function testEndpoint(endpoint, pmid = null, collectionId = null) {
    try {
        let url = `${BACKEND_URL}${endpoint.path}`;
        
        // Replace placeholders
        if (pmid) {
            url = url.replace('{pmid}', pmid);
        }
        if (collectionId) {
            url = url.replace('{collection_id}', collectionId);
        }
        
        // Add query parameters for some endpoints
        if (endpoint.path.includes('citations') || endpoint.path.includes('references')) {
            url += '?limit=5';
        }
        if (endpoint.path.includes('author-network')) {
            url += '?depth=2&min_collaboration_strength=0.1';
        }
        if (endpoint.path.includes('similar-network')) {
            url += '?limit=5&min_similarity=0.1';
        }
        
        console.log(`🧪 Testing: ${endpoint.name} - ${url}`);
        
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
        
        const result = {
            endpoint: endpoint.name,
            url: url,
            status: response.status,
            responseTime: `${responseTime}ms`,
            success: response.ok,
            pmid: pmid,
            dataSize: responseText.length
        };
        
        if (response.ok) {
            console.log(`✅ ${endpoint.name} - SUCCESS (${response.status}, ${responseTime}ms)`);
            
            // Log key data points
            if (responseData.total_count !== undefined) {
                console.log(`   📊 Total Count: ${responseData.total_count}`);
            }
            if (responseData.network && responseData.network.authors) {
                console.log(`   👥 Authors Found: ${Object.keys(responseData.network.authors).length}`);
            }
            if (responseData.nodes) {
                console.log(`   🔗 Network Nodes: ${responseData.nodes.length}`);
            }
            if (responseData.similar_articles) {
                console.log(`   🔍 Similar Articles: ${responseData.similar_articles.length}`);
            }
            
        } else {
            console.log(`❌ ${endpoint.name} - FAILED (${response.status}, ${responseTime}ms)`);
            if (responseData.detail) {
                console.log(`   Error: ${responseData.detail}`);
            }
        }
        
        return result;
        
    } catch (error) {
        console.log(`💥 ${endpoint.name} - ERROR: ${error.message}`);
        return {
            endpoint: endpoint.name,
            url: url || 'unknown',
            status: 'ERROR',
            responseTime: '0ms',
            success: false,
            error: error.message,
            pmid: pmid
        };
    }
}

async function runNetworkEndpointTests() {
    console.log('🚀 PHASE 2 FIX #2: Network Analysis Endpoints Test');
    console.log('=' .repeat(60));
    console.log(`Backend URL: ${BACKEND_URL}`);
    console.log(`User ID: ${USER_ID}`);
    console.log(`Test PMIDs: ${TEST_PMIDS.join(', ')}`);
    console.log('');
    
    const results = [];
    
    // Test endpoints that don't require PMIDs first
    const testEndpoints = networkEndpoints.filter(e => e.path.includes('test-'));
    for (const endpoint of testEndpoints) {
        const result = await testEndpoint(endpoint);
        results.push(result);
    }
    
    console.log('');
    
    // Test PMID-based endpoints
    const pmidEndpoints = networkEndpoints.filter(e => e.path.includes('{pmid}'));
    for (const pmid of TEST_PMIDS) {
        console.log(`\n📋 Testing PMID: ${pmid}`);
        console.log('-'.repeat(40));
        
        for (const endpoint of pmidEndpoints) {
            const result = await testEndpoint(endpoint, pmid);
            results.push(result);
            
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 NETWORK ENDPOINTS TEST SUMMARY');
    console.log('='.repeat(60));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Successful: ${successful.length}/${results.length} (${(successful.length/results.length*100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${failed.length}/${results.length} (${(failed.length/results.length*100).toFixed(1)}%)`);
    
    if (failed.length > 0) {
        console.log('\n❌ FAILED ENDPOINTS:');
        failed.forEach(result => {
            console.log(`   • ${result.endpoint} (${result.status}) - ${result.url}`);
            if (result.error) {
                console.log(`     Error: ${result.error}`);
            }
        });
    }
    
    console.log('\n✅ SUCCESSFUL ENDPOINTS:');
    successful.forEach(result => {
        console.log(`   • ${result.endpoint} (${result.status}, ${result.responseTime})`);
    });
    
    const overallSuccess = (successful.length / results.length) >= 0.8;
    console.log(`\n🎯 PHASE 2 FIX #2 STATUS: ${overallSuccess ? '✅ SUCCESS' : '❌ NEEDS WORK'}`);
    
    if (overallSuccess) {
        console.log('🎉 Network Analysis Endpoints are working well!');
    } else {
        console.log('🔧 Some network endpoints need attention.');
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
runNetworkEndpointTests()
    .then(summary => {
        console.log(`\n📈 Final Success Rate: ${(summary.successRate * 100).toFixed(1)}%`);
        process.exit(summary.successRate >= 0.8 ? 0 : 1);
    })
    .catch(error => {
        console.error('💥 Test execution failed:', error);
        process.exit(1);
    });
