/**
 * SidebarPanelPage
 *
 * Encapsulates all interactions with the left "Side Blue Panel" that is
 * visible to a logged-in user across the app.
 *
 * Sections covered:
 *   • Top header           — collapsible Menu (hamburger) icon
 *   • Primary navigation   — Dashboard, Neighborhood (+ children)
 *   • Lower navigation     — FAQ
 *   • Profile section      — image container that collapses / expands a
 *                            sub-menu containing My Profile, Manage Role,
 *                            Add a New Buy-Sell-Wanted, Logout
 *
 * All locators come from utils/locators.js so the tests stay declarative.
 */

const { LOCATORS } = require('../utils/locators');
const { expect }   = require('@playwright/test');

class SidebarPanelPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // Root sidebar container — used for visibility / scroll operations
    this.root = page.locator('#sidebardata');

    // Profile avatar in the top-right header — must be clicked to open the
    // sidebar (it is hidden by default after login).
    this.profileAvatar = page.locator(LOCATORS.profileAvatar);

    // ── Top header ──────────────────────────────────────────────────────
    this.menuIcon = page.locator(`xpath=${LOCATORS.sbMenuIcon}`);

    // ── Primary navigation ──────────────────────────────────────────────
    this.dashboard    = page.locator(`xpath=${LOCATORS.sbDashboard}`);
    this.neighborhood = page.locator(`xpath=${LOCATORS.sbNeighborhood}`);

    // ── Neighborhood sub-items ─────────────────────────────────────────
    this.propertyListings   = page.locator(`xpath=${LOCATORS.sbPropertyListings}`);
    this.businessesServices = page.locator(`xpath=${LOCATORS.sbBusinessesServices}`);
    this.buySellWanted      = page.locator(`xpath=${LOCATORS.sbBuySellWanted}`);
    this.findAgents         = page.locator(`xpath=${LOCATORS.sbFindAgents}`);

    // ── Lower navigation ────────────────────────────────────────────────
    this.faq = page.locator(`xpath=${LOCATORS.sbFaq}`);

    // Image container that collapses / expands the profile sub-menu
    this.profileImageContainer = page.locator(`xpath=${LOCATORS.sbProfileImageContainer}`);

    // ── Profile sub-menu items ──────────────────────────────────────────
    this.myProfile        = page.locator(`xpath=${LOCATORS.sbMyProfile}`);
    this.manageRole       = page.locator(`xpath=${LOCATORS.sbManageRole}`);
    this.addBuySellWanted = page.locator(`xpath=${LOCATORS.sbAddBuySellWanted}`);
    this.logout           = page.locator(`xpath=${LOCATORS.sbLogout}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // Generic helpers
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Open the sidebar (if not already open) by clicking the profile avatar,
   * then wait until a known sidebar child becomes interactable.
   *
   * Note: the `#sidebardata` root often stays CSS-hidden (transform/clip),
   * while its children are visible and clickable. We therefore probe a
   * known child element (Dashboard) instead of the root container.
   */
  async open() {
    // If a known sidebar child is already visible, the sidebar is open.
    if (await this.dashboard.isVisible().catch(() => false)) {
      console.log('  → Sidebar already open.');
      return;
    }

    // Dismiss any cookie / promo popup that may intercept pointer events
    await this.dismissOverlays();

    await this.profileAvatar.waitFor({ state: 'visible', timeout: 15000 });
    await this.profileAvatar.click();
    console.log('  → Profile avatar clicked — opening sidebar.');

    // Wait for a known sidebar child to become visible
    await this.dashboard.waitFor({ state: 'visible', timeout: 15000 });
    // Allow the slide-in animation to finish so subsequent waits are stable
    await this.page.waitForTimeout(800);
    console.log('  → Sidebar is open (Dashboard visible).');
  }

  /**
   * Try to dismiss any overlay (cookie banner, promo popup) that may
   * intercept pointer events on the page. Safe to call multiple times.
   */
  async dismissOverlays() {
    const overlaySelectors = [
      '//*[@id="page-top"]/div[4]/div/div/div/a[1]',         // pre-login cookie/promo
      '.cookie-popup__inner button',                          // generic cookie popup btn
      '.cookie-popup__inner a',                               // generic cookie popup link
      'xpath=//div[contains(@class,"cookie-popup")]//a[contains(.,"Accept") or contains(.,"Got it") or contains(.,"OK") or contains(.,"Close")]',
      'xpath=//div[contains(@class,"cookie-popup")]//button',
    ];
    for (const sel of overlaySelectors) {
      const loc = this.page.locator(sel).first();
      if (await loc.isVisible().catch(() => false)) {
        await loc.click().catch(() => {});
        console.log(`  → Dismissed overlay: ${sel}`);
        await this.page.waitForTimeout(500);
      }
    }
  }

  /**
   * Backwards-compatible alias used by older callers / tests.
   */
  async waitUntilVisible() {
    await this.open();
  }

  /**
   * Assert that an element is visible and log its label.
   * @param {import('@playwright/test').Locator} locator
   * @param {string} label
   */
  async expectVisible(locator, label) {
    await expect(locator, `${label} should be visible`).toBeVisible({ timeout: 10000 });
    console.log(`  ✓ "${label}" is visible.`);
  }

  /**
   * Scroll the sidebar so the given element is in view (helps verify lower
   * section items on smaller viewports).
   * @param {import('@playwright/test').Locator} locator
   */
  async scrollIntoView(locator) {
    await locator.scrollIntoViewIfNeeded().catch(() => {});
  }

  // ═════════════════════════════════════════════════════════════════════════
  // Section verifications
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Verify the top section: Menu icon, Dashboard and Neighborhood are visible.
   */
  async verifyTopSection() {
    await this.expectVisible(this.menuIcon,    'Menu icon');
    await this.expectVisible(this.dashboard,   'Dashboard');
    await this.expectVisible(this.neighborhood, 'Neighborhood');
  }

  /**
   * Click "Neighborhood" to expand it, then verify all four sub-items are
   * visible. Returns once the sub-menu has fully rendered.
   */
  async expandNeighborhoodAndVerify() {
    await this.dismissOverlays();
    await this.neighborhood.click();
    console.log('  → "Neighborhood" expanded.');
    // Allow any expansion animation to settle
    await this.page.waitForTimeout(1000);

    await this.expectVisible(this.propertyListings,   'Property Listings');
    await this.expectVisible(this.businessesServices, 'Businesses & Services');
    await this.expectVisible(this.buySellWanted,      'Buy-Sell-Wanted');
    await this.expectVisible(this.findAgents,         'Find Agents');
  }

  /**
   * Scroll to the lower section and verify FAQ is visible.
   */
  async verifyLowerSection() {
    await this.scrollIntoView(this.faq);
    await this.expectVisible(this.faq, 'FAQ');
  }

  /**
   * Click the profile image container to expand the profile sub-menu,
   * then verify all four options are visible.
   */
  async expandProfileSectionAndVerify() {
    await this.dismissOverlays();
    await this.scrollIntoView(this.profileImageContainer);
    // Use force: true as a safety net in case a popup briefly re-appears.
    await this.profileImageContainer.click({ force: true });
    console.log('  → Profile image container clicked — sub-menu should expand.');
    await this.page.waitForTimeout(1000);

    await this.expectVisible(this.myProfile,        'My Profile');
    await this.expectVisible(this.manageRole,       'Manage Role');
    await this.expectVisible(this.addBuySellWanted, 'Add a New Buy-Sell-Wanted');
    await this.expectVisible(this.logout,           'Logout');
  }

  // ═════════════════════════════════════════════════════════════════════════
  // Click flows
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Click a sidebar item, wait for navigation to settle, then return to the
   * starting URL so the next item can be tested. The sidebar is re-opened /
   * re-expanded as needed by the caller.
   *
   * @param {import('@playwright/test').Locator} locator
   * @param {string} label
   * @param {string} startUrl  — URL to return to after clicking (e.g. /home)
   */
  async clickAndReturn(locator, label, startUrl) {
    await this.dismissOverlays();
    await this.scrollIntoView(locator);
    // Wait until the target is actually visible so we don't sit on an
    // invisible element until the test timeout fires.
    await locator.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    await locator.click({ force: true });
    console.log(`  → Clicked "${label}".`);

    // Allow navigation / page load
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
    await this.page.waitForTimeout(2000);
    console.log(`    landed on: ${this.page.url()}`);

    // Return to starting page so the sidebar is in a known state
    await this.page.goto(startUrl, { waitUntil: 'domcontentloaded' });
    // Sidebar is hidden by default after every navigation \u2014 re-open it.
    await this.open();
  }

  /**
   * Click "Manage Role" — final action in the suite. Does NOT navigate back.
   */
  async clickManageRole() {
    await this.dismissOverlays();
    await this.scrollIntoView(this.manageRole);
    await this.manageRole.click({ force: true });
    console.log('  → "Manage Role" clicked.');
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
    await this.page.waitForTimeout(2000);
    console.log(`    landed on: ${this.page.url()}`);
  }
}

module.exports = { SidebarPanelPage };
