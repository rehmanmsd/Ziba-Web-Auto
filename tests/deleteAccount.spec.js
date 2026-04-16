/**
 * deleteAccount.spec.js
 *
 * Test suite: Account Deactivation/Deletion
 *
 * TC-1 — Delete account from profile and confirm deletion
 *         Steps:
 *           1. Log in as ar10@yopmail.com / 12345678
 *           2. Go to Profile page
 *           3. Select the Individual User tab
 *           4. Click "Remove Role" on the individual role entry
 *           5. Confirm removal in the confirmation dialog
 *           6. Wait for success pop-up and click "Ok"
 *           7. Verify redirect to /profile?tab=personal
 *
 * Prerequisites (.env):
 *   BASE_URL — e.g. https://ziba-property.com
 */

require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { DeleteAccountPage } = require('../pages/DeleteAccountPage');

// ─── Credentials ─────────────────────────────────────────────────────────────
const EMAIL    = 'ar10@yopmail.com';
const PASSWORD = '12345678';

// ─── Locators ─────────────────────────────────────────────────────────────────
const COOKIE_ACCEPT_BTN = '//*[@id="page-top"]/div[4]/div/div/div/a[1]';

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Account Deactivation/Deletion', () => {
  test.describe.configure({ mode: 'serial', timeout: 90_000 });

  test.beforeEach(async ({ page }) => {
    // ── reCAPTCHA bypass ─────────────────────────────────────────────────
    await page.route('**/*recaptcha*', (route) => route.abort());

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
  // TC-1: Delete account from profile and confirm deletion
  // ══════════════════════════════════════════════════════════════════════════
  test('TC-1: Delete account from profile and confirm deletion', async ({ page }) => {

    // ── Step 1: Navigate to login ────────────────────────────────────────
    console.log('Step 1: Navigating to login page…');
    await page.goto('/login');

    // Dismiss cookie / promotional banner if it appears
    const cookieBtn = page.locator(`xpath=${COOKIE_ACCEPT_BTN}`);
    try {
      await cookieBtn.waitFor({ state: 'visible', timeout: 5000 });
      await cookieBtn.click();
      console.log('  → Cookie/promo banner dismissed.');
    } catch {
      console.log('  → No cookie/promo banner found, continuing…');
    }

    // ── Step 2: Log in ───────────────────────────────────────────────────
    console.log(`Step 2: Logging in as ${EMAIL}…`);
    await page.locator('//*[@id="authForm"]/div/form/div[1]/div/input').fill(EMAIL);
    await page.locator('//*[@id="authForm"]/div/form/div[2]/div/input').fill(PASSWORD);
    await page.locator('//*[@id="authForm"]/div/form/button').click();
    await page.waitForURL(/\/(home|dashboard|feed|profile|loggedin)/, { timeout: 30000 });
    console.log(`  → Logged in — on: ${page.url()}`);

    const deleteAccountPage = new DeleteAccountPage(page);

    // ── Step 3: Navigate to Profile ─────────────────────────────────────
    console.log('Step 3: Navigating to Profile page…');
    await deleteAccountPage.navigateToProfile();

    // ── Step 4: Select Individual User tab ──────────────────────────────
    console.log('Step 4: Clicking Individual User tab…');
    await deleteAccountPage.selectIndividualTab();

    // ── Step 5 & 6: Remove Role and confirm in dialog ────────────────────
    console.log('Step 5: Clicking "Remove Role" and confirming dialog…');
    await deleteAccountPage.removeIndividualRole();

    // ── Step 7: Verify redirect to /profile?tab=personal ────────────────
    console.log('Step 7: Verifying redirect to /profile?tab=personal…');
    await deleteAccountPage.verifyRedirectToProfile();

    console.log('✅ TC-1 passed — Account role removed and redirect confirmed.');
  });
});
