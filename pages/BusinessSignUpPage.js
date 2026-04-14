const { LOCATORS } = require('../utils/locators');

class BusinessSignUpPage {
  constructor(page) {
    this.page = page;

    this.loginSignUpDropdown     = page.locator(LOCATORS.landingPageLoginSignupBtn);
    this.businessAndServiceLink  = page.locator(LOCATORS.businessAndServiceLink);
    this.nameField               = page.locator(LOCATORS.agentNameField);
    this.emailField              = page.locator(LOCATORS.agentEmailField);
    this.countryDropdown         = page.locator(LOCATORS.agentPhoneCountryDropdown);
    this.phoneField              = page.locator(LOCATORS.agentPhoneField);
    this.passwordField           = page.locator(LOCATORS.agentPasswordField);
    this.signUpBtn               = page.locator(LOCATORS.agentSignUpBtn);
  }

  async navigate() {
    // Block reCAPTCHA script so our mock is never overwritten
    await this.page.route('**/*recaptcha*', (route) => route.abort());

    // Mock grecaptcha — fires the success callback instantly, no image puzzle
    await this.page.addInitScript(() => {
      window.grecaptcha = {
        ready: (fn) => fn(),
        render: (_el, params) => {
          setTimeout(() => params?.callback?.('test-token'), 300);
          return 0;
        },
        getResponse: () => 'test-token',
        execute:     () => Promise.resolve('test-token'),
        reset:       () => {},
      };
    });

    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async selectBusinessAndServiceRole() {
    await this.loginSignUpDropdown.click();
    await this.businessAndServiceLink.waitFor({ state: 'visible', timeout: 8000 });
    await this.businessAndServiceLink.click();
    await this.nameField.waitFor({ state: 'visible', timeout: 10000 });
  }

  async fillSignUpForm(name, email, password) {
    await this.nameField.fill(name);
    await this.emailField.fill(email);

    // Select Pakistan from the country dropdown
    await this.countryDropdown.click();
    const pakistanOption = this.page.locator('li', { hasText: 'Pakistan' }).first();
    await pakistanOption.waitFor({ state: 'visible', timeout: 8000 });
    await pakistanOption.click();

    // Valid Pakistani mobile: 03XX-XXXXXXX (10 digits, no country code)
    const prefixes = ['300','301','302','303','310','311','312','320','321','322','330','331','332','333','334','340','345'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = Math.floor(Math.random() * 9000000 + 1000000).toString();
    const phone  = prefix + suffix;
    await this.phoneField.fill(phone);
    console.log(`  → Signup phone: ${phone}`);

    await this.passwordField.fill(password);
  }

  async clickCaptcha() {
    // reCAPTCHA is mocked — just wait for the token callback to fire
    await this.page.waitForTimeout(800);
    console.log('  → reCAPTCHA bypassed via mock.');
  }

  async submit() {
    await this.signUpBtn.waitFor({ state: 'visible', timeout: 10000 });
    await this.signUpBtn.scrollIntoViewIfNeeded();
    await this.signUpBtn.click();
  }

  async waitForSignupSuccess() {
    // App redirects to /pending/verification after a successful B&S signup
    await this.page.waitForURL(/\/(otp|pending\/verification)/, { timeout: 20000 });
    console.log(`Signup confirmed — on: ${this.page.url()}`);
  }
}

module.exports = { BusinessSignUpPage };
