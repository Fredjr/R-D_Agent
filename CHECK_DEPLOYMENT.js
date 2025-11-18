/**
 * ============================================================================
 * CHECK IF HYPOTHESIS FIX IS DEPLOYED
 * ============================================================================
 * 
 * This script checks if the "Add Hypothesis" button fix is live on your site.
 * 
 * USAGE:
 * 1. Make sure you're on the Questions tab
 * 2. Copy/paste this entire script into browser console
 * 3. Press Enter
 * 4. It will tell you if the fix is deployed
 * ============================================================================
 */

console.log('%c╔════════════════════════════════════════════════════════════════╗', 'color: #1DB954; font-weight: bold; font-size: 18px');
console.log('%c║         CHECKING HYPOTHESIS BUTTON DEPLOYMENT                 ║', 'color: #1DB954; font-weight: bold; font-size: 18px');
console.log('%c╚════════════════════════════════════════════════════════════════╝', 'color: #1DB954; font-weight: bold; font-size: 18px');
console.log('');

// Check if we're on the Questions tab
const currentPath = window.location.pathname;
const isQuestionsTab = currentPath.includes('/project/');

if (!isQuestionsTab) {
  console.log('%c❌ NOT ON QUESTIONS TAB', 'color: #ff4444; font-weight: bold; font-size: 16px');
  console.log('');
  console.log('Please navigate to the Questions tab first:');
  console.log('1. Click "Research Questions" in the navigation');
  console.log('2. Run this script again');
  console.log('');
} else {
  console.log('%c✅ ON QUESTIONS TAB', 'color: #1DB954; font-weight: bold; font-size: 16px');
  console.log('');
  
  // Wait a moment for React to render
  setTimeout(() => {
    // Look for question cards
    const questionCards = document.querySelectorAll('[class*="group relative rounded-lg border"]');
    
    if (questionCards.length === 0) {
      console.log('%c⚠️  NO QUESTION CARDS FOUND', 'color: #ffaa00; font-weight: bold; font-size: 16px');
      console.log('');
      console.log('This could mean:');
      console.log('1. You haven\'t created any questions yet');
      console.log('2. The page is still loading');
      console.log('3. You\'re not on the Questions tab');
      console.log('');
      console.log('Try:');
      console.log('1. Refresh the page');
      console.log('2. Create a question using "Define Research Question"');
      console.log('3. Run this script again');
      console.log('');
    } else {
      console.log(`%c✅ FOUND ${questionCards.length} QUESTION CARD(S)`, 'color: #1DB954; font-weight: bold; font-size: 16px');
      console.log('');
      
      // Check each card for the hypothesis button
      let foundHypothesisButton = false;
      
      questionCards.forEach((card, index) => {
        // Look for buttons with "hypothesis" or "Add Hypothesis" text
        const buttons = card.querySelectorAll('button');
        
        buttons.forEach(button => {
          const buttonText = button.textContent.toLowerCase();
          if (buttonText.includes('hypothesis') || buttonText.includes('hypotheses')) {
            foundHypothesisButton = true;
            console.log(`%c✅ HYPOTHESIS BUTTON FOUND ON CARD ${index + 1}!`, 'color: #1DB954; font-weight: bold; font-size: 14px');
            console.log('Button text:', button.textContent.trim());
            console.log('Button element:', button);
            console.log('');
          }
        });
      });
      
      if (foundHypothesisButton) {
        console.log('%c🎉 DEPLOYMENT SUCCESSFUL!', 'color: #1DB954; font-weight: bold; font-size: 18px');
        console.log('');
        console.log('The "Add Hypothesis" button is now visible!');
        console.log('');
        console.log('📋 NEXT STEPS:');
        console.log('1. Look for the cyan/blue button with a lightbulb icon 💡');
        console.log('2. It should say "Add Hypothesis" or "X hypotheses"');
        console.log('3. Click it to expand the hypotheses section');
        console.log('4. Click "+ Add Hypothesis" to create your first hypothesis');
        console.log('');
      } else {
        console.log('%c⏳ DEPLOYMENT NOT YET COMPLETE', 'color: #ffaa00; font-weight: bold; font-size: 16px');
        console.log('');
        console.log('The "Add Hypothesis" button is not visible yet.');
        console.log('');
        console.log('📋 WHAT TO DO:');
        console.log('1. Wait 5-10 minutes for Vercel to deploy');
        console.log('2. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)');
        console.log('3. Run this script again');
        console.log('');
        console.log('💡 TIP: Check Vercel dashboard to see deployment status:');
        console.log('https://vercel.com/dashboard');
        console.log('');
        
        // Show what buttons ARE visible
        console.log('🔍 BUTTONS CURRENTLY VISIBLE:');
        questionCards.forEach((card, index) => {
          const buttons = card.querySelectorAll('button');
          console.log(`Card ${index + 1}:`);
          buttons.forEach(button => {
            const text = button.textContent.trim();
            if (text) {
              console.log(`  - "${text}"`);
            }
          });
        });
        console.log('');
      }
    }
  }, 1000); // Wait 1 second for React to render
}

console.log('%c═══════════════════════════════════════════════════════════════', 'color: #1DB954; font-weight: bold');
console.log('');

