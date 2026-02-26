/**
 * React Query hooks for module management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { ModuleSummary } from '../types';

const QUERY_KEY = ['modules'];

/**
 * Fetch all registered modules.
 */
export function useModules() {
	return useQuery<ModuleSummary[]>({
		queryKey: QUERY_KEY,
		queryFn: () => apiClient.get<ModuleSummary[]>('admin/modules'),
	});
}

/**
 * Toggle module activation state.
 */
export function useToggleModule() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (slug: string) =>
			apiClient.post<{ slug: string; active: boolean }>(`admin/modules/${slug}/toggle`, {}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}
