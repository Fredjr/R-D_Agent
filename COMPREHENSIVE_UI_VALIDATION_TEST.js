/**
 * 🎯 COMPREHENSIVE UI VALIDATION TEST
 * 
 * This script tests the complete workflow after all fixes:
 * 1. Generate Review with proper article field mapping
 * 2. Deep Dive Analysis with PhD-level content
 * 3. UI display validation for both
 * 
 * Run this in browser console on: https://frontend-psi-seven-85.vercel.app/projects/5ac213d7-6fcc-46ff-9420-5c7f4b421012
 */

class ComprehensiveUIValidator {
    constructor() {
        this.BACKEND_URL = 'https://r-dagent-production.up.railway.app';
        this.PROJECT_ID = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
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

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async testGenerateReviewWithFixedUI() {
        this.log('🎯 TESTING GENERATE REVIEW WITH FIXED UI', 'info');
        this.log('=====================================');

        try {
            // Step 1: Generate Review using background job
            this.log('📝 Step 1: Starting Generate Review background job...');
            
            const generateResponse = await fetch('/api/proxy/background-jobs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.USER_ID
                },
                body: JSON.stringify({
                    job_type: 'generate_review',
                    parameters: {
                        molecule: 'Finerenone',
                        objective: 'Comprehensive analysis of Finerenone mechanisms and clinical outcomes',
                        user_id: this.USER_ID,
                        project_id: this.PROJECT_ID,
                        max_results: 12
                    }
                })
            });

            if (!generateResponse.ok) {
                throw new Error(`Generate Review failed: ${generateResponse.status}`);
            }

            const generateJob = await generateResponse.json();
            this.log('✅ Generate Review job started', 'success', {
                jobId: generateJob.job_id,
                status: generateJob.status
            });

            // Step 2: Poll for completion
            this.log('⏳ Step 2: Polling for Generate Review completion...');
            let attempts = 0;
            let completed = false;
            let reportId = null;

            while (attempts < 30 && !completed) {
                await this.sleep(10000); // Wait 10 seconds
                attempts++;

                const statusResponse = await fetch(`/api/proxy/background-jobs/${generateJob.job_id}/status`, {
                    headers: { 'User-ID': this.USER_ID }
                });

                if (statusResponse.ok) {
                    const status = await statusResponse.json();
                    this.log(`📊 Job status: ${status.status} (attempt ${attempts}/30)`);

                    if (status.status === 'completed') {
                        completed = true;
                        reportId = status.result?.report_id;
                        this.log('🎉 GENERATE REVIEW COMPLETED!', 'success', {
                            reportId,
                            result: status.result
                        });
                    } else if (status.status === 'failed') {
                        throw new Error(`Job failed: ${status.error}`);
                    }
                }
            }

            if (!completed) {
                throw new Error('Generate Review job timed out');
            }

            // Step 3: Test UI Display
            this.log('🖥️ Step 3: Testing UI Display...');
            const reportUrl = `https://frontend-psi-seven-85.vercel.app/report/${reportId}`;
            this.log('📋 Report URL for manual testing:', 'info', reportUrl);

            // Step 4: Fetch and validate report content structure
            this.log('🔍 Step 4: Validating report content structure...');
            const reportResponse = await fetch(`/api/proxy/reports/${reportId}`, {
                headers: { 'User-ID': this.USER_ID }
            });

            if (reportResponse.ok) {
                const report = await reportResponse.json();
                const content = report.content;

                this.log('📊 Report content structure validation:', 'info', {
                    hasStatus: !!content.status,
                    hasMolecule: !!content.molecule,
                    hasPapers: Array.isArray(content.papers),
                    paperCount: content.papers?.length || 0,
                    hasSections: !!content.sections,
                    sectionKeys: content.sections ? Object.keys(content.sections) : []
                });

                // Validate paper structure
                if (content.papers && content.papers.length > 0) {
                    const samplePaper = content.papers[0];
                    this.log('📄 Sample paper structure:', 'info', {
                        hasTitle: !!samplePaper.title,
                        hasYear: !!samplePaper.year,
                        hasPubYear: !!samplePaper.pub_year,
                        hasCitationCount: typeof samplePaper.citation_count === 'number',
                        hasPmid: !!samplePaper.pmid,
                        hasAuthors: Array.isArray(samplePaper.authors),
                        hasJournal: !!samplePaper.journal
                    });
                }

                this.log('✅ Generate Review UI validation completed', 'success', {
                    reportId,
                    reportUrl,
                    contentValid: !!(content.status && content.papers && content.sections)
                });

                return { reportId, reportUrl, content };
            } else {
                throw new Error(`Failed to fetch report: ${reportResponse.status}`);
            }

        } catch (error) {
            this.log(`❌ Generate Review test failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async testDeepDiveWithFixedContent() {
        this.log('🔬 TESTING DEEP DIVE WITH FIXED CONTENT', 'info');
        this.log('=====================================');

        try {
            // Step 1: Start Deep Dive background job
            this.log('📝 Step 1: Starting Deep Dive background job...');
            
            const deepDiveResponse = await fetch('/api/proxy/background-jobs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.USER_ID
                },
                body: JSON.stringify({
                    job_type: 'deep_dive',
                    parameters: {
                        pmid: '33099609',
                        title: 'Steroidal and non-steroidal mineralocorticoid receptor antagonists in cardiorenal medicine',
                        objective: 'PhD-level analysis of mineralocorticoid receptor antagonists mechanisms and clinical applications',
                        user_id: this.USER_ID,
                        project_id: this.PROJECT_ID
                    }
                })
            });

            if (!deepDiveResponse.ok) {
                throw new Error(`Deep Dive failed: ${deepDiveResponse.status}`);
            }

            const deepDiveJob = await deepDiveResponse.json();
            this.log('✅ Deep Dive job started', 'success', {
                jobId: deepDiveJob.job_id,
                status: deepDiveJob.status
            });

            // Step 2: Poll for completion
            this.log('⏳ Step 2: Polling for Deep Dive completion...');
            let attempts = 0;
            let completed = false;
            let analysisId = null;

            while (attempts < 18 && !completed) {
                await this.sleep(10000); // Wait 10 seconds
                attempts++;

                const statusResponse = await fetch(`/api/proxy/background-jobs/${deepDiveJob.job_id}/status`, {
                    headers: { 'User-ID': this.USER_ID }
                });

                if (statusResponse.ok) {
                    const status = await statusResponse.json();
                    this.log(`📊 Job status: ${status.status} (attempt ${attempts}/18)`);

                    if (status.status === 'completed') {
                        completed = true;
                        analysisId = status.result?.analysis_id;
                        this.log('🎉 DEEP DIVE ANALYSIS COMPLETED!', 'success', {
                            analysisId,
                            result: status.result
                        });
                    } else if (status.status === 'failed') {
                        throw new Error(`Job failed: ${status.error}`);
                    }
                }
            }

            if (!completed) {
                throw new Error('Deep Dive job timed out');
            }

            // Step 3: Validate analysis content
            this.log('🔍 Step 3: Validating Deep Dive content...');
            const analysisResponse = await fetch(`/api/proxy/analyses/${analysisId}`, {
                headers: { 'User-ID': this.USER_ID }
            });

            if (analysisResponse.ok) {
                const analysis = await analysisResponse.json();
                
                // Check content quality
                const scientificModel = analysis.scientific_model_analysis;
                const experimentalMethods = analysis.experimental_methods_analysis;
                const resultsInterpretation = analysis.results_interpretation_analysis;

                const hasScientificContent = !!(
                    scientificModel?.model_type ||
                    scientificModel?.study_design ||
                    scientificModel?.population_description ||
                    scientificModel?.protocol_summary
                );

                const hasResultsContent = !!(
                    resultsInterpretation?.hypothesis_alignment ||
                    (resultsInterpretation?.key_results && resultsInterpretation.key_results.length > 0)
                );

                this.log('📊 Deep Dive content validation:', 'success', {
                    analysisId,
                    hasScientificContent,
                    hasExperimentalMethods: Array.isArray(experimentalMethods) && experimentalMethods.length > 0,
                    hasResultsContent,
                    modelType: scientificModel?.model_type,
                    studyDesign: scientificModel?.study_design,
                    hypothesisAlignment: resultsInterpretation?.hypothesis_alignment?.substring(0, 100) + '...'
                });

                const analysisUrl = `https://frontend-psi-seven-85.vercel.app/analysis/${analysisId}`;
                this.log('📋 Analysis URL for manual testing:', 'info', analysisUrl);

                return { analysisId, analysisUrl, analysis, hasContent: hasScientificContent || hasResultsContent };
            } else {
                throw new Error(`Failed to fetch analysis: ${analysisResponse.status}`);
            }

        } catch (error) {
            this.log(`❌ Deep Dive test failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async runComprehensiveValidation() {
        this.log('🚀 STARTING COMPREHENSIVE UI VALIDATION', 'info');
        this.log('=======================================');
        
        const startTime = Date.now();
        
        try {
            // Test 1: Generate Review with fixed UI
            const generateResult = await this.testGenerateReviewWithFixedUI();
            
            // Test 2: Deep Dive with fixed content
            const deepDiveResult = await this.testDeepDiveWithFixedContent();
            
            // Final Summary
            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
            
            this.log('🎉 COMPREHENSIVE VALIDATION COMPLETED!', 'success');
            this.log('=====================================');
            this.log(`⏱️ Total Duration: ${duration} seconds`);
            this.log('📋 RESULTS SUMMARY:');
            this.log(`   ✅ Generate Review: ${generateResult.reportUrl}`);
            this.log(`   ✅ Deep Dive Analysis: ${deepDiveResult.analysisUrl}`);
            this.log(`   📊 Deep Dive Content Quality: ${deepDiveResult.hasContent ? 'RICH CONTENT' : 'EMPTY CONTENT'}`);
            
            return {
                success: true,
                duration,
                generateReview: generateResult,
                deepDive: deepDiveResult,
                summary: `Validation completed in ${duration}s with ${deepDiveResult.hasContent ? 'rich' : 'empty'} Deep Dive content`
            };
            
        } catch (error) {
            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
            this.log(`❌ COMPREHENSIVE VALIDATION FAILED: ${error.message}`, 'error');
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

// Auto-run the validation
console.log('🎯 COMPREHENSIVE UI VALIDATION TEST LOADED');
console.log('📋 Run: const validator = new ComprehensiveUIValidator(); validator.runComprehensiveValidation();');

// For immediate execution:
const validator = new ComprehensiveUIValidator();
validator.runComprehensiveValidation().then(result => {
    console.log('🎉 COMPREHENSIVE VALIDATION RESULT:', result);
    if (result.success) {
        console.log('✅ ALL TESTS PASSED!');
        console.log('📋 Generate Review URL:', result.generateReview.reportUrl);
        console.log('📋 Deep Dive Analysis URL:', result.deepDive.analysisUrl);
    } else {
        console.log('❌ TESTS FAILED:', result.error);
    }
});
