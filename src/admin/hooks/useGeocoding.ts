/**
 * React Query hook for geocoding/address search.
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

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

interface GeocodingResponse {
	results: GeocodingResult[];
	provider: string;
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
			const response = await apiClient.get<GeocodingResponse>(
				`admin/geocoding/search?query=${encodeURIComponent(query)}`,
			);
			return response.results;
		},
		enabled: enabled && query.trim().length >= 2,
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
	});
}
