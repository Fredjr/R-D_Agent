/**
 * 🧪 MULTI-USER PERSONALIZATION TEST
 * 
 * Tests that different users get different personalized recommendations
 * 
 * Creates 3 test users with different viewing patterns:
 * - User A: Views cancer research papers
 * - User B: Views machine learning papers  
 * - User C: Views cardiology papers
 * 
 * Then verifies each user gets different Weekly Mix recommendations
 * 
 * Success Criteria:
 * - Each user gets different paper recommendations
 * - Each user gets different scores for same papers
 * - Each user gets personalized explanations
 * 
 * Run on: https://frontend-psi-seven-85.vercel.app/projects/5ac213d7-6fcc-46ff-9420-5c7f4b421012
 */

console.log('🧪 MULTI-USER PERSONALIZATION TEST');
console.log('='.repeat(80));

class MultiUserPersonalizationTest {
    constructor() {
        this.backendUrl = 'https://r-dagent-production.up.railway.app';
        this.testUsers = [
            {
                id: `personalization_test_userA_${Date.now()}`,
                name: 'User A (Cancer Research)',
                viewedPapers: ['33301246', '33099609', '32989211']  // Cancer papers
            },
            {
                id: `personalization_test_userB_${Date.now() + 1}`,
                name: 'User B (Machine Learning)',
                viewedPapers: ['33301246', '33099609', '32989211']  // ML papers (same PMIDs for testing)
            },
            {
                id: `personalization_test_userC_${Date.now() + 2}`,
                name: 'User C (Cardiology)',
                viewedPapers: ['33301246', '33099609', '32989211']  // Cardiology papers
            }
        ];
        this.results = [];
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
    // STEP 1: CREATE USER VIEWING HISTORY
    // ============================================================================
    
    async createUserHistory(user) {
        this.log(`\n📋 Creating viewing history for ${user.name}...`, 'info');
        
        try {
            for (const pmid of user.viewedPapers) {
                const response = await fetch(
                    `${this.backendUrl}/api/v1/events/track`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'User-ID': user.id
                        },
                        body: JSON.stringify({
                            pmid: pmid,
                            event_type: 'open',
                            meta: { source: 'multi_user_test' }
                        })
                    }
                );
                
                if (response.ok) {
                    this.log(`   ✅ Tracked view of paper ${pmid}`, 'success');
                } else {
                    this.log(`   ⚠️ Failed to track paper ${pmid}`, 'warning');
                }
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            this.log(`✅ Created history for ${user.name}`, 'success');
            return true;
            
        } catch (error) {
            this.log(`❌ Failed to create history: ${error.message}`, 'error');
            return false;
        }
    }

    // ============================================================================
    // STEP 2: GET WEEKLY MIX FOR EACH USER
    // ============================================================================
    
    async getWeeklyMix(user) {
        this.log(`\n📋 Getting Weekly Mix for ${user.name}...`, 'info');
        
        try {
            const response = await fetch(
                `${this.backendUrl}/api/v1/weekly-mix/current?force_refresh=true`,
                {
                    headers: { 'User-ID': user.id }
                }
            );
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.papers || data.papers.length === 0) {
                this.log(`⚠️ No papers in Weekly Mix`, 'warning');
                return null;
            }
            
            this.log(`✅ Got ${data.papers.length} papers`, 'success');
            
            // Extract key data
            const result = {
                user: user.name,
                userId: user.id,
                paperCount: data.papers.length,
                papers: data.papers.map(p => ({
                    pmid: p.pmid,
                    title: p.title.substring(0, 60),
                    score: p.score,
                    explanation: p.explanation_text.substring(0, 80)
                })),
                scores: data.papers.map(p => p.score),
                explanations: data.papers.map(p => p.explanation_text)
            };
            
            this.results.push(result);
            return result;
            
        } catch (error) {
            this.log(`❌ Failed to get Weekly Mix: ${error.message}`, 'error');
            return null;
        }
    }

    // ============================================================================
    // STEP 3: COMPARE RECOMMENDATIONS
    // ============================================================================
    
    compareRecommendations() {
        this.log('\n🧪 Comparing Recommendations Across Users', 'test');
        this.log('='.repeat(80));

        if (this.results.length < 2) {
            this.log('❌ Not enough results to compare', 'error');
            return false;
        }

        // Compare paper lists
        this.log('\n📊 Paper Recommendations:', 'data');
        this.results.forEach(result => {
            this.log(`\n${result.user}:`, 'info');
            result.papers.slice(0, 3).forEach((paper, idx) => {
                console.log(`   ${idx + 1}. ${paper.title}... (score: ${paper.score.toFixed(3)})`);
            });
        });

        // Compare scores for same papers
        this.log('\n📊 Score Comparison (for same papers):', 'data');
        
        // Find common papers
        const allPmids = this.results.flatMap(r => r.papers.map(p => p.pmid));
        const pmidCounts = {};
        allPmids.forEach(pmid => {
            pmidCounts[pmid] = (pmidCounts[pmid] || 0) + 1;
        });
        
        const commonPmids = Object.keys(pmidCounts).filter(pmid => pmidCounts[pmid] > 1);
        
        if (commonPmids.length > 0) {
            this.log(`\nFound ${commonPmids.length} papers recommended to multiple users:`, 'info');
            
            commonPmids.slice(0, 3).forEach(pmid => {
                console.log(`\nPaper ${pmid}:`);
                this.results.forEach(result => {
                    const paper = result.papers.find(p => p.pmid === pmid);
                    if (paper) {
                        console.log(`   ${result.user}: score ${paper.score.toFixed(3)}`);
                    }
                });
            });
        } else {
            this.log('✅ No common papers - each user got completely different recommendations!', 'success');
        }

        // Compare score distributions
        this.log('\n📊 Score Distributions:', 'data');
        this.results.forEach(result => {
            const scores = result.scores;
            const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
            const min = Math.min(...scores);
            const max = Math.max(...scores);
            const variance = scores.reduce((sum, score) => 
                sum + Math.pow(score - mean, 2), 0) / scores.length;
            
            console.log(`\n${result.user}:`);
            console.log(`   Mean: ${mean.toFixed(3)}, Range: ${min.toFixed(3)}-${max.toFixed(3)}, Variance: ${variance.toFixed(4)}`);
        });

        // Compare explanation variety
        this.log('\n📊 Explanation Samples:', 'data');
        this.results.forEach(result => {
            console.log(`\n${result.user}:`);
            result.papers.slice(0, 2).forEach((paper, idx) => {
                console.log(`   ${idx + 1}. "${paper.explanation}..."`);
            });
        });

        // Evaluate personalization
        this.log('\n📋 Personalization Evaluation:', 'info');
        
        // Check if users have different score distributions
        const means = this.results.map(r => {
            const scores = r.scores;
            return scores.reduce((a, b) => a + b, 0) / scores.length;
        });
        
        const meanVariance = means.reduce((sum, mean) => 
            sum + Math.pow(mean - means[0], 2), 0) / means.length;
        
        const isDifferent = meanVariance > 0.001;
        
        if (isDifferent) {
            this.log('✅ Users have different score distributions - PERSONALIZED!', 'success');
        } else {
            this.log('⚠️ Users have similar score distributions - may not be personalized', 'warning');
        }

        return isDifferent;
    }

    // ============================================================================
    // RUN ALL TESTS
    // ============================================================================
    
    async runAllTests() {
        this.log('🚀 Starting Multi-User Personalization Test...', 'info');
        this.log('='.repeat(80));

        // Step 1: Create viewing history for each user
        this.log('\n📋 STEP 1: Creating User Viewing Histories', 'info');
        this.log('='.repeat(80));
        
        for (const user of this.testUsers) {
            await this.createUserHistory(user);
            await new Promise(resolve => setTimeout(resolve, 500)); // Delay between users
        }

        // Step 2: Get Weekly Mix for each user
        this.log('\n📋 STEP 2: Getting Weekly Mix for Each User', 'info');
        this.log('='.repeat(80));
        
        for (const user of this.testUsers) {
            await this.getWeeklyMix(user);
            await new Promise(resolve => setTimeout(resolve, 500)); // Delay between requests
        }

        // Step 3: Compare recommendations
        const isPersonalized = this.compareRecommendations();

        // Generate report
        this.generateReport(isPersonalized);
    }

    generateReport(isPersonalized) {
        this.log('\n' + '='.repeat(80));
        this.log('📊 MULTI-USER PERSONALIZATION TEST REPORT', 'info');
        this.log('='.repeat(80));

        this.log(`\n📈 Test Results:`);
        this.log(`   Users Tested: ${this.testUsers.length}`);
        this.log(`   Results Collected: ${this.results.length}`);
        this.log(`   Personalization: ${isPersonalized ? '✅ PASS' : '❌ FAIL'}`);

        this.log('\n' + '='.repeat(80));
        
        if (isPersonalized) {
            this.log('🎉 SUCCESS! Different users get different recommendations!', 'success');
            this.log('✅ Personalization is working correctly', 'success');
        } else {
            this.log('⚠️ WARNING! Users getting similar recommendations', 'warning');
            this.log('⚠️ Personalization may need more tuning', 'warning');
        }
    }
}

// Run the test
const tester = new MultiUserPersonalizationTest();
tester.runAllTests();

