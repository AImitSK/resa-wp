/**
 * Zod Schema für Webhook-Konfiguration (Dialog-Formular).
 *
 * @see src/admin/components/integrations/WebhooksTab.tsx
 */

import { z } from 'zod';
import { __ } from '@wordpress/i18n';

/**
 * Schema für Webhook Create/Edit Dialog.
 */
export const webhookSchema = z.object({
	/** Webhook-Name (required) */
	name: z
		.string()
		.min(1, __('Name ist erforderlich', 'resa'))
		.max(100, __('Name darf maximal 100 Zeichen haben', 'resa')),

	/** Webhook-URL (required, valid URL) */
	url: z
		.string()
		.min(1, __('URL ist erforderlich', 'resa'))
		.refine((val) => /^https?:\/\/.+/.test(val), __('Bitte eine gültige URL eingeben', 'resa')),

	/** HMAC-SHA256 Secret (required) */
	secret: z.string().min(1, __('Secret ist erforderlich', 'resa')),

	/** Events, die den Webhook auslösen */
	events: z.array(z.string()).min(1, __('Mindestens ein Event ist erforderlich', 'resa')),

	/** Webhook aktiv/inaktiv */
	isActive: z.boolean(),
});

/**
 * TypeScript-Typ abgeleitet aus dem Schema.
 */
export type WebhookFormData = z.infer<typeof webhookSchema>;
