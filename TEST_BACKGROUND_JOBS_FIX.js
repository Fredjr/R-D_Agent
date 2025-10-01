// Test script to verify background job fixes
console.log('🧪 Testing Background Job Fixes...');

const BASE_URL = 'https://rd-agent-backend-production.up.railway.app';

async function testBackgroundJobs() {
    console.log('\n🚀 TESTING BACKGROUND JOB FIXES');
    console.log('================================');
    
    try {
        // Test 1: Generate Review Job
        console.log('\n🧪 Test 1: Generate Review Job...');
        const reviewResponse = await fetch(`${BASE_URL}/background-jobs/generate-review`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-ID': 'fredericle77@gmail.com'
            },
            body: JSON.stringify({
                project_id: '5ac213d7-6fcc-46ff-9420-5c7f4b421012',
                molecule: 'aspirin',
                objective: 'cardiovascular benefits analysis',
                max_results: 5
            })
        });
        
        if (reviewResponse.ok) {
            const reviewData = await reviewResponse.json();
            console.log('✅ Generate Review Job Created:', reviewData.job_id);
            
            // Wait and check status
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const statusResponse = await fetch(`${BASE_URL}/background-jobs/${reviewData.job_id}/status`, {
                headers: { 'User-ID': 'fredericle77@gmail.com' }
            });
            
            if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                console.log('📊 Job Status:', statusData.status);
                console.log('📊 Progress:', statusData.progress);
                if (statusData.error_message) {
                    console.log('❌ Error:', statusData.error_message);
                }
            }
        } else {
            console.log('❌ Generate Review Job Failed:', reviewResponse.status);
        }
        
        // Test 2: Deep Dive Job
        console.log('\n🧪 Test 2: Deep Dive Job...');
        const deepDiveResponse = await fetch(`${BASE_URL}/background-jobs/deep-dive`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-ID': 'fredericle77@gmail.com'
            },
            body: JSON.stringify({
                project_id: '5ac213d7-6fcc-46ff-9420-5c7f4b421012',
                pmid: '32511222',
                article_title: 'COVID-19 Research Analysis'
            })
        });
        
        if (deepDiveResponse.ok) {
            const deepDiveData = await deepDiveResponse.json();
            console.log('✅ Deep Dive Job Created:', deepDiveData.job_id);
            
            // Wait and check status
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const statusResponse = await fetch(`${BASE_URL}/background-jobs/${deepDiveData.job_id}/status`, {
                headers: { 'User-ID': 'fredericle77@gmail.com' }
            });
            
            if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                console.log('📊 Job Status:', statusData.status);
                console.log('📊 Progress:', statusData.progress);
                if (statusData.error_message) {
                    console.log('❌ Error:', statusData.error_message);
                }
            }
        } else {
            console.log('❌ Deep Dive Job Failed:', deepDiveResponse.status);
        }
        
        // Test 3: Edge case with empty data (should use fallbacks)
        console.log('\n🧪 Test 3: Edge Case - Empty Data...');
        const edgeResponse = await fetch(`${BASE_URL}/background-jobs/generate-review`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-ID': 'fredericle77@gmail.com'
            },
            body: JSON.stringify({
                project_id: '5ac213d7-6fcc-46ff-9420-5c7f4b421012',
                molecule: '',
                objective: '',
                max_results: 3
            })
        });
        
        if (edgeResponse.ok) {
            const edgeData = await edgeResponse.json();
            console.log('✅ Edge Case Job Created:', edgeData.job_id);
            
            // Wait and check status
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const statusResponse = await fetch(`${BASE_URL}/background-jobs/${edgeData.job_id}/status`, {
                headers: { 'User-ID': 'fredericle77@gmail.com' }
            });
            
            if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                console.log('📊 Edge Case Status:', statusData.status);
                console.log('📊 Progress:', statusData.progress);
                if (statusData.error_message) {
                    console.log('❌ Error:', statusData.error_message);
                }
            }
        } else {
            console.log('❌ Edge Case Job Failed:', edgeResponse.status);
        }
        
    } catch (error) {
        console.error('❌ Test Error:', error.message);
    }
}

// Run the test
testBackgroundJobs().then(() => {
    console.log('\n🎯 Background Job Fix Test Complete!');
}).catch(error => {
    console.error('❌ Test Failed:', error);
});
