/**
 * QUICK ACTIVITY FEED CHECK
 * Diagnoses why the filter button is not being found
 * 
 * HOW TO RUN:
 * 1. Navigate to a project page and click Progress tab
 * 2. Open browser console (F12)
 * 3. Copy and paste this script
 * 4. Press Enter
 */

(async function quickActivityFeedCheck() {
  console.log('%c🔍 QUICK ACTIVITY FEED DIAGNOSTIC', 'font-size: 18px; font-weight: bold; color: #9333EA;');
  console.log('%c═══════════════════════════════════════════════════════════', 'color: #9333EA;');

  // Check if we're on the Progress tab
  const progressTab = Array.from(document.querySelectorAll('button')).find(
    btn => btn.textContent.includes('Progress')
  );
  console.log('Progress tab found:', !!progressTab);

  // Check for Activity Feed heading
  const activityFeedHeading = Array.from(document.querySelectorAll('h3, h2, h1')).find(
    h => h.textContent.includes('Activity Feed')
  );
  console.log('Activity Feed heading found:', !!activityFeedHeading);
  if (activityFeedHeading) {
    console.log('  Text:', activityFeedHeading.textContent);
    console.log('  Parent:', activityFeedHeading.parentElement);
  }

  // Check for all buttons on the page
  const allButtons = Array.from(document.querySelectorAll('button'));
  console.log('\nTotal buttons on page:', allButtons.length);
  
  // Look for filter-related buttons
  const filterButtons = allButtons.filter(btn => {
    const text = btn.textContent.toLowerCase();
    return text.includes('filter') || text.includes('all activities') || text.includes('collaborators');
  });
  console.log('Filter-related buttons found:', filterButtons.length);
  filterButtons.forEach((btn, i) => {
    console.log(`  ${i + 1}. "${btn.textContent.trim()}" - classes: ${btn.className}`);
  });

  // Check for FunnelIcon
  const funnelIcons = Array.from(document.querySelectorAll('svg')).filter(svg => {
    const path = svg.querySelector('path');
    return path && path.getAttribute('d')?.includes('M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25');
  });
  console.log('Funnel icons found:', funnelIcons.length);

  // Check for the Activity Feed component container
  const activityFeedContainer = activityFeedHeading?.closest('[class*="bg-white"]');
  console.log('\nActivity Feed container found:', !!activityFeedContainer);
  if (activityFeedContainer) {
    console.log('  Container HTML:', activityFeedContainer.innerHTML.substring(0, 500));
    
    // Check for buttons within the container
    const containerButtons = activityFeedContainer.querySelectorAll('button');
    console.log('  Buttons in container:', containerButtons.length);
    Array.from(containerButtons).forEach((btn, i) => {
      console.log(`    ${i + 1}. "${btn.textContent.trim()}"`);
    });
  }

  // Check if component is in loading state
  const loadingSkeletons = document.querySelectorAll('[class*="animate-pulse"]');
  console.log('\nLoading skeletons found:', loadingSkeletons.length);

  // Check for error messages
  const errorMessages = Array.from(document.querySelectorAll('p, div')).filter(
    el => el.textContent.includes('Failed to load') || el.textContent.includes('error')
  );
  console.log('Error messages found:', errorMessages.length);
  errorMessages.forEach((msg, i) => {
    console.log(`  ${i + 1}. "${msg.textContent.trim()}"`);
  });

  // Check for empty state
  const emptyState = Array.from(document.querySelectorAll('p, div')).find(
    el => el.textContent.includes('No activities yet')
  );
  console.log('Empty state found:', !!emptyState);

  // Check network requests
  console.log('\n%c📡 Checking Network Requests...', 'color: #1DB954; font-weight: bold;');
  console.log('Check the Network tab for:');
  console.log('  - GET /api/proxy/projects/[projectId]/activities');
  console.log('  - Status should be 200');
  console.log('  - Response should contain activities array');

  console.log('\n%c✅ Diagnostic complete!', 'color: green; font-weight: bold;');
  console.log('Review the output above to identify the issue.');
})();

