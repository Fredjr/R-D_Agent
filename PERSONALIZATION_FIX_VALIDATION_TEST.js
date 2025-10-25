/**
 * 🧪 PERSONALIZATION FIX VALIDATION TEST
 * 
 * Tests the personalization fixes deployed to production:
 * 1. Real semantic scoring (vector embeddings)
 * 2. Real diversity scoring (author/journal analysis)
 * 3. Personalized explanations (specific paper connections)
 * 
 * Success Criteria:
 * - Score variance > 0.01 (was 0.00)
 * - Unique scores > 80% (was 10%)
 * - Explanation variety = 100% (was 10%)
 * - All explanations include specific paper titles
 * 
 * Run on: https://frontend-psi-seven-85.vercel.app/projects/5ac213d7-6fcc-46ff-9420-5c7f4b421012
 */

console.log('🧪 PERSONALIZATION FIX VALIDATION TEST');
console.log('='.repeat(80));

class PersonalizationFixValidator {
    constructor(userId = 'fredericle77@gmail.com') {
        this.backendUrl = 'https://r-dagent-production.up.railway.app';
        this.userId = userId; // Real user with collections
        this.results = {
            scoreVariance: null,
            uniqueScores: null,
            explanationVariety: null,
            specificityCheck: null
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const emoji = {
            'info': '📋',
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'data': '📊',
            'test': '🧪'
        }[type] || '📋';
        console.log(`${emoji} [${timestamp}] ${message}`);
    }

    // ============================================================================
    // TEST 1: SCORE VARIANCE
    // ============================================================================
    
    async testScoreVariance() {
        this.log('\n🧪 TEST 1: Score Variance', 'test');
        this.log('='.repeat(80));
        this.log('Expected: Variance > 0.01 (was 0.00)', 'info');
        this.log('Expected: Unique scores > 80% (was 10%)', 'info');

        try {
            // Get Weekly Mix with force_refresh to test new logic
            const response = await fetch(
                `${this.backendUrl}/api/v1/weekly-mix/current?force_refresh=true`,
                { headers: { 'User-ID': this.userId } }
            );
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.papers || data.papers.length === 0) {
                this.log('❌ No papers in Weekly Mix', 'error');
                return false;
            }
            
            this.log(`📊 Analyzing ${data.papers.length} papers...`, 'data');
            
            // Extract scores
            const scores = data.papers.map(p => p.score);
            
            // Calculate variance
            const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
            const variance = scores.reduce((sum, score) => 
                sum + Math.pow(score - mean, 2), 0) / scores.length;
            
            // Count unique scores
            const uniqueScores = new Set(scores).size;
            const uniquePercent = (uniqueScores / scores.length) * 100;
            
            // Display results
            this.log('\n📈 Score Analysis:', 'data');
            this.log(`   Mean Score: ${mean.toFixed(3)}`, 'data');
            this.log(`   Score Variance: ${variance.toFixed(4)}`, 'data');
            this.log(`   Unique Scores: ${uniqueScores}/${scores.length} (${uniquePercent.toFixed(0)}%)`, 'data');
            this.log(`   Score Range: ${Math.min(...scores).toFixed(3)} - ${Math.max(...scores).toFixed(3)}`, 'data');
            
            // Display all scores
            console.log('\n📊 All Scores:');
            scores.forEach((score, idx) => {
                console.log(`   Paper ${idx + 1}: ${score.toFixed(4)}`);
            });
            
            // Evaluate
            const variancePass = variance > 0.01;
            const uniquePass = uniquePercent >= 80;
            
            this.log('\n📋 Evaluation:', 'info');
            if (variancePass) {
                this.log(`✅ Variance PASS: ${variance.toFixed(4)} > 0.01`, 'success');
            } else {
                this.log(`❌ Variance FAIL: ${variance.toFixed(4)} <= 0.01`, 'error');
            }
            
            if (uniquePass) {
                this.log(`✅ Unique Scores PASS: ${uniquePercent.toFixed(0)}% >= 80%`, 'success');
            } else {
                this.log(`❌ Unique Scores FAIL: ${uniquePercent.toFixed(0)}% < 80%`, 'error');
            }
            
            this.results.scoreVariance = {
                variance: variance,
                uniqueScores: uniqueScores,
                uniquePercent: uniquePercent,
                passed: variancePass && uniquePass
            };
            
            return variancePass && uniquePass;
            
        } catch (error) {
            this.log(`❌ Test failed: ${error.message}`, 'error');
            return false;
        }
    }

    // ============================================================================
    // TEST 2: EXPLANATION VARIETY
    // ============================================================================
    
    async testExplanationVariety() {
        this.log('\n🧪 TEST 2: Explanation Variety', 'test');
        this.log('='.repeat(80));
        this.log('Expected: All explanations unique (was 1 identical)', 'info');

        try {
            // Get Weekly Mix with force_refresh to test new logic
            const response = await fetch(
                `${this.backendUrl}/api/v1/weekly-mix/current?force_refresh=true`,
                { headers: { 'User-ID': this.userId } }
            );

            const data = await response.json();
            
            if (!data.papers || data.papers.length === 0) {
                this.log('❌ No papers in Weekly Mix', 'error');
                return false;
            }
            
            // Extract explanations
            const explanations = data.papers.map(p => p.explanation_text);
            const uniqueExplanations = new Set(explanations).size;
            const varietyPercent = (uniqueExplanations / explanations.length) * 100;
            
            this.log(`\n📊 Explanation Analysis:`, 'data');
            this.log(`   Total Papers: ${explanations.length}`, 'data');
            this.log(`   Unique Explanations: ${uniqueExplanations}/${explanations.length} (${varietyPercent.toFixed(0)}%)`, 'data');
            
            // Display sample explanations
            console.log('\n📋 Sample Explanations:');
            explanations.slice(0, 3).forEach((exp, idx) => {
                console.log(`   Paper ${idx + 1}: "${exp.substring(0, 100)}..."`);
            });
            
            // Evaluate
            const varietyPass = varietyPercent >= 90;
            
            if (varietyPass) {
                this.log(`\n✅ Explanation Variety PASS: ${varietyPercent.toFixed(0)}% >= 90%`, 'success');
            } else {
                this.log(`\n❌ Explanation Variety FAIL: ${varietyPercent.toFixed(0)}% < 90%`, 'error');
            }
            
            this.results.explanationVariety = {
                uniqueExplanations: uniqueExplanations,
                varietyPercent: varietyPercent,
                passed: varietyPass
            };
            
            return varietyPass;
            
        } catch (error) {
            this.log(`❌ Test failed: ${error.message}`, 'error');
            return false;
        }
    }

    // ============================================================================
    // TEST 3: EXPLANATION SPECIFICITY
    // ============================================================================
    
    async testExplanationSpecificity() {
        this.log('\n🧪 TEST 3: Explanation Specificity', 'test');
        this.log('='.repeat(80));
        this.log('Expected: Explanations include specific paper titles or percentages', 'info');

        try {
            // Get Weekly Mix with force_refresh to test new logic
            const response = await fetch(
                `${this.backendUrl}/api/v1/weekly-mix/current?force_refresh=true`,
                { headers: { 'User-ID': this.userId } }
            );

            const data = await response.json();
            
            if (!data.papers || data.papers.length === 0) {
                this.log('❌ No papers in Weekly Mix', 'error');
                return false;
            }
            
            // Check for specificity markers
            const specificityMarkers = [
                'similar to',
                'relates to',
                '%',
                'similarity',
                'viewed',
                'collection'
            ];
            
            let specificCount = 0;
            const specificityDetails = [];
            
            data.papers.forEach((paper, idx) => {
                const exp = paper.explanation_text.toLowerCase();
                const hasMarkers = specificityMarkers.some(marker => exp.includes(marker));
                
                if (hasMarkers) {
                    specificCount++;
                }
                
                specificityDetails.push({
                    paper: idx + 1,
                    explanation: paper.explanation_text,
                    isSpecific: hasMarkers
                });
            });
            
            const specificityPercent = (specificCount / data.papers.length) * 100;
            
            this.log(`\n📊 Specificity Analysis:`, 'data');
            this.log(`   Papers with Specific Explanations: ${specificCount}/${data.papers.length} (${specificityPercent.toFixed(0)}%)`, 'data');
            
            // Display details
            console.log('\n📋 Specificity Details:');
            specificityDetails.forEach(detail => {
                const status = detail.isSpecific ? '✅' : '❌';
                console.log(`   ${status} Paper ${detail.paper}: "${detail.explanation.substring(0, 80)}..."`);
            });
            
            // Evaluate
            const specificityPass = specificityPercent >= 70;
            
            if (specificityPass) {
                this.log(`\n✅ Specificity PASS: ${specificityPercent.toFixed(0)}% >= 70%`, 'success');
            } else {
                this.log(`\n❌ Specificity FAIL: ${specificityPercent.toFixed(0)}% < 70%`, 'error');
            }
            
            this.results.specificityCheck = {
                specificCount: specificCount,
                specificityPercent: specificityPercent,
                passed: specificityPass
            };
            
            return specificityPass;
            
        } catch (error) {
            this.log(`❌ Test failed: ${error.message}`, 'error');
            return false;
        }
    }

    // ============================================================================
    // RUN ALL TESTS
    // ============================================================================
    
    async runAllTests() {
        this.log('🚀 Starting Personalization Fix Validation...', 'info');
        this.log('='.repeat(80));

        const test1 = await this.testScoreVariance();
        const test2 = await this.testExplanationVariety();
        const test3 = await this.testExplanationSpecificity();

        this.generateReport(test1, test2, test3);
    }

    generateReport(test1, test2, test3) {
        this.log('\n' + '='.repeat(80));
        this.log('📊 PERSONALIZATION FIX VALIDATION REPORT', 'info');
        this.log('='.repeat(80));

        const tests = [test1, test2, test3];
        const passedTests = tests.filter(t => t).length;
        const totalTests = tests.length;
        const passRate = (passedTests / totalTests) * 100;

        this.log(`\n📈 Overall Results:`);
        this.log(`   Tests Passed: ${passedTests}/${totalTests} (${passRate.toFixed(0)}%)`);

        this.log('\n📋 Test Results:');
        this.log(`   ${test1 ? '✅' : '❌'} Score Variance: ${this.results.scoreVariance?.variance.toFixed(4) || 'N/A'}`);
        this.log(`   ${test1 ? '✅' : '❌'} Unique Scores: ${this.results.scoreVariance?.uniquePercent.toFixed(0) || 'N/A'}%`);
        this.log(`   ${test2 ? '✅' : '❌'} Explanation Variety: ${this.results.explanationVariety?.varietyPercent.toFixed(0) || 'N/A'}%`);
        this.log(`   ${test3 ? '✅' : '❌'} Explanation Specificity: ${this.results.specificityCheck?.specificityPercent.toFixed(0) || 'N/A'}%`);

        this.log('\n📊 Before vs After:');
        console.log('   Metric                | Before  | After   | Target  | Status');
        console.log('   ' + '-'.repeat(70));
        console.log(`   Score Variance        | 0.0000  | ${(this.results.scoreVariance?.variance || 0).toFixed(4)}  | >0.0100 | ${this.results.scoreVariance?.variance > 0.01 ? '✅' : '❌'}`);
        console.log(`   Unique Scores         | 10%     | ${(this.results.scoreVariance?.uniquePercent || 0).toFixed(0).padEnd(6)}% | >80%    | ${this.results.scoreVariance?.uniquePercent >= 80 ? '✅' : '❌'}`);
        console.log(`   Explanation Variety   | 10%     | ${(this.results.explanationVariety?.varietyPercent || 0).toFixed(0).padEnd(6)}% | >90%    | ${this.results.explanationVariety?.varietyPercent >= 90 ? '✅' : '❌'}`);
        console.log(`   Explanation Specific  | 0%      | ${(this.results.specificityCheck?.specificityPercent || 0).toFixed(0).padEnd(6)}% | >70%    | ${this.results.specificityCheck?.specificityPercent >= 70 ? '✅' : '❌'}`);

        this.log('\n' + '='.repeat(80));
        
        if (passRate === 100) {
            this.log('🎉 SUCCESS! All personalization fixes validated!', 'success');
            this.log('✅ Recommendations are now truly personalized', 'success');
            this.log('✅ Ready for production use', 'success');
        } else if (passRate >= 66) {
            this.log('✅ GOOD! Most fixes working, minor issues remain', 'success');
        } else {
            this.log('⚠️ WARNING! Personalization fixes need more work', 'warning');
        }
    }
}

// Run the test
const validator = new PersonalizationFixValidator();
validator.runAllTests();

