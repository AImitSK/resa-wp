/**
 * Tests für das Tracking Settings Schema.
 *
 * @see src/admin/schemas/tracking.ts
 */

import { describe, it, expect } from 'vitest';
import { trackingSettingsSchema } from '@/admin/schemas/tracking';

describe('trackingSettingsSchema', () => {
	const validData = {
		funnel_tracking_enabled: true,
		partial_leads_enabled: true,
		partial_lead_ttl_days: 30,
		datalayer_enabled: true,
		google_ads_fv_id: 'AW-123456789',
		google_ads_fv_label: 'fv_conversion',
		google_ads_fs_id: 'AW-987654321',
		google_ads_fs_label: 'fs_conversion',
		enhanced_conversions_enabled: true,
		gclid_capture_enabled: true,
		utm_capture_enabled: true,
	};

	describe('vollständige gültige Daten', () => {
		it('akzeptiert gültige Daten', () => {
			const result = trackingSettingsSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('akzeptiert alle Features deaktiviert', () => {
			const result = trackingSettingsSchema.safeParse({
				funnel_tracking_enabled: false,
				partial_leads_enabled: false,
				partial_lead_ttl_days: 7,
				datalayer_enabled: false,
				google_ads_fv_id: '',
				google_ads_fv_label: '',
				google_ads_fs_id: '',
				google_ads_fs_label: '',
				enhanced_conversions_enabled: false,
				gclid_capture_enabled: false,
				utm_capture_enabled: false,
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert leere Google Ads IDs und Labels', () => {
			const result = trackingSettingsSchema.safeParse({
				...validData,
				google_ads_fv_id: '',
				google_ads_fv_label: '',
				google_ads_fs_id: '',
				google_ads_fs_label: '',
			});
			expect(result.success).toBe(true);
		});
	});

	describe('partial_lead_ttl_days', () => {
		it('akzeptiert Minimum von 7 Tagen', () => {
			const result = trackingSettingsSchema.safeParse({
				...validData,
				partial_lead_ttl_days: 7,
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert Maximum von 365 Tagen', () => {
			const result = trackingSettingsSchema.safeParse({
				...validData,
				partial_lead_ttl_days: 365,
			});
			expect(result.success).toBe(true);
		});

		it('lehnt weniger als 7 Tage ab', () => {
			const result = trackingSettingsSchema.safeParse({
				...validData,
				partial_lead_ttl_days: 6,
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('partial_lead_ttl_days');
			}
		});

		it('lehnt mehr als 365 Tage ab', () => {
			const result = trackingSettingsSchema.safeParse({
				...validData,
				partial_lead_ttl_days: 366,
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('partial_lead_ttl_days');
			}
		});

		it('lehnt 0 Tage ab', () => {
			const result = trackingSettingsSchema.safeParse({
				...validData,
				partial_lead_ttl_days: 0,
			});
			expect(result.success).toBe(false);
		});

		it('lehnt negative Werte ab', () => {
			const result = trackingSettingsSchema.safeParse({
				...validData,
				partial_lead_ttl_days: -10,
			});
			expect(result.success).toBe(false);
		});

		it('lehnt Dezimalzahlen ab', () => {
			const result = trackingSettingsSchema.safeParse({
				...validData,
				partial_lead_ttl_days: 30.5,
			});
			expect(result.success).toBe(false);
		});

		it('lehnt Strings ab', () => {
			const result = trackingSettingsSchema.safeParse({
				...validData,
				partial_lead_ttl_days: '30',
			});
			expect(result.success).toBe(false);
		});
	});

	describe('Boolean-Felder', () => {
		const booleanFields = [
			'funnel_tracking_enabled',
			'partial_leads_enabled',
			'datalayer_enabled',
			'enhanced_conversions_enabled',
			'gclid_capture_enabled',
			'utm_capture_enabled',
		] as const;

		booleanFields.forEach((field) => {
			describe(field, () => {
				it('akzeptiert true', () => {
					const result = trackingSettingsSchema.safeParse({
						...validData,
						[field]: true,
					});
					expect(result.success).toBe(true);
				});

				it('akzeptiert false', () => {
					const result = trackingSettingsSchema.safeParse({
						...validData,
						[field]: false,
					});
					expect(result.success).toBe(true);
				});

				it('lehnt String "true" ab', () => {
					const result = trackingSettingsSchema.safeParse({
						...validData,
						[field]: 'true',
					});
					expect(result.success).toBe(false);
				});

				it('lehnt Zahl 1 ab', () => {
					const result = trackingSettingsSchema.safeParse({
						...validData,
						[field]: 1,
					});
					expect(result.success).toBe(false);
				});
			});
		});
	});

	describe('String-Felder (Google Ads)', () => {
		const stringFields = [
			'google_ads_fv_id',
			'google_ads_fv_label',
			'google_ads_fs_id',
			'google_ads_fs_label',
		] as const;

		stringFields.forEach((field) => {
			describe(field, () => {
				it('akzeptiert nicht-leere Strings', () => {
					const result = trackingSettingsSchema.safeParse({
						...validData,
						[field]: 'AW-123456789',
					});
					expect(result.success).toBe(true);
				});

				it('akzeptiert leere Strings', () => {
					const result = trackingSettingsSchema.safeParse({
						...validData,
						[field]: '',
					});
					expect(result.success).toBe(true);
				});

				it('lehnt Zahlen ab', () => {
					const result = trackingSettingsSchema.safeParse({
						...validData,
						[field]: 123456789,
					});
					expect(result.success).toBe(false);
				});

				it('lehnt null ab', () => {
					const result = trackingSettingsSchema.safeParse({
						...validData,
						[field]: null,
					});
					expect(result.success).toBe(false);
				});
			});
		});
	});

	describe('fehlende Pflichtfelder', () => {
		it('lehnt leeres Objekt ab', () => {
			const result = trackingSettingsSchema.safeParse({});
			expect(result.success).toBe(false);
		});

		it('lehnt fehlendes funnel_tracking_enabled ab', () => {
			const { funnel_tracking_enabled: _funnel_tracking_enabled, ...withoutField } =
				validData;
			const result = trackingSettingsSchema.safeParse(withoutField);
			expect(result.success).toBe(false);
		});

		it('lehnt fehlendes partial_lead_ttl_days ab', () => {
			const { partial_lead_ttl_days: _partial_lead_ttl_days, ...withoutField } = validData;
			const result = trackingSettingsSchema.safeParse(withoutField);
			expect(result.success).toBe(false);
		});

		it('lehnt fehlendes datalayer_enabled ab', () => {
			const { datalayer_enabled: _datalayer_enabled, ...withoutField } = validData;
			const result = trackingSettingsSchema.safeParse(withoutField);
			expect(result.success).toBe(false);
		});

		it('lehnt fehlendes google_ads_fv_id ab', () => {
			const { google_ads_fv_id: _google_ads_fv_id, ...withoutField } = validData;
			const result = trackingSettingsSchema.safeParse(withoutField);
			expect(result.success).toBe(false);
		});
	});

	describe('Edge Cases', () => {
		it('akzeptiert partial_lead_ttl_days genau in der Mitte des Bereichs', () => {
			const result = trackingSettingsSchema.safeParse({
				...validData,
				partial_lead_ttl_days: 186, // Mitte zwischen 7 und 365
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert sehr lange Google Ads IDs', () => {
			const result = trackingSettingsSchema.safeParse({
				...validData,
				google_ads_fv_id: 'AW-' + '1'.repeat(100),
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert Sonderzeichen in Google Ads Labels', () => {
			const result = trackingSettingsSchema.safeParse({
				...validData,
				google_ads_fv_label: 'form_view_äöü_conversion',
			});
			expect(result.success).toBe(true);
		});
	});
});
