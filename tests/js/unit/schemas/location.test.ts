import { describe, it, expect } from 'vitest';
import { locationSchema } from '@/admin/schemas/location';

describe('locationSchema', () => {
	const validData = {
		name: 'München Zentrum',
		slug: 'muenchen-zentrum',
		country: 'Deutschland',
		bundesland: 'Bayern',
		region_type: 'large_city' as const,
		latitude: 48.1351,
		longitude: 11.582,
		zoom_level: 12,
		data: {
			grunderwerbsteuer: 3.5,
			maklerprovision: 3.57,
		},
	};

	describe('gültige Daten', () => {
		it('akzeptiert vollständige gültige Daten', () => {
			const result = locationSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('akzeptiert verschiedene region_type Werte', () => {
			const regionTypes = ['rural', 'small_town', 'medium_city', 'large_city'] as const;

			regionTypes.forEach((regionType) => {
				const result = locationSchema.safeParse({
					...validData,
					region_type: regionType,
				});
				expect(result.success).toBe(true);
			});
		});

		it('akzeptiert minimale erforderliche Felder', () => {
			const minimalData = {
				name: 'Berlin',
				slug: '',
				country: 'Deutschland',
				bundesland: '',
				region_type: 'large_city' as const,
				data: {},
			};
			const result = locationSchema.safeParse(minimalData);
			expect(result.success).toBe(true);
		});

		it('akzeptiert null für latitude und longitude', () => {
			const result = locationSchema.safeParse({
				...validData,
				latitude: null,
				longitude: null,
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert fehlende optionale Felder latitude/longitude', () => {
			const {
				latitude: _latitude,
				longitude: _longitude,
				zoom_level: _zoom_level,
				...data
			} = validData;
			const result = locationSchema.safeParse(data);
			expect(result.success).toBe(true);
		});
	});

	describe('Pflichtfelder', () => {
		it('lehnt fehlenden name ab', () => {
			const { name: _name, ...data } = validData;
			const result = locationSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		it('lehnt leeren name ab', () => {
			const result = locationSchema.safeParse({
				...validData,
				name: '',
			});
			expect(result.success).toBe(false);
		});

		it('lehnt fehlendes country ab', () => {
			const { country: _country, ...data } = validData;
			const result = locationSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		it('lehnt leeres country ab', () => {
			const result = locationSchema.safeParse({
				...validData,
				country: '',
			});
			expect(result.success).toBe(false);
		});

		it('lehnt fehlenden region_type ab', () => {
			const { region_type: _region_type, ...data } = validData;
			const result = locationSchema.safeParse(data);
			expect(result.success).toBe(false);
		});
	});

	describe('Lat/Lng Ranges', () => {
		it('akzeptiert gültige Latitude-Werte (-90 bis 90)', () => {
			const validLatitudes = [-90, -45.5, 0, 48.1351, 90];

			validLatitudes.forEach((lat) => {
				const result = locationSchema.safeParse({
					...validData,
					latitude: lat,
				});
				expect(result.success).toBe(true);
			});
		});

		it('akzeptiert gültige Longitude-Werte (-180 bis 180)', () => {
			const validLongitudes = [-180, -11.582, 0, 11.582, 180];

			validLongitudes.forEach((lng) => {
				const result = locationSchema.safeParse({
					...validData,
					longitude: lng,
				});
				expect(result.success).toBe(true);
			});
		});

		it('akzeptiert Dezimalwerte für Koordinaten', () => {
			const result = locationSchema.safeParse({
				...validData,
				latitude: 48.13513456789,
				longitude: 11.58200123456,
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert negative Koordinaten', () => {
			const result = locationSchema.safeParse({
				...validData,
				latitude: -23.5505,
				longitude: -46.6333,
			});
			expect(result.success).toBe(true);
		});
	});

	describe('Slug Format', () => {
		it('akzeptiert leeren Slug', () => {
			const result = locationSchema.safeParse({
				...validData,
				slug: '',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert Slug mit Bindestrichen', () => {
			const result = locationSchema.safeParse({
				...validData,
				slug: 'muenchen-zentrum-ost',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert Slug mit Zahlen', () => {
			const result = locationSchema.safeParse({
				...validData,
				slug: 'muenchen-80331',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert Slug mit genau 100 Zeichen', () => {
			const result = locationSchema.safeParse({
				...validData,
				slug: 'a'.repeat(100),
			});
			expect(result.success).toBe(true);
		});

		it('lehnt Slug mit mehr als 100 Zeichen ab', () => {
			const result = locationSchema.safeParse({
				...validData,
				slug: 'a'.repeat(101),
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('slug');
			}
		});
	});

	describe('Grenzwerte', () => {
		it('akzeptiert name mit genau 100 Zeichen', () => {
			const result = locationSchema.safeParse({
				...validData,
				name: 'a'.repeat(100),
			});
			expect(result.success).toBe(true);
		});

		it('lehnt name mit mehr als 100 Zeichen ab', () => {
			const result = locationSchema.safeParse({
				...validData,
				name: 'a'.repeat(101),
			});
			expect(result.success).toBe(false);
		});

		it('akzeptiert country mit genau 100 Zeichen', () => {
			const result = locationSchema.safeParse({
				...validData,
				country: 'a'.repeat(100),
			});
			expect(result.success).toBe(true);
		});

		it('lehnt country mit mehr als 100 Zeichen ab', () => {
			const result = locationSchema.safeParse({
				...validData,
				country: 'a'.repeat(101),
			});
			expect(result.success).toBe(false);
		});

		it('akzeptiert bundesland mit genau 100 Zeichen', () => {
			const result = locationSchema.safeParse({
				...validData,
				bundesland: 'a'.repeat(100),
			});
			expect(result.success).toBe(true);
		});

		it('lehnt bundesland mit mehr als 100 Zeichen ab', () => {
			const result = locationSchema.safeParse({
				...validData,
				bundesland: 'a'.repeat(101),
			});
			expect(result.success).toBe(false);
		});
	});

	describe('zoom_level', () => {
		it('akzeptiert zoom_level von 1', () => {
			const result = locationSchema.safeParse({
				...validData,
				zoom_level: 1,
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert zoom_level von 20', () => {
			const result = locationSchema.safeParse({
				...validData,
				zoom_level: 20,
			});
			expect(result.success).toBe(true);
		});

		it('lehnt zoom_level unter 1 ab', () => {
			const result = locationSchema.safeParse({
				...validData,
				zoom_level: 0,
			});
			expect(result.success).toBe(false);
		});

		it('lehnt zoom_level über 20 ab', () => {
			const result = locationSchema.safeParse({
				...validData,
				zoom_level: 21,
			});
			expect(result.success).toBe(false);
		});

		it('lehnt nicht-ganzzahlige zoom_level ab', () => {
			const result = locationSchema.safeParse({
				...validData,
				zoom_level: 12.5,
			});
			expect(result.success).toBe(false);
		});
	});

	describe('ungültiger region_type', () => {
		it('lehnt ungültigen region_type ab', () => {
			const result = locationSchema.safeParse({
				...validData,
				region_type: 'metropolis',
			});
			expect(result.success).toBe(false);
		});
	});

	describe('data Objekt', () => {
		it('akzeptiert leeres data Objekt', () => {
			const result = locationSchema.safeParse({
				...validData,
				data: {},
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert grunderwerbsteuer im gültigen Bereich', () => {
			const result = locationSchema.safeParse({
				...validData,
				data: {
					grunderwerbsteuer: 5.0,
				},
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert grunderwerbsteuer von 0', () => {
			const result = locationSchema.safeParse({
				...validData,
				data: {
					grunderwerbsteuer: 0,
				},
			});
			expect(result.success).toBe(true);
		});

		it('lehnt grunderwerbsteuer über 10 ab', () => {
			const result = locationSchema.safeParse({
				...validData,
				data: {
					grunderwerbsteuer: 10.5,
				},
			});
			expect(result.success).toBe(false);
		});

		it('lehnt negative grunderwerbsteuer ab', () => {
			const result = locationSchema.safeParse({
				...validData,
				data: {
					grunderwerbsteuer: -1,
				},
			});
			expect(result.success).toBe(false);
		});

		it('akzeptiert maklerprovision im gültigen Bereich', () => {
			const result = locationSchema.safeParse({
				...validData,
				data: {
					maklerprovision: 3.57,
				},
			});
			expect(result.success).toBe(true);
		});

		it('lehnt maklerprovision über 10 ab', () => {
			const result = locationSchema.safeParse({
				...validData,
				data: {
					maklerprovision: 15,
				},
			});
			expect(result.success).toBe(false);
		});

		it('erlaubt zusätzliche Felder (passthrough)', () => {
			const result = locationSchema.safeParse({
				...validData,
				data: {
					grunderwerbsteuer: 3.5,
					maklerprovision: 3.57,
					customField: 'custom value',
					anotherNumber: 123,
				},
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect((result.data.data as Record<string, unknown>).customField).toBe(
					'custom value',
				);
			}
		});
	});
});
