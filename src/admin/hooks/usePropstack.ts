/**
 * React Query hooks for Propstack integration
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type {
	PropstackSettings,
	PropstackBroker,
	PropstackContactSource,
	PropstackActivityType,
	PropstackTestResult,
} from '../types';

/**
 * Query keys for React Query cache management
 */
const QUERY_KEYS = {
	settings: ['propstack-settings'] as const,
	brokers: ['propstack-brokers'] as const,
	contactSources: ['propstack-contact-sources'] as const,
	activityTypes: ['propstack-activity-types'] as const,
};

/**
 * Get Propstack settings
 */
export function usePropstackSettings() {
	return useQuery({
		queryKey: QUERY_KEYS.settings,
		queryFn: () => apiClient.get<PropstackSettings>('admin/propstack/settings'),
	});
}

/**
 * Save Propstack settings
 */
export function useSavePropstackSettings() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: Partial<PropstackSettings>) =>
			apiClient.put<PropstackSettings>('admin/propstack/settings', data),
		onSuccess: () => {
			// Invalidate all caches when settings change
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.brokers });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contactSources });
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activityTypes });
		},
	});
}

/**
 * Test Propstack API connection
 */
export function useTestPropstackConnection() {
	return useMutation({
		mutationFn: (apiKey: string) =>
			apiClient.post<PropstackTestResult>('admin/propstack/test-connection', {
				api_key: apiKey,
			}),
	});
}

/**
 * Get brokers (cached, only fetch when enabled)
 */
export function usePropstackBrokers(enabled: boolean) {
	return useQuery({
		queryKey: QUERY_KEYS.brokers,
		queryFn: () => apiClient.get<PropstackBroker[]>('admin/propstack/brokers'),
		enabled,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
}

/**
 * Get contact sources (cached, only fetch when enabled)
 */
export function usePropstackContactSources(enabled: boolean) {
	return useQuery({
		queryKey: QUERY_KEYS.contactSources,
		queryFn: () => apiClient.get<PropstackContactSource[]>('admin/propstack/contact-sources'),
		enabled,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
}

/**
 * Get activity types (cached, only fetch when enabled)
 */
export function usePropstackActivityTypes(enabled: boolean) {
	return useQuery({
		queryKey: QUERY_KEYS.activityTypes,
		queryFn: () => apiClient.get<PropstackActivityType[]>('admin/propstack/activity-types'),
		enabled,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
}

/**
 * Manual re-sync of a lead
 */
export function useManualPropstackSync() {
	return useMutation({
		mutationFn: (leadId: number) => apiClient.post(`admin/propstack/sync/${leadId}`, {}),
	});
}
