/**
 * dashboardWidgets.spec.js
 *
 * Test suite: Role-based dashboard widgets
 *
 * For each role available to the test account, switch to that role via the
 * sidebar profile section and verify that ONLY the expected widgets are
 * visible on the dashboard. Also verifies the "Add Widget" button is
 * present for every role.
 *
 * Roles & expected widgets:
 *
 *   • Real Estate Agent (6 widgets)
 *       - Draft
 *       - Listed Properties
 *       - Property Proposals
 *       - Listed / Wanted Items
 *       - Properties by Owners
 *       - Enquiries
 *
 *   • Individual User (4 widgets) — only verified if the role exists
 *       - Listed Properties
 *       - Draft
 *       - Enquiries
 *       - My Favorite
 *
 * "Add Widget" button (#addWidget) must be visible for both roles.
 *
 * Prerequisites (.env):
 *   BASE_URL — e.g. https://ziba-property.com
 */

require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { SidebarPanelPage } = require('../pages/SidebarPanelPage');
const { DashboardPage }    = require('../pages/DashboardPage');

// ─── Credentials ─────────────────────────────────────────────────────────────
const EMAIL    = process.env.SP_EMAIL    || 'ar0@yopmail.com';
const PASSWORD = process.env.SP_PASSWORD || '12345678';

// ─── Locators ────────────────────────────────────────────────────────────────
const COOKIE_ACCEPT_BTN = '//*[@id="page-top"]/div[4]/div/div/div/a[1]';

const HOME_URL = '/home';

// ─── Roles & widget catalogs ─────────────────────────────────────────────────
const AGENT_ROLE      = 'Real Estate Agent';
const INDIVIDUAL_ROLE = 'Individual User';

const AGENT_WIDGETS = [
  'Draft',
  'Listed Properties',
  'Property Proposals',
  'Listed / Wanted Items',
  'Properties by Owners',
  'Enquiries',
];
const INDIVIDUAL_WIDGETS = [
  'Listed Properties',
  'Draft',
  'Enquiries',
  'My Favorite',
];

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Role-based Dashboard Widgets', () => {
  test.describe.configure({ mode: 'serial', timeout: 180_000 });

  /** @type {import('@playwright/test').Page} */
  let page;
  /** @type {SidebarPanelPage} */
  let sidebar;
  /** @type {DashboardPage} */
  let dashboard;

  // Helper: switch active role via the sidebar profile section. Returns
  // true when the role was found and selected, false otherwise.
  const switchRole = async (roleName) => {
    await page.goto(HOME_URL, { waitUntil: 'domcontentloaded' });
    await sidebar.open();
    await sidebar.expandProfileSectionAndVerify();
    const exists = await sidebar.hasRole(roleName);
    if (!exists) return false;
    await sidebar.selectRole(roleName);
    // After role selection, ensure we are on the dashboard so widgets render.
    await page.goto(HOME_URL, { waitUntil: 'domcontentloaded' });
    return true;
  };

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

    sidebar   = new SidebarPanelPage(page);
    dashboard = new DashboardPage(page);
    await sidebar.open();
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ══════════════════════════════════════════════════════════════════════════
  // TC-1: Real Estate Agent — verify exactly 6 widgets + Add Widget button
  // ══════════════════════════════════════════════════════════════════════════
  test('TC-1: "Real Estate Agent" sees exactly 6 widgets + Add Widget button', async () => {
    console.log(`TC-1: Selecting "${AGENT_ROLE}" and verifying widgets…`);
    const selected = await switchRole(AGENT_ROLE);
    expect(selected, `"${AGENT_ROLE}" role must be available for this account`).toBe(true);

    await dashboard.expectOnlyWidgets(AGENT_WIDGETS);
    await dashboard.expectAddWidgetVisible();
    console.log(`✅ TC-1 passed — ${AGENT_ROLE}: ${AGENT_WIDGETS.length} widgets + "Add Widget" verified.`);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // TC-2: Individual User — verify exactly 4 widgets + Add Widget button
  //        Skipped automatically when the role isn't available on the account.
  // ══════════════════════════════════════════════════════════════════════════
  test('TC-2: "Individual User" sees exactly 4 widgets + Add Widget button', async () => {
    console.log(`TC-2: Selecting "${INDIVIDUAL_ROLE}" and verifying widgets…`);
    const selected = await switchRole(INDIVIDUAL_ROLE);
    test.skip(!selected, `"${INDIVIDUAL_ROLE}" role not present for this account — skipping TC-2.`);

    await dashboard.expectOnlyWidgets(INDIVIDUAL_WIDGETS);
    await dashboard.expectAddWidgetVisible();
    console.log(`✅ TC-2 passed — ${INDIVIDUAL_ROLE}: ${INDIVIDUAL_WIDGETS.length} widgets + "Add Widget" verified.`);
  });
});
