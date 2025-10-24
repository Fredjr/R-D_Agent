/**
 * COMPREHENSIVE DATA QUALITY & UI VERIFICATION TEST
 * 
 * This test verifies:
 * 1. Rich PhD-level data in payload responses
 * 2. Frontend UI parsing capability
 * 3. Full payload data fetching (no mock/empty data)
 * 4. Results persistence and workspace accessibility
 * 5. Deep Dive Analysis 500 error diagnosis
 */

class ComprehensiveDataQualityTest {
    constructor() {
        this.projectId = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
        this.userId = 'fredericle77@gmail.com';
        this.results = {};
    }

    async testDataQuality() {
        console.log('🔬 COMPREHENSIVE DATA QUALITY & UI VERIFICATION TEST');
        console.log('==================================================');
        console.log(`📍 Project: ${this.projectId}`);
        console.log(`👤 User: ${this.userId}`);
        console.log('');

        // Test 1: Deep Dive Analysis Error Diagnosis
        await this.diagnoseDeepdiveError();
        
        // Test 2: PhD-Level Data Quality Verification
        await this.verifyPhdDataQuality();
        
        // Test 3: UI Data Parsing Verification
        await this.verifyUIDataParsing();
        
        // Test 4: Payload Completeness Check
        await this.verifyPayloadCompleteness();
        
        // Test 5: Persistence & Workspace Accessibility
        await this.verifyPersistenceAndAccess();
        
        // Test 6: Mock Data Detection
        await this.detectMockData();

        this.generateFinalReport();
    }

    async diagnoseDeepdiveError() {
        console.log('🔍 1. DEEP DIVE ANALYSIS ERROR DIAGNOSIS');
        console.log('=======================================');
        
        try {
            // Test with minimal payload first
            console.log('🧪 Testing minimal Deep Dive payload...');
            const minimalResponse = await fetch('/api/proxy/deep-dive-analyses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.userId
                },
                body: JSON.stringify({
                    objective: 'Test analysis',
                    article_pmid: '38278529',
                    article_title: 'Test Article',
                    article_url: 'https://pubmed.ncbi.nlm.nih.gov/38278529/'
                })
            });

            if (!minimalResponse.ok) {
                const errorText = await minimalResponse.text();
                console.log(`❌ Minimal payload failed (${minimalResponse.status})`);
                console.log(`📄 Error details: ${errorText}`);
                
                // Try to parse the error for more details
                try {
                    const errorData = JSON.parse(errorText);
                    console.log('🔍 Parsed error:', errorData);
                } catch (e) {
                    console.log('🔍 Raw error text:', errorText.substring(0, 500));
                }
            } else {
                console.log('✅ Minimal payload succeeded');
                const data = await minimalResponse.json();
                console.log('📊 Response data keys:', Object.keys(data));
            }

            // Test with enhanced payload including results structure
            console.log('🧪 Testing enhanced Deep Dive payload with results...');
            const enhancedResponse = await fetch('/api/proxy/deep-dive-analyses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.userId
                },
                body: JSON.stringify({
                    objective: 'Comprehensive deep dive analysis of machine learning in medical diagnostics',
                    article_pmid: '38278529',
                    article_title: 'Machine Learning in Medical Diagnostics: A Comprehensive Review',
                    article_url: 'https://pubmed.ncbi.nlm.nih.gov/38278529/',
                    project_id: this.projectId,
                    results: {
                        scientific_model_analysis: 'Placeholder for scientific model analysis',
                        experimental_methods_analysis: 'Placeholder for experimental methods analysis',
                        results_interpretation_analysis: 'Placeholder for results interpretation analysis'
                    }
                })
            });

            if (enhancedResponse.ok) {
                console.log('✅ Enhanced payload succeeded');
                const data = await enhancedResponse.json();
                console.log('📊 Created analysis ID:', data.analysis_id);
                this.results.deepDiveFixed = true;
                this.results.deepDiveAnalysisId = data.analysis_id;
            } else {
                const errorText = await enhancedResponse.text();
                console.log(`❌ Enhanced payload failed (${enhancedResponse.status})`);
                console.log(`📄 Error: ${errorText.substring(0, 300)}`);
                this.results.deepDiveFixed = false;
            }

        } catch (error) {
            console.log(`❌ Deep Dive diagnosis error: ${error.message}`);
            this.results.deepDiveFixed = false;
        }
        console.log('');
    }

    async verifyPhdDataQuality() {
        console.log('🎓 2. PHD-LEVEL DATA QUALITY VERIFICATION');
        console.log('========================================');
        
        const endpoints = [
            {
                name: 'Literature Gap Analysis',
                url: '/api/proxy/literature-gap-analysis',
                method: 'POST',
                payload: {
                    project_id: this.projectId,
                    objective: 'Identify research gaps in machine learning for medical diagnostics',
                    gap_types: ['theoretical', 'methodological', 'empirical'],
                    academic_level: 'phd'
                }
            },
            {
                name: 'Methodology Synthesis',
                url: '/api/proxy/methodology-synthesis',
                method: 'POST',
                payload: {
                    project_id: this.projectId,
                    objective: 'Synthesize research methodologies',
                    methodology_types: ['experimental', 'observational'],
                    academic_level: 'phd'
                }
            },
            {
                name: 'Thesis Chapter Generator',
                url: '/api/proxy/thesis-chapter-generator',
                method: 'POST',
                payload: {
                    project_id: this.projectId,
                    objective: 'Generate thesis chapter',
                    academic_level: 'phd'
                }
            }
        ];

        this.results.phdDataQuality = {};

        for (const endpoint of endpoints) {
            try {
                console.log(`🧪 Testing ${endpoint.name} data quality...`);
                
                const response = await fetch(endpoint.url, {
                    method: endpoint.method,
                    headers: {
                        'Content-Type': 'application/json',
                        'User-ID': this.userId
                    },
                    body: JSON.stringify(endpoint.payload)
                });

                if (response.ok) {
                    const data = await response.json();
                    const dataStr = JSON.stringify(data);
                    
                    // Check for PhD-level indicators
                    const phdIndicators = [
                        'methodology', 'theoretical', 'empirical', 'analysis',
                        'research', 'academic', 'scholarly', 'peer-reviewed',
                        'hypothesis', 'literature', 'framework', 'paradigm'
                    ];
                    
                    const foundIndicators = phdIndicators.filter(indicator => 
                        dataStr.toLowerCase().includes(indicator)
                    );
                    
                    const contentLength = dataStr.length;
                    const hasRichContent = contentLength > 1000; // Substantial content
                    const hasPhdTerms = foundIndicators.length >= 3;
                    
                    console.log(`✅ ${endpoint.name}:`);
                    console.log(`   📊 Content length: ${contentLength} chars`);
                    console.log(`   🎓 PhD indicators found: ${foundIndicators.length}/12`);
                    console.log(`   📝 Key terms: ${foundIndicators.slice(0, 5).join(', ')}`);
                    console.log(`   ✅ Rich content: ${hasRichContent ? 'YES' : 'NO'}`);
                    console.log(`   🎓 PhD-level: ${hasPhdTerms ? 'YES' : 'NO'}`);
                    
                    this.results.phdDataQuality[endpoint.name] = {
                        contentLength,
                        phdIndicators: foundIndicators.length,
                        hasRichContent,
                        hasPhdTerms,
                        quality: hasRichContent && hasPhdTerms ? 'EXCELLENT' : 'NEEDS_REVIEW'
                    };
                } else {
                    console.log(`❌ ${endpoint.name}: Failed (${response.status})`);
                    this.results.phdDataQuality[endpoint.name] = { quality: 'FAILED' };
                }
            } catch (error) {
                console.log(`❌ ${endpoint.name}: Error - ${error.message}`);
                this.results.phdDataQuality[endpoint.name] = { quality: 'ERROR' };
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log('');
    }

    async verifyUIDataParsing() {
        console.log('🎨 3. UI DATA PARSING VERIFICATION');
        console.log('=================================');
        
        // Check current page elements
        const pageElements = {
            reportCards: document.querySelectorAll('[data-testid*="report"], .report-card, [class*="report"]'),
            analysisCards: document.querySelectorAll('[data-testid*="analysis"], .analysis-card, [class*="analysis"]'),
            dataContainers: document.querySelectorAll('[class*="content"], [class*="data"], [class*="result"]'),
            loadingStates: document.querySelectorAll('[class*="loading"], [class*="spinner"], [class*="skeleton"]'),
            errorStates: document.querySelectorAll('[class*="error"], [class*="failed"]'),
            emptyStates: document.querySelectorAll('[class*="empty"], [class*="no-data"]')
        };

        console.log('🔍 UI Element Analysis:');
        Object.entries(pageElements).forEach(([key, elements]) => {
            console.log(`   ${key}: ${elements.length} elements found`);
        });

        // Check for data parsing indicators
        const textContent = document.body.textContent || '';
        const mockDataIndicators = [
            'lorem ipsum', 'placeholder', 'sample data', 'mock',
            'test data', 'dummy', 'example content', 'coming soon'
        ];
        
        const foundMockIndicators = mockDataIndicators.filter(indicator =>
            textContent.toLowerCase().includes(indicator)
        );

        console.log(`🔍 Mock data indicators found: ${foundMockIndicators.length}`);
        if (foundMockIndicators.length > 0) {
            console.log(`⚠️ Potential mock data: ${foundMockIndicators.join(', ')}`);
        }

        this.results.uiParsing = {
            elementCounts: Object.fromEntries(
                Object.entries(pageElements).map(([key, elements]) => [key, elements.length])
            ),
            mockDataIndicators: foundMockIndicators.length,
            hasPotentialMockData: foundMockIndicators.length > 0
        };
        
        console.log('');
    }

    async verifyPayloadCompleteness() {
        console.log('📦 4. PAYLOAD COMPLETENESS VERIFICATION');
        console.log('======================================');
        
        // Test a report to check payload completeness
        try {
            const reportsResponse = await fetch(`/api/proxy/projects/${this.projectId}/reports`, {
                headers: { 'User-ID': this.userId }
            });
            
            if (reportsResponse.ok) {
                const reports = await reportsResponse.json();
                if (reports.length > 0) {
                    const reportId = reports[0].id;
                    console.log(`🧪 Testing report payload completeness: ${reportId}`);
                    
                    const reportResponse = await fetch(`/api/proxy/reports/${reportId}`, {
                        headers: { 'User-ID': this.userId }
                    });
                    
                    if (reportResponse.ok) {
                        const reportData = await reportResponse.json();
                        const payloadSize = JSON.stringify(reportData).length;
                        const hasContent = reportData.content && reportData.content.length > 100;
                        const hasMetadata = reportData.created_at && reportData.project_id;
                        
                        console.log(`✅ Report payload analysis:`);
                        console.log(`   📊 Payload size: ${payloadSize} chars`);
                        console.log(`   📝 Has substantial content: ${hasContent ? 'YES' : 'NO'}`);
                        console.log(`   📋 Has metadata: ${hasMetadata ? 'YES' : 'NO'}`);
                        console.log(`   🔑 Data keys: ${Object.keys(reportData).join(', ')}`);
                        
                        this.results.payloadCompleteness = {
                            payloadSize,
                            hasContent,
                            hasMetadata,
                            quality: hasContent && hasMetadata ? 'COMPLETE' : 'INCOMPLETE'
                        };
                    }
                }
            }
        } catch (error) {
            console.log(`❌ Payload completeness check error: ${error.message}`);
            this.results.payloadCompleteness = { quality: 'ERROR' };
        }
        
        console.log('');
    }

    async verifyPersistenceAndAccess() {
        console.log('💾 5. PERSISTENCE & WORKSPACE ACCESSIBILITY');
        console.log('==========================================');
        
        const workspaceEndpoints = [
            { name: 'Reports', url: `/api/proxy/projects/${this.projectId}/reports` },
            { name: 'Deep Dive Analyses', url: `/api/proxy/projects/${this.projectId}/deep-dive-analyses` },
            { name: 'Collections', url: `/api/proxy/projects/${this.projectId}/collections` }
        ];

        this.results.persistence = {};

        for (const endpoint of workspaceEndpoints) {
            try {
                const response = await fetch(endpoint.url, {
                    headers: { 'User-ID': this.userId }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const count = Array.isArray(data) ? data.length : 0;
                    const hasRecentItems = count > 0;
                    
                    console.log(`✅ ${endpoint.name}:`);
                    console.log(`   📊 Items found: ${count}`);
                    console.log(`   💾 Persistence: ${hasRecentItems ? 'WORKING' : 'NO_DATA'}`);
                    
                    this.results.persistence[endpoint.name] = {
                        count,
                        accessible: true,
                        hasData: hasRecentItems
                    };
                } else {
                    console.log(`❌ ${endpoint.name}: Failed (${response.status})`);
                    this.results.persistence[endpoint.name] = { accessible: false };
                }
            } catch (error) {
                console.log(`❌ ${endpoint.name}: Error - ${error.message}`);
                this.results.persistence[endpoint.name] = { accessible: false, error: error.message };
            }
        }
        
        console.log('');
    }

    async detectMockData() {
        console.log('🕵️ 6. MOCK DATA DETECTION');
        console.log('========================');
        
        // Check for common mock data patterns in the current page
        const suspiciousPhrases = [
            'lorem ipsum', 'dolor sit amet', 'consectetur adipiscing',
            'sample report', 'test analysis', 'placeholder content',
            'mock data', 'dummy text', 'example result',
            'coming soon', 'under construction', 'not implemented'
        ];

        const pageText = document.body.textContent.toLowerCase();
        const foundSuspicious = suspiciousPhrases.filter(phrase => pageText.includes(phrase));
        
        console.log(`🔍 Suspicious phrases found: ${foundSuspicious.length}`);
        if (foundSuspicious.length > 0) {
            console.log(`⚠️ Potential mock content: ${foundSuspicious.join(', ')}`);
        } else {
            console.log('✅ No obvious mock data patterns detected');
        }

        this.results.mockDataDetection = {
            suspiciousPhrasesFound: foundSuspicious.length,
            phrases: foundSuspicious,
            likelyHasMockData: foundSuspicious.length > 2
        };
        
        console.log('');
    }

    generateFinalReport() {
        console.log('📋 COMPREHENSIVE DATA QUALITY REPORT');
        console.log('===================================');
        
        // Deep Dive Analysis Status
        console.log('🔍 Deep Dive Analysis:');
        console.log(`   Status: ${this.results.deepDiveFixed ? '✅ FIXED' : '❌ NEEDS ATTENTION'}`);
        if (this.results.deepDiveAnalysisId) {
            console.log(`   Created ID: ${this.results.deepDiveAnalysisId}`);
        }
        
        // PhD Data Quality Summary
        console.log('🎓 PhD-Level Data Quality:');
        const phdQualities = Object.values(this.results.phdDataQuality || {});
        const excellentCount = phdQualities.filter(q => q.quality === 'EXCELLENT').length;
        console.log(`   Excellent quality: ${excellentCount}/${phdQualities.length} endpoints`);
        
        // UI Parsing Status
        console.log('🎨 UI Data Parsing:');
        const uiStatus = this.results.uiParsing?.hasPotentialMockData ? 'NEEDS REVIEW' : 'GOOD';
        console.log(`   Status: ${uiStatus}`);
        
        // Payload Completeness
        console.log('📦 Payload Completeness:');
        const payloadStatus = this.results.payloadCompleteness?.quality || 'UNKNOWN';
        console.log(`   Status: ${payloadStatus}`);
        
        // Persistence Status
        console.log('💾 Data Persistence:');
        const persistenceData = Object.values(this.results.persistence || {});
        const accessibleCount = persistenceData.filter(p => p.accessible).length;
        console.log(`   Accessible: ${accessibleCount}/${persistenceData.length} endpoints`);
        
        // Mock Data Detection
        console.log('🕵️ Mock Data Detection:');
        const mockStatus = this.results.mockDataDetection?.likelyHasMockData ? 'DETECTED' : 'CLEAN';
        console.log(`   Status: ${mockStatus}`);
        
        console.log('');
        console.log('🎯 OVERALL ASSESSMENT:');
        const overallScore = this.calculateOverallScore();
        console.log(`   Overall Score: ${overallScore}/100`);
        
        if (overallScore >= 90) {
            console.log('   🎉 Status: EXCELLENT - Production ready!');
        } else if (overallScore >= 75) {
            console.log('   ✅ Status: GOOD - Minor improvements needed');
        } else if (overallScore >= 60) {
            console.log('   ⚠️ Status: NEEDS ATTENTION - Several issues to address');
        } else {
            console.log('   ❌ Status: CRITICAL - Major issues need resolution');
        }
    }

    calculateOverallScore() {
        let score = 0;
        let maxScore = 0;
        
        // Deep Dive Analysis (20 points)
        maxScore += 20;
        if (this.results.deepDiveFixed) score += 20;
        
        // PhD Data Quality (30 points)
        maxScore += 30;
        const phdQualities = Object.values(this.results.phdDataQuality || {});
        const excellentCount = phdQualities.filter(q => q.quality === 'EXCELLENT').length;
        if (phdQualities.length > 0) {
            score += (excellentCount / phdQualities.length) * 30;
        }
        
        // Payload Completeness (20 points)
        maxScore += 20;
        if (this.results.payloadCompleteness?.quality === 'COMPLETE') score += 20;
        
        // Persistence (20 points)
        maxScore += 20;
        const persistenceData = Object.values(this.results.persistence || {});
        const accessibleCount = persistenceData.filter(p => p.accessible).length;
        if (persistenceData.length > 0) {
            score += (accessibleCount / persistenceData.length) * 20;
        }
        
        // Mock Data Detection (10 points - bonus for clean data)
        maxScore += 10;
        if (!this.results.mockDataDetection?.likelyHasMockData) score += 10;
        
        return Math.round((score / maxScore) * 100);
    }
}

// Global function to run the comprehensive test
window.runComprehensiveDataQualityTest = async function() {
    const tester = new ComprehensiveDataQualityTest();
    await tester.testDataQuality();
    return tester.results;
};

console.log('🔬 Comprehensive Data Quality Test loaded!');
console.log('Run: runComprehensiveDataQualityTest() to start the analysis');
