const LOCATORS = {
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
  captchaCheckbox: '//*[@id="recaptcha-anchor"]/div[1]',
  agentSignUpBtn: '//*[@id="authForm"]/div/span/form/button',
};

module.exports = { LOCATORS };
