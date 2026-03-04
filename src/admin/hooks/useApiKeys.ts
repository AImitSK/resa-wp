/**
 * React Query hooks for API key CRUD operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { ApiKeyConfig, ApiKeyCreateResponse } from '../types';

const QUERY_KEY = ['api-keys'];

export function useApiKeys() {
	return useQuery<ApiKeyConfig[]>({
		queryKey: QUERY_KEY,
		queryFn: () => apiClient.get<ApiKeyConfig[]>('admin/api-keys'),
	});
}

export function useCreateApiKey() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: { name: string }) =>
			apiClient.post<ApiKeyCreateResponse>('admin/api-keys', data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useUpdateApiKey() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			id,
			data,
		}: {
			id: number;
			data: Partial<{ name: string; isActive: boolean }>;
		}) => apiClient.put<ApiKeyConfig>(`admin/api-keys/${id}`, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useDeleteApiKey() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: number) => apiClient.del<{ deleted: boolean }>(`admin/api-keys/${id}`),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}
