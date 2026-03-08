/**
 * Unit tests für useLocations Hooks.
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
	useLocations,
	useLocation,
	useCreateLocation,
	useUpdateLocation,
	useDeleteLocation,
	type LocationAdmin,
} from '@/admin/hooks/useLocations';
import { apiClient } from '@/admin/lib/api-client';

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

const sampleLocation: LocationAdmin = {
	id: 1,
	slug: 'berlin',
	name: 'Berlin',
	country: 'DE',
	bundesland: 'Berlin',
	region_type: 'stadt',
	currency: 'EUR',
	latitude: 52.52,
	longitude: 13.405,
	zoom_level: 11,
	data: { population: 3669491 },
	factors: { rent_factor: 1.2 },
	agent_id: 1,
	is_active: true,
	created_at: '2025-01-01 00:00:00',
	updated_at: '2025-06-01 12:00:00',
};

const sampleLocation2: LocationAdmin = {
	id: 2,
	slug: 'muenchen',
	name: 'München',
	country: 'DE',
	bundesland: 'Bayern',
	region_type: 'stadt',
	currency: 'EUR',
	latitude: 48.1351,
	longitude: 11.582,
	zoom_level: 11,
	data: { population: 1472000 },
	factors: { rent_factor: 1.4 },
	agent_id: null,
	is_active: true,
	created_at: '2025-01-01 00:00:00',
	updated_at: '2025-06-01 12:00:00',
};

describe('useLocations', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useLocations Hook (GET alle Standorte)
	// ──────────────────────────────────────────────────────────────────────────

	describe('useLocations', () => {
		it('ruft GET admin/locations beim Mount auf', async () => {
			mockedApiClient.get.mockResolvedValueOnce([sampleLocation, sampleLocation2]);

			const { result } = renderHook(() => useLocations(), { wrapper: createWrapper() });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockedApiClient.get).toHaveBeenCalledWith('admin/locations');
			expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
		});

		it('gibt Standort-Array zurück', async () => {
			mockedApiClient.get.mockResolvedValueOnce([sampleLocation, sampleLocation2]);

			const { result } = renderHook(() => useLocations(), { wrapper: createWrapper() });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data).toHaveLength(2);
			expect(result.current.data?.[0].name).toBe('Berlin');
			expect(result.current.data?.[1].name).toBe('München');
		});

		it('gibt leeres Array zurück wenn keine Standorte', async () => {
			mockedApiClient.get.mockResolvedValueOnce([]);

			const { result } = renderHook(() => useLocations(), { wrapper: createWrapper() });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data).toEqual([]);
		});

		it('enthält Geo-Koordinaten und Zoom-Level', async () => {
			mockedApiClient.get.mockResolvedValueOnce([sampleLocation]);

			const { result } = renderHook(() => useLocations(), { wrapper: createWrapper() });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data?.[0].latitude).toBe(52.52);
			expect(result.current.data?.[0].longitude).toBe(13.405);
			expect(result.current.data?.[0].zoom_level).toBe(11);
		});

		it('behandelt API-Fehler korrekt', async () => {
			mockedApiClient.get.mockRejectedValueOnce(new Error('Network Error'));

			const { result } = renderHook(() => useLocations(), { wrapper: createWrapper() });

			await waitFor(() => expect(result.current.isError).toBe(true));

			expect(result.current.error).toBeDefined();
		});

		it('setzt isLoading während des Ladens', () => {
			mockedApiClient.get.mockReturnValue(new Promise(() => {}));

			const { result } = renderHook(() => useLocations(), { wrapper: createWrapper() });

			expect(result.current.isLoading).toBe(true);
			expect(result.current.data).toBeUndefined();
		});
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useLocation Hook (GET einzelner Standort)
	// ──────────────────────────────────────────────────────────────────────────

	describe('useLocation', () => {
		it('ruft GET admin/locations/{id} auf', async () => {
			mockedApiClient.get.mockResolvedValueOnce(sampleLocation);

			const { result } = renderHook(() => useLocation(1), { wrapper: createWrapper() });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockedApiClient.get).toHaveBeenCalledWith('admin/locations/1');
		});

		it('gibt vollständige Standort-Details zurück', async () => {
			mockedApiClient.get.mockResolvedValueOnce(sampleLocation);

			const { result } = renderHook(() => useLocation(1), { wrapper: createWrapper() });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data?.name).toBe('Berlin');
			expect(result.current.data?.bundesland).toBe('Berlin');
			expect(result.current.data?.region_type).toBe('stadt');
			expect(result.current.data?.factors).toEqual({ rent_factor: 1.2 });
		});

		it('ist deaktiviert bei id = null', async () => {
			const { result } = renderHook(() => useLocation(null), { wrapper: createWrapper() });

			// Query sollte nicht gestartet werden
			expect(result.current.fetchStatus).toBe('idle');
			expect(mockedApiClient.get).not.toHaveBeenCalled();
		});
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useCreateLocation Hook (POST)
	// ──────────────────────────────────────────────────────────────────────────

	describe('useCreateLocation', () => {
		it('ruft POST admin/locations beim Erstellen auf', async () => {
			mockedApiClient.post.mockResolvedValueOnce(sampleLocation);

			const { result } = renderHook(() => useCreateLocation(), { wrapper: createWrapper() });

			result.current.mutate({
				name: 'Berlin',
				slug: 'berlin',
				bundesland: 'Berlin',
				region_type: 'stadt',
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockedApiClient.post).toHaveBeenCalledWith('admin/locations', {
				name: 'Berlin',
				slug: 'berlin',
				bundesland: 'Berlin',
				region_type: 'stadt',
			});
		});

		it('sendet Geo-Koordinaten mit', async () => {
			mockedApiClient.post.mockResolvedValueOnce(sampleLocation);

			const { result } = renderHook(() => useCreateLocation(), { wrapper: createWrapper() });

			result.current.mutate({
				name: 'Berlin',
				latitude: 52.52,
				longitude: 13.405,
				zoom_level: 11,
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockedApiClient.post).toHaveBeenCalledWith('admin/locations', {
				name: 'Berlin',
				latitude: 52.52,
				longitude: 13.405,
				zoom_level: 11,
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

			mockedApiClient.post.mockResolvedValueOnce(sampleLocation);

			const { result } = renderHook(() => useCreateLocation(), { wrapper: Wrapper });

			result.current.mutate({ name: 'Berlin' });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['locations'] });
		});

		it('gibt erstellten Standort zurück', async () => {
			mockedApiClient.post.mockResolvedValueOnce(sampleLocation);

			const { result } = renderHook(() => useCreateLocation(), { wrapper: createWrapper() });

			result.current.mutate({ name: 'Berlin' });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data?.id).toBe(1);
			expect(result.current.data?.slug).toBe('berlin');
		});
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useUpdateLocation Hook (PUT)
	// ──────────────────────────────────────────────────────────────────────────

	describe('useUpdateLocation', () => {
		it('ruft PUT admin/locations/{id} beim Update auf', async () => {
			mockedApiClient.put.mockResolvedValueOnce({ ...sampleLocation, name: 'Berlin-Mitte' });

			const { result } = renderHook(() => useUpdateLocation(), { wrapper: createWrapper() });

			result.current.mutate({ id: 1, data: { name: 'Berlin-Mitte' } });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockedApiClient.put).toHaveBeenCalledWith('admin/locations/1', {
				name: 'Berlin-Mitte',
			});
		});

		it('aktualisiert Geo-Koordinaten', async () => {
			mockedApiClient.put.mockResolvedValueOnce({
				...sampleLocation,
				latitude: 52.53,
				longitude: 13.41,
			});

			const { result } = renderHook(() => useUpdateLocation(), { wrapper: createWrapper() });

			result.current.mutate({ id: 1, data: { latitude: 52.53, longitude: 13.41 } });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockedApiClient.put).toHaveBeenCalledWith('admin/locations/1', {
				latitude: 52.53,
				longitude: 13.41,
			});
		});

		it('aktualisiert Faktoren', async () => {
			const newFactors = { rent_factor: 1.3, value_factor: 1.1 };
			mockedApiClient.put.mockResolvedValueOnce({ ...sampleLocation, factors: newFactors });

			const { result } = renderHook(() => useUpdateLocation(), { wrapper: createWrapper() });

			result.current.mutate({ id: 1, data: { factors: newFactors } });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockedApiClient.put).toHaveBeenCalledWith('admin/locations/1', {
				factors: newFactors,
			});
		});

		it('toggle is_active Status', async () => {
			mockedApiClient.put.mockResolvedValueOnce({ ...sampleLocation, is_active: false });

			const { result } = renderHook(() => useUpdateLocation(), { wrapper: createWrapper() });

			result.current.mutate({ id: 1, data: { is_active: false } });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockedApiClient.put).toHaveBeenCalledWith('admin/locations/1', {
				is_active: false,
			});
		});

		it('invalidiert Cache nach Update', async () => {
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

			mockedApiClient.put.mockResolvedValueOnce({ ...sampleLocation, name: 'Updated' });

			const { result } = renderHook(() => useUpdateLocation(), { wrapper: Wrapper });

			result.current.mutate({ id: 1, data: { name: 'Updated' } });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['locations'] });
		});
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useDeleteLocation Hook (DELETE)
	// ──────────────────────────────────────────────────────────────────────────

	describe('useDeleteLocation', () => {
		it('ruft DELETE admin/locations/{id} auf', async () => {
			mockedApiClient.del.mockResolvedValueOnce({ deleted: true });

			const { result } = renderHook(() => useDeleteLocation(), { wrapper: createWrapper() });

			result.current.mutate(1);

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockedApiClient.del).toHaveBeenCalledWith('admin/locations/1');
		});

		it('invalidiert Cache nach Löschen', async () => {
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

			const { result } = renderHook(() => useDeleteLocation(), { wrapper: Wrapper });

			result.current.mutate(1);

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['locations'] });
		});

		it('behandelt Lösch-Fehler korrekt', async () => {
			mockedApiClient.del.mockRejectedValueOnce(
				new Error('Cannot delete: Location has leads'),
			);

			const { result } = renderHook(() => useDeleteLocation(), { wrapper: createWrapper() });

			result.current.mutate(1);

			await waitFor(() => expect(result.current.isError).toBe(true));

			expect(result.current.error).toBeDefined();
		});
	});
});
