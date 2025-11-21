/**
 * Browser Console Diagnostic Script for Protocol Issues
 * 
 * Usage:
 * 1. Open your R-D Agent project page in browser
 * 2. Navigate to Lab > Protocols tab
 * 3. Open browser console (F12)
 * 4. Copy and paste this entire script
 * 5. Run: await diagnoseProtocols()
 * 
 * This will diagnose why protocols show metadata but no content.
 */

async function diagnoseProtocols() {
  console.log('🔍 ========================================');
  console.log('🔍 PROTOCOL DIAGNOSTIC TOOL');
  console.log('🔍 ========================================\n');

  // Get current URL and extract project ID
  const url = window.location.href;
  const projectIdMatch = url.match(/project\/([^\/\?]+)/);
  
  if (!projectIdMatch) {
    console.error('❌ ERROR: Not on a project page! Navigate to a project first.');
    return;
  }
  
  const projectId = projectIdMatch[1];
  console.log(`✅ Project ID: ${projectId}\n`);

  // Get user ID from localStorage
  let userId;
  try {
    const authData = localStorage.getItem('auth');
    if (authData) {
      const parsed = JSON.parse(authData);
      userId = parsed.user?.user_id || parsed.userId;
    }
    if (!userId) {
      console.error('❌ ERROR: User ID not found in localStorage');
      return;
    }
    console.log(`✅ User ID: ${userId}\n`);
  } catch (e) {
    console.error('❌ ERROR: Failed to get user ID:', e);
    return;
  }

  // API base URL
  const API_BASE = window.location.origin.includes('localhost') 
    ? 'http://localhost:8000' 
    : 'https://r-dagent-production.up.railway.app';
  
  console.log(`✅ API Base URL: ${API_BASE}\n`);

  // Fetch protocols
  console.log('📋 FETCHING PROTOCOLS');
  console.log('─────────────────────────────');
  
  try {
    const response = await fetch(`${API_BASE}/protocols/project/${projectId}`, {
      headers: {
        'User-ID': userId,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to fetch protocols:', errorText);
      return;
    }
    
    const protocols = await response.json();
    console.log(`✅ Found ${protocols.length} protocols\n`);
    
    if (protocols.length === 0) {
      console.warn('⚠️  No protocols found!');
      return;
    }
    
    // Analyze each protocol
    console.log('📊 PROTOCOL ANALYSIS');
    console.log('═══════════════════════════════════════════\n');
    
    let emptyProtocols = 0;
    let validProtocols = 0;
    
    protocols.forEach((protocol, idx) => {
      const isEmpty = (!protocol.materials || protocol.materials.length === 0) && 
                      (!protocol.steps || protocol.steps.length === 0);
      
      if (isEmpty) emptyProtocols++;
      else validProtocols++;
      
      console.log(`PROTOCOL ${idx + 1}: ${protocol.protocol_name}`);
      console.log('─'.repeat(60));
      console.log(`  Protocol ID: ${protocol.protocol_id}`);
      console.log(`  Source PMID: ${protocol.source_pmid}`);
      console.log(`  Type: ${protocol.protocol_type}`);
      console.log(`  Difficulty: ${protocol.difficulty_level}`);
      console.log(`  Duration: ${protocol.duration_estimate || 'N/A'}`);
      console.log('');
      
      // Check materials
      console.log(`  📦 Materials: ${protocol.materials?.length || 0}`);
      if (protocol.materials && protocol.materials.length > 0) {
        protocol.materials.slice(0, 3).forEach((mat, i) => {
          console.log(`     ${i + 1}. ${mat.name || 'N/A'}`);
          if (mat.amount) console.log(`        Amount: ${mat.amount}`);
          if (mat.supplier) console.log(`        Supplier: ${mat.supplier}`);
        });
        if (protocol.materials.length > 3) {
          console.log(`     ... and ${protocol.materials.length - 3} more`);
        }
      } else {
        console.log(`     ⚠️  EMPTY! No materials extracted.`);
      }
      console.log('');
      
      // Check steps
      console.log(`  📋 Steps: ${protocol.steps?.length || 0}`);
      if (protocol.steps && protocol.steps.length > 0) {
        protocol.steps.slice(0, 3).forEach((step, i) => {
          const instruction = step.instruction || step.description || 'N/A';
          console.log(`     ${i + 1}. ${instruction.substring(0, 60)}...`);
          if (step.duration) console.log(`        Duration: ${step.duration}`);
        });
        if (protocol.steps.length > 3) {
          console.log(`     ... and ${protocol.steps.length - 3} more`);
        }
      } else {
        console.log(`     ⚠️  EMPTY! No steps extracted.`);
      }
      console.log('');
      
      // Check equipment
      console.log(`  🔧 Equipment: ${protocol.equipment?.length || 0}`);
      if (protocol.equipment && protocol.equipment.length > 0) {
        protocol.equipment.slice(0, 3).forEach((eq, i) => {
          console.log(`     ${i + 1}. ${eq}`);
        });
      } else {
        console.log(`     ⚠️  EMPTY! No equipment listed.`);
      }
      console.log('');
      
      // Context-aware fields
      console.log(`  🧠 Context-Aware: ${protocol.context_aware || false}`);
      console.log(`  📊 Relevance Score: ${protocol.relevance_score || 'N/A'}/100`);
      console.log(`  🎯 Extraction Method: ${protocol.extraction_method || 'N/A'}`);
      console.log(`  📈 Extraction Confidence: ${protocol.extraction_confidence || 'N/A'}/100`);
      console.log('');
      
      if (protocol.confidence_explanation) {
        console.log(`  📝 Confidence Explanation:`);
        console.log(`     Level: ${protocol.confidence_explanation.confidence_level || 'N/A'}`);
        console.log(`     Score: ${protocol.confidence_explanation.overall_score || 'N/A'}/100`);
        if (protocol.confidence_explanation.explanation) {
          console.log(`     Reason: ${protocol.confidence_explanation.explanation.substring(0, 100)}...`);
        }
      }
      console.log('');
      
      // Status indicator
      if (isEmpty) {
        console.log(`  ❌ STATUS: EMPTY PROTOCOL (metadata only, no content)`);
      } else {
        console.log(`  ✅ STATUS: VALID PROTOCOL (has content)`);
      }
      
      console.log('');
      console.log('═'.repeat(60));
      console.log('');
    });
    
    // Summary
    console.log('\n📊 SUMMARY');
    console.log('═══════════════════════════════════════════');
    console.log(`Total protocols: ${protocols.length}`);
    console.log(`Empty protocols (no content): ${emptyProtocols}`);
    console.log(`Valid protocols (with content): ${validProtocols}`);
    console.log('');
    
    if (emptyProtocols > 0) {
      console.log('⚠️  ISSUE DETECTED:');
      console.log('   Some protocols have metadata but no actual content!');
      console.log('');
      console.log('   Possible causes:');
      console.log('   1. Paper is a review/overview without detailed experimental methods');
      console.log('   2. AI extraction failed but fallback data was saved');
      console.log('   3. Paper methods section is too vague or incomplete');
      console.log('   4. Extraction timeout occurred');
      console.log('');
      console.log('   💡 RECOMMENDATIONS:');
      console.log('   1. Try re-extracting with "force_refresh" option');
      console.log('   2. Check if the paper actually contains a detailed protocol');
      console.log('   3. Look at the paper\'s methods section manually');
      console.log('   4. Delete empty protocols and try different papers');
      console.log('');
      console.log('   Empty protocols:');
      protocols.forEach((p, idx) => {
        const isEmpty = (!p.materials || p.materials.length === 0) && 
                        (!p.steps || p.steps.length === 0);
        if (isEmpty) {
          console.log(`   - ${p.protocol_name} (PMID: ${p.source_pmid})`);
        }
      });
    } else {
      console.log('✅ All protocols have content!');
    }
    
    console.log('');
    console.log('🔍 DIAGNOSTIC COMPLETE!');
    console.log('═══════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ ERROR during diagnosis:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Export for console use
console.log('✅ Protocol Diagnostic Tool Loaded!');
console.log('');
console.log('📝 USAGE:');
console.log('─────────');
console.log('1. Make sure you are on a project page');
console.log('2. Navigate to Lab > Protocols tab');
console.log('3. Run: await diagnoseProtocols()');
console.log('');
