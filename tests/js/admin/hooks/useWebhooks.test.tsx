/**
 * Unit tests for useWebhooks hooks.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// Mock api-client.
vi.mock('@/admin/lib/api-client', () => ({
	apiClient: {
		get: vi.fn(),
		post: vi.fn(),
		put: vi.fn(),
		del: vi.fn(),
	},
}));

import {
	useWebhooks,
	useCreateWebhook,
	useUpdateWebhook,
	useDeleteWebhook,
	useTestWebhook,
} from '@/admin/hooks/useWebhooks';
import { apiClient } from '@/admin/lib/api-client';
import type { WebhookConfig } from '@/admin/types';

const mockedApiClient = apiClient as {
	get: ReturnType<typeof vi.fn>;
	post: ReturnType<typeof vi.fn>;
	put: ReturnType<typeof vi.fn>;
	del: ReturnType<typeof vi.fn>;
};

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
	return function Wrapper({ children }: { children: ReactNode }) {
		return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	};
}

const sampleWebhook: WebhookConfig = {
	id: 1,
	name: 'Zapier Lead-Sync',
	url: 'https://hooks.zapier.com/test',
	secret: 'whsec_abc123',
	events: ['lead.created'],
	isActive: true,
	createdAt: '2025-06-01 12:00:00',
	updatedAt: '2025-06-01 12:00:00',
};

describe('useWebhooks', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useWebhooks Hook (GET)
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft GET admin/webhooks beim Mount auf', async () => {
		mockedApiClient.get.mockResolvedValueOnce([sampleWebhook]);

		const { result } = renderHook(() => useWebhooks(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.get).toHaveBeenCalledWith('admin/webhooks');
		expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
	});

	it('gibt Webhook-Array zurück', async () => {
		mockedApiClient.get.mockResolvedValueOnce([sampleWebhook]);

		const { result } = renderHook(() => useWebhooks(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data).toHaveLength(1);
		expect(result.current.data?.[0].name).toBe('Zapier Lead-Sync');
		expect(result.current.data?.[0].events).toEqual(['lead.created']);
	});

	it('gibt leeres Array zurück wenn keine Webhooks', async () => {
		mockedApiClient.get.mockResolvedValueOnce([]);

		const { result } = renderHook(() => useWebhooks(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data).toEqual([]);
	});

	it('behandelt API-Fehler korrekt', async () => {
		mockedApiClient.get.mockRejectedValueOnce(new Error('Network Error'));

		const { result } = renderHook(() => useWebhooks(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(result.current.error).toBeDefined();
	});

	it('setzt isLoading während des Ladens', () => {
		mockedApiClient.get.mockReturnValue(new Promise(() => {}));

		const { result } = renderHook(() => useWebhooks(), { wrapper: createWrapper() });

		expect(result.current.isLoading).toBe(true);
		expect(result.current.data).toBeUndefined();
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useCreateWebhook Hook (POST)
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft POST admin/webhooks beim Erstellen auf', async () => {
		mockedApiClient.get.mockResolvedValue([]);
		mockedApiClient.post.mockResolvedValueOnce(sampleWebhook);

		const { result } = renderHook(() => useCreateWebhook(), { wrapper: createWrapper() });

		result.current.mutate({
			name: 'Zapier Lead-Sync',
			url: 'https://hooks.zapier.com/test',
			events: ['lead.created'],
			isActive: true,
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.post).toHaveBeenCalledWith('admin/webhooks', {
			name: 'Zapier Lead-Sync',
			url: 'https://hooks.zapier.com/test',
			events: ['lead.created'],
			isActive: true,
		});
	});

	it('invalidiert Cache nach erfolgreichem Erstellen', async () => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});
		const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

		function Wrapper({ children }: { children: ReactNode }) {
			return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
		}

		mockedApiClient.get.mockResolvedValue([]);
		mockedApiClient.post.mockResolvedValueOnce(sampleWebhook);

		const { result } = renderHook(() => useCreateWebhook(), { wrapper: Wrapper });

		result.current.mutate({
			name: 'Test',
			url: 'https://example.com',
			events: ['lead.created'],
			isActive: true,
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['webhooks'] });
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useUpdateWebhook Hook (PUT)
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft PUT admin/webhooks/{id} beim Update auf', async () => {
		mockedApiClient.get.mockResolvedValue([sampleWebhook]);
		mockedApiClient.put.mockResolvedValueOnce({ ...sampleWebhook, name: 'Updated' });

		const { result } = renderHook(() => useUpdateWebhook(), { wrapper: createWrapper() });

		result.current.mutate({ id: 1, data: { name: 'Updated' } });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/webhooks/1', { name: 'Updated' });
	});

	it('toggle isActive via Update', async () => {
		mockedApiClient.get.mockResolvedValue([sampleWebhook]);
		mockedApiClient.put.mockResolvedValueOnce({ ...sampleWebhook, isActive: false });

		const { result } = renderHook(() => useUpdateWebhook(), { wrapper: createWrapper() });

		result.current.mutate({ id: 1, data: { isActive: false } });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/webhooks/1', { isActive: false });
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useDeleteWebhook Hook (DELETE)
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft DELETE admin/webhooks/{id} auf', async () => {
		mockedApiClient.get.mockResolvedValue([sampleWebhook]);
		mockedApiClient.del.mockResolvedValueOnce({ deleted: true });

		const { result } = renderHook(() => useDeleteWebhook(), { wrapper: createWrapper() });

		result.current.mutate(1);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.del).toHaveBeenCalledWith('admin/webhooks/1');
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useTestWebhook Hook (POST test)
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft POST admin/webhooks/{id}/test auf', async () => {
		mockedApiClient.post.mockResolvedValueOnce({ success: true, statusCode: 200 });

		const { result } = renderHook(() => useTestWebhook(), { wrapper: createWrapper() });

		result.current.mutate(1);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.post).toHaveBeenCalledWith('admin/webhooks/1/test', {});
	});

	it('gibt Fehlerergebnis bei fehlgeschlagenem Test zurück', async () => {
		mockedApiClient.post.mockResolvedValueOnce({
			success: false,
			statusCode: 500,
			error: 'Internal Server Error',
		});

		const { result } = renderHook(() => useTestWebhook(), { wrapper: createWrapper() });

		result.current.mutate(1);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data?.success).toBe(false);
		expect(result.current.data?.statusCode).toBe(500);
	});

	it('behandelt Netzwerkfehler beim Test', async () => {
		mockedApiClient.post.mockRejectedValueOnce(new Error('Network Error'));

		const { result } = renderHook(() => useTestWebhook(), { wrapper: createWrapper() });

		result.current.mutate(1);

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(result.current.error).toBeDefined();
	});
});
