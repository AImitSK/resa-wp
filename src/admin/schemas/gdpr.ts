/**
 * Zod Schema für GDPR/Datenschutz-Einstellungen.
 *
 * @see src/admin/components/settings/GdprTab.tsx
 */

import { z } from 'zod';
import { __ } from '@wordpress/i18n';

/**
 * Schema für Privacy/GDPR Settings.
 */
export const gdprSettingsSchema = z.object({
	/** URL zur Datenschutzerklärung (leer = WP Privacy Page) */
	privacy_url: z
		.string()
		.refine(
			(val) => val === '' || /^https?:\/\/.+/.test(val),
			__('Bitte eine gültige URL eingeben', 'resa'),
		),

	/** Einwilligungstext für das Lead-Formular */
	consent_text: z
		.string()
		.min(1, __('Einwilligungstext ist erforderlich', 'resa'))
		.max(500, __('Einwilligungstext darf maximal 500 Zeichen haben', 'resa')),

	/** Newsletter Opt-In Text */
	newsletter_text: z
		.string()
		.min(1, __('Newsletter-Text ist erforderlich', 'resa'))
		.max(200, __('Newsletter-Text darf maximal 200 Zeichen haben', 'resa')),

	/** Aufbewahrungsdauer für Leads in Tagen (0 = unbegrenzt) */
	lead_retention_days: z.number().int().min(0, __('Wert muss 0 oder größer sein', 'resa')),

	/** Aufbewahrungsdauer für E-Mail-Logs in Tagen (0 = unbegrenzt) */
	email_log_retention_days: z.number().int().min(0, __('Wert muss 0 oder größer sein', 'resa')),

	/** Anonymisieren statt Löschen bei Ablauf */
	anonymize_instead_of_delete: z.boolean(),
});

/**
 * TypeScript-Typ abgeleitet aus dem Schema.
 */
export type GdprSettingsFormData = z.infer<typeof gdprSettingsSchema>;
