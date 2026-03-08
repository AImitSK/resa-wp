/**
 * Zod Schema für Location Values (Standort-spezifische Basiswerte).
 *
 * Wird im Inline-Bearbeitungsformular der LocationValuesTab verwendet.
 *
 * @see src/admin/components/module-settings/LocationValuesTab.tsx
 */

import { z } from 'zod';
import { __ } from '@wordpress/i18n';

/**
 * Schema für Location Values (Preis pro m²).
 */
export const locationValuesSchema = z
	.object({
		/** Basispreis in EUR pro m² */
		base_price: z.number().min(0, __('Basispreis muss 0 oder größer sein', 'resa')),

		/** Minimaler Preis in EUR pro m² */
		price_min: z.number().min(0, __('Mindestpreis muss 0 oder größer sein', 'resa')),

		/** Maximaler Preis in EUR pro m² */
		price_max: z.number().min(0, __('Höchstpreis muss 0 oder größer sein', 'resa')),
	})
	.refine((data) => data.price_min <= data.price_max, {
		message: __('Mindestpreis darf nicht größer als Höchstpreis sein', 'resa'),
		path: ['price_min'],
	});

/**
 * TypeScript-Typ abgeleitet aus dem Schema.
 */
export type LocationValuesFormData = z.infer<typeof locationValuesSchema>;
