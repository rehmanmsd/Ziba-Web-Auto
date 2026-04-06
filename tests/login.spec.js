require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { AuthPage } = require('../pages/AuthPage');
const { OtpPage } = require('../pages/OtpPage');
const { getOtpFromYopmail } = require('../utils/otpUtil');

test('User should login successfully with OTP', async ({ page, context }) => {
  const authPage = new AuthPage(page);
  const otpPage = new OtpPage(page);

  // ==========================================
  // STEP 1: NAVIGATE & SWITCH TO OTP LOGIN
  // ==========================================
  await authPage.navigateToLogin();
  
  // Wait for and click on 'Continue with OTP'
  await authPage.continueWithOtpLink.waitFor({ state: 'visible' });
  await authPage.continueWithOtpLink.click();
  
  // Wait for the form UI to change from Password mode to OTP mode
  await page.waitForTimeout(1000);
  
  // ==========================================
  // STEP 2: ENTER EMAIL AND SEND OTP
  // ==========================================
  await authPage.emailInput.waitFor({ state: 'visible' });
  await authPage.emailInput.click();
  await authPage.emailInput.fill(process.env.USER_EMAIL);
  
  // Click Send OTP button and wait for the navigation to the OTP screen to complete.
  // Using Promise.all is Playwright's best practice for clicking buttons that trigger navigation.
  await Promise.all([
    otpPage.waitForPage(), // Waits for **/otp**
    authPage.submitButton.click()
  ]);
  
  expect(page.url()).toContain('/otp');

  // ==========================================
  // STEP 3: FETCH AND VERIFY OTP (SIGNUP FLOW)
  // ==========================================
  // Fetch real OTP using the Yopmail utility
  const actualOtp = await getOtpFromYopmail(context, process.env.USER_EMAIL);

  // Enter the dynamically fetched 6-digit OTP into the individual boxes
  // App auto-submits once 6 digits are entered, no manual submit click needed
  await otpPage.enterOtp(actualOtp);

  // ==========================================
  // STEP 4: VERIFY SUCCESSFUL LOGIN
  // ==========================================
  // Assert that the page URL no longer contains /otp after submission, confirming login
  await expect(page).not.toHaveURL(/.*\/otp.*/, { timeout: 15000 });
});
