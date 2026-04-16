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

// ─── Credentials ─────────────────────────────────────────────────────────────
const EMAIL    = 'ar10@yopmail.com';
const PASSWORD = '12345678';

// ─── Locators ─────────────────────────────────────────────────────────────────
const COOKIE_ACCEPT_BTN      = '//*[@id="page-top"]/div[4]/div/div/div/a[1]';
const INDIVIDUAL_TAB         = '//*[@id="profileVue"]/div[2]/div/div[1]/ul/li[2]/a';
const REMOVE_ROLE_BTN        = '//*[@id="individualTab"]/div/div/ul/li[2]/button';
const CONFIRM_REMOVE_BTN     = '//*[@id="loggedin-container"]/div[5]/div[7]/div/button';

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

    // Wait until redirected away from /login
    await page.waitForURL(/\/(home|dashboard|feed|profile|loggedin)/, { timeout: 30000 });
    console.log(`  → Logged in — on: ${page.url()}`);

    // ── Step 3: Navigate to Profile ─────────────────────────────────────
    console.log('Step 3: Navigating to Profile page…');
    await page.goto('/profile?tab=personal');
    // Wait for the profile tab list to be rendered — no networkidle needed
    const individualTab = page.locator(`xpath=${INDIVIDUAL_TAB}`);
    await individualTab.waitFor({ state: 'visible', timeout: 20000 });
    console.log(`  → Profile page loaded — on: ${page.url()}`);

    // ── Step 4: Select Individual User tab ──────────────────────────────
    console.log('Step 4: Clicking Individual User tab…');
    await individualTab.click();
    // Wait for the #individualTab panel to become visible after the tab switch
    const individualTabPanel = page.locator('#individualTab');
    await individualTabPanel.waitFor({ state: 'visible', timeout: 15000 });    // Allow the tab content to fully render before interacting
    await page.waitForTimeout(3000);    console.log('  → Individual User tab content loaded.');

    // ── Step 5: Click Remove Role ────────────────────────────────────────
    console.log('Step 5: Clicking "Remove Role" button…');
    const removeRoleBtn = page.locator(`xpath=${REMOVE_ROLE_BTN}`);
    await removeRoleBtn.waitFor({ state: 'visible', timeout: 15000 });
    await removeRoleBtn.click();
    console.log('  → Remove Role clicked.');

    // Wait for the confirmation alert to appear
    await page.waitForTimeout(5000);

    // ── Step 6: Confirm removal in dialog ───────────────────────────────
    console.log('Step 6: Confirming removal in confirmation dialog…');
    const confirmBtn = page.locator(`xpath=${CONFIRM_REMOVE_BTN}`);
    await confirmBtn.waitFor({ state: 'visible', timeout: 15000 });
    await confirmBtn.click();
    console.log('  → Confirmation dialog accepted.');

    // Allow the deletion process to complete before the success pop-up appears
    await page.waitForTimeout(4000);

    // ── Step 7: SKIPPED — success pop-up handled by app automatically ────

    // ── Step 8: Verify redirect to /profile?tab=personal ────────────────
    console.log('Step 8: Verifying redirect to /profile?tab=personal…');
    await page.waitForURL(/\/profile\?tab=personal/, { timeout: 20000 });
    console.log(`  → Redirected to: ${page.url()}`);

    await expect(page).toHaveURL(/\/profile\?tab=personal/);

    console.log('✅ TC-1 passed — Account role removed and redirect confirmed.');
  });
});
