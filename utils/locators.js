const LOCATORS = {
  // Central selector map used by page objects.
  // Keep keys semantic (intent-based) so tests remain readable.

  // Navigation / Header Dropdown
  landingPageLoginSignupBtn: '//*[@id="page-top"]/header/div/div/div[3]/div[3]/div',
  loginLink: '//*[@id="page-top"]/header/div/div/div[3]/div[3]/ul/li[1]/a',
  signupLink: '//*[@id="page-top"]/header/div/div/div[3]/div[3]/ul/li[2]/a',
  realEstateAgentLink: '//*[@id="page-top"]/header/div/div/div[3]/div[3]/ul/li[5]/a',
  businessAndServiceLink: '//*[@id="page-top"]/header/div/div/div[3]/div[3]/ul/li[6]/a',

  // Authentication Form (Login / Signup)
  emailField: '//*[@id="authForm"]/div/form/div[1]/div/input',
  passwordField: '//*[@id="authForm"]/div/form/div[2]/div/input',
  continueToZibaPropertyBtn: '//*[@id="authForm"]/div/form/button',
  continueWithOtp: '//*[@id="authForm"]/div/form/div[4]',
  sendOtpBtn: '//*[@id="authForm"]/div/form/button',
  continueWithPassword: '//*[@id="authForm"]/div/form/div[3]/span',
  signupBtnOnLoginScreen: '//*[@id="login-btn"]',

  // Agent Sign Up Form
  agentNameField: '//*[@id="authForm"]/div/span/form/span[2]/div/div/input',
  agentEmailField: '//*[@id="authForm"]/div/span/form/span[3]/div/div/input',
  agentPhoneCountryDropdown: '//*[@id="authForm"]/div/span/form/span[4]/div/div/div',
  agentPhoneField: '//*[@id="authForm"]/div/span/form/span[4]/div/div/input',
  agentPasswordField: '//*[@id="authForm"]/div/span/form/span[5]/div/div/input',
  agentSignUpBtn: '//*[@id="authForm"]/div/span/form/button',

  // Agent Request Form (After Verification)
  // Mixed strategy: CSS for stable inputs, XPath where DOM structure is highly nested.
  agentReqCompanyName: 'input[placeholder="e.g. My Property Agency"]',
  agentReqCompanyRegNo: 'input[placeholder="e.g. VE (3) 0170"]',
  agentReqCompanyEmail: 'input[type="email"][placeholder*="youremail"]',
  agentReqAgentRegNo: 'input[placeholder="e.g. REN12345"]',
  agentReqPhone: 'input[placeholder="XXXX XXXXXXX"]',
  agentReqWebsite: 'input[placeholder="e.g. www.mywebsite.com"]',
  agentReqImageUpload: 'input[name="profileimage"]',
  agentReqCompanyLogoUpload: 'input[name="company_logo"]',
  agentReqCoveredLocation: 'input[placeholder="e.g. Millennium Technology Park"]',
  agentReqAddressSearch: '//div[contains(@class, "form-group")][contains(., "Company Address")]//input',
  agentReqAddressSaveBtn: '//*[@id="agentRequestForm"]/div[1]/div[7]/div[1]/div/div[1]/div[1]/div/span[2]/div/div/div/span[2]',
  agentReqImageTickBtn: '//*[starts-with(@id, "cropperButtonConfirm")]',
  agentReqSubmitBtn: 'button.button-submit',
  agentReqSuccessOkBtn: 'xpath=/html/body/div[3]/div[7]/div/button',

  // Post-Login Navigation
  agentContinueBtn: '//*[@id="loggedin-container"]/div[1]/div/div/span[2]/a',

  // ─────────────────────────────────────────────────────────────────────────
  // Forgot / Reset Password Flow
  // ─────────────────────────────────────────────────────────────────────────

  // "Forgot password?" link on the /login auth form (switches form to reset mode)
  forgotPasswordLink: '//*[@id="authForm"]/div/form/div[3]/span',

  // Email input on the "Forgot Password" form (same #authForm, same field)
  forgotPasswordEmailInput: '//*[@id="authForm"]/div/form/div[1]/div/input',

  // "Send Reset Email" submit button on the Forgot Password form
  sendResetEmailBtn: '//*[@id="authForm"]/div/form/button',

  // ─────────────────────────────────────────────────────────────────────────
  // Reset Password Page (external password-reset form)
  // Route: /reset-password  (opened via link in Yopmail)
  // ─────────────────────────────────────────────────────────────────────────

  // Email field on the external reset-password page
  resetPasswordEmailInput: '//*[@id="email"]',

  // New password field
  resetPasswordNewPassword: '//*[@id="password"]',

  // Confirm new password field
  resetPasswordConfirm: '//*[@id="password-confirm"]',

  // "Reset Password" submit button
  resetPasswordSubmitBtn: '//*[@id="div75"]/div[2]/form/div[5]/div[2]',

  // ─────────────────────────────────────────────────────────────────────────
  // Business & Service — Vendor Role Form (after verification)
  // ─────────────────────────────────────────────────────────────────────────
  bsBusinessName: '//*[@id="mainFormVue"]/div/div[2]/span/form/div[1]/div/div[1]/span/div/input',
  bsCategoryInput: '//*[@id="vs1__combobox"]/div[1]/input',
  bsImageUploadTrigger: '//*[@id="all-vacancy-uploaders"]/div[1]/div[1]/div[2]/div/div/div/p[1]/span',
  bsCountryDropdown: '//*[@id="mainFormVue"]/div/div[2]/span/form/div[1]/div/div[11]/div/div[1]/div[1]/div/span[1]/span/span[1]/span',
  bsAddressInput: '//*[@id="mainFormVue"]/div/div[2]/span/form/div[1]/div/div[11]/div/div[1]/div[1]/div/span[2]/div/input',
  bsAddressSuggestion: '//*[@id="mainFormVue"]/div/div[2]/span/form/div[1]/div/div[11]/div/div[1]/div[1]/div/span[2]/div/ul/li[4]',
  bsAddressSaveBtn: '//*[@id="mainFormVue"]/div/div[2]/span/form/div[1]/div/div[11]/div/div[1]/div[1]/div/span[2]/div/div/div/span[2]',
  bsSubmitBtn: '//*[@id="mainFormVue"]/div/div[2]/span/form/div[2]/div/div/div/button[2]',
};

module.exports = { LOCATORS };
