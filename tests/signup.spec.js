require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { SignUpPage } = require('../pages/SignUpPage');
const { OtpPage } = require('../pages/OtpPage');
const { getOtpFromYopmail } = require('../utils/otpUtil');

// The static OTP was previously used for testing, but we now fetch it dynamically.
// You can remove this or keep this section for documentation.

test.describe('Sign Up — Email & Password', () => {
  // Perform test slightly slower to avoid rapid API requests
  test.slow();
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
    context
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

    // Step 4: Fetch real OTP using the Yopmail utility
    const actualOtp = await getOtpFromYopmail(context, process.env.USER_EMAIL);

    // Step 5: Enter the dynamically fetched 6-digit OTP into the individual boxes
    await otpPage.enterOtp(actualOtp);

    // Step 6: App auto-submits after 6 digits are typed, so no need to click submit.

    // Step 7: Wait briefly for any auto-submit / response
    await page.waitForTimeout(3000);
  });
});
//test AR