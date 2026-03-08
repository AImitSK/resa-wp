/**
 * Zod Schema für Location-Editor.
 *
 * @see src/admin/components/LocationEditor.tsx
 */

import { z } from 'zod';
import { __ } from '@wordpress/i18n';

/**
 * Schema für Location-Daten.
 */
export const locationSchema = z.object({
	/** Name des Standorts */
	name: z
		.string()
		.min(1, __('Name ist erforderlich', 'resa'))
		.max(100, __('Name darf maximal 100 Zeichen haben', 'resa')),

	/** URL-freundlicher Slug */
	slug: z.string().max(100, __('Slug darf maximal 100 Zeichen haben', 'resa')),

	/** Land (z.B. Deutschland, Österreich) */
	country: z
		.string()
		.min(1, __('Land ist erforderlich', 'resa'))
		.max(100, __('Land darf maximal 100 Zeichen haben', 'resa')),

	/** Region/Bundesland (optional) */
	bundesland: z.string().max(100, __('Region darf maximal 100 Zeichen haben', 'resa')),

	/** Regionstyp für Berechnungen */
	region_type: z.enum(['rural', 'small_town', 'medium_city', 'large_city']),

	/** Breitengrad für Kartenposition */
	latitude: z.number().nullable().optional(),

	/** Längengrad für Kartenposition */
	longitude: z.number().nullable().optional(),

	/** Zoom-Level für Kartenanzeige */
	zoom_level: z.number().int().min(1).max(20).optional(),

	/** Regionale Kostensätze */
	data: z
		.object({
			/** Grunderwerbsteuer in Prozent */
			grunderwerbsteuer: z
				.number()
				.min(0, __('Wert muss 0 oder größer sein', 'resa'))
				.max(10, __('Wert darf maximal 10% sein', 'resa'))
				.optional(),

			/** Maklerprovision in Prozent */
			maklerprovision: z
				.number()
				.min(0, __('Wert muss 0 oder größer sein', 'resa'))
				.max(10, __('Wert darf maximal 10% sein', 'resa'))
				.optional(),
		})
		.passthrough(), // Erlaubt zusätzliche Felder
});

/**
 * TypeScript-Typ abgeleitet aus dem Schema.
 */
export type LocationFormData = z.infer<typeof locationSchema>;
