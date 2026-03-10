/**
 * Zod schema validation tests for the Immobilienwert-Kalkulator.
 */

import { describe, it, expect } from 'vitest';
import {
	getPropertyTypeSchema,
	getPropertySubtypeSchema,
	getPropertyDetailsSchema,
	getYearBuiltSchema,
	getConditionWithRentalSchema,
	getQualitySchema,
	getCitySchema,
	getLocationRatingSchema,
	getFeaturesSchema,
	getAddressSchema,
} from '@modules/property-value/src/validation/schemas';

describe('getPropertyTypeSchema', () => {
	const schema = getPropertyTypeSchema();

	it('accepts house', () => {
		expect(schema.parse({ property_type: 'house' })).toEqual({
			property_type: 'house',
		});
	});

	it('accepts apartment', () => {
		expect(schema.parse({ property_type: 'apartment' })).toEqual({
			property_type: 'apartment',
		});
	});

	it('rejects invalid type', () => {
		expect(() => schema.parse({ property_type: 'garage' })).toThrow();
	});

	it('rejects missing property_type', () => {
		expect(() => schema.parse({})).toThrow();
	});
});

describe('getPropertySubtypeSchema', () => {
	const schema = getPropertySubtypeSchema();

	it('validates all house subtypes', () => {
		expect(schema.parse({ property_subtype: 'efh' })).toEqual({ property_subtype: 'efh' });
		expect(schema.parse({ property_subtype: 'rh' })).toEqual({ property_subtype: 'rh' });
		expect(schema.parse({ property_subtype: 'dhh' })).toEqual({ property_subtype: 'dhh' });
		expect(schema.parse({ property_subtype: 'zfh' })).toEqual({ property_subtype: 'zfh' });
		expect(schema.parse({ property_subtype: 'mfh' })).toEqual({ property_subtype: 'mfh' });
	});

	it('validates all apartment subtypes', () => {
		expect(schema.parse({ property_subtype: 'eg' })).toEqual({ property_subtype: 'eg' });
		expect(schema.parse({ property_subtype: 'etage' })).toEqual({ property_subtype: 'etage' });
		expect(schema.parse({ property_subtype: 'dg' })).toEqual({ property_subtype: 'dg' });
		expect(schema.parse({ property_subtype: 'maisonette' })).toEqual({
			property_subtype: 'maisonette',
		});
		expect(schema.parse({ property_subtype: 'penthouse' })).toEqual({
			property_subtype: 'penthouse',
		});
	});

	it('rejects invalid subtype', () => {
		expect(() => schema.parse({ property_subtype: 'castle' })).toThrow();
	});

	it('rejects missing subtype', () => {
		expect(() => schema.parse({})).toThrow();
	});
});

describe('getPropertyDetailsSchema', () => {
	const schema = getPropertyDetailsSchema();

	it('accepts valid data', () => {
		const result = schema.parse({ size: 100, plot_size: 500, rooms: 5 });
		expect(result.size).toBe(100);
		expect(result.plot_size).toBe(500);
		expect(result.rooms).toBe(5);
	});

	it('requires size >= 10', () => {
		expect(() => schema.parse({ size: 5 })).toThrow();
	});

	it('requires size <= 10000', () => {
		expect(() => schema.parse({ size: 20000 })).toThrow();
	});

	it('plot_size and rooms are optional', () => {
		const result = schema.parse({ size: 80 });
		expect(result.plot_size).toBeUndefined();
		expect(result.rooms).toBeUndefined();
	});
});

describe('getYearBuiltSchema', () => {
	const schema = getYearBuiltSchema();

	it('accepts valid year', () => {
		expect(schema.parse({ year_built: 1990 })).toEqual({ year_built: 1990 });
	});

	it('accepts minimum year 1800', () => {
		expect(schema.parse({ year_built: 1800 })).toEqual({ year_built: 1800 });
	});

	it('rejects year below 1800', () => {
		expect(() => schema.parse({ year_built: 1700 })).toThrow();
	});

	it('rejects far-future year', () => {
		expect(() => schema.parse({ year_built: 2100 })).toThrow();
	});

	it('rejects missing year_built', () => {
		expect(() => schema.parse({})).toThrow();
	});
});

describe('getConditionWithRentalSchema', () => {
	const schema = getConditionWithRentalSchema();

	it.each(['new', 'renovated', 'good', 'needs_renovation'])(
		'accepts condition %s',
		(condition) => {
			const result = schema.parse({ condition });
			expect(result.condition).toBe(condition);
		},
	);

	it('rejects invalid condition', () => {
		expect(() => schema.parse({ condition: 'destroyed' })).toThrow();
	});

	it('rental_status defaults to owner_occupied', () => {
		const result = schema.parse({ condition: 'good' });
		expect(result.rental_status).toBe('owner_occupied');
	});

	it.each(['owner_occupied', 'rented', 'vacant'])('accepts rental_status %s', (rental_status) => {
		const result = schema.parse({ condition: 'good', rental_status });
		expect(result.rental_status).toBe(rental_status);
	});

	it('rejects invalid rental_status', () => {
		expect(() => schema.parse({ condition: 'good', rental_status: 'unknown' })).toThrow();
	});
});

describe('getQualitySchema', () => {
	const schema = getQualitySchema();

	it.each(['premium', 'normal', 'basic'])('accepts quality %s', (quality) => {
		expect(schema.parse({ quality })).toEqual({ quality });
	});

	it('rejects invalid quality', () => {
		expect(() => schema.parse({ quality: 'luxury' })).toThrow();
	});

	it('rejects missing quality', () => {
		expect(() => schema.parse({})).toThrow();
	});
});

describe('getCitySchema', () => {
	const schema = getCitySchema();

	it('accepts positive city_id', () => {
		expect(schema.parse({ city_id: 1 })).toEqual({ city_id: 1 });
	});

	it('rejects zero', () => {
		expect(() => schema.parse({ city_id: 0 })).toThrow();
	});

	it('rejects negative', () => {
		expect(() => schema.parse({ city_id: -1 })).toThrow();
	});
});

describe('getLocationRatingSchema', () => {
	const schema = getLocationRatingSchema();

	it.each([1, 2, 3, 4, 5])('accepts rating %d', (rating) => {
		expect(schema.parse({ location_rating: rating })).toEqual({
			location_rating: rating,
		});
	});

	it('rejects rating 0', () => {
		expect(() => schema.parse({ location_rating: 0 })).toThrow();
	});

	it('rejects rating 6', () => {
		expect(() => schema.parse({ location_rating: 6 })).toThrow();
	});
});

describe('getFeaturesSchema', () => {
	const schema = getFeaturesSchema();

	it('defaults to empty array', () => {
		const result = schema.parse({});
		expect(result.features).toEqual([]);
	});

	it('accepts array of strings', () => {
		const result = schema.parse({ features: ['balcony', 'solar', 'garden'] });
		expect(result.features).toEqual(['balcony', 'solar', 'garden']);
	});

	it('accepts empty array', () => {
		const result = schema.parse({ features: [] });
		expect(result.features).toEqual([]);
	});

	it('additional_features is optional', () => {
		const result = schema.parse({});
		expect(result.additional_features).toBeUndefined();
	});

	it('accepts additional_features string', () => {
		const result = schema.parse({ features: [], additional_features: 'Pool' });
		expect(result.additional_features).toBe('Pool');
	});
});

describe('getAddressSchema', () => {
	const schema = getAddressSchema();

	it('accepts empty object', () => {
		const result = schema.parse({});
		expect(result.address).toBeUndefined();
	});

	it('accepts address with coordinates', () => {
		const result = schema.parse({
			address: 'Musterstraße 1, 12345 Berlin',
			address_lat: 52.52,
			address_lng: 13.405,
		});
		expect(result.address).toBe('Musterstraße 1, 12345 Berlin');
		expect(result.address_lat).toBe(52.52);
		expect(result.address_lng).toBe(13.405);
	});

	it('requires coordinates when address is provided', () => {
		expect(() =>
			schema.parse({
				address: 'Musterstraße 1, 12345 Berlin',
			}),
		).toThrow();
	});

	it('allows empty address string without coordinates', () => {
		const result = schema.parse({ address: '' });
		expect(result.address).toBe('');
	});
});
