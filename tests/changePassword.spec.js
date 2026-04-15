/**
 * changePassword.spec.js
 *
 * Test suite: Change Password (logged-in user)
 *
 * Test cases (run serially — all share the same account):
 *
 *  TC-2  — Enter incorrect current password
 *          Pass: "Please Enter Correct Old Password" error visible
 *
 *  TC-1  — Change password with correct credentials
 *          Pass: success message visible
 *          Note: restores original password at the end so the suite is re-runnable
 *
 * Test order is intentional: TC-2 does NOT change the password so it always
 * logs in with CP_CURRENT_PASSWORD.  TC-1 runs last and temporarily changes
 * to CP_NEW_PASSWORD before restoring.
 *
 * Prerequisites (.env):
 *   BASE_URL            — e.g. https://ziba-property.com
 *   CP_EMAIL            — existing account email  (default: ar0@yopmail.com)
 *   CP_CURRENT_PASSWORD — the account's current password
 *   CP_NEW_PASSWORD     — a different password to use in TC-1 (then reverted)
 */

require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { LoginPage }          = require('../pages/LoginPage');
const { ChangePasswordPage } = require('../pages/ChangePasswordPage');

// ─── Credentials ─────────────────────────────────────────────────────────────
const CP_EMAIL            = process.env.CP_EMAIL            || 'ar0@yopmail.com';
const CP_CURRENT_PASSWORD = process.env.CP_CURRENT_PASSWORD || '12345678';
const CP_NEW_PASSWORD     = process.env.CP_NEW_PASSWORD     || 'NewPass@456';

// ─── Shared login helper ──────────────────────────────────────────────────────
/**
 * Log in via the LoginPage page object and wait for the home page to load.
 * @param {import('@playwright/test').Page} page
 * @param {string} password
 */
async function loginAs(page, password) {
  // reCAPTCHA must be bypassed before navigation
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await loginPage.login(CP_EMAIL, password);

  // Wait until we leave /login — confirms a successful authentication
  await page.waitForURL(/\/(home|dashboard|feed|profile|loggedin)/, { timeout: 20000 });
  console.log(`  → Logged in as ${CP_EMAIL} — on: ${page.url()}`);
}

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Change Password', () => {
  // All tests share the same account and follow a strict order, so serial mode
  // is required — parallel runs would break login with stale passwords.
  test.describe.configure({ mode: 'serial', timeout: 60_000 });

  test.beforeEach(async ({ page }) => {
    // ── reCAPTCHA bypass ─────────────────────────────────────────────────
    // Block external reCAPTCHA script so our mock is never overwritten
    await page.route('**/*recaptcha*', (route) => route.abort());

    // Inject a mock grecaptcha that fires the success callback immediately
    await page.addInitScript(() => {
      window.grecaptcha = {
        ready:       (fn) => fn(),
        render:      (_el, params) => {
          setTimeout(() => params?.callback?.('test-token'), 300);
          return 0;
        },
        getResponse: () => 'test-token',
        execute:     () => Promise.resolve('test-token'),
        reset:       () => {},
      };
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // TC-2: Incorrect current password
  // ══════════════════════════════════════════════════════════════════════════
  test('TC-2: Incorrect current password shows error message', async ({ page }) => {
    // ── Step 1: Login ────────────────────────────────────────────────────
    console.log('Step 1: Logging in…');
    await loginAs(page, CP_CURRENT_PASSWORD);

    // ── Step 2: Navigate to Change Password ─────────────────────────────
    console.log('Step 2: Navigating to Change Password…');
    const cpPage = new ChangePasswordPage(page);
    await cpPage.navigateToChangePassword();

    // ── Step 3: Submit with wrong old password ───────────────────────────
    // Using a clearly invalid password so the server will always reject it
    console.log('Step 3: Submitting incorrect current password…');
    await cpPage.fillAndSubmit('WrongPassword_xyz!', CP_NEW_PASSWORD);

    // ── Step 4: Verify error message ─────────────────────────────────────
    console.log('Step 4: Verifying "incorrect old password" error…');
    await cpPage.verifyIncorrectOldPasswordError();

    console.log('✅ TC-2 passed — incorrect old password error confirmed.');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // TC-1: Successful password change
  // Runs last so TC-2 and TC-3 always log in with CP_CURRENT_PASSWORD.
  // Restores original password at the end so the suite is fully re-runnable.
  // ══════════════════════════════════════════════════════════════════════════
  test('TC-1: Change password with correct credentials shows success', async ({ page }) => {
    // ── Step 1: Login ────────────────────────────────────────────────────
    console.log('Step 1: Logging in…');
    await loginAs(page, CP_CURRENT_PASSWORD);

    // ── Step 2: Navigate to Change Password ─────────────────────────────
    console.log('Step 2: Navigating to Change Password…');
    const cpPage = new ChangePasswordPage(page);
    await cpPage.navigateToChangePassword();

    // ── Step 3: Fill correct old password + valid new password ───────────
    console.log(`Step 3: Changing password from "${CP_CURRENT_PASSWORD}" to "${CP_NEW_PASSWORD}"…`);
    await cpPage.fillAndSubmit(CP_CURRENT_PASSWORD, CP_NEW_PASSWORD);

    // ── Step 4: Verify success ───────────────────────────────────────────
    console.log('Step 4: Verifying success message…');
    await cpPage.verifySuccess();

    console.log('✅ TC-1 passed — password changed successfully.');

    // ── Step 5: Restore original password so the suite stays re-runnable ─
    console.log('Step 5: Restoring original password…');

    // Navigate back to Change Password (the app may have stayed on the same page)
    await cpPage.navigateToChangePassword();
    await cpPage.fillAndSubmit(CP_NEW_PASSWORD, CP_CURRENT_PASSWORD);

    // Wait for any confirmation (toast/redirect) before closing
    await page.waitForTimeout(3000);
    console.log('  → Password restored to original value.');

    console.log('✅ Password restore complete — suite is re-runnable.');
  });
});
