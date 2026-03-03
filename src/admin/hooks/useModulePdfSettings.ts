/**
 * React Query hooks for per-module PDF section settings.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

export interface ModulePdfSettings {
	showChart: boolean;
	showFactors: boolean;
	showMap: boolean;
	showCta: boolean;
	showDisclaimer: boolean;
	ctaTitle: string;
	ctaText: string;
}

const QUERY_KEY = ['module-pdf-settings'];

/**
 * Fetch module PDF settings by slug.
 */
export function useModulePdfSettings(slug: string | undefined) {
	return useQuery<ModulePdfSettings>({
		queryKey: [...QUERY_KEY, slug],
		queryFn: () => apiClient.get<ModulePdfSettings>(`admin/modules/${slug}/pdf-settings`),
		enabled: !!slug,
	});
}

/**
 * Save module PDF settings.
 */
export function useSaveModulePdfSettings(slug: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: Partial<ModulePdfSettings>) =>
			apiClient.put<ModulePdfSettings>(`admin/modules/${slug}/pdf-settings`, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, slug] });
		},
	});
}
