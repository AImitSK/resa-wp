/**
 * Zod Schema für Berechnungsfaktoren (Mietpreis-Kalkulator).
 *
 * Definiert die Struktur aller Faktoren für den FactorEditor.
 * Wird als Teil von moduleSetupSchema.factors verwendet.
 *
 * @see src/admin/components/FactorEditor.tsx
 * @see src/admin/components/module-settings/SetupTab.tsx
 */

import { z } from 'zod';
import { __ } from '@wordpress/i18n';

/**
 * Schema für Multiplikatoren (0.1 - 3.0).
 * Typische Werte: 0.8-1.2 für normale Faktoren.
 */
const multiplierSchema = z
	.number()
	.min(0.1, __('Mindestens 0.1', 'resa'))
	.max(3.0, __('Maximal 3.0', 'resa'));

/**
 * Schema für eine Gruppe von Multiplikatoren.
 */
const multiplierGroupSchema = z.record(z.string(), multiplierSchema);

/**
 * Schema für Zuschläge in EUR/m² (0 - 10).
 */
const premiumSchema = z
	.number()
	.min(0, __('Mindestens 0', 'resa'))
	.max(10, __('Maximal 10 EUR/m²', 'resa'));

/**
 * Schema für eine Gruppe von Zuschlägen.
 */
const premiumGroupSchema = z.record(z.string(), premiumSchema);

/**
 * Schema für die vollständige Faktorenstruktur des Mietpreis-Kalkulators.
 */
export const factorSchema = z.object({
	/** Basismietpreis pro m² in EUR (0-50) */
	base_price: z
		.number()
		.min(0, __('Mindestens 0 EUR/m²', 'resa'))
		.max(50, __('Maximal 50 EUR/m²', 'resa')),

	/** Größendegression (0-0.5, Abschlag pro m² über Basisgröße) */
	size_degression: z
		.number()
		.min(0, __('Mindestens 0', 'resa'))
		.max(0.5, __('Maximal 0.5', 'resa')),

	/** Lage-Faktoren (Key: 1-5 für Lage-Bewertung) */
	location_ratings: multiplierGroupSchema,

	/** Zustands-Multiplikatoren (new, renovated, good, needs_renovation) */
	condition_multipliers: multiplierGroupSchema,

	/** Immobilientyp-Multiplikatoren (apartment, house) */
	type_multipliers: multiplierGroupSchema,

	/** Ausstattungs-Zuschläge in EUR/m² */
	feature_premiums: premiumGroupSchema,

	/** Alter-Faktoren nach Baujahr-Gruppen */
	age_multipliers: multiplierGroupSchema,
});

/**
 * TypeScript-Typ abgeleitet aus dem Schema.
 */
export type FactorFormData = z.infer<typeof factorSchema>;

/**
 * Default-Werte für den Mietpreis-Kalkulator.
 */
export const defaultFactors: FactorFormData = {
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
		garden: 1.0,
		elevator: 0.3,
		parking: 0.5,
		garage: 0.75,
		cellar: 0.2,
		fitted_kitchen: 0.5,
		floor_heating: 0.4,
		guest_toilet: 0.25,
		barrier_free: 0.3,
	},
	age_multipliers: {
		before_1946: 0.95,
		'1946_1959': 0.9,
		'1960_1979': 0.85,
		'1980_1989': 0.9,
		'1990_1999': 0.95,
		'2000_2014': 1.0,
		'2015_plus': 1.1,
	},
};

/**
 * Default-Werte für den Immobilienwert-Kalkulator (basierend auf Preset "Mittelstadt").
 */
export const defaultPropertyValueFactors: Record<string, unknown> = {
	base_price: 3200,
	plot_price_per_sqm: 180,
	size_degression: 0.18,
	type_multipliers: { house: 1.0, apartment: 0.95 },
	subtype_multipliers: {
		efh: 1.0,
		rh: 0.9,
		dhh: 0.95,
		zfh: 1.05,
		mfh: 1.1,
		eg: 0.95,
		etage: 1.0,
		dg: 0.98,
		maisonette: 1.05,
		penthouse: 1.2,
	},
	condition_multipliers: { new: 1.25, renovated: 1.1, good: 1.0, needs_renovation: 0.75 },
	quality_multipliers: { premium: 1.25, normal: 1.0, basic: 0.8 },
	rental_discount: { owner_occupied: 1.0, rented: 0.92, vacant: 1.0 },
	location_ratings: { '1': 0.8, '2': 0.92, '3': 1.0, '4': 1.12, '5': 1.3 },
	age_multipliers: {
		before_1946: 1.05,
		'1946_1959': 0.9,
		'1960_1979': 0.85,
		'1980_1989': 0.92,
		'1990_1999': 1.0,
		'2000_2014': 1.08,
		'2015_plus': 1.15,
	},
	feature_premiums: {
		balcony: 15,
		terrace: 25,
		garden: 30,
		elevator: 10,
		parking: 12,
		garage: 20,
		cellar: 8,
		fitted_kitchen: 15,
		floor_heating: 18,
		guest_toilet: 8,
		barrier_free: 10,
		solar: 20,
	},
};

/**
 * Default-Faktoren nach Modul-Slug.
 */
export const defaultFactorsByModule: Record<string, Record<string, unknown>> = {
	'rent-calculator': defaultFactors as unknown as Record<string, unknown>,
	'property-value': defaultPropertyValueFactors,
};
