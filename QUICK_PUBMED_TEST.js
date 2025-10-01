/**
 * QUICK PUBMED ENDPOINT TEST
 * Test the PubMed recommendations endpoint to see if it's working
 */

async function testPubMedEndpoint() {
    console.log('🧪 Testing PubMed Recommendations Endpoint...');
    
    const tests = [
        {
            name: 'GET Trending',
            url: '/api/proxy/pubmed/recommendations?type=trending&limit=3',
            method: 'GET'
        },
        {
            name: 'GET Similar Papers',
            url: '/api/proxy/pubmed/recommendations?type=similar&pmid=29622564&limit=3',
            method: 'GET'
        },
        {
            name: 'POST Similar Papers',
            url: '/api/proxy/pubmed/recommendations',
            method: 'POST',
            body: {
                type: 'similar',
                pmid: '29622564',
                limit: 3
            }
        }
    ];
    
    for (const test of tests) {
        console.log(`\n🔍 Testing ${test.name}...`);
        
        try {
            const options = {
                method: test.method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': 'fredericle77@gmail.com'
                }
            };
            
            if (test.body) {
                options.body = JSON.stringify(test.body);
            }
            
            const response = await fetch(test.url, options);
            
            console.log(`Status: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Success!');
                console.log(`Type: ${data.type || 'unknown'}`);
                console.log(`Recommendations: ${data.recommendations?.length || 0}`);
                console.log(`Total Count: ${data.total_count || 0}`);
                if (data.recommendations && data.recommendations.length > 0) {
                    console.log(`First paper: ${data.recommendations[0].title}`);
                }
            } else {
                const errorText = await response.text();
                console.log('❌ Failed!');
                console.log(`Error: ${errorText}`);
            }
        } catch (error) {
            console.log('❌ Error!');
            console.log(`Error: ${error.message}`);
        }
    }
}

// Run the test
testPubMedEndpoint();
