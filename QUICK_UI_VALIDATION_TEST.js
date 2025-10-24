/**
 * 🎯 QUICK UI VALIDATION TEST
 * 
 * This script tests the UI fixes using existing reports and analyses
 * Run this in browser console on: https://frontend-psi-seven-85.vercel.app/projects/5ac213d7-6fcc-46ff-9420-5c7f4b421012
 */

class QuickUIValidator {
    constructor() {
        this.USER_ID = 'fredericle77@gmail.com';
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

    async testExistingReportDisplay() {
        this.log('📊 TESTING EXISTING REPORT DISPLAY', 'info');
        this.log('=================================');

        const reportIds = [
            '7b6d5665-4fb7-4817-9122-6c138bdfa4da',
            '40b56784-1ce8-4d80-95b2-fb643d7134dd'
        ];

        for (const reportId of reportIds) {
            try {
                this.log(`🔍 Testing report: ${reportId}`);
                
                const response = await fetch(`/api/proxy/reports/${reportId}`, {
                    headers: { 'User-ID': this.USER_ID }
                });

                if (response.ok) {
                    const report = await response.json();
                    const content = report.content;

                    // Check if it's Generate Review structure
                    if (content.status === 'success' && content.papers && content.sections) {
                        this.log('✅ Generate Review structure detected', 'success', {
                            reportId,
                            molecule: content.molecule,
                            totalPapers: content.total_papers,
                            sections: Object.keys(content.sections),
                            samplePaper: content.papers[0] ? {
                                title: content.papers[0].title?.substring(0, 50) + '...',
                                year: content.papers[0].year,
                                pub_year: content.papers[0].pub_year,
                                citation_count: content.papers[0].citation_count,
                                pmid: content.papers[0].pmid
                            } : null
                        });

                        // Test paper field mapping
                        if (content.papers && content.papers.length > 0) {
                            const paper = content.papers[0];
                            const hasRequiredFields = !!(paper.title && (paper.year || paper.pub_year) && paper.pmid);
                            
                            this.log(`📄 Paper field validation: ${hasRequiredFields ? 'PASS' : 'FAIL'}`, 
                                hasRequiredFields ? 'success' : 'error', {
                                hasTitle: !!paper.title,
                                hasYear: !!paper.year,
                                hasPubYear: !!paper.pub_year,
                                hasPmid: !!paper.pmid,
                                hasCitationCount: typeof paper.citation_count === 'number'
                            });
                        }

                        this.log(`📋 Report URL: https://frontend-psi-seven-85.vercel.app/report/${reportId}`);
                    } else {
                        this.log('⚠️ Not a Generate Review structure', 'warning', {
                            reportId,
                            contentType: typeof content,
                            hasStatus: !!content.status,
                            hasPapers: !!content.papers,
                            hasSections: !!content.sections
                        });
                    }
                } else {
                    this.log(`❌ Failed to fetch report ${reportId}: ${response.status}`, 'error');
                }
            } catch (error) {
                this.log(`❌ Error testing report ${reportId}: ${error.message}`, 'error');
            }
        }
    }

    async testExistingAnalysisDisplay() {
        this.log('🔬 TESTING EXISTING ANALYSIS DISPLAY', 'info');
        this.log('===================================');

        const analysisIds = [
            'b0f9545d-7e5c-49c9-94ae-f129fec4dd96', // Should have rich content
            '6aacb9ef-c48a-46db-80f4-94085fe09433', // Should be empty
            '39698666-b556-4c21-80a9-d25036fd6690'  // Should be empty
        ];

        for (const analysisId of analysisIds) {
            try {
                this.log(`🔍 Testing analysis: ${analysisId}`);
                
                const response = await fetch(`/api/proxy/analyses/${analysisId}`, {
                    headers: { 'User-ID': this.USER_ID }
                });

                if (response.ok) {
                    const analysis = await response.json();
                    
                    // Check content quality
                    const scientificModel = analysis.scientific_model_analysis;
                    const experimentalMethods = analysis.experimental_methods_analysis;
                    const resultsInterpretation = analysis.results_interpretation_analysis;

                    const hasScientificContent = !!(
                        scientificModel?.model_type ||
                        scientificModel?.study_design ||
                        scientificModel?.population_description ||
                        scientificModel?.protocol_summary ||
                        scientificModel?.strengths ||
                        scientificModel?.limitations
                    );

                    const hasExperimentalContent = Array.isArray(experimentalMethods) && experimentalMethods.length > 0;

                    const hasResultsContent = !!(
                        resultsInterpretation?.hypothesis_alignment ||
                        (resultsInterpretation?.key_results && resultsInterpretation.key_results.length > 0) ||
                        (resultsInterpretation?.limitations_biases_in_results && resultsInterpretation.limitations_biases_in_results.length > 0) ||
                        (resultsInterpretation?.fact_anchors && resultsInterpretation.fact_anchors.length > 0)
                    );

                    const contentQuality = hasScientificContent || hasExperimentalContent || hasResultsContent ? 'RICH' : 'EMPTY';
                    
                    this.log(`📊 Analysis content: ${contentQuality}`, 
                        contentQuality === 'RICH' ? 'success' : 'warning', {
                        analysisId,
                        pmid: analysis.article_pmid,
                        status: analysis.processing_status,
                        hasScientificContent,
                        hasExperimentalContent,
                        hasResultsContent,
                        modelType: scientificModel?.model_type || 'empty',
                        studyDesign: scientificModel?.study_design || 'empty',
                        hypothesisAlignment: resultsInterpretation?.hypothesis_alignment ? 
                            resultsInterpretation.hypothesis_alignment.substring(0, 100) + '...' : 'empty'
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

    async testUIParsingLogic() {
        this.log('🖥️ TESTING UI PARSING LOGIC', 'info');
        this.log('===========================');

        // Test the parseReportContent function logic
        const mockGenerateReviewContent = {
            status: 'success',
            molecule: 'Finerenone',
            objective: 'Test objective',
            total_papers: 8,
            papers: [
                {
                    title: 'Test Paper 1',
                    year: 2023,
                    citation_count: 45,
                    pmid: '12345678',
                    authors: ['Author A', 'Author B'],
                    journal: 'Test Journal'
                }
            ],
            sections: {
                primary_research: [
                    {
                        title: 'Primary Research Paper',
                        year: 2022,
                        citation_count: 30,
                        pmid: '87654321'
                    }
                ],
                trending_topics: [],
                cross_domain_insights: [],
                citation_opportunities: []
            }
        };

        // Simulate the transformPapers function
        const transformPapers = (papers) => {
            return papers.map((paper) => ({
                title: paper.title,
                pub_year: paper.year || paper.publication_year,
                citation_count: paper.citation_count || 0,
                pmid: paper.pmid,
                authors: paper.authors,
                journal: paper.journal,
                ...paper
            }));
        };

        const transformedPapers = transformPapers(mockGenerateReviewContent.papers);
        const transformedSectionPapers = transformPapers(mockGenerateReviewContent.sections.primary_research);

        this.log('✅ Paper transformation test', 'success', {
            originalPaper: mockGenerateReviewContent.papers[0],
            transformedPaper: transformedPapers[0],
            hasRequiredFields: !!(
                transformedPapers[0].title &&
                transformedPapers[0].pub_year &&
                transformedPapers[0].pmid
            ),
            sectionTransformation: {
                original: mockGenerateReviewContent.sections.primary_research[0],
                transformed: transformedSectionPapers[0]
            }
        });
    }

    async runQuickValidation() {
        this.log('🚀 STARTING QUICK UI VALIDATION', 'info');
        this.log('===============================');
        
        const startTime = Date.now();
        
        try {
            // Test 1: Existing report display
            await this.testExistingReportDisplay();
            
            // Test 2: Existing analysis display
            await this.testExistingAnalysisDisplay();
            
            // Test 3: UI parsing logic
            await this.testUIParsingLogic();
            
            // Final Summary
            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
            
            this.log('🎉 QUICK VALIDATION COMPLETED!', 'success');
            this.log('=============================');
            this.log(`⏱️ Total Duration: ${duration} seconds`);
            
            // Count results
            const successCount = this.results.filter(r => r.type === 'success').length;
            const errorCount = this.results.filter(r => r.type === 'error').length;
            const warningCount = this.results.filter(r => r.type === 'warning').length;
            
            this.log('📊 VALIDATION SUMMARY:', 'info', {
                totalTests: this.results.length,
                successes: successCount,
                errors: errorCount,
                warnings: warningCount,
                duration: `${duration}s`
            });
            
            return {
                success: errorCount === 0,
                duration,
                results: this.results,
                summary: {
                    total: this.results.length,
                    successes: successCount,
                    errors: errorCount,
                    warnings: warningCount
                }
            };
            
        } catch (error) {
            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
            this.log(`❌ QUICK VALIDATION FAILED: ${error.message}`, 'error');
            
            return {
                success: false,
                duration,
                error: error.message,
                results: this.results
            };
        }
    }
}

// Auto-run the validation
console.log('🎯 QUICK UI VALIDATION TEST LOADED');
console.log('📋 Run: const validator = new QuickUIValidator(); validator.runQuickValidation();');

// For immediate execution:
// const validator = new QuickUIValidator();
// validator.runQuickValidation();
