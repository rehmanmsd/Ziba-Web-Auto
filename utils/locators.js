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
};

module.exports = { LOCATORS };
