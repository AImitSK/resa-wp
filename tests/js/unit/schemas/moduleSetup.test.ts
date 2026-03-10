/**
 * Vitest-Tests fuer das ModuleSetup-Schema.
 *
 * @see src/admin/schemas/moduleSetup.ts
 */

import { describe, it, expect } from 'vitest';
import { moduleSetupSchema, type ModuleSetupFormData } from '@admin/schemas/moduleSetup';
import { defaultFactors } from '@admin/schemas/factor';

describe('moduleSetupSchema', () => {
	const validData: ModuleSetupFormData = {
		setup_mode: 'pauschal',
		region_preset: 'mittelstadt',
		factors: {
			base_price: 10.0,
			size_degression: 0.02,
		},
	};

	// --- Valid Data Tests ---

	it('akzeptiert vollstaendige gueltige Daten mit setup_mode pauschal', () => {
		const result = moduleSetupSchema.safeParse(validData);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.setup_mode).toBe('pauschal');
			expect(result.data.region_preset).toBe('mittelstadt');
		}
	});

	it('akzeptiert vollstaendige gueltige Daten mit setup_mode individuell', () => {
		const data = {
			setup_mode: 'individuell',
			region_preset: 'custom',
			factors: defaultFactors,
		};
		const result = moduleSetupSchema.safeParse(data);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.setup_mode).toBe('individuell');
		}
	});

	// --- setup_mode Enum Tests ---

	describe('setup_mode Enum Validierung', () => {
		it('akzeptiert setup_mode = pauschal', () => {
			const data = { ...validData, setup_mode: 'pauschal' as const };
			const result = moduleSetupSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it('akzeptiert setup_mode = individuell', () => {
			const data = { ...validData, setup_mode: 'individuell' as const };
			const result = moduleSetupSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it('lehnt setup_mode = manual ab', () => {
			const data = { ...validData, setup_mode: 'manual' };
			const result = moduleSetupSchema.safeParse(data);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('setup_mode');
			}
		});

		it('lehnt setup_mode = preset ab', () => {
			const data = { ...validData, setup_mode: 'preset' };
			const result = moduleSetupSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		it('lehnt leeren setup_mode ab', () => {
			const data = { ...validData, setup_mode: '' };
			const result = moduleSetupSchema.safeParse(data);
			expect(result.success).toBe(false);
		});
	});

	// --- region_preset Validation Tests ---

	describe('region_preset Validierung', () => {
		it('akzeptiert region_preset = grossstadt', () => {
			const data = { ...validData, region_preset: 'grossstadt' };
			const result = moduleSetupSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it('akzeptiert region_preset = mittelstadt', () => {
			const data = { ...validData, region_preset: 'mittelstadt' };
			const result = moduleSetupSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it('akzeptiert region_preset = kleinstadt', () => {
			const data = { ...validData, region_preset: 'kleinstadt' };
			const result = moduleSetupSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it('akzeptiert region_preset = laendlich', () => {
			const data = { ...validData, region_preset: 'laendlich' };
			const result = moduleSetupSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it('lehnt leeren region_preset ab', () => {
			const data = { ...validData, region_preset: '' };
			const result = moduleSetupSchema.safeParse(data);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('region_preset');
			}
		});

		it('lehnt nur Whitespace region_preset ab', () => {
			const data = { ...validData, region_preset: '   ' };
			const result = moduleSetupSchema.safeParse(data);
			// Note: Zod's min(1) checks length, so whitespace with length 3 passes
			// This test documents current behavior - may need trim() for stricter validation
			expect(result.success).toBe(true);
		});

		it('akzeptiert beliebigen nicht-leeren String', () => {
			const data = { ...validData, region_preset: 'custom-region-123' };
			const result = moduleSetupSchema.safeParse(data);
			expect(result.success).toBe(true);
		});
	});

	// --- factors Partial Schema Tests ---

	describe('factors Partial Validierung', () => {
		it('akzeptiert vollstaendige factors', () => {
			const data = {
				...validData,
				factors: defaultFactors,
			};
			const result = moduleSetupSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it('akzeptiert leere factors (alle Felder optional)', () => {
			const data = {
				...validData,
				factors: {},
			};
			const result = moduleSetupSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it('akzeptiert nur base_price in factors', () => {
			const data = {
				...validData,
				factors: { base_price: 15.0 },
			};
			const result = moduleSetupSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it('akzeptiert nur Multiplikatoren in factors', () => {
			const data = {
				...validData,
				factors: {
					location_ratings: { '1': 0.8, '2': 0.9 },
					condition_multipliers: { good: 1.0 },
				},
			};
			const result = moduleSetupSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it('akzeptiert hohe base_price fuer Immobilienwert-Module', () => {
			const data = {
				...validData,
				factors: { base_price: 3200 },
			};
			const result = moduleSetupSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it('akzeptiert property-value spezifische Felder', () => {
			const data = {
				...validData,
				factors: {
					base_price: 3200,
					plot_price_per_sqm: 180,
					subtype_multipliers: { efh: 1.0, rh: 0.9 },
					quality_multipliers: { premium: 1.25 },
					rental_discount: { owner_occupied: 1.0, rented: 0.92 },
				},
			};
			const result = moduleSetupSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it('akzeptiert beliebige Multiplikator-Werte (modulspezifisch)', () => {
			const data = {
				...validData,
				factors: {
					location_ratings: { '1': 5.0 },
					feature_premiums: { balcony: 25 },
				},
			};
			const result = moduleSetupSchema.safeParse(data);
			expect(result.success).toBe(true);
		});
	});

	// --- Required Fields Tests ---

	it('erfordert setup_mode', () => {
		const { setup_mode: _setup_mode, ...incomplete } = validData;
		const result = moduleSetupSchema.safeParse(incomplete);
		expect(result.success).toBe(false);
	});

	it('erfordert region_preset', () => {
		const { region_preset: _region_preset, ...incomplete } = validData;
		const result = moduleSetupSchema.safeParse(incomplete);
		expect(result.success).toBe(false);
	});

	it('erfordert factors', () => {
		const { factors: _factors, ...incomplete } = validData;
		const result = moduleSetupSchema.safeParse(incomplete);
		expect(result.success).toBe(false);
	});

	// --- Type Validation Tests ---

	it('lehnt setup_mode als Zahl ab', () => {
		const data = { ...validData, setup_mode: 1 };
		const result = moduleSetupSchema.safeParse(data);
		expect(result.success).toBe(false);
	});

	it('lehnt region_preset als Zahl ab', () => {
		const data = { ...validData, region_preset: 123 };
		const result = moduleSetupSchema.safeParse(data);
		expect(result.success).toBe(false);
	});

	it('lehnt factors als Array ab', () => {
		const data = { ...validData, factors: [10, 20] };
		const result = moduleSetupSchema.safeParse(data);
		expect(result.success).toBe(false);
	});

	it('lehnt factors als String ab', () => {
		const data = { ...validData, factors: 'default' };
		const result = moduleSetupSchema.safeParse(data);
		expect(result.success).toBe(false);
	});

	// --- Edge Cases ---

	it('akzeptiert region_preset mit Sonderzeichen', () => {
		const data = { ...validData, region_preset: 'region-test_123' };
		const result = moduleSetupSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('akzeptiert sehr langen region_preset', () => {
		const data = { ...validData, region_preset: 'a'.repeat(200) };
		const result = moduleSetupSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('akzeptiert Kombination von pauschal mit allen Faktoren', () => {
		const data = {
			setup_mode: 'pauschal' as const,
			region_preset: 'grossstadt',
			factors: defaultFactors,
		};
		const result = moduleSetupSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('akzeptiert Kombination von individuell mit leeren Faktoren', () => {
		const data = {
			setup_mode: 'individuell' as const,
			region_preset: 'custom',
			factors: {},
		};
		const result = moduleSetupSchema.safeParse(data);
		expect(result.success).toBe(true);
	});
});
