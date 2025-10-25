/**
 * 🚀 QUICK TEST - Personalization Fix Validation
 * 
 * Fast test to verify personalization fixes are working.
 * Run this in browser console to quickly check if fixes are deployed.
 * 
 * Run on: https://frontend-psi-seven-85.vercel.app/projects/5ac213d7-6fcc-46ff-9420-5c7f4b421012
 */

console.log('🚀 QUICK TEST - Personalization Fix Validation');
console.log('='.repeat(80));

(async function quickTest() {
    const backendUrl = 'https://r-dagent-production.up.railway.app';
    const userId = 'test-user-comprehensive';
    
    console.log(`📋 Testing with User ID: ${userId}`);
    console.log(`📋 Using force_refresh=true to test new logic`);
    console.log('');
    
    try {
        // Get Weekly Mix with force_refresh
        console.log('⏳ Fetching Weekly Mix...');
        const response = await fetch(
            `${backendUrl}/api/v1/weekly-mix/current?force_refresh=true`,
            { headers: { 'User-ID': userId } }
        );
        
        if (!response.ok) {
            console.error(`❌ HTTP ${response.status}: ${response.statusText}`);
            return;
        }
        
        const data = await response.json();
        
        if (!data.papers || data.papers.length === 0) {
            console.error('❌ No papers in response');
            return;
        }
        
        console.log(`✅ Got ${data.papers.length} papers\n`);
        
        // Extract scores and explanations
        const scores = data.papers.map(p => p.score);
        const explanations = data.papers.map(p => p.explanation_text);
        
        // Calculate metrics
        const uniqueScores = new Set(scores).size;
        const uniqueExplanations = new Set(explanations).size;
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((sum, score) => 
            sum + Math.pow(score - mean, 2), 0) / scores.length;
        
        // Display results
        console.log('📊 RESULTS:');
        console.log('='.repeat(80));
        console.log(`Score Variance: ${variance.toFixed(4)} ${variance > 0.01 ? '✅' : '❌'} (target: > 0.01)`);
        console.log(`Unique Scores: ${uniqueScores}/${scores.length} ${uniqueScores >= 8 ? '✅' : '❌'} (target: >= 8)`);
        console.log(`Unique Explanations: ${uniqueExplanations}/${explanations.length} ${uniqueExplanations >= 9 ? '✅' : '❌'} (target: >= 9)`);
        console.log('');
        
        // Show sample scores
        console.log('📊 Sample Scores:');
        scores.slice(0, 5).forEach((score, idx) => {
            console.log(`   Paper ${idx + 1}: ${score.toFixed(4)}`);
        });
        console.log('');
        
        // Show sample explanations
        console.log('📋 Sample Explanations:');
        explanations.slice(0, 3).forEach((exp, idx) => {
            console.log(`   Paper ${idx + 1}: "${exp.substring(0, 80)}..."`);
        });
        console.log('');
        
        // Check for generic explanations
        const genericCount = explanations.filter(exp => 
            exp === "Recommended for you" || 
            exp.startsWith("This is a recent paper")
        ).length;
        
        if (genericCount > 0) {
            console.warn(`⚠️ WARNING: ${genericCount} papers have generic explanations`);
        } else {
            console.log('✅ No generic explanations found');
        }
        console.log('');
        
        // Overall verdict
        console.log('='.repeat(80));
        const allPass = variance > 0.01 && uniqueScores >= 8 && uniqueExplanations >= 9 && genericCount === 0;
        
        if (allPass) {
            console.log('🎉 SUCCESS! Personalization is working!');
            console.log('✅ All metrics pass');
            console.log('✅ Ready for production');
        } else {
            console.log('⚠️ ISSUES FOUND:');
            if (variance <= 0.01) console.log('   ❌ Score variance too low');
            if (uniqueScores < 8) console.log('   ❌ Not enough unique scores');
            if (uniqueExplanations < 9) console.log('   ❌ Not enough unique explanations');
            if (genericCount > 0) console.log('   ❌ Generic explanations present');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error);
    }
})();

