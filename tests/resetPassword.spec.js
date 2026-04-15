/**
 * resetPassword.spec.js
 *
 * End-to-end test: Forgot Password → Reset via Yopmail → Login with new password
 *
 * Flow:
 *  1. Open /login and click "Forgot password?"
 *  2. Enter the account email and click "Send Reset Email"
 *  3. Verify redirect to /checkemail?mail=<email>
 *  4. Open Yopmail inbox, find the reset email, click the Reset Password link
 *  5. On the reset-password page: enter email, new password, confirm, submit
 *  6. Verify redirect back to /login
 *  7. Log in with the new credentials and verify the user reaches the home page
 *
 * Prerequisites:
 *  - BASE_URL set in .env (e.g. https://ziba-property.com)
 *  - RESET_EMAIL set in .env (e.g. ar0@yopmail.com) — must be an existing account
 *  - NEW_PASSWORD set in .env — the new password to set (e.g. NewPass@123)
 */

require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { ForgotPasswordPage } = require('../pages/ForgotPasswordPage');
const { LoginPage }          = require('../pages/LoginPage');
const { getResetPasswordLinkFromYopmail } = require('../utils/otpUtil');

// ─── Test configuration ──────────────────────────────────────────────────────
// Using environment variables keeps credentials out of source control.
const RESET_EMAIL   = process.env.RESET_EMAIL   || 'ar0@yopmail.com';
const NEW_PASSWORD  = process.env.NEW_PASSWORD  || 'NewPass@123';

test.describe('Forgot Password — Full Reset Flow', () => {
  // Allow extra time for Yopmail polling + two page navigations
  test.describe.configure({ timeout: 180_000 });

  let forgotPage;
  let loginPage;

  test.beforeEach(async ({ page }) => {
    // ── reCAPTCHA bypass ───────────────────────────────────────────────────
    // Block the external reCAPTCHA script so our mock is never overwritten
    await page.route('**/*recaptcha*', (route) => route.abort());

    // Inject a fake grecaptcha object that fires the success callback
    // immediately — prevents the form from blocking on an unsolved CAPTCHA
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

    forgotPage = new ForgotPasswordPage(page);
    loginPage  = new LoginPage(page);
  });

  test('Should reset password via email link and log in with new password', async ({
    page,
    context,
  }) => {
    // ══════════════════════════════════════════════════════════════════════
    // STEP 1: Open /login and trigger Forgot Password mode
    // ══════════════════════════════════════════════════════════════════════
    console.log('Step 1: Navigating to /login…');
    await forgotPage.navigate();

    console.log('Step 2: Clicking "Forgot password?" link…');
    await forgotPage.clickForgotPassword();

    // ══════════════════════════════════════════════════════════════════════
    // STEP 2: Enter email and send the reset link
    // ══════════════════════════════════════════════════════════════════════
    console.log(`Step 3: Requesting password reset for: ${RESET_EMAIL}`);
    await forgotPage.requestPasswordReset(RESET_EMAIL);

    // ══════════════════════════════════════════════════════════════════════
    // STEP 3: Confirm redirect to the check-email confirmation page
    // ══════════════════════════════════════════════════════════════════════
    console.log('Step 4: Waiting for /checkemail redirect…');
    await forgotPage.waitForCheckEmailPage(RESET_EMAIL);

    expect(page.url()).toContain('/checkemail');
    expect(page.url()).toContain(RESET_EMAIL); // app keeps @ unencoded in query param
    console.log(`  ✓ /checkemail confirmed: ${page.url()}`);

    // ══════════════════════════════════════════════════════════════════════
    // STEP 4: Open Yopmail and click the reset-password link in the email
    // ══════════════════════════════════════════════════════════════════════
    console.log('Step 5: Opening Yopmail to retrieve the reset link…');
    const resetPage = await getResetPasswordLinkFromYopmail(context, RESET_EMAIL);

    // Bring the reset-password tab to the front so Playwright interacts with it
    await resetPage.bringToFront();
    console.log(`  ✓ Reset-password page URL: ${resetPage.url()}`);

    // ══════════════════════════════════════════════════════════════════════
    // STEP 5: Fill the reset-password form and submit
    // ══════════════════════════════════════════════════════════════════════
    const resetFormPage = new ForgotPasswordPage(resetPage);

    console.log('Step 6: Filling the reset-password form…');
    await resetFormPage.fillResetForm(RESET_EMAIL, NEW_PASSWORD);

    console.log('Step 7: Submitting the reset-password form…');
    await resetFormPage.submitResetForm();

    // ══════════════════════════════════════════════════════════════════════
    // STEP 6: Verify redirect back to /login after successful reset
    // ══════════════════════════════════════════════════════════════════════
    expect(resetPage.url()).toContain('/login');
    console.log('  ✓ Redirected to /login after password reset.');

    // ══════════════════════════════════════════════════════════════════════
    // STEP 7: Log in with the newly set password
    // ══════════════════════════════════════════════════════════════════════
    console.log('Step 8: Logging in with the new password…');

    // Re-use the reset page (already on /login) for the final login step
    const loginPageOnReset = new LoginPage(resetPage);
    await loginPageOnReset.login(RESET_EMAIL, NEW_PASSWORD);

    // After a successful login the app redirects to /home or the dashboard.
    // We assert the user is no longer on /login to confirm success.
    await resetPage.waitForURL(/\/(home|dashboard|feed)/, { timeout: 20000 });
    console.log(`  ✓ Logged in successfully — landed on: ${resetPage.url()}`);

    console.log('✅ Full password-reset flow completed!');
  });
});
