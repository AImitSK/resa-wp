/**
 * Zod Schema für Propstack CRM Integration Einstellungen.
 *
 * @see src/admin/components/integrations/PropstackTab.tsx
 */

import { z } from 'zod';
import { __ } from '@wordpress/i18n';

/**
 * Schema für Propstack Integration Settings.
 */
export const propstackSettingsSchema = z.object({
	/** Integration aktiviert */
	enabled: z.boolean(),

	/** Propstack API-Key */
	api_key: z.string(),

	/** Mapping von Location-ID zu Broker-ID */
	city_broker_mapping: z.record(z.coerce.number(), z.number()),

	/** Standard-Makler ID (null = keiner ausgewählt) */
	default_broker_id: z.number().nullable(),

	/** Kontaktquellen-ID für neue Kontakte */
	contact_source_id: z.number().nullable(),

	/** Automatische Aktivitätserstellung aktiviert */
	activity_enabled: z.boolean(),

	/** Aktivitäts-Typ ID */
	activity_type_id: z.number().nullable(),

	/** Aktivität als Aufgabe erstellen */
	activity_create_task: z.boolean(),

	/** Fälligkeit der Aufgabe in Werktagen */
	activity_task_due_days: z
		.number()
		.int()
		.min(1, __('Mindestens 1 Werktag', 'resa'))
		.max(30, __('Maximal 30 Werktage', 'resa')),

	/** Nur Newsletter-DOI synchronisieren */
	sync_newsletter_only: z.boolean(),

	/** Newsletter-Makler ID */
	newsletter_broker_id: z.number().nullable(),
});

/**
 * TypeScript-Typ abgeleitet aus dem Schema.
 */
export type PropstackSettingsFormData = z.infer<typeof propstackSettingsSchema>;
