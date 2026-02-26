/**
 * React Query hooks for module settings operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

export interface ModuleInfo {
	slug: string;
	name: string;
	description: string;
	icon: string;
	category: string;
	flag: 'free' | 'pro' | 'paid';
	active: boolean;
}

export interface LocationValue {
	base_price: number;
	price_min?: number;
	price_max?: number;
	[key: string]: unknown;
}

export interface ModuleSettingsData {
	id?: number;
	module_slug: string;
	setup_mode: 'pauschal' | 'individuell';
	region_preset: string;
	factors: Record<string, unknown> | null;
	location_values: Record<string, LocationValue>;
	module?: ModuleInfo;
	created_at?: string;
	updated_at?: string;
}

export interface RegionPreset {
	label: string;
	base_price: number;
	size_degression?: number;
	[key: string]: unknown;
}

interface SaveSettingsData {
	setup_mode?: 'pauschal' | 'individuell';
	region_preset?: string;
	factors?: Record<string, unknown>;
	location_values?: Record<string, LocationValue>;
}

const QUERY_KEY = ['module-settings'];

/**
 * Fetch module settings by slug.
 */
export function useModuleSettings(slug: string | undefined) {
	return useQuery<ModuleSettingsData>({
		queryKey: [...QUERY_KEY, slug],
		queryFn: () => apiClient.get<ModuleSettingsData>(`admin/modules/${slug}/settings`),
		enabled: !!slug,
	});
}

/**
 * Fetch available presets for a module.
 */
export function useModulePresets(slug: string | undefined) {
	return useQuery<Record<string, RegionPreset>>({
		queryKey: ['module-presets', slug],
		queryFn: () => apiClient.get<Record<string, RegionPreset>>(`admin/modules/${slug}/presets`),
		enabled: !!slug,
	});
}

/**
 * Save module settings.
 */
export function useSaveModuleSettings(slug: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: SaveSettingsData) =>
			apiClient.put<ModuleSettingsData>(`admin/modules/${slug}/settings`, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, slug] });
		},
	});
}

/**
 * Save location-specific values for a module.
 */
export function useSaveLocationValue(slug: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ locationId, values }: { locationId: number; values: LocationValue }) =>
			apiClient.put<{ location_id: number; values: LocationValue }>(
				`admin/modules/${slug}/settings/locations/${locationId}`,
				values,
			),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, slug] });
		},
	});
}

/**
 * Delete location-specific values for a module.
 */
export function useDeleteLocationValue(slug: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (locationId: number) =>
			apiClient.del<{ deleted: boolean }>(
				`admin/modules/${slug}/settings/locations/${locationId}`,
			),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, slug] });
		},
	});
}
