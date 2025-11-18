/**
 * ============================================================================
 * DIAGNOSTIC SCRIPT - Identify UI/API Issues
 * ============================================================================
 * 
 * This script helps diagnose why the comprehensive test is failing.
 * Run this FIRST before running the full test suite.
 * 
 * USAGE:
 * 1. Navigate to your project page
 * 2. Open browser console (F12)
 * 3. Copy/paste this script
 * 4. Press Enter
 * 5. Review the diagnostic results
 * ============================================================================
 */

(async function() {
  console.log('%c╔════════════════════════════════════════════════════════════════╗', 'color: #FF6B6B; font-weight: bold; font-size: 16px');
  console.log('%c║                    DIAGNOSTIC SCRIPT                          ║', 'color: #FF6B6B; font-weight: bold; font-size: 16px');
  console.log('%c╚════════════════════════════════════════════════════════════════╝', 'color: #FF6B6B; font-weight: bold; font-size: 16px');
  console.log('');

  const results = {
    url: window.location.href,
    pathname: window.location.pathname,
    projectId: null,
    userId: 'fredericle75019@gmail.com',
    issues: [],
    recommendations: []
  };

  // ============================================================================
  // 1. CHECK URL AND PROJECT ID
  // ============================================================================
  console.log('%c1. URL & PROJECT ID CHECK', 'color: #4ECDC4; font-weight: bold; font-size: 14px');
  console.log('   Current URL:', window.location.href);
  
  const urlMatch = window.location.pathname.match(/\/project\/([^\/]+)/);
  if (urlMatch) {
    results.projectId = urlMatch[1];
    console.log('   ✅ Project ID found:', results.projectId);
  } else {
    console.log('   ❌ NOT on a project page!');
    results.issues.push('Not on a project page - navigate to /project/{projectId}');
    results.recommendations.push('Navigate to a project page first');
  }
  console.log('');

  // ============================================================================
  // 2. CHECK FOR TABS
  // ============================================================================
  console.log('%c2. TAB NAVIGATION CHECK', 'color: #4ECDC4; font-weight: bold; font-size: 14px');
  
  // Find all buttons
  const allButtons = Array.from(document.querySelectorAll('button'));
  console.log(`   Total buttons found: ${allButtons.length}`);
  
  // Look for tab buttons
  const tabButtons = allButtons.filter(btn => {
    const text = btn.textContent.trim().toLowerCase();
    return text === 'questions' || text === 'papers' || text === 'hypotheses' || 
           text === 'overview' || text === 'timeline' || text === 'network';
  });
  
  console.log(`   Tab buttons found: ${tabButtons.length}`);
  tabButtons.forEach(btn => {
    console.log(`     - "${btn.textContent.trim()}" (classes: ${btn.className})`);
  });
  
  const questionsTab = allButtons.find(btn => 
    btn.textContent.trim().toLowerCase() === 'questions'
  );
  
  if (questionsTab) {
    console.log('   ✅ Questions tab button found');
    console.log('      Button text:', questionsTab.textContent.trim());
    console.log('      Button classes:', questionsTab.className);
    console.log('      Is visible:', questionsTab.offsetParent !== null);
  } else {
    console.log('   ❌ Questions tab button NOT found');
    results.issues.push('Questions tab button not found in DOM');
    results.recommendations.push('Check if you are on the correct project page');
    results.recommendations.push('Try manually clicking on the Questions tab first');
  }
  console.log('');

  // ============================================================================
  // 3. CHECK CURRENT TAB/VIEW
  // ============================================================================
  console.log('%c3. CURRENT VIEW CHECK', 'color: #4ECDC4; font-weight: bold; font-size: 14px');
  
  // Check for Questions tab content
  const addQuestionBtn = allButtons.find(btn => 
    btn.textContent.includes('Add Question') || 
    btn.textContent.includes('Add Your First Question')
  );
  
  if (addQuestionBtn) {
    console.log('   ✅ Already on Questions tab (Add Question button found)');
    console.log('      Button text:', addQuestionBtn.textContent.trim());
  } else {
    console.log('   ⚠️  Not currently on Questions tab');
    console.log('      Need to navigate to Questions tab first');
  }
  console.log('');

  // ============================================================================
  // 4. CHECK API CONNECTIVITY
  // ============================================================================
  console.log('%c4. API CONNECTIVITY CHECK', 'color: #4ECDC4; font-weight: bold; font-size: 14px');
  
  if (results.projectId) {
    try {
      console.log('   Testing API endpoint...');
      const response = await fetch(`/api/proxy/questions/project/${results.projectId}`, {
        headers: {
          'User-ID': results.userId
        }
      });
      
      console.log('   Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ API is accessible');
        console.log(`   Questions in database: ${data.length}`);
        
        if (data.length > 0) {
          console.log('   Sample question:', data[0].question_text);
        } else {
          console.log('   ⚠️  No questions exist yet in this project');
        }
      } else {
        console.log('   ❌ API returned error:', response.status, response.statusText);
        results.issues.push(`API error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log('   ❌ API call failed:', error.message);
      results.issues.push(`API connectivity issue: ${error.message}`);
      results.recommendations.push('Check if backend is running on Railway');
    }
  }
  console.log('');

  // ============================================================================
  // 5. CHECK FOR MODALS
  // ============================================================================
  console.log('%c5. MODAL CHECK', 'color: #4ECDC4; font-weight: bold; font-size: 14px');
  
  const modals = document.querySelectorAll('[role="dialog"]');
  console.log(`   Modals currently open: ${modals.length}`);
  
  if (modals.length > 0) {
    console.log('   ⚠️  Modal is currently open - close it before running tests');
    results.recommendations.push('Close any open modals before running tests');
  } else {
    console.log('   ✅ No modals open');
  }
  console.log('');

  // ============================================================================
  // 6. CHECK FOR QUESTIONS IN DOM
  // ============================================================================
  console.log('%c6. QUESTIONS IN DOM CHECK', 'color: #4ECDC4; font-weight: bold; font-size: 14px');
  
  const questionElements = document.querySelectorAll('[data-question-id], [class*="question"]');
  console.log(`   Question-related elements: ${questionElements.length}`);
  
  if (questionElements.length === 0) {
    console.log('   ⚠️  No question elements found in DOM');
    console.log('      This could mean:');
    console.log('      - Not on Questions tab');
    console.log('      - No questions created yet');
    console.log('      - Questions not rendering');
  }
  console.log('');

  // ============================================================================
  // 7. CHECK FOR FORM INPUTS
  // ============================================================================
  console.log('%c7. FORM INPUTS CHECK', 'color: #4ECDC4; font-weight: bold; font-size: 14px');
  
  const inputs = document.querySelectorAll('input, textarea, select');
  console.log(`   Total form inputs: ${inputs.length}`);
  
  const textInputs = document.querySelectorAll('input[type="text"], textarea');
  console.log(`   Text inputs/textareas: ${textInputs.length}`);
  
  const selects = document.querySelectorAll('select');
  console.log(`   Select dropdowns: ${selects.length}`);
  console.log('');

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('%c═══════════════════════════════════════════════════════════════', 'color: #FF6B6B; font-weight: bold');
  console.log('%cDIAGNOSTIC SUMMARY', 'color: #FF6B6B; font-weight: bold; font-size: 14px');
  console.log('%c═══════════════════════════════════════════════════════════════', 'color: #FF6B6B; font-weight: bold');
  console.log('');
  
  if (results.issues.length === 0) {
    console.log('%c✅ NO CRITICAL ISSUES FOUND', 'color: #1DB954; font-weight: bold');
    console.log('   The test suite should work correctly.');
  } else {
    console.log('%c❌ ISSUES FOUND:', 'color: #FF6B6B; font-weight: bold');
    results.issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`);
    });
  }
  console.log('');
  
  if (results.recommendations.length > 0) {
    console.log('%c💡 RECOMMENDATIONS:', 'color: #FFD93D; font-weight: bold');
    results.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });
  }
  console.log('');
  
  console.log('%c📊 Full diagnostic results saved to window.diagnosticResults', 'color: #4ECDC4; font-weight: bold');
  window.diagnosticResults = results;
  
  return results;
})();

