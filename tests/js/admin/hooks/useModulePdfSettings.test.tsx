/**
 * Unit-Tests für useModulePdfSettings Hook.
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
	useModulePdfSettings,
	useSaveModulePdfSettings,
	type ModulePdfSettings,
} from '@/admin/hooks/useModulePdfSettings';
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

const defaultModulePdfSettings: ModulePdfSettings = {
	showChart: true,
	showFactors: true,
	showMap: true,
	showCta: true,
	showDisclaimer: true,
	ctaTitle: 'Interesse geweckt?',
	ctaText: 'Kontaktieren Sie uns für eine persönliche Beratung.',
};

describe('useModulePdfSettings', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useModulePdfSettings Hook
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft GET admin/modules/{slug}/pdf-settings beim Mount auf', async () => {
		mockedApiClient.get.mockResolvedValueOnce(defaultModulePdfSettings);

		const { result } = renderHook(() => useModulePdfSettings('rent-calculator'), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.get).toHaveBeenCalledWith(
			'admin/modules/rent-calculator/pdf-settings',
		);
		expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
	});

	it('gibt Modul-PDF-Einstellungen korrekt zurück', async () => {
		mockedApiClient.get.mockResolvedValueOnce(defaultModulePdfSettings);

		const { result } = renderHook(() => useModulePdfSettings('value-calculator'), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data).toEqual(defaultModulePdfSettings);
		expect(result.current.data?.showChart).toBe(true);
		expect(result.current.data?.ctaTitle).toBe('Interesse geweckt?');
	});

	it('ruft API nicht auf wenn slug undefined ist', async () => {
		const { result } = renderHook(() => useModulePdfSettings(undefined), {
			wrapper: createWrapper(),
		});

		// Query sollte nicht starten (enabled: false)
		expect(result.current.isPending).toBe(true);
		expect(result.current.fetchStatus).toBe('idle');
		expect(mockedApiClient.get).not.toHaveBeenCalled();
	});

	it('ruft API nicht auf wenn slug leer ist', async () => {
		const { result } = renderHook(() => useModulePdfSettings(''), {
			wrapper: createWrapper(),
		});

		// Query sollte nicht starten (enabled: false wegen empty string)
		expect(result.current.fetchStatus).toBe('idle');
		expect(mockedApiClient.get).not.toHaveBeenCalled();
	});

	it('gibt benutzerdefinierte Einstellungen zurück', async () => {
		const customSettings: ModulePdfSettings = {
			showChart: false,
			showFactors: true,
			showMap: false,
			showCta: true,
			showDisclaimer: false,
			ctaTitle: 'Jetzt Termin vereinbaren',
			ctaText: 'Rufen Sie uns an unter 0800 123456',
		};
		mockedApiClient.get.mockResolvedValueOnce(customSettings);

		const { result } = renderHook(() => useModulePdfSettings('purchase-costs'), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data?.showChart).toBe(false);
		expect(result.current.data?.showMap).toBe(false);
		expect(result.current.data?.ctaTitle).toBe('Jetzt Termin vereinbaren');
	});

	it('behandelt API-Fehler korrekt', async () => {
		mockedApiClient.get.mockRejectedValueOnce(new Error('Module not found'));

		const { result } = renderHook(() => useModulePdfSettings('invalid-module'), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(result.current.error).toBeDefined();
	});

	it('setzt isLoading während des Ladens', () => {
		mockedApiClient.get.mockReturnValue(new Promise(() => {})); // Wird nie aufgelöst

		const { result } = renderHook(() => useModulePdfSettings('rent-calculator'), {
			wrapper: createWrapper(),
		});

		expect(result.current.isLoading).toBe(true);
		expect(result.current.data).toBeUndefined();
	});

	it('verwendet korrekten Query-Key mit Slug', async () => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});

		mockedApiClient.get.mockResolvedValueOnce(defaultModulePdfSettings);

		function Wrapper({ children }: { children: ReactNode }) {
			return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
		}

		renderHook(() => useModulePdfSettings('budget-calculator'), {
			wrapper: Wrapper,
		});

		await waitFor(() => {
			const data = queryClient.getQueryData(['module-pdf-settings', 'budget-calculator']);
			expect(data).toEqual(defaultModulePdfSettings);
		});
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useSaveModulePdfSettings Hook
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft PUT admin/modules/{slug}/pdf-settings beim Speichern auf', async () => {
		mockedApiClient.get.mockResolvedValue(defaultModulePdfSettings);
		mockedApiClient.put.mockResolvedValueOnce({
			...defaultModulePdfSettings,
			showChart: false,
		});

		const { result } = renderHook(() => useSaveModulePdfSettings('rent-calculator'), {
			wrapper: createWrapper(),
		});

		result.current.mutate({ showChart: false });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith(
			'admin/modules/rent-calculator/pdf-settings',
			{ showChart: false },
		);
	});

	it('speichert alle Modul-PDF-Felder', async () => {
		mockedApiClient.get.mockResolvedValue(defaultModulePdfSettings);
		const newSettings: ModulePdfSettings = {
			showChart: false,
			showFactors: false,
			showMap: false,
			showCta: false,
			showDisclaimer: false,
			ctaTitle: 'Neuer CTA',
			ctaText: 'Neuer CTA Text',
		};
		mockedApiClient.put.mockResolvedValueOnce(newSettings);

		const { result } = renderHook(() => useSaveModulePdfSettings('value-calculator'), {
			wrapper: createWrapper(),
		});

		result.current.mutate(newSettings);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith(
			'admin/modules/value-calculator/pdf-settings',
			newSettings,
		);
	});

	it('erlaubt partielles Update', async () => {
		mockedApiClient.get.mockResolvedValue(defaultModulePdfSettings);
		mockedApiClient.put.mockResolvedValueOnce({
			...defaultModulePdfSettings,
			ctaTitle: 'Nur CTA geändert',
		});

		const { result } = renderHook(() => useSaveModulePdfSettings('roi-calculator'), {
			wrapper: createWrapper(),
		});

		result.current.mutate({ ctaTitle: 'Nur CTA geändert' });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith(
			'admin/modules/roi-calculator/pdf-settings',
			{
				ctaTitle: 'Nur CTA geändert',
			},
		);
	});

	it('behandelt Speicherfehler korrekt', async () => {
		mockedApiClient.get.mockResolvedValue(defaultModulePdfSettings);
		mockedApiClient.put.mockRejectedValueOnce(new Error('Validation failed'));

		const { result } = renderHook(() => useSaveModulePdfSettings('rent-calculator'), {
			wrapper: createWrapper(),
		});

		result.current.mutate({ showChart: false });

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(result.current.error).toBeDefined();
	});

	it('setzt isPending während des Speicherns', async () => {
		mockedApiClient.get.mockResolvedValue(defaultModulePdfSettings);
		let resolvePromise: (value: ModulePdfSettings) => void;
		mockedApiClient.put.mockReturnValueOnce(
			new Promise((resolve) => {
				resolvePromise = resolve;
			}),
		);

		const { result } = renderHook(() => useSaveModulePdfSettings('rent-calculator'), {
			wrapper: createWrapper(),
		});

		result.current.mutate({ showChart: false });

		await waitFor(() => expect(result.current.isPending).toBe(true));

		// Promise auflösen um Test zu beenden
		resolvePromise!({ ...defaultModulePdfSettings, showChart: false });

		await waitFor(() => expect(result.current.isPending).toBe(false));
	});

	// ──────────────────────────────────────────────────────────────────────────
	// Cache-Invalidierung
	// ──────────────────────────────────────────────────────────────────────────

	it('invalidiert modulspezifischen Cache nach erfolgreichem Speichern', async () => {
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

		mockedApiClient.get.mockResolvedValue(defaultModulePdfSettings);
		mockedApiClient.put.mockResolvedValueOnce({
			...defaultModulePdfSettings,
			showChart: false,
		});

		const { result } = renderHook(() => useSaveModulePdfSettings('energy-check'), {
			wrapper: Wrapper,
		});

		result.current.mutate({ showChart: false });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(invalidateSpy).toHaveBeenCalledWith({
			queryKey: ['module-pdf-settings', 'energy-check'],
		});
	});

	// ──────────────────────────────────────────────────────────────────────────
	// Boolean-Toggles Tests
	// ──────────────────────────────────────────────────────────────────────────

	it('speichert showChart Toggle', async () => {
		mockedApiClient.get.mockResolvedValue(defaultModulePdfSettings);
		mockedApiClient.put.mockResolvedValueOnce({
			...defaultModulePdfSettings,
			showChart: false,
		});

		const { result } = renderHook(() => useSaveModulePdfSettings('rent-calculator'), {
			wrapper: createWrapper(),
		});

		result.current.mutate({ showChart: false });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith(
			'admin/modules/rent-calculator/pdf-settings',
			expect.objectContaining({ showChart: false }),
		);
	});

	it('speichert showFactors Toggle', async () => {
		mockedApiClient.get.mockResolvedValue(defaultModulePdfSettings);
		mockedApiClient.put.mockResolvedValueOnce({
			...defaultModulePdfSettings,
			showFactors: false,
		});

		const { result } = renderHook(() => useSaveModulePdfSettings('rent-calculator'), {
			wrapper: createWrapper(),
		});

		result.current.mutate({ showFactors: false });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith(
			'admin/modules/rent-calculator/pdf-settings',
			expect.objectContaining({ showFactors: false }),
		);
	});

	it('speichert showMap Toggle', async () => {
		mockedApiClient.get.mockResolvedValue(defaultModulePdfSettings);
		mockedApiClient.put.mockResolvedValueOnce({ ...defaultModulePdfSettings, showMap: false });

		const { result } = renderHook(() => useSaveModulePdfSettings('rent-calculator'), {
			wrapper: createWrapper(),
		});

		result.current.mutate({ showMap: false });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith(
			'admin/modules/rent-calculator/pdf-settings',
			expect.objectContaining({ showMap: false }),
		);
	});

	it('speichert showDisclaimer Toggle', async () => {
		mockedApiClient.get.mockResolvedValue(defaultModulePdfSettings);
		mockedApiClient.put.mockResolvedValueOnce({
			...defaultModulePdfSettings,
			showDisclaimer: false,
		});

		const { result } = renderHook(() => useSaveModulePdfSettings('rent-calculator'), {
			wrapper: createWrapper(),
		});

		result.current.mutate({ showDisclaimer: false });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith(
			'admin/modules/rent-calculator/pdf-settings',
			expect.objectContaining({ showDisclaimer: false }),
		);
	});

	// ──────────────────────────────────────────────────────────────────────────
	// CTA-Texte Tests
	// ──────────────────────────────────────────────────────────────────────────

	it('speichert CTA-Titel und CTA-Text zusammen', async () => {
		mockedApiClient.get.mockResolvedValue(defaultModulePdfSettings);
		const newCta = {
			ctaTitle: 'Jetzt Beratung buchen',
			ctaText: 'Unser Team steht Ihnen zur Verfügung.',
		};
		mockedApiClient.put.mockResolvedValueOnce({ ...defaultModulePdfSettings, ...newCta });

		const { result } = renderHook(() => useSaveModulePdfSettings('seller-checklist'), {
			wrapper: createWrapper(),
		});

		result.current.mutate(newCta);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith(
			'admin/modules/seller-checklist/pdf-settings',
			newCta,
		);
	});
});
