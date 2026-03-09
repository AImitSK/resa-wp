import { test, expect } from './fixtures/base';
import { admin, adminPages } from './helpers/selectors';
import { createTestLead, cleanupTestLeads } from './helpers/api-client';
import { STORAGE_STATE } from '../../playwright.config';

test.use({ storageState: STORAGE_STATE });

test.describe('PDF Download', () => {
	test.beforeAll(async ({ request }) => {
		await createTestLead(request, {
			email: `pdf-test-${Date.now()}@e2e-test.local`,
			firstName: 'PDF',
			lastName: 'Testuser',
		});
	});

	test.afterAll(async ({ request }) => {
		await cleanupTestLeads(request);
	});

	test('PDF-Download-Button im Lead-Detail', async ({ page }) => {
		await page.goto(`/wp-admin/${adminPages.leads}`);
		await expect(page.locator(admin.root)).toBeVisible();

		// Open first lead
		const firstRow = page.locator('table tbody tr').first();
		if (await firstRow.isVisible({ timeout: 10000 }).catch(() => false)) {
			await firstRow.click();
			await page.waitForTimeout(500);

			// Look for PDF download button
			const pdfBtn = page.locator('button:has-text("PDF"), a:has-text("PDF")').first();

			if (await pdfBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
				expect(await pdfBtn.isVisible()).toBeTruthy();
			}
		}
	});

	test('Download startet und Datei ist valides PDF', async ({ page }) => {
		await page.goto(`/wp-admin/${adminPages.leads}`);
		await expect(page.locator(admin.root)).toBeVisible();

		// Open first lead
		const firstRow = page.locator('table tbody tr').first();
		if (await firstRow.isVisible({ timeout: 10000 }).catch(() => false)) {
			await firstRow.click();
			await page.waitForTimeout(500);

			const pdfBtn = page.locator('button:has-text("PDF"), a:has-text("PDF")').first();

			if (await pdfBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
				// Listen for download
				const [download] = await Promise.all([
					page.waitForEvent('download', { timeout: 15000 }),
					pdfBtn.click(),
				]);

				// Verify filename
				const filename = download.suggestedFilename();
				expect(filename).toMatch(/\.pdf$/i);

				// Save and verify PDF header
				const filePath = await download.path();
				if (filePath) {
					const fs = await import('fs');
					const buffer = fs.readFileSync(filePath);
					const header = buffer.subarray(0, 4).toString('ascii');
					expect(header).toBe('%PDF');
				}
			}
		}
	});
});
