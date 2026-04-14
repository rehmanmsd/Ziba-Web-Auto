const { LOCATORS } = require('../utils/locators');
const { expect }   = require('@playwright/test');

class AgentRolePage {
  constructor(page) {
    this.page = page;

    this.roleCreationUrl = 'https://ziba-property.com/register/agent/first';
    this.dashboardUrl    = 'https://ziba-property.com/home';

    this.companyName      = page.locator(LOCATORS.agentReqCompanyName);
    this.companyRegNo     = page.locator(LOCATORS.agentReqCompanyRegNo);
    this.companyEmail     = page.locator(LOCATORS.agentReqCompanyEmail);
    this.agentRegNo       = page.locator(LOCATORS.agentReqAgentRegNo);
    this.phone            = page.locator(LOCATORS.agentReqPhone);
    this.website          = page.locator(LOCATORS.agentReqWebsite);
    this.profileImage     = page.locator(LOCATORS.agentReqImageUpload);
    this.companyLogo      = page.locator(LOCATORS.agentReqCompanyLogoUpload);
    // Company Address — Google Maps autocomplete (no placeholder; found by label context)
    this.companyAddress   = page.locator(LOCATORS.agentReqAddressSearch).first();
    this.addressSaveBtn   = page.locator(LOCATORS.agentReqAddressSaveBtn);
    this.coveredLocation  = page.locator(LOCATORS.agentReqCoveredLocation);
    this.imageTickBtn     = page.locator(LOCATORS.agentReqImageTickBtn).first();
    this.submitBtn        = page.locator(LOCATORS.agentReqSubmitBtn);
    this.successOkBtn     = page.locator(LOCATORS.agentReqSuccessOkBtn);
  }

  async validateNavigation() {
    await this.page.waitForURL(this.roleCreationUrl, { timeout: 15000 });
    expect(this.page.url()).toBe(this.roleCreationUrl);
    console.log('On role creation page.');
    await this.companyAddress.waitFor({ state: 'visible', timeout: 30000 });
  }

  async fillAndSubmit({ companyName, companyRegNo, companyEmail, agentRegNo, phone, website, imagePath, logoPath, companyAddress, coveredLocation }) {
    console.log('Filling role creation form…');

    await this.companyName.fill(companyName);
    await this.companyRegNo.fill(companyRegNo);
    if (companyEmail) await this.companyEmail.fill(companyEmail);
    await this.agentRegNo.fill(agentRegNo);
    if (phone) await this.phone.fill(phone);
    await this.website.fill(website);

    // Company Address — use a fixed address and save it
    if (companyAddress) {
      await this.companyAddress.click();
      await this.companyAddress.fill(companyAddress);
      await this.addressSaveBtn.waitFor({ state: 'visible', timeout: 8000 });
      await this.addressSaveBtn.click();
      console.log('  → Company address filled and saved.');
    }

    // Profile image upload
    if (imagePath) {
      await this.profileImage.setInputFiles(imagePath);
      await this.imageTickBtn.waitFor({ state: 'visible', timeout: 10000 });
      await this.page.waitForTimeout(1500); // wait for cropper to render the image
      await this.imageTickBtn.click({ force: true });
      await this.page.waitForTimeout(1000);
      console.log('  → Profile image uploaded.');
    }

    // Company logo upload
    if (logoPath) {
      await this.companyLogo.setInputFiles(logoPath);
      await this.imageTickBtn.waitFor({ state: 'visible', timeout: 10000 });
      await this.page.waitForTimeout(1500);
      await this.imageTickBtn.click({ force: true });
      await this.page.waitForTimeout(1000);
      console.log('  → Company logo uploaded.');
    }

    // Covered location search (Google Maps autocomplete)
    if (coveredLocation) {
      await this.coveredLocation.click();
      await this.coveredLocation.pressSequentially(coveredLocation, { delay: 80 });
      try {
        const suggestion = this.page.locator('.pac-item').first();
        await suggestion.waitFor({ state: 'visible', timeout: 8000 });
        await suggestion.click();
        console.log('  → Covered location selected from autocomplete.');
      } catch {
        await this.coveredLocation.press('Enter');
        console.log('  → No suggestion, confirmed covered location with Enter.');
      }
    }

    await expect(this.submitBtn).toBeEnabled({ timeout: 5000 });
    await this.submitBtn.click();
    console.log('Form submitted.');
    await this.page.waitForTimeout(3000);
  }

  async verifySubmissionSuccess() {
    // Click the success popup OK button
    await this.successOkBtn.waitFor({ state: 'visible', timeout: 15000 });
    await this.successOkBtn.click();
    console.log('  → Success popup dismissed.');

    // After OK, the app redirects to the agent signup/profile page
    await this.page.waitForURL('https://ziba-property.com/agent/signup', { timeout: 15000 });
    console.log('✅ Role creation complete — test passed!');
  }
}

module.exports = { AgentRolePage };
