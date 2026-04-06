class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.locator('//*[@id="authForm"]/div/form/div[1]/div/input');
    this.passwordInput = page.locator('//*[@id="authForm"]/div/form/div[2]/div/input');
    this.loginButton = page.locator('//*[@id="authForm"]/div/form/button');
  }

  async navigate() {
    await this.page.goto('/login');
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}

module.exports = { LoginPage };