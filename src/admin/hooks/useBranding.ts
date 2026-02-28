/**
 * React Query hooks for branding settings.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

export interface BrandingSettings {
	logoUrl: string;
	logoId: number;
	primaryColor: string;
	secondaryColor: string;
	showPoweredBy: boolean;
}

interface SaveBrandingData {
	logoUrl?: string;
	logoId?: number;
	primaryColor?: string;
	secondaryColor?: string;
	showPoweredBy?: boolean;
}

const QUERY_KEY = ['branding'];

/**
 * Fetch branding settings.
 */
export function useBranding() {
	return useQuery<BrandingSettings>({
		queryKey: QUERY_KEY,
		queryFn: () => apiClient.get<BrandingSettings>('admin/branding'),
	});
}

/**
 * Save branding settings.
 */
export function useSaveBranding() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: SaveBrandingData) =>
			apiClient.put<BrandingSettings>('admin/branding', data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}
