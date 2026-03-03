/**
 * REST API client with automatic nonce injection.
 *
 * All requests go through this client to ensure
 * authentication via the WP REST nonce.
 */

function getContext() {
	return window.resaAdmin;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
	const { restUrl, nonce } = getContext();

	const url = `${restUrl}${endpoint}`;

	const response = await fetch(url, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			'X-WP-Nonce': nonce,
			...options.headers,
		},
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		throw new Error(error.message || `HTTP ${response.status}`);
	}

	// 204 No Content — return null (no body to parse).
	if (response.status === 204) {
		return null as T;
	}

	return response.json();
}

export const apiClient = {
	get: <T>(endpoint: string) => request<T>(endpoint),

	post: <T>(endpoint: string, data: unknown) =>
		request<T>(endpoint, {
			method: 'POST',
			body: JSON.stringify(data),
		}),

	put: <T>(endpoint: string, data: unknown) =>
		request<T>(endpoint, {
			method: 'PUT',
			body: JSON.stringify(data),
		}),

	del: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};
