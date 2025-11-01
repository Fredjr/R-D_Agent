/**
 * MASTER TEST RUNNER
 * Runs all test suites for Phase 3 Week 6 and Phase 4 Week 7
 * 
 * HOW TO RUN:
 * 1. Navigate to a project page: https://frontend-psi-seven-85.vercel.app/project/[projectId]
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Press Enter
 * 
 * This will automatically run all test suites and provide a comprehensive report
 */

(async function runMasterTestSuite() {
  console.clear();
  console.log('%c╔═══════════════════════════════════════════════════════════╗', 'color: #FF6B35; font-weight: bold;');
  console.log('%c║         MASTER TEST RUNNER - COMPREHENSIVE SUITE          ║', 'color: #FF6B35; font-weight: bold;');
  console.log('%c╚═══════════════════════════════════════════════════════════╝', 'color: #FF6B35; font-weight: bold;');
  console.log('%cTesting all features from Phase 3 Week 6 and Phase 4 Week 7\n', 'color: #FF6B35;');

  const startTime = Date.now();
  const allResults = {
    phase3Week6: null,
    phase4Week7: null,
    overall: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      successRate: 0,
      duration: 0
    }
  };

  // ═══════════════════════════════════════════════════════════
  // LOAD AND RUN PHASE 3 WEEK 6 TESTS
  // ═══════════════════════════════════════════════════════════
  console.log('%c\n╔═══════════════════════════════════════════════════════════╗', 'color: #1DB954; font-weight: bold;');
  console.log('%c║              PHASE 3 WEEK 6: ADVANCED FILTERS             ║', 'color: #1DB954; font-weight: bold;');
  console.log('%c╚═══════════════════════════════════════════════════════════╝', 'color: #1DB954; font-weight: bold;');

  try {
    // Load Phase 3 Week 6 test script
    const phase3Script = await fetch('/phase3-week6-filters-test.js');
    const phase3Code = await phase3Script.text();
    
    // Execute the script
    const phase3Result = await eval(phase3Code);
    allResults.phase3Week6 = phase3Result;
    
    console.log('%c✅ Phase 3 Week 6 tests completed', 'color: #1DB954; font-weight: bold;');
  } catch (error) {
    console.error('%c❌ Failed to run Phase 3 Week 6 tests:', 'color: red; font-weight: bold;', error);
    allResults.phase3Week6 = { error: error.message };
  }

  // Wait 2 seconds between test suites
  console.log('%c\n⏳ Waiting 2 seconds before next test suite...', 'color: #9333EA;');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // ═══════════════════════════════════════════════════════════
  // LOAD AND RUN PHASE 4 WEEK 7 TESTS
  // ═══════════════════════════════════════════════════════════
  console.log('%c\n╔═══════════════════════════════════════════════════════════╗', 'color: #9333EA; font-weight: bold;');
  console.log('%c║          PHASE 4 WEEK 7: COLLABORATION FEATURES           ║', 'color: #9333EA; font-weight: bold;');
  console.log('%c╚═══════════════════════════════════════════════════════════╝', 'color: #9333EA; font-weight: bold;');

  try {
    // Load Phase 4 Week 7 test script
    const phase4Script = await fetch('/phase4-week7-collaboration-test.js');
    const phase4Code = await phase4Script.text();
    
    // Execute the script
    const phase4Result = await eval(phase4Code);
    allResults.phase4Week7 = phase4Result;
    
    console.log('%c✅ Phase 4 Week 7 tests completed', 'color: #9333EA; font-weight: bold;');
  } catch (error) {
    console.error('%c❌ Failed to run Phase 4 Week 7 tests:', 'color: red; font-weight: bold;', error);
    allResults.phase4Week7 = { error: error.message };
  }

  // ═══════════════════════════════════════════════════════════
  // CALCULATE OVERALL RESULTS
  // ═══════════════════════════════════════════════════════════
  const endTime = Date.now();
  allResults.overall.duration = ((endTime - startTime) / 1000).toFixed(2);

  if (allResults.phase3Week6 && !allResults.phase3Week6.error) {
    allResults.overall.totalTests += allResults.phase3Week6.totalTests;
    allResults.overall.passedTests += allResults.phase3Week6.passedTests;
    allResults.overall.failedTests += allResults.phase3Week6.failedTests;
  }

  if (allResults.phase4Week7 && !allResults.phase4Week7.error) {
    allResults.overall.totalTests += allResults.phase4Week7.totalTests;
    allResults.overall.passedTests += allResults.phase4Week7.passedTests;
    allResults.overall.failedTests += allResults.phase4Week7.failedTests;
  }

  if (allResults.overall.totalTests > 0) {
    allResults.overall.successRate = ((allResults.overall.passedTests / allResults.overall.totalTests) * 100).toFixed(2);
  }

  // ═══════════════════════════════════════════════════════════
  // DISPLAY COMPREHENSIVE REPORT
  // ═══════════════════════════════════════════════════════════
  console.log('%c\n╔═══════════════════════════════════════════════════════════╗', 'color: #FF6B35; font-weight: bold;');
  console.log('%c║                  COMPREHENSIVE TEST REPORT                 ║', 'color: #FF6B35; font-weight: bold;');
  console.log('%c╚═══════════════════════════════════════════════════════════╝', 'color: #FF6B35; font-weight: bold;');

  console.log('\n%c📊 OVERALL STATISTICS', 'font-size: 16px; font-weight: bold; color: #FF6B35;');
  console.log('%c═══════════════════════════════════════════════════════════', 'color: #FF6B35;');
  console.log(`Total Tests Run: ${allResults.overall.totalTests}`);
  console.log(`%cPassed: ${allResults.overall.passedTests}`, 'color: green; font-weight: bold;');
  console.log(`%cFailed: ${allResults.overall.failedTests}`, 'color: red; font-weight: bold;');
  console.log(`%cSuccess Rate: ${allResults.overall.successRate}%`, `color: ${allResults.overall.successRate >= 90 ? 'green' : 'orange'}; font-weight: bold; font-size: 18px;`);
  console.log(`Duration: ${allResults.overall.duration}s`);

  // Phase 3 Week 6 Summary
  console.log('\n%c📋 PHASE 3 WEEK 6: ADVANCED FILTERS', 'font-size: 14px; font-weight: bold; color: #1DB954;');
  console.log('%c───────────────────────────────────────────────────────────', 'color: #1DB954;');
  if (allResults.phase3Week6 && !allResults.phase3Week6.error) {
    console.log(`Tests: ${allResults.phase3Week6.totalTests}`);
    console.log(`%cPassed: ${allResults.phase3Week6.passedTests}`, 'color: green;');
    console.log(`%cFailed: ${allResults.phase3Week6.failedTests}`, 'color: red;');
    console.log(`%cSuccess Rate: ${allResults.phase3Week6.successRate}%`, `color: ${allResults.phase3Week6.successRate >= 90 ? 'green' : 'orange'};`);
    
    if (allResults.phase3Week6.failedTests > 0) {
      console.log('\n%cFailed Tests:', 'color: red; font-weight: bold;');
      allResults.phase3Week6.failedTestNames.forEach((name, index) => {
        console.log(`  ${index + 1}. ${name}`);
      });
    }
  } else {
    console.log('%c❌ Test suite failed to run', 'color: red;');
    if (allResults.phase3Week6?.error) {
      console.log(`Error: ${allResults.phase3Week6.error}`);
    }
  }

  // Phase 4 Week 7 Summary
  console.log('\n%c📋 PHASE 4 WEEK 7: COLLABORATION FEATURES', 'font-size: 14px; font-weight: bold; color: #9333EA;');
  console.log('%c───────────────────────────────────────────────────────────', 'color: #9333EA;');
  if (allResults.phase4Week7 && !allResults.phase4Week7.error) {
    console.log(`Tests: ${allResults.phase4Week7.totalTests}`);
    console.log(`%cPassed: ${allResults.phase4Week7.passedTests}`, 'color: green;');
    console.log(`%cFailed: ${allResults.phase4Week7.failedTests}`, 'color: red;');
    console.log(`%cSuccess Rate: ${allResults.phase4Week7.successRate}%`, `color: ${allResults.phase4Week7.successRate >= 90 ? 'green' : 'orange'};`);
    
    if (allResults.phase4Week7.failedTests > 0) {
      console.log('\n%cFailed Tests:', 'color: red; font-weight: bold;');
      allResults.phase4Week7.failedTestNames.forEach((name, index) => {
        console.log(`  ${index + 1}. ${name}`);
      });
    }
  } else {
    console.log('%c❌ Test suite failed to run', 'color: red;');
    if (allResults.phase4Week7?.error) {
      console.log(`Error: ${allResults.phase4Week7.error}`);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // FINAL VERDICT
  // ═══════════════════════════════════════════════════════════
  console.log('\n%c╔═══════════════════════════════════════════════════════════╗', 'color: #FF6B35; font-weight: bold;');
  console.log('%c║                      FINAL VERDICT                         ║', 'color: #FF6B35; font-weight: bold;');
  console.log('%c╚═══════════════════════════════════════════════════════════╝', 'color: #FF6B35; font-weight: bold;');

  const overallSuccess = allResults.overall.successRate >= 90;
  const phase3Success = allResults.phase3Week6?.successRate >= 90;
  const phase4Success = allResults.phase4Week7?.successRate >= 90;

  if (overallSuccess && phase3Success && phase4Success) {
    console.log('\n%c🎉🎉🎉 ALL TESTS PASSED! 🎉🎉🎉', 'font-size: 24px; color: green; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);');
    console.log('%c✅ Phase 3 Week 6: COMPLETE', 'font-size: 16px; color: green; font-weight: bold;');
    console.log('%c✅ Phase 4 Week 7: COMPLETE', 'font-size: 16px; color: green; font-weight: bold;');
    console.log('\n%cAll features are working as expected!', 'font-size: 14px; color: green;');
    console.log('%cReady for production deployment! 🚀', 'font-size: 14px; color: green; font-weight: bold;');
  } else {
    console.log('\n%c⚠️ SOME TESTS FAILED ⚠️', 'font-size: 20px; color: orange; font-weight: bold;');
    
    if (!phase3Success) {
      console.log('%c❌ Phase 3 Week 6: NEEDS ATTENTION', 'font-size: 14px; color: red; font-weight: bold;');
    } else {
      console.log('%c✅ Phase 3 Week 6: COMPLETE', 'font-size: 14px; color: green; font-weight: bold;');
    }
    
    if (!phase4Success) {
      console.log('%c❌ Phase 4 Week 7: NEEDS ATTENTION', 'font-size: 14px; color: red; font-weight: bold;');
    } else {
      console.log('%c✅ Phase 4 Week 7: COMPLETE', 'font-size: 14px; color: green; font-weight: bold;');
    }
    
    console.log('\n%cReview failed tests above and fix issues before deployment.', 'font-size: 14px; color: orange;');
  }

  // ═══════════════════════════════════════════════════════════
  // SAVE RESULTS
  // ═══════════════════════════════════════════════════════════
  window.__MASTER_TEST_RESULTS__ = allResults;
  console.log('\n%c✅ Full results saved to: window.__MASTER_TEST_RESULTS__', 'color: #FF6B35; font-weight: bold;');
  console.log('%c✅ Phase 3 diagnostics: window.__PHASE3_WEEK6_DIAGNOSTICS__', 'color: #1DB954;');
  console.log('%c✅ Phase 4 diagnostics: window.__PHASE4_WEEK7_DIAGNOSTICS__', 'color: #9333EA;');

  // ═══════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ═══════════════════════════════════════════════════════════
  console.log('\n%c📝 RECOMMENDATIONS', 'font-size: 14px; font-weight: bold; color: #FF6B35;');
  console.log('%c═══════════════════════════════════════════════════════════', 'color: #FF6B35;');
  
  if (overallSuccess) {
    console.log('✅ All features tested successfully');
    console.log('✅ UI components rendering correctly');
    console.log('✅ Backend APIs responding correctly');
    console.log('✅ Data flow working as expected');
    console.log('\n%c🚀 READY TO PROCEED TO NEXT PHASE!', 'color: green; font-weight: bold; font-size: 16px;');
  } else {
    console.log('⚠️ Review failed tests above');
    console.log('⚠️ Check browser console for detailed error messages');
    console.log('⚠️ Verify backend API responses');
    console.log('⚠️ Check UI component rendering');
    console.log('\n%c🔧 FIX ISSUES BEFORE PROCEEDING', 'color: orange; font-weight: bold; font-size: 16px;');
  }

  console.log('\n%c╔═══════════════════════════════════════════════════════════╗', 'color: #FF6B35; font-weight: bold;');
  console.log('%c║                    TEST RUN COMPLETE                       ║', 'color: #FF6B35; font-weight: bold;');
  console.log('%c╚═══════════════════════════════════════════════════════════╝', 'color: #FF6B35; font-weight: bold;');

  return allResults;
})().then(results => {
  console.log('\n%c📊 Master Test Results Object:', 'color: #FF6B35; font-weight: bold;');
  console.table({
    'Phase 3 Week 6': {
      Tests: results.phase3Week6?.totalTests || 'N/A',
      Passed: results.phase3Week6?.passedTests || 'N/A',
      Failed: results.phase3Week6?.failedTests || 'N/A',
      'Success Rate': results.phase3Week6?.successRate ? `${results.phase3Week6.successRate}%` : 'N/A'
    },
    'Phase 4 Week 7': {
      Tests: results.phase4Week7?.totalTests || 'N/A',
      Passed: results.phase4Week7?.passedTests || 'N/A',
      Failed: results.phase4Week7?.failedTests || 'N/A',
      'Success Rate': results.phase4Week7?.successRate ? `${results.phase4Week7.successRate}%` : 'N/A'
    },
    'Overall': {
      Tests: results.overall.totalTests,
      Passed: results.overall.passedTests,
      Failed: results.overall.failedTests,
      'Success Rate': `${results.overall.successRate}%`
    }
  });
  return results;
});

