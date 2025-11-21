/**
 * Diagnostic Script for Protocol Extraction Issues
 * 
 * This script checks:
 * 1. If articles exist in database
 * 2. If PDF text is available
 * 3. If protocol extraction is working
 * 4. What errors are occurring
 * 
 * Usage:
 * 1. Copy this entire script
 * 2. Paste into browser console on R-D Agent page
 * 3. Run: await diagnoseProtocolExtraction(['38278529', '37481731', '38003266'])
 */

async function diagnoseProtocolExtraction(pmids) {
    console.log('🔍 PROTOCOL EXTRACTION DIAGNOSTICS');
    console.log('=' .repeat(60));
    
    const userId = localStorage.getItem('userId') || 'fredericle75019@gmail.com';
    console.log(`👤 User ID: ${userId}`);
    console.log(`📋 Testing ${pmids.length} PMIDs: ${pmids.join(', ')}`);
    console.log('');
    
    const results = [];
    
    for (const pmid of pmids) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📄 PMID: ${pmid}`);
        console.log('='.repeat(60));
        
        const result = {
            pmid,
            articleExists: false,
            pdfTextAvailable: false,
            protocolExists: false,
            errors: []
        };
        
        // Step 1: Check if article exists in database
        console.log('\n1️⃣ Checking if article exists in database...');
        try {
            const articleResponse = await fetch(`/api/proxy/articles/${pmid}`, {
                headers: { 'User-ID': userId }
            });
            
            if (articleResponse.ok) {
                const article = await articleResponse.json();
                result.articleExists = true;
                console.log(`   ✅ Article found: "${article.title?.substring(0, 60)}..."`);
                console.log(`   📊 Journal: ${article.journal}`);
                console.log(`   📅 Year: ${article.publication_year}`);
            } else if (articleResponse.status === 404) {
                result.articleExists = false;
                result.errors.push('Article not in database');
                console.log(`   ❌ Article NOT found in database (404)`);
                console.log(`   💡 Solution: Add paper to project first (Papers → Inbox → Add Paper)`);
            } else {
                const errorText = await articleResponse.text();
                result.errors.push(`Article check failed: ${errorText}`);
                console.log(`   ❌ Error checking article: ${errorText}`);
            }
        } catch (error) {
            result.errors.push(`Article check error: ${error.message}`);
            console.log(`   ❌ Exception: ${error.message}`);
        }
        
        // Step 2: Check PDF text availability
        console.log('\n2️⃣ Checking PDF text availability...');
        try {
            const pdfTextResponse = await fetch(`/api/proxy/articles/${pmid}/pdf-text`, {
                headers: { 'User-ID': userId }
            });
            
            if (pdfTextResponse.ok) {
                const pdfData = await pdfTextResponse.json();
                
                if (pdfData.pdf_text && pdfData.pdf_text.length > 0) {
                    result.pdfTextAvailable = true;
                    console.log(`   ✅ PDF text available: ${pdfData.character_count} characters`);
                    console.log(`   📄 Source: ${pdfData.pdf_source}`);
                    console.log(`   🔧 Method: ${pdfData.extraction_method}`);
                    console.log(`   📅 Extracted: ${pdfData.pdf_extracted_at}`);
                } else {
                    result.pdfTextAvailable = false;
                    result.errors.push('PDF text not available');
                    console.log(`   ⚠️  PDF text not available`);
                    if (pdfData.abstract) {
                        console.log(`   💡 Will use abstract as fallback (${pdfData.abstract.length} chars)`);
                    }
                }
            } else if (pdfTextResponse.status === 404) {
                result.errors.push('Article not found for PDF extraction');
                console.log(`   ❌ Article not found (404)`);
            } else {
                const errorText = await pdfTextResponse.text();
                result.errors.push(`PDF text check failed: ${errorText}`);
                console.log(`   ❌ Error: ${errorText}`);
            }
        } catch (error) {
            result.errors.push(`PDF text check error: ${error.message}`);
            console.log(`   ❌ Exception: ${error.message}`);
        }
        
        // Step 3: Check if protocol already exists
        console.log('\n3️⃣ Checking if protocol already exists...');
        try {
            // Get current project ID from URL or localStorage
            const projectId = window.location.pathname.match(/\/projects\/([^\/]+)/)?.[1] || 
                            localStorage.getItem('currentProjectId');
            
            if (projectId) {
                const protocolsResponse = await fetch(`/api/proxy/protocols/project/${projectId}`, {
                    headers: { 'User-ID': userId }
                });
                
                if (protocolsResponse.ok) {
                    const protocols = await protocolsResponse.json();
                    const existingProtocol = protocols.find(p => p.article_pmid === pmid);
                    
                    if (existingProtocol) {
                        result.protocolExists = true;
                        console.log(`   ✅ Protocol exists (ID: ${existingProtocol.id})`);
                        console.log(`   📊 Confidence: ${existingProtocol.confidence_score}/100`);
                        console.log(`   🧪 Materials: ${existingProtocol.materials?.length || 0}`);
                        console.log(`   📝 Steps: ${existingProtocol.steps?.length || 0}`);
                        console.log(`   📅 Extracted: ${existingProtocol.extracted_at}`);
                    } else {
                        console.log(`   ℹ️  No existing protocol found`);
                    }
                }
            } else {
                console.log(`   ⚠️  No project ID found (can't check existing protocols)`);
            }
        } catch (error) {
            console.log(`   ⚠️  Could not check existing protocols: ${error.message}`);
        }
        
        // Step 4: Summary for this PMID
        console.log('\n📊 SUMMARY:');
        console.log(`   Article in DB: ${result.articleExists ? '✅' : '❌'}`);
        console.log(`   PDF Text: ${result.pdfTextAvailable ? '✅' : '⚠️'}`);
        console.log(`   Protocol Exists: ${result.protocolExists ? '✅' : 'ℹ️'}`);
        
        if (result.errors.length > 0) {
            console.log(`   ❌ Errors: ${result.errors.length}`);
            result.errors.forEach((err, i) => {
                console.log(`      ${i + 1}. ${err}`);
            });
        }
        
        results.push(result);
    }
    
    // Overall summary
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 OVERALL SUMMARY');
    console.log('='.repeat(60));
    
    const articlesInDb = results.filter(r => r.articleExists).length;
    const withPdfText = results.filter(r => r.pdfTextAvailable).length;
    const withProtocols = results.filter(r => r.protocolExists).length;
    
    console.log(`Articles in database: ${articlesInDb}/${pmids.length}`);
    console.log(`With PDF text: ${withPdfText}/${pmids.length}`);
    console.log(`With protocols: ${withProtocols}/${pmids.length}`);
    
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (articlesInDb === 0) {
        console.log('❌ CRITICAL: No articles found in database!');
        console.log('   → Add papers to your project first:');
        console.log('   → 1. Go to Papers → Inbox');
        console.log('   → 2. Click "Add Paper"');
        console.log('   → 3. Enter PMID and add to project');
        console.log('   → 4. Then try extracting protocol');
    } else if (articlesInDb < pmids.length) {
        const missingPmids = results.filter(r => !r.articleExists).map(r => r.pmid);
        console.log(`⚠️  Some articles missing: ${missingPmids.join(', ')}`);
        console.log('   → Add these papers to your project first');
    }
    
    if (withPdfText === 0 && articlesInDb > 0) {
        console.log('⚠️  No PDF text available for any articles');
        console.log('   → Protocol extraction will use abstracts (less detailed)');
        console.log('   → Check if PDFs are available for these papers');
    }
    
    console.log('\n✅ Diagnostics complete!');
    
    return results;
}

// Auto-run if PMIDs provided
if (typeof window !== 'undefined') {
    console.log('📋 Protocol Extraction Diagnostic Tool loaded!');
    console.log('Usage: await diagnoseProtocolExtraction([\'38278529\', \'37481731\', \'38003266\'])');
}

