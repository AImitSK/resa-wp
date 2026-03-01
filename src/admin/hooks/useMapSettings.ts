/**
 * React Query hooks for map settings.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

export type MapProvider = 'osm' | 'google';
export type TileStyle = 'standard' | 'minimal' | 'dark';

export interface MapSettings {
	provider: MapProvider;
	tileStyle: TileStyle;
	defaultZoom: number;
	googleApiKey: string;
	scrollZoom: boolean;
	// Feature flags from backend
	canUseGoogle: boolean;
	canSelectStyle: boolean;
}

interface SaveMapSettingsData {
	provider?: MapProvider;
	tileStyle?: TileStyle;
	defaultZoom?: number;
	googleApiKey?: string;
	scrollZoom?: boolean;
}

const QUERY_KEY = ['map-settings'];

/**
 * Fetch map settings.
 */
export function useMapSettings() {
	return useQuery<MapSettings>({
		queryKey: QUERY_KEY,
		queryFn: () => apiClient.get<MapSettings>('admin/map-settings'),
	});
}

/**
 * Save map settings.
 */
export function useSaveMapSettings() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: SaveMapSettingsData) =>
			apiClient.put<MapSettings>('admin/map-settings', data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}
