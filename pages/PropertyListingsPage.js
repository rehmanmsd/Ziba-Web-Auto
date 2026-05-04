/**
 * PropertyListingsPage
 *
 * Encapsulates interactions and verifications for the public Property
 * Listings page (Neighborhood → Property Listings).
 *
 * The page renders each listing as a card whose container <li>/<div> has
 * an id of the form `vacancy_{ID}` (e.g. `#vacancy_65703`). All card-level
 * locators are derived from that id, so we don't need to hard-code IDs.
 */

const { expect } = require('@playwright/test');

class PropertyListingsPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // Root list container
    this.listRoot       = page.locator('#vacancyList');
    // Each listing card — `vacancy_<numeric-id>`
    this.listingCards   = page.locator('[id^="vacancy_"]');
    // First listing's anchor (used for "user lands on listings" check)
    this.firstListing   = page.locator('xpath=//*[@id="vacancyList"]/div[1]/div/div/a[1]/div');

    // Pagination & records text live inside the "grid" wrapper
    this.pagination     = page.locator('xpath=//*[@id="grid"]/div[1]/div[6]/div/ul');
    this.recordsText    = page.locator('xpath=//*[@id="grid"]/div[1]/div[6]/p');

    // Right-side Area Expert panel
    // Title and agent cards are rendered inside #areaExportListVue.
    this.areaExpertRoot   = page.locator('xpath=//*[@id="areaExportListVue"]/div/div/div[1]/h5');
    this.areaExpertItems  = page.locator('#areaExportListVue .px-1.py-2 > .br-1 > .p-1');

    // Internal links section at the bottom
    this.internalLinksTitle = page.locator('xpath=//*[@id="vacancyList"]/section/div[1]');
    this.internalLinksList  = page.locator('xpath=//*[@id="vacancyList"]/section/div[2]');
  }

  // ─── Generic helpers ──────────────────────────────────────────────────

  async dismissOverlays() {
    const sels = [
      '//*[@id="page-top"]/div[4]/div/div/div/a[1]',
      '.cookie-popup__inner button',
      '.cookie-popup__inner a',
    ];
    for (const sel of sels) {
      const loc = this.page.locator(sel).first();
      if (await loc.isVisible().catch(() => false)) {
        await loc.click().catch(() => {});
        await this.page.waitForTimeout(300);
      }
    }
  }

  /**
   * Wait until the listings grid has rendered at least one card.
   */
  async waitForListings() {
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
    await this.listingCards.first().waitFor({ state: 'visible', timeout: 30000 });
    await this.page.waitForTimeout(800);
  }

  /**
   * Wait until the Area Expert section is rendered on the right side.
   * The section contains an h5 title, so we wait for that.
   */
  async waitForAreaExpert() {
    const title = this.page.locator('xpath=//*[@id="areaExportListVue"]/div/div/div[1]/h5');
    await title.waitFor({ state: 'attached', timeout: 30000 });
    await this.page.waitForTimeout(500);
  }

  /**
   * Slowly scroll to the bottom of the page so lazy-loaded images / cards
   * have a chance to render, then scroll back up.
   */
  async scrollToBottomAndBack() {
    const steps = 8;
    for (let i = 1; i <= steps; i++) {
      await this.page.evaluate((p) => {
        window.scrollTo(0, document.body.scrollHeight * p);
      }, i / steps);
      await this.page.waitForTimeout(400);
    }
    await this.page.evaluate(() => window.scrollTo(0, 0));
    await this.page.waitForTimeout(500);
  }

  // ─── Card-level locators (scoped to a vacancy id) ─────────────────────

  cardById(id) { return this.page.locator(`#${id}`); }

  cardPrice(id)    { return this.page.locator(`#${id} .rate`).first(); }
  cardTitle(id)    { return this.page.locator(`#${id} h2`).first(); }
  cardImage(id)    { return this.page.locator(`#${id} img`).first(); }
  cardAgentInfo(id){ return this.page.locator(`xpath=//*[@id="${id}"]/div/div[3]`); }
  cardFavorite(id) { return this.page.locator(`#${id} .share-links, #${id} .icon-heart`).first(); }
  cardCall(id)     { return this.page.locator(`xpath=//*[@id="${id}"]/div/div[3]/div/div[1]/div`); }
  cardWhatsApp(id) { return this.page.locator(`#${id} a[href*="wa.me"], #${id} a[href*="whatsapp"], #${id} .icon-whatsapp, #${id} [class*="whatsapp"]`).first(); }
  cardEnquiry(id)  { return this.page.locator(`#${id} .icon-email, #${id} [aria-label*="Enquir" i], #${id} [data-target*="inquiry" i]`).first(); }

  /**
   * Return all rendered card ids (e.g. ["vacancy_65703", ...]).
   */
  async getCardIds() {
    return this.listingCards.evaluateAll((els) => els.map((e) => e.id));
  }

  /**
   * Click a card's title to navigate to its detail page.
   * @param {string} id e.g. "vacancy_65703"
   */
  async openCard(id) {
    const titleAnchor = this.page.locator(`xpath=//*[@id="${id}"]/div/div[2]/a`).first();
    await titleAnchor.scrollIntoViewIfNeeded().catch(() => {});
    await titleAnchor.click();
  }

  // ─── Verifications ────────────────────────────────────────────────────

  /**
   * Assert price/title/image/agent info + the four action controls are
   * visible for the given card.
   * @param {string} id
   */
  async verifyCardContent(id) {
    await expect(this.cardPrice(id),    `Card ${id}: price`).toBeVisible({ timeout: 10000 });
    await expect(this.cardTitle(id),    `Card ${id}: title`).toBeVisible();
    await expect(this.cardImage(id),    `Card ${id}: image`).toBeVisible();
    await expect(this.cardAgentInfo(id),`Card ${id}: agent info`).toBeVisible();

    await expect(this.cardFavorite(id), `Card ${id}: favorite`).toBeVisible();
    await expect(this.cardCall(id),     `Card ${id}: call`).toBeVisible();
    await expect(this.cardWhatsApp(id), `Card ${id}: whatsapp`).toBeVisible();
    await expect(this.cardEnquiry(id),  `Card ${id}: enquiry`).toBeVisible();
  }

  /**
   * Read each Area Expert row's "listings count" indicator and return
   * them in render order.
   */
  async getAreaExpertListingCounts() {
    const items = await this.areaExpertItems.count();
    const counts = [];
    for (let i = 0; i < items; i++) {
      const txt = (await this.areaExpertItems.nth(i).innerText().catch(() => '')) || '';
      const match = txt.match(/(\d+)\s*Listings/i);
      const num = match ? parseInt(match[1], 10) : NaN;
      counts.push(Number.isFinite(num) ? num : 0);
    }
    return counts;
  }
}

module.exports = { PropertyListingsPage };
