// ═══════════════════════════════════════════════════════════════
// HYPOTHESIS BUTTON DEPLOYMENT CHECKER
// ═══════════════════════════════════════════════════════════════
// Copy/paste this entire script into your browser console
// while on the Questions tab of your app
// ═══════════════════════════════════════════════════════════════

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║         CHECKING HYPOTHESIS BUTTON DEPLOYMENT                 ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log('');

// Step 1: Check if we're on the Questions tab
const currentUrl = window.location.href;
console.log('📍 Current URL:', currentUrl);

if (!currentUrl.includes('/project/')) {
  console.log('❌ ERROR: You are not on a project page!');
  console.log('');
  console.log('📋 WHAT TO DO:');
  console.log('1. Navigate to a project');
  console.log('2. Click on the "Research Questions" tab');
  console.log('3. Run this script again');
  console.log('');
} else {
  console.log('✅ ON PROJECT PAGE');
  console.log('');
}

// Step 2: Find all question cards
const questionCards = document.querySelectorAll('[class*="question"]');
console.log(`🔍 Found ${questionCards.length} elements with "question" in class name`);
console.log('');

// Step 3: Look for the hypothesis button
const allButtons = document.querySelectorAll('button');
console.log(`🔘 Total buttons on page: ${allButtons.length}`);
console.log('');

// Step 4: Search for hypothesis-related buttons
const hypothesisButtons = Array.from(allButtons).filter(btn => {
  const text = btn.textContent.toLowerCase();
  return text.includes('hypothesis') || text.includes('hypotheses');
});

console.log('═══════════════════════════════════════════════════════════════');
console.log('');

if (hypothesisButtons.length > 0) {
  console.log('✅ ✅ ✅ SUCCESS! HYPOTHESIS BUTTON(S) FOUND! ✅ ✅ ✅');
  console.log('');
  console.log(`Found ${hypothesisButtons.length} hypothesis button(s):`);
  console.log('');
  
  hypothesisButtons.forEach((btn, index) => {
    console.log(`Button ${index + 1}:`);
    console.log('  Text:', btn.textContent.trim());
    console.log('  Classes:', btn.className);
    console.log('  Visible:', btn.offsetParent !== null);
    console.log('');
    
    // Highlight the button
    btn.style.border = '3px solid red';
    btn.style.boxShadow = '0 0 10px red';
    
    // Scroll to first button
    if (index === 0) {
      btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
  
  console.log('🎉 The button(s) have been highlighted in RED!');
  console.log('');
  console.log('📋 NEXT STEPS:');
  console.log('1. Click the "Add Hypothesis" button');
  console.log('2. The hypotheses section should expand');
  console.log('3. Click "+ Add Hypothesis" to create your first hypothesis');
  console.log('');
  
} else {
  console.log('⏳ DEPLOYMENT NOT YET COMPLETE');
  console.log('');
  console.log('The "Add Hypothesis" button is not visible yet.');
  console.log('');
  console.log('📋 WHAT TO DO:');
  console.log('1. Check Vercel dashboard: https://vercel.com/dashboard');
  console.log('2. Look for the latest deployment');
  console.log('3. Wait until status shows "Ready"');
  console.log('4. Hard refresh this page (Ctrl+Shift+R or Cmd+Shift+R)');
  console.log('5. Run this script again');
  console.log('');
  console.log('💡 TIP: Deployment usually takes 3-5 minutes');
  console.log('');
  
  // Debug: Show what buttons ARE visible
  console.log('🔍 BUTTONS CURRENTLY VISIBLE ON PAGE:');
  console.log('');
  
  const visibleButtons = Array.from(allButtons)
    .filter(btn => btn.offsetParent !== null)
    .slice(0, 20); // Show first 20
  
  visibleButtons.forEach((btn, index) => {
    const text = btn.textContent.trim().substring(0, 50);
    if (text) {
      console.log(`  ${index + 1}. "${text}"`);
    }
  });
  
  if (visibleButtons.length === 0) {
    console.log('  (No visible buttons found)');
  }
  console.log('');
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('');

// Step 5: Check for question cards specifically
const questionCardElements = Array.from(document.querySelectorAll('div')).filter(div => {
  const classes = div.className || '';
  return classes.includes('question') || classes.includes('card');
});

console.log(`📦 Found ${questionCardElements.length} potential question card elements`);
console.log('');

// Step 6: Look for the specific structure we expect
const lightBulbIcons = document.querySelectorAll('svg[class*="LightBulb"]');
console.log(`💡 Found ${lightBulbIcons.length} lightbulb icons`);
console.log('');

if (lightBulbIcons.length > 0) {
  console.log('✅ Lightbulb icons found! The button might be there but not detected.');
  console.log('   Check the page visually for a cyan button with a lightbulb icon.');
  console.log('');
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log('📊 SUMMARY:');
console.log(`  - Hypothesis buttons found: ${hypothesisButtons.length}`);
console.log(`  - Total buttons on page: ${allButtons.length}`);
console.log(`  - Lightbulb icons: ${lightBulbIcons.length}`);
console.log('');

if (hypothesisButtons.length === 0) {
  console.log('⚠️  RECOMMENDATION:');
  console.log('   1. Go to Vercel dashboard');
  console.log('   2. Check if latest deployment (commit 71fbacb) is "Ready"');
  console.log('   3. If not ready, wait a few more minutes');
  console.log('   4. If ready, hard refresh (Ctrl+Shift+R) and run script again');
  console.log('');
}

console.log('═══════════════════════════════════════════════════════════════');

