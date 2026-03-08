/**
 * Unit-Tests für usePdfSettings Hook.
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

import { usePdfSettings, useSavePdfSettings, type PdfSettings } from '@/admin/hooks/usePdfSettings';
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

const defaultPdfSettings: PdfSettings = {
	headerText: 'RESA Immobilienbewertung',
	footerText: 'Erstellt mit RESA',
	showDate: true,
	showAgents: true,
	logoPosition: 'left',
	logoSize: 150,
	margins: {
		top: 20,
		bottom: 20,
		left: 15,
		right: 15,
	},
};

describe('usePdfSettings', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	// ──────────────────────────────────────────────────────────────────────────
	// usePdfSettings Hook
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft GET admin/pdf/settings beim Mount auf', async () => {
		mockedApiClient.get.mockResolvedValueOnce(defaultPdfSettings);

		const { result } = renderHook(() => usePdfSettings(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.get).toHaveBeenCalledWith('admin/pdf/settings');
		expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
	});

	it('gibt PDF-Einstellungen korrekt zurück', async () => {
		mockedApiClient.get.mockResolvedValueOnce(defaultPdfSettings);

		const { result } = renderHook(() => usePdfSettings(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data).toEqual(defaultPdfSettings);
		expect(result.current.data?.headerText).toBe('RESA Immobilienbewertung');
		expect(result.current.data?.margins.top).toBe(20);
	});

	it('gibt benutzerdefinierte PDF-Einstellungen zurück', async () => {
		const customSettings: PdfSettings = {
			headerText: 'Mein Unternehmen',
			footerText: 'Kontaktieren Sie uns',
			showDate: false,
			showAgents: false,
			logoPosition: 'center',
			logoSize: 200,
			margins: {
				top: 25,
				bottom: 30,
				left: 20,
				right: 20,
			},
		};
		mockedApiClient.get.mockResolvedValueOnce(customSettings);

		const { result } = renderHook(() => usePdfSettings(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data?.headerText).toBe('Mein Unternehmen');
		expect(result.current.data?.logoPosition).toBe('center');
		expect(result.current.data?.showDate).toBe(false);
		expect(result.current.data?.margins.left).toBe(20);
	});

	it('behandelt API-Fehler korrekt', async () => {
		mockedApiClient.get.mockRejectedValueOnce(new Error('Network Error'));

		const { result } = renderHook(() => usePdfSettings(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(result.current.error).toBeDefined();
	});

	it('setzt isLoading während des Ladens', () => {
		mockedApiClient.get.mockReturnValue(new Promise(() => {})); // Wird nie aufgelöst

		const { result } = renderHook(() => usePdfSettings(), { wrapper: createWrapper() });

		expect(result.current.isLoading).toBe(true);
		expect(result.current.data).toBeUndefined();
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useSavePdfSettings Hook
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft PUT admin/pdf/settings beim Speichern auf', async () => {
		mockedApiClient.get.mockResolvedValue(defaultPdfSettings);
		mockedApiClient.put.mockResolvedValueOnce({
			...defaultPdfSettings,
			headerText: 'Neuer Header',
		});

		const { result } = renderHook(() => useSavePdfSettings(), { wrapper: createWrapper() });

		result.current.mutate({ ...defaultPdfSettings, headerText: 'Neuer Header' });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/pdf/settings', {
			...defaultPdfSettings,
			headerText: 'Neuer Header',
		});
	});

	it('speichert alle PDF-Felder', async () => {
		mockedApiClient.get.mockResolvedValue(defaultPdfSettings);
		const newSettings: PdfSettings = {
			headerText: 'Neuer Header',
			footerText: 'Neuer Footer',
			showDate: false,
			showAgents: false,
			logoPosition: 'right',
			logoSize: 180,
			margins: {
				top: 30,
				bottom: 30,
				left: 25,
				right: 25,
			},
		};
		mockedApiClient.put.mockResolvedValueOnce(newSettings);

		const { result } = renderHook(() => useSavePdfSettings(), { wrapper: createWrapper() });

		result.current.mutate(newSettings);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/pdf/settings', newSettings);
	});

	it('behandelt Speicherfehler korrekt', async () => {
		mockedApiClient.get.mockResolvedValue(defaultPdfSettings);
		mockedApiClient.put.mockRejectedValueOnce(new Error('Validation failed'));

		const { result } = renderHook(() => useSavePdfSettings(), { wrapper: createWrapper() });

		result.current.mutate(defaultPdfSettings);

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(result.current.error).toBeDefined();
	});

	it('setzt isPending während des Speicherns', async () => {
		mockedApiClient.get.mockResolvedValue(defaultPdfSettings);
		let resolvePromise: (value: PdfSettings) => void;
		mockedApiClient.put.mockReturnValueOnce(
			new Promise((resolve) => {
				resolvePromise = resolve;
			}),
		);

		const { result } = renderHook(() => useSavePdfSettings(), { wrapper: createWrapper() });

		result.current.mutate(defaultPdfSettings);

		await waitFor(() => expect(result.current.isPending).toBe(true));

		// Promise auflösen um Test zu beenden
		resolvePromise!(defaultPdfSettings);

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

		mockedApiClient.get.mockResolvedValue(defaultPdfSettings);
		mockedApiClient.put.mockResolvedValueOnce({
			...defaultPdfSettings,
			headerText: 'Neuer Header',
		});

		const { result } = renderHook(() => useSavePdfSettings(), { wrapper: Wrapper });

		result.current.mutate({ ...defaultPdfSettings, headerText: 'Neuer Header' });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['pdf-settings'] });
	});

	// ──────────────────────────────────────────────────────────────────────────
	// Logo-Position Tests
	// ──────────────────────────────────────────────────────────────────────────

	it('speichert Logo-Position links', async () => {
		mockedApiClient.get.mockResolvedValue(defaultPdfSettings);
		mockedApiClient.put.mockResolvedValueOnce({
			...defaultPdfSettings,
			logoPosition: 'left',
		});

		const { result } = renderHook(() => useSavePdfSettings(), { wrapper: createWrapper() });

		result.current.mutate({ ...defaultPdfSettings, logoPosition: 'left' });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith(
			'admin/pdf/settings',
			expect.objectContaining({ logoPosition: 'left' }),
		);
	});

	it('speichert Logo-Position zentriert', async () => {
		mockedApiClient.get.mockResolvedValue(defaultPdfSettings);
		mockedApiClient.put.mockResolvedValueOnce({
			...defaultPdfSettings,
			logoPosition: 'center',
		});

		const { result } = renderHook(() => useSavePdfSettings(), { wrapper: createWrapper() });

		result.current.mutate({ ...defaultPdfSettings, logoPosition: 'center' });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith(
			'admin/pdf/settings',
			expect.objectContaining({ logoPosition: 'center' }),
		);
	});

	it('speichert Logo-Position rechts', async () => {
		mockedApiClient.get.mockResolvedValue(defaultPdfSettings);
		mockedApiClient.put.mockResolvedValueOnce({
			...defaultPdfSettings,
			logoPosition: 'right',
		});

		const { result } = renderHook(() => useSavePdfSettings(), { wrapper: createWrapper() });

		result.current.mutate({ ...defaultPdfSettings, logoPosition: 'right' });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith(
			'admin/pdf/settings',
			expect.objectContaining({ logoPosition: 'right' }),
		);
	});

	// ──────────────────────────────────────────────────────────────────────────
	// Margin Tests
	// ──────────────────────────────────────────────────────────────────────────

	it('speichert geänderte Margins korrekt', async () => {
		mockedApiClient.get.mockResolvedValue(defaultPdfSettings);
		const newMargins = {
			top: 50,
			bottom: 40,
			left: 30,
			right: 30,
		};
		mockedApiClient.put.mockResolvedValueOnce({
			...defaultPdfSettings,
			margins: newMargins,
		});

		const { result } = renderHook(() => useSavePdfSettings(), { wrapper: createWrapper() });

		result.current.mutate({ ...defaultPdfSettings, margins: newMargins });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith(
			'admin/pdf/settings',
			expect.objectContaining({
				margins: newMargins,
			}),
		);
	});
});
