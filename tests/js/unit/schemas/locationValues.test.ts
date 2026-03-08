/**
 * Vitest-Tests fuer das LocationValues-Schema.
 *
 * @see src/admin/schemas/locationValues.ts
 */

import { describe, it, expect } from 'vitest';
import { locationValuesSchema, type LocationValuesFormData } from '@admin/schemas/locationValues';

describe('locationValuesSchema', () => {
	const validData: LocationValuesFormData = {
		base_price: 12.5,
		price_min: 8.0,
		price_max: 18.0,
	};

	// --- Valid Data Tests ---

	it('akzeptiert vollstaendige gueltige Daten', () => {
		const result = locationValuesSchema.safeParse(validData);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual(validData);
		}
	});

	it('akzeptiert Daten wo price_min gleich price_max ist', () => {
		const data = {
			base_price: 10.0,
			price_min: 10.0,
			price_max: 10.0,
		};
		const result = locationValuesSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('akzeptiert Daten wo alle Werte 0 sind', () => {
		const data = {
			base_price: 0,
			price_min: 0,
			price_max: 0,
		};
		const result = locationValuesSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	// --- Required Fields Tests ---

	it('erfordert base_price', () => {
		const { base_price: _base_price, ...incomplete } = validData;
		const result = locationValuesSchema.safeParse(incomplete);
		expect(result.success).toBe(false);
	});

	it('erfordert price_min', () => {
		const { price_min: _price_min, ...incomplete } = validData;
		const result = locationValuesSchema.safeParse(incomplete);
		expect(result.success).toBe(false);
	});

	it('erfordert price_max', () => {
		const { price_max: _price_max, ...incomplete } = validData;
		const result = locationValuesSchema.safeParse(incomplete);
		expect(result.success).toBe(false);
	});

	// --- Minimum Value Tests (>= 0) ---

	describe('Minimum-Wert Validierung (>= 0)', () => {
		it('akzeptiert base_price = 0', () => {
			const data = { ...validData, base_price: 0 };
			const result = locationValuesSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it('akzeptiert price_min = 0', () => {
			const data = { ...validData, price_min: 0 };
			const result = locationValuesSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it('akzeptiert price_max = 0', () => {
			const data = { base_price: 0, price_min: 0, price_max: 0 };
			const result = locationValuesSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it('lehnt base_price < 0 ab', () => {
			const data = { ...validData, base_price: -1 };
			const result = locationValuesSchema.safeParse(data);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('base_price');
			}
		});

		it('lehnt price_min < 0 ab', () => {
			const data = { ...validData, price_min: -0.5 };
			const result = locationValuesSchema.safeParse(data);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('price_min');
			}
		});

		it('lehnt price_max < 0 ab', () => {
			const data = { ...validData, price_max: -10 };
			const result = locationValuesSchema.safeParse(data);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('price_max');
			}
		});
	});

	// --- Refinement Tests (price_min <= price_max) ---

	describe('price_min <= price_max Validierung (refine)', () => {
		it('akzeptiert price_min < price_max', () => {
			const data = {
				base_price: 10.0,
				price_min: 5.0,
				price_max: 15.0,
			};
			const result = locationValuesSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it('akzeptiert price_min == price_max', () => {
			const data = {
				base_price: 10.0,
				price_min: 10.0,
				price_max: 10.0,
			};
			const result = locationValuesSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it('lehnt price_min > price_max ab', () => {
			const data = {
				base_price: 10.0,
				price_min: 20.0,
				price_max: 15.0,
			};
			const result = locationValuesSchema.safeParse(data);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('price_min');
				expect(result.error.issues[0].message).toContain('Mindestpreis');
			}
		});

		it('lehnt ab wenn price_min knapp ueber price_max liegt', () => {
			const data = {
				base_price: 10.0,
				price_min: 10.01,
				price_max: 10.0,
			};
			const result = locationValuesSchema.safeParse(data);
			expect(result.success).toBe(false);
		});
	});

	// --- Type Validation Tests ---

	it('lehnt base_price als String ab', () => {
		const data = { ...validData, base_price: '12.5' };
		const result = locationValuesSchema.safeParse(data);
		expect(result.success).toBe(false);
	});

	it('lehnt price_min als String ab', () => {
		const data = { ...validData, price_min: '8.0' };
		const result = locationValuesSchema.safeParse(data);
		expect(result.success).toBe(false);
	});

	it('lehnt price_max als String ab', () => {
		const data = { ...validData, price_max: '18.0' };
		const result = locationValuesSchema.safeParse(data);
		expect(result.success).toBe(false);
	});

	it('lehnt null-Werte ab', () => {
		const data = { ...validData, base_price: null };
		const result = locationValuesSchema.safeParse(data);
		expect(result.success).toBe(false);
	});

	it('lehnt undefined-Werte ab', () => {
		const data = { ...validData, price_min: undefined };
		const result = locationValuesSchema.safeParse(data);
		expect(result.success).toBe(false);
	});

	// --- Edge Cases ---

	it('akzeptiert sehr grosse Werte', () => {
		const data = {
			base_price: 1000000,
			price_min: 500000,
			price_max: 2000000,
		};
		const result = locationValuesSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('akzeptiert Dezimalwerte mit hoher Praezision', () => {
		const data = {
			base_price: 12.123456789,
			price_min: 8.987654321,
			price_max: 18.111111111,
		};
		const result = locationValuesSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('akzeptiert typische deutsche Mietpreise', () => {
		const data = {
			base_price: 14.5,
			price_min: 10.0,
			price_max: 22.0,
		};
		const result = locationValuesSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('akzeptiert sehr kleine positive Werte', () => {
		const data = {
			base_price: 0.01,
			price_min: 0.001,
			price_max: 0.1,
		};
		const result = locationValuesSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('base_price kann ausserhalb von price_min/price_max liegen', () => {
		// Das Schema validiert nur die Min/Max-Beziehung, nicht die Position von base_price
		const data = {
			base_price: 25.0, // ueber price_max
			price_min: 10.0,
			price_max: 20.0,
		};
		const result = locationValuesSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('akzeptiert base_price unter price_min', () => {
		const data = {
			base_price: 5.0, // unter price_min
			price_min: 10.0,
			price_max: 20.0,
		};
		const result = locationValuesSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	// --- Common Scenarios ---

	describe('Typische Anwendungsfaelle', () => {
		it('validiert Grossstadt-Mietpreise (hoch)', () => {
			const data = {
				base_price: 18.0,
				price_min: 12.0,
				price_max: 28.0,
			};
			const result = locationValuesSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it('validiert Kleinstadt-Mietpreise (niedrig)', () => {
			const data = {
				base_price: 7.5,
				price_min: 5.0,
				price_max: 10.0,
			};
			const result = locationValuesSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it('validiert Laendliche-Mietpreise (sehr niedrig)', () => {
			const data = {
				base_price: 5.0,
				price_min: 3.5,
				price_max: 7.0,
			};
			const result = locationValuesSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it('validiert Premium-Lagen (sehr hoch)', () => {
			const data = {
				base_price: 35.0,
				price_min: 25.0,
				price_max: 50.0,
			};
			const result = locationValuesSchema.safeParse(data);
			expect(result.success).toBe(true);
		});
	});
});
