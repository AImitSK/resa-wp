/**
 * React Query hooks for webhook CRUD operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { WebhookConfig, WebhookFormData, WebhookTestResult } from '../types';

const QUERY_KEY = ['webhooks'];

export function useWebhooks() {
	return useQuery<WebhookConfig[]>({
		queryKey: QUERY_KEY,
		queryFn: () => apiClient.get<WebhookConfig[]>('admin/webhooks'),
	});
}

export function useCreateWebhook() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: WebhookFormData) =>
			apiClient.post<WebhookConfig>('admin/webhooks', data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useUpdateWebhook() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: number; data: Partial<WebhookFormData> }) =>
			apiClient.put<WebhookConfig>(`admin/webhooks/${id}`, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useDeleteWebhook() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: number) => apiClient.del<{ deleted: boolean }>(`admin/webhooks/${id}`),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

export function useTestWebhook() {
	return useMutation({
		mutationFn: (id: number) =>
			apiClient.post<WebhookTestResult>(`admin/webhooks/${id}/test`, {}),
	});
}
