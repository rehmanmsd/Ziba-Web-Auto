require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { AgentSignUpPage } = require('../pages/AgentSignUpPage');

/**
 * Signup Only Flow
 * Handles user registration and stops after email verification.
 */

const timestamp = Date.now();
const agentEmail = `agent_signup_${timestamp}@yopmail.com`;
const agentName = 'Signup Only Agent';
const agentPass = '12345678';

test.describe('Agent Registration — Signup Only', () => {
  test.slow();
  test.describe.configure({ timeout: 120_000 });

  let agentSignUpPage;

  test.beforeEach(async ({ page }) => {
    agentSignUpPage = new AgentSignUpPage(page);
    await agentSignUpPage.navigate();
  });

  test('Should complete registration and reach verification state', async ({
    page,
    context,
  }) => {
    console.log(`Starting signup for: ${agentEmail}`);
    
    await agentSignUpPage.selectRealEstateAgentRole();
    await agentSignUpPage.fillAgentForm(agentName, agentEmail, agentPass);
    await agentSignUpPage.clickCaptcha();
    await agentSignUpPage.submit();

    console.log('Registration submitted. Checking for email verification page…');
    
    // Success criteria for this step: 
    // Either stays on the page showing "check your email" or reaches the OTP screen
    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    
    expect(currentUrl).toContain('otp');
    console.log('✅ Signup flow completed successfully!');
  });
});
