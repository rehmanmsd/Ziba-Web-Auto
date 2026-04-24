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

  // Validation error shown under the email field when the reset token is
  // expired or already used — text-based selector is intentional so it
  // matches regardless of the wrapping element tag.
  resetPasswordInvalidTokenError: 'text=This password reset token is invalid.',

  // Error shown on the Forgot Password form when the submitted email is not
  // associated with any account in the system.
  forgotPasswordUnregisteredEmailError: 'text=We can\'t find a user with that email address.',

  // ─────────────────────────────────────────────────────────────────────────
  // Change Password Flow  (logged-in user → Profile → Change Password)
  // ─────────────────────────────────────────────────────────────────────────

  // Profile avatar button in the top-right header — opens the user sidebar
  profileAvatar: '//*[@id="profile-avatar"]',

  // "My Profile" link inside the sidebar panel
  myProfileLink: '//*[@id="sidebardata"]/div/ul/div[2]/div[1]/div/ul/a[1]/li',

  // "Change Password" tab on the Profile page
  changePasswordTab: '//*[@id="profileVue"]/div[1]/div[2]/div/ul/li[6]/a',

  // Current (old) password input on the Change Password form
  cpOldPassword: '//*[@id="password-form"]/span[1]/div/input',

  // New password input
  cpNewPassword: '//*[@id="password-form"]/span[2]/div/input',

  // Confirm new password input — must match cpNewPassword
  cpConfirmPassword: '//*[@id="password-form"]/span[3]/div/input',

  // "Change Password" submit button
  cpSubmitBtn: '//*[@id="password-form"]/button',

  // Success notification shown after a successful password change.
  // Text-based selector matches the app's toast/alert regardless of wrapper tag.
  cpSuccessMessage: 'text=Password changed successfully',

  // Error shown when the entered old password does not match the stored password
  cpIncorrectOldPasswordError: 'text=Please Enter Correct Old Password',

  // Validation message shown when the new password is the same as the old one.
  // Update the text if the app message changes.
  cpSamePasswordError: '//*[@id="password-form"]//span[contains(@class,"error") or contains(@class,"invalid") or contains(@class,"help")]',

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

  // ─────────────────────────────────────────────────────────────────────────
  // Delete / Remove Individual Role  (Profile → As Individual User tab)
  // ─────────────────────────────────────────────────────────────────────────

  // Cookie/promo banner "Accept" button shown on site launch
  cookieAcceptBtn: '//*[@id="page-top"]/div[4]/div/div/div/a[1]',

  // "As Individual User" tab link on the Profile page
  individualUserTab: '//*[@id="profileVue"]/div[2]/div/div[1]/ul/li[2]/a',

  // "Remove Role" button inside the Individual tab panel
  individualRemoveRoleBtn: '//*[@id="individualTab"]/div/div/ul/li[2]/button',

  // "Remove" button inside the confirmation dialog
  individualConfirmRemoveBtn: '//*[@id="loggedin-container"]/div[5]/div[7]/div/button',

  // ─────────────────────────────────────────────────────────────────────────
  // Delete / Remove Agent Role  (Profile → As Agent tab)
  // ─────────────────────────────────────────────────────────────────────────

  // "As Agent" tab link on the Profile page
  agentTab: '//*[@id="profileVue"]/div[2]/div/div[1]/ul/li[2]/a',

  // "Remove Role" button inside the Agent (Vendor) tab panel
  agentRemoveRoleBtn: '//*[@id="withDataVendor"]/div[2]/div[2]/button',

  // "Remove" confirmation button inside the dialog
  agentConfirmRemoveBtn: '//*[@id="loggedin-container"]/div[5]/div[7]/div/button',

  // ─────────────────────────────────────────────────────────────────────────
  // Delete / Remove Business & Service Role  (Profile → As Business & Service tab)
  // ─────────────────────────────────────────────────────────────────────────

  // "As Business & Service" tab link on the Profile page
  businessTab: '//*[@id="vendor_tab_title"]/a',

  // "Remove Role" button inside the Business & Service tab panel
  businessRemoveRoleBtn: '//*[@id="withDataVendor"]/div[2]/button',

  // "Yes, remove it!" confirmation button inside the dialog
  businessConfirmRemoveBtn: '//*[@id="loggedin-container"]/div[5]/div[7]/div/button',

  // ─────────────────────────────────────────────────────────────────────────
  // Delete Account  (Profile → Remove Account after all roles removed)
  // ─────────────────────────────────────────────────────────────────────────

  // "Remove Account" button on the Profile page (visible after all roles are removed)
  removeAccountBtn: '//*[@id="profile-form"]/div/div[2]/ul/li[2]/button',

  // "Delete Account" confirmation button in the dialog
  deleteAccountConfirmBtn: '//*[@id="loggedin-container"]/div[5]/div[7]/div/button',

  // ─────────────────────────────────────────────────────────────────────────
  // Side Blue Panel  (logged-in user — left sidebar navigation)
  // ─────────────────────────────────────────────────────────────────────────

  // Top section — collapsible menu (hamburger) icon
  sbMenuIcon:        '//*[@id="sidebardata"]/div/div[1]/div',

  // Top-level navigation links
  sbDashboard:       '//*[@id="sidebardata"]/div/ul/li[1]/a',
  sbNeighborhood:    '//*[@id="sidebardata"]/div/ul/li[2]/a',

  // Sub-items revealed after expanding "Neighborhood"
  // Scoped under the Neighborhood <li> so they cannot match items in the
  // profile section (which also contains an "Add a New Buy-Sell-Wanted" link).
  sbPropertyListings:    '//*[@id="sidebardata"]/div/ul/li[2]//a[contains(normalize-space(.),"Property Listings")]',
  sbBusinessesServices:  '//*[@id="sidebardata"]/div/ul/li[2]//a[contains(normalize-space(.),"Businesses")]',
  sbBuySellWanted:       '//*[@id="sidebardata"]/div/ul/li[2]//a[@href="/buyandsell/list"]',
  sbFindAgents:          '//*[@id="sidebardata"]/div/ul/li[2]//a[contains(normalize-space(.),"Find Agents")]',

  // Lower section — FAQ link
  sbFaq: '//*[@id="sidebardata"]/div/ul/div[1]/a',

  // Image container used to collapse / expand the lower profile section
  sbProfileImageContainer: '//*[@id="sidebardata"]/div/ul/div[2]',

  // Items revealed inside the expanded profile image container
  sbMyProfile:        '//*[@id="sidebardata"]/div/ul/div[2]/div[1]/div/ul/a[1]/li',
  sbManageRole:       '//*[@id="sidebardata"]/div/ul/div[2]/div[1]/div/ul/a[2]',
  sbAddBuySellWanted: '//*[@id="sidebardata"]/div/ul/div[2]/div[1]/div/ul/a[3]/li',
  sbLogout:           '//*[@id="sidebardata"]/div/ul/div[2]/div[1]/ul/a/li',

  // ── Role entries inside the profile section ─────────────────────────
  // Each role <li> contains 3 anchors:
  //   a[1] → role name (click to select / activate the role)
  //   a[2] → "Add New Property" shortcut
  //   a[3] → CRM (opens external CRM dashboard in a new tab)
  // Locators are scoped by the visible role name so they remain stable
  // even if the role's index inside the list changes.
  sbRoleItem:           (roleName) => `//*[@id="sidebardata"]/div/ul/div[2]/div[1]/div/ul/li[.//*[contains(normalize-space(.),"${roleName}")]]`,
  sbRoleSelect:         (roleName) => `//*[@id="sidebardata"]/div/ul/div[2]/div[1]/div/ul/li[.//*[contains(normalize-space(.),"${roleName}")]]/a[1]`,
  sbRoleAddProperty:    (roleName) => `//*[@id="sidebardata"]/div/ul/div[2]/div[1]/div/ul/li[.//*[contains(normalize-space(.),"${roleName}")]]/a[2]`,
  sbRoleCrm:            (roleName) => `//*[@id="sidebardata"]/div/ul/div[2]/div[1]/div/ul/li[.//*[contains(normalize-space(.),"${roleName}")]]/a[3]`,
};

module.exports = { LOCATORS };
