/**
 * Unit-Tests für useGeocoding Hook.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { useGeocoding, type GeocodingResult } from '@/admin/hooks/useGeocoding';

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

const mockGeocodingResults: GeocodingResult[] = [
	{
		lat: 52.52,
		lng: 13.405,
		display_name: 'Berlin, Deutschland',
		city: 'Berlin',
		state: 'Berlin',
		country: 'Deutschland',
		country_code: 'DE',
		postal_code: '10115',
	},
	{
		lat: 52.518,
		lng: 13.376,
		display_name: 'Berlin Mitte, Berlin, Deutschland',
		city: 'Berlin',
		state: 'Berlin',
		country: 'Deutschland',
		country_code: 'DE',
		postal_code: '10117',
	},
];

const mockMunichResults: GeocodingResult[] = [
	{
		lat: 48.1351,
		lng: 11.582,
		display_name: 'München, Bayern, Deutschland',
		city: 'München',
		state: 'Bayern',
		country: 'Deutschland',
		country_code: 'DE',
		postal_code: '80331',
	},
];

describe('useGeocoding', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Mock window.resaAdmin
		Object.defineProperty(window, 'resaAdmin', {
			value: {
				restUrl: '/wp-json/resa/v1/',
				nonce: 'test-nonce-12345',
				page: 'resa-settings',
				adminUrl: '/wp-admin/admin.php',
				pluginUrl: '/wp-content/plugins/resa/',
				version: '1.0.0',
				features: {
					plan: 'premium',
					is_trial: false,
					max_modules: null,
					max_locations: null,
					max_leads: 1000,
					can_export_leads: true,
					can_use_pdf_designer: true,
					can_use_smtp: true,
					can_remove_branding: true,
					can_use_webhooks: true,
					can_use_api_keys: true,
					can_use_messenger: true,
					can_use_advanced_tracking: true,
				},
				locationCount: 3,
				siteName: 'Test Site',
				adminEmail: 'admin@test.de',
				integrationTabs: [],
			},
			writable: true,
			configurable: true,
		});

		// Mock fetch
		global.fetch = vi.fn();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	// ──────────────────────────────────────────────────────────────────────────
	// Grundlegende Query-Tests
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft Geocoding-API mit korrekter URL auf', async () => {
		vi.mocked(global.fetch).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({ results: mockGeocodingResults }),
		} as Response);

		const { result } = renderHook(() => useGeocoding('Berlin'), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(global.fetch).toHaveBeenCalledTimes(1);
		const callUrl = vi.mocked(global.fetch).mock.calls[0][0] as string;
		expect(callUrl).toContain('admin/geocoding/search');
		expect(callUrl).toContain('query=Berlin');
	});

	it('sendet X-WP-Nonce Header', async () => {
		vi.mocked(global.fetch).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({ results: mockGeocodingResults }),
		} as Response);

		const { result } = renderHook(() => useGeocoding('Berlin'), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		const callOptions = vi.mocked(global.fetch).mock.calls[0][1] as RequestInit;
		expect(callOptions.headers).toEqual(
			expect.objectContaining({
				'X-WP-Nonce': 'test-nonce-12345',
				Accept: 'application/json',
			}),
		);
	});

	it('gibt Geocoding-Ergebnisse korrekt zurück', async () => {
		vi.mocked(global.fetch).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({ results: mockGeocodingResults }),
		} as Response);

		const { result } = renderHook(() => useGeocoding('Berlin'), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data).toEqual(mockGeocodingResults);
		expect(result.current.data?.length).toBe(2);
		expect(result.current.data?.[0].city).toBe('Berlin');
	});

	// ──────────────────────────────────────────────────────────────────────────
	// enabled-Logik Tests
	// ──────────────────────────────────────────────────────────────────────────

	it('startet Query nicht bei zu kurzem Suchbegriff (1 Zeichen)', async () => {
		const { result } = renderHook(() => useGeocoding('B'), {
			wrapper: createWrapper(),
		});

		// Query sollte nicht starten
		expect(result.current.fetchStatus).toBe('idle');
		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('startet Query bei 2 Zeichen', async () => {
		vi.mocked(global.fetch).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({ results: [] }),
		} as Response);

		const { result } = renderHook(() => useGeocoding('Be'), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(global.fetch).toHaveBeenCalledTimes(1);
	});

	it('startet Query nicht bei leerem String', async () => {
		const { result } = renderHook(() => useGeocoding(''), {
			wrapper: createWrapper(),
		});

		expect(result.current.fetchStatus).toBe('idle');
		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('startet Query nicht bei nur Leerzeichen', async () => {
		const { result } = renderHook(() => useGeocoding('   '), {
			wrapper: createWrapper(),
		});

		expect(result.current.fetchStatus).toBe('idle');
		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('startet Query nicht wenn enabled=false', async () => {
		const { result } = renderHook(() => useGeocoding('Berlin', false), {
			wrapper: createWrapper(),
		});

		expect(result.current.fetchStatus).toBe('idle');
		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('startet Query wenn enabled=true (Standard)', async () => {
		vi.mocked(global.fetch).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({ results: mockGeocodingResults }),
		} as Response);

		const { result } = renderHook(() => useGeocoding('Berlin', true), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(global.fetch).toHaveBeenCalledTimes(1);
	});

	// ──────────────────────────────────────────────────────────────────────────
	// Response-Format Tests
	// ──────────────────────────────────────────────────────────────────────────

	it('verarbeitet wrapped Response (data.results)', async () => {
		vi.mocked(global.fetch).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({ data: { results: mockGeocodingResults } }),
		} as Response);

		const { result } = renderHook(() => useGeocoding('Berlin'), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data).toEqual(mockGeocodingResults);
	});

	it('verarbeitet direct Response (results)', async () => {
		vi.mocked(global.fetch).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({ results: mockMunichResults }),
		} as Response);

		const { result } = renderHook(() => useGeocoding('München'), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data).toEqual(mockMunichResults);
		expect(result.current.data?.[0].city).toBe('München');
	});

	it('gibt leeres Array zurück wenn keine Ergebnisse', async () => {
		vi.mocked(global.fetch).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({}),
		} as Response);

		const { result } = renderHook(() => useGeocoding('xyzabc123'), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data).toEqual([]);
	});

	// ──────────────────────────────────────────────────────────────────────────
	// Fehlerbehandlung Tests
	// ──────────────────────────────────────────────────────────────────────────

	it('behandelt HTTP-Fehler korrekt', async () => {
		vi.mocked(global.fetch).mockResolvedValueOnce({
			ok: false,
			status: 500,
			json: () => Promise.resolve({ message: 'Internal Server Error' }),
		} as Response);

		const { result } = renderHook(() => useGeocoding('Berlin'), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(result.current.error).toBeDefined();
		expect((result.current.error as Error).message).toBe('Internal Server Error');
	});

	it('behandelt HTTP-Fehler ohne Message', async () => {
		vi.mocked(global.fetch).mockResolvedValueOnce({
			ok: false,
			status: 404,
			json: () => Promise.resolve({}),
		} as Response);

		const { result } = renderHook(() => useGeocoding('Berlin'), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect((result.current.error as Error).message).toBe('HTTP 404');
	});

	it('behandelt Netzwerkfehler korrekt', async () => {
		vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network Error'));

		const { result } = renderHook(() => useGeocoding('Berlin'), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(result.current.error).toBeDefined();
	});

	it('behandelt JSON-Parse-Fehler', async () => {
		vi.mocked(global.fetch).mockResolvedValueOnce({
			ok: false,
			status: 500,
			json: () => Promise.reject(new Error('Invalid JSON')),
		} as Response);

		const { result } = renderHook(() => useGeocoding('Berlin'), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect((result.current.error as Error).message).toBe('HTTP 500');
	});

	// ──────────────────────────────────────────────────────────────────────────
	// Loading-State Tests
	// ──────────────────────────────────────────────────────────────────────────

	it('setzt isLoading während des Ladens', async () => {
		let resolvePromise: (value: Response) => void;
		vi.mocked(global.fetch).mockReturnValueOnce(
			new Promise((resolve) => {
				resolvePromise = resolve;
			}),
		);

		const { result } = renderHook(() => useGeocoding('Berlin'), {
			wrapper: createWrapper(),
		});

		expect(result.current.isLoading).toBe(true);

		// Promise auflösen um Test zu beenden
		resolvePromise!({
			ok: true,
			json: () => Promise.resolve({ results: [] }),
		} as Response);

		await waitFor(() => expect(result.current.isLoading).toBe(false));
	});

	// ──────────────────────────────────────────────────────────────────────────
	// Query-Key Tests
	// ──────────────────────────────────────────────────────────────────────────

	it('verwendet unterschiedliche Query-Keys für verschiedene Suchbegriffe', async () => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});

		function Wrapper({ children }: { children: ReactNode }) {
			return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
		}

		vi.mocked(global.fetch)
			.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ results: mockGeocodingResults }),
			} as Response)
			.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ results: mockMunichResults }),
			} as Response);

		// Erste Suche
		const { result: result1 } = renderHook(() => useGeocoding('Berlin'), {
			wrapper: Wrapper,
		});

		await waitFor(() => expect(result1.current.isSuccess).toBe(true));

		// Zweite Suche
		const { result: result2 } = renderHook(() => useGeocoding('München'), {
			wrapper: Wrapper,
		});

		await waitFor(() => expect(result2.current.isSuccess).toBe(true));

		// Beide Cache-Einträge sollten existieren
		const berlinData = queryClient.getQueryData(['geocoding', 'Berlin']);
		const munichData = queryClient.getQueryData(['geocoding', 'München']);

		expect(berlinData).toEqual(mockGeocodingResults);
		expect(munichData).toEqual(mockMunichResults);
	});

	// ──────────────────────────────────────────────────────────────────────────
	// Trim-Tests
	// ──────────────────────────────────────────────────────────────────────────

	it('trimmt Leerzeichen vom Suchbegriff', async () => {
		vi.mocked(global.fetch).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({ results: mockGeocodingResults }),
		} as Response);

		const { result } = renderHook(() => useGeocoding('  Berlin  '), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		const callUrl = vi.mocked(global.fetch).mock.calls[0][0] as string;
		expect(callUrl).toContain('query=Berlin');
		expect(callUrl).not.toContain('query=++Berlin++');
	});

	// ──────────────────────────────────────────────────────────────────────────
	// Geocoding-Ergebnis-Struktur Tests
	// ──────────────────────────────────────────────────────────────────────────

	it('gibt vollständige Adressinformationen zurück', async () => {
		vi.mocked(global.fetch).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({ results: mockGeocodingResults }),
		} as Response);

		const { result } = renderHook(() => useGeocoding('Berlin'), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		const firstResult = result.current.data?.[0];
		expect(firstResult).toEqual({
			lat: 52.52,
			lng: 13.405,
			display_name: 'Berlin, Deutschland',
			city: 'Berlin',
			state: 'Berlin',
			country: 'Deutschland',
			country_code: 'DE',
			postal_code: '10115',
		});
	});

	it('behandelt null-Werte in optionalen Feldern', async () => {
		const resultWithNulls: GeocodingResult[] = [
			{
				lat: 52.52,
				lng: 13.405,
				display_name: 'Unbekannter Ort',
				city: null,
				state: null,
				country: 'Deutschland',
				country_code: 'DE',
				postal_code: null,
			},
		];

		vi.mocked(global.fetch).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({ results: resultWithNulls }),
		} as Response);

		const { result } = renderHook(() => useGeocoding('Unbekannt'), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data?.[0].city).toBeNull();
		expect(result.current.data?.[0].state).toBeNull();
		expect(result.current.data?.[0].postal_code).toBeNull();
	});
});
