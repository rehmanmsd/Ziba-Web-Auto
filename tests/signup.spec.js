require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { SignUpPage } = require('../pages/SignUpPage');
const { OtpPage } = require('../pages/OtpPage');

// Static OTP used for testing the OTP entry flow.
// NOTE: This OTP will not pass real verification; the test validates
// that the OTP page is reached and that all 6 boxes can be filled.
const STATIC_TEST_OTP = '123456';

test.describe('Sign Up — Email & Password', () => {
  let signUpPage;
  let otpPage;

  test.beforeEach(async ({ page }) => {
    signUpPage = new SignUpPage(page);
    otpPage = new OtpPage(page);
    await signUpPage.navigate();
  });

  test('User should be redirected to OTP page after sign up with valid email and password', async ({
    page,
  }) => {
    // Step 1: Open the Login / Sign Up dropdown → click Login
    await signUpPage.openLoginForm();

    // Step 2: Enter valid credentials and submit
    await signUpPage.signUp(
      process.env.USER_EMAIL,
      process.env.USER_PASSWORD
    );

    // Step 3: Verify user is redirected to the OTP page
    await otpPage.waitForPage();
    expect(page.url()).toContain('/otp');
  });

  test('User should be able to enter OTP on the OTP verification page', async ({
    page,
  }) => {
    // Step 1: Open the Login / Sign Up dropdown → click Login
    await signUpPage.openLoginForm();

    // Step 2: Enter valid credentials and submit
    await signUpPage.signUp(
      process.env.USER_EMAIL,
      process.env.USER_PASSWORD
    );

    // Step 3: Wait for OTP page
    await otpPage.waitForPage();
    expect(page.url()).toContain('/otp');

    // Step 4: Enter static 6-digit OTP into the individual boxes
    await otpPage.enterOtp(STATIC_TEST_OTP);

    // Step 5: Wait briefly for any auto-submit / response
    await page.waitForTimeout(3000);

    // NOTE: With a static/fake OTP the backend will reject the code,
    // so we only assert we are still on the OTP page (not crashed).
    // Replace STATIC_TEST_OTP with the real OTP to verify full success.
    expect(page.url()).toContain('/otp');
  });
});
