/**
 * Zod Schema für allgemeine Einstellungen (Maklerdaten + Branding).
 *
 * @see src/admin/pages/Settings.tsx
 */

import { z } from 'zod';
import { __ } from '@wordpress/i18n';

/**
 * Hex-Farbwert Validierung (#RGB oder #RRGGBB).
 */
const hexColorSchema = z
	.string()
	.regex(
		/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
		__('Bitte einen gültigen Hex-Farbwert eingeben (z.B. #a9e43f)', 'resa'),
	);

/**
 * Schema für Maklerdaten.
 */
export const agentDataSchema = z.object({
	/** Name des Maklers/Ansprechpartners (Pflichtfeld) */
	name: z.string().min(1, __('Name ist erforderlich', 'resa')),

	/** Firmenname (optional) */
	company: z.string(),

	/** E-Mail-Adresse (Pflichtfeld) */
	email: z
		.string()
		.min(1, __('E-Mail ist erforderlich', 'resa'))
		.email(__('Bitte eine gültige E-Mail-Adresse eingeben', 'resa')),

	/** Telefonnummer (optional) */
	phone: z.string(),

	/** Adresse (optional, mehrzeilig) */
	address: z.string(),

	/** Website-URL (optional) */
	website: z
		.string()
		.refine(
			(val) => val === '' || /^https?:\/\/.+/.test(val),
			__('Bitte eine gültige URL eingeben', 'resa'),
		),

	/** Impressum-URL (optional) */
	imprintUrl: z
		.string()
		.refine(
			(val) => val === '' || /^https?:\/\/.+/.test(val),
			__('Bitte eine gültige URL eingeben', 'resa'),
		),
});

/**
 * Schema für Branding-Einstellungen.
 */
export const brandingSchema = z.object({
	/** Logo-URL (optional) */
	logoUrl: z.string(),

	/** WordPress Media Library ID des Logos */
	logoId: z.number().int().min(0),

	/** Primärfarbe (Hex) */
	primaryColor: hexColorSchema,

	/** Sekundärfarbe (Hex) */
	secondaryColor: hexColorSchema,

	/** "Powered by RESA" anzeigen */
	showPoweredBy: z.boolean(),
});

/**
 * Kombiniertes Schema für das gesamte Formular.
 */
export const generalSettingsSchema = z.object({
	agent: agentDataSchema,
	branding: brandingSchema,
});

/**
 * TypeScript-Typen abgeleitet aus den Schemas.
 */
export type AgentDataFormData = z.infer<typeof agentDataSchema>;
export type BrandingFormData = z.infer<typeof brandingSchema>;
export type GeneralSettingsFormData = z.infer<typeof generalSettingsSchema>;
