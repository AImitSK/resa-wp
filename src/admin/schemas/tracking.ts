/**
 * Zod Schema für Tracking-Einstellungen.
 *
 * @see src/admin/components/settings/TrackingTab.tsx
 */

import { z } from 'zod';
import { __ } from '@wordpress/i18n';

/**
 * Schema für Tracking Settings.
 */
export const trackingSettingsSchema = z.object({
	/** Funnel-Tracking aktiviert */
	funnel_tracking_enabled: z.boolean(),

	/** Partial Leads aktiviert (Two-Phase Capture) */
	partial_leads_enabled: z.boolean(),

	/** Aufbewahrungsdauer für Partial Leads in Tagen (7-365) */
	partial_lead_ttl_days: z
		.number()
		.int()
		.min(7, __('Minimum 7 Tage', 'resa'))
		.max(365, __('Maximum 365 Tage', 'resa')),

	/** dataLayer / GTM Events aktiviert */
	datalayer_enabled: z.boolean(),

	/** Google Ads Conversion-ID für Formular-Ansicht */
	google_ads_fv_id: z.string(),

	/** Google Ads Conversion-Label für Formular-Ansicht */
	google_ads_fv_label: z.string(),

	/** Google Ads Conversion-ID für Formular-Absendung */
	google_ads_fs_id: z.string(),

	/** Google Ads Conversion-Label für Formular-Absendung */
	google_ads_fs_label: z.string(),

	/** Enhanced Conversions aktiviert (SHA-256 gehashte E-Mail) */
	enhanced_conversions_enabled: z.boolean(),

	/** GCLID aus URL erfassen */
	gclid_capture_enabled: z.boolean(),

	/** UTM-Parameter aus URL erfassen */
	utm_capture_enabled: z.boolean(),
});

/**
 * TypeScript-Typ abgeleitet aus dem Schema.
 */
export type TrackingSettingsFormData = z.infer<typeof trackingSettingsSchema>;
