/**
 * React Query hooks for privacy / GDPR settings.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { PrivacySettings } from '../types';

const QUERY_KEY = ['privacy-settings'];

/**
 * Fetch privacy settings.
 */
export function usePrivacySettings() {
	return useQuery<PrivacySettings>({
		queryKey: QUERY_KEY,
		queryFn: () => apiClient.get<PrivacySettings>('admin/privacy-settings'),
	});
}

/**
 * Save privacy settings.
 */
export function useSavePrivacySettings() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: Partial<PrivacySettings>) =>
			apiClient.put<PrivacySettings>('admin/privacy-settings', data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}
