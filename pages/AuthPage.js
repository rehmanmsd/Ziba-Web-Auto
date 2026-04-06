class AuthPage {
  constructor(page) {
    this.page = page;

    // Header dropdown trigger — Login / Sign Up button
    this.loginSignUpDropdown = page.locator(
      '//*[@id="page-top"]/header/div/div/div[3]/div[3]/div'
    );

    // Login link inside the dropdown
    this.loginLink = page.locator(
      '//*[@id="page-top"]/header/div/div/div[3]/div[3]/ul/li[1]/a'
    );

    // Auth form fields
    this.emailInput = page.locator(
      '//*[@id="authForm"]/div/form/div[1]/div/input'
    );
    this.passwordInput = page.locator(
      '//*[@id="authForm"]/div/form/div[2]/div/input'
    );
    this.submitButton = page.locator(
      '//*[@id="authForm"]/div/form/button'
    );

    // Continue with OTP link
    this.continueWithOtpLink = page.locator(
      '//*[@id="authForm"]/div/form/div[4]/span'
    );
  }

  /**
   * Navigate to the base homepage.
   */
  async navigate() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate direct to login page.
   */
  async navigateToLogin() {
    await this.page.goto('/login');
  }

  /**
   * Open the Login / Sign Up dropdown in the header and click Login.
   */
  async openLoginForm() {
    await this.loginSignUpDropdown.click();
    await this.loginLink.waitFor({ state: 'visible', timeout: 5000 });
    await this.loginLink.click();
    await this.emailInput.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Fill in the auth form and submit (works for both login and signup as form is shared).
   * @param {string} email
   * @param {string} password
   */
  async submitAuthForm(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}

module.exports = { AuthPage };
