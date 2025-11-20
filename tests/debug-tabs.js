/**
 * DEBUG SCRIPT: Find Main Tabs
 * 
 * This script helps identify why main tabs are not being detected.
 * 
 * HOW TO USE:
 * 1. Open your project page in browser
 * 2. Open console (F12)
 * 3. Copy-paste this script
 * 4. Press Enter
 * 5. Review the output to see what elements exist
 */

(function debugTabs() {
  console.clear();
  console.log('%c🔍 DEBUG: Finding Main Tabs', 'font-size: 18px; font-weight: bold; color: #2196F3;');
  console.log('\n');

  const tabNames = ['Papers', 'Research', 'Lab', 'Notes', 'Analysis'];
  
  // Method 1: Search by exact text match
  console.log('%c📍 Method 1: Exact Text Match', 'font-size: 14px; font-weight: bold; color: #FF9800;');
  tabNames.forEach(tabName => {
    const allElements = Array.from(document.querySelectorAll('*'));
    const matches = allElements.filter(el => el.textContent?.trim() === tabName);
    console.log(`"${tabName}":`, matches.length > 0 ? '✅ FOUND' : '❌ NOT FOUND', matches);
  });
  
  console.log('\n');
  
  // Method 2: Search by partial text match
  console.log('%c📍 Method 2: Partial Text Match (includes)', 'font-size: 14px; font-weight: bold; color: #FF9800;');
  tabNames.forEach(tabName => {
    const allElements = Array.from(document.querySelectorAll('*'));
    const matches = allElements.filter(el => el.textContent?.includes(tabName));
    console.log(`"${tabName}":`, matches.length, 'elements found');
    if (matches.length > 0 && matches.length < 10) {
      matches.forEach(el => {
        console.log('  →', el.tagName, el.className, `"${el.textContent?.trim().substring(0, 50)}"`);
      });
    }
  });
  
  console.log('\n');
  
  // Method 3: Search common tab selectors
  console.log('%c📍 Method 3: Common Tab Selectors', 'font-size: 14px; font-weight: bold; color: #FF9800;');
  const selectors = [
    'button',
    'a',
    '[role="tab"]',
    '[role="button"]',
    'div[class*="tab"]',
    'nav button',
    'nav a',
    '[data-testid*="tab"]',
    '.tab',
    '.nav-tab',
    '.navigation button',
    '.navigation a'
  ];
  
  selectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`${selector}:`, elements.length, 'elements');
        // Show first 3 elements
        Array.from(elements).slice(0, 3).forEach(el => {
          const text = el.textContent?.trim().substring(0, 30);
          console.log(`  → "${text}"`);
        });
      }
    } catch (e) {
      console.log(`${selector}: ERROR`, e.message);
    }
  });
  
  console.log('\n');
  
  // Method 4: Find navigation-like elements
  console.log('%c📍 Method 4: Navigation Elements', 'font-size: 14px; font-weight: bold; color: #FF9800;');
  const navElements = document.querySelectorAll('nav, [role="navigation"], .navigation, .nav, .tabs, .tab-list');
  console.log('Navigation containers found:', navElements.length);
  navElements.forEach((nav, i) => {
    console.log(`\nNavigation ${i + 1}:`, nav.tagName, nav.className);
    const buttons = nav.querySelectorAll('button, a, [role="tab"]');
    console.log('  Buttons/Links inside:', buttons.length);
    Array.from(buttons).slice(0, 5).forEach(btn => {
      console.log(`    → "${btn.textContent?.trim().substring(0, 40)}"`);
    });
  });
  
  console.log('\n');
  
  // Method 5: Show page structure
  console.log('%c📍 Method 5: Page Structure Overview', 'font-size: 14px; font-weight: bold; color: #FF9800;');
  console.log('Body classes:', document.body.className);
  console.log('Main element:', document.querySelector('main') ? '✅ Found' : '❌ Not found');
  console.log('Header element:', document.querySelector('header') ? '✅ Found' : '❌ Not found');
  console.log('Nav element:', document.querySelector('nav') ? '✅ Found' : '❌ Not found');
  
  console.log('\n');
  
  // Method 6: Interactive element finder
  console.log('%c📍 Method 6: All Interactive Elements', 'font-size: 14px; font-weight: bold; color: #FF9800;');
  const interactive = document.querySelectorAll('button, a, [role="button"], [role="tab"]');
  console.log('Total interactive elements:', interactive.length);
  console.log('First 20 interactive elements:');
  Array.from(interactive).slice(0, 20).forEach((el, i) => {
    const text = el.textContent?.trim().substring(0, 40);
    const tag = el.tagName;
    const role = el.getAttribute('role');
    console.log(`${i + 1}. ${tag}${role ? `[role="${role}"]` : ''}: "${text}"`);
  });
  
  console.log('\n');
  console.log('%c✅ Debug Complete!', 'font-size: 16px; font-weight: bold; color: #4CAF50;');
  console.log('%cReview the output above to identify how tabs are structured.', 'color: #9E9E9E;');
  console.log('%cLook for elements containing "Papers", "Research", etc.', 'color: #9E9E9E;');
  
})();

