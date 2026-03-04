/**
 * URL parameter capture for offline conversion tracking.
 *
 * Captures GCLID, FBCLID, MSCLKID, and UTM parameters from the
 * current URL and persists them in sessionStorage. Values are
 * merged so the first non-empty value wins (landing page params
 * are preserved even after navigation).
 */

const STORAGE_KEY = 'resa_url_params';

export interface CapturedParams {
	gclid?: string;
	fbclid?: string;
	msclkid?: string;
	utm_source?: string;
	utm_medium?: string;
	utm_campaign?: string;
	utm_content?: string;
	utm_term?: string;
}

const PARAM_KEYS: (keyof CapturedParams)[] = [
	'gclid',
	'fbclid',
	'msclkid',
	'utm_source',
	'utm_medium',
	'utm_campaign',
	'utm_content',
	'utm_term',
];

/**
 * Read URL parameters and merge with previously stored values.
 *
 * Call this once on widget mount. First non-empty value per key wins,
 * so landing-page params are preserved across soft navigations.
 */
export function captureUrlParams(): void {
	try {
		const url = new URL(window.location.href);
		const stored = getStoredParams();
		let changed = false;

		for (const key of PARAM_KEYS) {
			const value = url.searchParams.get(key);
			if (value && !stored[key]) {
				stored[key] = value;
				changed = true;
			}
		}

		if (changed) {
			sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
		}
	} catch {
		// Silently ignore — tracking must never break the widget.
	}
}

/**
 * Get all captured URL parameters.
 *
 * Returns an empty object if nothing was captured.
 */
export function getCapturedParams(): CapturedParams {
	return getStoredParams();
}

function getStoredParams(): CapturedParams {
	try {
		const raw = sessionStorage.getItem(STORAGE_KEY);
		if (raw) {
			return JSON.parse(raw) as CapturedParams;
		}
	} catch {
		// Corrupted storage — ignore.
	}
	return {};
}
