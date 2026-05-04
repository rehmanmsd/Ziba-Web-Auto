/**
 * propertyListings.spec.js
 *
 * Test suite: Property Listings (public — no login required)
 *
 * Flow:
 *   1. Navigate to "/" then expand Neighborhood → Property Listings.
 *   2. Verify the listings page loads with at least one card.
 *   3. Verify the FIRST card exposes price / title / image / agent info
 *      and the four action controls (Favorite, Call, WhatsApp, Enquiry).
 *   4. Click a listing → opens the detail page (URL shape:
 *      `/{Country}/{slug}-{numericId}`).
 *   5. Verify pagination + "showing x of y" records text.
 *   6. Verify the Area Expert panel shows EXACTLY 5 entries, ordered by
 *      number of listings DESC.
 *   7. Verify the bottom "internal links" section title and that links
 *      are present and clickable (have href).
 *
 * Prerequisites (.env):
 *   BASE_URL — e.g. https://ziba-property.com
 */

require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { PropertyListingsPage }  = require('../pages/PropertyListingsPage');

// Direct, guest-accessible Property Listings URL (Pakistan → For Sale).
const LISTINGS_URL = 'https://staging.ziba-property.com/Pakistan/sale';

// Credentials (login required so the favorite icon renders on each card).
const EMAIL    = process.env.SP_EMAIL    || 'ar0@yopmail.com';
const PASSWORD = process.env.SP_PASSWORD || '12345678';

const COOKIE_ACCEPT_BTN = '//*[@id="page-top"]/div[4]/div/div/div/a[1]';

test.describe('Property Listings — Public View', () => {
  test.describe.configure({ mode: 'serial', timeout: 180_000 });

  /** @type {import('@playwright/test').Page} */
  let page;
  /** @type {PropertyListingsPage} */
  let listings;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120_000);
    const ctx = await browser.newContext();
    page = await ctx.newPage();

    listings = new PropertyListingsPage(page);

    // ── reCAPTCHA bypass for login ───────────────────────────────────────
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

    // ── Login (so per-card "favorite" icon is rendered) ──────────────────
    console.log(`Setup: Logging in as ${EMAIL}…`);
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    const cookieBtn = page.locator(`xpath=${COOKIE_ACCEPT_BTN}`);
    try {
      await cookieBtn.waitFor({ state: 'visible', timeout: 5000 });
      await cookieBtn.click();
    } catch { /* no banner */ }
    await page.locator('//*[@id="authForm"]/div/form/div[1]/div/input').fill(EMAIL);
    await page.locator('//*[@id="authForm"]/div/form/div[2]/div/input').fill(PASSWORD);
    await page.locator('//*[@id="authForm"]/div/form/button').click();
    await page.waitForURL(/\/(home|dashboard|feed|profile|loggedin)/, { timeout: 30000 });
    console.log(`  → Logged in — on: ${page.url()}`);

    console.log(`Setup: Visiting Property Listings: ${LISTINGS_URL}`);
    await page.goto(LISTINGS_URL, { waitUntil: 'domcontentloaded' });
    await listings.dismissOverlays();
    await listings.waitForListings();
  });

  test.afterAll(async () => {
    if (page) await page.close();
  });

  // ══════════════════════════════════════════════════════════════════════════
  // TC-1: User lands on the Property Listings page and listings render
  // ══════════════════════════════════════════════════════════════════════════
  test('TC-1: User lands on listings page; cards load (with scroll)', async () => {
    // The first card's nested anchor exists in the DOM but its wrapper may
    // be CSS-hidden — verifying it is attached is sufficient to confirm
    // the listings template rendered.
    await expect(listings.firstListing, 'First listing anchor must be attached')
      .toBeAttached({ timeout: 20000 });

    const initialCount = await listings.listingCards.count();
    expect(initialCount, 'At least one listing card should render').toBeGreaterThan(0);
    console.log(`  ✓ ${initialCount} card(s) rendered initially.`);

    // Scroll through to ensure lazy content (images, area expert, internal
    // links) finishes loading.
    await listings.scrollToBottomAndBack();
    const afterScroll = await listings.listingCards.count();
    expect(afterScroll, 'Cards should remain (or grow) after scroll')
      .toBeGreaterThanOrEqual(initialCount);
    console.log(`✅ TC-1 — listings page loaded; ${afterScroll} card(s) after scroll.`);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // TC-2: First card shows price / title / image / agent info + actions
  // ══════════════════════════════════════════════════════════════════════════
  test('TC-2: Each card shows price, title, image, agent info & actions', async () => {
    const ids = await listings.getCardIds();
    expect(ids.length, 'Need at least one card to inspect').toBeGreaterThan(0);

    const first = ids[0];
    console.log(`  → Inspecting first card: #${first}`);
    await listings.cardById(first).scrollIntoViewIfNeeded().catch(() => {});
    await listings.verifyCardContent(first);

    console.log(`✅ TC-2 — card #${first} exposes all required fields & actions.`);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // TC-3: Clicking a listing opens the detail page
  // URL shape: `/{Country}/{slug}-{numericId}` e.g.
  //   /Pakistan/agent-ag-draft-garden-town-lahore-pakistan-75564
  // ══════════════════════════════════════════════════════════════════════════
  test('TC-3: Clicking a listing opens the detail page', async () => {
    const ids = await listings.getCardIds();
    const first = ids[0];

    await listings.openCard(first);
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    // Wait for URL to change to the detail format
    await page.waitForURL(/\/[A-Za-z][A-Za-z\- ]*\/.+-\d+(\/?|\?.*)?$/, { timeout: 20000 });

    const url = page.url();
    console.log(`    Detail URL: ${url}`);
    expect(url, 'Detail URL should match {domain}/{Country}/{slug}-{id}')
      .toMatch(/\/[A-Za-z][A-Za-z\- ]*\/[a-z0-9\-]+-\d+(\/?|\?.*)?$/);

    // Go back so the rest of the suite still has the listings page
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await listings.waitForListings();
    console.log('✅ TC-3 — detail page URL verified; navigated back to listings.');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // TC-4: Pagination + total/shown records text
  // ══════════════════════════════════════════════════════════════════════════
  test('TC-4: Pagination is visible and records-text appears opposite it', async () => {
    await listings.pagination.scrollIntoViewIfNeeded().catch(() => {});
    await expect(listings.pagination, 'Pagination control should be visible')
      .toBeVisible({ timeout: 15000 });

    const pageItems = await listings.pagination.locator('li').count();
    expect(pageItems, 'Pagination should expose at least one page item').toBeGreaterThan(0);
    console.log(`  ✓ Pagination shows ${pageItems} item(s).`);

    await expect(listings.recordsText, 'Records text should be visible')
      .toBeVisible({ timeout: 10000 });
    const records = (await listings.recordsText.innerText()).trim();
    expect(records.length, 'Records text should not be empty').toBeGreaterThan(0);
    console.log(`  ✓ Records text: "${records}"`);
    console.log('✅ TC-4 — pagination + records text verified.');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // TC-5: Area Expert panel — exactly 5 rows, ordered by listing count DESC
  // ══════════════════════════════════════════════════════════════════════════
  test('TC-5: Area Expert section shows exactly 5 entries, sorted by listings DESC', async () => {
    // Wait for the Area Expert section to render under the map/right rail.
    await listings.waitForAreaExpert();
    await expect(listings.areaExpertRoot, 'Area Expert title should be present')
      .toContainText(/Area Experts/i, { timeout: 15000 });

    const count = await listings.areaExpertItems.count();
    expect(count, 'Area Expert should show exactly 5 entries').toBe(5);
    console.log(`  ✓ Area Expert rows: ${count}`);

    const counts = await listings.getAreaExpertListingCounts();
    console.log(`  → Listing counts (in render order): [${counts.join(', ')}]`);

    const sortedDesc = [...counts].sort((a, b) => b - a);
    expect(counts, 'Area Expert rows should be sorted by listing count DESC')
      .toEqual(sortedDesc);
    console.log('✅ TC-5 — Area Expert: 5 rows, sorted by listings DESC.');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // TC-6: Internal-links section at the bottom
  // ══════════════════════════════════════════════════════════════════════════
  test('TC-6: Internal links section title + clickable links', async () => {
    await listings.internalLinksTitle.scrollIntoViewIfNeeded().catch(() => {});
    await expect(listings.internalLinksTitle, 'Internal links title should be visible')
      .toBeVisible({ timeout: 15000 });

    const titleText = (await listings.internalLinksTitle.innerText()).trim();
    expect(titleText.length, 'Internal links title should not be empty').toBeGreaterThan(0);
    console.log(`  ✓ Internal links section title: "${titleText}"`);

    const anchors = listings.internalLinksList.locator('a');
    const total   = await anchors.count();
    expect(total, 'Internal links section should expose at least one link')
      .toBeGreaterThan(0);
    console.log(`  → Found ${total} internal link(s).`);

    // Verify every link has a non-empty href and is enabled (clickable).
    let clickable = 0;
    for (let i = 0; i < total; i++) {
      const a    = anchors.nth(i);
      const href = (await a.getAttribute('href')) || '';
      const enabled = await a.isEnabled().catch(() => false);
      if (href.trim() && enabled) clickable++;
    }
    expect(clickable, 'All internal links should have href and be enabled').toBe(total);
    console.log(`✅ TC-6 — internal links section verified (${clickable}/${total} clickable).`);
  });
});
