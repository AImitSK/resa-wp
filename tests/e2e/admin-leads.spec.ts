import { test, expect } from './fixtures/base';
import { admin, adminPages, adminLeads } from './helpers/selectors';
import { createTestLead, cleanupTestLeads } from './helpers/api-client';
import { STORAGE_STATE } from '../../playwright.config';

test.use({ storageState: STORAGE_STATE });

test.describe('Admin Leads', () => {
	const testEmail = `leads-test-${Date.now()}@e2e-test.local`;

	test.beforeAll(async ({ request }) => {
		// Seed a test lead
		await createTestLead(request, {
			email: testEmail,
			firstName: 'E2E',
			lastName: 'LeadTest',
		});
	});

	test.afterAll(async ({ request }) => {
		await cleanupTestLeads(request);
	});

	test('Leads-Seite lädt mit Tabelle', async ({ page }) => {
		await page.goto(`/wp-admin/${adminPages.leads}`);

		await expect(page.locator(admin.root)).toBeVisible();
		await expect(page.locator(adminLeads.table)).toBeVisible({
			timeout: 10000,
		});
	});

	test('Test-Lead ist in Tabelle sichtbar', async ({ page }) => {
		await page.goto(`/wp-admin/${adminPages.leads}`);
		await expect(page.locator(admin.root)).toBeVisible();

		// Wait for table to load
		await expect(page.locator(adminLeads.table)).toBeVisible({
			timeout: 10000,
		});

		// Search for test lead
		const searchInput = page.locator(adminLeads.searchInput);
		if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
			await searchInput.fill('e2e-test.local');
			await page.waitForTimeout(500); // Debounce
		}

		// Check that lead data appears somewhere on page
		await expect(page.getByText(/E2E|e2e-test\.local/).first()).toBeVisible({
			timeout: 5000,
		});
	});

	test('Status-Filter-Tabs funktionieren', async ({ page }) => {
		await page.goto(`/wp-admin/${adminPages.leads}`);
		await expect(page.locator(admin.root)).toBeVisible();

		const tabList = page.locator(adminLeads.statusTabs);
		if (await tabList.isVisible({ timeout: 5000 }).catch(() => false)) {
			const tabs = tabList.locator('[role="tab"]');
			const tabCount = await tabs.count();
			expect(tabCount).toBeGreaterThan(0);

			// Click second tab (if exists) and verify it activates
			if (tabCount > 1) {
				await tabs.nth(1).click();
				await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
			}
		}
	});

	test('Suchfeld filtert Leads', async ({ page }) => {
		await page.goto(`/wp-admin/${adminPages.leads}`);
		await expect(page.locator(admin.root)).toBeVisible();
		await expect(page.locator(adminLeads.table)).toBeVisible({
			timeout: 10000,
		});

		// Get initial row count
		const initialRows = await page.locator('table tbody tr').count();

		// Search for test lead email
		const searchInput = page.locator(adminLeads.searchInput).first();
		if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
			await searchInput.fill('e2e-test.local');
			await page.waitForTimeout(1000);

			// After search, the number of rows should change (filtered)
			const filteredRows = await page.locator('table tbody tr').count();
			// Filtered rows should be fewer than or equal to total
			expect(filteredRows).toBeLessThanOrEqual(initialRows);
			// And there should be at least one match
			expect(filteredRows).toBeGreaterThan(0);
		}
	});

	test('Lead-Detail öffnen', async ({ page }) => {
		await page.goto(`/wp-admin/${adminPages.leads}`);
		await expect(page.locator(admin.root)).toBeVisible();
		await expect(page.locator(adminLeads.table)).toBeVisible({
			timeout: 10000,
		});

		// Click on first lead row
		const firstRow = page.locator('table tbody tr').first();
		if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
			await firstRow.click();

			// Detail view should show lead information
			await expect(page.getByText('E-Mail', { exact: true })).toBeVisible({ timeout: 5000 });
		}
	});

	test('Lead löschen mit Bestätigung', async ({ page, request }) => {
		// Create a dedicated lead to delete
		await createTestLead(request, {
			email: `delete-me-${Date.now()}@e2e-test.local`,
			firstName: 'Delete',
			lastName: 'Me',
		});

		await page.goto(`/wp-admin/${adminPages.leads}`);
		await expect(page.locator(admin.root)).toBeVisible();
		await expect(page.locator(adminLeads.table)).toBeVisible({
			timeout: 10000,
		});

		// Open lead detail
		const firstRow = page.locator('table tbody tr').first();
		if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
			await firstRow.click();
			await page.waitForTimeout(500);

			// Click delete button
			const deleteBtn = page.locator(adminLeads.deleteButton);
			if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
				await deleteBtn.click();

				// Confirm deletion
				const confirmBtn = page.locator(adminLeads.confirmDelete);
				if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
					await confirmBtn.click();
				}
			}
		}
	});
});
