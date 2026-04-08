const { LOCATORS } = require('../utils/locators');

class AgentSignUpPage {
  constructor(page) {
    this.page = page;

    // Header dropdown trigger — Login / Sign Up button
    this.loginSignUpDropdown = page.locator(LOCATORS.landingPageLoginSignupBtn);

    // "Real Estate Agent" link inside the dropdown
    this.realEstateAgentLink = page.locator(LOCATORS.realEstateAgentLink);

    // Agent sign-up form fields
    this.nameField = page.locator(LOCATORS.agentNameField);
    this.emailField = page.locator(LOCATORS.agentEmailField);
    this.countryDropdown = page.locator(LOCATORS.agentPhoneCountryDropdown);
    this.phoneField = page.locator(LOCATORS.agentPhoneField);
    this.passwordField = page.locator(LOCATORS.agentPasswordField);
    this.captcha = page.locator(LOCATORS.captchaCheckbox);
    this.signUpBtn = page.locator(LOCATORS.agentSignUpBtn);
  }

  /** Navigate to the Ziba staging homepage. */
  async navigate() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Open the header dropdown and click "Real Estate Agent".
   */
  async selectRealEstateAgentRole() {
    await this.loginSignUpDropdown.click();
    await this.realEstateAgentLink.waitFor({ state: 'visible', timeout: 8000 });
    await this.realEstateAgentLink.click();
    // Wait for the agent signup form to appear
    await this.nameField.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Generate a random Pakistani phone number (10 digits starting with 3).
   * Pakistan format: 3XX-XXXXXXX  → 10 digits
   */
  generatePakistaniPhone() {
    const prefixes = ['300', '301', '302', '303', '305', '306', '307', '308',
      '310', '311', '312', '313', '314', '315', '316', '317',
      '320', '321', '322', '323', '330', '331', '332', '333',
      '334', '335', '336', '340', '341', '345', '346'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = Math.floor(Math.random() * 9000000 + 1000000).toString();
    return prefix + suffix; // 10 digits
  }

  /**
   * Fill in the agent sign-up form.
   * @param {string} name
   * @param {string} email
   * @param {string} password
   */
  async fillAgentForm(name, email, password) {
    // Name
    await this.nameField.fill(name);

    // Email
    await this.emailField.fill(email);

    // Country — Pakistan
    await this.countryDropdown.click();
    // Wait for the country list to appear and select Pakistan
    const pakistanOption = this.page.locator('li', { hasText: 'Pakistan' }).first();
    await pakistanOption.waitFor({ state: 'visible', timeout: 8000 });
    await pakistanOption.click();

    // Phone — random Pakistani number
    const phone = this.generatePakistaniPhone();
    await this.phoneField.fill(phone);
    console.log(`  → Phone used: ${phone}`);

    // Password
    await this.passwordField.fill(password);
  }

  /**
   * Click the reCAPTCHA checkbox.
   * Note: In a real headful run the reCAPTCHA is shown; this clicks the anchor.
   */
  async clickCaptcha() {
    // Switch to the reCAPTCHA iframe first
    const recaptchaFrame = this.page.frameLocator('iframe[title*="reCAPTCHA"]').first();
    const checkbox = recaptchaFrame.locator('#recaptcha-anchor');
    await checkbox.waitFor({ state: 'visible', timeout: 10000 });
    await checkbox.click();
    // Give it a moment to resolve
    await this.page.waitForTimeout(3000);
  }

  /** Click the Sign Up submit button. */
  async submit() {
    await this.signUpBtn.click();
  }
}

module.exports = { AgentSignUpPage };
