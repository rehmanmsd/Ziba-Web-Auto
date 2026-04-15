class LoginPage {
  constructor(page) {
    this.page = page;

    // Shared auth form locators used on /login
    this.emailInput = page.locator('//*[@id="authForm"]/div/form/div[1]/div/input');
    this.passwordInput = page.locator('//*[@id="authForm"]/div/form/div[2]/div/input');
    this.loginButton = page.locator('//*[@id="authForm"]/div/form/button');
  }

  /**
   * Open the dedicated login route.
   */
  async navigate() {
    await this.page.goto('/login');
  }

  /**
   * Submit email/password credentials through the shared auth form.
   * @param {string} email
   * @param {string} password
   */
  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}

module.exports = { LoginPage };