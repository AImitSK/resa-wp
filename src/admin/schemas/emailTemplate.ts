/**
 * Zod Schema fuer Email-Template-Editor.
 *
 * @see src/admin/components/communication/TemplateEditor.tsx
 */

import { z } from 'zod';
import { __ } from '@wordpress/i18n';

/**
 * Schema fuer Email-Template-Formular.
 */
export const emailTemplateSchema = z.object({
	/** E-Mail-Betreff */
	subject: z
		.string()
		.min(1, __('Betreff ist erforderlich', 'resa'))
		.max(200, __('Betreff darf maximal 200 Zeichen haben', 'resa')),

	/** E-Mail-Inhalt (HTML) */
	body: z.string().min(1, __('Inhalt ist erforderlich', 'resa')),

	/** Vorlage aktiv/inaktiv */
	is_active: z.boolean(),
});

/**
 * TypeScript-Typ abgeleitet aus dem Schema.
 */
export type EmailTemplateFormData = z.infer<typeof emailTemplateSchema>;

/**
 * Schema fuer Test-Email-Dialog.
 */
export const testEmailSchema = z.object({
	/** Test-Email-Adresse */
	email: z
		.string()
		.min(1, __('E-Mail-Adresse ist erforderlich', 'resa'))
		.email(__('Bitte eine gueltige E-Mail-Adresse eingeben', 'resa')),
});

/**
 * TypeScript-Typ fuer Test-Email-Dialog.
 */
export type TestEmailFormData = z.infer<typeof testEmailSchema>;
