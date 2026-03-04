/**
 * Public REST API client for the frontend widget.
 *
 * `post()` — plain POST without spam guard (for tracking, config, etc.)
 * `postLead()` — POST with spam guard (nonce, honeypot, timestamp) for lead endpoints.
 *
 * Reads config from window.resaFrontend (injected by shortcode).
 */

function getRestUrl(): string {
	return window.resaFrontend?.restUrl ?? '/wp-json/resa/v1/';
}

function getNonce(): string {
	return window.resaFrontend?.nonce ?? '';
}

function getWpNonce(): string {
	return window.resaFrontend?.wpNonce ?? '';
}

function getTimestamp(): number {
	return window.resaFrontend?.ts ?? 0;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
	const baseUrl = getRestUrl();
	const url = `${baseUrl}${endpoint}`;

	const response = await fetch(url, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...options.headers,
		},
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		throw new Error(error.message || `HTTP ${response.status}`);
	}

	return response.json();
}

export const api = {
	get: <T>(endpoint: string) => request<T>(endpoint),

	post: <T>(endpoint: string, data: unknown) =>
		request<T>(endpoint, {
			method: 'POST',
			body: JSON.stringify(data),
		}),

	/**
	 * POST with spam guard fields (nonce, honeypot, timestamp).
	 * Use ONLY for lead endpoints (leads/partial, leads/complete).
	 */
	postLead: <T>(endpoint: string, data: unknown) =>
		request<T>(endpoint, {
			method: 'POST',
			body: JSON.stringify({
				...(data as Record<string, unknown>),
				_hp: '',
				_ts: getTimestamp(),
			}),
			headers: {
				'X-WP-Nonce': getWpNonce(),
				'X-Resa-Nonce': getNonce(),
			},
		}),
};
