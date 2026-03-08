/**
 * Zod Schema für PDF-Einstellungen eines Moduls.
 *
 * @see src/admin/components/module-settings/PdfTab.tsx
 */

import { z } from 'zod';
import { __ } from '@wordpress/i18n';

/**
 * Schema für PDF-Sektionen und CTA-Anpassung.
 */
export const pdfSettingsSchema = z.object({
	/** Marktvergleich-Diagramm anzeigen */
	showChart: z.boolean(),

	/** Einflussfaktoren-Tabelle anzeigen */
	showFactors: z.boolean(),

	/** Standort-Karte anzeigen */
	showMap: z.boolean(),

	/** Kontakt-CTA anzeigen */
	showCta: z.boolean(),

	/** Hinweis/Disclaimer anzeigen */
	showDisclaimer: z.boolean(),

	/** Optionaler CTA-Titel (leer = Standard) */
	ctaTitle: z.string().max(200, __('CTA-Titel darf maximal 200 Zeichen haben', 'resa')),

	/** Optionaler CTA-Text (leer = Standard) */
	ctaText: z.string().max(500, __('CTA-Text darf maximal 500 Zeichen haben', 'resa')),
});

/**
 * TypeScript-Typ abgeleitet aus dem Schema.
 */
export type PdfSettingsFormData = z.infer<typeof pdfSettingsSchema>;
