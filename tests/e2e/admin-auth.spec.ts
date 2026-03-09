import { test, expect } from '@playwright/test';
import { wp, admin, adminPages } from './helpers/selectors';

// Diese Tests verwenden KEINE storageState — sie testen den Login selbst.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Admin Authentication', () => {
	test('erfolgreicher Login leitet zu wp-admin weiter', async ({ page }) => {
		await page.goto('/wp-login.php');
		await page.locator(wp.usernameInput).fill('admin');
		await page.locator(wp.passwordInput).fill('admin');
		await page.locator(wp.loginButton).click();

		await page.waitForURL('**/wp-admin/**');
		await expect(page.locator(wp.adminBar)).toBeVisible();
	});

	test('RESA-Menüpunkte sind nach Login sichtbar', async ({ page }) => {
		// Login
		await page.goto('/wp-login.php');
		await page.locator(wp.usernameInput).fill('admin');
		await page.locator(wp.passwordInput).fill('admin');
		await page.locator(wp.loginButton).click();
		await page.waitForURL('**/wp-admin/**');

		// Navigate to RESA dashboard
		await page.goto(`/wp-admin/${adminPages.dashboard}`);

		// Check RESA admin root loads
		await expect(page.locator(admin.root)).toBeVisible();
	});

	test('fehlerhafter Login zeigt Fehlermeldung', async ({ page }) => {
		await page.goto('/wp-login.php');
		await page.locator(wp.usernameInput).fill('admin');
		await page.locator(wp.passwordInput).fill('wrongpassword');
		await page.locator(wp.loginButton).click();

		await expect(page.locator(wp.loginError)).toBeVisible();
	});

	test('Logout leitet zu Login-Seite', async ({ page }) => {
		// Login first
		await page.goto('/wp-login.php');
		await page.locator(wp.usernameInput).fill('admin');
		await page.locator(wp.passwordInput).fill('admin');
		await page.locator(wp.loginButton).click();
		await page.waitForURL('**/wp-admin/**');

		// Find and click logout
		// WordPress logout is behind a confirmation page
		const logoutUrl = await page.locator(wp.logoutLink).first().getAttribute('href');
		if (logoutUrl) {
			await page.goto(logoutUrl);
		}

		// Should be redirected to login or logged-out page
		await expect(page).toHaveURL(/wp-login\.php|loggedout/);
	});

	test('unautorisierter Zugriff auf RESA leitet zu Login', async ({ page }) => {
		// Try to access admin page without auth
		await page.goto(`/wp-admin/${adminPages.leads}`);

		// WordPress redirects to login
		await expect(page).toHaveURL(/wp-login\.php/);
	});
});
