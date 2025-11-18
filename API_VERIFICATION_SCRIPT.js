/**
 * ============================================================================
 * API VERIFICATION SCRIPT
 * ============================================================================
 * 
 * This script checks if questions/hypotheses are being created in the database
 * even though they don't appear in the UI.
 * 
 * USAGE:
 * 1. After running the comprehensive test (and seeing failures)
 * 2. Copy/paste this script into browser console
 * 3. Press Enter
 * 4. Check if data exists in database but not in UI
 * ============================================================================
 */

(async function() {
  console.log('%c╔════════════════════════════════════════════════════════════════╗', 'color: #FFD93D; font-weight: bold; font-size: 16px');
  console.log('%c║              API VERIFICATION SCRIPT                           ║', 'color: #FFD93D; font-weight: bold; font-size: 16px');
  console.log('%c╚════════════════════════════════════════════════════════════════╝', 'color: #FFD93D; font-weight: bold; font-size: 16px');
  console.log('');

  const userId = 'fredericle75019@gmail.com';
  const urlMatch = window.location.pathname.match(/\/project\/([^\/]+)/);
  
  if (!urlMatch) {
    console.error('❌ Not on a project page');
    return;
  }
  
  const projectId = urlMatch[1];
  console.log('✅ Project ID:', projectId);
  console.log('✅ User ID:', userId);
  console.log('');

  // ============================================================================
  // CHECK QUESTIONS
  // ============================================================================
  console.log('%c1. CHECKING QUESTIONS IN DATABASE', 'color: #4ECDC4; font-weight: bold; font-size: 14px');
  
  try {
    const questionsResponse = await fetch(`/api/proxy/questions/project/${projectId}`, {
      headers: { 'User-ID': userId }
    });
    
    if (questionsResponse.ok) {
      const questions = await questionsResponse.json();
      console.log(`   📊 Questions in database: ${questions.length}`);
      
      if (questions.length > 0) {
        console.log('   ✅ Questions exist in database!');
        console.log('');
        console.log('   📋 Question List:');
        questions.forEach((q, i) => {
          console.log(`      ${i + 1}. "${q.question_text}"`);
          console.log(`         ID: ${q.question_id}`);
          console.log(`         Status: ${q.status}`);
          console.log(`         Created: ${new Date(q.created_at).toLocaleString()}`);
          console.log('');
        });
        
        // Check if questions are in DOM
        console.log('   🔍 Checking if questions appear in DOM...');
        const questionsInDOM = questions.filter(q => {
          const found = Array.from(document.querySelectorAll('*')).some(el =>
            el.textContent.includes(q.question_text)
          );
          return found;
        });
        
        console.log(`   📊 Questions visible in DOM: ${questionsInDOM.length}/${questions.length}`);
        
        if (questionsInDOM.length < questions.length) {
          console.log('   ❌ ISSUE FOUND: Questions exist in database but NOT in DOM!');
          console.log('   💡 This is a UI refresh/state management issue');
          console.log('');
          console.log('   Missing from DOM:');
          questions.forEach(q => {
            const inDOM = Array.from(document.querySelectorAll('*')).some(el =>
              el.textContent.includes(q.question_text)
            );
            if (!inDOM) {
              console.log(`      - "${q.question_text}" (ID: ${q.question_id})`);
            }
          });
        } else {
          console.log('   ✅ All questions are visible in DOM');
        }
      } else {
        console.log('   ⚠️  No questions in database');
        console.log('   💡 Try creating a question manually and check if it appears');
      }
    } else {
      console.log(`   ❌ API error: ${questionsResponse.status} ${questionsResponse.statusText}`);
    }
  } catch (error) {
    console.log('   ❌ Failed to fetch questions:', error.message);
  }
  console.log('');

  // ============================================================================
  // CHECK HYPOTHESES
  // ============================================================================
  console.log('%c2. CHECKING HYPOTHESES IN DATABASE', 'color: #4ECDC4; font-weight: bold; font-size: 14px');
  
  try {
    const hypothesesResponse = await fetch(`/api/proxy/hypotheses/project/${projectId}`, {
      headers: { 'User-ID': userId }
    });
    
    if (hypothesesResponse.ok) {
      const hypotheses = await hypothesesResponse.json();
      console.log(`   📊 Hypotheses in database: ${hypotheses.length}`);
      
      if (hypotheses.length > 0) {
        console.log('   ✅ Hypotheses exist in database!');
        console.log('');
        console.log('   📋 Hypothesis List:');
        hypotheses.forEach((h, i) => {
          console.log(`      ${i + 1}. "${h.hypothesis_text}"`);
          console.log(`         ID: ${h.hypothesis_id}`);
          console.log(`         Type: ${h.hypothesis_type}`);
          console.log(`         Status: ${h.status}`);
          console.log(`         Confidence: ${h.confidence_level}%`);
          console.log('');
        });
        
        // Check if hypotheses are in DOM
        console.log('   🔍 Checking if hypotheses appear in DOM...');
        const hypothesesInDOM = hypotheses.filter(h => {
          const found = Array.from(document.querySelectorAll('*')).some(el =>
            el.textContent.includes(h.hypothesis_text)
          );
          return found;
        });
        
        console.log(`   📊 Hypotheses visible in DOM: ${hypothesesInDOM.length}/${hypotheses.length}`);
        
        if (hypothesesInDOM.length < hypotheses.length) {
          console.log('   ❌ ISSUE FOUND: Hypotheses exist in database but NOT in DOM!');
          console.log('   💡 This is a UI refresh/state management issue');
        } else {
          console.log('   ✅ All hypotheses are visible in DOM');
        }
      } else {
        console.log('   ⚠️  No hypotheses in database');
      }
    } else {
      console.log(`   ❌ API error: ${hypothesesResponse.status} ${hypothesesResponse.statusText}`);
    }
  } catch (error) {
    console.log('   ❌ Failed to fetch hypotheses:', error.message);
  }
  console.log('');

  // ============================================================================
  // RECOMMENDATIONS
  // ============================================================================
  console.log('%c═══════════════════════════════════════════════════════════════', 'color: #FFD93D; font-weight: bold');
  console.log('%cRECOMMENDATIONS', 'color: #FFD93D; font-weight: bold; font-size: 14px');
  console.log('%c═══════════════════════════════════════════════════════════════', 'color: #FFD93D; font-weight: bold');
  console.log('');
  
  console.log('💡 If data exists in database but NOT in DOM:');
  console.log('   1. Try refreshing the page (F5)');
  console.log('   2. Check if questions appear after refresh');
  console.log('   3. This indicates the UI needs to refetch data after creation');
  console.log('');
  console.log('💡 If data does NOT exist in database:');
  console.log('   1. Check browser Network tab for failed API calls');
  console.log('   2. Check backend logs on Railway');
  console.log('   3. Verify User-ID header is being sent correctly');
  console.log('');
  console.log('💡 Quick Fix Test:');
  console.log('   1. Create a question manually');
  console.log('   2. Refresh the page (F5)');
  console.log('   3. If it appears after refresh, the issue is UI state management');
  console.log('');

})();

