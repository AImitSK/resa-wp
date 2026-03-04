/**
 * dataLayer / GTM integration and Google Ads conversion firing.
 *
 * Reads configuration from `window.resaFrontend.trackingConfig`.
 * All operations are fire-and-forget — errors are silently ignored
 * to ensure tracking never blocks the user experience.
 */

import type { TrackingEvent } from './tracking';

// ─── Types ───────────────────────────────────────────────

interface TrackingConfig {
	datalayer_enabled: boolean;
	google_ads: {
		form_view: { id: string; label: string };
		form_submit: { id: string; label: string };
	};
	enhanced_conversions: boolean;
	gclid_capture: boolean;
	utm_capture: boolean;
}

interface DataLayerEvent {
	event: string;
	resa_event: TrackingEvent;
	resa_asset_type?: string;
	resa_location_id?: number;
	resa_step?: number;
	resa_step_total?: number;
	[key: string]: unknown;
}

// Extend Window for dataLayer and gtag.
declare global {
	interface Window {
		dataLayer?: Record<string, unknown>[];
		gtag?: (...args: unknown[]) => void;
	}
}

// ─── Internal State ──────────────────────────────────────

let gtagLoaded = false;

function getConfig(): TrackingConfig | undefined {
	return window.resaFrontend?.trackingConfig;
}

// ─── dataLayer Push ──────────────────────────────────────

/**
 * Push a RESA event to the GTM dataLayer.
 *
 * Only fires when `datalayer_enabled` is true in the tracking config.
 * Event names are prefixed with `resa_` for easy GTM trigger matching.
 */
export function pushToDataLayer(
	event: TrackingEvent,
	assetType: string,
	extra?: { location_id?: number; step?: number; step_total?: number },
): void {
	try {
		const config = getConfig();
		if (!config?.datalayer_enabled) return;

		window.dataLayer = window.dataLayer ?? [];

		const dlEvent: DataLayerEvent = {
			event: `resa_${event}`,
			resa_event: event,
			resa_asset_type: assetType,
		};

		if (extra?.location_id) dlEvent.resa_location_id = extra.location_id;
		if (extra?.step !== undefined) dlEvent.resa_step = extra.step;
		if (extra?.step_total !== undefined) dlEvent.resa_step_total = extra.step_total;

		window.dataLayer.push(dlEvent);
	} catch {
		// Silently ignore.
	}
}

// ─── Google Ads Conversion ───────────────────────────────

/**
 * Fire a Google Ads conversion event for form_view or form_submit.
 *
 * Dynamically loads gtag.js if a conversion ID is configured and
 * the script hasn't been loaded yet.
 */
export function fireGoogleAdsConversion(type: 'form_view' | 'form_submit', value?: number): void {
	try {
		const config = getConfig();
		if (!config) return;

		const convConfig = config.google_ads[type];
		if (!convConfig.id || !convConfig.label) return;

		ensureGtag(convConfig.id);

		if (!window.gtag) return;

		const conversionParams: Record<string, unknown> = {
			send_to: `${convConfig.id}/${convConfig.label}`,
		};

		if (value !== undefined && value > 0) {
			conversionParams.value = value;
			conversionParams.currency = 'EUR';
		}

		window.gtag('event', 'conversion', conversionParams);
	} catch {
		// Silently ignore.
	}
}

/**
 * Push enhanced conversion data (hashed email) to dataLayer.
 *
 * Google Ads Enhanced Conversions require a SHA-256 hash of the
 * user's email. The hash is computed client-side.
 */
export async function pushEnhancedConversion(email: string): Promise<void> {
	try {
		const config = getConfig();
		if (!config?.enhanced_conversions) return;

		const normalizedEmail = email.trim().toLowerCase();
		const hash = await sha256(normalizedEmail);

		window.dataLayer = window.dataLayer ?? [];
		window.dataLayer.push({
			event: 'resa_enhanced_conversion',
			enhanced_conversion_data: {
				email: hash,
			},
		});
	} catch {
		// Silently ignore.
	}
}

// ─── Helpers ─────────────────────────────────────────────

/**
 * Load gtag.js dynamically (once) for the given conversion ID.
 */
function ensureGtag(conversionId: string): void {
	if (gtagLoaded) return;
	gtagLoaded = true;

	// Initialize dataLayer and gtag function.
	window.dataLayer = window.dataLayer ?? [];
	window.gtag =
		window.gtag ??
		function gtag() {
			// eslint-disable-next-line prefer-rest-params
			window.dataLayer!.push(arguments as unknown as Record<string, unknown>);
		};

	window.gtag('js', new Date());
	window.gtag('config', conversionId, { send_page_view: false });

	// Load the script.
	const script = document.createElement('script');
	script.async = true;
	script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(conversionId)}`;
	document.head.appendChild(script);
}

/**
 * Compute SHA-256 hash of a string using the Web Crypto API.
 */
async function sha256(message: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(message);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
