/**
 * 🎓 ULTIMATE PHD-LEVEL VALIDATION TEST
 * 
 * This test validates the complete R&D Agent workflow with stringent PhD-level quality analysis:
 * 1. Generate Review (Finerenone inflammatory mechanisms)
 * 2. Deep Dive on article from Generate Review results
 * 3. Standalone Deep Dive on specific PMID 33099609
 * 4. PhD-level data quality analysis for all outputs
 * 5. UI report accessibility and content persistence verification
 */

class UltimatePhdValidationTest {
    constructor() {
        this.baseUrl = 'https://frontend-psi-seven-85.vercel.app/api/proxy';
        this.userId = 'e29e29d3-f87f-4c70-9aeb-424002382195';
        this.projectId = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
        this.results = {
            generateReview: null,
            deepDiveFromReview: null,
            standaloneDeepDive: null,
            qualityAnalysis: {},
            uiPersistence: {}
        };
        this.phdQualityMetrics = {
            contentDepth: { min: 1000, excellent: 3000 },
            keywordDensity: { min: 5, excellent: 15 },
            academicStructure: ['methodology', 'results', 'analysis', 'conclusions'],
            citationQuality: { min: 3, excellent: 10 },
            technicalTerms: ['mechanism', 'pathway', 'receptor', 'antagonist', 'cardiovascular']
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString().substring(11, 19);
        const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '📋';
        console.log(`${emoji} [${timestamp}] ${message}`);
    }

    async makeRequest(endpoint, data, method = 'POST') {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.userId
                },
                body: method === 'GET' ? undefined : JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            throw new Error(`Request failed: ${error.message}`);
        }
    }

    async waitForJobCompletion(jobId, maxWaitMinutes = 5) {
        const maxAttempts = maxWaitMinutes * 2; // Check every 30 seconds
        let attempts = 0;

        while (attempts < maxAttempts) {
            try {
                const status = await this.makeRequest(`/background-jobs/${jobId}/status`, null, 'GET');
                
                if (status.status === 'completed') {
                    return status;
                } else if (status.status === 'failed') {
                    throw new Error(`Job failed: ${status.error_message}`);
                }

                this.log(`Job ${jobId} status: ${status.status} (attempt ${attempts + 1}/${maxAttempts})`);
                await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
                attempts++;
            } catch (error) {
                throw new Error(`Failed to check job status: ${error.message}`);
            }
        }

        throw new Error(`Job ${jobId} did not complete within ${maxWaitMinutes} minutes`);
    }

    analyzePhdQuality(content, contentType) {
        const analysis = {
            contentType,
            scores: {},
            issues: [],
            strengths: [],
            overallGrade: 'F'
        };

        // Convert content to string for analysis
        const textContent = typeof content === 'string' ? content : JSON.stringify(content);
        const lowerContent = textContent.toLowerCase();

        // 1. Content Depth Analysis
        const contentLength = textContent.length;
        if (contentLength >= this.phdQualityMetrics.contentDepth.excellent) {
            analysis.scores.contentDepth = 'A';
            analysis.strengths.push(`Excellent content depth: ${contentLength} characters`);
        } else if (contentLength >= this.phdQualityMetrics.contentDepth.min) {
            analysis.scores.contentDepth = 'B';
            analysis.strengths.push(`Good content depth: ${contentLength} characters`);
        } else {
            analysis.scores.contentDepth = 'D';
            analysis.issues.push(`Insufficient content depth: ${contentLength} characters (min: ${this.phdQualityMetrics.contentDepth.min})`);
        }

        // 2. Keyword Density Analysis
        const finerenoneCount = (lowerContent.match(/finerenone/g) || []).length;
        const aldosteroneCount = (lowerContent.match(/aldosterone/g) || []).length;
        const inflammatoryCount = (lowerContent.match(/inflammatory|inflammation/g) || []).length;
        const totalKeywords = finerenoneCount + aldosteroneCount + inflammatoryCount;

        if (totalKeywords >= this.phdQualityMetrics.keywordDensity.excellent) {
            analysis.scores.keywordDensity = 'A';
            analysis.strengths.push(`Excellent keyword density: ${totalKeywords} mentions`);
        } else if (totalKeywords >= this.phdQualityMetrics.keywordDensity.min) {
            analysis.scores.keywordDensity = 'B';
            analysis.strengths.push(`Good keyword density: ${totalKeywords} mentions`);
        } else {
            analysis.scores.keywordDensity = 'D';
            analysis.issues.push(`Low keyword density: ${totalKeywords} mentions (min: ${this.phdQualityMetrics.keywordDensity.min})`);
        }

        // 3. Technical Terms Analysis
        const technicalTermsFound = this.phdQualityMetrics.technicalTerms.filter(term => 
            lowerContent.includes(term.toLowerCase())
        );

        if (technicalTermsFound.length >= 4) {
            analysis.scores.technicalTerms = 'A';
            analysis.strengths.push(`Excellent technical vocabulary: ${technicalTermsFound.join(', ')}`);
        } else if (technicalTermsFound.length >= 2) {
            analysis.scores.technicalTerms = 'B';
            analysis.strengths.push(`Good technical vocabulary: ${technicalTermsFound.join(', ')}`);
        } else {
            analysis.scores.technicalTerms = 'D';
            analysis.issues.push(`Limited technical vocabulary: ${technicalTermsFound.join(', ')}`);
        }

        // 4. Academic Structure Analysis (for structured content)
        if (typeof content === 'object' && content !== null) {
            const hasStructure = content.results || content.sections || content.scientific_model_analysis;
            if (hasStructure) {
                analysis.scores.academicStructure = 'A';
                analysis.strengths.push('Well-structured academic format');
            } else {
                analysis.scores.academicStructure = 'C';
                analysis.issues.push('Limited academic structure');
            }
        }

        // Calculate Overall Grade
        const scores = Object.values(analysis.scores);
        const aCount = scores.filter(s => s === 'A').length;
        const bCount = scores.filter(s => s === 'B').length;
        const dCount = scores.filter(s => s === 'D').length;

        if (aCount >= 3) analysis.overallGrade = 'A';
        else if (aCount + bCount >= 3) analysis.overallGrade = 'B';
        else if (dCount <= 1) analysis.overallGrade = 'C';
        else analysis.overallGrade = 'D';

        return analysis;
    }

    async step1_GenerateReview() {
        this.log('🎓 STEP 1: Generate Review - Finerenone Inflammatory Mechanisms', 'info');
        
        const requestData = {
            project_id: this.projectId,
            molecule: 'Finerenone',
            objective: 'Summarize the inflammatory mechanism of aldosterone and the anti-inflammatory mechanism of finerenone in the HFpEF',
            review_type: 'systematic',
            academic_level: 'phd',
            target_length: 3000,
            include_methodology: true
        };

        try {
            // Start background job
            const jobResponse = await this.makeRequest('/background-jobs/generate-review', requestData);
            this.log(`Generate Review job started: ${jobResponse.job_id}`);

            // Wait for completion
            const completedJob = await this.waitForJobCompletion(jobResponse.job_id);
            this.log('Generate Review job completed', 'success');

            // Fetch the report
            const reportId = completedJob.result_data.report_id;
            const report = await this.makeRequest(`/reports/${reportId}`, null, 'GET');
            
            this.results.generateReview = {
                jobId: jobResponse.job_id,
                reportId: reportId,
                content: report.content,
                title: report.title,
                created_at: report.created_at
            };

            // PhD Quality Analysis
            this.results.qualityAnalysis.generateReview = this.analyzePhdQuality(
                report.content, 
                'Generate Review'
            );

            this.log(`Generate Review Quality Grade: ${this.results.qualityAnalysis.generateReview.overallGrade}`, 
                this.results.qualityAnalysis.generateReview.overallGrade === 'A' ? 'success' : 'warning');

            return this.results.generateReview;
        } catch (error) {
            this.log(`Generate Review failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async step2_DeepDiveFromReview() {
        this.log('🎓 STEP 2: Deep Dive on Article from Generate Review', 'info');
        
        if (!this.results.generateReview?.content?.papers?.length) {
            throw new Error('No papers found in Generate Review results');
        }

        // Select the first paper from Generate Review results
        const selectedPaper = this.results.generateReview.content.papers[0];
        this.log(`Selected paper: ${selectedPaper.title} (PMID: ${selectedPaper.pmid})`);

        const requestData = {
            project_id: this.projectId,
            pmid: selectedPaper.pmid,
            url: selectedPaper.url,
            title: selectedPaper.title,
            objective: `Deep dive analysis of: ${selectedPaper.title}`
        };

        try {
            // Start background job
            const jobResponse = await this.makeRequest('/background-jobs/deep-dive', requestData);
            this.log(`Deep Dive (from review) job started: ${jobResponse.job_id}`);

            // Wait for completion
            const completedJob = await this.waitForJobCompletion(jobResponse.job_id);
            this.log('Deep Dive (from review) job completed', 'success');

            // Fetch the analysis
            const analysisId = completedJob.result_data.analysis_id;
            const analyses = await this.makeRequest('/deep-dive-analyses', null, 'GET');
            const analysis = analyses.analyses.find(a => a.analysis_id === analysisId);
            
            this.results.deepDiveFromReview = {
                jobId: jobResponse.job_id,
                analysisId: analysisId,
                selectedPaper: selectedPaper,
                analysis: analysis
            };

            // PhD Quality Analysis
            this.results.qualityAnalysis.deepDiveFromReview = this.analyzePhdQuality(
                analysis, 
                'Deep Dive from Review'
            );

            this.log(`Deep Dive (from review) Quality Grade: ${this.results.qualityAnalysis.deepDiveFromReview.overallGrade}`, 
                this.results.qualityAnalysis.deepDiveFromReview.overallGrade === 'A' ? 'success' : 'warning');

            return this.results.deepDiveFromReview;
        } catch (error) {
            this.log(`Deep Dive (from review) failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async step3_StandaloneDeepDive() {
        this.log('🎓 STEP 3: Standalone Deep Dive - PMID 33099609', 'info');

        const requestData = {
            project_id: this.projectId,
            pmid: '33099609',
            url: 'https://pubmed.ncbi.nlm.nih.gov/33099609/',
            title: 'Finerenone cardiovascular outcomes study',
            objective: 'Deep dive analysis of finerenone cardiovascular outcomes study'
        };

        try {
            // Start background job
            const jobResponse = await this.makeRequest('/background-jobs/deep-dive', requestData);
            this.log(`Standalone Deep Dive job started: ${jobResponse.job_id}`);

            // Wait for completion
            const completedJob = await this.waitForJobCompletion(jobResponse.job_id);
            this.log('Standalone Deep Dive job completed', 'success');

            // Fetch the analysis
            const analysisId = completedJob.result_data.analysis_id;
            const analyses = await this.makeRequest('/deep-dive-analyses', null, 'GET');
            const analysis = analyses.analyses.find(a => a.analysis_id === analysisId);

            this.results.standaloneDeepDive = {
                jobId: jobResponse.job_id,
                analysisId: analysisId,
                pmid: '33099609',
                analysis: analysis
            };

            // PhD Quality Analysis
            this.results.qualityAnalysis.standaloneDeepDive = this.analyzePhdQuality(
                analysis,
                'Standalone Deep Dive'
            );

            this.log(`Standalone Deep Dive Quality Grade: ${this.results.qualityAnalysis.standaloneDeepDive.overallGrade}`,
                this.results.qualityAnalysis.standaloneDeepDive.overallGrade === 'A' ? 'success' : 'warning');

            return this.results.standaloneDeepDive;
        } catch (error) {
            this.log(`Standalone Deep Dive failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async step4_VerifyUIPersistence() {
        this.log('🎓 STEP 4: UI Report Accessibility & Content Persistence', 'info');

        try {
            // Test Generate Review report persistence
            if (this.results.generateReview?.reportId) {
                const reportId = this.results.generateReview.reportId;
                const report = await this.makeRequest(`/reports/${reportId}`, null, 'GET');

                this.results.uiPersistence.generateReviewReport = {
                    accessible: true,
                    contentPersisted: report.content && Object.keys(report.content).length > 0,
                    contentLength: JSON.stringify(report.content).length,
                    title: report.title,
                    uiUrl: `https://frontend-psi-seven-85.vercel.app/report/${reportId}`
                };

                this.log(`Generate Review report accessible: ${reportId}`, 'success');
            }

            // Test Deep Dive analyses persistence
            const analyses = await this.makeRequest('/deep-dive-analyses', null, 'GET');
            const recentAnalyses = analyses.analyses.filter(a =>
                new Date(a.created_at) > new Date(Date.now() - 2 * 60 * 60 * 1000) // Last 2 hours
            );

            this.results.uiPersistence.deepDiveAnalyses = {
                totalAnalyses: analyses.analyses.length,
                recentAnalyses: recentAnalyses.length,
                accessible: recentAnalyses.length > 0,
                analysisIds: recentAnalyses.map(a => a.analysis_id)
            };

            this.log(`Deep Dive analyses accessible: ${recentAnalyses.length} recent analyses`, 'success');

            // Test project workspace accessibility
            const projectReports = await this.makeRequest(`/projects/${this.projectId}/reports`, null, 'GET');

            this.results.uiPersistence.projectWorkspace = {
                accessible: true,
                reportsCount: projectReports.reports?.length || 0,
                projectUrl: `https://frontend-psi-seven-85.vercel.app/projects/${this.projectId}`
            };

            this.log(`Project workspace accessible with ${projectReports.reports?.length || 0} reports`, 'success');

            return this.results.uiPersistence;
        } catch (error) {
            this.log(`UI Persistence verification failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async runCompleteValidation() {
        this.log('🎓 STARTING ULTIMATE PHD-LEVEL VALIDATION TEST', 'info');
        this.log('================================================================================');

        try {
            // Step 1: Generate Review
            await this.step1_GenerateReview();

            // Step 2: Deep Dive on article from Generate Review
            await this.step2_DeepDiveFromReview();

            // Step 3: Standalone Deep Dive on specific PMID
            await this.step3_StandaloneDeepDive();

            // Step 4: UI Persistence Verification
            await this.step4_VerifyUIPersistence();

            this.log('🎉 ULTIMATE PHD VALIDATION COMPLETED', 'success');
            this.displayFinalResults();

        } catch (error) {
            this.log(`Validation test failed: ${error.message}`, 'error');
            throw error;
        }
    }

    displayFinalResults() {
        console.log('\n🎓 ULTIMATE PHD-LEVEL VALIDATION RESULTS');
        console.log('================================================================================');

        // PhD Quality Analysis Results
        console.log('\n📊 PHD QUALITY ANALYSIS:');
        Object.entries(this.results.qualityAnalysis).forEach(([step, analysis]) => {
            const gradeEmoji = analysis.overallGrade === 'A' ? '🏆' : analysis.overallGrade === 'B' ? '✅' : '⚠️';
            console.log(`\n${gradeEmoji} ${step.toUpperCase()} - Grade: ${analysis.overallGrade}`);
            console.log('  Strengths:', analysis.strengths);
            if (analysis.issues.length > 0) {
                console.log('  Issues:', analysis.issues);
            }
            console.log('  Detailed Scores:', analysis.scores);
        });

        // UI Persistence Results
        console.log('\n🖥️ UI PERSISTENCE & ACCESSIBILITY:');
        if (this.results.uiPersistence.generateReviewReport) {
            const report = this.results.uiPersistence.generateReviewReport;
            console.log(`\n📋 Generate Review Report:`);
            console.log(`  ✅ Accessible: ${report.accessible}`);
            console.log(`  ✅ Content Persisted: ${report.contentPersisted}`);
            console.log(`  📊 Content Length: ${report.contentLength} characters`);
            console.log(`  🔗 UI URL: ${report.uiUrl}`);
        }

        if (this.results.uiPersistence.deepDiveAnalyses) {
            const analyses = this.results.uiPersistence.deepDiveAnalyses;
            console.log(`\n🔬 Deep Dive Analyses:`);
            console.log(`  ✅ Accessible: ${analyses.accessible}`);
            console.log(`  📊 Total Analyses: ${analyses.totalAnalyses}`);
            console.log(`  📊 Recent Analyses: ${analyses.recentAnalyses}`);
            console.log(`  🆔 Analysis IDs: ${analyses.analysisIds.join(', ')}`);
        }

        if (this.results.uiPersistence.projectWorkspace) {
            const workspace = this.results.uiPersistence.projectWorkspace;
            console.log(`\n📁 Project Workspace:`);
            console.log(`  ✅ Accessible: ${workspace.accessible}`);
            console.log(`  📊 Reports Count: ${workspace.reportsCount}`);
            console.log(`  🔗 Project URL: ${workspace.projectUrl}`);
        }

        // Overall Assessment
        console.log('\n🎯 OVERALL ASSESSMENT:');
        const grades = Object.values(this.results.qualityAnalysis).map(a => a.overallGrade);
        const aCount = grades.filter(g => g === 'A').length;
        const bCount = grades.filter(g => g === 'B').length;

        let overallGrade = 'D';
        if (aCount >= 2) overallGrade = 'A';
        else if (aCount + bCount >= 2) overallGrade = 'B';
        else if (grades.every(g => g !== 'F')) overallGrade = 'C';

        const overallEmoji = overallGrade === 'A' ? '🏆' : overallGrade === 'B' ? '✅' : '⚠️';
        console.log(`${overallEmoji} Overall Platform Grade: ${overallGrade}`);

        // Workflow Validation
        console.log('\n🔄 WORKFLOW VALIDATION:');
        console.log(`✅ Generate Review → Deep Dive: ${this.results.deepDiveFromReview ? 'SUCCESS' : 'FAILED'}`);
        console.log(`✅ Standalone Deep Dive: ${this.results.standaloneDeepDive ? 'SUCCESS' : 'FAILED'}`);
        console.log(`✅ UI Persistence: ${this.results.uiPersistence.generateReviewReport?.contentPersisted ? 'SUCCESS' : 'FAILED'}`);

        console.log('\n🎉 ULTIMATE PHD VALIDATION COMPLETE!');
    }
}

// Auto-run the validation test
const validator = new UltimatePhdValidationTest();
validator.runCompleteValidation().then(() => {
    console.log('🎉 ULTIMATE PHD VALIDATION COMPLETED!');
}).catch(error => {
    console.log('❌ ULTIMATE PHD VALIDATION FAILED:', error.message);
});
