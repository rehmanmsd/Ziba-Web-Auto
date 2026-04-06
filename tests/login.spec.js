require('dotenv').config();
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');

test('User should login successfully', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.navigate();
  await loginPage.login(process.env.USER_EMAIL, process.env.USER_PASSWORD);

  await expect(page).not.toHaveURL('/login');
});