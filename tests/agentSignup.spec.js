require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { AgentSignUpPage } = require('../pages/AgentSignUpPage');
const { OtpPage } = require('../pages/OtpPage');

/**
 * Agent Sign Up Test Suite — Real Estate Agent role
 *
 * Flow:
 *  1. Navigate to landing page
 *  2. Open Login/Sign Up dropdown → click "Real Estate Agent"
 *  3. Fill in Name, Email, Phone (Pakistan), Password (12345678)
 *  4. Click the reCAPTCHA checkbox
 *  5. Click Sign Up
 *  6. Go to Yopmail inbox → refresh → click "Verify" in email
 *  7. Verify dashboard is visible
 */

// Generate a unique yopmail address for this run so we don't reuse stale inboxes
const timestamp = Date.now();
const agentEmail = `agent_${timestamp}@yopmail.com`;
const agentName = 'Test Agent';
const agentPass = '12345678';   // password is always 1–8 per requirement

test.describe('Agent Sign Up — Real Estate Agent Role', () => {
  test.slow(); // Allow extra time for captcha, emails, etc.

  let agentSignUpPage;
  let otpPage;

  test.beforeEach(async ({ page }) => {
    agentSignUpPage = new AgentSignUpPage(page);
    otpPage = new OtpPage(page);
    await agentSignUpPage.navigate();
  });

  test('Real Estate Agent should be able to sign up and verify email', async ({
    page,
    context,
  }) => {
    // ── Step 1: Open dropdown and select Real Estate Agent ──────────────────
    console.log('Step 1: Selecting Real Estate Agent from dropdown…');
    await agentSignUpPage.selectRealEstateAgentRole();

    // ── Step 2: Fill in the sign-up form ────────────────────────────────────
    console.log(`Step 2: Filling agent sign-up form (email: ${agentEmail})…`);
    await agentSignUpPage.fillAgentForm(agentName, agentEmail, agentPass);

    // ── Step 3: Click reCAPTCHA ──────────────────────────────────────────────
    console.log('Step 3: Clicking reCAPTCHA checkbox…');
    await agentSignUpPage.clickCaptcha();

    // ── Step 4: Click Sign Up button ─────────────────────────────────────────
    console.log('Step 4: Submitting the sign-up form…');
    await agentSignUpPage.submit();

    // ── Step 5: Wait for OTP / email verification page ───────────────────────
    console.log('Step 5: Waiting for email verification step…');
    await page.waitForTimeout(3000);

    // ── Step 6: Open Yopmail, refresh inbox, click "Verify" ──────────────────
    console.log(`Step 6: Checking Yopmail inbox for ${agentEmail}…`);
    await verifyEmailViaYopmail(context, agentEmail);

    // ── Step 7: Verify dashboard is visible ──────────────────────────────────
    console.log('Step 7: Verifying dashboard is visible…');
    await page.bringToFront();
    // Wait 5 seconds to visually verify that the verification has completed
    await page.waitForTimeout(5000);

    // Dashboard check — URL should no longer be on auth/otp pages
    const currentUrl = page.url();
    console.log(`  → Current URL after verification: ${currentUrl}`);

    const isDashboard =
      !currentUrl.includes('/otp') &&
      !currentUrl.includes('/login') &&
      !currentUrl.includes('/signup');

    expect(isDashboard, `Expected to land on dashboard but got: ${currentUrl}`).toBeTruthy();

    console.log('✅ Agent sign-up and email verification complete!');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Helper: Open Yopmail in a new tab, refresh inbox, click the "Verify" button
// ────────────────────────────────────────────────────────────────────────────
async function verifyEmailViaYopmail(context, email) {
  const username = email.split('@')[0];
  const yopPage = await context.newPage();

  try {
    await yopPage.goto('https://yopmail.com/en/', { waitUntil: 'domcontentloaded' });

    // Enter inbox name
    const loginInput = yopPage.locator('#login');
    await loginInput.waitFor({ state: 'visible' });
    await loginInput.fill(username);
    await loginInput.press('Enter');

    // Wait for inbox to load
    await yopPage.waitForTimeout(4000);

    let verified = false;
    let retries = 6;

    while (retries > 0 && !verified) {
      // Refresh the inbox
      const refreshBtn = yopPage.locator('#refresh');
      if (await refreshBtn.isVisible()) {
        await refreshBtn.click();
        console.log(`  → Refreshed Yopmail inbox (attempts left: ${retries})…`);
      }
      await yopPage.waitForTimeout(4000);

      // Try to find the Verify button/link inside the mail iframe
      const mailFrame = yopPage.frameLocator('#ifmail');

      try {
        // Try a link or button with text "Verify"
        const verifyLink = mailFrame.locator('a', { hasText: /verify/i }).first();
        const verifyBtn = mailFrame.locator('button', { hasText: /verify/i }).first();

        if (await verifyLink.isVisible({ timeout: 3000 })) {
          console.log('  → Found "Verify" link in email — clicking…');

          // Capture the newly opened tab when clicking the link
          const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            verifyLink.click()
          ]);

          // Wait on the new tab for 3 seconds as requested
          await newPage.waitForLoadState();
          await newPage.waitForTimeout(3000);

          verified = true;
        } else if (await verifyBtn.isVisible({ timeout: 3000 })) {
          console.log('  → Found "Verify" button in email — clicking…');

          // Capture the newly opened tab when clicking the button
          const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            verifyBtn.click()
          ]);

          // Wait on the new tab for 3 seconds as requested
          await newPage.waitForLoadState();
          await newPage.waitForTimeout(3000);

          verified = true;
        }
      } catch (_) {
        // Not found yet — retry
      }

      retries--;
    }

    if (!verified) {
      throw new Error(`Verification email not found in Yopmail inbox for: ${email}`);
    }

    // Allow the verification redirect to complete
    await yopPage.waitForTimeout(3000);
  } finally {
    await yopPage.close();
  }
}
