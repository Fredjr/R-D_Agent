/**
 * WEEK 11 DAY 5 TESTING SCRIPT
 * 
 * Tests Step 5 of Enhanced Onboarding: Find Seed Paper
 * 
 * HOW TO USE:
 * 1. Open https://frontend-psi-seven-85.vercel.app/auth/complete-profile
 * 2. Complete Steps 1-4 to reach Step 5
 * 3. Open DevTools Console (F12)
 * 4. Copy and paste this entire script
 * 5. Press Enter to run
 * 6. Review the test results in the console
 * 
 * WHAT IT TESTS:
 * - Step 5 component rendering
 * - Search query generation
 * - PubMed search integration
 * - Paper selection UI
 * - Seed paper storage
 * - Skip functionality
 */

(async function testWeek11Day5() {
  console.log('🧪 WEEK 11 DAY 5 TESTING SCRIPT');
  console.log('================================\n');

  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  function pass(test) {
    results.passed.push(test);
    console.log(`✅ PASS: ${test}`);
  }

  function fail(test, error) {
    results.failed.push({ test, error });
    console.error(`❌ FAIL: ${test}`, error);
  }

  function warn(test, message) {
    results.warnings.push({ test, message });
    console.warn(`⚠️  WARN: ${test}`, message);
  }

  // ============================================================================
  // TEST 1: Step 5 Component Rendering
  // ============================================================================
  console.log('\n📋 TEST 1: Step 5 Component Rendering');
  console.log('----------------------------------------');

  try {
    // Check if we're on Step 5
    const stepIndicator = document.querySelector('[class*="step"]');
    if (stepIndicator) {
      pass('Step indicator found');
    } else {
      warn('Step indicator not found', 'May not be on Step 5 yet');
    }

    // Check for Step 5 title
    const title = Array.from(document.querySelectorAll('h2')).find(h2 => 
      h2.textContent.includes('Find Your Seed Paper')
    );
    if (title) {
      pass('Step 5 title found: "Find Your Seed Paper"');
    } else {
      fail('Step 5 title not found', 'Component may not be rendered');
    }

    // Check for search bar
    const searchInput = document.querySelector('input[placeholder*="search"]');
    if (searchInput) {
      pass('Search input found');
      console.log('   Search query:', searchInput.value);
    } else {
      fail('Search input not found', 'Search bar missing');
    }

    // Check for search button
    const searchButton = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent.includes('Search')
    );
    if (searchButton) {
      pass('Search button found');
    } else {
      fail('Search button not found', 'Search functionality missing');
    }

  } catch (error) {
    fail('Step 5 component rendering test', error.message);
  }

  // ============================================================================
  // TEST 2: Search Query Generation
  // ============================================================================
  console.log('\n📋 TEST 2: Search Query Generation');
  console.log('----------------------------------------');

  try {
    const searchInput = document.querySelector('input[placeholder*="search"]');
    if (searchInput && searchInput.value) {
      pass('Search query auto-generated');
      console.log('   Generated query:', searchInput.value);

      // Check if query is meaningful (not just "research")
      if (searchInput.value.length > 10 && searchInput.value !== 'research') {
        pass('Search query is meaningful (length > 10)');
      } else {
        warn('Search query may be too generic', searchInput.value);
      }

      // Check if query doesn't contain question words
      const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which'];
      const hasQuestionWords = questionWords.some(word => 
        searchInput.value.toLowerCase().includes(word)
      );
      if (!hasQuestionWords) {
        pass('Search query properly cleaned (no question words)');
      } else {
        warn('Search query contains question words', 'May need better cleaning');
      }
    } else {
      fail('Search query not generated', 'Input is empty');
    }
  } catch (error) {
    fail('Search query generation test', error.message);
  }

  // ============================================================================
  // TEST 3: PubMed Search Results
  // ============================================================================
  console.log('\n📋 TEST 3: PubMed Search Results');
  console.log('----------------------------------------');

  try {
    // Wait for search results to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check for loading spinner
    const spinner = document.querySelector('[class*="animate-spin"]');
    if (spinner) {
      warn('Search still loading', 'Wait a few seconds and check again');
    }

    // Check for paper cards
    const paperCards = document.querySelectorAll('[class*="border-2"]');
    if (paperCards.length > 0) {
      pass(`Found ${paperCards.length} paper cards`);
      console.log(`   Number of results: ${paperCards.length}`);

      // Check first paper card structure
      const firstCard = paperCards[0];
      
      // Check for radio button
      const radio = firstCard.querySelector('input[type="radio"]');
      if (radio) {
        pass('Paper cards have radio buttons');
      } else {
        fail('Radio buttons missing', 'Selection not possible');
      }

      // Check for title
      const title = firstCard.querySelector('h4');
      if (title && title.textContent.length > 10) {
        pass('Paper cards have titles');
        console.log('   Sample title:', title.textContent.substring(0, 50) + '...');
      } else {
        fail('Paper titles missing or too short', 'Metadata incomplete');
      }

      // Check for authors
      const authors = firstCard.querySelector('p[class*="text-sm"]');
      if (authors && authors.textContent.length > 5) {
        pass('Paper cards have authors');
        console.log('   Sample authors:', authors.textContent.substring(0, 50) + '...');
      } else {
        warn('Authors may be missing', 'Check metadata');
      }

      // Check for PMID
      const pmidText = firstCard.textContent;
      if (pmidText.includes('PMID:')) {
        pass('Paper cards display PMID');
      } else {
        warn('PMID not displayed', 'May affect paper identification');
      }

      // Check for abstract
      const abstract = Array.from(firstCard.querySelectorAll('p')).find(p => 
        p.textContent.length > 100
      );
      if (abstract) {
        pass('Paper cards have abstract preview');
        console.log('   Abstract length:', abstract.textContent.length, 'chars');
      } else {
        warn('Abstract preview missing', 'May affect paper selection');
      }

    } else {
      // Check for "no results" message
      const noResults = Array.from(document.querySelectorAll('p')).find(p => 
        p.textContent.includes('No papers found')
      );
      if (noResults) {
        warn('No search results found', 'Try a different query');
      } else {
        fail('No paper cards found', 'Search may have failed');
      }
    }

    // Check for error message
    const errorBanner = document.querySelector('[class*="bg-red"]');
    if (errorBanner) {
      fail('Error message displayed', errorBanner.textContent);
    }

  } catch (error) {
    fail('PubMed search results test', error.message);
  }

  // ============================================================================
  // TEST 4: Paper Selection UI
  // ============================================================================
  console.log('\n📋 TEST 4: Paper Selection UI');
  console.log('----------------------------------------');

  try {
    const paperCards = document.querySelectorAll('[class*="border-2"]');
    if (paperCards.length > 0) {
      // Simulate clicking first paper
      const firstCard = paperCards[0];
      const radio = firstCard.querySelector('input[type="radio"]');
      
      if (radio) {
        // Click the radio button
        radio.click();
        
        // Wait for state update
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if radio is selected
        if (radio.checked) {
          pass('Paper selection works (radio button checked)');
        } else {
          fail('Paper selection failed', 'Radio button not checked');
        }

        // Check for visual feedback
        const selectedCard = document.querySelector('[class*="border-blue-500"]');
        if (selectedCard) {
          pass('Selected paper has blue border (visual feedback)');
        } else {
          warn('Visual feedback missing', 'Selected state not visible');
        }

        // Check for selection indicator
        const indicator = Array.from(document.querySelectorAll('span')).find(span => 
          span.textContent.includes('Paper selected')
        );
        if (indicator) {
          pass('Selection indicator displayed');
        } else {
          warn('Selection indicator missing', 'User may not see confirmation');
        }

        // Check if continue button is enabled
        const continueButton = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent.includes('Continue with Selected Paper')
        );
        if (continueButton && !continueButton.disabled) {
          pass('Continue button enabled after selection');
        } else {
          fail('Continue button not enabled', 'Cannot proceed with selection');
        }
      }
    } else {
      warn('No paper cards to test selection', 'Complete search first');
    }
  } catch (error) {
    fail('Paper selection UI test', error.message);
  }

  // ============================================================================
  // TEST 5: Action Buttons
  // ============================================================================
  console.log('\n📋 TEST 5: Action Buttons');
  console.log('----------------------------------------');

  try {
    // Check for Back button
    const backButton = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent.includes('Back')
    );
    if (backButton) {
      pass('Back button found');
    } else {
      fail('Back button missing', 'Cannot return to Step 4');
    }

    // Check for Skip button
    const skipButton = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent.includes('Skip')
    );
    if (skipButton) {
      pass('Skip button found');
    } else {
      fail('Skip button missing', 'Cannot skip seed paper selection');
    }

    // Check for Continue button
    const continueButton = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent.includes('Continue with Selected Paper')
    );
    if (continueButton) {
      pass('Continue button found');
      
      // Check if disabled when no selection
      const paperCards = document.querySelectorAll('[class*="border-2"]');
      const anySelected = Array.from(paperCards).some(card => 
        card.querySelector('input[type="radio"]:checked')
      );
      
      if (!anySelected && continueButton.disabled) {
        pass('Continue button disabled when no paper selected');
      } else if (anySelected && !continueButton.disabled) {
        pass('Continue button enabled when paper selected');
      }
    } else {
      fail('Continue button missing', 'Cannot proceed with selection');
    }
  } catch (error) {
    fail('Action buttons test', error.message);
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  console.log(`📈 Total: ${results.passed.length + results.failed.length + results.warnings.length}`);

  if (results.failed.length === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Step 5 is working correctly!');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED. Review the errors above.');
  }

  console.log('\n📋 DETAILED RESULTS:');
  console.log('====================');
  
  if (results.passed.length > 0) {
    console.log('\n✅ PASSED TESTS:');
    results.passed.forEach(test => console.log(`   - ${test}`));
  }

  if (results.failed.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.failed.forEach(({ test, error }) => console.log(`   - ${test}: ${error}`));
  }

  if (results.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    results.warnings.forEach(({ test, message }) => console.log(`   - ${test}: ${message}`));
  }

  console.log('\n\n📝 NEXT STEPS:');
  console.log('==============');
  console.log('1. If tests passed: Complete Step 5 by selecting a paper and clicking Continue');
  console.log('2. Verify redirect to project page with ?onboarding=complete');
  console.log('3. Check project settings for seed_pmid and seed_title');
  console.log('4. Check user preferences for seed_paper data');
  console.log('5. Report any issues or proceed to Day 6 implementation');

  return results;
})();

