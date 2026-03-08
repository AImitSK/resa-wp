/**
 * Vitest-Tests fuer das reCAPTCHA-Settings-Schema.
 *
 * @see src/admin/schemas/recaptcha.ts
 */

import { describe, it, expect } from 'vitest';
import { recaptchaSettingsSchema, type RecaptchaSettingsFormData } from '@admin/schemas/recaptcha';

describe('recaptchaSettingsSchema', () => {
	const validData: RecaptchaSettingsFormData = {
		enabled: true,
		site_key: '6LcABCDEFghIJklMnOpQrStUvWxYz1234567890',
		secret_key: '6LcABCDEFghIJklMnOpQrStUvWxYz0987654321',
		threshold: 0.5,
	};

	// --- Valid Data Tests ---

	it('akzeptiert vollstaendige gueltige Daten', () => {
		const result = recaptchaSettingsSchema.safeParse(validData);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual(validData);
		}
	});

	it('akzeptiert deaktivierten Zustand mit leeren Keys', () => {
		const data = {
			enabled: false,
			site_key: '',
			secret_key: '',
			threshold: 0.5,
		};
		const result = recaptchaSettingsSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('akzeptiert deaktivierten Zustand ohne Keys', () => {
		const data = {
			enabled: false,
			site_key: '',
			secret_key: '',
			threshold: 0.3,
		};
		const result = recaptchaSettingsSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	// --- Required Fields Tests ---

	it('erfordert enabled-Feld', () => {
		const { enabled: _enabled, ...incomplete } = validData;
		const result = recaptchaSettingsSchema.safeParse(incomplete);
		expect(result.success).toBe(false);
	});

	it('erfordert site_key-Feld', () => {
		const { site_key: _site_key, ...incomplete } = validData;
		const result = recaptchaSettingsSchema.safeParse(incomplete);
		expect(result.success).toBe(false);
	});

	it('erfordert secret_key-Feld', () => {
		const { secret_key: _secret_key, ...incomplete } = validData;
		const result = recaptchaSettingsSchema.safeParse(incomplete);
		expect(result.success).toBe(false);
	});

	it('erfordert threshold-Feld', () => {
		const { threshold: _threshold, ...incomplete } = validData;
		const result = recaptchaSettingsSchema.safeParse(incomplete);
		expect(result.success).toBe(false);
	});

	// --- Threshold Range Tests ---

	it('akzeptiert threshold = 0.0 (Minimum)', () => {
		const data = { ...validData, threshold: 0.0 };
		const result = recaptchaSettingsSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('akzeptiert threshold = 1.0 (Maximum)', () => {
		const data = { ...validData, threshold: 1.0 };
		const result = recaptchaSettingsSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('akzeptiert threshold = 0.5 (typischer Wert)', () => {
		const data = { ...validData, threshold: 0.5 };
		const result = recaptchaSettingsSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('akzeptiert threshold = 0.3 (niedriger Wert)', () => {
		const data = { ...validData, threshold: 0.3 };
		const result = recaptchaSettingsSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('akzeptiert threshold = 0.9 (hoher Wert)', () => {
		const data = { ...validData, threshold: 0.9 };
		const result = recaptchaSettingsSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('lehnt threshold = -0.1 ab', () => {
		const data = { ...validData, threshold: -0.1 };
		const result = recaptchaSettingsSchema.safeParse(data);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].path).toContain('threshold');
		}
	});

	it('lehnt threshold = 1.1 ab', () => {
		const data = { ...validData, threshold: 1.1 };
		const result = recaptchaSettingsSchema.safeParse(data);
		expect(result.success).toBe(false);
	});

	it('lehnt threshold = 2 ab', () => {
		const data = { ...validData, threshold: 2 };
		const result = recaptchaSettingsSchema.safeParse(data);
		expect(result.success).toBe(false);
	});

	// --- Conditional Validation Tests (superRefine) ---

	describe('bedingte Key-Validierung (superRefine)', () => {
		it('erfordert site_key wenn enabled = true', () => {
			const data = {
				enabled: true,
				site_key: '',
				secret_key: 'valid_secret_key',
				threshold: 0.5,
			};
			const result = recaptchaSettingsSchema.safeParse(data);
			expect(result.success).toBe(false);
			if (!result.success) {
				const siteKeyIssue = result.error.issues.find((i) => i.path.includes('site_key'));
				expect(siteKeyIssue).toBeDefined();
			}
		});

		it('erfordert secret_key wenn enabled = true', () => {
			const data = {
				enabled: true,
				site_key: 'valid_site_key',
				secret_key: '',
				threshold: 0.5,
			};
			const result = recaptchaSettingsSchema.safeParse(data);
			expect(result.success).toBe(false);
			if (!result.success) {
				const secretKeyIssue = result.error.issues.find((i) =>
					i.path.includes('secret_key'),
				);
				expect(secretKeyIssue).toBeDefined();
			}
		});

		it('erfordert beide Keys wenn enabled = true', () => {
			const data = {
				enabled: true,
				site_key: '',
				secret_key: '',
				threshold: 0.5,
			};
			const result = recaptchaSettingsSchema.safeParse(data);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
			}
		});

		it('erlaubt leere Keys wenn enabled = false', () => {
			const data = {
				enabled: false,
				site_key: '',
				secret_key: '',
				threshold: 0.5,
			};
			const result = recaptchaSettingsSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it('lehnt nur Whitespace site_key bei enabled = true ab', () => {
			const data = {
				enabled: true,
				site_key: '   ',
				secret_key: 'valid_secret_key',
				threshold: 0.5,
			};
			const result = recaptchaSettingsSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		it('lehnt nur Whitespace secret_key bei enabled = true ab', () => {
			const data = {
				enabled: true,
				site_key: 'valid_site_key',
				secret_key: '   ',
				threshold: 0.5,
			};
			const result = recaptchaSettingsSchema.safeParse(data);
			expect(result.success).toBe(false);
		});
	});

	// --- Type Validation Tests ---

	it('lehnt enabled als String ab', () => {
		const data = { ...validData, enabled: 'true' };
		const result = recaptchaSettingsSchema.safeParse(data);
		expect(result.success).toBe(false);
	});

	it('lehnt site_key als Zahl ab', () => {
		const data = { ...validData, site_key: 12345 };
		const result = recaptchaSettingsSchema.safeParse(data);
		expect(result.success).toBe(false);
	});

	it('lehnt threshold als String ab', () => {
		const data = { ...validData, threshold: '0.5' };
		const result = recaptchaSettingsSchema.safeParse(data);
		expect(result.success).toBe(false);
	});

	// --- Edge Cases ---

	it('akzeptiert Keys mit Sonderzeichen', () => {
		const data = {
			...validData,
			site_key: '6Lc_test-KEY_123',
			secret_key: '6Lc_test-SECRET_456',
		};
		const result = recaptchaSettingsSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('akzeptiert sehr lange Keys', () => {
		const data = {
			...validData,
			site_key: 'a'.repeat(200),
			secret_key: 'b'.repeat(200),
		};
		const result = recaptchaSettingsSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('akzeptiert threshold mit vielen Dezimalstellen', () => {
		const data = { ...validData, threshold: 0.333333333 };
		const result = recaptchaSettingsSchema.safeParse(data);
		expect(result.success).toBe(true);
	});
});
