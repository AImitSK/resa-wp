/**
 * React Query hooks for messenger CRUD operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { MessengerConfig, MessengerFormData, MessengerTestResult } from '../types';

const QUERY_KEY = ['messengers'];

export function useMessengers() {
	return useQuery<MessengerConfig[]>({
		queryKey: QUERY_KEY,
		queryFn: () => apiClient.get<MessengerConfig[]>('admin/messengers'),
	});
}

export function useCreateMessenger() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: MessengerFormData) =>
			apiClient.post<MessengerConfig>('admin/messengers', data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useUpdateMessenger() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: number; data: Partial<MessengerFormData> }) =>
			apiClient.put<MessengerConfig>(`admin/messengers/${id}`, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useDeleteMessenger() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: number) => apiClient.del<{ deleted: boolean }>(`admin/messengers/${id}`),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useTestMessenger() {
	return useMutation({
		mutationFn: (id: number) =>
			apiClient.post<MessengerTestResult>(`admin/messengers/${id}/test`, {}),
	});
}
