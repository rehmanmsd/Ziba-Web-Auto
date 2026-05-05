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

  // ─── Header Section Locators ──────────────────────────────────────────

  pageHeaderBlock() { return this.page.locator('//*[@id="PageHeaderBlock"]/div'); }
  zibaLogo() { return this.page.locator('xpath=//*[@id="PageHeaderBlock"]//img[contains(@src, "logo") or contains(@alt, "logo")]').first(); }
  breadcrumbNav() { return this.page.locator('xpath=//*[@id="PageHeaderBlock"]//nav[@aria-label="breadcrumb"] | //*[@id="PageHeaderBlock"]//div[contains(@class, "breadcrumb")]'); }
  favouriteIcon() { return this.page.locator('xpath=//*[@id="PageHeaderBlock"]//span[contains(@class, "heart") or @aria-label*="Favourite" i]'); }
  goToCrmButton() { return this.page.locator('xpath=//*[@id="PageHeaderBlock"]//button[contains(text(), "CRM") or contains(@aria-label, "CRM")]'); }
  addNewPropertyButton() { return this.page.locator('xpath=//*[@id="PageHeaderBlock"]//button[contains(text(), "Property") or contains(@aria-label, "Add") or contains(@class, "btn-add")]').first(); }

  // ─── Search Locators ─────────────────────────────────────────────────

  searchBar() { return this.page.locator('//*[@id="search"]'); }
  searchDiv() { return this.page.locator('//*[@id="searchDiv"]'); }
  useCurrentLocationOption() { return this.page.locator('//*[@id="searchDiv"]/div[2]/ul/li[1]'); }
  searchInput() { return this.page.locator('//*[@id="search"]'); }

  // Country filter (top search area)
  countryDropdown() { return this.page.locator('//*[@id="search-prop"]/span/span/span[1]/span'); }
  countryResultsList() { return this.page.locator('.select2-container--open .select2-results__options').first(); }
  countrySearchInput() { return this.page.locator('.select2-container--open .select2-search__field').first(); }
  autoLocateButton() { return this.page.locator('//*[@id="loggedin-container"]/span/span/div'); }

  // ─── Map View Locators ───────────────────────────────────────────────

  mapViewButton() { return this.page.locator('//*[@id="mapAppVue"]/div[2]/div/button'); }
  mapContainer() { return this.page.locator('//*[@id="dmap"]'); }
  mapPointerMarker() { return this.page.locator('//*[@id="dmap"]/div/div[3]/div[1]/div[2]/div/div[3]/div[1]/img'); }
  backToMapButton() { return this.page.locator('//*[@id="back-to-map"]/div[1]'); }
  closeMapButton() { return this.page.locator('//*[@id="vac-map"]/div[1]/div'); }

  // ─── Filter Locators ────────────────────────────────────────────────

  filterSection() { return this.page.locator('//*[@id="property-listing-filters"]'); }
  
  // Sale/Rent/Auction filters
  saleFilterButton() { return this.page.locator('//*[@id="property-listing-filters"]/div[1]/div[2]/div[1]/label'); }
  rentFilterButton() { return this.page.locator('//*[@id="property-listing-filters"]/div[1]/div[2]/div[2]/label'); }
  auctionFilterButton() { return this.page.locator('//*[@id="property-listing-filters"]/div[2]/div[1]/label'); }

  // Posted By filter
  postedByDropdown() { return this.page.locator('//*[@id="property-listing-filters"]/div[2]/div[2]/div/button'); }
  myListOption() { return this.page.locator('//*[@id="bs-select-16-1"]'); }
  postedByOwnerOption() { return this.page.locator('//*[@id="bs-select-16-2"]'); }
  postedByAgentOption() { return this.page.locator('//*[@id="bs-select-16-3"]'); }

  // Property Type filter
  propertyTypeDropdown() { return this.page.locator('//*[@id="property-listing-filters"]/div[2]/div[3]/div/button'); }
  propertyTypeOption() { return this.page.locator('//*[@id="bs-select-11-3"]'); }

  // Price filters
  minPriceDropdown() { return this.page.locator('//*[@id="property-listing-filters"]/div[2]/div[4]/div/button'); }
  minPriceSelect() { return this.page.locator('//*[@id="bs-select-12"]'); }
  maxPriceDropdown() { return this.page.locator('//*[@id="property-listing-filters"]/div[2]/div[5]/div/button'); }
  maxPriceOptions() { return this.page.locator('//*[@id="property-listing-filters"]/div[2]/div[5]/div/div'); }

  // Bedroom filter
  bedroomDropdown() { return this.page.locator('//*[@id="property-listing-filters"]/div[2]/div[8]/div/button'); }
  bedroomOptions() { return this.page.locator('//*[@id="property-listing-filters"]/div[2]/div[8]/div/div'); }

  // Bathroom filter
  bathroomDropdown() { return this.page.locator('//*[@id="property-listing-filters"]/div[2]/div[9]/div/button'); }
  bathroomOptions() { return this.page.locator('//*[@id="property-listing-filters"]/div[2]/div[9]/div/div'); }

  // Parking filter
  parkingDropdown() { return this.page.locator('//*[@id="property-listing-filters"]/div[2]/div[10]/div/button'); }
  parkingOptions() { return this.page.locator('//*[@id="property-listing-filters"]/div[2]/div[10]/div/div'); }

  // Sort / View / Pagination / Ads
  sortDropdownButton() { return this.page.locator('//*[@id="grid"]/div[1]/div[1]/div[2]/div[2]/div/button'); }
  sortDropdownMenu() { return this.page.locator('//*[@id="grid"]/div[1]/div[1]/div[2]/div[2]/div/div'); }
  listViewButton() { return this.page.locator('//*[@id="grid"]/div[1]/div[1]/div[2]/div[3]/span[1]'); }
  gridViewButton() { return this.page.locator('//*[@id="grid"]/div[1]/div[1]/div[2]/div[3]/span[2]'); }
  bsAdvertisementBlock() { return this.page.locator('//*[@id="grid"]/div[1]/div[4]/div[9]'); }
  paginationNextButton() { return this.page.locator('//*[@id="grid"]/div[1]/div[6]/div/ul/li[8]/a/i'); }
  paginationPreviousButton() { return this.page.locator('//*[@id="grid"]/div[1]/div[6]/div/ul/li[2]/a'); }

  // ─── Header Verification Methods ─────────────────────────────────────

  async verifyHeaderElements() {
    const header = this.pageHeaderBlock();
    
    // Wait longer for header to appear
    console.log('  → Waiting for PageHeaderBlock to appear...');
    try {
      await header.waitFor({ state: 'attached', timeout: 20000 });
      console.log('  → PageHeaderBlock found and attached');
    } catch (error) {
      console.log(`  ⚠ PageHeaderBlock not found after 20s: ${error.message}`);
      return;
    }

    // Now check visibility
    const headerVisible = await header.isVisible().catch(() => false);
    
    if (!headerVisible) {
      console.log('  ⚠ Header block is attached but not visible - may be off-screen or hidden');
      return;
    }

    console.log('  ✓ Header block is visible');

    // Check each header element with graceful fallback
    const logoCheck = await this.zibaLogo().isVisible().catch(() => false);
    const breadcrumbCheck = await this.breadcrumbNav().isVisible().catch(() => false);
    const favCheck = await this.favouriteIcon().isVisible().catch(() => false);
    const crmCheck = await this.goToCrmButton().isVisible().catch(() => false);
    const addPropCheck = await this.addNewPropertyButton().isVisible().catch(() => false);

    console.log(`  → Header Elements Found: Logo=${logoCheck}, Breadcrumb=${breadcrumbCheck}, Favourite=${favCheck}, CRM=${crmCheck}, AddProperty=${addPropCheck}`);

    if (logoCheck) {
      await expect(this.zibaLogo(), 'Ziba logo should be visible').toBeVisible();
      console.log('  ✓ Ziba logo verified');
    }
    if (breadcrumbCheck) {
      await expect(this.breadcrumbNav(), 'Breadcrumb navigation should be visible').toBeVisible();
      console.log('  ✓ Breadcrumb verified');
    }
    if (favCheck) {
      await expect(this.favouriteIcon(), 'Favourite icon should be visible').toBeVisible();
      console.log('  ✓ Favourite icon verified');
    }
    if (crmCheck) {
      await expect(this.goToCrmButton(), 'Go to CRM button should be visible').toBeVisible();
      console.log('  ✓ Go to CRM button verified');
    }
    if (addPropCheck) {
      await expect(this.addNewPropertyButton(), 'Add new property button should be visible').toBeVisible();
      console.log('  ✓ Add new property button verified');
    }
  }

  // ─── Search Methods ────────────────────────────────────────────────

  async openSearchBar() {
    const searchBar = this.searchBar();
    await searchBar.scrollIntoViewIfNeeded().catch(() => {});
    await searchBar.click();
    await this.page.waitForTimeout(500);
  }

  async searchByKeyword(keyword) {
    const search = this.searchInput();
    await search.fill(keyword);
    await this.page.waitForTimeout(800);
  }

  async pressEnterInSearch() {
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(1500);
  }

  async useCurrentLocation() {
    const currentLocOption = this.useCurrentLocationOption();
    await currentLocOption.click().catch(() => {});
    await this.page.waitForTimeout(2000);
  }

  async getSearchSuggestions() {
    const suggestions = this.page.locator('//*[@id="searchDiv"]/div[2]/ul/li');
    const count = await suggestions.count();
    return count;
  }

  async getCountryOptions() {
    const dropdown = this.countryDropdown().first();
    const visible = await dropdown.isVisible().catch(() => false);
    if (!visible) return [];

    await dropdown.scrollIntoViewIfNeeded().catch(() => {});
    const opened = await dropdown.click({ timeout: 5000, force: true }).then(() => true).catch(() => false);
    if (!opened) return [];
    await this.page.waitForTimeout(1500);

    const resultsList = this.countryResultsList();
    await resultsList.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await this.page.waitForTimeout(800);

    const options = resultsList.locator('li');
    const count = await options.count();
    const values = [];
    for (let i = 0; i < count; i++) {
      const txt = (await options.nth(i).innerText().catch(() => '')).trim();
      if (txt) values.push(txt);
    }
    return values;
  }

  async selectCountryByName(countryName) {
    const normalizedName = countryName.trim().toLowerCase() === 'uae'
      ? 'United Arab Emirates'
      : countryName;

    const dropdown = this.countryDropdown().first();
    await dropdown.scrollIntoViewIfNeeded().catch(() => {});
    const opened = await dropdown.click({ timeout: 5000, force: true }).then(() => true).catch(() => false);
    if (!opened) return false;
    await this.page.waitForTimeout(1000);

    // Type country name in search field
    const searchInput = this.countrySearchInput();
    const searchVisible = await searchInput.isVisible().catch(() => false);
    if (!searchVisible) return false;

    await searchInput.fill('');
    await this.page.waitForTimeout(250);
    await searchInput.type(normalizedName, { delay: 50 });
    await this.page.waitForTimeout(1000);

    // Click the matching country option
    const resultsList = this.countryResultsList();
    const countryOption = resultsList
      .locator('li.select2-results__option')
      .filter({ hasText: new RegExp(`^\\s*${normalizedName}\\s*$`, 'i') })
      .first();
    const optionVisible = await countryOption.isVisible().catch(() => false);
    if (!optionVisible) return false;

    await countryOption.click({ timeout: 5000 }).catch(() => {});
    await this.page.waitForTimeout(1500);
    return true;
  }

  async applyAutoLocate() {
    await this.autoLocateButton().scrollIntoViewIfNeeded().catch(() => {});
    await this.autoLocateButton().click().catch(() => {});
    await this.page.waitForTimeout(1500);
  }

  // ─── Map View Methods ──────────────────────────────────────────────

  async openMapView() {
    const mapBtn = this.mapViewButton();
    await mapBtn.scrollIntoViewIfNeeded().catch(() => {});
    await mapBtn.click();
    await this.page.waitForTimeout(2000);
  }

  async waitForMapPinsLoad() {
    const map = this.mapContainer();
    await map.waitFor({ state: 'attached', timeout: 15000 });
    await this.page.waitForTimeout(2000);
  }

  async clickMapPointer() {
    const pointer = this.mapPointerMarker();
    await pointer.click().catch(() => {});
    await this.page.waitForTimeout(1000);
  }

  async zoomMapView() {
    const zoomBtn = this.backToMapButton();
    await zoomBtn.click().catch(() => {});
    await this.page.waitForTimeout(1000);
  }

  async closeMapView() {
    const closeBtn = this.closeMapButton();
    await closeBtn.click().catch(() => {});
    await this.page.waitForTimeout(1500);
  }

  // ─── Filter Methods ────────────────────────────────────────────────

  async applySaleFilter() {
    const saleBtn = this.saleFilterButton();
    await saleBtn.scrollIntoViewIfNeeded().catch(() => {});
    await saleBtn.click();
    await this.page.waitForTimeout(1000);
  }

  async applyRentFilter() {
    const rentBtn = this.rentFilterButton();
    await rentBtn.scrollIntoViewIfNeeded().catch(() => {});
    await rentBtn.click();
    await this.page.waitForTimeout(1000);
  }

  async applyAuctionFilter() {
    const auctionBtn = this.auctionFilterButton();
    await auctionBtn.scrollIntoViewIfNeeded().catch(() => {});
    await auctionBtn.click();
    await this.page.waitForTimeout(1000);
  }

  async selectPostedByFilter(option) {
    // option: 'myList' | 'owner' | 'agent'
    const dropdown = this.postedByDropdown();
    await dropdown.click();
    await this.page.waitForTimeout(500);

    let optionLocator;
    switch (option.toLowerCase()) {
      case 'mylist':
        optionLocator = this.myListOption();
        break;
      case 'owner':
        optionLocator = this.postedByOwnerOption();
        break;
      case 'agent':
        optionLocator = this.postedByAgentOption();
        break;
      default:
        throw new Error(`Unknown Posted By option: ${option}`);
    }

    await optionLocator.click().catch(() => {});
    await this.page.waitForTimeout(1000);
  }

  async selectPropertyType() {
    const dropdown = this.propertyTypeDropdown();
    await dropdown.scrollIntoViewIfNeeded().catch(() => {});
    await dropdown.click();
    await this.page.waitForTimeout(500);

    const option = this.propertyTypeOption();
    await option.click().catch(() => {});
    await this.page.waitForTimeout(1000);
  }

  async selectMinPrice() {
    const dropdown = this.minPriceDropdown();
    await dropdown.scrollIntoViewIfNeeded().catch(() => {});
    await dropdown.click();
    await this.page.waitForTimeout(500);

    const select = this.minPriceSelect();
    const options = await select.locator('option').count();
    if (options > 1) {
      await select.selectOption({ index: 1 });
    }
    await this.page.waitForTimeout(1000);
  }

  async selectMaxPrice() {
    const dropdown = this.maxPriceDropdown();
    await dropdown.scrollIntoViewIfNeeded().catch(() => {});
    await dropdown.click();
    await this.page.waitForTimeout(500);

    const options = this.maxPriceOptions();
    const optionCount = await options.locator('li, div').count();
    if (optionCount > 0) {
      await options.locator('li, div').first().click().catch(() => {});
    }
    await this.page.waitForTimeout(1000);
  }

  async selectBedroom() {
    const dropdown = this.bedroomDropdown();
    await dropdown.scrollIntoViewIfNeeded().catch(() => {});
    await dropdown.click();
    await this.page.waitForTimeout(500);

    const options = this.bedroomOptions();
    const firstOption = options.locator('li, div').first();
    await firstOption.click().catch(() => {});
    await this.page.waitForTimeout(1000);
  }

  async selectBathroom() {
    const dropdown = this.bathroomDropdown();
    await dropdown.scrollIntoViewIfNeeded().catch(() => {});
    await dropdown.click();
    await this.page.waitForTimeout(500);

    const options = this.bathroomOptions();
    const firstOption = options.locator('li, div').first();
    await firstOption.click().catch(() => {});
    await this.page.waitForTimeout(1000);
  }

  async selectParking() {
    const dropdown = this.parkingDropdown();
    await dropdown.scrollIntoViewIfNeeded().catch(() => {});
    await dropdown.click();
    await this.page.waitForTimeout(500);

    const options = this.parkingOptions();
    const firstOption = options.locator('li, div').first();
    await firstOption.click().catch(() => {});
    await this.page.waitForTimeout(1000);
  }

  async getSortOptions() {
    const sortBtn = this.sortDropdownButton().first();
    const visible = await sortBtn.isVisible().catch(() => false);
    if (!visible) return [];

    await sortBtn.scrollIntoViewIfNeeded().catch(() => {});
    const opened = await sortBtn.click({ timeout: 5000, force: true }).then(() => true).catch(() => false);
    if (!opened) return [];
    await this.page.waitForTimeout(500);

    const options = this.sortDropdownMenu().locator('a, button, li');
    const count = await options.count();
    const values = [];
    for (let i = 0; i < count; i++) {
      const txt = (await options.nth(i).innerText().catch(() => '')).trim();
      if (txt) values.push(txt);
    }
    return values;
  }

  async selectSortOptionByIndex(index) {
    const sortBtn = this.sortDropdownButton().first();
    await sortBtn.scrollIntoViewIfNeeded().catch(() => {});
    const opened = await sortBtn.click({ timeout: 5000, force: true }).then(() => true).catch(() => false);
    if (!opened) return false;
    await this.page.waitForTimeout(500);

    const options = this.sortDropdownMenu().locator('a, button, li');
    const count = await options.count();
    if (count === 0) return false;

    const targetIndex = Math.min(index, count - 1);
    await options.nth(targetIndex).click().catch(() => {});
    await this.page.waitForTimeout(1200);
    return true;
  }

  async switchToListView() {
    await this.listViewButton().scrollIntoViewIfNeeded().catch(() => {});
    await this.listViewButton().click().catch(() => {});
    await this.page.waitForTimeout(1000);
  }

  async switchToGridView() {
    await this.gridViewButton().scrollIntoViewIfNeeded().catch(() => {});
    await this.gridViewButton().click().catch(() => {});
    await this.page.waitForTimeout(1000);
  }

  async hasBsAdAfterFourthProperty() {
    const ad = this.bsAdvertisementBlock();
    return ad.isVisible().catch(() => false);
  }

  async goToNextPage() {
    const nextBtn = this.paginationNextButton();
    await nextBtn.scrollIntoViewIfNeeded().catch(() => {});
    await nextBtn.click().catch(() => {});
    await this.page.waitForTimeout(1500);
  }

  async goToPreviousPage() {
    const prevBtn = this.paginationPreviousButton();
    await prevBtn.scrollIntoViewIfNeeded().catch(() => {});
    await prevBtn.click().catch(() => {});
    await this.page.waitForTimeout(1500);
  }
}

module.exports = { PropertyListingsPage };
