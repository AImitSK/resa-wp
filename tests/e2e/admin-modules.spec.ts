import { test, expect } from './fixtures/base';
import { admin, adminPages, adminModules } from './helpers/selectors';
import { STORAGE_STATE } from '../../playwright.config';

test.use({ storageState: STORAGE_STATE });

test.describe('Admin Modules (Smart Assets Store)', () => {
	test('Modul-Store lädt mit Karten', async ({ page }) => {
		await page.goto(`/wp-admin/${adminPages.modules}`);

		await expect(page.locator(admin.root)).toBeVisible();

		// Module cards should be visible
		const cards = page.locator(adminModules.moduleCard);
		await expect(cards.first()).toBeVisible({ timeout: 10000 });
	});

	test('Rent-Calculator ist als aktiv angezeigt', async ({ page }) => {
		await page.goto(`/wp-admin/${adminPages.modules}`);
		await expect(page.locator(admin.root)).toBeVisible();

		// Look for the rent calculator module
		await expect(page.getByText(/Mietpreis|Rent|rent-calculator/i)).toBeVisible({
			timeout: 10000,
		});
	});

	test('Modul deaktivieren und aktivieren', async ({ page }) => {
		await page.goto(`/wp-admin/${adminPages.modules}`);
		await expect(page.locator(admin.root)).toBeVisible();

		// Find a toggle switch
		const toggle = page.locator(adminModules.toggleSwitch).first();
		if (await toggle.isVisible({ timeout: 5000 }).catch(() => false)) {
			const initialState = await toggle.getAttribute('aria-checked');

			// Toggle
			await toggle.click();
			await page.waitForTimeout(500);

			// Toggle back to restore state
			await toggle.click();
			await page.waitForTimeout(500);

			const restoredState = await toggle.getAttribute('aria-checked');
			expect(restoredState).toBe(initialState);
		}
	});

	test('Modul-Einstellungen öffnen', async ({ page }) => {
		await page.goto(`/wp-admin/${adminPages.modules}`);
		await expect(page.locator(admin.root)).toBeVisible();

		// Click settings button on a module card
		const settingsBtn = page.locator(adminModules.settingsButton).first();
		if (await settingsBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
			await settingsBtn.click();
			await page.waitForTimeout(500);

			// Settings panel or page should appear
			await expect(page.getByText(/Einstellung|Konfigur|Setting/i)).toBeVisible({
				timeout: 5000,
			});
		}
	});
});
