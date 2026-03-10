/**
 * Zod Schema für Module Setup-Einstellungen.
 *
 * @see src/admin/components/module-settings/SetupTab.tsx
 */

import { z } from 'zod';
import { __ } from '@wordpress/i18n';

/**
 * Schema für Module Setup Settings.
 *
 * factors ist ein flexibles Record, da jedes Modul eigene Faktorstrukturen hat
 * (z.B. Mietpreis: base_price 0-50 EUR/m², Immobilienwert: base_price 1000-10000 EUR/m²).
 */
export const moduleSetupSchema = z.object({
	/** Einrichtungsmodus: pauschal (Preset) oder individuell (manuelle Faktoren) */
	setup_mode: z.enum(['pauschal', 'individuell']),

	/** Ausgewähltes Region-Preset (nur bei setup_mode='pauschal' relevant) */
	region_preset: z.string().min(1, __('Bitte einen Regionstyp wählen', 'resa')),

	/** Berechnungsfaktoren — flexibles Schema, modulspezifisch validiert */
	factors: z.record(z.string(), z.unknown()),
});

/**
 * TypeScript-Typ abgeleitet aus dem Schema.
 */
export type ModuleSetupFormData = z.infer<typeof moduleSetupSchema>;
