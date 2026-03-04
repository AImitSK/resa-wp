/**
 * Public REST API client for the frontend widget.
 *
 * Sends WordPress nonce (CSRF), honeypot field, and server timestamp
 * with every POST request for spam protection.
 * Reads config from window.resaFrontend (injected by shortcode).
 */

function getRestUrl(): string {
	return window.resaFrontend?.restUrl ?? '/wp-json/resa/v1/';
}

function getNonce(): string {
	return window.resaFrontend?.nonce ?? '';
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
			body: JSON.stringify({
				...(data as Record<string, unknown>),
				_hp: '',
				_ts: getTimestamp(),
			}),
			headers: {
				'X-WP-Nonce': getNonce(),
			},
		}),
};
