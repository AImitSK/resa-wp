/**
 * Zod Schema für Module Setup-Einstellungen.
 *
 * @see src/admin/components/module-settings/SetupTab.tsx
 */

import { z } from 'zod';
import { __ } from '@wordpress/i18n';
import { factorSchema } from './factor';

/**
 * Schema für Module Setup Settings.
 */
export const moduleSetupSchema = z.object({
	/** Einrichtungsmodus: pauschal (Preset) oder individuell (manuelle Faktoren) */
	setup_mode: z.enum(['pauschal', 'individuell']),

	/** Ausgewähltes Region-Preset (nur bei setup_mode='pauschal' relevant) */
	region_preset: z.string().min(1, __('Bitte einen Regionstyp wählen', 'resa')),

	/** Berechnungsfaktoren (bei individuell manuell bearbeitet, bei pauschal aus Preset) */
	factors: factorSchema.partial(),
});

/**
 * TypeScript-Typ abgeleitet aus dem Schema.
 */
export type ModuleSetupFormData = z.infer<typeof moduleSetupSchema>;
