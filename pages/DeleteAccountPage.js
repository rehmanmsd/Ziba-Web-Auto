/**
 * DeleteAccountPage
 *
 * Encapsulates all interactions for removing the Individual User role
 * from a logged-in user's profile.
 *
 * Navigation path (after login):
 *   1. Go to /profile?tab=personal
 *   2. Click "As Individual User" tab
 *   3. Click "Remove Role" button
 *   4. Confirm in the dialog
 *   5. App redirects back to /profile?tab=personal
 */

const { LOCATORS } = require('../utils/locators');
const { expect }   = require('@playwright/test');

class DeleteAccountPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // "As Individual User" tab link on the Profile page
    this.individualUserTab = page.locator(`xpath=${LOCATORS.individualUserTab}`);

    // #individualTab panel — becomes visible after clicking the tab
    this.individualTabPanel = page.locator('#individualTab');

    // "Remove Role" button inside the Individual tab panel
    this.removeRoleBtn = page.locator(`xpath=${LOCATORS.individualRemoveRoleBtn}`);

    // "Remove" confirmation button inside the dialog
    this.confirmRemoveBtn = page.locator(`xpath=${LOCATORS.individualConfirmRemoveBtn}`);

    // "As Agent" tab link on the Profile page
    this.agentTab = page.locator(`xpath=${LOCATORS.agentTab}`);

    // Agent tab panel — scoped to avoid ambiguity with vendor panel
    this.agentTabPanel = page.locator('#agent-form #withDataVendor');

    // "Remove Role" button inside the Agent tab panel
    this.agentRemoveRoleBtn = page.locator(`xpath=${LOCATORS.agentRemoveRoleBtn}`);

    // "Remove" confirmation button inside the Agent dialog
    this.agentConfirmRemoveBtn = page.locator(`xpath=${LOCATORS.agentConfirmRemoveBtn}`);

    // "As Business & Service" tab link on the Profile page
    this.businessTab = page.locator(`xpath=${LOCATORS.businessTab}`);

    // Business tab panel — scoped to avoid ambiguity with agent panel
    this.businessTabPanel = page.locator('#vendorTab #withDataVendor');

    // "Remove Role" button inside the Business & Service tab panel
    this.businessRemoveRoleBtn = page.locator(`xpath=${LOCATORS.businessRemoveRoleBtn}`);

    // "Yes, remove it!" confirmation button inside the dialog
    this.businessConfirmRemoveBtn = page.locator(`xpath=${LOCATORS.businessConfirmRemoveBtn}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // Navigation helpers
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Navigate to the Profile page and wait for the Individual User tab to load.
   * Assumes the user is already logged in.
   */
  async navigateToProfile() {
    await this.page.goto('/profile?tab=personal', { waitUntil: 'domcontentloaded' });
    await this.page.waitForTimeout(5000);
    console.log(`  → Profile page loaded — on: ${this.page.url()}`);
  }

  /**
   * Click the "As Individual User" tab and wait for its panel to render.
   */
  async selectIndividualTab() {
    await this.individualUserTab.click();
    await this.individualTabPanel.waitFor({ state: 'visible', timeout: 15000 });
    // Allow the tab content to fully render before interacting
    await this.page.waitForTimeout(3000);
    console.log('  → Individual User tab content loaded.');
  }

  /**
   * Click "Remove Role", wait for the confirmation dialog, then confirm.
   */
  async removeIndividualRole() {
    // Click Remove Role
    await this.removeRoleBtn.waitFor({ state: 'visible', timeout: 15000 });
    await this.removeRoleBtn.click();
    console.log('  → Remove Role clicked.');

    // Wait for confirmation dialog to appear
    await this.page.waitForTimeout(5000);

    // Click the Remove / confirm button in the dialog
    await this.confirmRemoveBtn.waitFor({ state: 'visible', timeout: 15000 });
    await this.confirmRemoveBtn.click();
    console.log('  → Confirmation dialog accepted.');

    // Allow the deletion process to complete
    await this.page.waitForTimeout(4000);
  }

  /**
   * Verify the app redirected back to /profile?tab=personal after deletion.
   */
  async verifyRedirectToProfile() {
    await this.page.waitForURL(/\/profile\?tab=personal/, { timeout: 20000 });
    await expect(this.page).toHaveURL(/\/profile\?tab=personal/);
    console.log(`  → Redirected to: ${this.page.url()}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // Agent Role Deletion helpers
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Click the "As Agent" tab and wait for its panel to render.
   */
  async selectAgentTab() {
    await this.agentTab.click();
    await this.agentTabPanel.waitFor({ state: 'visible', timeout: 15000 });
    await this.page.waitForTimeout(3000);
    console.log('  → Agent tab content loaded.');
  }

  /**
   * Click "Remove Role" on the Agent panel, wait for confirmation dialog, then confirm.
   */
  async removeAgentRole() {
    await this.agentRemoveRoleBtn.waitFor({ state: 'visible', timeout: 15000 });
    await this.agentRemoveRoleBtn.click();
    console.log('  → Agent Remove Role clicked.');

    await this.page.waitForTimeout(5000);

    await this.agentConfirmRemoveBtn.waitFor({ state: 'visible', timeout: 15000 });
    await this.agentConfirmRemoveBtn.click();
    console.log('  → Agent confirmation dialog accepted.');

    await this.page.waitForTimeout(4000);
  }

  /**
   * Verify the app redirected to the expected URL after agent role deletion.
   * @param {RegExp|string} expectedUrl
   */
  async verifyRedirectAfterAgentDeletion(expectedUrl) {
    // The page may already be on the expected URL (no navigation event),
    // so wait briefly for any pending redirect, then assert the current URL.
    await this.page.waitForTimeout(3000);
    await expect(this.page).toHaveURL(expectedUrl);
    console.log(`  → Verified URL: ${this.page.url()}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // Business & Service Role Deletion helpers
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Click the "As Business & Service" tab and wait for its panel to render.
   */
  async selectBusinessTab() {
    await this.businessTab.click();
    await this.businessTabPanel.waitFor({ state: 'visible', timeout: 15000 });
    await this.page.waitForTimeout(3000);
    console.log('  → Business & Service tab content loaded.');
  }

  /**
   * Click "Remove Role" on the Business panel, wait for confirmation dialog, then confirm.
   */
  async removeBusinessRole() {
    await this.businessRemoveRoleBtn.waitFor({ state: 'visible', timeout: 15000 });
    await this.businessRemoveRoleBtn.click();
    console.log('  → Business Remove Role clicked.');

    await this.page.waitForTimeout(5000);

    await this.businessConfirmRemoveBtn.waitFor({ state: 'visible', timeout: 15000 });
    await this.businessConfirmRemoveBtn.click();
    console.log('  → Business confirmation dialog accepted.');

    await this.page.waitForTimeout(4000);
  }

  /**
   * Verify the URL after business role deletion.
   * @param {RegExp|string} expectedUrl
   */
  async verifyRedirectAfterBusinessDeletion(expectedUrl) {
    await this.page.waitForTimeout(3000);
    await expect(this.page).toHaveURL(expectedUrl);
    console.log(`  → Verified URL: ${this.page.url()}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // Delete Account helpers
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Click "Remove Account" and confirm deletion in the dialog.
   */
  async deleteAccount() {
    const removeAccountBtn = this.page.locator(`xpath=${LOCATORS.removeAccountBtn}`);
    await removeAccountBtn.waitFor({ state: 'visible', timeout: 15000 });
    await removeAccountBtn.click();
    console.log('  → Remove Account clicked.');

    await this.page.waitForTimeout(5000);

    const deleteConfirmBtn = this.page.locator(`xpath=${LOCATORS.deleteAccountConfirmBtn}`);
    await deleteConfirmBtn.waitFor({ state: 'visible', timeout: 15000 });
    await deleteConfirmBtn.click();
    console.log('  → Delete Account confirmed.');

    await this.page.waitForTimeout(4000);
  }

  /**
   * Verify the user is redirected to the Ziba homepage after account deletion.
   */
  async verifyRedirectToHomepage() {
    await this.page.waitForTimeout(3000);
    await expect(this.page).toHaveURL('https://ziba-property.com/');
    console.log(`  → Verified URL: ${this.page.url()}`);
  }
}

module.exports = { DeleteAccountPage };

//test line ===> const { DeleteAccountPage } = require('../pages/DeleteAccountPage');
