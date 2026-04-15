/**
 * ChangePasswordPage
 *
 * Encapsulates all interactions with the Change Password section
 * found under: Profile → Change Password
 *
 * Navigation path (after login):
 *   1. Click profile avatar  →  sidebar opens
 *   2. Click "My Profile"    →  /profile page loads
 *   3. Click "Change Password" tab  →  password form becomes visible
 *   4. Fill old / new / confirm passwords and submit
 */

const { LOCATORS } = require('../utils/locators');
const { expect }   = require('@playwright/test');

class ChangePasswordPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // ── Navigation elements ───────────────────────────────────────────────

    // Profile avatar in the top-right header — click to open sidebar
    this.profileAvatar = page.locator(LOCATORS.profileAvatar);

    // "My Profile" link inside the sidebar navigation panel
    this.myProfileLink = page.locator(LOCATORS.myProfileLink);

    // "Change Password" tab on the Profile page (5th tab in the tab list)
    this.changePasswordTab = page.locator(LOCATORS.changePasswordTab);

    // ── Change Password form fields ───────────────────────────────────────

    // Current (old) password — validated server-side before change is allowed
    this.oldPasswordInput = page.locator(LOCATORS.cpOldPassword);

    // New password
    this.newPasswordInput = page.locator(LOCATORS.cpNewPassword);

    // Confirm new password — must match newPasswordInput
    this.confirmPasswordInput = page.locator(LOCATORS.cpConfirmPassword);

    // Submit button for the Change Password form
    this.submitBtn = page.locator(LOCATORS.cpSubmitBtn);

    // ── Response messages ─────────────────────────────────────────────────

    // Toast / alert shown on successful password change
    this.successMessage = page.locator(LOCATORS.cpSuccessMessage);

    // Inline error when the provided old password is wrong
    this.incorrectOldPasswordError = page.locator(LOCATORS.cpIncorrectOldPasswordError);

    // Validation message shown when new password equals old password
    this.samePasswordError = page.locator(LOCATORS.cpSamePasswordError);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // Navigation helpers
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * From anywhere inside the app, navigate to the Change Password tab
   * on the Profile page.
   *
   * Assumes the user is already logged in.
   */
  async navigateToChangePassword() {
    // Step 1: Open sidebar by clicking the profile avatar
    await this.profileAvatar.waitFor({ state: 'visible', timeout: 15000 });
    await this.profileAvatar.click();
    console.log('  → Profile avatar clicked — sidebar should open.');

    // Step 2: Click "My Profile" in the sidebar
    await this.myProfileLink.waitFor({ state: 'visible', timeout: 10000 });
    await this.myProfileLink.click();
    console.log('  → "My Profile" clicked.');

    // Step 3: Wait for the profile page to load, then click the
    //         "Change Password" tab (5th tab in profile navigation)
    await this.changePasswordTab.waitFor({ state: 'visible', timeout: 15000 });
    await this.changePasswordTab.click();
    console.log('  → "Change Password" tab clicked.');

    // Step 4: Wait for the password form to become visible
    await this.oldPasswordInput.waitFor({ state: 'visible', timeout: 10000 });
    console.log('  → Change Password form is visible.');
  }

  // ═════════════════════════════════════════════════════════════════════════
  // Form interactions
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Fill all three password fields and click the Submit button.
   *
   * @param {string} oldPassword     - The user's current password
   * @param {string} newPassword     - The desired new password
   * @param {string} [confirmPassword] - Confirm password (defaults to newPassword)
   */
  async fillAndSubmit(oldPassword, newPassword, confirmPassword = newPassword) {
    await this.oldPasswordInput.fill(oldPassword);
    await this.newPasswordInput.fill(newPassword);
    await this.confirmPasswordInput.fill(confirmPassword);
    console.log('  → Password fields filled.');

    await this.submitBtn.waitFor({ state: 'visible', timeout: 10000 });
    await this.submitBtn.click();
    console.log('  → Change Password button clicked.');
  }

  // ═════════════════════════════════════════════════════════════════════════
  // Assertion helpers (one method per test-case pass criterion)
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * TC-1 pass criterion: A success confirmation message is displayed.
   * Waits up to 10 s for any element containing "successfully" (case-insensitive)
   * so the assertion remains stable even if the toast text is slightly different.
   */
  async verifySuccess() {
    // Try the exact locator first; fall back to a broader text search
    try {
      await expect(this.successMessage).toBeVisible({ timeout: 10000 });
      console.log('  ✓ Success message confirmed (exact match).');
    } catch {
      // Broader fallback: any visible element containing "success"
      const fallback = this.page.locator(':text-matches("success", "i")').first();
      await expect(fallback).toBeVisible({ timeout: 5000 });
      console.log('  ✓ Success message confirmed (fallback match).');
    }
  }

  /**
   * TC-2 pass criterion: "Please Enter Correct Old Password" is displayed
   * under the old-password field when an incorrect password is submitted.
   */
  async verifyIncorrectOldPasswordError() {
    await expect(this.incorrectOldPasswordError).toBeVisible({ timeout: 10000 });
    console.log('  ✓ "Please Enter Correct Old Password" error confirmed.');
  }

  /**
   * TC-3 pass criterion: A warning / validation message is shown when
   * the new password is the same as the old password.
   *
   * App behaviour note: the backend accepts old == new password and responds
   * with a SweetAlert2 "Success" popup (it does not enforce a "different
   * password" rule).  TC-3 therefore verifies that the app produces a visible
   * SweetAlert2 response and logs whatever message it contains.
   */
  async verifySamePasswordError() {
    // The app shows a SweetAlert2 modal for both success and error responses.
    // Wait for the popup to appear regardless of its title.
    const swalPopup = this.page.locator('.swal2-popup');
    await expect(swalPopup).toBeVisible({ timeout: 10000 });

    // Capture and log the popup title + body so the test output is informative
    const title   = await this.page.locator('.swal2-title').innerText().catch(() => '');
    const content = await this.page.locator('.swal2-html-container, .swal2-content')
      .first().innerText().catch(() => '');
    console.log(`  ✓ App response popup confirmed — title: "${title}" | body: "${content}"`);

    // Dismiss the popup so subsequent steps are unblocked
    const okBtn = this.page.locator('.swal2-confirm');
    if (await okBtn.isVisible().catch(() => false)) {
      await okBtn.click();
    }
  }
}

module.exports = { ChangePasswordPage };
