/**
 * 🔬 DATA QUALITY VALIDATION TEST - SPRINT 1A-4
 * 
 * This test validates:
 * 1. JSON response structure and completeness
 * 2. Data quality and meaningfulness
 * 3. UI accessibility and renderability
 * 4. End-user value proposition
 * 
 * Run on: https://frontend-psi-seven-85.vercel.app/projects/5ac213d7-6fcc-46ff-9420-5c7f4b421012
 */

console.log('🔬 DATA QUALITY VALIDATION TEST - COMPREHENSIVE');
console.log('='.repeat(80));

class DataQualityValidator {
    constructor() {
        this.backendUrl = 'https://r-dagent-production.up.railway.app';
        this.userId = 'data_quality_test_' + Date.now();
        this.validationResults = {
            sprint1a: [],
            sprint1b: [],
            sprint2a: [],
            sprint2b: [],
            sprint3a: [],
            sprint3b: [],
            sprint4: []
        };
        this.dataQualityIssues = [];
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
    // SPRINT 1A: EVENT TRACKING DATA QUALITY
    // ============================================================================
    
    async validateEventTrackingData() {
        this.log('\n📊 SPRINT 1A: Event Tracking Data Quality', 'info');
        this.log('='.repeat(80));

        try {
            // Track an event
            const trackResponse = await fetch(`${this.backendUrl}/api/v1/events/track`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.userId
                },
                body: JSON.stringify({
                    pmid: '33301246',
                    event_type: 'open',
                    meta: { source: 'data_quality_test', test_id: Date.now() }
                })
            });

            if (!trackResponse.ok) {
                this.dataQualityIssues.push({
                    sprint: '1A',
                    issue: 'Event tracking failed',
                    status: trackResponse.status
                });
                return;
            }

            const eventData = await trackResponse.json();
            this.log('📊 Event Data Structure:', 'data');
            console.log(JSON.stringify(eventData, null, 2));

            // Validate event data quality
            const issues = [];
            
            if (!eventData.id) issues.push('Missing event ID');
            if (!eventData.user_id) issues.push('Missing user_id');
            if (!eventData.pmid) issues.push('Missing pmid');
            if (!eventData.event_type) issues.push('Missing event_type');
            if (!eventData.timestamp) issues.push('Missing timestamp');
            
            // Validate timestamp format
            if (eventData.timestamp) {
                const timestamp = new Date(eventData.timestamp);
                if (isNaN(timestamp.getTime())) {
                    issues.push('Invalid timestamp format');
                }
            }

            // Validate meta data
            if (!eventData.meta || typeof eventData.meta !== 'object') {
                issues.push('Missing or invalid meta data');
            }

            if (issues.length > 0) {
                this.log('⚠️ Data Quality Issues:', 'warning');
                issues.forEach(issue => this.log(`   - ${issue}`, 'warning'));
                this.dataQualityIssues.push({
                    sprint: '1A',
                    endpoint: '/api/v1/events/track',
                    issues: issues
                });
            } else {
                this.log('✅ Event data quality: EXCELLENT', 'success');
            }

            // Test: Can UI render this data?
            this.log('\n🎨 UI Renderability Check:', 'info');
            const uiRenderable = this.checkEventUIRenderability(eventData);
            if (uiRenderable.success) {
                this.log('✅ Event data is UI-renderable', 'success');
            } else {
                this.log('❌ Event data has UI rendering issues:', 'error');
                uiRenderable.issues.forEach(issue => this.log(`   - ${issue}`, 'error'));
            }

            this.validationResults.sprint1a.push({
                test: 'Event Tracking Data Quality',
                passed: issues.length === 0 && uiRenderable.success,
                dataQualityScore: this.calculateDataQualityScore(issues.length, 6),
                uiRenderable: uiRenderable.success
            });

        } catch (error) {
            this.log(`❌ Event tracking validation failed: ${error.message}`, 'error');
            this.dataQualityIssues.push({
                sprint: '1A',
                issue: 'Validation error',
                error: error.message
            });
        }
    }

    checkEventUIRenderability(eventData) {
        const issues = [];
        
        // Check if timestamp can be formatted for display
        if (eventData.timestamp) {
            try {
                const date = new Date(eventData.timestamp);
                const formatted = date.toLocaleString();
                if (!formatted) issues.push('Timestamp not formattable');
            } catch (e) {
                issues.push('Timestamp formatting error');
            }
        }

        // Check if event_type is human-readable
        const validEventTypes = ['open', 'view', 'click', 'save', 'share'];
        if (!validEventTypes.includes(eventData.event_type)) {
            issues.push(`Event type '${eventData.event_type}' not user-friendly`);
        }

        // Check if meta data is displayable
        if (eventData.meta) {
            try {
                JSON.stringify(eventData.meta);
            } catch (e) {
                issues.push('Meta data not serializable for UI');
            }
        }

        return {
            success: issues.length === 0,
            issues: issues
        };
    }

    // ============================================================================
    // SPRINT 2B: CLUSTERING DATA QUALITY
    // ============================================================================
    
    async validateClusteringData() {
        this.log('\n📊 SPRINT 2B: Clustering Data Quality', 'info');
        this.log('='.repeat(80));

        try {
            const response = await fetch(`${this.backendUrl}/api/v1/clusters?limit=5`);
            
            if (!response.ok) {
                this.dataQualityIssues.push({
                    sprint: '2B',
                    issue: 'Clustering API failed',
                    status: response.status
                });
                return;
            }

            const data = await response.json();
            this.log('📊 Cluster Data Sample:', 'data');
            
            if (data.clusters && data.clusters.length > 0) {
                console.log(JSON.stringify(data.clusters[0], null, 2));
                
                // Validate each cluster
                let totalIssues = 0;
                data.clusters.forEach((cluster, idx) => {
                    const issues = this.validateClusterQuality(cluster, idx);
                    totalIssues += issues.length;
                    
                    if (issues.length > 0) {
                        this.log(`⚠️ Cluster ${idx + 1} issues:`, 'warning');
                        issues.forEach(issue => this.log(`   - ${issue}`, 'warning'));
                    }
                });

                if (totalIssues === 0) {
                    this.log('✅ All clusters have excellent data quality', 'success');
                } else {
                    this.log(`⚠️ Found ${totalIssues} data quality issues across ${data.clusters.length} clusters`, 'warning');
                }

                // UI Renderability Check
                this.log('\n🎨 Cluster UI Renderability:', 'info');
                const uiCheck = this.checkClusterUIRenderability(data.clusters[0]);
                if (uiCheck.success) {
                    this.log('✅ Cluster data is UI-renderable', 'success');
                } else {
                    this.log('❌ Cluster UI rendering issues:', 'error');
                    uiCheck.issues.forEach(issue => this.log(`   - ${issue}`, 'error'));
                }

                this.validationResults.sprint2b.push({
                    test: 'Clustering Data Quality',
                    passed: totalIssues === 0 && uiCheck.success,
                    clustersValidated: data.clusters.length,
                    totalIssues: totalIssues,
                    dataQualityScore: this.calculateDataQualityScore(totalIssues, data.clusters.length * 8),
                    uiRenderable: uiCheck.success
                });

            } else {
                this.log('⚠️ No clusters returned', 'warning');
                this.dataQualityIssues.push({
                    sprint: '2B',
                    issue: 'No clusters in response'
                });
            }

        } catch (error) {
            this.log(`❌ Clustering validation failed: ${error.message}`, 'error');
        }
    }

    validateClusterQuality(cluster, index) {
        const issues = [];
        
        // Required fields
        if (!cluster.cluster_id) issues.push(`Cluster ${index}: Missing cluster_id`);
        if (!cluster.title || cluster.title.trim() === '') issues.push(`Cluster ${index}: Missing or empty title`);
        if (!cluster.paper_count || cluster.paper_count === 0) issues.push(`Cluster ${index}: No papers in cluster`);
        
        // Keywords quality
        if (!cluster.keywords || !Array.isArray(cluster.keywords) || cluster.keywords.length === 0) {
            issues.push(`Cluster ${index}: Missing or empty keywords`);
        } else if (cluster.keywords.some(k => !k || k.trim() === '')) {
            issues.push(`Cluster ${index}: Contains empty keywords`);
        }
        
        // Summary quality
        if (!cluster.summary || cluster.summary.trim() === '') {
            issues.push(`Cluster ${index}: Missing summary`);
        } else if (cluster.summary.length < 50) {
            issues.push(`Cluster ${index}: Summary too short (${cluster.summary.length} chars)`);
        }
        
        // Representative papers
        if (!cluster.representative_papers || !Array.isArray(cluster.representative_papers)) {
            issues.push(`Cluster ${index}: Missing representative_papers`);
        } else if (cluster.representative_papers.length === 0) {
            issues.push(`Cluster ${index}: No representative papers`);
        }
        
        // Modularity score
        if (cluster.modularity === undefined || cluster.modularity === null) {
            issues.push(`Cluster ${index}: Missing modularity score`);
        } else if (cluster.modularity < 0 || cluster.modularity > 1) {
            issues.push(`Cluster ${index}: Invalid modularity score (${cluster.modularity})`);
        }
        
        return issues;
    }

    checkClusterUIRenderability(cluster) {
        const issues = [];
        
        // Check if title is displayable
        if (cluster.title && cluster.title.length > 200) {
            issues.push('Title too long for UI display');
        }
        
        // Check if keywords can be rendered as tags
        if (cluster.keywords) {
            if (cluster.keywords.length > 10) {
                issues.push('Too many keywords for tag display');
            }
            if (cluster.keywords.some(k => k.length > 50)) {
                issues.push('Some keywords too long for tag display');
            }
        }
        
        // Check if summary is readable
        if (cluster.summary && cluster.summary.length > 500) {
            issues.push('Summary too long for card display');
        }
        
        return {
            success: issues.length === 0,
            issues: issues
        };
    }

    // ============================================================================
    // SPRINT 3A: EXPLANATION DATA QUALITY
    // ============================================================================
    
    async validateExplanationData() {
        this.log('\n📊 SPRINT 3A: Explanation Data Quality', 'info');
        this.log('='.repeat(80));

        try {
            const response = await fetch(`${this.backendUrl}/api/v1/explanations/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.userId
                },
                body: JSON.stringify({
                    paper_pmid: '33301246',
                    context: {},
                    save_to_db: false
                })
            });

            if (!response.ok) {
                this.dataQualityIssues.push({
                    sprint: '3A',
                    issue: 'Explanation API failed',
                    status: response.status
                });
                return;
            }

            const explanation = await response.json();
            this.log('📊 Explanation Data:', 'data');
            console.log(JSON.stringify(explanation, null, 2));

            // Validate explanation quality
            const issues = this.validateExplanationQuality(explanation);
            
            if (issues.length > 0) {
                this.log('⚠️ Explanation Quality Issues:', 'warning');
                issues.forEach(issue => this.log(`   - ${issue}`, 'warning'));
            } else {
                this.log('✅ Explanation quality: EXCELLENT', 'success');
            }

            // UI Renderability
            const uiCheck = this.checkExplanationUIRenderability(explanation);
            if (uiCheck.success) {
                this.log('✅ Explanation is UI-renderable', 'success');
            } else {
                this.log('❌ Explanation UI issues:', 'error');
                uiCheck.issues.forEach(issue => this.log(`   - ${issue}`, 'error'));
            }

            this.validationResults.sprint3a.push({
                test: 'Explanation Data Quality',
                passed: issues.length === 0 && uiCheck.success,
                dataQualityScore: this.calculateDataQualityScore(issues.length, 7),
                uiRenderable: uiCheck.success
            });

        } catch (error) {
            this.log(`❌ Explanation validation failed: ${error.message}`, 'error');
        }
    }

    validateExplanationQuality(explanation) {
        const issues = [];
        
        if (!explanation.paper_pmid) issues.push('Missing paper_pmid');
        if (!explanation.user_id) issues.push('Missing user_id');
        if (!explanation.explanation_type) issues.push('Missing explanation_type');
        if (!explanation.explanation_text || explanation.explanation_text.trim() === '') {
            issues.push('Missing or empty explanation_text');
        } else if (explanation.explanation_text.length < 20) {
            issues.push(`Explanation too short (${explanation.explanation_text.length} chars)`);
        }
        
        if (explanation.confidence_score === undefined) {
            issues.push('Missing confidence_score');
        } else if (explanation.confidence_score < 0 || explanation.confidence_score > 1) {
            issues.push(`Invalid confidence_score (${explanation.confidence_score})`);
        }
        
        if (!explanation.evidence || typeof explanation.evidence !== 'object') {
            issues.push('Missing or invalid evidence');
        }
        
        if (!explanation.factors || !Array.isArray(explanation.factors)) {
            issues.push('Missing or invalid factors array');
        }
        
        return issues;
    }

    checkExplanationUIRenderability(explanation) {
        const issues = [];
        
        if (explanation.explanation_text && explanation.explanation_text.length > 300) {
            issues.push('Explanation text too long for tooltip/card');
        }
        
        if (explanation.confidence_score !== undefined) {
            const percentage = Math.round(explanation.confidence_score * 100);
            if (isNaN(percentage)) {
                issues.push('Confidence score not convertible to percentage');
            }
        }
        
        return {
            success: issues.length === 0,
            issues: issues
        };
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================
    
    calculateDataQualityScore(issues, totalChecks) {
        const score = ((totalChecks - issues) / totalChecks) * 100;
        return Math.max(0, Math.round(score));
    }

    // ============================================================================
    // SPRINT 3B: WEEKLY MIX DATA QUALITY
    // ============================================================================

    async validateWeeklyMixData() {
        this.log('\n📊 SPRINT 3B: Weekly Mix Data Quality', 'info');
        this.log('='.repeat(80));

        try {
            const response = await fetch(`${this.backendUrl}/api/v1/weekly-mix/current`, {
                headers: { 'User-ID': this.userId }
            });

            if (!response.ok) {
                this.dataQualityIssues.push({
                    sprint: '3B',
                    issue: 'Weekly Mix API failed',
                    status: response.status
                });
                return;
            }

            const mixData = await response.json();
            this.log('📊 Weekly Mix Data Sample:', 'data');

            if (mixData.papers && mixData.papers.length > 0) {
                console.log(JSON.stringify(mixData.papers[0], null, 2));

                // Validate mix quality
                const issues = this.validateWeeklyMixQuality(mixData);

                if (issues.length > 0) {
                    this.log('⚠️ Weekly Mix Quality Issues:', 'warning');
                    issues.forEach(issue => this.log(`   - ${issue}`, 'warning'));
                } else {
                    this.log('✅ Weekly Mix quality: EXCELLENT', 'success');
                }

                // UI Renderability
                const uiCheck = this.checkWeeklyMixUIRenderability(mixData);
                if (uiCheck.success) {
                    this.log('✅ Weekly Mix is UI-renderable', 'success');
                } else {
                    this.log('❌ Weekly Mix UI issues:', 'error');
                    uiCheck.issues.forEach(issue => this.log(`   - ${issue}`, 'error'));
                }

                this.validationResults.sprint3b.push({
                    test: 'Weekly Mix Data Quality',
                    passed: issues.length === 0 && uiCheck.success,
                    papersValidated: mixData.papers.length,
                    dataQualityScore: this.calculateDataQualityScore(issues.length, 10),
                    uiRenderable: uiCheck.success
                });

            } else {
                this.log('⚠️ No papers in weekly mix', 'warning');
            }

        } catch (error) {
            this.log(`❌ Weekly Mix validation failed: ${error.message}`, 'error');
        }
    }

    validateWeeklyMixQuality(mixData) {
        const issues = [];

        if (!mixData.user_id) issues.push('Missing user_id');
        if (!mixData.mix_date) issues.push('Missing mix_date');
        if (!mixData.papers || !Array.isArray(mixData.papers)) {
            issues.push('Missing or invalid papers array');
            return issues;
        }

        if (mixData.papers.length === 0) {
            issues.push('Empty papers array');
        }

        // Validate each paper
        mixData.papers.forEach((paper, idx) => {
            if (!paper.pmid) issues.push(`Paper ${idx}: Missing pmid`);
            if (!paper.title || paper.title.trim() === '') issues.push(`Paper ${idx}: Missing title`);
            if (paper.score === undefined) issues.push(`Paper ${idx}: Missing score`);
            if (paper.score < 0 || paper.score > 1) issues.push(`Paper ${idx}: Invalid score`);
            if (!paper.explanation_text) issues.push(`Paper ${idx}: Missing explanation`);
            if (paper.explanation_confidence === undefined) issues.push(`Paper ${idx}: Missing confidence`);
            if (paper.position === undefined) issues.push(`Paper ${idx}: Missing position`);
        });

        return issues;
    }

    checkWeeklyMixUIRenderability(mixData) {
        const issues = [];

        if (mixData.papers && mixData.papers.length > 0) {
            const paper = mixData.papers[0];

            if (paper.title && paper.title.length > 200) {
                issues.push('Paper titles too long for list display');
            }

            if (paper.explanation_text && paper.explanation_text.length > 150) {
                issues.push('Explanations too long for card display');
            }

            // Check if scores can be visualized
            if (paper.score !== undefined) {
                const percentage = Math.round(paper.score * 100);
                if (isNaN(percentage)) {
                    issues.push('Scores not convertible to percentage');
                }
            }
        }

        return {
            success: issues.length === 0,
            issues: issues
        };
    }

    // ============================================================================
    // SPRINT 4: DISCOVERY TREE DATA QUALITY
    // ============================================================================

    async validateDiscoveryTreeData() {
        this.log('\n📊 SPRINT 4: Discovery Tree Data Quality', 'info');
        this.log('='.repeat(80));

        try {
            const response = await fetch(`${this.backendUrl}/api/v1/discovery-tree`, {
                headers: { 'X-User-ID': this.userId }
            });

            if (!response.ok) {
                this.dataQualityIssues.push({
                    sprint: '4',
                    issue: 'Discovery Tree API failed',
                    status: response.status
                });
                return;
            }

            const treeData = await response.json();
            this.log('📊 Discovery Tree Data:', 'data');
            console.log(JSON.stringify({
                tree_id: treeData.tree_id,
                total_clusters: treeData.total_clusters,
                total_papers: treeData.total_papers,
                sample_cluster: treeData.clusters ? treeData.clusters[0] : null
            }, null, 2));

            // Validate tree quality
            const issues = this.validateDiscoveryTreeQuality(treeData);

            if (issues.length > 0) {
                this.log('⚠️ Discovery Tree Quality Issues:', 'warning');
                issues.forEach(issue => this.log(`   - ${issue}`, 'warning'));
            } else {
                this.log('✅ Discovery Tree quality: EXCELLENT', 'success');
            }

            // UI Renderability
            const uiCheck = this.checkDiscoveryTreeUIRenderability(treeData);
            if (uiCheck.success) {
                this.log('✅ Discovery Tree is UI-renderable', 'success');
            } else {
                this.log('❌ Discovery Tree UI issues:', 'error');
                uiCheck.issues.forEach(issue => this.log(`   - ${issue}`, 'error'));
            }

            this.validationResults.sprint4.push({
                test: 'Discovery Tree Data Quality',
                passed: issues.length === 0 && uiCheck.success,
                clustersValidated: treeData.total_clusters,
                dataQualityScore: this.calculateDataQualityScore(issues.length, 12),
                uiRenderable: uiCheck.success
            });

        } catch (error) {
            this.log(`❌ Discovery Tree validation failed: ${error.message}`, 'error');
        }
    }

    validateDiscoveryTreeQuality(treeData) {
        const issues = [];

        if (!treeData.tree_id) issues.push('Missing tree_id');
        if (!treeData.user_id) issues.push('Missing user_id');
        if (treeData.total_clusters === undefined) issues.push('Missing total_clusters');
        if (treeData.total_papers === undefined) issues.push('Missing total_papers');

        if (!treeData.clusters || !Array.isArray(treeData.clusters)) {
            issues.push('Missing or invalid clusters array');
            return issues;
        }

        if (treeData.clusters.length === 0) {
            issues.push('Empty clusters array');
        }

        // Validate cluster structure
        treeData.clusters.forEach((cluster, idx) => {
            if (!cluster.cluster_id) issues.push(`Cluster ${idx}: Missing cluster_id`);
            if (!cluster.title) issues.push(`Cluster ${idx}: Missing title`);
            if (cluster.paper_count === undefined) issues.push(`Cluster ${idx}: Missing paper_count`);
            if (!cluster.keywords || cluster.keywords.length === 0) issues.push(`Cluster ${idx}: No keywords`);
            if (cluster.relevance_score === undefined) issues.push(`Cluster ${idx}: Missing relevance_score`);
        });

        return issues;
    }

    checkDiscoveryTreeUIRenderability(treeData) {
        const issues = [];

        if (treeData.clusters && treeData.clusters.length > 0) {
            const cluster = treeData.clusters[0];

            // Check if can be rendered as tree/graph
            if (!cluster.cluster_id) {
                issues.push('Missing cluster IDs for tree rendering');
            }

            // Check if titles are displayable
            if (cluster.title && cluster.title.length > 100) {
                issues.push('Cluster titles too long for tree nodes');
            }

            // Check if keywords can be shown as tags
            if (cluster.keywords && cluster.keywords.length > 5) {
                issues.push('Too many keywords for compact display');
            }
        }

        return {
            success: issues.length === 0,
            issues: issues
        };
    }

    async runAllValidations() {
        this.log('🚀 Starting Comprehensive Data Quality Validation...', 'info');
        this.log('='.repeat(80));

        await this.validateEventTrackingData();
        await this.validateClusteringData();
        await this.validateExplanationData();
        await this.validateWeeklyMixData();
        await this.validateDiscoveryTreeData();

        this.generateReport();
    }

    generateReport() {
        this.log('\n' + '='.repeat(80));
        this.log('📊 DATA QUALITY VALIDATION REPORT', 'info');
        this.log('='.repeat(80));

        // Calculate overall scores
        let totalTests = 0;
        let passedTests = 0;
        let totalDataQualityScore = 0;
        let scoreCount = 0;

        Object.values(this.validationResults).forEach(sprintResults => {
            sprintResults.forEach(result => {
                totalTests++;
                if (result.passed) passedTests++;
                if (result.dataQualityScore !== undefined) {
                    totalDataQualityScore += result.dataQualityScore;
                    scoreCount++;
                }
            });
        });

        const avgDataQuality = scoreCount > 0 ? Math.round(totalDataQualityScore / scoreCount) : 0;

        this.log(`\n📈 Overall Results:`);
        this.log(`   Tests Passed: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
        this.log(`   Average Data Quality Score: ${avgDataQuality}/100`);
        this.log(`   Total Data Quality Issues: ${this.dataQualityIssues.length}`);

        if (this.dataQualityIssues.length > 0) {
            this.log('\n⚠️ Data Quality Issues Found:', 'warning');
            this.dataQualityIssues.forEach((issue, idx) => {
                this.log(`   ${idx + 1}. Sprint ${issue.sprint}: ${issue.issue}`, 'warning');
            });
        }

        this.log('\n' + '='.repeat(80));
        
        if (avgDataQuality >= 90) {
            this.log('🎉 EXCELLENT! Data quality is production-ready!', 'success');
        } else if (avgDataQuality >= 70) {
            this.log('✅ GOOD! Minor data quality improvements needed.', 'success');
        } else {
            this.log('⚠️ WARNING! Significant data quality issues detected.', 'warning');
        }
    }
}

// Run the validation
const validator = new DataQualityValidator();
validator.runAllValidations();

