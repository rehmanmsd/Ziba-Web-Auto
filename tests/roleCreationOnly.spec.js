require('dotenv').config();
const path = require('path');
const { test, expect } = require('@playwright/test');
const { AgentRolePage } = require('../pages/AgentRolePage');
const { LoginPage } = require('../pages/LoginPage');
const { LOCATORS } = require('../utils/locators');

/**
 * Agent Role Creation — Independent Step
 * This test validates the navigation, form completeness, and submission 
 * of the Agent Role Creation form at https://ziba-property.com/register/agent/first
 */

test.describe('Agent Role Creation — Standalone Flow', () => {
  test.slow();

  test('Should validate and complete the agent role creation form', async ({ page }) => {
    const agentRolePage = new AgentRolePage(page);
    const loginPage = new LoginPage(page);
    
    // ── Step 0: Login ────────────────────────────────────────────────────────
    console.log('Step 0: Logging in with specific credentials…');
    await loginPage.navigate();
    await loginPage.login('ar1@yopmail.com', '12345678');
    await page.waitForLoadState('networkidle');

    // ── Step 1: Click Continue to land on Role Creation URL ──────────────────
    console.log('Step 1: Clicking "Continue" to navigate to Role Creation…');
    const continueBtn = page.locator(LOCATORS.agentContinueBtn);
    await continueBtn.waitFor({ state: 'visible', timeout: 15000 });
    await continueBtn.click();
    
    // Validate we are on the correct URL
    await agentRolePage.validateNavigation();
    
    // ── Step 2: Assert Field Visibility and Interactivity ────────────────────
    console.log('Step 2: Asserting fields are visible and interactive…');
    await agentRolePage.verifyFieldsVisibility();
    
    // ── Step 3: Fill Mandatory Fields ────────────────────────────────────────
    console.log('Step 3: Filling all mandatory fields for Agent Role…');
    const imagePath = path.resolve(__dirname, '..', 'test-data', 'profile_image.png');
    
    await agentRolePage.fillAndSubmitAgentRoleForm({
      companyName: 'Grand Reals Estate LLC',
      companyRegNo: 'RE-786-92',
      companyAddress: 'Plot 4, Silicon Oasis, Dubai',
      agentRegNo: 'AR-00123',
      website: 'https://grandreals.com',
      imagePath: imagePath,
      coveredLocation: 'Silicon Oasis, Dubai',
      searchAddress: 'Silicon Oasis, Dubai'
    });

    // ── Step 4: Verify Successful Submission ─────────────────────────────────
    console.log('Step 4: Verifying successful submission…');
    await agentRolePage.verifySubmissionSuccess();
  });
});
