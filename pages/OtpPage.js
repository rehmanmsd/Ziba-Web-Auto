class OtpPage {
  constructor(page) {
    this.page = page;

    // 6 individual OTP digit input boxes (class="v-box")
    this.otpBoxes = page.locator("//input[@class='v-box']");

    // Submit / Verify button on the OTP page
    this.submitButton = page.locator("//button[contains(text(),'Verify') or contains(text(),'Submit') or contains(text(),'Confirm')]");

    // Resend link
    this.resendLink = page.locator("//span[text()='Resend']");

    // Change email link
    this.changeEmailLink = page.locator("//a[contains(text(), 'change email')]");
  }

  /**
   * Wait until the OTP page is loaded.
   */
  async waitForPage() {
    await this.page.waitForURL(/\/otp/, { timeout: 15000 });
    await this.otpBoxes.first().waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Enter a 6-digit OTP code into the individual boxes.
   * The page auto-submits after the last digit is entered.
   * @param {string} code - 6-character OTP string, e.g. '123456'
   */
  async enterOtp(code) {
    // Focus the first OTP box
    await this.otpBoxes.first().click();
    
    // Type the entire code sequentially as a user would on the keyboard.
    // This allows the app's auto-advance logic to handle the focus properly.
    await this.page.keyboard.type(code.toString(), { delay: 100 });
  }

  /**
   * Click the submit/verify button on the OTP page.
   */
  async submitOtp() {
    await this.submitButton.click();
  }

  /**
   * Check if the OTP page is currently displayed.
   * @returns {Promise<boolean>}
   */
  async isVisible() {
    return this.page.url().includes('/otp');
  }
}

module.exports = { OtpPage };
