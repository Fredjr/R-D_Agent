// Quick test for background jobs
const BASE_URL = 'https://rd-agent-backend-production.up.railway.app';

async function testJob() {
    try {
        console.log('🧪 Testing Generate Review Job...');
        const response = await fetch(`${BASE_URL}/background-jobs/generate-review`, {
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
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Job Created:', data.job_id);
            
            // Check status after 5 seconds
            setTimeout(async () => {
                const statusResponse = await fetch(`${BASE_URL}/background-jobs/${data.job_id}/status`, {
                    headers: { 'User-ID': 'fredericle77@gmail.com' }
                });
                
                if (statusResponse.ok) {
                    const statusData = await statusResponse.json();
                    console.log('📊 Status:', statusData.status);
                    console.log('📊 Progress:', statusData.progress);
                    if (statusData.error_message) {
                        console.log('❌ Error:', statusData.error_message);
                    }
                }
            }, 5000);
        } else {
            console.log('❌ Failed:', response.status, await response.text());
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testJob();
