/**
 * Zod Schema für reCAPTCHA v3 Einstellungen.
 *
 * @see src/admin/components/integrations/RecaptchaTab.tsx
 */

import { z } from 'zod';
import { __ } from '@wordpress/i18n';

/**
 * Schema für reCAPTCHA v3 Settings.
 */
export const recaptchaSettingsSchema = z
	.object({
		/** reCAPTCHA aktiviert */
		enabled: z.boolean(),

		/** Site Key (öffentlich) */
		site_key: z.string(),

		/** Secret Key (privat) */
		secret_key: z.string(),

		/** Score-Schwellenwert (0.0 - 1.0) */
		threshold: z
			.number()
			.min(0, __('Schwellenwert muss zwischen 0 und 1 liegen', 'resa'))
			.max(1, __('Schwellenwert muss zwischen 0 und 1 liegen', 'resa')),
	})
	.superRefine((data, ctx) => {
		// Wenn aktiviert, müssen beide Keys ausgefüllt sein
		if (data.enabled) {
			if (!data.site_key || data.site_key.trim() === '') {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: __('Site Key ist erforderlich wenn reCAPTCHA aktiviert ist', 'resa'),
					path: ['site_key'],
				});
			}
			if (!data.secret_key || data.secret_key.trim() === '') {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: __('Secret Key ist erforderlich wenn reCAPTCHA aktiviert ist', 'resa'),
					path: ['secret_key'],
				});
			}
		}
	});

/**
 * TypeScript-Typ abgeleitet aus dem Schema.
 */
export type RecaptchaSettingsFormData = z.infer<typeof recaptchaSettingsSchema>;
