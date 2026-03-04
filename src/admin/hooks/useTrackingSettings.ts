/**
 * React Query hooks for tracking settings.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { TrackingSettings } from '../types';

const QUERY_KEY = ['tracking-settings'];

/**
 * Fetch tracking settings.
 */
export function useTrackingSettings() {
	return useQuery<TrackingSettings>({
		queryKey: QUERY_KEY,
		queryFn: () => apiClient.get<TrackingSettings>('admin/tracking-settings'),
	});
}

/**
 * Save tracking settings.
 */
export function useSaveTrackingSettings() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: Partial<TrackingSettings>) =>
			apiClient.put<TrackingSettings>('admin/tracking-settings', data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}
