/**
 * sidebarPanel.spec.js
 *
 * Test suite: Side Blue Panel (logged-in user)
 *
 * Runs serially with a shared browser page — login happens once in beforeAll,
 * and each test continues from where the previous one left off.
 *
 * TC-1 — Verify visibility of top section (Menu icon, Dashboard, Neighborhood)
 * TC-2 — Expand "Neighborhood" and verify all four sub-items are visible
 * TC-3 — Scroll the panel and verify lower section item (FAQ) is visible
 * TC-4 — Expand the profile image container and verify all options
 *        (My Profile, Manage Role, Add a New Buy-Sell-Wanted, Logout)
 * TC-5 — Click each Neighborhood sub-item, then each profile option,
 *        finally click "Manage Role" (last action — no return).
 *
 * Prerequisites (.env):
 *   BASE_URL — e.g. https://ziba-property.com
 */

require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { SidebarPanelPage } = require('../pages/SidebarPanelPage');

// ─── Credentials ─────────────────────────────────────────────────────────────
const EMAIL    = process.env.SP_EMAIL    || 'ar0@yopmail.com';
const PASSWORD = process.env.SP_PASSWORD || '12345678';

// ─── Locators ─────────────────────────────────────────────────────────────────
const COOKIE_ACCEPT_BTN = '//*[@id="page-top"]/div[4]/div/div/div/a[1]';

// URL the suite returns to between item clicks so the sidebar is in a known
// state. Most logged-in pages render the same sidebar; /home is a safe choice.
const HOME_URL = '/home';

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Side Blue Panel', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  /** @type {import('@playwright/test').Page} */
  let page;
  /** @type {SidebarPanelPage} */
  let sidebar;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120_000);
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

    sidebar = new SidebarPanelPage(page);
    await sidebar.open();
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ══════════════════════════════════════════════════════════════════════════
  // TC-1: Top section visibility
  // ══════════════════════════════════════════════════════════════════════════
  test('TC-1: Menu icon, Dashboard and Neighborhood are visible', async () => {
    console.log('TC-1: Verifying top section visibility…');
    await sidebar.verifyTopSection();
    console.log('✅ TC-1 passed — top section items are visible.');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // TC-2: Expand Neighborhood and verify sub-items
  // ══════════════════════════════════════════════════════════════════════════
  test('TC-2: Expand Neighborhood and verify all listings', async () => {
    console.log('TC-2: Expanding Neighborhood and verifying sub-items…');
    await sidebar.expandNeighborhoodAndVerify();
    console.log('✅ TC-2 passed — all Neighborhood sub-items are visible.');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // TC-3: Lower section visibility (FAQ)
  // ══════════════════════════════════════════════════════════════════════════
  test('TC-3: Scroll and verify lower section (FAQ)', async () => {
    console.log('TC-3: Verifying lower section visibility…');
    await sidebar.verifyLowerSection();
    console.log('✅ TC-3 passed — FAQ is visible.');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // TC-4: Expand profile image container and verify options
  // ══════════════════════════════════════════════════════════════════════════
  test('TC-4: Expand profile section and verify all options', async () => {
    console.log('TC-4: Expanding profile image container and verifying options…');
    await sidebar.expandProfileSectionAndVerify();
    console.log('✅ TC-4 passed — My Profile, Manage Role, Add Buy-Sell-Wanted and Logout are visible.');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // TC-5: Click every option, end with Manage Role
  // ══════════════════════════════════════════════════════════════════════════
  test('TC-5: Click each option, finishing on Manage Role', async () => {
    test.setTimeout(300_000);
    console.log('TC-5: Clicking each sidebar option…');

    // Re-establish a known starting page
    await page.goto(HOME_URL, { waitUntil: 'domcontentloaded' });
    await sidebar.open();

    // Helper — re-expand Neighborhood after each navigation
    const reopenNeighborhood = async () => {
      await sidebar.neighborhood.click();
      await page.waitForTimeout(800);
    };

    // Helper — re-expand profile image container after each navigation
    const reopenProfileSection = async () => {
      await sidebar.dismissOverlays();
      await sidebar.scrollIntoView(sidebar.profileImageContainer);
      await sidebar.profileImageContainer.click({ force: true });
      console.log('  → Profile image container re-expanded.');
      // Wait until a known sub-item becomes visible so subsequent clicks succeed
      await sidebar.myProfile.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(500);
    };

    // ── Neighborhood items ───────────────────────────────────────────────
    await reopenNeighborhood();
    await sidebar.clickAndReturn(sidebar.propertyListings,   'Property Listings',     HOME_URL);

    await reopenNeighborhood();
    await sidebar.clickAndReturn(sidebar.businessesServices, 'Businesses & Services', HOME_URL);

    await reopenNeighborhood();
    await sidebar.clickAndReturn(sidebar.buySellWanted,      'Buy-Sell-Wanted',       HOME_URL);

    await reopenNeighborhood();
    await sidebar.clickAndReturn(sidebar.findAgents,         'Find Agents',           HOME_URL);

    // ── Top-level Dashboard ──────────────────────────────────────────────
    await sidebar.clickAndReturn(sidebar.dashboard, 'Dashboard', HOME_URL);

    // ── FAQ ──────────────────────────────────────────────────────────────
    await sidebar.clickAndReturn(sidebar.faq, 'FAQ', HOME_URL);

    // ── Profile sub-menu items (skip Logout — would end the session) ─────
    await reopenProfileSection();
    await sidebar.clickAndReturn(sidebar.myProfile, 'My Profile', HOME_URL);

    await reopenProfileSection();
    await sidebar.clickAndReturn(sidebar.addBuySellWanted, 'Add a New Buy-Sell-Wanted', HOME_URL);

    // ── Final action: Manage Role (do NOT return) ────────────────────────
    await reopenProfileSection();
    await sidebar.clickManageRole();

    console.log('✅ TC-5 passed — all options clicked, finished on Manage Role.');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // TC-6: "Real Estate Agent" role flow (select → add property → CRM new tab)
  //       then complete FAQ and profile icon click flow.
  // ══════════════════════════════════════════════════════════════════════════
  test('TC-6: Real Estate Agent role flow + FAQ + profile icon click', async () => {
    test.setTimeout(180_000);
    const ROLE_NAME      = 'Real Estate Agent';
    const CRM_URL_REGEX  = /^https:\/\/ziba-property\.com\/connect-crm/;

    console.log(`TC-6: Verifying "${ROLE_NAME}" role exists and exercising its flow…`);

    // Land on a known page and re-open the sidebar / profile section
    await page.goto(HOME_URL, { waitUntil: 'domcontentloaded' });
    await sidebar.open();
    await sidebar.expandProfileSectionAndVerify();

    // ── 1) Verify role existence ─────────────────────────────────────────
    const exists = await sidebar.hasRole(ROLE_NAME);
    test.skip(!exists, `"${ROLE_NAME}" role not present for this account — skipping TC-6.`);
    console.log(`  ✓ "${ROLE_NAME}" role found in sidebar.`);

    // ── 2) Click role name to select it ──────────────────────────────────
    await sidebar.selectRole(ROLE_NAME);

    // ── 3) Click "Add New Property" ──────────────────────────────────────
    await page.goto(HOME_URL, { waitUntil: 'domcontentloaded' });
    await sidebar.open();
    await sidebar.expandProfileSectionAndVerify();
    await sidebar.clickRoleAddProperty(ROLE_NAME);

    // ── 4) Click CRM → verify same-tab navigation to /connect-crm ────────
    await page.goto(HOME_URL, { waitUntil: 'domcontentloaded' });
    await sidebar.open();
    await sidebar.expandProfileSectionAndVerify();
    await sidebar.clickRoleCrmAndVerify(ROLE_NAME, CRM_URL_REGEX);

    // ── 5) Complete FAQ click flow ───────────────────────────────────────
    await sidebar.clickAndReturn(sidebar.faq, 'FAQ', HOME_URL);

    // ── 6) Complete profile icon click (re-expand profile section) ───────
    await sidebar.expandProfileSectionAndVerify();

    console.log(`✅ TC-6 passed — "${ROLE_NAME}" role flow completed with FAQ and profile icon click.`);
  });
});
