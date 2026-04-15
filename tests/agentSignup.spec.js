require('dotenv').config();
const path = require('path');
const { test } = require('@playwright/test');
const { AgentSignUpPage } = require('../pages/AgentSignUpPage');
const { AgentRolePage }   = require('../pages/AgentRolePage');

const agentEmail = `agent_${Date.now()}@yopmail.com`;
const ROLE_ADDRESS = 'vogue Tower';

test.describe('Agent — Sign Up + Role Creation', () => {
  test.describe.configure({ timeout: 180_000 });

  let signUpPage;
  let rolePage;

  test.beforeEach(async ({ page }) => {
    signUpPage = new AgentSignUpPage(page);
    await signUpPage.navigate();
  });

  test('Agent signs up, verifies email, and completes role creation', async ({ context }) => {

    // ── 1. Sign Up ────────────────────────────────────────────────────────────
    console.log(`Signing up as: ${agentEmail}`);
    await signUpPage.selectRealEstateAgentRole();
    await signUpPage.fillAgentForm('Test Agent', agentEmail, '12345678');
    await signUpPage.clickCaptcha();
    await signUpPage.submit();
    await signUpPage.waitForSignupSuccess();

    // ── 2. Email Verification ─────────────────────────────────────────────────
    console.log('Verifying email via Yopmail…');
    const verifiedPage = await verifyEmailViaYopmail(context, agentEmail);
    await verifiedPage.bringToFront();

    // ── 3. Role Creation ──────────────────────────────────────────────────────
    console.log('Filling role creation form…');
    rolePage = new AgentRolePage(verifiedPage);
    await rolePage.validateNavigation();

    await rolePage.fillAndSubmit({
      companyName:     'Ziba Properties Sdn Bhd',
      companyRegNo:    'VE 3 0170',
      companyEmail:    'agent@zibaproperties.com',
      agentRegNo:      'REN 12345',
      phone:           '0123 4567890',
      website:         'https://zibaproperties.com',
      imagePath:       path.resolve(__dirname, '..', 'test-data', 'profile_image.png'),
      companyAddress:  ROLE_ADDRESS,
      coveredLocation: 'Lahore, Pakistan',
    });

    // ── 4. Verify Dashboard ───────────────────────────────────────────────────
    await rolePage.verifySubmissionSuccess();
    console.log('✅ Full agent flow complete!');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper — open Yopmail, wait for the verification email, return the new page
// ─────────────────────────────────────────────────────────────────────────────
async function verifyEmailViaYopmail(context, email) {
  const username = email.split('@')[0];
  const yopPage  = await context.newPage();

  try {
    await yopPage.goto('https://yopmail.com/en/', { waitUntil: 'domcontentloaded' });

    const loginInput = yopPage.locator('#login');
    await loginInput.waitFor({ state: 'visible' });
    await loginInput.fill(username);
    await loginInput.press('Enter');
    await yopPage.waitForLoadState('domcontentloaded');

    let verifiedPage = null;
    // Poll because verification emails can arrive with delay.
    let retries = 8;

    while (retries > 0 && !verifiedPage) {
      const refreshBtn = yopPage.locator('#refresh');
      if (await refreshBtn.isVisible()) {
        await refreshBtn.click();
        console.log(`  → Refreshed inbox (${retries} attempts left)…`);
      }

      // Mail content is rendered inside Yopmail's iframe.
      const frame      = yopPage.frameLocator('#ifmail');
      const verifyLink = frame.locator('a', { hasText: /verify/i }).first();

      try {
        if (await verifyLink.isVisible({ timeout: 5000 })) {
          console.log('  → Verify link found — clicking…');
          // Clicking the verify link opens a new tab/window.
          const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            verifyLink.click(),
          ]);
          await newPage.waitForLoadState('domcontentloaded');
          verifiedPage = newPage;
        } else {
          await yopPage.waitForTimeout(5000);
        }
      } catch {
        await yopPage.waitForTimeout(5000);
      }

      retries--;
    }

    if (!verifiedPage) throw new Error(`Verification email not found for: ${email}`);
    return verifiedPage;

  } finally {
    await yopPage.close();
  }
}
