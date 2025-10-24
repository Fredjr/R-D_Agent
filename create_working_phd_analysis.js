#!/usr/bin/env node

/**
 * 🎯 CREATE WORKING PhD ANALYSIS
 * =============================
 * 
 * This script creates a single working PhD analysis that you can actually view
 * with rich content, bypassing all the database update issues.
 */

const PROJECT_ID = '5ac213d7-6fcc-46ff-9420-5c7f4b421012';
const USER_ID = 'fredericle77@gmail.com';
const BACKEND_URL = 'https://r-dagent-production.up.railway.app';

async function createWorkingPhDAnalysis() {
    console.log('🎯 CREATING WORKING PhD ANALYSIS');
    console.log('================================');
    
    try {
        // STEP 1: Create a new deep dive analysis with a real article
        console.log('📄 Step 1: Creating new deep dive analysis...');
        
        const deepDiveResponse = await fetch(`${BACKEND_URL}/deep-dive`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-ID': USER_ID
            },
            body: JSON.stringify({
                pmid: "33393497", // Real PMID for finerenone study
                title: "Effect of Finerenone on Chronic Kidney Disease Outcomes in Type 2 Diabetes (PhD Enhanced)",
                objective: "Comprehensive PhD-level analysis of finerenone's effects on chronic kidney disease outcomes in type 2 diabetes patients",
                projectId: PROJECT_ID,
                enhanced_analysis: true,
                phd_level: true,
                analysis_depth: "comprehensive",
                include_methodology: true,
                include_statistical_analysis: true,
                include_clinical_implications: true
            })
        });

        if (!deepDiveResponse.ok) {
            throw new Error(`Deep dive creation failed: ${deepDiveResponse.status}`);
        }

        const deepDiveData = await deepDiveResponse.json();
        console.log(`✅ Created deep dive analysis: ${deepDiveData.analysis_id}`);
        console.log(`📋 Title: ${deepDiveData.article_title}`);
        console.log(`🔄 Status: ${deepDiveData.processing_status}`);
        
        // STEP 2: Wait for processing to complete
        console.log('⏳ Step 2: Waiting for analysis to complete...');
        
        let attempts = 0;
        const maxAttempts = 30; // 5 minutes max
        let analysisComplete = false;
        
        while (attempts < maxAttempts && !analysisComplete) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
            attempts++;
            
            console.log(`🔍 Checking progress... (attempt ${attempts}/${maxAttempts})`);
            
            try {
                const statusResponse = await fetch(`${BACKEND_URL}/deep-dive-analyses/${deepDiveData.analysis_id}`, {
                    headers: { 'User-ID': USER_ID }
                });
                
                if (statusResponse.ok) {
                    const statusData = await statusResponse.json();
                    console.log(`📊 Status: ${statusData.processing_status}`);
                    
                    if (statusData.processing_status === 'completed') {
                        analysisComplete = true;
                        
                        // Check for content
                        const hasContent = !!(
                            statusData.scientific_model_analysis || 
                            statusData.experimental_methods_analysis || 
                            statusData.results_interpretation_analysis
                        );
                        
                        if (hasContent) {
                            console.log('🎉 SUCCESS! Analysis completed with content!');
                            console.log('📊 Content Summary:');
                            console.log(`   Scientific Model: ${statusData.scientific_model_analysis ? 'FOUND' : 'MISSING'}`);
                            console.log(`   Experimental Methods: ${statusData.experimental_methods_analysis ? 'FOUND' : 'MISSING'}`);
                            console.log(`   Results Interpretation: ${statusData.results_interpretation_analysis ? 'FOUND' : 'MISSING'}`);
                            
                            if (statusData.scientific_model_analysis) {
                                const contentLength = JSON.stringify(statusData.scientific_model_analysis).length;
                                console.log(`   Content Length: ${contentLength} chars`);
                            }
                            
                            console.log('');
                            console.log('🔗 WORKING PhD ANALYSIS URL:');
                            console.log(`https://frontend-psi-seven-85.vercel.app/deep-dive/${deepDiveData.analysis_id}`);
                            console.log('');
                            console.log('🎯 You can now open this URL to see rich PhD-level content!');
                            
                            return {
                                success: true,
                                analysis_id: deepDiveData.analysis_id,
                                url: `https://frontend-psi-seven-85.vercel.app/deep-dive/${deepDiveData.analysis_id}`,
                                content_length: statusData.scientific_model_analysis ? 
                                    JSON.stringify(statusData.scientific_model_analysis).length : 0
                            };
                        } else {
                            console.log('⚠️ Analysis completed but no content found');
                        }
                    } else if (statusData.processing_status === 'failed') {
                        console.log('❌ Analysis failed');
                        break;
                    }
                }
            } catch (error) {
                console.log(`⚠️ Status check failed: ${error.message}`);
            }
        }
        
        if (!analysisComplete) {
            console.log('⏰ Analysis taking longer than expected, but it may still complete');
            console.log(`🔗 Check this URL later: https://frontend-psi-seven-85.vercel.app/deep-dive/${deepDiveData.analysis_id}`);
            
            return {
                success: false,
                analysis_id: deepDiveData.analysis_id,
                url: `https://frontend-psi-seven-85.vercel.app/deep-dive/${deepDiveData.analysis_id}`,
                status: 'timeout'
            };
        }
        
    } catch (error) {
        console.error('💥 Failed to create working PhD analysis:', error.message);
        return { success: false, error: error.message };
    }
}

// STEP 3: Also create a working report
async function createWorkingPhDReport() {
    console.log('📋 CREATING WORKING PhD REPORT');
    console.log('==============================');
    
    try {
        // Generate rich summary content first
        console.log('📊 Generating PhD summary content...');
        
        const summaryResponse = await fetch(`${BACKEND_URL}/generate-summary`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-ID': USER_ID
            },
            body: JSON.stringify({
                project_id: PROJECT_ID,
                objective: "Generate comprehensive PhD-level summary of finerenone research with enhanced analysis",
                summary_type: 'comprehensive',
                academic_level: 'phd',
                include_methodology: true,
                include_gaps: true,
                target_length: 3000
            })
        });

        if (!summaryResponse.ok) {
            throw new Error(`Summary generation failed: ${summaryResponse.status}`);
        }

        const summaryData = await summaryResponse.json();
        console.log(`✅ Generated summary: ${summaryData.summary_content?.length || 0} chars`);

        // Create new report with the generated content
        console.log('📄 Creating new report with PhD content...');
        
        const reportResponse = await fetch(`${BACKEND_URL}/projects/${PROJECT_ID}/reports`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-ID': USER_ID
            },
            body: JSON.stringify({
                title: "Finerenone Research - PhD Enhanced Analysis",
                objective: "Comprehensive PhD-level analysis of finerenone's therapeutic potential in chronic kidney disease and cardiovascular outcomes",
                molecule: "finerenone",
                clinical_mode: true,
                dag_mode: false,
                full_text_only: true,
                preference: "precision",
                content: {
                    phd_enhanced: true,
                    summary_analysis: summaryData,
                    enhancement_metadata: {
                        created_at: new Date().toISOString(),
                        quality_level: 'phd_comprehensive',
                        content_type: 'enhanced_summary'
                    }
                },
                summary: `📋 **PhD-Enhanced Finerenone Analysis** • 📊 **Comprehensive Summary**: ${summaryData.summary_content?.split(' ').length || 0} words of PhD-level analysis • ✨ **Quality Level**: PhD-enhanced with comprehensive analysis • 🕒 **Created**: ${new Date().toLocaleDateString()}`,
                status: 'completed',
                created_by: USER_ID
            })
        });

        if (!reportResponse.ok) {
            throw new Error(`Report creation failed: ${reportResponse.status}`);
        }

        const reportData = await reportResponse.json();
        console.log(`✅ Created report: ${reportData.report_id}`);
        console.log(`📋 Title: ${reportData.title}`);
        
        console.log('');
        console.log('🔗 WORKING PhD REPORT URL:');
        console.log(`https://frontend-psi-seven-85.vercel.app/report/${reportData.report_id}`);
        console.log('');
        console.log('🎯 You can now open this URL to see rich PhD-level report content!');
        
        return {
            success: true,
            report_id: reportData.report_id,
            url: `https://frontend-psi-seven-85.vercel.app/report/${reportData.report_id}`,
            content_length: JSON.stringify(summaryData).length
        };
        
    } catch (error) {
        console.error('💥 Failed to create working PhD report:', error.message);
        return { success: false, error: error.message };
    }
}

// Run both functions
async function main() {
    console.log('🚀 CREATING WORKING PhD CONTENT');
    console.log('===============================');
    console.log('');
    
    // Create working deep dive analysis
    const analysisResult = await createWorkingPhDAnalysis();
    console.log('');
    
    // Create working report
    const reportResult = await createWorkingPhDReport();
    console.log('');
    
    // Final summary
    console.log('🎉 FINAL RESULTS:');
    console.log('=================');
    
    if (analysisResult.success) {
        console.log(`✅ Deep Dive Analysis: ${analysisResult.url}`);
    } else {
        console.log(`❌ Deep Dive Analysis: Failed (${analysisResult.error || analysisResult.status})`);
    }
    
    if (reportResult.success) {
        console.log(`✅ PhD Report: ${reportResult.url}`);
    } else {
        console.log(`❌ PhD Report: Failed (${reportResult.error})`);
    }
    
    console.log('');
    console.log('🔗 Check your project at: https://frontend-psi-seven-85.vercel.app/project/5ac213d7-6fcc-46ff-9420-5c7f4b421012');
}

if (require.main === module) {
    main().catch(error => {
        console.error('💥 Script failed:', error);
        process.exit(1);
    });
}

module.exports = { createWorkingPhDAnalysis, createWorkingPhDReport };
