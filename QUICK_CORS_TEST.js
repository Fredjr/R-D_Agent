/**
 * QUICK CORS TEST
 * Test if CORS is now working after the fix
 */

console.log('🧪 QUICK CORS TEST');
console.log('='.repeat(80));

async function testCORS() {
    const backendUrl = 'https://r-dagent-production.up.railway.app';
    
    console.log('Testing CORS with simple GET request...');
    
    try {
        const response = await fetch(`${backendUrl}/api/test-app`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ CORS is working! Response:', data);
            return true;
        } else {
            console.log(`❌ Request failed with status: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ CORS Error: ${error.message}`);
        if (error.message.includes('CORS')) {
            console.log('⚠️  CORS is still blocking requests. Railway deployment may not be complete yet.');
        }
        return false;
    }
}

testCORS().then(success => {
    if (success) {
        console.log('\n✅ CORS is working! You can now run the comprehensive tests.');
        console.log('📋 Next: Run COMPLETE_ALL_SPRINTS_TEST.js');
    } else {
        console.log('\n❌ CORS is still not working. Wait a few more minutes for Railway deployment.');
    }
});

