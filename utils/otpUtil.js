/**
 * Utility to fetch the latest OTP from a Yopmail inbox.
 *
 * @param {import('@playwright/test').BrowserContext} context - Playwright browser context.
 * @param {string} emailUsername - The yopmail address or just the prefix.
 * @returns {Promise<string>} The 6-digit OTP code extracted from the email.
 */
async function getOtpFromYopmail(context, emailUsername) {
  // Extract username if a full email is passed
  const username = emailUsername.includes('@') ? emailUsername.split('@')[0] : emailUsername;
  
  // Open a new browser page
  const page = await context.newPage();
  
  try {
    // Navigate to Yopmail
    await page.goto('https://yopmail.com/en/', { waitUntil: 'domcontentloaded' });
    
    // Enter the email username and go to the inbox
    const loginInput = page.locator('#login');
    await loginInput.waitFor({ state: 'visible' });
    await loginInput.fill(username);
    
    // Wait a brief moment to perform actions slightly slower as requested
    await page.waitForTimeout(1000);
    await loginInput.press('Enter');
    
    // Give it a slightly longer moment for the inbox to initially load
    await page.waitForTimeout(3000);
    
    const mailFrame = page.frameLocator('#ifmail');
    let otpCode = null;
    let retries = 5;
    
    while (retries > 0) {
      // Click the refresh button to fetch the latest email
      const refreshButton = page.locator('#refresh');
      if (await refreshButton.isVisible()) {
        await refreshButton.click();
      }
      
      // Wait a moment for the new email to load into the iframe
      await page.waitForTimeout(3000);
      
      try {
        // Read the body plain text from the mail iframe
        const emailBody = await mailFrame.locator('body').innerText({ timeout: 5000 });
        
        // Extract 6-digit OTP
        const match = emailBody.match(/\b\d{6}\b/);
        if (match) {
          otpCode = match[0];
          break;
        }
      } catch (error) {
        // Handled: If the frame or body isn't ready or doesn't have the OTP yet, we catch and retry
      }
      
      retries--;
    }
    
    if (!otpCode) {
      throw new Error(`Failed to extract 6-digit OTP for ${emailUsername} after multiple retries.`);
    }
    
    return otpCode;
  } finally {
    // Always close the page to clean up the context
    await page.close();
  }
}

module.exports = { getOtpFromYopmail };
