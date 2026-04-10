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
  agentSignUpBtn: '//*[@id="authForm"]/div/span/form/button',

  // Agent Request Form (After Verification)
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
};

module.exports = { LOCATORS };
