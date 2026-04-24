/**
 * DashboardPage
 *
 * Encapsulates verification of role-based widgets on the user's home /
 * dashboard page.
 *
 * Each widget on the dashboard is rendered as a block whose top-level
 * element has a stable `id` (e.g. `#DraftWidgetBlock`). For readability and
 * reporting we still drive the verification by the widget's visible name —
 * an internal map below converts each name to its block ID.
 *
 * The "Add Widget" button (#addWidget) must be visible for both roles.
 */

const { expect } = require('@playwright/test');

// name → DOM block ID. The visible heading inside each block matches the
// key, but the ID is what we actually assert against (faster + stable).
const WIDGET_IDS = {
  'Draft':                 'DraftWidgetBlock',
  'Listed Properties':     'ListedPropertyWidgetBlock',
  'Property Proposals':    'PropertyProposalsWidgetBlock',
  'Listed / Wanted Items': 'SellerListedItemsWidgetBlock',
  'Properties by Owners':  'PropertiesByOwnersWidgetBlock',
  'Enquiries':             'EnquiriesWidgetBlock',
  'My Favorite':           'AllFavouritesWidgetBlock',
};

const ALL_WIDGETS = Object.keys(WIDGET_IDS);

class DashboardPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.addWidgetBtn = page.locator('#addWidget');
  }

  /**
   * Locator for a widget's container block by its visible name.
   * @param {string} name
   * @returns {import('@playwright/test').Locator}
   */
  widgetByName(name) {
    const id = WIDGET_IDS[name];
    if (!id) throw new Error(`Unknown widget name: "${name}"`);
    return this.page.locator(`#${id}`);
  }

  /**
   * Optional sanity check — the visible heading inside the block should
   * match the provided name (case- and whitespace-insensitive).
   * @param {string} name
   */
  async verifyWidgetHeading(name) {
    const block = this.widgetByName(name);
    const text  = (await block.innerText().catch(() => '')) || '';
    const norm  = (s) => s.replace(/\s+/g, ' ').trim().toLowerCase();
    if (!norm(text).includes(norm(name))) {
      console.log(`  ⚠ Heading text for "${name}" not found in widget block (got: "${text.slice(0, 60)}…").`);
    }
  }

  /**
   * Assert the "Add Widget" button is visible.
   */
  async expectAddWidgetVisible() {
    await expect(this.addWidgetBtn, '"Add Widget" button should be visible')
      .toBeVisible({ timeout: 15000 });
    console.log('  ✓ "Add Widget" button is visible.');
  }

  /**
   * Wait until the dashboard has finished rendering at least one widget
   * block, so subsequent visibility assertions are deterministic.
   */
  async waitForReady() {
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
    // Wait for any known widget block to attach to the DOM.
    const anyWidget = this.page.locator(
      Object.values(WIDGET_IDS).map((id) => `#${id}`).join(', ')
    ).first();
    await anyWidget.waitFor({ state: 'attached', timeout: 20000 }).catch(() => {});
    // Allow remaining widgets to render
    await this.page.waitForTimeout(1500);
  }

  /**
   * Assert that exactly the given list of widgets is visible on the
   * dashboard, and every other widget in {@link ALL_WIDGETS} is hidden.
   *
   * @param {string[]} expectedNames widget names that MUST be visible
   */
  async expectOnlyWidgets(expectedNames) {
    await this.waitForReady();

    // Positive assertions
    for (const name of expectedNames) {
      const w = this.widgetByName(name);
      await expect(w, `Widget "${name}" should be visible`).toBeVisible({ timeout: 15000 });
      await this.verifyWidgetHeading(name);
      console.log(`  ✓ Widget visible: "${name}"`);
    }

    // Negative assertions — every other known widget must be absent / hidden
    const forbidden = ALL_WIDGETS.filter((n) => !expectedNames.includes(n));
    for (const name of forbidden) {
      const w = this.widgetByName(name);
      const visible = await w.isVisible().catch(() => false);
      expect(visible, `Widget "${name}" should NOT be visible`).toBe(false);
      console.log(`  ✓ Widget hidden:  "${name}"`);
    }
  }
}

module.exports = { DashboardPage, ALL_WIDGETS, WIDGET_IDS };
