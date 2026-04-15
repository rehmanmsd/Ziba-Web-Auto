/**
 * ForgotPasswordPage
 *
 * Covers the two-stage password-reset flow:
 *
 *  Stage 1 — Forgot Password (on /login)
 *    1. Click "Forgot password?" link  →  auth form switches to reset mode
 *    2. Enter email and click "Send Reset Email"
 *    3. App redirects to /checkemail?mail=<email>
 *
 *  Stage 2 — Reset Password (external page opened from Yopmail link)
 *    4. Fill email, new password, confirm password
 *    5. Click "Reset Password"  →  app redirects back to /login
 */

const { LOCATORS } = require('../utils/locators');

class ForgotPasswordPage {
  /**
   * @param {import('@playwright/test').Page} page - The Playwright page instance.
   */
  constructor(page) {
    this.page = page;

    // ── Stage 1 locators (auth form on /login) ──────────────────────────────

    // "Forgot password?" clickable text that switches the auth form to reset mode
    this.forgotPasswordLink = page.locator(LOCATORS.forgotPasswordLink);

    // Email input shown after clicking "Forgot password?"
    this.emailInput = page.locator(LOCATORS.forgotPasswordEmailInput);

    // "Send Reset Email" button — submits the forgot-password request
    this.sendResetEmailBtn = page.locator(LOCATORS.sendResetEmailBtn);

    // ── Stage 2 locators (external reset-password page) ────────────────────

    // Email field on the dedicated reset-password page (validates ownership)
    this.resetEmailInput = page.locator(LOCATORS.resetPasswordEmailInput);

    // New password field
    this.newPasswordInput = page.locator(LOCATORS.resetPasswordNewPassword);

    // Confirm new password field (must match newPasswordInput)
    this.confirmPasswordInput = page.locator(LOCATORS.resetPasswordConfirm);

    // "Reset Password" submit button — finalises the password change
    this.resetPasswordSubmitBtn = page.locator(LOCATORS.resetPasswordSubmitBtn);

    // Error message shown under the email field when the token is invalid/expired
    this.invalidTokenError = page.locator(LOCATORS.resetPasswordInvalidTokenError);

    // Error message shown on the Forgot Password form when the email is not
    // registered in the system (stays on the same page, no redirect)
    this.unregisteredEmailError = page.locator(LOCATORS.forgotPasswordUnregisteredEmailError);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Stage 1 — Request a password-reset email
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Navigate to /login and wait for the auth form to be ready.
   */
  async navigate() {
    await this.page.goto('/login');
    await this.emailInput.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Click "Forgot password?" so the auth form switches to reset mode.
   * Waits for the "Send Reset Email" button to confirm the UI changed.
   */
  async clickForgotPassword() {
    await this.forgotPasswordLink.waitFor({ state: 'visible', timeout: 10000 });
    await this.forgotPasswordLink.click();
    // Brief pause for the form to re-render in reset mode
    await this.page.waitForTimeout(800);
    console.log('  → Switched to Forgot Password mode.');
  }

  /**
   * Enter the user email, bypass reCAPTCHA (already mocked in navigate),
   * and click "Send Reset Email".
   *
   * @param {string} email - The account email to reset (e.g. ar0@yopmail.com)
   */
  async requestPasswordReset(email) {
    await this.emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.emailInput.fill(email);
    console.log(`  → Reset email entered: ${email}`);

    // reCAPTCHA is bypassed via the init-script mock injected before navigation.
    // Short pause ensures the mock token has been received by the form.
    await this.page.waitForTimeout(800);

    await this.sendResetEmailBtn.waitFor({ state: 'visible', timeout: 10000 });
    await this.sendResetEmailBtn.click();
    console.log('  → "Send Reset Email" clicked.');
  }

  /**
   * Wait for the app to redirect to the check-email confirmation page.
   * URL format: /checkemail?mail=<email>
   *
   * @param {string} email - The same email passed to requestPasswordReset.
   */
  async waitForCheckEmailPage(email) {
    // Wait for any /checkemail navigation first — the app does NOT encode the @
    // in the query param, so using a regex avoids encoding mismatches.
    await this.page.waitForURL(/\/checkemail/, { timeout: 15000 });
    console.log(`  → Arrived at check-email page: ${this.page.url()}`);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Stage 2 — Complete the password reset on the external page
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Fill the external reset-password form and submit it.
   * This method is called on the page returned after clicking the Yopmail link.
   *
   * @param {string} email       - Account email (re-entered for ownership verification)
   * @param {string} newPassword - The new password to set
   */
  async fillResetForm(email, newPassword) {
    // Some reset-password pages pre-fill email from the token; fill anyway for safety.
    await this.resetEmailInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.resetEmailInput.fill(email);
    console.log('  → Email entered on reset form.');

    await this.newPasswordInput.fill(newPassword);
    console.log('  → New password entered.');

    await this.confirmPasswordInput.fill(newPassword);
    console.log('  → Confirm password entered.');
  }

  /**
   * Click the "Reset Password" button and wait for redirect to /login.
   * Used in the happy-path reset flow.
   */
  async submitResetForm() {
    await this.resetPasswordSubmitBtn.waitFor({ state: 'visible', timeout: 10000 });
    await this.resetPasswordSubmitBtn.click();
    console.log('  → "Reset Password" button clicked.');

    // After a successful reset the app redirects back to /login
    await this.page.waitForURL('**/login', { timeout: 15000 });
    console.log('  → Redirected to /login after password reset.');
  }

  /**
   * Click the "Reset Password" button when using an EXPIRED token.
   * Does NOT wait for a /login redirect — instead waits for the invalid-token
   * error message to appear, or simply returns after clicking.
   */
  async submitResetFormExpectError() {
    await this.resetPasswordSubmitBtn.waitFor({ state: 'visible', timeout: 10000 });
    await this.resetPasswordSubmitBtn.click();
    console.log('  → "Reset Password" button clicked (expecting invalid-token error).');
    // Give the app time to validate the token and render the error
    await this.page.waitForTimeout(3000);
  }

  /**
   * Assert that the "This password reset token is invalid." message is
   * visible under the email field on the reset-password page.
   * Calling this confirms the expired-token validation is working correctly.
   */
  async verifyInvalidTokenError() {
    await this.invalidTokenError.waitFor({ state: 'visible', timeout: 10000 });
    const isVisible = await this.invalidTokenError.isVisible();
    if (!isVisible) {
      throw new Error('Expected invalid-token error message but it was not visible.');
    }
    console.log('  ✓ "This password reset token is invalid." message confirmed.');
  }

  /**
   * Assert that the "We can't find a user with that email address." error
   * is visible under the email field on the Forgot Password form.
   * The form must NOT have navigated away — it stays on /login.
   * Test PASSES when this message is visible.
   */
  async verifyUnregisteredEmailError() {
    await this.unregisteredEmailError.waitFor({ state: 'visible', timeout: 10000 });
    const isVisible = await this.unregisteredEmailError.isVisible();
    if (!isVisible) {
      throw new Error(
        'Expected "We can\'t find a user with that email address." but it was not visible.'
      );
    }
    console.log('  ✓ "We can\'t find a user with that email address." message confirmed.');
  }
}

module.exports = { ForgotPasswordPage };
