/**
 * Frontend type definitions and window augmentation.
 *
 * `window.resaFrontend` is injected by the [resa] shortcode handler
 * via wp_localize_script. Available on public-facing pages only.
 */

export interface ResaFrontendContext {
	/** REST API base URL, e.g. "https://example.com/wp-json/resa/v1/" */
	restUrl: string;
	/** Module slug from shortcode attribute, e.g. "rent-calculator" */
	module: string;
	/** Pre-selected location slug (optional, from shortcode city attribute) */
	city?: string;
	/** Plugin version for cache-busting */
	version: string;
}

declare global {
	interface Window {
		resaFrontend: ResaFrontendContext;
	}
}

export {};
