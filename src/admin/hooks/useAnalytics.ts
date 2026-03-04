/**
 * React Query hooks for analytics / funnel data.
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { FunnelData } from '../types';

interface FunnelFilters {
	dateFrom?: string;
	dateTo?: string;
	assetType?: string;
	locationId?: number | null;
}

/**
 * Fetch aggregated funnel data for the analytics dashboard.
 */
export function useFunnelData(filters: FunnelFilters = {}) {
	const params = new URLSearchParams();

	if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
	if (filters.dateTo) params.set('dateTo', filters.dateTo);
	if (filters.assetType) params.set('assetType', filters.assetType);
	if (filters.locationId != null) params.set('locationId', String(filters.locationId));

	const queryString = params.toString();
	const endpoint = queryString ? `analytics/funnel?${queryString}` : 'analytics/funnel';

	return useQuery<FunnelData>({
		queryKey: ['funnel', filters],
		queryFn: () => apiClient.get<FunnelData>(endpoint),
	});
}
