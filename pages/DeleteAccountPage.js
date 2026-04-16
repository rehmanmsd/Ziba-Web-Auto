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
  }

  // ═════════════════════════════════════════════════════════════════════════
  // Navigation helpers
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Navigate to the Profile page and wait for the Individual User tab to load.
   * Assumes the user is already logged in.
   */
  async navigateToProfile() {
    await this.page.goto('/profile?tab=personal');
    await this.individualUserTab.waitFor({ state: 'visible', timeout: 20000 });
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
}

module.exports = { DeleteAccountPage };

//test line
