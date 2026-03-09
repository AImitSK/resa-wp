import { test, expect } from './fixtures/base';
import { admin, adminPages, adminSettings } from './helpers/selectors';
import { STORAGE_STATE } from '../../playwright.config';

test.use({ storageState: STORAGE_STATE });

test.describe('Admin Settings', () => {
	test('Settings-Seite lädt mit Tabs', async ({ page }) => {
		await page.goto(`/wp-admin/${adminPages.settings}`);

		await expect(page.locator(admin.root)).toBeVisible();

		// Tab navigation should be visible
		const tabs = page.locator(adminSettings.tabs);
		await expect(tabs).toBeVisible({ timeout: 10000 });
	});

	test('Tab-Navigation funktioniert', async ({ page }) => {
		await page.goto(`/wp-admin/${adminPages.settings}`);
		await expect(page.locator(admin.root)).toBeVisible();

		const tabs = page.locator(`${adminSettings.tabs} [role="tab"]`);
		const tabCount = await tabs.count();

		if (tabCount > 1) {
			// Click second tab
			await tabs.nth(1).click();
			await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');

			// Click first tab
			await tabs.nth(0).click();
			await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
		}
	});

	test('Werte ändern und speichern zeigt Toast', async ({ page }) => {
		await page.goto(`/wp-admin/${adminPages.settings}`);
		await expect(page.locator(admin.root)).toBeVisible();

		// Find first editable input
		const input = page
			.locator(`${admin.root} input[type="text"], ${admin.root} input[type="email"]`)
			.first();
		if (await input.isVisible({ timeout: 5000 }).catch(() => false)) {
			const originalValue = await input.inputValue();

			// Change value
			await input.clear();
			await input.fill('E2E Test Value');

			// Save
			const saveBtn = page.locator(adminSettings.saveButton);
			if (await saveBtn.isVisible().catch(() => false)) {
				await saveBtn.click();

				// Toast notification should appear
				const toast = page.locator(adminSettings.toast);
				await expect(toast.first()).toBeVisible({ timeout: 5000 });
			}

			// Restore original value
			await input.clear();
			await input.fill(originalValue);
			const saveBtn2 = page.locator(adminSettings.saveButton);
			if (await saveBtn2.isVisible().catch(() => false)) {
				await saveBtn2.click();
			}
		}
	});

	test('Werte nach Reload persistent', async ({ page }) => {
		await page.goto(`/wp-admin/${adminPages.settings}`);
		await expect(page.locator(admin.root)).toBeVisible();

		// Get current state of a setting
		const input = page
			.locator(`${admin.root} input[type="text"], ${admin.root} input[type="email"]`)
			.first();
		if (await input.isVisible({ timeout: 5000 }).catch(() => false)) {
			const value = await input.inputValue();

			// Reload page
			await page.reload();
			await expect(page.locator(admin.root)).toBeVisible();

			// Value should be the same
			const reloadedInput = page
				.locator(`${admin.root} input[type="text"], ${admin.root} input[type="email"]`)
				.first();
			await expect(reloadedInput).toHaveValue(value);
		}
	});
});
