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
    
    // Yopmail renders email body inside the #ifmail iframe.
    // Keep the frame locator outside the loop because only its content changes.
    const mailFrame = page.frameLocator('#ifmail');
    let otpCode = null;
    // Poll inbox a few times because email delivery can be delayed.
    let retries = 5;
    
    while (retries > 0) {
      // Refresh inbox before each attempt to fetch newly delivered mail.
      const refreshButton = page.locator('#refresh');
      if (await refreshButton.isVisible()) {
        await refreshButton.click();
      }
      
      // Wait a moment for the new email to load into the iframe
      await page.waitForTimeout(3000);
      
      try {
        // Read the body plain text from the mail iframe
        const emailBody = await mailFrame.locator('body').innerText({ timeout: 5000 });
        
        // Extract the first standalone 6-digit OTP code from the email body.
        const match = emailBody.match(/\b\d{6}\b/);
        if (match) {
          otpCode = match[0];
          break;
        }
      } catch (error) {
        // If the iframe body is not ready yet, retry on the next loop iteration.
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
