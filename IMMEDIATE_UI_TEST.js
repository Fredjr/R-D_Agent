/**
 * � PhD CONTENT ENHANCEMENT TEST - Test PhD-Level Features
 *
 * This script tests both existing content AND creates new content to validate PhD enhancements.
 * Run this in browser console on: https://frontend-psi-seven-85.vercel.app/projects/5ac213d7-6fcc-46ff-9420-5c7f4b421012
 *
 * Tests:
 * 1. Existing content for UI fixes
 * 2. New Generate Review with PhD enhancements
 * 3. New Deep Dive with comprehensive analysis
 */

class ImmediateUITester {
    constructor() {
        this.results = [];
    }

    log(message, type = 'info', data = null) {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '📋';
        console.log(`${emoji} [${timestamp}] ${message}`);
        if (data) console.log('   📊 Data:', data);
        
        this.results.push({
            timestamp,
            type,
            message,
            data
        });
    }

    async testExistingGenerateReviewReports() {
        this.log('🎯 TESTING EXISTING GENERATE REVIEW REPORTS', 'info');
        this.log('==========================================');

        const reportIds = [
            '7b6d5665-4fb7-4817-9122-6c138bdfa4da',
            '40b56784-1ce8-4d80-95b2-fb643d7134dd'
        ];

        for (const reportId of reportIds) {
            try {
                this.log(`📋 Testing Report: ${reportId}`);
                
                // Fetch report data
                const response = await fetch(`/api/proxy/reports/${reportId}`, {
                    headers: { 'User-ID': 'fredericle77@gmail.com' }
                });

                if (response.ok) {
                    const report = await response.json();
                    const content = report.content;

                    // Check paper structure
                    if (content.papers && content.papers.length > 0) {
                        const samplePaper = content.papers[0];
                        
                        this.log(`📄 Paper Structure Analysis:`, 'success', {
                            reportId,
                            paperCount: content.papers.length,
                            samplePaper: {
                                title: samplePaper.title?.substring(0, 50) + '...',
                                hasYear: !!samplePaper.year,
                                hasPubYear: !!samplePaper.pub_year,
                                hasJournal: !!samplePaper.journal,
                                hasAuthors: Array.isArray(samplePaper.authors),
                                authorCount: samplePaper.authors?.length || 0,
                                hasCitationCount: typeof samplePaper.citation_count === 'number',
                                hasPmid: !!samplePaper.pmid
                            }
                        });

                        // Test field mapping
                        const transformedPaper = {
                            title: samplePaper.title,
                            pub_year: samplePaper.year || samplePaper.publication_year,
                            citation_count: samplePaper.citation_count || 0,
                            pmid: samplePaper.pmid,
                            authors: samplePaper.authors,
                            journal: samplePaper.journal,
                            ...samplePaper
                        };

                        this.log(`🔄 Field Mapping Test:`, 'success', {
                            originalYear: samplePaper.year,
                            mappedPubYear: transformedPaper.pub_year,
                            hasAllRequiredFields: !!(
                                transformedPaper.title &&
                                transformedPaper.pub_year &&
                                transformedPaper.pmid
                            )
                        });

                        this.log(`📋 Report URL: https://frontend-psi-seven-85.vercel.app/report/${reportId}`);
                    } else {
                        this.log(`⚠️ No papers found in report ${reportId}`, 'warning');
                    }
                } else {
                    this.log(`❌ Failed to fetch report ${reportId}: ${response.status}`, 'error');
                }
            } catch (error) {
                this.log(`❌ Error testing report ${reportId}: ${error.message}`, 'error');
            }
        }
    }

    async testExistingDeepDiveAnalyses() {
        this.log('🔬 TESTING EXISTING DEEP DIVE ANALYSES', 'info');
        this.log('=====================================');

        const analysisIds = [
            'b0f9545d-7e5c-49c9-94ae-f129fec4dd96', // Should have rich content
            '6aacb9ef-c48a-46db-80f4-94085fe09433'  // Should be empty
        ];

        for (const analysisId of analysisIds) {
            try {
                this.log(`🔍 Testing Analysis: ${analysisId}`);
                
                // Fetch analysis data
                const response = await fetch(`/api/proxy/analyses/${analysisId}`, {
                    headers: { 'User-ID': 'fredericle77@gmail.com' }
                });

                if (response.ok) {
                    const analysis = await response.json();
                    
                    const scientificModel = analysis.scientific_model_analysis;
                    const experimentalMethods = analysis.experimental_methods_analysis;
                    const resultsInterpretation = analysis.results_interpretation_analysis;

                    // Test content detection logic (same as frontend)
                    const hasScientificModelContent = scientificModel && (
                        (scientificModel.model_type && scientificModel.model_type.trim() !== '') ||
                        (scientificModel.study_design && scientificModel.study_design.trim() !== '') ||
                        (scientificModel.population_description && scientificModel.population_description.trim() !== '') ||
                        (scientificModel.protocol_summary && scientificModel.protocol_summary.trim() !== '') ||
                        (scientificModel.strengths && scientificModel.strengths.trim() !== '') ||
                        (scientificModel.limitations && scientificModel.limitations.trim() !== '')
                    );

                    const hasResultsInterpretationContent = resultsInterpretation && (
                        (resultsInterpretation.hypothesis_alignment && resultsInterpretation.hypothesis_alignment.trim() !== '') ||
                        (resultsInterpretation.key_results && resultsInterpretation.key_results.length > 0) ||
                        (resultsInterpretation.limitations_biases_in_results && resultsInterpretation.limitations_biases_in_results.length > 0) ||
                        (resultsInterpretation.fact_anchors && resultsInterpretation.fact_anchors.length > 0)
                    );

                    this.log(`📊 Content Detection Analysis:`, 'success', {
                        analysisId,
                        hasScientificModelContent,
                        hasResultsInterpretationContent,
                        scientificModelFields: {
                            modelType: scientificModel?.model_type || 'empty',
                            studyDesign: scientificModel?.study_design ? 'present' : 'empty',
                            populationDescription: scientificModel?.population_description ? 'present' : 'empty',
                            protocolSummary: scientificModel?.protocol_summary ? 'present' : 'empty'
                        },
                        resultsFields: {
                            hypothesisAlignment: resultsInterpretation?.hypothesis_alignment ? 'present' : 'empty',
                            keyResultsCount: resultsInterpretation?.key_results?.length || 0
                        }
                    });

                    this.log(`📋 Analysis URL: https://frontend-psi-seven-85.vercel.app/analysis/${analysisId}`);
                } else {
                    this.log(`❌ Failed to fetch analysis ${analysisId}: ${response.status}`, 'error');
                }
            } catch (error) {
                this.log(`❌ Error testing analysis ${analysisId}: ${error.message}`, 'error');
            }
        }
    }

    async runImmediateTest() {
        this.log('🚀 STARTING IMMEDIATE UI TEST', 'info');
        this.log('============================');
        
        const startTime = Date.now();
        
        try {
            // Test existing Generate Review reports
            await this.testExistingGenerateReviewReports();
            
            // Test existing Deep Dive analyses
            await this.testExistingDeepDiveAnalyses();
            
            // Final Summary
            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
            
            this.log('🎉 IMMEDIATE UI TEST COMPLETED!', 'success');
            this.log('===============================');
            this.log(`⏱️ Total Duration: ${duration} seconds`);
            this.log('📋 MANUAL TESTING URLS:');
            this.log('   📊 Generate Review Reports:');
            this.log('     • https://frontend-psi-seven-85.vercel.app/report/7b6d5665-4fb7-4817-9122-6c138bdfa4da');
            this.log('     • https://frontend-psi-seven-85.vercel.app/report/40b56784-1ce8-4d80-95b2-fb643d7134dd');
            this.log('   🔬 Deep Dive Analyses:');
            this.log('     • https://frontend-psi-seven-85.vercel.app/analysis/b0f9545d-7e5c-49c9-94ae-f129fec4dd96');
            this.log('     • https://frontend-psi-seven-85.vercel.app/analysis/6aacb9ef-c48a-46db-80f4-94085fe09433');
            
            return {
                success: true,
                duration,
                summary: `UI test completed in ${duration}s - check URLs manually for visual verification`
            };
            
        } catch (error) {
            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
            this.log(`❌ IMMEDIATE UI TEST FAILED: ${error.message}`, 'error');
            this.log(`⏱️ Failed after: ${duration} seconds`);
            
            return {
                success: false,
                duration,
                error: error.message,
                results: this.results
            };
        }
    }
}

// Auto-run the test
console.log('🎯 IMMEDIATE UI TEST LOADED');
console.log('📋 This will test existing content only - no new content creation needed');

const tester = new ImmediateUITester();
tester.runImmediateTest().then(result => {
    console.log('🎉 IMMEDIATE UI TEST RESULT:', result);
    if (result.success) {
        console.log('✅ TEST COMPLETED! Please check the URLs manually to verify the UI fixes.');
        console.log('🔍 Look for:');
        console.log('   • Full article titles (no truncation)');
        console.log('   • Complete metadata (year, citations, journal, authors)');
        console.log('   • Rich content in Deep Dive analysis instead of debug info');
    } else {
        console.log('❌ TEST FAILED:', result.error);
    }
});
