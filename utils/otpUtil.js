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

/**
 * Open a Yopmail inbox and click the password-reset link contained in
 * the latest email.  Returns the new Playwright page that opens after
 * the link is clicked (the external reset-password form page).
 *
 * The function intentionally mirrors the Yopmail verification helper used
 * in agentSignup.spec.js so the polling/retry strategy is consistent.
 *
 * @param {import('@playwright/test').BrowserContext} context   - Playwright browser context.
 * @param {string}                                   email      - Full Yopmail address, e.g. ar0@yopmail.com
 * @returns {Promise<import('@playwright/test').Page>}           The reset-password page, ready to interact with.
 */
async function getResetPasswordLinkFromYopmail(context, email) {
  // Derive the inbox username from the full address
  const username = email.includes('@') ? email.split('@')[0] : email;

  // Open a fresh page for the Yopmail session (separate from the test page)
  const yopPage = await context.newPage();

  try {
    // Navigate to Yopmail and open the inbox
    await yopPage.goto('https://yopmail.com/en/', { waitUntil: 'domcontentloaded' });

    const loginInput = yopPage.locator('#login');
    await loginInput.waitFor({ state: 'visible' });
    await loginInput.fill(username);
    await loginInput.press('Enter');

    // Allow inbox to fully load before first poll attempt
    await yopPage.waitForLoadState('domcontentloaded');
    await yopPage.waitForTimeout(3000);

    // Yopmail renders email content inside the #ifmail iframe
    const mailFrame = yopPage.frameLocator('#ifmail');

    let resetPage = null;
    // Poll up to 8 times (each attempt waits ~5 s) to handle delayed delivery
    let retries = 8;

    while (retries > 0 && !resetPage) {
      // Refresh the inbox before each attempt to pick up newly delivered mail
      const refreshBtn = yopPage.locator('#refresh');
      if (await refreshBtn.isVisible()) {
        await refreshBtn.click();
        console.log(`  → Yopmail inbox refreshed (${retries} attempt(s) left)…`);
      }

      // Look for a link or button containing "reset" (case-insensitive)
      const resetLink = mailFrame.locator('a', { hasText: /reset/i }).first();

      try {
        if (await resetLink.isVisible({ timeout: 5000 })) {
          console.log('  → Reset password link found — clicking…');

          // Clicking the link opens the reset form in a new browser tab
          const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            resetLink.click(),
          ]);

          await newPage.waitForLoadState('domcontentloaded');
          resetPage = newPage;
        } else {
          // Email not yet delivered — wait before retrying
          await yopPage.waitForTimeout(5000);
        }
      } catch {
        // Frame/element not ready yet — retry on next iteration
        await yopPage.waitForTimeout(5000);
      }

      retries--;
    }

    if (!resetPage) {
      throw new Error(`Password-reset email not found in Yopmail inbox for: ${email}`);
    }

    return resetPage;
  } finally {
    // Always close the Yopmail tab to avoid context leaks
    await yopPage.close();
  }
}

/**
 * Open a Yopmail inbox, locate the latest reset-password email, and return
 * the href of the reset link WITHOUT clicking it.
 *
 * Use this when you need to capture a token URL before it gets invalidated
 * by a subsequent reset request (e.g. expired-token test).
 *
 * @param {import('@playwright/test').BrowserContext} context - Playwright browser context.
 * @param {string}                                   email   - Full Yopmail address.
 * @returns {Promise<string>}                                  The full href URL of the reset link.
 */
async function getResetPasswordHrefFromYopmail(context, email) {
  const username = email.includes('@') ? email.split('@')[0] : email;

  // Open a dedicated Yopmail tab — closing it in the finally block
  const yopPage = await context.newPage();

  try {
    await yopPage.goto('https://yopmail.com/en/', { waitUntil: 'domcontentloaded' });

    const loginInput = yopPage.locator('#login');
    await loginInput.waitFor({ state: 'visible' });
    await loginInput.fill(username);
    await loginInput.press('Enter');

    await yopPage.waitForLoadState('domcontentloaded');
    // Allow inbox to load after login
    await yopPage.waitForTimeout(3000);

    // Email content is inside Yopmail's #ifmail iframe
    const mailFrame = yopPage.frameLocator('#ifmail');

    let href = null;
    // Poll up to 8 times (~5 s each) to handle email delivery delays
    let retries = 8;

    while (retries > 0 && !href) {
      // Refresh inbox to pick up newly delivered mail
      const refreshBtn = yopPage.locator('#refresh');
      if (await refreshBtn.isVisible()) {
        await refreshBtn.click();
        console.log(`  → Yopmail refreshed — extracting href (${retries} attempt(s) left)…`);
      }

      await yopPage.waitForTimeout(3000);

      try {
        const resetLink = mailFrame.locator('a', { hasText: /reset/i }).first();
        if (await resetLink.isVisible({ timeout: 5000 })) {
          // Extract the href attribute — do NOT click so the token stays unused
          href = await resetLink.getAttribute('href');
          if (href) {
            console.log(`  → Reset link href captured: ${href}`);
          }
        }
      } catch {
        // iframe or link not ready yet — retry
      }

      retries--;
    }

    if (!href) {
      throw new Error(`Could not extract reset link href from Yopmail for: ${email}`);
    }

    return href;
  } finally {
    // Always close the Yopmail tab to avoid context leaks
    await yopPage.close();
  }
}

module.exports = { getOtpFromYopmail, getResetPasswordLinkFromYopmail, getResetPasswordHrefFromYopmail };
