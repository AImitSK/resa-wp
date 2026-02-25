/**
 * Zod schema validation tests for the Mietpreis-Kalkulator.
 */

import { describe, it, expect } from 'vitest';
import {
	propertyTypeSchema,
	propertyDetailsSchema,
	citySchema,
	conditionSchema,
	locationRatingSchema,
	featuresSchema,
} from '@modules/rent-calculator/src/validation/schemas';

describe('propertyTypeSchema', () => {
	it('accepts apartment', () => {
		expect(propertyTypeSchema.parse({ property_type: 'apartment' })).toEqual({
			property_type: 'apartment',
		});
	});

	it('accepts house', () => {
		expect(propertyTypeSchema.parse({ property_type: 'house' })).toEqual({
			property_type: 'house',
		});
	});

	it('rejects invalid type', () => {
		expect(() => propertyTypeSchema.parse({ property_type: 'garage' })).toThrow();
	});

	it('rejects missing property_type', () => {
		expect(() => propertyTypeSchema.parse({})).toThrow();
	});
});

describe('propertyDetailsSchema', () => {
	it('accepts valid data', () => {
		const result = propertyDetailsSchema.parse({ size: 70, rooms: 3, year_built: 1990 });
		expect(result.size).toBe(70);
	});

	it('requires size >= 10', () => {
		expect(() => propertyDetailsSchema.parse({ size: 5 })).toThrow();
	});

	it('requires size <= 10000', () => {
		expect(() => propertyDetailsSchema.parse({ size: 20000 })).toThrow();
	});

	it('rooms and year_built are optional', () => {
		const result = propertyDetailsSchema.parse({ size: 50 });
		expect(result.rooms).toBeUndefined();
		expect(result.year_built).toBeUndefined();
	});
});

describe('citySchema', () => {
	it('accepts positive city_id', () => {
		expect(citySchema.parse({ city_id: 1 })).toEqual({ city_id: 1 });
	});

	it('rejects zero', () => {
		expect(() => citySchema.parse({ city_id: 0 })).toThrow();
	});

	it('rejects negative', () => {
		expect(() => citySchema.parse({ city_id: -1 })).toThrow();
	});
});

describe('conditionSchema', () => {
	it.each(['new', 'renovated', 'good', 'needs_renovation'])('accepts %s', (condition) => {
		expect(conditionSchema.parse({ condition })).toEqual({ condition });
	});

	it('rejects invalid condition', () => {
		expect(() => conditionSchema.parse({ condition: 'terrible' })).toThrow();
	});
});

describe('locationRatingSchema', () => {
	it.each([1, 2, 3, 4, 5])('accepts rating %d', (rating) => {
		expect(locationRatingSchema.parse({ location_rating: rating })).toEqual({
			location_rating: rating,
		});
	});

	it('rejects rating 0', () => {
		expect(() => locationRatingSchema.parse({ location_rating: 0 })).toThrow();
	});

	it('rejects rating 6', () => {
		expect(() => locationRatingSchema.parse({ location_rating: 6 })).toThrow();
	});
});

describe('featuresSchema', () => {
	it('defaults to empty array', () => {
		const result = featuresSchema.parse({});
		expect(result.features).toEqual([]);
	});

	it('accepts array of strings', () => {
		const result = featuresSchema.parse({ features: ['balcony', 'garden'] });
		expect(result.features).toEqual(['balcony', 'garden']);
	});
});
