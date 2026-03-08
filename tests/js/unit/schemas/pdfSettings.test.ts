import { describe, it, expect } from 'vitest';
import { pdfSettingsSchema } from '@/admin/schemas/pdfSettings';

describe('pdfSettingsSchema', () => {
	const validData = {
		showChart: true,
		showFactors: true,
		showMap: false,
		showCta: true,
		showDisclaimer: true,
		ctaTitle: 'Jetzt Termin vereinbaren',
		ctaText: 'Kontaktieren Sie uns für eine persönliche Beratung.',
	};

	describe('gültige Daten', () => {
		it('akzeptiert vollständige gültige Daten', () => {
			const result = pdfSettingsSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('akzeptiert alle boolean Werte als false', () => {
			const result = pdfSettingsSchema.safeParse({
				...validData,
				showChart: false,
				showFactors: false,
				showMap: false,
				showCta: false,
				showDisclaimer: false,
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert leere Strings für ctaTitle und ctaText', () => {
			const result = pdfSettingsSchema.safeParse({
				...validData,
				ctaTitle: '',
				ctaText: '',
			});
			expect(result.success).toBe(true);
		});
	});

	describe('Pflichtfelder', () => {
		it('lehnt fehlende showChart ab', () => {
			const { showChart: _showChart, ...data } = validData;
			const result = pdfSettingsSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		it('lehnt fehlende showFactors ab', () => {
			const { showFactors: _showFactors, ...data } = validData;
			const result = pdfSettingsSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		it('lehnt fehlende showMap ab', () => {
			const { showMap: _showMap, ...data } = validData;
			const result = pdfSettingsSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		it('lehnt fehlende showCta ab', () => {
			const { showCta: _showCta, ...data } = validData;
			const result = pdfSettingsSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		it('lehnt fehlende showDisclaimer ab', () => {
			const { showDisclaimer: _showDisclaimer, ...data } = validData;
			const result = pdfSettingsSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		it('lehnt fehlenden ctaTitle ab', () => {
			const { ctaTitle: _ctaTitle, ...data } = validData;
			const result = pdfSettingsSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		it('lehnt fehlenden ctaText ab', () => {
			const { ctaText: _ctaText, ...data } = validData;
			const result = pdfSettingsSchema.safeParse(data);
			expect(result.success).toBe(false);
		});
	});

	describe('ungültige Daten', () => {
		it('lehnt nicht-boolean Wert für showChart ab', () => {
			const result = pdfSettingsSchema.safeParse({
				...validData,
				showChart: 'true',
			});
			expect(result.success).toBe(false);
		});

		it('lehnt nicht-boolean Wert für showFactors ab', () => {
			const result = pdfSettingsSchema.safeParse({
				...validData,
				showFactors: 1,
			});
			expect(result.success).toBe(false);
		});

		it('lehnt nicht-string Wert für ctaTitle ab', () => {
			const result = pdfSettingsSchema.safeParse({
				...validData,
				ctaTitle: 123,
			});
			expect(result.success).toBe(false);
		});

		it('lehnt nicht-string Wert für ctaText ab', () => {
			const result = pdfSettingsSchema.safeParse({
				...validData,
				ctaText: null,
			});
			expect(result.success).toBe(false);
		});
	});

	describe('Grenzwerte', () => {
		it('akzeptiert ctaTitle mit genau 200 Zeichen', () => {
			const result = pdfSettingsSchema.safeParse({
				...validData,
				ctaTitle: 'a'.repeat(200),
			});
			expect(result.success).toBe(true);
		});

		it('lehnt ctaTitle mit mehr als 200 Zeichen ab', () => {
			const result = pdfSettingsSchema.safeParse({
				...validData,
				ctaTitle: 'a'.repeat(201),
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('ctaTitle');
			}
		});

		it('akzeptiert ctaText mit genau 500 Zeichen', () => {
			const result = pdfSettingsSchema.safeParse({
				...validData,
				ctaText: 'a'.repeat(500),
			});
			expect(result.success).toBe(true);
		});

		it('lehnt ctaText mit mehr als 500 Zeichen ab', () => {
			const result = pdfSettingsSchema.safeParse({
				...validData,
				ctaText: 'a'.repeat(501),
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('ctaText');
			}
		});
	});

	describe('Typ-Inferenz', () => {
		it('gibt geparste Daten mit korrektem Typ zurück', () => {
			const result = pdfSettingsSchema.safeParse(validData);
			if (result.success) {
				expect(typeof result.data.showChart).toBe('boolean');
				expect(typeof result.data.showFactors).toBe('boolean');
				expect(typeof result.data.showMap).toBe('boolean');
				expect(typeof result.data.showCta).toBe('boolean');
				expect(typeof result.data.showDisclaimer).toBe('boolean');
				expect(typeof result.data.ctaTitle).toBe('string');
				expect(typeof result.data.ctaText).toBe('string');
			}
		});
	});
});
