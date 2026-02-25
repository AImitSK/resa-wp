/**
 * Public REST API client for the frontend widget.
 *
 * Unlike the admin client, this does NOT send a nonce —
 * public endpoints are accessible without authentication.
 * Reads base URL from window.resaFrontend (injected by shortcode).
 */

function getRestUrl(): string {
	return window.resaFrontend?.restUrl ?? '/wp-json/resa/v1/';
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
};
