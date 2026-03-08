/**
 * Tests für das GDPR Settings Schema.
 *
 * @see src/admin/schemas/gdpr.ts
 */

import { describe, it, expect } from 'vitest';
import { gdprSettingsSchema } from '@/admin/schemas/gdpr';

describe('gdprSettingsSchema', () => {
	const validData = {
		privacy_url: 'https://example.com/datenschutz',
		consent_text: 'Ich stimme der Verarbeitung meiner Daten zu.',
		newsletter_text: 'Ich möchte den Newsletter erhalten.',
		lead_retention_days: 365,
		email_log_retention_days: 90,
		anonymize_instead_of_delete: true,
	};

	describe('vollständige gültige Daten', () => {
		it('akzeptiert gültige Daten', () => {
			const result = gdprSettingsSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('akzeptiert leere privacy_url (WP Privacy Page wird verwendet)', () => {
			const result = gdprSettingsSchema.safeParse({
				...validData,
				privacy_url: '',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert HTTP-URL für privacy_url', () => {
			const result = gdprSettingsSchema.safeParse({
				...validData,
				privacy_url: 'http://example.com/datenschutz',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert 0 für Aufbewahrungsdauer (unbegrenzt)', () => {
			const result = gdprSettingsSchema.safeParse({
				...validData,
				lead_retention_days: 0,
				email_log_retention_days: 0,
			});
			expect(result.success).toBe(true);
		});
	});

	describe('privacy_url', () => {
		it('lehnt ungültige URL ab (keine URL-Syntax)', () => {
			const result = gdprSettingsSchema.safeParse({
				...validData,
				privacy_url: 'nicht-eine-url',
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('privacy_url');
			}
		});

		it('lehnt URL ohne Protokoll ab', () => {
			const result = gdprSettingsSchema.safeParse({
				...validData,
				privacy_url: 'www.example.com/datenschutz',
			});
			expect(result.success).toBe(false);
		});

		it('lehnt FTP-URL ab', () => {
			const result = gdprSettingsSchema.safeParse({
				...validData,
				privacy_url: 'ftp://example.com/datenschutz',
			});
			expect(result.success).toBe(false);
		});
	});

	describe('consent_text', () => {
		it('lehnt leeren consent_text ab', () => {
			const result = gdprSettingsSchema.safeParse({
				...validData,
				consent_text: '',
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('consent_text');
			}
		});

		it('akzeptiert consent_text mit genau 1 Zeichen', () => {
			const result = gdprSettingsSchema.safeParse({
				...validData,
				consent_text: 'X',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert consent_text mit genau 500 Zeichen', () => {
			const result = gdprSettingsSchema.safeParse({
				...validData,
				consent_text: 'A'.repeat(500),
			});
			expect(result.success).toBe(true);
		});

		it('lehnt consent_text mit mehr als 500 Zeichen ab', () => {
			const result = gdprSettingsSchema.safeParse({
				...validData,
				consent_text: 'A'.repeat(501),
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('consent_text');
			}
		});
	});

	describe('newsletter_text', () => {
		it('lehnt leeren newsletter_text ab', () => {
			const result = gdprSettingsSchema.safeParse({
				...validData,
				newsletter_text: '',
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('newsletter_text');
			}
		});

		it('akzeptiert newsletter_text mit genau 200 Zeichen', () => {
			const result = gdprSettingsSchema.safeParse({
				...validData,
				newsletter_text: 'B'.repeat(200),
			});
			expect(result.success).toBe(true);
		});

		it('lehnt newsletter_text mit mehr als 200 Zeichen ab', () => {
			const result = gdprSettingsSchema.safeParse({
				...validData,
				newsletter_text: 'B'.repeat(201),
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('newsletter_text');
			}
		});
	});

	describe('lead_retention_days', () => {
		it('lehnt negative Werte ab', () => {
			const result = gdprSettingsSchema.safeParse({
				...validData,
				lead_retention_days: -1,
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('lead_retention_days');
			}
		});

		it('lehnt Dezimalzahlen ab', () => {
			const result = gdprSettingsSchema.safeParse({
				...validData,
				lead_retention_days: 30.5,
			});
			expect(result.success).toBe(false);
		});

		it('lehnt Strings ab', () => {
			const result = gdprSettingsSchema.safeParse({
				...validData,
				lead_retention_days: '365',
			});
			expect(result.success).toBe(false);
		});
	});

	describe('email_log_retention_days', () => {
		it('lehnt negative Werte ab', () => {
			const result = gdprSettingsSchema.safeParse({
				...validData,
				email_log_retention_days: -5,
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('email_log_retention_days');
			}
		});

		it('akzeptiert große positive Werte', () => {
			const result = gdprSettingsSchema.safeParse({
				...validData,
				email_log_retention_days: 9999,
			});
			expect(result.success).toBe(true);
		});
	});

	describe('anonymize_instead_of_delete', () => {
		it('akzeptiert true', () => {
			const result = gdprSettingsSchema.safeParse({
				...validData,
				anonymize_instead_of_delete: true,
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert false', () => {
			const result = gdprSettingsSchema.safeParse({
				...validData,
				anonymize_instead_of_delete: false,
			});
			expect(result.success).toBe(true);
		});

		it('lehnt String ab', () => {
			const result = gdprSettingsSchema.safeParse({
				...validData,
				anonymize_instead_of_delete: 'true',
			});
			expect(result.success).toBe(false);
		});

		it('lehnt Zahl ab', () => {
			const result = gdprSettingsSchema.safeParse({
				...validData,
				anonymize_instead_of_delete: 1,
			});
			expect(result.success).toBe(false);
		});
	});

	describe('fehlende Pflichtfelder', () => {
		it('lehnt leeres Objekt ab', () => {
			const result = gdprSettingsSchema.safeParse({});
			expect(result.success).toBe(false);
		});

		it('lehnt fehlenden consent_text ab', () => {
			const { consent_text: _consent_text, ...withoutConsentText } = validData;
			const result = gdprSettingsSchema.safeParse(withoutConsentText);
			expect(result.success).toBe(false);
		});

		it('lehnt fehlenden newsletter_text ab', () => {
			const { newsletter_text: _newsletter_text, ...withoutNewsletterText } = validData;
			const result = gdprSettingsSchema.safeParse(withoutNewsletterText);
			expect(result.success).toBe(false);
		});

		it('lehnt fehlende lead_retention_days ab', () => {
			const { lead_retention_days: _lead_retention_days, ...withoutRetention } = validData;
			const result = gdprSettingsSchema.safeParse(withoutRetention);
			expect(result.success).toBe(false);
		});

		it('lehnt fehlende anonymize_instead_of_delete ab', () => {
			const {
				anonymize_instead_of_delete: _anonymize_instead_of_delete,
				...withoutAnonymize
			} = validData;
			const result = gdprSettingsSchema.safeParse(withoutAnonymize);
			expect(result.success).toBe(false);
		});
	});
});
