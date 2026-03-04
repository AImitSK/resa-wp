/**
 * Frontend type definitions and window augmentation.
 *
 * `window.resaFrontend` is injected by the [resa] shortcode handler
 * via wp_localize_script. Available on public-facing pages only.
 */

export interface ResaFrontendContext {
	/** REST API base URL, e.g. "https://example.com/wp-json/resa/v1/" */
	restUrl: string;
	/** RESA nonce for spam protection (resa_lead_submit action). */
	nonce: string;
	/** WordPress REST nonce (wp_rest action) to preserve cookie auth. */
	wpNonce?: string;
	/** Server timestamp for spam time-check. */
	ts: number;
	/** Module slug from shortcode attribute, e.g. "rent-calculator" */
	module: string;
	/** Pre-selected location slug (optional, from shortcode city attribute) */
	city?: string;
	/** Plugin version for cache-busting */
	version: string;
	/** Privacy configuration from admin settings. */
	privacyConfig?: {
		privacyUrl: string;
		consentText: string;
		newsletterText: string;
	};
	/** reCAPTCHA v3 site key (only present when enabled). */
	recaptchaSiteKey?: string;
	/** Tracking configuration from admin settings. */
	trackingConfig?: {
		datalayer_enabled: boolean;
		google_ads: {
			form_view: { id: string; label: string };
			form_submit: { id: string; label: string };
		};
		enhanced_conversions: boolean;
		gclid_capture: boolean;
		utm_capture: boolean;
	};
}

declare global {
	interface Window {
		resaFrontend: ResaFrontendContext;
		grecaptcha?: {
			ready: (callback: () => void) => void;
			execute: (siteKey: string, options: { action: string }) => Promise<string>;
		};
	}
}

export {};
