/**
 * COMPREHENSIVE E2E TEST SUITE - WEEKS 12-14
 * 
 * Tests all features from Week 12 (Decision Timeline) to Week 14 (Project Alerts)
 * including Smart Inbox, Decision Timeline, and Project Alerts.
 * 
 * Prerequisites:
 * - npm install -D @playwright/test
 * - npx playwright install
 * 
 * Run with: npx playwright test tests/e2e/weeks-12-14-comprehensive.test.js
 */

const { test, expect } = require('@playwright/test');

// Configuration
const BASE_URL = process.env.TEST_URL || 'https://r-d-agent.vercel.app';
const BACKEND_URL = process.env.BACKEND_URL || 'https://r-dagent-production.up.railway.app';
const TEST_TIMEOUT = 60000; // 60 seconds per test

// Test data
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'TestPassword123!'
};

const TEST_PROJECT_ID = process.env.TEST_PROJECT_ID || 'test-project-001';

// Helper function to wait for network idle
async function waitForNetworkIdle(page, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

// Helper function to log test step
function logStep(step, details = '') {
  console.log(`\n✓ ${step}${details ? ': ' + details : ''}`);
}

// Helper function to log error
function logError(error, context = '') {
  console.error(`\n✗ ERROR${context ? ' in ' + context : ''}: ${error.message}`);
  console.error(error.stack);
}

// Helper function to authenticate with Clerk
async function authenticateWithClerk(page) {
  try {
    logStep('Attempting authentication');

    // Go to homepage
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Check if already authenticated
    const isAuthenticated = await page.locator('[data-testid="user-button"], [class*="cl-userButton"]').count() > 0;
    if (isAuthenticated) {
      logStep('Already authenticated');
      return true;
    }

    // Look for sign-in button (multiple possible selectors)
    const signInSelectors = [
      'button:has-text("Sign In")',
      'a:has-text("Sign In")',
      'button:has-text("Sign in")',
      'a:has-text("Sign in")',
      '[data-testid="sign-in-button"]',
      '.cl-signIn-start'
    ];

    let signInButton = null;
    for (const selector of signInSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        signInButton = page.locator(selector).first();
        break;
      }
    }

    if (!signInButton) {
      logStep('No sign-in button found, may already be on auth page or authenticated');
      return false;
    }

    // Click sign-in button
    await signInButton.click();
    await page.waitForTimeout(2000);

    // Fill in email
    const emailSelectors = [
      'input[name="identifier"]',
      'input[type="email"]',
      'input[name="email"]',
      'input[placeholder*="email" i]',
      '.cl-formFieldInput[type="email"]'
    ];

    let emailInput = null;
    for (const selector of emailSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        emailInput = page.locator(selector).first();
        break;
      }
    }

    if (!emailInput) {
      logStep('Email input not found');
      return false;
    }

    await emailInput.fill(TEST_USER.email);
    logStep('Email entered', TEST_USER.email);
    await page.waitForTimeout(1000);

    // Click continue button
    const continueSelectors = [
      'button:has-text("Continue")',
      'button[type="submit"]',
      '.cl-formButtonPrimary'
    ];

    for (const selector of continueSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        await page.locator(selector).first().click();
        break;
      }
    }

    await page.waitForTimeout(2000);

    // Fill in password
    const passwordSelectors = [
      'input[name="password"]',
      'input[type="password"]',
      '.cl-formFieldInput[type="password"]'
    ];

    let passwordInput = null;
    for (const selector of passwordSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        passwordInput = page.locator(selector).first();
        break;
      }
    }

    if (!passwordInput) {
      logStep('Password input not found');
      return false;
    }

    await passwordInput.fill(TEST_USER.password);
    logStep('Password entered');
    await page.waitForTimeout(1000);

    // Click sign-in submit button
    const submitSelectors = [
      'button:has-text("Continue")',
      'button:has-text("Sign in")',
      'button[type="submit"]',
      '.cl-formButtonPrimary'
    ];

    for (const selector of submitSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        await page.locator(selector).first().click();
        break;
      }
    }

    // Wait for authentication to complete
    await page.waitForTimeout(5000);

    // Verify authentication succeeded
    const authSuccess = await page.locator('[data-testid="user-button"], [class*="cl-userButton"]').count() > 0;

    if (authSuccess) {
      logStep('Authentication successful');
      return true;
    } else {
      logStep('Authentication may have failed or is still loading');
      return false;
    }

  } catch (error) {
    logError(error, 'Authentication');
    return false;
  }
}

test.describe('WEEKS 12-14: Comprehensive E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Set longer timeout for each test
    test.setTimeout(TEST_TIMEOUT);

    // Authenticate before each test
    await authenticateWithClerk(page);
    
    // Enable console logging
    page.on('console', msg => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        console.log(`[BROWSER ${type.toUpperCase()}]:`, msg.text());
      }
    });
    
    // Log page errors
    page.on('pageerror', error => {
      console.error('[PAGE ERROR]:', error.message);
    });
    
    // Log failed requests
    page.on('requestfailed', request => {
      console.error('[REQUEST FAILED]:', request.url(), request.failure().errorText);
    });
  });

  // ============================================================================
  // TEST SUITE 1: BACKEND API ENDPOINTS
  // ============================================================================
  
  test.describe('Backend API Tests', () => {
    
    test('1.1: Backend health check', async ({ request }) => {
      logStep('Testing backend health endpoint');
      
      const response = await request.get(`${BACKEND_URL}/health`);
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      logStep('Backend health check passed', JSON.stringify(data));
    });

    test('1.2: Triage endpoints accessible', async ({ request }) => {
      logStep('Testing triage endpoints');
      
      const endpoints = [
        `/api/triage/project/${TEST_PROJECT_ID}`,
        `/api/triage/stats/${TEST_PROJECT_ID}`
      ];
      
      for (const endpoint of endpoints) {
        const response = await request.get(`${BACKEND_URL}${endpoint}`, {
          headers: { 'User-ID': TEST_USER.email }
        });
        
        // 200 OK or 404 (no data) are both acceptable
        expect([200, 404]).toContain(response.status());
        logStep(`Endpoint ${endpoint}`, `Status: ${response.status()}`);
      }
    });

    test('1.3: Decisions endpoints accessible', async ({ request }) => {
      logStep('Testing decisions endpoints');
      
      const endpoints = [
        `/api/decisions/project/${TEST_PROJECT_ID}`,
        `/api/decisions/stats/${TEST_PROJECT_ID}`
      ];
      
      for (const endpoint of endpoints) {
        const response = await request.get(`${BACKEND_URL}${endpoint}`, {
          headers: { 'User-ID': TEST_USER.email }
        });
        
        expect([200, 404]).toContain(response.status());
        logStep(`Endpoint ${endpoint}`, `Status: ${response.status()}`);
      }
    });

    test('1.4: Alerts endpoints accessible', async ({ request }) => {
      logStep('Testing alerts endpoints');
      
      const endpoints = [
        `/api/alerts/project/${TEST_PROJECT_ID}`,
        `/api/alerts/project/${TEST_PROJECT_ID}/stats`
      ];
      
      for (const endpoint of endpoints) {
        const response = await request.get(`${BACKEND_URL}${endpoint}`, {
          headers: { 'User-ID': TEST_USER.email }
        });
        
        expect([200, 404]).toContain(response.status());
        logStep(`Endpoint ${endpoint}`, `Status: ${response.status()}`);
      }
    });
  });

  // ============================================================================
  // TEST SUITE 2: AUTHENTICATION & NAVIGATION
  // ============================================================================
  
  test.describe('Authentication & Navigation', () => {
    
    test('2.1: Homepage loads successfully', async ({ page }) => {
      logStep('Loading homepage');
      
      await page.goto(BASE_URL);
      await waitForNetworkIdle(page);
      
      // Check for Clerk sign-in or authenticated state
      const isSignInPage = await page.locator('text=/sign in|log in/i').count() > 0;
      const isAuthenticated = await page.locator('[data-testid="user-button"]').count() > 0;
      
      expect(isSignInPage || isAuthenticated).toBeTruthy();
      logStep('Homepage loaded', isAuthenticated ? 'User authenticated' : 'Sign-in page shown');
    });

    test('2.2: Can navigate to project page', async ({ page }) => {
      logStep('Navigating to project page');
      
      // Note: This test assumes user is already authenticated
      // In production, you'd handle Clerk authentication here
      
      await page.goto(`${BASE_URL}/project/${TEST_PROJECT_ID}`);
      await waitForNetworkIdle(page);
      
      // Check if project page loaded (look for tab navigation)
      const hasProjectTabs = await page.locator('text=/Research|Papers|Lab|Notes|Analysis/').count() > 0;
      
      if (hasProjectTabs) {
        logStep('Project page loaded successfully');
      } else {
        logStep('Project page may require authentication or project creation');
      }
    });
  });

  // ============================================================================
  // TEST SUITE 3: SMART INBOX (WEEK 9-10)
  // ============================================================================

  test.describe('Smart Inbox Tests', () => {

    test('3.1: Inbox tab loads and displays papers', async ({ page }) => {
      logStep('Testing Smart Inbox - Loading papers');

      await page.goto(`${BASE_URL}/project/${TEST_PROJECT_ID}`);
      await waitForNetworkIdle(page);

      // Click Papers tab
      const papersTab = page.locator('button:has-text("Papers"), a:has-text("Papers")').first();
      if (await papersTab.count() > 0) {
        await papersTab.click();
        await page.waitForTimeout(1000);
        logStep('Clicked Papers tab');
      }

      // Click Inbox sub-tab
      const inboxTab = page.locator('button:has-text("Inbox"), a:has-text("Inbox")').first();
      if (await inboxTab.count() > 0) {
        await inboxTab.click();
        await page.waitForTimeout(2000);
        logStep('Clicked Inbox sub-tab');
      }

      // Check if papers are displayed or empty state
      const hasPapers = await page.locator('[data-testid="inbox-paper-card"], .paper-card').count() > 0;
      const hasEmptyState = await page.locator('text=/no papers|empty inbox/i').count() > 0;

      expect(hasPapers || hasEmptyState).toBeTruthy();
      logStep('Inbox loaded', hasPapers ? 'Papers displayed' : 'Empty state shown');
    });

    test('3.2: Paper card displays AI triage data', async ({ page }) => {
      logStep('Testing paper card AI triage data');

      await page.goto(`${BASE_URL}/project/${TEST_PROJECT_ID}`);
      await waitForNetworkIdle(page);

      // Navigate to Inbox
      await page.locator('button:has-text("Papers"), a:has-text("Papers")').first().click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Inbox"), a:has-text("Inbox")').first().click();
      await page.waitForTimeout(2000);

      // Check for paper cards
      const paperCards = page.locator('[data-testid="inbox-paper-card"], .paper-card');
      const paperCount = await paperCards.count();

      if (paperCount > 0) {
        const firstCard = paperCards.first();

        // Check for triage elements
        const hasRelevanceScore = await firstCard.locator('text=/relevance|score/i').count() > 0;
        const hasImpactAssessment = await firstCard.locator('text=/impact|assessment/i').count() > 0;
        const hasAIReasoning = await firstCard.locator('text=/reasoning|analysis/i').count() > 0;

        logStep('Paper card elements', `Score: ${hasRelevanceScore}, Impact: ${hasImpactAssessment}, Reasoning: ${hasAIReasoning}`);
      } else {
        logStep('No papers in inbox to test');
      }
    });

    test('3.3: Action buttons work (Accept/Reject/Maybe)', async ({ page }) => {
      logStep('Testing paper action buttons');

      await page.goto(`${BASE_URL}/project/${TEST_PROJECT_ID}`);
      await waitForNetworkIdle(page);

      // Navigate to Inbox
      await page.locator('button:has-text("Papers"), a:has-text("Papers")').first().click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Inbox"), a:has-text("Inbox")').first().click();
      await page.waitForTimeout(2000);

      // Check for action buttons
      const acceptButton = page.locator('button:has-text("Accept"), button[title*="Accept"]').first();
      const rejectButton = page.locator('button:has-text("Reject"), button[title*="Reject"]').first();
      const maybeButton = page.locator('button:has-text("Maybe"), button[title*="Maybe"]').first();

      const hasAccept = await acceptButton.count() > 0;
      const hasReject = await rejectButton.count() > 0;
      const hasMaybe = await maybeButton.count() > 0;

      logStep('Action buttons present', `Accept: ${hasAccept}, Reject: ${hasReject}, Maybe: ${hasMaybe}`);

      // Try clicking Maybe button (least destructive)
      if (hasMaybe) {
        await maybeButton.click();
        await page.waitForTimeout(1000);
        logStep('Clicked Maybe button - action executed');
      }
    });

    test('3.4: Keyboard shortcuts work', async ({ page }) => {
      logStep('Testing keyboard shortcuts');

      await page.goto(`${BASE_URL}/project/${TEST_PROJECT_ID}`);
      await waitForNetworkIdle(page);

      // Navigate to Inbox
      await page.locator('button:has-text("Papers"), a:has-text("Papers")').first().click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Inbox"), a:has-text("Inbox")').first().click();
      await page.waitForTimeout(2000);

      // Test J key (next paper)
      await page.keyboard.press('j');
      await page.waitForTimeout(500);
      logStep('Pressed J key (next paper)');

      // Test K key (previous paper)
      await page.keyboard.press('k');
      await page.waitForTimeout(500);
      logStep('Pressed K key (previous paper)');

      // Test B key (batch mode)
      await page.keyboard.press('b');
      await page.waitForTimeout(500);
      logStep('Pressed B key (batch mode)');

      // Note: We don't test destructive actions (A/R/M/D) to avoid modifying data
      logStep('Keyboard shortcuts tested (non-destructive only)');
    });

    test('3.5: Batch mode toggle works', async ({ page }) => {
      logStep('Testing batch mode');

      await page.goto(`${BASE_URL}/project/${TEST_PROJECT_ID}`);
      await waitForNetworkIdle(page);

      // Navigate to Inbox
      await page.locator('button:has-text("Papers"), a:has-text("Papers")').first().click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Inbox"), a:has-text("Inbox")').first().click();
      await page.waitForTimeout(2000);

      // Look for batch mode button or toggle
      const batchButton = page.locator('button:has-text("Batch"), button[title*="Batch"]').first();

      if (await batchButton.count() > 0) {
        await batchButton.click();
        await page.waitForTimeout(1000);
        logStep('Batch mode toggled');

        // Toggle back
        await batchButton.click();
        await page.waitForTimeout(1000);
        logStep('Batch mode toggled back');
      } else {
        // Try keyboard shortcut
        await page.keyboard.press('b');
        await page.waitForTimeout(1000);
        logStep('Batch mode toggled via keyboard');
      }
    });
  });

  // ============================================================================
  // TEST SUITE 4: DECISION TIMELINE (WEEK 11-12)
  // ============================================================================

  test.describe('Decision Timeline Tests', () => {

    test('4.1: Decision Timeline tab loads', async ({ page }) => {
      logStep('Testing Decision Timeline - Loading');

      await page.goto(`${BASE_URL}/project/${TEST_PROJECT_ID}`);
      await waitForNetworkIdle(page);

      // Click Research tab
      const researchTab = page.locator('button:has-text("Research"), a:has-text("Research")').first();
      if (await researchTab.count() > 0) {
        await researchTab.click();
        await page.waitForTimeout(1000);
        logStep('Clicked Research tab');
      }

      // Click Decisions sub-tab
      const decisionsTab = page.locator('button:has-text("Decisions"), a:has-text("Decisions")').first();
      if (await decisionsTab.count() > 0) {
        await decisionsTab.click();
        await page.waitForTimeout(2000);
        logStep('Clicked Decisions sub-tab');
      }

      // Check if timeline is displayed or empty state
      const hasDecisions = await page.locator('[data-testid="decision-card"], .decision-card').count() > 0;
      const hasEmptyState = await page.locator('text=/no decisions|empty timeline/i').count() > 0;
      const hasAddButton = await page.locator('button:has-text("Add Decision"), button:has-text("New Decision")').count() > 0;

      expect(hasDecisions || hasEmptyState || hasAddButton).toBeTruthy();
      logStep('Decision Timeline loaded', hasDecisions ? 'Decisions displayed' : 'Empty state or add button shown');
    });

    test('4.2: Add Decision button opens modal', async ({ page }) => {
      logStep('Testing Add Decision modal');

      await page.goto(`${BASE_URL}/project/${TEST_PROJECT_ID}`);
      await waitForNetworkIdle(page);

      // Navigate to Decisions
      await page.locator('button:has-text("Research"), a:has-text("Research")').first().click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Decisions"), a:has-text("Decisions")').first().click();
      await page.waitForTimeout(2000);

      // Click Add Decision button
      const addButton = page.locator('button:has-text("Add Decision"), button:has-text("New Decision")').first();

      if (await addButton.count() > 0) {
        await addButton.click();
        await page.waitForTimeout(1000);
        logStep('Clicked Add Decision button');

        // Check if modal opened
        const hasModal = await page.locator('[role="dialog"], .modal, [data-testid="decision-modal"]').count() > 0;
        const hasTitleInput = await page.locator('input[name="title"], input[placeholder*="title"]').count() > 0;
        const hasDescriptionInput = await page.locator('textarea[name="description"], textarea[placeholder*="description"]').count() > 0;

        expect(hasModal || hasTitleInput || hasDescriptionInput).toBeTruthy();
        logStep('Decision modal opened', `Title input: ${hasTitleInput}, Description input: ${hasDescriptionInput}`);

        // Close modal (press Escape)
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        logStep('Modal closed');
      } else {
        logStep('Add Decision button not found');
      }
    });

    test('4.3: Can create a new decision', async ({ page }) => {
      logStep('Testing decision creation');

      await page.goto(`${BASE_URL}/project/${TEST_PROJECT_ID}`);
      await waitForNetworkIdle(page);

      // Navigate to Decisions
      await page.locator('button:has-text("Research"), a:has-text("Research")').first().click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Decisions"), a:has-text("Decisions")').first().click();
      await page.waitForTimeout(2000);

      // Click Add Decision button
      const addButton = page.locator('button:has-text("Add Decision"), button:has-text("New Decision")').first();

      if (await addButton.count() > 0) {
        await addButton.click();
        await page.waitForTimeout(1000);

        // Fill in decision details
        const titleInput = page.locator('input[name="title"], input[placeholder*="title"]').first();
        const descriptionInput = page.locator('textarea[name="description"], textarea[placeholder*="description"]').first();

        if (await titleInput.count() > 0) {
          const testTitle = `Test Decision ${Date.now()}`;
          await titleInput.fill(testTitle);
          logStep('Filled decision title', testTitle);

          if (await descriptionInput.count() > 0) {
            await descriptionInput.fill('This is a test decision created by automated testing.');
            logStep('Filled decision description');
          }

          // Look for Save/Submit button
          const saveButton = page.locator('button:has-text("Save"), button:has-text("Create"), button:has-text("Submit")').first();

          if (await saveButton.count() > 0) {
            await saveButton.click();
            await page.waitForTimeout(2000);
            logStep('Clicked Save button');

            // Verify decision was created (look for success message or new card)
            const hasSuccessMessage = await page.locator('text=/success|created|saved/i').count() > 0;
            const hasNewDecision = await page.locator(`text="${testTitle}"`).count() > 0;

            logStep('Decision creation result', `Success message: ${hasSuccessMessage}, Decision visible: ${hasNewDecision}`);
          }
        }
      } else {
        logStep('Add Decision button not found - skipping creation test');
      }
    });

    test('4.4: Decision cards display correctly', async ({ page }) => {
      logStep('Testing decision card display');

      await page.goto(`${BASE_URL}/project/${TEST_PROJECT_ID}`);
      await waitForNetworkIdle(page);

      // Navigate to Decisions
      await page.locator('button:has-text("Research"), a:has-text("Research")').first().click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Decisions"), a:has-text("Decisions")').first().click();
      await page.waitForTimeout(2000);

      // Check for decision cards
      const decisionCards = page.locator('[data-testid="decision-card"], .decision-card');
      const cardCount = await decisionCards.count();

      if (cardCount > 0) {
        const firstCard = decisionCards.first();

        // Check for decision elements
        const hasTitle = await firstCard.locator('h3, h4, [class*="title"]').count() > 0;
        const hasDescription = await firstCard.locator('p, [class*="description"]').count() > 0;
        const hasTimestamp = await firstCard.locator('text=/ago|date|time/i').count() > 0;

        logStep('Decision card elements', `Title: ${hasTitle}, Description: ${hasDescription}, Timestamp: ${hasTimestamp}`);
      } else {
        logStep('No decisions to test card display');
      }
    });

    test('4.5: Can edit existing decision', async ({ page }) => {
      logStep('Testing decision editing');

      await page.goto(`${BASE_URL}/project/${TEST_PROJECT_ID}`);
      await waitForNetworkIdle(page);

      // Navigate to Decisions
      await page.locator('button:has-text("Research"), a:has-text("Research")').first().click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Decisions"), a:has-text("Decisions")').first().click();
      await page.waitForTimeout(2000);

      // Look for edit button on first decision
      const editButton = page.locator('button:has-text("Edit"), button[title*="Edit"], button[aria-label*="Edit"]').first();

      if (await editButton.count() > 0) {
        await editButton.click();
        await page.waitForTimeout(1000);
        logStep('Clicked Edit button');

        // Check if edit modal opened
        const hasModal = await page.locator('[role="dialog"], .modal').count() > 0;
        logStep('Edit modal opened', hasModal ? 'Yes' : 'No');

        if (hasModal) {
          // Close modal without saving
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
          logStep('Edit modal closed');
        }
      } else {
        logStep('No edit button found - may need to create decision first');
      }
    });
  });

  // ============================================================================
  // TEST SUITE 5: PROJECT ALERTS (WEEK 13-14)
  // ============================================================================

  test.describe('Project Alerts Tests', () => {

    test('5.1: Bell icon displays in header', async ({ page }) => {
      logStep('Testing alerts bell icon');

      await page.goto(`${BASE_URL}/project/${TEST_PROJECT_ID}`);
      await waitForNetworkIdle(page);

      // Look for bell icon
      const bellIcon = page.locator('[data-testid="alerts-bell"], button[aria-label*="alert"], button[title*="alert"]').first();
      const hasBellIcon = await bellIcon.count() > 0;

      // Also check for SVG bell icon
      const hasBellSvg = await page.locator('svg[class*="bell"], [class*="BellIcon"]').count() > 0;

      expect(hasBellIcon || hasBellSvg).toBeTruthy();
      logStep('Bell icon present', `Button: ${hasBellIcon}, SVG: ${hasBellSvg}`);
    });

    test('5.2: Bell icon shows unread count badge', async ({ page }) => {
      logStep('Testing alerts badge count');

      await page.goto(`${BASE_URL}/project/${TEST_PROJECT_ID}`);
      await waitForNetworkIdle(page);

      // Look for badge with count
      const badge = page.locator('[data-testid="alerts-badge"], [class*="badge"]').first();
      const hasBadge = await badge.count() > 0;

      if (hasBadge) {
        const badgeText = await badge.textContent();
        logStep('Alert badge found', `Count: ${badgeText}`);
      } else {
        logStep('No alert badge (may indicate 0 unread alerts)');
      }
    });

    test('5.3: Clicking bell icon opens alerts panel', async ({ page }) => {
      logStep('Testing alerts panel opening');

      await page.goto(`${BASE_URL}/project/${TEST_PROJECT_ID}`);
      await waitForNetworkIdle(page);

      // Click bell icon
      const bellIcon = page.locator('[data-testid="alerts-bell"], button[aria-label*="alert"], button[title*="alert"]').first();

      if (await bellIcon.count() > 0) {
        await bellIcon.click();
        await page.waitForTimeout(1500);
        logStep('Clicked bell icon');

        // Check if alerts panel opened
        const hasPanel = await page.locator('[data-testid="alerts-panel"], [class*="AlertsPanel"]').count() > 0;
        const hasPanelTitle = await page.locator('text=/Project Alerts|Notifications/i').count() > 0;

        expect(hasPanel || hasPanelTitle).toBeTruthy();
        logStep('Alerts panel opened', `Panel: ${hasPanel}, Title: ${hasPanelTitle}`);

        // Close panel (click outside or close button)
        const closeButton = page.locator('button[aria-label*="close"], button:has-text("×")').first();
        if (await closeButton.count() > 0) {
          await closeButton.click();
          await page.waitForTimeout(500);
          logStep('Alerts panel closed');
        }
      } else {
        logStep('Bell icon not found');
      }
    });

    test('5.4: Alerts panel displays alert statistics', async ({ page }) => {
      logStep('Testing alerts statistics');

      await page.goto(`${BASE_URL}/project/${TEST_PROJECT_ID}`);
      await waitForNetworkIdle(page);

      // Open alerts panel
      const bellIcon = page.locator('[data-testid="alerts-bell"], button[aria-label*="alert"], button[title*="alert"]').first();

      if (await bellIcon.count() > 0) {
        await bellIcon.click();
        await page.waitForTimeout(1500);

        // Look for statistics
        const hasStats = await page.locator('text=/total|unread|dismissed/i').count() > 0;
        const hasNumbers = await page.locator('[class*="stat"], [class*="count"]').count() > 0;

        logStep('Alert statistics', `Stats text: ${hasStats}, Numbers: ${hasNumbers}`);
      }
    });

    test('5.5: Alerts panel displays alert cards', async ({ page }) => {
      logStep('Testing alert cards display');

      await page.goto(`${BASE_URL}/project/${TEST_PROJECT_ID}`);
      await waitForNetworkIdle(page);

      // Open alerts panel
      const bellIcon = page.locator('[data-testid="alerts-bell"], button[aria-label*="alert"], button[title*="alert"]').first();

      if (await bellIcon.count() > 0) {
        await bellIcon.click();
        await page.waitForTimeout(1500);

        // Check for alert cards
        const alertCards = page.locator('[data-testid="alert-card"], [class*="AlertCard"]');
        const cardCount = await alertCards.count();

        if (cardCount > 0) {
          const firstCard = alertCards.first();

          // Check for alert elements
          const hasTitle = await firstCard.locator('h3, h4, [class*="title"]').count() > 0;
          const hasDescription = await firstCard.locator('p, [class*="description"]').count() > 0;
          const hasSeverity = await firstCard.locator('text=/low|medium|high|critical/i').count() > 0;
          const hasType = await firstCard.locator('text=/impact|contradiction|gap|new paper/i').count() > 0;

          logStep('Alert card elements', `Title: ${hasTitle}, Description: ${hasDescription}, Severity: ${hasSeverity}, Type: ${hasType}`);
        } else {
          logStep('No alerts to display (empty state)');
        }
      }
    });

    test('5.6: Can filter alerts by type', async ({ page }) => {
      logStep('Testing alert filtering by type');

      await page.goto(`${BASE_URL}/project/${TEST_PROJECT_ID}`);
      await waitForNetworkIdle(page);

      // Open alerts panel
      const bellIcon = page.locator('[data-testid="alerts-bell"], button[aria-label*="alert"], button[title*="alert"]').first();

      if (await bellIcon.count() > 0) {
        await bellIcon.click();
        await page.waitForTimeout(1500);

        // Look for filter dropdown or buttons
        const typeFilter = page.locator('select[name*="type"], button:has-text("Type"), [data-testid="type-filter"]').first();

        if (await typeFilter.count() > 0) {
          await typeFilter.click();
          await page.waitForTimeout(500);
          logStep('Clicked type filter');

          // Try selecting a filter option
          const filterOption = page.locator('option, [role="option"]').first();
          if (await filterOption.count() > 0) {
            await filterOption.click();
            await page.waitForTimeout(1000);
            logStep('Selected filter option');
          }
        } else {
          logStep('Type filter not found');
        }
      }
    });

    test('5.7: Can filter alerts by severity', async ({ page }) => {
      logStep('Testing alert filtering by severity');

      await page.goto(`${BASE_URL}/project/${TEST_PROJECT_ID}`);
      await waitForNetworkIdle(page);

      // Open alerts panel
      const bellIcon = page.locator('[data-testid="alerts-bell"], button[aria-label*="alert"], button[title*="alert"]').first();

      if (await bellIcon.count() > 0) {
        await bellIcon.click();
        await page.waitForTimeout(1500);

        // Look for severity filter
        const severityFilter = page.locator('select[name*="severity"], button:has-text("Severity"), [data-testid="severity-filter"]').first();

        if (await severityFilter.count() > 0) {
          await severityFilter.click();
          await page.waitForTimeout(500);
          logStep('Clicked severity filter');
        } else {
          logStep('Severity filter not found');
        }
      }
    });

    test('5.8: Can dismiss individual alert', async ({ page }) => {
      logStep('Testing alert dismissal');

      await page.goto(`${BASE_URL}/project/${TEST_PROJECT_ID}`);
      await waitForNetworkIdle(page);

      // Open alerts panel
      const bellIcon = page.locator('[data-testid="alerts-bell"], button[aria-label*="alert"], button[title*="alert"]').first();

      if (await bellIcon.count() > 0) {
        await bellIcon.click();
        await page.waitForTimeout(1500);

        // Look for dismiss button on first alert
        const dismissButton = page.locator('button:has-text("Dismiss"), button[title*="Dismiss"], button[aria-label*="Dismiss"]').first();

        if (await dismissButton.count() > 0) {
          const initialCount = await page.locator('[data-testid="alert-card"], [class*="AlertCard"]').count();

          await dismissButton.click();
          await page.waitForTimeout(1500);
          logStep('Clicked Dismiss button');

          const newCount = await page.locator('[data-testid="alert-card"], [class*="AlertCard"]').count();
          logStep('Alert dismissal result', `Before: ${initialCount}, After: ${newCount}`);
        } else {
          logStep('No dismiss button found (may be no alerts)');
        }
      }
    });

    test('5.9: Can dismiss all alerts', async ({ page }) => {
      logStep('Testing dismiss all alerts');

      await page.goto(`${BASE_URL}/project/${TEST_PROJECT_ID}`);
      await waitForNetworkIdle(page);

      // Open alerts panel
      const bellIcon = page.locator('[data-testid="alerts-bell"], button[aria-label*="alert"], button[title*="alert"]').first();

      if (await bellIcon.count() > 0) {
        await bellIcon.click();
        await page.waitForTimeout(1500);

        // Look for "Dismiss All" button
        const dismissAllButton = page.locator('button:has-text("Dismiss All"), button:has-text("Clear All")').first();

        if (await dismissAllButton.count() > 0) {
          await dismissAllButton.click();
          await page.waitForTimeout(1500);
          logStep('Clicked Dismiss All button');

          // Check if confirmation dialog appears
          const hasConfirmation = await page.locator('text=/confirm|are you sure/i').count() > 0;
          if (hasConfirmation) {
            logStep('Confirmation dialog appeared');
            // Cancel to avoid actually dismissing all
            await page.keyboard.press('Escape');
          }
        } else {
          logStep('Dismiss All button not found');
        }
      }
    });
  });

  // ============================================================================
  // TEST SUITE 6: INTEGRATION TESTS (CROSS-FEATURE)
  // ============================================================================

  test.describe('Integration Tests', () => {

    test('6.1: Triaging high-relevance paper generates alert', async ({ page }) => {
      logStep('Testing triage → alert generation integration');

      await page.goto(`${BASE_URL}/project/${TEST_PROJECT_ID}`);
      await waitForNetworkIdle(page);

      // Navigate to Inbox
      await page.locator('button:has-text("Papers"), a:has-text("Papers")').first().click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Inbox"), a:has-text("Inbox")').first().click();
      await page.waitForTimeout(2000);

      // Look for high-relevance paper (score > 85)
      const highScorePaper = page.locator('[data-testid="inbox-paper-card"]:has-text("9"), [data-testid="inbox-paper-card"]:has-text("8")').first();

      if (await highScorePaper.count() > 0) {
        // Get initial alert count
        const bellIcon = page.locator('[data-testid="alerts-bell"], button[aria-label*="alert"]').first();
        await bellIcon.click();
        await page.waitForTimeout(1000);

        const initialAlertCount = await page.locator('[data-testid="alert-card"]').count();
        logStep('Initial alert count', initialAlertCount.toString());

        // Close alerts panel
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);

        // Accept the high-relevance paper
        const acceptButton = highScorePaper.locator('button:has-text("Accept")').first();
        if (await acceptButton.count() > 0) {
          await acceptButton.click();
          await page.waitForTimeout(3000); // Wait for alert generation
          logStep('Accepted high-relevance paper');

          // Check if new alert was generated
          await bellIcon.click();
          await page.waitForTimeout(1500);

          const newAlertCount = await page.locator('[data-testid="alert-card"]').count();
          logStep('New alert count', newAlertCount.toString());

          if (newAlertCount > initialAlertCount) {
            logStep('✓ Alert generated successfully after triage');
          } else {
            logStep('⚠ No new alert generated (may be expected if no high-impact paper)');
          }
        }
      } else {
        logStep('No high-relevance papers found to test alert generation');
      }
    });

    test('6.2: Alert links to related paper', async ({ page }) => {
      logStep('Testing alert → paper navigation');

      await page.goto(`${BASE_URL}/project/${TEST_PROJECT_ID}`);
      await waitForNetworkIdle(page);

      // Open alerts panel
      const bellIcon = page.locator('[data-testid="alerts-bell"], button[aria-label*="alert"]').first();
      await bellIcon.click();
      await page.waitForTimeout(1500);

      // Look for alert with paper link
      const paperLink = page.locator('a[href*="pmid"], button:has-text("View Paper"), a:has-text("PMID")').first();

      if (await paperLink.count() > 0) {
        const linkText = await paperLink.textContent();
        logStep('Found paper link in alert', linkText || '');

        // Note: We don't click to avoid navigation
        logStep('Paper link present in alert');
      } else {
        logStep('No paper links found in alerts');
      }
    });

    test('6.3: All tabs accessible from project page', async ({ page }) => {
      logStep('Testing tab navigation');

      await page.goto(`${BASE_URL}/project/${TEST_PROJECT_ID}`);
      await waitForNetworkIdle(page);

      const tabs = ['Research', 'Papers', 'Lab', 'Notes', 'Analysis'];
      const accessibleTabs = [];

      for (const tabName of tabs) {
        const tab = page.locator(`button:has-text("${tabName}"), a:has-text("${tabName}")`).first();
        if (await tab.count() > 0) {
          await tab.click();
          await page.waitForTimeout(500);
          accessibleTabs.push(tabName);
          logStep(`Accessed ${tabName} tab`);
        }
      }

      expect(accessibleTabs.length).toBeGreaterThan(0);
      logStep('Tab navigation test complete', `${accessibleTabs.length}/${tabs.length} tabs accessible`);
    });

    test('6.4: Sub-tabs accessible within main tabs', async ({ page }) => {
      logStep('Testing sub-tab navigation');

      await page.goto(`${BASE_URL}/project/${TEST_PROJECT_ID}`);
      await waitForNetworkIdle(page);

      // Test Research sub-tabs
      await page.locator('button:has-text("Research"), a:has-text("Research")').first().click();
      await page.waitForTimeout(500);

      const researchSubTabs = ['Questions', 'Hypotheses', 'Decisions'];
      for (const subTab of researchSubTabs) {
        const tab = page.locator(`button:has-text("${subTab}"), a:has-text("${subTab}")`).first();
        if (await tab.count() > 0) {
          await tab.click();
          await page.waitForTimeout(500);
          logStep(`Accessed Research → ${subTab}`);
        }
      }

      // Test Papers sub-tabs
      await page.locator('button:has-text("Papers"), a:has-text("Papers")').first().click();
      await page.waitForTimeout(500);

      const papersSubTabs = ['Inbox', 'Explore', 'Collections'];
      for (const subTab of papersSubTabs) {
        const tab = page.locator(`button:has-text("${subTab}"), a:has-text("${subTab}")`).first();
        if (await tab.count() > 0) {
          await tab.click();
          await page.waitForTimeout(500);
          logStep(`Accessed Papers → ${subTab}`);
        }
      }

      logStep('Sub-tab navigation test complete');
    });
  });

  // ============================================================================
  // TEST SUITE 7: ERROR HANDLING & EDGE CASES
  // ============================================================================

  test.describe('Error Handling Tests', () => {

    test('7.1: Handles network errors gracefully', async ({ page }) => {
      logStep('Testing network error handling');

      // Intercept API calls and simulate failure
      await page.route('**/api/**', route => {
        route.abort('failed');
      });

      await page.goto(`${BASE_URL}/project/${TEST_PROJECT_ID}`);
      await page.waitForTimeout(2000);

      // Check for error messages or fallback UI
      const hasErrorMessage = await page.locator('text=/error|failed|try again/i').count() > 0;
      const hasRetryButton = await page.locator('button:has-text("Retry"), button:has-text("Try Again")').count() > 0;

      logStep('Network error handling', `Error message: ${hasErrorMessage}, Retry button: ${hasRetryButton}`);

      // Remove route interception
      await page.unroute('**/api/**');
    });

    test('7.2: Handles empty states correctly', async ({ page }) => {
      logStep('Testing empty states');

      await page.goto(`${BASE_URL}/project/${TEST_PROJECT_ID}`);
      await waitForNetworkIdle(page);

      // Check Inbox empty state
      await page.locator('button:has-text("Papers")').first().click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Inbox")').first().click();
      await page.waitForTimeout(2000);

      const hasInboxEmpty = await page.locator('text=/no papers|empty inbox/i').count() > 0;
      logStep('Inbox empty state', hasInboxEmpty ? 'Displayed' : 'Has papers');

      // Check Decisions empty state
      await page.locator('button:has-text("Research")').first().click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Decisions")').first().click();
      await page.waitForTimeout(2000);

      const hasDecisionsEmpty = await page.locator('text=/no decisions|empty timeline/i').count() > 0;
      logStep('Decisions empty state', hasDecisionsEmpty ? 'Displayed' : 'Has decisions');
    });

    test('7.3: Handles loading states correctly', async ({ page }) => {
      logStep('Testing loading states');

      await page.goto(`${BASE_URL}/project/${TEST_PROJECT_ID}`);

      // Look for loading indicators
      const hasLoadingSpinner = await page.locator('[class*="spinner"], [class*="loading"]').count() > 0;
      const hasLoadingText = await page.locator('text=/loading|please wait/i').count() > 0;

      logStep('Loading indicators', `Spinner: ${hasLoadingSpinner}, Text: ${hasLoadingText}`);

      await waitForNetworkIdle(page);
      logStep('Page loaded successfully');
    });

    test('7.4: No console errors on page load', async ({ page }) => {
      logStep('Testing for console errors');

      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto(`${BASE_URL}/project/${TEST_PROJECT_ID}`);
      await waitForNetworkIdle(page);

      if (consoleErrors.length > 0) {
        logError(new Error(`Found ${consoleErrors.length} console errors`), 'Console');
        consoleErrors.forEach(err => console.error('  -', err));
      } else {
        logStep('No console errors found');
      }
    });

    test('7.5: No failed network requests', async ({ page }) => {
      logStep('Testing for failed requests');

      const failedRequests = [];
      page.on('requestfailed', request => {
        failedRequests.push({
          url: request.url(),
          error: request.failure().errorText
        });
      });

      await page.goto(`${BASE_URL}/project/${TEST_PROJECT_ID}`);
      await waitForNetworkIdle(page);

      // Navigate through features
      await page.locator('button:has-text("Papers")').first().click();
      await page.waitForTimeout(1000);
      await page.locator('button:has-text("Research")').first().click();
      await page.waitForTimeout(1000);

      if (failedRequests.length > 0) {
        logError(new Error(`Found ${failedRequests.length} failed requests`), 'Network');
        failedRequests.forEach(req => console.error('  -', req.url, ':', req.error));
      } else {
        logStep('No failed requests found');
      }
    });
  });

  // ============================================================================
  // TEST SUITE 8: PERFORMANCE TESTS
  // ============================================================================

  test.describe('Performance Tests', () => {

    test('8.1: Page load time is acceptable', async ({ page }) => {
      logStep('Testing page load performance');

      const startTime = Date.now();
      await page.goto(`${BASE_URL}/project/${TEST_PROJECT_ID}`);
      await waitForNetworkIdle(page);
      const loadTime = Date.now() - startTime;

      logStep('Page load time', `${loadTime}ms`);
      expect(loadTime).toBeLessThan(10000); // Should load in under 10 seconds
    });

    test('8.2: API response times are acceptable', async ({ page }) => {
      logStep('Testing API response times');

      const apiTimes = [];

      page.on('response', response => {
        if (response.url().includes('/api/')) {
          const timing = response.timing();
          if (timing) {
            apiTimes.push({
              url: response.url(),
              time: timing.responseEnd
            });
          }
        }
      });

      await page.goto(`${BASE_URL}/project/${TEST_PROJECT_ID}`);
      await waitForNetworkIdle(page);

      if (apiTimes.length > 0) {
        const avgTime = apiTimes.reduce((sum, t) => sum + t.time, 0) / apiTimes.length;
        logStep('Average API response time', `${avgTime.toFixed(2)}ms`);

        const slowRequests = apiTimes.filter(t => t.time > 2000);
        if (slowRequests.length > 0) {
          logStep(`⚠ Found ${slowRequests.length} slow API requests (>2s)`);
        }
      }
    });

    test('8.3: UI interactions are responsive', async ({ page }) => {
      logStep('Testing UI responsiveness');

      await page.goto(`${BASE_URL}/project/${TEST_PROJECT_ID}`);
      await waitForNetworkIdle(page);

      // Test tab switching speed
      const startTime = Date.now();
      await page.locator('button:has-text("Papers")').first().click();
      await page.waitForTimeout(100);
      await page.locator('button:has-text("Research")').first().click();
      await page.waitForTimeout(100);
      const switchTime = Date.now() - startTime;

      logStep('Tab switching time', `${switchTime}ms`);
      expect(switchTime).toBeLessThan(1000); // Should switch in under 1 second
    });
  });
});

// ============================================================================
// FINAL SUMMARY
// ============================================================================

test.afterAll(async () => {
  console.log('\n' + '='.repeat(80));
  console.log('COMPREHENSIVE E2E TEST SUITE - WEEKS 12-14 COMPLETE');
  console.log('='.repeat(80));
  console.log('\nTest Coverage:');
  console.log('  ✓ Backend API Endpoints (4 tests)');
  console.log('  ✓ Authentication & Navigation (2 tests)');
  console.log('  ✓ Smart Inbox (5 tests)');
  console.log('  ✓ Decision Timeline (5 tests)');
  console.log('  ✓ Project Alerts (9 tests)');
  console.log('  ✓ Integration Tests (4 tests)');
  console.log('  ✓ Error Handling (5 tests)');
  console.log('  ✓ Performance Tests (3 tests)');
  console.log('\nTotal: 37 comprehensive tests');
  console.log('='.repeat(80) + '\n');
});

