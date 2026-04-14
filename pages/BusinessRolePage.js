const { LOCATORS } = require('../utils/locators');
const { expect }   = require('@playwright/test');

class BusinessRolePage {
  constructor(page) {
    this.page = page;

    this.roleCreationUrl = 'https://ziba-property.com/register/vendor/first';
    this.successUrl      = 'https://ziba-property.com/congratulation/new-user';

    this.businessName     = page.locator(LOCATORS.bsBusinessName);
    this.categoryInput    = page.locator(LOCATORS.bsCategoryInput);
    this.imageUploadTrigger = page.locator(LOCATORS.bsImageUploadTrigger);
    // For address - country dropdown
    this.countryDropdown  = page.locator(LOCATORS.bsCountryDropdown);
    this.addressInput     = page.locator(LOCATORS.bsAddressInput);
    this.addressSuggestion = page.locator(LOCATORS.bsAddressSuggestion);
    this.addressSaveBtn   = page.locator(LOCATORS.bsAddressSaveBtn);
    this.submitBtn        = page.locator(LOCATORS.bsSubmitBtn);
    this.successOkBtn     = page.locator('xpath=/html/body/div[3]/div[7]/div/button');
  }

  async validateNavigation() {
    await this.page.waitForURL(this.roleCreationUrl, { timeout: 15000 });
    expect(this.page.url()).toBe(this.roleCreationUrl);
    console.log('On vendor role creation page.');
    await this.businessName.waitFor({ state: 'visible', timeout: 30000 });
  }

  async fillAndSubmit({ businessName, category, imagePath, address }) {
    console.log('Filling vendor role creation form…');

    await this.businessName.fill(businessName);

    // Select business category
    if (category) {
      await this.categoryInput.click();
      await this.categoryInput.fill(category);
      await this.page.waitForTimeout(1000);
      // Select first option from dropdown
      const firstOption = this.page.locator('.vs__dropdown-option').first();
      await firstOption.waitFor({ state: 'visible', timeout: 5000 });
      await firstOption.click();
      console.log('  → Business category selected.');
    }

    // Image upload - direct upload without clicking trigger
    if (imagePath) {
      const imageInput = this.page.locator('input[type="file"]').first();
      await imageInput.setInputFiles(imagePath);
      console.log('  → Business image upload initiated, waiting for upload to complete…');
      await this.page.waitForTimeout(10000); // Wait for image to upload and process completely
      console.log('  → Business image uploaded successfully.');
    }

    // Address selection — use the fixed address, select suggestion, save it
    if (address) {
      await this.countryDropdown.click();
      const pakistanOption = this.page.locator('li', { hasText: 'Pakistan' }).first();
      await pakistanOption.waitFor({ state: 'visible', timeout: 8000 });
      await pakistanOption.click();
      console.log('  → Country selected as Pakistan.');

      await this.addressInput.fill(address);
      await this.page.waitForTimeout(2000);
      await this.addressSuggestion.waitFor({ state: 'visible', timeout: 10000 });
      await this.addressSuggestion.click();
      console.log('  → Address suggestion selected.');
      await this.page.waitForTimeout(2000);
      await this.addressSaveBtn.waitFor({ state: 'visible', timeout: 8000 });
      await this.addressSaveBtn.click();
      console.log('  → Address filled and saved.');
    }

    // Wait for images to be fully processed before submitting
    console.log('Waiting for all uploads to complete before submitting form…');
    await this.page.waitForTimeout(3000);
    
    // Submit the form
    await expect(this.submitBtn).toBeEnabled({ timeout: 5000 });
    await this.submitBtn.click();
    console.log('Form submitted.');
    await this.page.waitForTimeout(2000);
  }

  async verifySubmissionSuccess() {
    // Wait for success popup to appear
    console.log('Waiting for success popup…');
    await this.successOkBtn.waitFor({ state: 'visible', timeout: 20000 });
    console.log('  → Success popup appeared.');
    
    // Click the OK button on success popup
    await this.successOkBtn.click();
    console.log('  → Success popup OK button clicked.');
    
    // Wait for page navigation after clicking OK
    await this.page.waitForTimeout(5000);
    console.log(`  → Current URL after OK click: ${this.page.url()}`);
    
    // Wait for redirect to congratulation page
    await this.page.waitForURL(this.successUrl, { timeout: 30000 });
    expect(this.page.url()).toBe(this.successUrl);
    console.log('✅ Business role creation successful! Redirected to congratulation page.');
  }
}

module.exports = { BusinessRolePage };