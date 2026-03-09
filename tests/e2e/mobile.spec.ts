import { test, expect } from './fixtures/base';
import { widget, leadForm, rentSteps } from './helpers/selectors';

// Anonymer Besucher, iPhone SE Viewport
test.use({
	storageState: { cookies: [], origins: [] },
	viewport: { width: 375, height: 667 },
	isMobile: true,
	hasTouch: true,
});

/**
 * Navigate through wizard steps on mobile (tap instead of click).
 */
async function navigateWizardMobile(page: import('@playwright/test').Page) {
	// Step 1: Objekttyp
	await page.locator(rentSteps.propertyTypeWohnung).tap();
	await page.locator(widget.nextButton).tap();
	await page.waitForTimeout(350);

	// Step 2: Details — Wohnfläche
	const sizeInput = page.locator(rentSteps.sizeInput);
	await sizeInput.tap();
	await sizeInput.fill('60');
	await page.locator(widget.nextButton).tap();
	await page.waitForTimeout(350);

	// Step 3: Stadt — Radix Select
	const cityTrigger = page.locator('#resa-city');
	if (await cityTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
		await cityTrigger.tap();
		await page.waitForTimeout(200);
		const firstOption = page.locator('[role="option"]').first();
		await firstOption.tap();
		await page.waitForTimeout(200);
		await page.locator(widget.nextButton).tap();
		await page.waitForTimeout(350);
	}

	// Step 4: Adresse — skip
	await page.locator(widget.nextButton).tap();
	await page.waitForTimeout(350);

	// Step 5: Zustand
	const conditionBtn = page.locator('button:has-text("Guter Zustand")');
	if (await conditionBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
		await conditionBtn.tap();
	}
	await page.locator(widget.nextButton).tap();
	await page.waitForTimeout(350);

	// Step 6: Lage-Bewertung — Default, weiter
	await page.locator(widget.nextButton).tap();
	await page.waitForTimeout(350);

	// Step 7: Ausstattung — complete
	const completeBtn = page.locator(widget.completeButton);
	if (await completeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
		await completeBtn.tap();
	} else {
		await page.locator(widget.nextButton).tap();
	}
	await page.waitForTimeout(500);

	// Handle potential calculation error — retry once
	const retryBtn = page.locator('button:has-text("Erneut versuchen")');
	if (await retryBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
		await retryBtn.tap();
		await page.waitForTimeout(2000);
	}
}

test.describe('Mobile Widget', () => {
	test('Widget passt in Mobile Viewport', async ({ page, testPageUrl }) => {
		await page.goto(testPageUrl);

		const widgetRoot = page.locator(widget.root);
		await expect(widgetRoot).toBeVisible();

		// Widget should fit within viewport width
		const box = await widgetRoot.boundingBox();
		if (box) {
			expect(box.width).toBeLessThanOrEqual(375);
		}
	});

	test('Kein horizontaler Overflow', async ({ page, testPageUrl }) => {
		await page.goto(testPageUrl);
		await expect(page.locator(widget.root)).toBeVisible();

		// Check that body doesn't have horizontal scroll
		const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
		const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

		expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
	});

	test('Wizard per Tap navigierbar', async ({ page, testPageUrl }) => {
		await page.goto(testPageUrl);
		await expect(page.locator(widget.root)).toBeVisible();

		// Tap on property type selection
		await page.locator(rentSteps.propertyTypeWohnung).tap();

		// Tap next button
		await page.locator(widget.nextButton).tap();
		await page.waitForTimeout(350);

		// Progress bar should reflect navigation
		await expect(page.locator(widget.progressBar)).toBeVisible();
		// Size input should be visible on step 2
		await expect(page.locator(rentSteps.sizeInput)).toBeVisible();
	});

	test('LeadForm auf Mobile ausfüllbar', async ({ page, testPageUrl }) => {
		await page.goto(testPageUrl);
		await expect(page.locator(widget.root)).toBeVisible();

		await navigateWizardMobile(page);

		// Wait for lead form
		const emailField = page.locator(leadForm.email);
		await expect(emailField).toBeVisible({ timeout: 15000 });

		// Fill form on mobile
		await emailField.tap();
		await emailField.fill(`mobile-e2e-${Date.now()}@e2e-test.local`);

		const firstNameField = page.locator(leadForm.firstName);
		if (await firstNameField.isVisible().catch(() => false)) {
			await firstNameField.tap();
			await firstNameField.fill('Mobile');
		}

		const lastNameField = page.locator(leadForm.lastName);
		if (await lastNameField.isVisible().catch(() => false)) {
			await lastNameField.tap();
			await lastNameField.fill('Test');
		}

		// Verify fields have values
		await expect(emailField).not.toHaveValue('');
	});
});
