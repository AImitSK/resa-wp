/**
 * Unit tests for useApiKeys hooks.
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
	useApiKeys,
	useCreateApiKey,
	useUpdateApiKey,
	useDeleteApiKey,
} from '@/admin/hooks/useApiKeys';
import { apiClient } from '@/admin/lib/api-client';
import type { ApiKeyConfig, ApiKeyCreateResponse } from '@/admin/types';

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

const sampleApiKey: ApiKeyConfig = {
	id: 1,
	name: 'Produktions-API',
	keyPrefix: 'resa_pk_abc',
	isActive: true,
	lastUsedAt: '2025-06-15 10:30:00',
	createdAt: '2025-06-01 12:00:00',
};

const sampleApiKeyCreateResponse: ApiKeyCreateResponse = {
	...sampleApiKey,
	key: 'resa_pk_abc123def456ghi789',
};

describe('useApiKeys', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useApiKeys Hook (GET)
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft GET admin/api-keys beim Mount auf', async () => {
		mockedApiClient.get.mockResolvedValueOnce([sampleApiKey]);

		const { result } = renderHook(() => useApiKeys(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.get).toHaveBeenCalledWith('admin/api-keys');
		expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
	});

	it('gibt API-Key-Array zurueck', async () => {
		mockedApiClient.get.mockResolvedValueOnce([sampleApiKey]);

		const { result } = renderHook(() => useApiKeys(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data).toHaveLength(1);
		expect(result.current.data?.[0].name).toBe('Produktions-API');
		expect(result.current.data?.[0].keyPrefix).toBe('resa_pk_abc');
	});

	it('gibt leeres Array zurueck wenn keine API-Keys', async () => {
		mockedApiClient.get.mockResolvedValueOnce([]);

		const { result } = renderHook(() => useApiKeys(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data).toEqual([]);
	});

	it('behandelt API-Fehler korrekt', async () => {
		mockedApiClient.get.mockRejectedValueOnce(new Error('Network Error'));

		const { result } = renderHook(() => useApiKeys(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(result.current.error).toBeDefined();
	});

	it('setzt isLoading waehrend des Ladens', () => {
		mockedApiClient.get.mockReturnValue(new Promise(() => {}));

		const { result } = renderHook(() => useApiKeys(), { wrapper: createWrapper() });

		expect(result.current.isLoading).toBe(true);
		expect(result.current.data).toBeUndefined();
	});

	it('zeigt lastUsedAt als null wenn Key nie verwendet wurde', async () => {
		const unusedKey: ApiKeyConfig = {
			...sampleApiKey,
			id: 2,
			name: 'Neuer API-Key',
			lastUsedAt: null,
		};
		mockedApiClient.get.mockResolvedValueOnce([unusedKey]);

		const { result } = renderHook(() => useApiKeys(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data?.[0].lastUsedAt).toBeNull();
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useCreateApiKey Hook (POST)
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft POST admin/api-keys beim Erstellen auf', async () => {
		mockedApiClient.get.mockResolvedValue([]);
		mockedApiClient.post.mockResolvedValueOnce(sampleApiKeyCreateResponse);

		const { result } = renderHook(() => useCreateApiKey(), { wrapper: createWrapper() });

		result.current.mutate({ name: 'Produktions-API' });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.post).toHaveBeenCalledWith('admin/api-keys', {
			name: 'Produktions-API',
		});
	});

	it('gibt vollen Key nur bei Erstellung zurueck', async () => {
		mockedApiClient.post.mockResolvedValueOnce(sampleApiKeyCreateResponse);

		const { result } = renderHook(() => useCreateApiKey(), { wrapper: createWrapper() });

		result.current.mutate({ name: 'Test-API' });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data?.key).toBe('resa_pk_abc123def456ghi789');
		expect(result.current.data?.keyPrefix).toBe('resa_pk_abc');
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
		mockedApiClient.post.mockResolvedValueOnce(sampleApiKeyCreateResponse);

		const { result } = renderHook(() => useCreateApiKey(), { wrapper: Wrapper });

		result.current.mutate({ name: 'Test' });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['api-keys'] });
	});

	it('behandelt Fehler beim Erstellen', async () => {
		mockedApiClient.post.mockRejectedValueOnce(new Error('Name bereits vergeben'));

		const { result } = renderHook(() => useCreateApiKey(), { wrapper: createWrapper() });

		result.current.mutate({ name: 'Duplikat' });

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(result.current.error).toBeDefined();
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useUpdateApiKey Hook (PUT)
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft PUT admin/api-keys/{id} beim Update auf', async () => {
		mockedApiClient.get.mockResolvedValue([sampleApiKey]);
		mockedApiClient.put.mockResolvedValueOnce({ ...sampleApiKey, name: 'Umbenannt' });

		const { result } = renderHook(() => useUpdateApiKey(), { wrapper: createWrapper() });

		result.current.mutate({ id: 1, data: { name: 'Umbenannt' } });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/api-keys/1', { name: 'Umbenannt' });
	});

	it('kann API-Key deaktivieren via isActive', async () => {
		mockedApiClient.get.mockResolvedValue([sampleApiKey]);
		mockedApiClient.put.mockResolvedValueOnce({ ...sampleApiKey, isActive: false });

		const { result } = renderHook(() => useUpdateApiKey(), { wrapper: createWrapper() });

		result.current.mutate({ id: 1, data: { isActive: false } });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/api-keys/1', { isActive: false });
	});

	it('kann Name und isActive zusammen aktualisieren', async () => {
		mockedApiClient.put.mockResolvedValueOnce({
			...sampleApiKey,
			name: 'Neuer Name',
			isActive: false,
		});

		const { result } = renderHook(() => useUpdateApiKey(), { wrapper: createWrapper() });

		result.current.mutate({ id: 1, data: { name: 'Neuer Name', isActive: false } });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/api-keys/1', {
			name: 'Neuer Name',
			isActive: false,
		});
	});

	it('invalidiert Cache nach erfolgreichem Update', async () => {
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

		mockedApiClient.put.mockResolvedValueOnce(sampleApiKey);

		const { result } = renderHook(() => useUpdateApiKey(), { wrapper: Wrapper });

		result.current.mutate({ id: 1, data: { name: 'Test' } });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['api-keys'] });
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useDeleteApiKey Hook (DELETE)
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft DELETE admin/api-keys/{id} auf', async () => {
		mockedApiClient.get.mockResolvedValue([sampleApiKey]);
		mockedApiClient.del.mockResolvedValueOnce({ deleted: true });

		const { result } = renderHook(() => useDeleteApiKey(), { wrapper: createWrapper() });

		result.current.mutate(1);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.del).toHaveBeenCalledWith('admin/api-keys/1');
	});

	it('gibt deleted: true bei erfolgreichem Loeschen zurueck', async () => {
		mockedApiClient.del.mockResolvedValueOnce({ deleted: true });

		const { result } = renderHook(() => useDeleteApiKey(), { wrapper: createWrapper() });

		result.current.mutate(1);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data?.deleted).toBe(true);
	});

	it('invalidiert Cache nach erfolgreichem Loeschen', async () => {
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

		mockedApiClient.del.mockResolvedValueOnce({ deleted: true });

		const { result } = renderHook(() => useDeleteApiKey(), { wrapper: Wrapper });

		result.current.mutate(1);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['api-keys'] });
	});

	it('behandelt Fehler beim Loeschen', async () => {
		mockedApiClient.del.mockRejectedValueOnce(new Error('API-Key nicht gefunden'));

		const { result } = renderHook(() => useDeleteApiKey(), { wrapper: createWrapper() });

		result.current.mutate(999);

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(result.current.error).toBeDefined();
	});
});
