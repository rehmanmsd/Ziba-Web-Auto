class OtpPage {
  constructor(page) {
    this.page = page;

    // 6 individual OTP digit input boxes (class="v-box")
    this.otpBoxes = page.locator("//input[@class='v-box']");

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
    const digits = code.toString().split('');
    const boxes = this.otpBoxes;

    for (let i = 0; i < digits.length; i++) {
      await boxes.nth(i).click();
      await boxes.nth(i).fill(digits[i]);
    }
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
