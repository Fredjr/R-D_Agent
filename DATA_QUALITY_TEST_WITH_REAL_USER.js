/**
 * 🔬 DATA QUALITY TEST - WITH REAL USER DATA
 * 
 * This test uses a user with existing interaction history to validate:
 * 1. Personalized recommendations
 * 2. Cluster quality with real data
 * 3. Discovery tree with user context
 * 
 * Run on: https://frontend-psi-seven-85.vercel.app/projects/5ac213d7-6fcc-46ff-9420-5c7f4b421012
 */

console.log('🔬 DATA QUALITY TEST - WITH REAL USER DATA');
console.log('='.repeat(80));

class RealUserDataQualityTest {
    constructor() {
        this.backendUrl = 'https://r-dagent-production.up.railway.app';
        // Use a user with existing history
        this.userId = 'test-user-comprehensive'; // This user has events tracked
        this.results = {
            personalization: [],
            contentQuality: [],
            uiAccessibility: []
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const emoji = {
            'info': '📋',
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'data': '📊'
        }[type] || '📋';
        console.log(`${emoji} [${timestamp}] ${message}`);
    }

    // ============================================================================
    // TEST 1: PERSONALIZATION QUALITY
    // ============================================================================
    
    async testPersonalization() {
        this.log('\n📊 TEST 1: Personalization Quality', 'info');
        this.log('='.repeat(80));

        try {
            // Get user's event history
            const eventsResponse = await fetch(
                `${this.backendUrl}/api/v1/events/user/${this.userId}?limit=10`,
                { headers: { 'User-ID': this.userId } }
            );
            
            const events = await eventsResponse.json();
            this.log(`📊 User has ${events.length} events in history`, 'data');
            
            if (events.length === 0) {
                this.log('⚠️ No user history - cannot test personalization', 'warning');
                return;
            }

            // Get Weekly Mix
            const mixResponse = await fetch(
                `${this.backendUrl}/api/v1/weekly-mix/current`,
                { headers: { 'User-ID': this.userId } }
            );
            
            const mixData = await mixResponse.json();
            this.log(`📊 Weekly Mix has ${mixData.papers?.length || 0} papers`, 'data');
            
            if (mixData.papers && mixData.papers.length > 0) {
                console.log('\n📊 Sample Paper:', JSON.stringify(mixData.papers[0], null, 2));
                
                // Check personalization quality
                const personalizationScore = this.assessPersonalization(mixData.papers, events);
                
                this.log(`\n📈 Personalization Assessment:`, 'info');
                this.log(`   Score Variance: ${personalizationScore.scoreVariance.toFixed(2)}`, 'data');
                this.log(`   Unique Scores: ${personalizationScore.uniqueScores}/${mixData.papers.length}`, 'data');
                this.log(`   Explanation Variety: ${personalizationScore.explanationVariety}`, 'data');
                
                if (personalizationScore.isPersonalized) {
                    this.log('✅ Recommendations appear personalized', 'success');
                } else {
                    this.log('⚠️ Recommendations may be generic', 'warning');
                    this.log(`   Reasons:`, 'warning');
                    personalizationScore.issues.forEach(issue => 
                        this.log(`   - ${issue}`, 'warning')
                    );
                }

                this.results.personalization.push({
                    test: 'Weekly Mix Personalization',
                    passed: personalizationScore.isPersonalized,
                    score: personalizationScore.score
                });
            }

            // Get Discovery Tree
            const treeResponse = await fetch(
                `${this.backendUrl}/api/v1/discovery-tree`,
                { headers: { 'X-User-ID': this.userId } }
            );
            
            const treeData = await treeResponse.json();
            this.log(`\n📊 Discovery Tree has ${treeData.total_clusters || 0} clusters`, 'data');
            
            if (treeData.clusters && treeData.clusters.length > 0) {
                console.log('\n📊 Sample Cluster:', JSON.stringify(treeData.clusters[0], null, 2));
                
                // Check if clusters are relevant to user
                const relevanceScore = this.assessClusterRelevance(treeData.clusters);
                
                this.log(`\n📈 Cluster Relevance:`, 'info');
                this.log(`   Clusters with relevance scores: ${relevanceScore.withScores}/${treeData.clusters.length}`, 'data');
                this.log(`   Average relevance: ${relevanceScore.avgRelevance.toFixed(2)}`, 'data');
                
                if (relevanceScore.isRelevant) {
                    this.log('✅ Clusters appear relevant to user', 'success');
                } else {
                    this.log('⚠️ Cluster relevance unclear', 'warning');
                }

                this.results.personalization.push({
                    test: 'Discovery Tree Relevance',
                    passed: relevanceScore.isRelevant,
                    score: relevanceScore.avgRelevance
                });
            }

        } catch (error) {
            this.log(`❌ Personalization test failed: ${error.message}`, 'error');
        }
    }

    assessPersonalization(papers, events) {
        const scores = papers.map(p => p.score);
        const explanations = papers.map(p => p.explanation_text);
        
        // Calculate score variance (personalized = varied scores)
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
        
        // Count unique scores
        const uniqueScores = new Set(scores).size;
        
        // Count unique explanations
        const uniqueExplanations = new Set(explanations).size;
        
        const issues = [];
        let isPersonalized = true;
        
        // Check if all scores are the same (not personalized)
        if (uniqueScores === 1) {
            issues.push('All papers have identical scores');
            isPersonalized = false;
        }
        
        // Check if variance is too low
        if (variance < 0.01) {
            issues.push('Score variance too low (all scores very similar)');
            isPersonalized = false;
        }
        
        // Check if explanations are all the same
        if (uniqueExplanations === 1) {
            issues.push('All papers have identical explanations');
            isPersonalized = false;
        }
        
        // Check for generic phrases
        const genericPhrases = [
            'may be relevant',
            'semantically similar',
            'recent paper',
            'latest developments'
        ];
        
        const genericCount = explanations.filter(exp => 
            genericPhrases.some(phrase => exp.toLowerCase().includes(phrase))
        ).length;
        
        if (genericCount === explanations.length) {
            issues.push('All explanations use generic phrases');
        }
        
        return {
            scoreVariance: variance,
            uniqueScores: uniqueScores,
            explanationVariety: uniqueExplanations,
            isPersonalized: isPersonalized,
            issues: issues,
            score: isPersonalized ? 100 : Math.round((uniqueScores / papers.length) * 100)
        };
    }

    assessClusterRelevance(clusters) {
        const withScores = clusters.filter(c => c.relevance_score !== undefined).length;
        const scores = clusters
            .filter(c => c.relevance_score !== undefined)
            .map(c => c.relevance_score);
        
        const avgRelevance = scores.length > 0 
            ? scores.reduce((a, b) => a + b, 0) / scores.length 
            : 0;
        
        return {
            withScores: withScores,
            avgRelevance: avgRelevance,
            isRelevant: avgRelevance > 0.5 && withScores > 0
        };
    }

    // ============================================================================
    // TEST 2: CONTENT QUALITY
    // ============================================================================
    
    async testContentQuality() {
        this.log('\n📊 TEST 2: Content Quality', 'info');
        this.log('='.repeat(80));

        try {
            // Get clusters
            const clustersResponse = await fetch(`${this.backendUrl}/api/v1/clusters?limit=5`);
            const clustersData = await clustersResponse.json();
            
            if (clustersData.clusters && clustersData.clusters.length > 0) {
                this.log(`📊 Analyzing ${clustersData.clusters.length} clusters`, 'data');
                
                const qualityMetrics = this.analyzeContentQuality(clustersData.clusters);
                
                this.log(`\n📈 Content Quality Metrics:`, 'info');
                this.log(`   Meaningful Titles: ${qualityMetrics.meaningfulTitles}/${clustersData.clusters.length}`, 'data');
                this.log(`   Adequate Summaries: ${qualityMetrics.adequateSummaries}/${clustersData.clusters.length}`, 'data');
                this.log(`   Relevant Keywords: ${qualityMetrics.relevantKeywords}/${clustersData.clusters.length}`, 'data');
                this.log(`   Overall Quality Score: ${qualityMetrics.overallScore}/100`, 'data');
                
                if (qualityMetrics.overallScore >= 80) {
                    this.log('✅ Content quality is excellent', 'success');
                } else if (qualityMetrics.overallScore >= 60) {
                    this.log('⚠️ Content quality is acceptable but needs improvement', 'warning');
                } else {
                    this.log('❌ Content quality is poor', 'error');
                }

                this.log(`\n📋 Quality Issues:`, 'info');
                qualityMetrics.issues.forEach(issue => this.log(`   - ${issue}`, 'warning'));

                this.results.contentQuality.push({
                    test: 'Cluster Content Quality',
                    passed: qualityMetrics.overallScore >= 80,
                    score: qualityMetrics.overallScore
                });
            } else {
                this.log('⚠️ No clusters available for quality testing', 'warning');
            }

        } catch (error) {
            this.log(`❌ Content quality test failed: ${error.message}`, 'error');
        }
    }

    analyzeContentQuality(clusters) {
        let meaningfulTitles = 0;
        let adequateSummaries = 0;
        let relevantKeywords = 0;
        const issues = [];
        
        clusters.forEach((cluster, idx) => {
            // Check title quality
            if (cluster.title && cluster.title.length > 10 && !cluster.title.startsWith('Cluster_')) {
                meaningfulTitles++;
            } else {
                issues.push(`Cluster ${idx + 1}: Title is generic or too short`);
            }
            
            // Check summary quality
            if (cluster.summary && cluster.summary.length >= 50) {
                adequateSummaries++;
            } else {
                issues.push(`Cluster ${idx + 1}: Summary missing or too short`);
            }
            
            // Check keywords quality
            if (cluster.keywords && cluster.keywords.length >= 3 && cluster.keywords.length <= 10) {
                relevantKeywords++;
            } else {
                issues.push(`Cluster ${idx + 1}: Keywords count not optimal (${cluster.keywords?.length || 0})`);
            }
        });
        
        const totalChecks = clusters.length * 3;
        const passedChecks = meaningfulTitles + adequateSummaries + relevantKeywords;
        const overallScore = Math.round((passedChecks / totalChecks) * 100);
        
        return {
            meaningfulTitles,
            adequateSummaries,
            relevantKeywords,
            overallScore,
            issues
        };
    }

    // ============================================================================
    // TEST 3: UI ACCESSIBILITY
    // ============================================================================
    
    async testUIAccessibility() {
        this.log('\n📊 TEST 3: UI Accessibility', 'info');
        this.log('='.repeat(80));

        try {
            // Test if data can be rendered in UI
            const mixResponse = await fetch(
                `${this.backendUrl}/api/v1/weekly-mix/current`,
                { headers: { 'User-ID': this.userId } }
            );
            
            const mixData = await mixResponse.json();
            
            if (mixData.papers && mixData.papers.length > 0) {
                const uiIssues = this.checkUIAccessibility(mixData.papers);
                
                this.log(`\n📈 UI Accessibility Check:`, 'info');
                this.log(`   Papers checked: ${mixData.papers.length}`, 'data');
                this.log(`   UI issues found: ${uiIssues.length}`, 'data');
                
                if (uiIssues.length === 0) {
                    this.log('✅ All data is UI-accessible', 'success');
                } else {
                    this.log('⚠️ UI accessibility issues found:', 'warning');
                    uiIssues.forEach(issue => this.log(`   - ${issue}`, 'warning'));
                }

                this.results.uiAccessibility.push({
                    test: 'UI Accessibility',
                    passed: uiIssues.length === 0,
                    issuesFound: uiIssues.length
                });
            }

        } catch (error) {
            this.log(`❌ UI accessibility test failed: ${error.message}`, 'error');
        }
    }

    checkUIAccessibility(papers) {
        const issues = [];
        
        papers.forEach((paper, idx) => {
            // Check title length for card display
            if (paper.title && paper.title.length > 150) {
                issues.push(`Paper ${idx + 1}: Title too long for card (${paper.title.length} chars)`);
            }
            
            // Check explanation length for tooltip
            if (paper.explanation_text && paper.explanation_text.length > 200) {
                issues.push(`Paper ${idx + 1}: Explanation too long for tooltip (${paper.explanation_text.length} chars)`);
            }
            
            // Check if scores can be visualized
            if (paper.score !== undefined && (paper.score < 0 || paper.score > 1)) {
                issues.push(`Paper ${idx + 1}: Score out of range for visualization (${paper.score})`);
            }
        });
        
        return issues;
    }

    // ============================================================================
    // RUN ALL TESTS
    // ============================================================================
    
    async runAllTests() {
        this.log('🚀 Starting Real User Data Quality Tests...', 'info');
        this.log('='.repeat(80));

        await this.testPersonalization();
        await this.testContentQuality();
        await this.testUIAccessibility();

        this.generateReport();
    }

    generateReport() {
        this.log('\n' + '='.repeat(80));
        this.log('📊 REAL USER DATA QUALITY REPORT', 'info');
        this.log('='.repeat(80));

        let totalTests = 0;
        let passedTests = 0;

        Object.values(this.results).forEach(category => {
            category.forEach(result => {
                totalTests++;
                if (result.passed) passedTests++;
            });
        });

        this.log(`\n📈 Overall Results:`);
        this.log(`   Tests Passed: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);

        this.log('\n📋 Category Results:');
        this.log(`   Personalization: ${this.results.personalization.filter(r => r.passed).length}/${this.results.personalization.length}`);
        this.log(`   Content Quality: ${this.results.contentQuality.filter(r => r.passed).length}/${this.results.contentQuality.length}`);
        this.log(`   UI Accessibility: ${this.results.uiAccessibility.filter(r => r.passed).length}/${this.results.uiAccessibility.length}`);

        this.log('\n' + '='.repeat(80));
        
        const passRate = passedTests / totalTests;
        if (passRate >= 0.9) {
            this.log('🎉 EXCELLENT! Data is production-ready!', 'success');
        } else if (passRate >= 0.7) {
            this.log('✅ GOOD! Minor improvements needed.', 'success');
        } else {
            this.log('⚠️ WARNING! Significant improvements needed.', 'warning');
        }
    }
}

// Run the test
const tester = new RealUserDataQualityTest();
tester.runAllTests();

