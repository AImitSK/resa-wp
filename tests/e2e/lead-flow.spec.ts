import { test, expect } from './fixtures/base';
import { widget, leadForm, rentSteps } from './helpers/selectors';

// Anonymer Besucher — keine Auth nötig
test.use({ storageState: { cookies: [], origins: [] } });

/**
 * Navigate through all wizard steps for the rent calculator.
 * Steps: property_type → details → city → address → condition → location_rating → features
 */
async function navigateWizard(page: import('@playwright/test').Page) {
	// Step 1: Objekttyp — Klick auf "Wohnung"
	await page.locator(rentSteps.propertyTypeWohnung).click();
	await page.locator(widget.nextButton).click();
	await page.waitForTimeout(350);

	// Step 2: Details — Wohnfläche ausfüllen (Pflicht)
	await page.locator(rentSteps.sizeInput).fill('75');
	// Rooms Select + Year überspringen (optional)
	await page.locator(widget.nextButton).click();
	await page.waitForTimeout(350);

	// Step 3: Stadt — Radix Select öffnen + erstes Item wählen
	const cityTrigger = page.locator('#resa-city');
	if (await cityTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
		await cityTrigger.click();
		await page.waitForTimeout(200);
		// Select first option in dropdown
		const firstOption = page.locator('[role="option"]').first();
		await firstOption.click();
		await page.waitForTimeout(200);
		await page.locator(widget.nextButton).click();
		await page.waitForTimeout(350);
	}

	// Step 4: Adresse — optional, einfach weiter
	await page.locator(widget.nextButton).click();
	await page.waitForTimeout(350);

	// Step 5: Zustand — Klick auf "Guter Zustand"
	const conditionBtn = page.locator('button:has-text("Guter Zustand")');
	if (await conditionBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
		await conditionBtn.click();
	}
	await page.locator(widget.nextButton).click();
	await page.waitForTimeout(350);

	// Step 6: Lage-Bewertung — Slider hat Default (3), einfach weiter
	await page.locator(widget.nextButton).click();
	await page.waitForTimeout(350);

	// Step 7: Ausstattung — optional, direkt "Ergebnis anzeigen"
	const completeBtn = page.locator(widget.completeButton);
	if (await completeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
		await completeBtn.click();
	} else {
		await page.locator(widget.nextButton).click();
	}
	await page.waitForTimeout(500);

	// Handle potential calculation error — retry once
	const retryBtn = page.locator('button:has-text("Erneut versuchen")');
	if (await retryBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
		await retryBtn.click();
		await page.waitForTimeout(2000);
	}
}

test.describe('Lead Flow — Rent Calculator', () => {
	test('Widget lädt auf Test-Seite', async ({ page, testPageUrl }) => {
		await page.goto(testPageUrl);

		await expect(page.locator(widget.root)).toBeVisible();
		await expect(page.locator(widget.root)).toHaveAttribute('data-module', 'rent-calculator');
	});

	test('Wizard-Steps durchklicken', async ({ page, testPageUrl }) => {
		await page.goto(testPageUrl);
		await expect(page.locator(widget.root)).toBeVisible();

		// Step 1: Objekttyp auswählen
		await page.locator(rentSteps.propertyTypeWohnung).click();

		// Next button click
		await page.locator(widget.nextButton).click();
		await page.waitForTimeout(350);

		// Step 2: Details — size is visible
		await expect(page.locator(rentSteps.sizeInput)).toBeVisible();

		// Progress bar should reflect advancement
		await expect(page.locator(widget.progressBar)).toBeVisible();
	});

	test('LeadForm erscheint nach Wizard-Durchlauf', async ({ page, testPageUrl }) => {
		await page.goto(testPageUrl);
		await expect(page.locator(widget.root)).toBeVisible();

		await navigateWizard(page);

		// After wizard complete: calculating phase → lead-form phase
		// Wait for lead form email field to appear
		await expect(page.locator(leadForm.email)).toBeVisible({ timeout: 15000 });
	});

	test('Validierung: Submit ohne Daten zeigt Fehlermeldungen', async ({ page, testPageUrl }) => {
		await page.goto(testPageUrl);
		await expect(page.locator(widget.root)).toBeVisible();

		await navigateWizard(page);

		// Wait for lead form
		await expect(page.locator(leadForm.email)).toBeVisible({ timeout: 15000 });
		const submitBtn = page.locator(widget.submitButton);

		// Submit without filling form
		await submitBtn.click();

		// Should show validation errors
		const errors = page.locator(widget.errorMessage);
		await expect(errors.first()).toBeVisible({ timeout: 5000 });
	});

	test('Lead absenden zeigt Ergebnis', async ({ page, testPageUrl }) => {
		await page.goto(testPageUrl);
		await expect(page.locator(widget.root)).toBeVisible();

		await navigateWizard(page);

		// Wait for lead form
		const emailField = page.locator(leadForm.email);
		await expect(emailField).toBeVisible({ timeout: 15000 });

		// Fill lead form
		await emailField.fill(`e2e-${Date.now()}@e2e-test.local`);

		const firstNameField = page.locator(leadForm.firstName);
		if (await firstNameField.isVisible().catch(() => false)) {
			await firstNameField.fill('E2E');
		}

		const lastNameField = page.locator(leadForm.lastName);
		if (await lastNameField.isVisible().catch(() => false)) {
			await lastNameField.fill('Testuser');
		}

		const phoneField = page.locator(leadForm.phone);
		if (await phoneField.isVisible().catch(() => false)) {
			await phoneField.fill('+49 170 1234567');
		}

		// Accept consent
		const consentCheckbox = page.locator(leadForm.consent);
		if (await consentCheckbox.isVisible().catch(() => false)) {
			await consentCheckbox.check();
		}

		// Honeypot must stay empty

		// Submit
		await page.locator(widget.submitButton).click();

		// Wait for result — should show EUR value (first match)
		await expect(page.locator(widget.root).getByText(/€|EUR/).first()).toBeVisible({
			timeout: 15000,
		});
	});
});
