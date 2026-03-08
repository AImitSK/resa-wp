/**
 * Zod Schema für Messenger-Verbindungen (Slack, Teams, Discord).
 *
 * @see src/admin/components/integrations/MessengerTab.tsx
 */

import { z } from 'zod';
import { __ } from '@wordpress/i18n';

/**
 * Erlaubte Messenger-Plattformen.
 */
export const messengerPlatformSchema = z.enum(['slack', 'teams', 'discord']);

/**
 * URL-Pattern je Plattform für Webhook-Validierung.
 */
const webhookUrlPatterns: Record<string, RegExp> = {
	slack: /^https:\/\/hooks\.slack\.com\/services\/.+/,
	teams: /^https:\/\/.+\.webhook\.office\.com\/webhookb2\/.+/,
	discord: /^https:\/\/discord\.com\/api\/webhooks\/.+/,
};

/**
 * Schema für Messenger-Verbindungs-Formular.
 */
export const messengerFormSchema = z
	.object({
		/** Name der Verbindung */
		name: z
			.string()
			.min(1, __('Name ist erforderlich', 'resa'))
			.max(100, __('Name darf maximal 100 Zeichen haben', 'resa')),

		/** Plattform (nur bei Erstellung änderbar) */
		platform: messengerPlatformSchema,

		/** Webhook-URL */
		webhookUrl: z
			.string()
			.min(1, __('Webhook-URL ist erforderlich', 'resa'))
			.url(__('Bitte eine gültige URL eingeben', 'resa')),

		/** Aktiv-Status */
		isActive: z.boolean(),
	})
	.superRefine((data, ctx) => {
		// Plattform-spezifische URL-Validierung
		const pattern = webhookUrlPatterns[data.platform];
		if (pattern && data.webhookUrl && !pattern.test(data.webhookUrl)) {
			const platformNames: Record<string, string> = {
				slack: 'Slack',
				teams: 'Microsoft Teams',
				discord: 'Discord',
			};
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: __('Ungültige %s Webhook-URL', 'resa').replace(
					'%s',
					platformNames[data.platform] ?? data.platform,
				),
				path: ['webhookUrl'],
			});
		}
	});

/**
 * TypeScript-Typ abgeleitet aus dem Schema.
 */
export type MessengerFormData = z.infer<typeof messengerFormSchema>;
