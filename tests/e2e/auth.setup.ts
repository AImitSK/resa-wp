import { test as setup, expect } from '@playwright/test';
import { wp } from './helpers/selectors';
import { STORAGE_STATE } from '../../playwright.config';

setup('authenticate as admin', async ({ page }) => {
	const username = process.env.WP_ADMIN_USER || 'admin';
	const password = process.env.WP_ADMIN_PASSWORD || 'admin';

	await page.goto('/wp-login.php');
	await page.locator(wp.usernameInput).fill(username);
	await page.locator(wp.passwordInput).fill(password);
	await page.locator(wp.loginButton).click();

	// Wait for redirect to wp-admin
	await page.waitForURL('**/wp-admin/**');
	await expect(page.locator(wp.adminBar)).toBeVisible();

	// Save auth state
	await page.context().storageState({ path: STORAGE_STATE });
});
