#!/usr/bin/env node

/**
 * Test Runner for Phase 1 Week 1 E2E Tests
 * 
 * Usage:
 *   node run-phase1-tests.js
 *   npm run test:phase1
 */

const { runAllTests } = require('./phase1-week1-e2e.test.js');

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.error('Error: This script requires Node.js 18+ with native fetch support.');
  console.error('Please upgrade Node.js or use node-fetch polyfill.');
  process.exit(1);
}

// Run tests
runAllTests()
  .then(() => {
    console.log('\nTests completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nTest execution failed:', error);
    process.exit(1);
  });

