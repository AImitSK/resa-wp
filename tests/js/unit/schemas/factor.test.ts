/**
 * Vitest-Tests fuer das Factor-Schema (Berechnungsfaktoren).
 *
 * @see src/admin/schemas/factor.ts
 */

import { describe, it, expect } from 'vitest';
import { factorSchema, defaultFactors, type FactorFormData } from '@admin/schemas/factor';

describe('factorSchema', () => {
	const validData: FactorFormData = {
		base_price: 12.5,
		size_degression: 0.02,
		location_ratings: {
			'1': 0.8,
			'2': 0.9,
			'3': 1.0,
			'4': 1.1,
			'5': 1.2,
		},
		condition_multipliers: {
			new: 1.15,
			renovated: 1.05,
			good: 1.0,
			needs_renovation: 0.85,
		},
		type_multipliers: {
			apartment: 1.0,
			house: 1.05,
		},
		feature_premiums: {
			balcony: 0.5,
			terrace: 0.75,
		},
		age_multipliers: {
			before_1946: 0.95,
			'2015_plus': 1.1,
		},
	};

	// --- Valid Data Tests ---

	it('akzeptiert vollstaendige gueltige Daten', () => {
		const result = factorSchema.safeParse(validData);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.base_price).toBe(12.5);
		}
	});

	it('akzeptiert defaultFactors', () => {
		const result = factorSchema.safeParse(defaultFactors);
		expect(result.success).toBe(true);
	});

	// --- base_price Range Tests (0-50) ---

	describe('base_price Validierung (0-50 EUR/m2)', () => {
		it('akzeptiert base_price = 0 (Minimum)', () => {
			const data = { ...validData, base_price: 0 };
			const result = factorSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it('akzeptiert base_price = 50 (Maximum)', () => {
			const data = { ...validData, base_price: 50 };
			const result = factorSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it('akzeptiert base_price = 12.5 (typischer Wert)', () => {
			const data = { ...validData, base_price: 12.5 };
			const result = factorSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it('lehnt base_price = -1 ab', () => {
			const data = { ...validData, base_price: -1 };
			const result = factorSchema.safeParse(data);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('base_price');
			}
		});

		it('lehnt base_price = 51 ab', () => {
			const data = { ...validData, base_price: 51 };
			const result = factorSchema.safeParse(data);
			expect(result.success).toBe(false);
		});
	});

	// --- size_degression Range Tests (0-0.5) ---

	describe('size_degression Validierung (0-0.5)', () => {
		it('akzeptiert size_degression = 0 (Minimum)', () => {
			const data = { ...validData, size_degression: 0 };
			const result = factorSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it('akzeptiert size_degression = 0.5 (Maximum)', () => {
			const data = { ...validData, size_degression: 0.5 };
			const result = factorSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it('akzeptiert size_degression = 0.02 (typischer Wert)', () => {
			const data = { ...validData, size_degression: 0.02 };
			const result = factorSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it('lehnt size_degression = -0.1 ab', () => {
			const data = { ...validData, size_degression: -0.1 };
			const result = factorSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		it('lehnt size_degression = 0.6 ab', () => {
			const data = { ...validData, size_degression: 0.6 };
			const result = factorSchema.safeParse(data);
			expect(result.success).toBe(false);
		});
	});

	// --- Multiplier Range Tests (0.1-3.0) ---

	describe('multiplierSchema Validierung (0.1-3.0)', () => {
		it('akzeptiert Multiplikator = 0.1 (Minimum)', () => {
			const data = {
				...validData,
				location_ratings: { '1': 0.1 },
			};
			const result = factorSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it('akzeptiert Multiplikator = 3.0 (Maximum)', () => {
			const data = {
				...validData,
				condition_multipliers: { new: 3.0 },
			};
			const result = factorSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it('akzeptiert Multiplikator = 1.0 (Standardwert)', () => {
			const data = {
				...validData,
				type_multipliers: { apartment: 1.0 },
			};
			const result = factorSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it('lehnt Multiplikator = 0.05 ab (unter Minimum)', () => {
			const data = {
				...validData,
				location_ratings: { '1': 0.05 },
			};
			const result = factorSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		it('lehnt Multiplikator = 3.1 ab (ueber Maximum)', () => {
			const data = {
				...validData,
				age_multipliers: { '2015_plus': 3.1 },
			};
			const result = factorSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		it('lehnt Multiplikator = 0 ab', () => {
			const data = {
				...validData,
				condition_multipliers: { good: 0 },
			};
			const result = factorSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		it('lehnt negative Multiplikatoren ab', () => {
			const data = {
				...validData,
				type_multipliers: { house: -0.5 },
			};
			const result = factorSchema.safeParse(data);
			expect(result.success).toBe(false);
		});
	});

	// --- Premium Range Tests (0-10) ---

	describe('premiumSchema Validierung (0-10 EUR/m2)', () => {
		it('akzeptiert Premium = 0 (Minimum)', () => {
			const data = {
				...validData,
				feature_premiums: { balcony: 0 },
			};
			const result = factorSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it('akzeptiert Premium = 10 (Maximum)', () => {
			const data = {
				...validData,
				feature_premiums: { garden: 10 },
			};
			const result = factorSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it('akzeptiert Premium = 0.5 (typischer Wert)', () => {
			const data = {
				...validData,
				feature_premiums: { balcony: 0.5 },
			};
			const result = factorSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it('lehnt Premium = -1 ab', () => {
			const data = {
				...validData,
				feature_premiums: { balcony: -1 },
			};
			const result = factorSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		it('lehnt Premium = 11 ab (ueber Maximum)', () => {
			const data = {
				...validData,
				feature_premiums: { terrace: 11 },
			};
			const result = factorSchema.safeParse(data);
			expect(result.success).toBe(false);
		});
	});

	// --- Required Fields Tests ---

	it('erfordert base_price', () => {
		const { base_price: _base_price, ...incomplete } = validData;
		const result = factorSchema.safeParse(incomplete);
		expect(result.success).toBe(false);
	});

	it('erfordert size_degression', () => {
		const { size_degression: _size_degression, ...incomplete } = validData;
		const result = factorSchema.safeParse(incomplete);
		expect(result.success).toBe(false);
	});

	it('erfordert location_ratings', () => {
		const { location_ratings: _location_ratings, ...incomplete } = validData;
		const result = factorSchema.safeParse(incomplete);
		expect(result.success).toBe(false);
	});

	it('erfordert condition_multipliers', () => {
		const { condition_multipliers: _condition_multipliers, ...incomplete } = validData;
		const result = factorSchema.safeParse(incomplete);
		expect(result.success).toBe(false);
	});

	it('erfordert type_multipliers', () => {
		const { type_multipliers: _type_multipliers, ...incomplete } = validData;
		const result = factorSchema.safeParse(incomplete);
		expect(result.success).toBe(false);
	});

	it('erfordert feature_premiums', () => {
		const { feature_premiums: _feature_premiums, ...incomplete } = validData;
		const result = factorSchema.safeParse(incomplete);
		expect(result.success).toBe(false);
	});

	it('erfordert age_multipliers', () => {
		const { age_multipliers: _age_multipliers, ...incomplete } = validData;
		const result = factorSchema.safeParse(incomplete);
		expect(result.success).toBe(false);
	});

	// --- Empty Record Tests ---

	it('akzeptiert leere location_ratings', () => {
		const data = { ...validData, location_ratings: {} };
		const result = factorSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('akzeptiert leere condition_multipliers', () => {
		const data = { ...validData, condition_multipliers: {} };
		const result = factorSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('akzeptiert leere feature_premiums', () => {
		const data = { ...validData, feature_premiums: {} };
		const result = factorSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	// --- Edge Cases ---

	it('akzeptiert Keys mit Sonderzeichen in Records', () => {
		const data = {
			...validData,
			location_ratings: { 'rating-1_test': 1.0 },
		};
		const result = factorSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('akzeptiert Dezimalwerte mit hoher Praezision', () => {
		const data = {
			...validData,
			base_price: 12.345678,
			size_degression: 0.123456,
		};
		const result = factorSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('akzeptiert viele Features', () => {
		const data = {
			...validData,
			feature_premiums: {
				balcony: 0.5,
				terrace: 0.75,
				garden: 1.0,
				elevator: 0.3,
				parking: 0.5,
				garage: 0.75,
				cellar: 0.2,
				fitted_kitchen: 0.5,
				floor_heating: 0.4,
				guest_toilet: 0.25,
				barrier_free: 0.3,
				pool: 2.0,
				sauna: 1.5,
			},
		};
		const result = factorSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	// --- Type Validation Tests ---

	it('lehnt base_price als String ab', () => {
		const data = { ...validData, base_price: '12.5' };
		const result = factorSchema.safeParse(data);
		expect(result.success).toBe(false);
	});

	it('lehnt Multiplikator als String ab', () => {
		const data = {
			...validData,
			location_ratings: { '1': '0.8' },
		};
		const result = factorSchema.safeParse(data);
		expect(result.success).toBe(false);
	});

	it('lehnt Premium als String ab', () => {
		const data = {
			...validData,
			feature_premiums: { balcony: '0.5' },
		};
		const result = factorSchema.safeParse(data);
		expect(result.success).toBe(false);
	});

	it('lehnt location_ratings als Array ab', () => {
		const data = {
			...validData,
			location_ratings: [0.8, 0.9, 1.0],
		};
		const result = factorSchema.safeParse(data);
		expect(result.success).toBe(false);
	});
});
