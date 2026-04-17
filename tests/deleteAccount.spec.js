/**
 * deleteAccount.spec.js
 *
 * Test suite: Account Deactivation/Deletion
 *
 * Runs serially with a shared browser page — login happens once in TC-1,
 * and each subsequent test continues from where the previous one left off.
 *
 * TC-1 — Remove Individual User role
 * TC-2 — Remove Agent role
 * TC-3 — Remove Business & Service role
 * TC-4 — Delete the user account
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

  /** @type {import('@playwright/test').Page} */
  let page;
  /** @type {DeleteAccountPage} */
  let deleteAccountPage;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

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

    // ── Login once ───────────────────────────────────────────────────────
    console.log('Setup: Navigating to login page…');
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

    console.log(`Setup: Logging in as ${EMAIL}…`);
    await page.locator('//*[@id="authForm"]/div/form/div[1]/div/input').fill(EMAIL);
    await page.locator('//*[@id="authForm"]/div/form/div[2]/div/input').fill(PASSWORD);
    await page.locator('//*[@id="authForm"]/div/form/button').click();
    await page.waitForURL(/\/(home|dashboard|feed|profile|loggedin)/, { timeout: 30000 });
    console.log(`  → Logged in — on: ${page.url()}`);

    deleteAccountPage = new DeleteAccountPage(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ══════════════════════════════════════════════════════════════════════════
  // TC-1: Remove Individual User role
  // ══════════════════════════════════════════════════════════════════════════
  test('TC-1: Remove Individual User role', async () => {

    console.log('TC-1 Step 1: Navigating to Profile page…');
    await deleteAccountPage.navigateToProfile();

    console.log('TC-1 Step 2: Clicking Individual User tab…');
    await deleteAccountPage.selectIndividualTab();

    console.log('TC-1 Step 3: Clicking "Remove Role" and confirming dialog…');
    await deleteAccountPage.removeIndividualRole();

    console.log('TC-1 Step 4: Verifying redirect to /profile?tab=personal…');
    await deleteAccountPage.verifyRedirectToProfile();

    console.log('✅ TC-1 passed — Individual role removed and redirect confirmed.');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // TC-2: Remove Agent role
  // ══════════════════════════════════════════════════════════════════════════
  test('TC-2: Remove Agent role', async () => {

    console.log('TC-2 Step 1: Navigating to Profile page…');
    await deleteAccountPage.navigateToProfile();

    console.log('TC-2 Step 2: Clicking Agent tab…');
    await deleteAccountPage.selectAgentTab();

    console.log('TC-2 Step 3: Clicking "Remove Role" and confirming dialog…');
    await deleteAccountPage.removeAgentRole();

    console.log('TC-2 Step 4: Verifying redirect after agent role deletion…');
    await deleteAccountPage.verifyRedirectAfterAgentDeletion(/\/profile\?tab=agent/);

    console.log('✅ TC-2 passed — Agent role removed and redirect confirmed.');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // TC-3: Remove Business & Service role
  // ══════════════════════════════════════════════════════════════════════════
  test('TC-3: Remove Business & Service role', async () => {

    console.log('TC-3 Step 1: Navigating to Profile page…');
    await deleteAccountPage.navigateToProfile();

    console.log('TC-3 Step 2: Clicking Business & Service tab…');
    await deleteAccountPage.selectBusinessTab();

    console.log('TC-3 Step 3: Clicking "Remove Role" and confirming dialog…');
    await deleteAccountPage.removeBusinessRole();

    console.log('TC-3 Step 4: Verifying URL after business role deletion…');
    await deleteAccountPage.verifyRedirectAfterBusinessDeletion(/\/(home|profile)/);

    console.log('✅ TC-3 passed — Business & Service role removed and redirect confirmed.');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // TC-4: Delete user account after all roles are removed
  // ══════════════════════════════════════════════════════════════════════════
  test('TC-4: Delete user account', async () => {

    console.log('TC-4 Step 1: Navigating to Profile page…');
    await deleteAccountPage.navigateToProfile();

    console.log('TC-4 Step 2: Clicking "Remove Account" and confirming deletion…');
    await deleteAccountPage.deleteAccount();

    console.log('TC-4 Step 3: Verifying redirect to https://ziba-property.com/…');
    await deleteAccountPage.verifyRedirectToHomepage();

    console.log('✅ TC-4 passed — User account deleted and redirected to homepage.');
  });
});
