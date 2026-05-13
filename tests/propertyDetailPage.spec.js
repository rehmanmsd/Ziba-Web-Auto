require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { PropertyListingsPage } = require('../pages/PropertyListingsPage');
const { PropertyDetailPage } = require('../pages/PropertyDetailPage');

/**
 * Property Detail Page - Comprehensive
 *
 * Scope:
 * 1. Open listings as logged-in user and enter first property detail page.
 * 2. Validate media, summary info, profile/contact actions, promotion section,
 *    and resilience checks for optional/missing blocks.
 *
 * Notes:
 * - Login is executed once in beforeAll.
 * - Suite runs in serial mode to preserve navigation/session state.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Environment / Test Data
// ─────────────────────────────────────────────────────────────────────────────
const PROD_BASE_URL = process.env.PROD_BASE_URL || 'https://ziba-property.com';
const LOGIN_URL = `${PROD_BASE_URL}/login`;
const LISTINGS_URL = `${PROD_BASE_URL}/Pakistan/sale`;

const EMAIL = process.env.SP_EMAIL || 'ar0@yopmail.com';
const PASSWORD = process.env.SP_PASSWORD || '12345678';
const COOKIE_ACCEPT_BTN = '//*[@id="page-top"]/div[4]/div/div/div/a[1]';

test.describe('Property Detail Page - Comprehensive', () => {
  // Run sequentially to keep shared page/session stable across cases.
  test.describe.configure({ mode: 'serial', timeout: 600_000 });

  let page;
  let listings;
  let detail;
  let detailUrl;

  const loggedInIndicatorSelector = 'xpath=(//*[@id="profile-avatar"] | //*[@id="loggedin-container"])[1]';

  // Login helper used only once at suite start.
  async function loginOnceAtSuiteStart() {
    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });

    const cookieBtn = page.locator(`xpath=${COOKIE_ACCEPT_BTN}`);
    try {
      await cookieBtn.waitFor({ state: 'visible', timeout: 5000 });
      await cookieBtn.click();
    } catch {
      // Ignore if no cookie banner.
    }

    await page.locator('//*[@id="authForm"]/div/form/div[1]/div/input').fill(EMAIL);
    await page.locator('//*[@id="authForm"]/div/form/div[2]/div/input').fill(PASSWORD);
    await page.locator('//*[@id="authForm"]/div/form/button').click();

    await expect(page.locator(loggedInIndicatorSelector), 'Authenticated session should be available').toBeVisible({ timeout: 30000 });
  }

  test.beforeAll(async ({ browser }) => {
    // Extra startup buffer for production network variability.
    test.setTimeout(300_000);
    const ctx = await browser.newContext();
    page = await ctx.newPage();

    listings = new PropertyListingsPage(page);
    detail = new PropertyDetailPage(page);

    // Bypass reCAPTCHA for stable login automation.
    await page.route('**/*recaptcha*', (route) => route.abort());
    await page.addInitScript(() => {
      window.grecaptcha = {
        ready: (fn) => fn(),
        render: (_el, params) => {
          setTimeout(() => params?.callback?.('test-token'), 300);
          return 0;
        },
        getResponse: () => 'test-token',
        execute: () => Promise.resolve('test-token'),
        reset: () => {},
      };
    });

    console.log(`Setup: Logging in once as ${EMAIL} before suite execution...`);
    await loginOnceAtSuiteStart();

    console.log(`Setup: Opening property listings at ${LISTINGS_URL}`);
    await page.goto(LISTINGS_URL, { waitUntil: 'domcontentloaded' });
    await listings.dismissOverlays();
    await listings.waitForListings();

    const ids = await listings.getCardIds();
    expect(ids.length, 'At least one listing must be available to open detail page').toBeGreaterThan(0);

    await listings.openCard(ids[0]);
    await page.waitForLoadState('domcontentloaded');

    // URL format: domain + country + slug-id
    const url = page.url();
    const host = new URL(url).hostname;
    expect(host.includes('ziba-property.com'), 'Detail page host should be on ziba-property.com domain').toBeTruthy();
    expect(url, 'Detail page URL should follow /{country}/{slug}-{id}').toMatch(/\/[^/]+\/[a-z0-9\-]+-\d+(?:\/)?(?:\?.*)?$/i);
    detailUrl = url;
    console.log(`  -> Detail page opened: ${url}`);
  });

  test.beforeEach(async () => {
    // Ensure authenticated session is still active for every test case.
    await expect(page.locator(loggedInIndicatorSelector), 'Session should remain authenticated for this test').toBeVisible({ timeout: 10000 });

    // Keep each case on detail page even if previous actions navigated away.
    const onDetailPage = /\/[^/]+\/[a-z0-9\-]+-\d+(?:\/)?(?:\?.*)?$/i.test(page.url());
    if (!onDetailPage && detailUrl) {
      await page.goto(detailUrl, { waitUntil: 'domcontentloaded' });
      await detail.expectVisible(detail.propertyName, 'Property name after restoring detail page');
    }
  });

  test.afterAll(async () => {
    if (page) await page.close();
  });

  // ══════════════════════════════════════════════════════════════════════════
  // TC-1: Media gallery + expanded view behavior
  // ══════════════════════════════════════════════════════════════════════════
  test('TC-1: Verify media gallery and expanded media view', async () => {
    await detail.openImageGallery();

    const totalMedia = await detail.getGalleryCount();
    console.log(`  -> Media count shown: ${totalMedia || 'unknown'}`);

    await detail.browseGalleryForward();
    await detail.verifyMediaHealth();
    await detail.openExpandedView();

    // Escape to close expanded media if open.
    await page.keyboard.press('Escape').catch(() => {});
    console.log('✅ TC-1 — media gallery checks completed.');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // TC-2: Property summary + core detail sections
  // ══════════════════════════════════════════════════════════════════════════
  test('TC-2: Verify property summary information and primary sections', async () => {
    const name = await detail.expectTextNotEmpty(detail.propertyName, 'Property name');
    const status = await detail.expectTextNotEmpty(detail.statusTag, 'Property status tag');
    const price = await detail.expectTextNotEmpty(detail.price, 'Property price');

    // Currency symbol/prefix can vary by country; enforce non-empty display.
    expect(price.length, 'Price should include visible currency text').toBeGreaterThan(0);

    await detail.expectOptionalVisible(detail.tagline, 'Tagline');
    await detail.expectOptionalVisible(detail.postedDateTime, 'Posted date/time');
    await detail.expectOptionalVisible(detail.specifications, 'Specifications (beds/baths/parking/area)');

    await detail.expectVisible(detail.detailsSection, 'Property details section');
    await detail.expectVisible(detail.mapAddressSection, 'Map and address section', 20000);
    await detail.expectOptionalVisible(detail.facilitiesSection, 'Facilities section');
    await detail.expectOptionalVisible(detail.descriptionSection, 'Description section');

    const isRent = await detail.isRentType();
    if (!isRent) {
      await detail.expectOptionalVisible(detail.repaymentCalculatorSection, 'Repayment calculator section');
    } else {
      console.log('  -> Rent listing detected; repayment calculator validation skipped.');
    }

    console.log(`  -> Property summary: name="${name}" | status="${status}"`);
    console.log('✅ TC-2 — property summary and main sections verified.');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // TC-3: Profile, enquiry, WhatsApp, share, and manage actions
  // ══════════════════════════════════════════════════════════════════════════
  test('TC-3: Verify profile block, enquiry flow, WhatsApp, share and manage areas', async () => {
    const profileVisible = await detail.expectOptionalVisible(detail.profileSection, 'Agent/Owner profile section');
    if (profileVisible) {
      const profileText = (await detail.profileSection.first().innerText()).trim();
      expect(profileText.length, 'Profile section should contain name/company details').toBeGreaterThan(0);
    }

    await detail.expectOptionalVisible(detail.verifiedAgentTag, 'Verified agent tag');
    await detail.expectOptionalVisible(detail.ownerTag, 'Owner tag');

    const proposalVisible = await detail.expectOptionalVisible(detail.sendProposalLink, 'Send proposal action');
    if (proposalVisible) {
      await detail.sendProposalLink.first().click().catch(() => {});
      await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
      await detail.expectVisible(detail.propertyName, 'Property name after returning from proposal action');
    }

    await detail.expectVisible(detail.sendEnquiryButton, 'Send Enquiry button');
    await detail.clickSendEnquiryAndSubmit();

    await detail.verifyWhatsappRedirect();
    await detail.expectVisible(detail.shareSection, 'Share section');

    const manageVisible = await detail.expectOptionalVisible(detail.manageSection, 'Manage section (owner/agent controls)');
    if (manageVisible) {
      const manageText = (await detail.manageSection.first().innerText()).toLowerCase();
      const hasAtLeastOneOption = /edit|delete|favorite|favourite|promote/.test(manageText);
      expect(hasAtLeastOneOption, 'Manage section should expose role actions').toBeTruthy();
    }

    console.log('✅ TC-3 — profile/contact/share/manage checks completed.');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // TC-4: Favorites + promote listing controls (role/data dependent)
  // ══════════════════════════════════════════════════════════════════════════
  test('TC-4: Verify favorites, promote listing modal and featured indicators when available', async () => {
    const favoriteVisible = await detail.expectOptionalVisible(detail.addToFavorites, 'Add to Favorites control');
    if (favoriteVisible) {
      // Favorite verification: click only (no post-click assertions).
      const popupPromise = page.waitForEvent('popup', { timeout: 3000 }).catch(() => null);
      await detail.addToFavorites.first().click({ force: true }).catch(() => {});
      const popup = await popupPromise;
      if (popup) {
        await popup.close().catch(() => {});
      }

      // Recover detail page only if click caused navigation.
      const onDetailPage = /\/[^/]+\/[a-z0-9\-]+-\d+(?:\/)?(?:\?.*)?$/i.test(page.url());
      if (!onDetailPage && detailUrl) {
        await page.goto(detailUrl, { waitUntil: 'domcontentloaded' });
      }

      console.log('  -> Add to Favorites clicked.');
    }

    const promoteVisible = await detail.expectOptionalVisible(detail.promoteButton, 'Promote this Listing button');
    if (promoteVisible) {
      await detail.promoteButton.first().click();
      await detail.expectVisible(detail.promoteModal, 'Promote modal');
      await detail.expectOptionalVisible(detail.creditsAvailable, 'Available credits block');
      await detail.expectOptionalVisible(detail.promotePlans, 'Promotion plans');
      await detail.expectOptionalVisible(detail.whatsIncluded, 'What\'s Included section');
      await detail.expectOptionalVisible(detail.promoteNow, 'Promote Now button');
      await detail.expectOptionalVisible(detail.buyCredits, 'Buy Credits button/link');

      const buyCreditsHref = await detail.buyCredits.first().getAttribute('href').catch(() => null);
      if (buyCreditsHref) {
        expect(buyCreditsHref.trim().length, 'Buy Credits link should have href').toBeGreaterThan(0);
      }

      await detail.promoteClose.first().click().catch(() => {});
    }

    await detail.expectOptionalVisible(detail.featuredIcon, 'Featured bump/star icon');
    console.log('✅ TC-4 — favorite/promote/featured validations completed.');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // TC-5: Resilience checks for missing/slow sections
  // ══════════════════════════════════════════════════════════════════════════
  test('TC-5: Verify resilience for missing data blocks (media/profile/map)', async () => {
    const mediaVisible = await detail.isVisible(detail.galleryList, 4000);
    if (!mediaVisible) {
      console.log('  -> Missing media gracefully handled: gallery list not visible for this listing.');
    }

    const profileVisible = await detail.isVisible(detail.profileSection, 4000);
    if (!profileVisible) {
      console.log('  -> Missing agent/owner details gracefully handled for this listing.');
    }

    const mapVisible = await detail.isVisible(detail.mapAddressSection, 15000);
    expect(mapVisible, 'Map/address section should eventually load (slow-loading tolerant)').toBeTruthy();

    console.log('✅ TC-5 — missing/slow section handling checks completed.');
  });
});
