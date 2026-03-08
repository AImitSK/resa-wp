/**
 * Unit-Tests für useMapSettings Hook.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// Mock api-client
vi.mock('@/admin/lib/api-client', () => ({
	apiClient: {
		get: vi.fn(),
		put: vi.fn(),
	},
}));

import {
	useMapSettings,
	useSaveMapSettings,
	type MapSettings,
	type MapProvider,
	type TileStyle,
} from '@/admin/hooks/useMapSettings';
import { apiClient } from '@/admin/lib/api-client';

const mockedApiClient = apiClient as {
	get: ReturnType<typeof vi.fn>;
	put: ReturnType<typeof vi.fn>;
};

// Test-Wrapper mit QueryClientProvider
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

const defaultMapSettings: MapSettings = {
	provider: 'osm',
	tileStyle: 'standard',
	defaultZoom: 13,
	googleApiKey: '',
	scrollZoom: true,
	canUseGoogle: false,
	canSelectStyle: false,
};

const premiumMapSettings: MapSettings = {
	provider: 'google',
	tileStyle: 'minimal',
	defaultZoom: 15,
	googleApiKey: 'AIzaSy...',
	scrollZoom: false,
	canUseGoogle: true,
	canSelectStyle: true,
};

describe('useMapSettings', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useMapSettings Hook
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft GET admin/map-settings beim Mount auf', async () => {
		mockedApiClient.get.mockResolvedValueOnce(defaultMapSettings);

		const { result } = renderHook(() => useMapSettings(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.get).toHaveBeenCalledWith('admin/map-settings');
		expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
	});

	it('gibt Karten-Einstellungen korrekt zurück', async () => {
		mockedApiClient.get.mockResolvedValueOnce(defaultMapSettings);

		const { result } = renderHook(() => useMapSettings(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data).toEqual(defaultMapSettings);
		expect(result.current.data?.provider).toBe('osm');
		expect(result.current.data?.defaultZoom).toBe(13);
	});

	it('gibt Premium-Karten-Einstellungen zurück', async () => {
		mockedApiClient.get.mockResolvedValueOnce(premiumMapSettings);

		const { result } = renderHook(() => useMapSettings(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data?.provider).toBe('google');
		expect(result.current.data?.canUseGoogle).toBe(true);
		expect(result.current.data?.canSelectStyle).toBe(true);
		expect(result.current.data?.googleApiKey).toBe('AIzaSy...');
	});

	it('behandelt API-Fehler korrekt', async () => {
		mockedApiClient.get.mockRejectedValueOnce(new Error('Network Error'));

		const { result } = renderHook(() => useMapSettings(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(result.current.error).toBeDefined();
	});

	it('setzt isLoading während des Ladens', () => {
		mockedApiClient.get.mockReturnValue(new Promise(() => {})); // Wird nie aufgelöst

		const { result } = renderHook(() => useMapSettings(), { wrapper: createWrapper() });

		expect(result.current.isLoading).toBe(true);
		expect(result.current.data).toBeUndefined();
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useSaveMapSettings Hook
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft PUT admin/map-settings beim Speichern auf', async () => {
		mockedApiClient.get.mockResolvedValue(defaultMapSettings);
		mockedApiClient.put.mockResolvedValueOnce({
			...defaultMapSettings,
			defaultZoom: 15,
		});

		const { result } = renderHook(() => useSaveMapSettings(), { wrapper: createWrapper() });

		result.current.mutate({ defaultZoom: 15 });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/map-settings', { defaultZoom: 15 });
	});

	it('speichert Provider-Wechsel', async () => {
		mockedApiClient.get.mockResolvedValue(defaultMapSettings);
		mockedApiClient.put.mockResolvedValueOnce({
			...defaultMapSettings,
			provider: 'google' as MapProvider,
		});

		const { result } = renderHook(() => useSaveMapSettings(), { wrapper: createWrapper() });

		result.current.mutate({ provider: 'google' });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/map-settings', {
			provider: 'google',
		});
	});

	it('speichert Tile-Style-Wechsel', async () => {
		mockedApiClient.get.mockResolvedValue(defaultMapSettings);
		mockedApiClient.put.mockResolvedValueOnce({
			...defaultMapSettings,
			tileStyle: 'dark' as TileStyle,
		});

		const { result } = renderHook(() => useSaveMapSettings(), { wrapper: createWrapper() });

		result.current.mutate({ tileStyle: 'dark' });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/map-settings', {
			tileStyle: 'dark',
		});
	});

	it('speichert Google API Key', async () => {
		mockedApiClient.get.mockResolvedValue(premiumMapSettings);
		mockedApiClient.put.mockResolvedValueOnce({
			...premiumMapSettings,
			googleApiKey: 'AIzaSyNewKey...',
		});

		const { result } = renderHook(() => useSaveMapSettings(), { wrapper: createWrapper() });

		result.current.mutate({ googleApiKey: 'AIzaSyNewKey...' });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/map-settings', {
			googleApiKey: 'AIzaSyNewKey...',
		});
	});

	it('speichert scrollZoom-Einstellung', async () => {
		mockedApiClient.get.mockResolvedValue(defaultMapSettings);
		mockedApiClient.put.mockResolvedValueOnce({
			...defaultMapSettings,
			scrollZoom: false,
		});

		const { result } = renderHook(() => useSaveMapSettings(), { wrapper: createWrapper() });

		result.current.mutate({ scrollZoom: false });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/map-settings', {
			scrollZoom: false,
		});
	});

	it('erlaubt mehrere Felder gleichzeitig zu speichern', async () => {
		mockedApiClient.get.mockResolvedValue(defaultMapSettings);
		const updateData = {
			provider: 'google' as MapProvider,
			tileStyle: 'minimal' as TileStyle,
			defaultZoom: 16,
			googleApiKey: 'AIzaSy123',
		};
		mockedApiClient.put.mockResolvedValueOnce({
			...defaultMapSettings,
			...updateData,
		});

		const { result } = renderHook(() => useSaveMapSettings(), { wrapper: createWrapper() });

		result.current.mutate(updateData);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/map-settings', updateData);
	});

	it('behandelt Speicherfehler korrekt', async () => {
		mockedApiClient.get.mockResolvedValue(defaultMapSettings);
		mockedApiClient.put.mockRejectedValueOnce(new Error('Validation failed'));

		const { result } = renderHook(() => useSaveMapSettings(), { wrapper: createWrapper() });

		result.current.mutate({ defaultZoom: 25 }); // Ungültiger Zoom

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(result.current.error).toBeDefined();
	});

	it('setzt isPending während des Speicherns', async () => {
		mockedApiClient.get.mockResolvedValue(defaultMapSettings);
		let resolvePromise: (value: MapSettings) => void;
		mockedApiClient.put.mockReturnValueOnce(
			new Promise((resolve) => {
				resolvePromise = resolve;
			}),
		);

		const { result } = renderHook(() => useSaveMapSettings(), { wrapper: createWrapper() });

		result.current.mutate({ defaultZoom: 14 });

		await waitFor(() => expect(result.current.isPending).toBe(true));

		// Promise auflösen um Test zu beenden
		resolvePromise!({ ...defaultMapSettings, defaultZoom: 14 });

		await waitFor(() => expect(result.current.isPending).toBe(false));
	});

	// ──────────────────────────────────────────────────────────────────────────
	// Cache-Invalidierung
	// ──────────────────────────────────────────────────────────────────────────

	it('invalidiert Cache nach erfolgreichem Speichern', async () => {
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

		mockedApiClient.get.mockResolvedValue(defaultMapSettings);
		mockedApiClient.put.mockResolvedValueOnce({
			...defaultMapSettings,
			defaultZoom: 16,
		});

		const { result } = renderHook(() => useSaveMapSettings(), { wrapper: Wrapper });

		result.current.mutate({ defaultZoom: 16 });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['map-settings'] });
	});

	// ──────────────────────────────────────────────────────────────────────────
	// Provider-spezifische Tests
	// ──────────────────────────────────────────────────────────────────────────

	it('gibt OSM-Provider für Free-Plan zurück', async () => {
		mockedApiClient.get.mockResolvedValueOnce({
			...defaultMapSettings,
			provider: 'osm',
			canUseGoogle: false,
		});

		const { result } = renderHook(() => useMapSettings(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data?.provider).toBe('osm');
		expect(result.current.data?.canUseGoogle).toBe(false);
	});

	it('gibt Google-Provider für Premium-Plan zurück', async () => {
		mockedApiClient.get.mockResolvedValueOnce({
			...premiumMapSettings,
			provider: 'google',
			canUseGoogle: true,
		});

		const { result } = renderHook(() => useMapSettings(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data?.provider).toBe('google');
		expect(result.current.data?.canUseGoogle).toBe(true);
	});

	// ──────────────────────────────────────────────────────────────────────────
	// Tile-Style Tests
	// ──────────────────────────────────────────────────────────────────────────

	it('gibt standard Tile-Style zurück', async () => {
		mockedApiClient.get.mockResolvedValueOnce({
			...defaultMapSettings,
			tileStyle: 'standard',
		});

		const { result } = renderHook(() => useMapSettings(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data?.tileStyle).toBe('standard');
	});

	it('gibt minimal Tile-Style zurück', async () => {
		mockedApiClient.get.mockResolvedValueOnce({
			...defaultMapSettings,
			tileStyle: 'minimal',
		});

		const { result } = renderHook(() => useMapSettings(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data?.tileStyle).toBe('minimal');
	});

	it('gibt dark Tile-Style zurück', async () => {
		mockedApiClient.get.mockResolvedValueOnce({
			...defaultMapSettings,
			tileStyle: 'dark',
		});

		const { result } = renderHook(() => useMapSettings(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data?.tileStyle).toBe('dark');
	});

	// ──────────────────────────────────────────────────────────────────────────
	// Zoom-Level Tests
	// ──────────────────────────────────────────────────────────────────────────

	it('speichert minimalen Zoom-Level', async () => {
		mockedApiClient.get.mockResolvedValue(defaultMapSettings);
		mockedApiClient.put.mockResolvedValueOnce({
			...defaultMapSettings,
			defaultZoom: 1,
		});

		const { result } = renderHook(() => useSaveMapSettings(), { wrapper: createWrapper() });

		result.current.mutate({ defaultZoom: 1 });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/map-settings', { defaultZoom: 1 });
	});

	it('speichert maximalen Zoom-Level', async () => {
		mockedApiClient.get.mockResolvedValue(defaultMapSettings);
		mockedApiClient.put.mockResolvedValueOnce({
			...defaultMapSettings,
			defaultZoom: 20,
		});

		const { result } = renderHook(() => useSaveMapSettings(), { wrapper: createWrapper() });

		result.current.mutate({ defaultZoom: 20 });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/map-settings', { defaultZoom: 20 });
	});
});
