/**
 * React Query hook for geocoding/address search.
 *
 * Uses the same approach as the frontend useAddressSearch hook:
 * proper URL construction via URL API and handling of both
 * wrapped ({data: {results}}) and direct ({results}) response formats.
 */

import { useQuery } from '@tanstack/react-query';

export interface GeocodingResult {
	lat: number;
	lng: number;
	display_name: string;
	city: string | null;
	state: string | null;
	country: string | null;
	country_code: string | null;
	postal_code: string | null;
}

/**
 * Search for addresses using the geocoding API.
 *
 * @param query Search query (min 2 characters).
 * @param enabled Whether to run the query.
 */
export function useGeocoding(query: string, enabled: boolean = true) {
	return useQuery<GeocodingResult[]>({
		queryKey: ['geocoding', query],
		queryFn: async () => {
			const { restUrl, nonce } = window.resaAdmin;

			// Build URL properly via URL API (handles existing query strings).
			const url = new URL(`${restUrl}admin/geocoding/search`, window.location.origin);
			url.searchParams.set('query', query.trim());

			const response = await fetch(url.toString(), {
				headers: {
					Accept: 'application/json',
					'X-WP-Nonce': nonce,
				},
			});

			if (!response.ok) {
				const err = await response.json().catch(() => ({}));
				throw new Error(err.message || `HTTP ${response.status}`);
			}

			const data = await response.json();

			// Handle both wrapped and direct response formats.
			return data.data?.results ?? data.results ?? [];
		},
		enabled: enabled && query.trim().length >= 2,
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	});
}
