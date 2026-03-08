/**
 * Zod Schema für PDF-Vorlage Basis-Layout-Einstellungen.
 *
 * @see src/admin/pages/PdfTemplates.tsx
 */

import { z } from 'zod';
import { __ } from '@wordpress/i18n';

/**
 * Schema für Seitenränder.
 */
const marginsSchema = z.object({
	/** Oberer Rand in mm (0-50) */
	top: z
		.number()
		.int()
		.min(0, __('Minimum ist 0 mm', 'resa'))
		.max(50, __('Maximum ist 50 mm', 'resa')),

	/** Unterer Rand in mm (0-50) */
	bottom: z
		.number()
		.int()
		.min(0, __('Minimum ist 0 mm', 'resa'))
		.max(50, __('Maximum ist 50 mm', 'resa')),

	/** Linker Rand in mm (0-50) */
	left: z
		.number()
		.int()
		.min(0, __('Minimum ist 0 mm', 'resa'))
		.max(50, __('Maximum ist 50 mm', 'resa')),

	/** Rechter Rand in mm (0-50) */
	right: z
		.number()
		.int()
		.min(0, __('Minimum ist 0 mm', 'resa'))
		.max(50, __('Maximum ist 50 mm', 'resa')),
});

/**
 * Schema für PDF-Vorlage Basis-Layout.
 */
export const pdfTemplateSchema = z.object({
	/** Optionaler Header-Text (z.B. Firmenname oder Slogan) */
	headerText: z.string().max(200, __('Header-Text darf maximal 200 Zeichen haben', 'resa')),

	/** Optionaler Footer-Text (z.B. Copyright) */
	footerText: z.string().max(200, __('Footer-Text darf maximal 200 Zeichen haben', 'resa')),

	/** Datum in Header/Footer anzeigen */
	showDate: z.boolean(),

	/** Ansprechpartner anzeigen */
	showAgents: z.boolean(),

	/** Logo-Position im Header */
	logoPosition: z.enum(['left', 'center', 'right']),

	/** Logo-Größe in Pixeln (16-80) */
	logoSize: z
		.number()
		.int()
		.min(16, __('Minimum ist 16px', 'resa'))
		.max(80, __('Maximum ist 80px', 'resa')),

	/** Seitenränder in mm */
	margins: marginsSchema,
});

/**
 * TypeScript-Typ abgeleitet aus dem Schema.
 */
export type PdfTemplateFormData = z.infer<typeof pdfTemplateSchema>;
