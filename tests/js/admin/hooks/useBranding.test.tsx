/**
 * Unit tests for useBranding hook.
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

import { useBranding, useSaveBranding, type BrandingSettings } from '@/admin/hooks/useBranding';
import { apiClient } from '@/admin/lib/api-client';

const mockedApiClient = apiClient as {
	get: ReturnType<typeof vi.fn>;
	put: ReturnType<typeof vi.fn>;
};

// Test wrapper with QueryClientProvider
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

const defaultBranding: BrandingSettings = {
	logoUrl: '',
	logoId: 0,
	primaryColor: '#a9e43f',
	secondaryColor: '#1e303a',
	showPoweredBy: true,
};

describe('useBranding', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useBranding Hook
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft GET admin/branding beim Mount auf', async () => {
		mockedApiClient.get.mockResolvedValueOnce(defaultBranding);

		const { result } = renderHook(() => useBranding(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.get).toHaveBeenCalledWith('admin/branding');
		expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
	});

	it('gibt Default-Branding-Daten zurück', async () => {
		mockedApiClient.get.mockResolvedValueOnce(defaultBranding);

		const { result } = renderHook(() => useBranding(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data).toEqual(defaultBranding);
	});

	it('gibt gespeicherte Branding-Daten zurück', async () => {
		const customBranding: BrandingSettings = {
			logoUrl: 'https://example.com/logo.png',
			logoId: 42,
			primaryColor: '#ff5500',
			secondaryColor: '#003366',
			showPoweredBy: false,
		};
		mockedApiClient.get.mockResolvedValueOnce(customBranding);

		const { result } = renderHook(() => useBranding(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data?.logoUrl).toBe('https://example.com/logo.png');
		expect(result.current.data?.logoId).toBe(42);
		expect(result.current.data?.primaryColor).toBe('#ff5500');
		expect(result.current.data?.showPoweredBy).toBe(false);
	});

	it('behandelt API-Fehler korrekt', async () => {
		mockedApiClient.get.mockRejectedValueOnce(new Error('Network Error'));

		const { result } = renderHook(() => useBranding(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(result.current.error).toBeDefined();
	});

	it('setzt isLoading während des Ladens', () => {
		mockedApiClient.get.mockReturnValue(new Promise(() => {})); // Never resolves

		const { result } = renderHook(() => useBranding(), { wrapper: createWrapper() });

		expect(result.current.isLoading).toBe(true);
		expect(result.current.data).toBeUndefined();
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useSaveBranding Hook
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft PUT admin/branding beim Speichern auf', async () => {
		mockedApiClient.get.mockResolvedValue(defaultBranding);
		mockedApiClient.put.mockResolvedValueOnce({
			...defaultBranding,
			primaryColor: '#ff0000',
		});

		const { result } = renderHook(() => useSaveBranding(), { wrapper: createWrapper() });

		result.current.mutate({ primaryColor: '#ff0000' });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/branding', {
			primaryColor: '#ff0000',
		});
	});

	it('speichert alle Branding-Felder', async () => {
		mockedApiClient.get.mockResolvedValue(defaultBranding);
		const newBranding = {
			logoUrl: 'https://example.com/neu.png',
			logoId: 123,
			primaryColor: '#ff0000',
			secondaryColor: '#00ff00',
			showPoweredBy: false,
		};
		mockedApiClient.put.mockResolvedValueOnce(newBranding);

		const { result } = renderHook(() => useSaveBranding(), { wrapper: createWrapper() });

		result.current.mutate(newBranding);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/branding', newBranding);
	});

	it('behandelt Speicherfehler korrekt', async () => {
		mockedApiClient.get.mockResolvedValue(defaultBranding);
		mockedApiClient.put.mockRejectedValueOnce(new Error('Validation failed'));

		const { result } = renderHook(() => useSaveBranding(), { wrapper: createWrapper() });

		result.current.mutate({ primaryColor: 'invalid' });

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(result.current.error).toBeDefined();
	});

	it('setzt isPending während des Speicherns', async () => {
		mockedApiClient.get.mockResolvedValue(defaultBranding);
		let resolvePromise: (value: BrandingSettings) => void;
		mockedApiClient.put.mockReturnValueOnce(
			new Promise((resolve) => {
				resolvePromise = resolve;
			}),
		);

		const { result } = renderHook(() => useSaveBranding(), { wrapper: createWrapper() });

		result.current.mutate({ primaryColor: '#ff0000' });

		await waitFor(() => expect(result.current.isPending).toBe(true));

		// Resolve the promise to complete
		resolvePromise!({ ...defaultBranding, primaryColor: '#ff0000' });

		await waitFor(() => expect(result.current.isPending).toBe(false));
	});

	// ──────────────────────────────────────────────────────────────────────────
	// Partielle Updates
	// ──────────────────────────────────────────────────────────────────────────

	it('erlaubt partielles Update nur für Logo', async () => {
		mockedApiClient.get.mockResolvedValue(defaultBranding);
		mockedApiClient.put.mockResolvedValueOnce({
			...defaultBranding,
			logoUrl: 'https://example.com/logo.png',
			logoId: 42,
		});

		const { result } = renderHook(() => useSaveBranding(), { wrapper: createWrapper() });

		result.current.mutate({
			logoUrl: 'https://example.com/logo.png',
			logoId: 42,
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/branding', {
			logoUrl: 'https://example.com/logo.png',
			logoId: 42,
		});
	});

	it('erlaubt partielles Update nur für showPoweredBy', async () => {
		mockedApiClient.get.mockResolvedValue(defaultBranding);
		mockedApiClient.put.mockResolvedValueOnce({
			...defaultBranding,
			showPoweredBy: false,
		});

		const { result } = renderHook(() => useSaveBranding(), { wrapper: createWrapper() });

		result.current.mutate({ showPoweredBy: false });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/branding', {
			showPoweredBy: false,
		});
	});

	// ──────────────────────────────────────────────────────────────────────────
	// Query Key
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

		mockedApiClient.get.mockResolvedValue(defaultBranding);
		mockedApiClient.put.mockResolvedValueOnce({
			...defaultBranding,
			primaryColor: '#ff0000',
		});

		const { result } = renderHook(() => useSaveBranding(), { wrapper: Wrapper });

		result.current.mutate({ primaryColor: '#ff0000' });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['branding'] });
	});
});
