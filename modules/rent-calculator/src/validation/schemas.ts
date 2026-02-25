/**
 * Zod validation schemas for each wizard step.
 *
 * Uses Zod v4 API (error/message instead of required_error).
 */

import { z } from 'zod';

export const propertyTypeSchema = z.object({
	property_type: z.enum(['apartment', 'house'], {
		message: 'Bitte wählen Sie eine Immobilienart.',
	}),
});

export const propertyDetailsSchema = z.object({
	size: z
		.number({ error: 'Wohnfläche ist erforderlich.' })
		.min(10, 'Mindestens 10 m².')
		.max(10000, 'Maximal 10.000 m².'),
	rooms: z.number().optional(),
	year_built: z
		.number()
		.min(1800, 'Frühestens 1800.')
		.max(new Date().getFullYear() + 5, 'Ungültiges Baujahr.')
		.optional(),
});

export const citySchema = z.object({
	city_id: z
		.number({ error: 'Bitte wählen Sie einen Standort.' })
		.positive('Bitte wählen Sie einen Standort.'),
});

export const conditionSchema = z.object({
	condition: z.enum(['new', 'renovated', 'good', 'needs_renovation'], {
		message: 'Bitte wählen Sie den Zustand.',
	}),
});

export const locationRatingSchema = z.object({
	location_rating: z
		.number({ error: 'Bitte bewerten Sie die Lage.' })
		.min(1, 'Mindestens 1.')
		.max(5, 'Maximal 5.'),
});

export const featuresSchema = z.object({
	features: z.array(z.string()).default([]),
});
