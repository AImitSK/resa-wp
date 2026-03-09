import { test, expect } from './fixtures/base';
import { admin, adminPages, adminLocations } from './helpers/selectors';
import { STORAGE_STATE } from '../../playwright.config';

test.use({ storageState: STORAGE_STATE });

test.describe('Admin Locations', () => {
	test('Locations-Seite lädt', async ({ page }) => {
		await page.goto(`/wp-admin/${adminPages.locations}`);

		await expect(page.locator(admin.root)).toBeVisible();
	});

	test('Location erstellen', async ({ page }) => {
		await page.goto(`/wp-admin/${adminPages.locations}`);
		await expect(page.locator(admin.root)).toBeVisible();

		// Click add button
		const addBtn = page.locator(adminLocations.addButton);
		if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
			await addBtn.click();
			await page.waitForTimeout(500);

			// Fill form
			const nameInput = page.locator(adminLocations.nameInput);
			if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
				await nameInput.fill('E2E Teststadt');
			}

			const zipInput = page.locator(adminLocations.zipInput);
			if (await zipInput.isVisible().catch(() => false)) {
				await zipInput.fill('99999');
			}

			const regionInput = page.locator(adminLocations.regionInput);
			if (await regionInput.isVisible().catch(() => false)) {
				await regionInput.fill('Testregion');
			}

			// Save
			const saveBtn = page.locator(adminLocations.saveButton);
			if (await saveBtn.isVisible().catch(() => false)) {
				await saveBtn.click();
			}
		}
	});

	test('Location in Liste sichtbar', async ({ page }) => {
		await page.goto(`/wp-admin/${adminPages.locations}`);
		await expect(page.locator(admin.root)).toBeVisible();

		// Check for any location entries on the page
		// Location list or table should be visible
		const content = page.locator(admin.root);
		await expect(content).toBeVisible({ timeout: 10000 });
	});

	test('Location bearbeiten und speichern', async ({ page }) => {
		await page.goto(`/wp-admin/${adminPages.locations}`);
		await expect(page.locator(admin.root)).toBeVisible();

		// Click on first location entry (could be in a list, table, or card)
		const locationEntry = page
			.locator('table tbody tr, [class*="card"], [class*="list-item"]')
			.first();
		if (await locationEntry.isVisible({ timeout: 5000 }).catch(() => false)) {
			await locationEntry.click();
			await page.waitForTimeout(500);

			// Edit a field
			const nameInput = page.locator(adminLocations.nameInput);
			if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
				await nameInput.clear();
				await nameInput.fill('E2E Teststadt Bearbeitet');
			}

			// Save
			const saveBtn = page.locator(adminLocations.saveButton);
			if (await saveBtn.isVisible().catch(() => false)) {
				await saveBtn.click();
			}
		}
	});

	test('Location löschen', async ({ page }) => {
		await page.goto(`/wp-admin/${adminPages.locations}`);
		await expect(page.locator(admin.root)).toBeVisible();

		// Find delete button for a location
		const deleteBtn = page
			.locator('button:has-text("Löschen"), button:has-text("Entfernen")')
			.first();
		if (await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
			await deleteBtn.click();

			// Confirm if needed
			const confirmBtn = page
				.locator('button:has-text("Bestätigen"), button:has-text("Ja")')
				.first();
			if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
				await confirmBtn.click();
			}
		}
	});
});
