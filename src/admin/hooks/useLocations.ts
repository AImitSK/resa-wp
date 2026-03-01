/**
 * React Query hooks for location CRUD operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

export interface LocationAdmin {
	id: number;
	slug: string;
	name: string;
	country: string;
	bundesland: string;
	region_type: string;
	currency: string;
	latitude: number | null;
	longitude: number | null;
	zoom_level: number;
	data: Record<string, unknown>;
	factors: Record<string, unknown> | null;
	agent_id: number | null;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

interface CreateLocationData {
	name: string;
	slug?: string;
	country?: string;
	bundesland?: string;
	region_type?: string;
	latitude?: number | null;
	longitude?: number | null;
	zoom_level?: number;
	data?: Record<string, unknown>;
	factors?: Record<string, unknown> | null;
	is_active?: boolean;
}

type UpdateLocationData = Partial<CreateLocationData>;

const QUERY_KEY = ['locations'];

export function useLocations() {
	return useQuery<LocationAdmin[]>({
		queryKey: QUERY_KEY,
		queryFn: () => apiClient.get<LocationAdmin[]>('admin/locations'),
	});
}

export function useLocation(id: number | null) {
	return useQuery<LocationAdmin>({
		queryKey: [...QUERY_KEY, id],
		queryFn: () => apiClient.get<LocationAdmin>(`admin/locations/${id}`),
		enabled: id !== null,
	});
}

export function useCreateLocation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreateLocationData) =>
			apiClient.post<LocationAdmin>('admin/locations', data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useUpdateLocation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: number; data: UpdateLocationData }) =>
			apiClient.put<LocationAdmin>(`admin/locations/${id}`, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useDeleteLocation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: number) => apiClient.del<{ deleted: boolean }>(`admin/locations/${id}`),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}
