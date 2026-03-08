/**
 * Unit tests für useModules Hooks.
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

import { useModules, useToggleModule } from '@/admin/hooks/useModules';
import { apiClient } from '@/admin/lib/api-client';
import type { ModuleSummary } from '@/admin/types';

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

const sampleModules: ModuleSummary[] = [
	{
		slug: 'rent-calculator',
		name: 'Mietpreis-Kalkulator',
		description: 'Berechnet den fairen Mietpreis für Wohnungen.',
		icon: 'calculator-rent',
		category: 'calculators',
		flag: 'free',
		active: true,
	},
	{
		slug: 'value-calculator',
		name: 'Immobilienwert-Kalkulator',
		description: 'Schätzt den Marktwert einer Immobilie.',
		icon: 'calculator-value',
		category: 'calculators',
		flag: 'free',
		active: true,
	},
	{
		slug: 'purchase-costs',
		name: 'Kaufnebenkosten-Rechner',
		description: 'Berechnet alle Kaufnebenkosten.',
		icon: 'calculator-costs',
		category: 'calculators',
		flag: 'pro',
		active: false,
	},
	{
		slug: 'roi-calculator',
		name: 'Rendite-Rechner',
		description: 'Berechnet die Rendite einer Kapitalanlage.',
		icon: 'calculator-roi',
		category: 'calculators',
		flag: 'pro',
		active: false,
	},
];

describe('useModules', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useModules Hook (GET alle Module)
	// ──────────────────────────────────────────────────────────────────────────

	describe('useModules', () => {
		it('ruft GET admin/modules beim Mount auf', async () => {
			mockedApiClient.get.mockResolvedValueOnce(sampleModules);

			const { result } = renderHook(() => useModules(), { wrapper: createWrapper() });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockedApiClient.get).toHaveBeenCalledWith('admin/modules');
			expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
		});

		it('gibt Module-Array zurück', async () => {
			mockedApiClient.get.mockResolvedValueOnce(sampleModules);

			const { result } = renderHook(() => useModules(), { wrapper: createWrapper() });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data).toHaveLength(4);
			expect(result.current.data?.[0].name).toBe('Mietpreis-Kalkulator');
			expect(result.current.data?.[1].name).toBe('Immobilienwert-Kalkulator');
		});

		it('enthält alle Module-Eigenschaften', async () => {
			mockedApiClient.get.mockResolvedValueOnce(sampleModules);

			const { result } = renderHook(() => useModules(), { wrapper: createWrapper() });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			const rentModule = result.current.data?.[0];
			expect(rentModule?.slug).toBe('rent-calculator');
			expect(rentModule?.icon).toBe('calculator-rent');
			expect(rentModule?.category).toBe('calculators');
			expect(rentModule?.flag).toBe('free');
			expect(rentModule?.active).toBe(true);
		});

		it('unterscheidet free und pro Module', async () => {
			mockedApiClient.get.mockResolvedValueOnce(sampleModules);

			const { result } = renderHook(() => useModules(), { wrapper: createWrapper() });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			const freeModules = result.current.data?.filter((m) => m.flag === 'free');
			const proModules = result.current.data?.filter((m) => m.flag === 'pro');

			expect(freeModules).toHaveLength(2);
			expect(proModules).toHaveLength(2);
		});

		it('unterscheidet aktive und inaktive Module', async () => {
			mockedApiClient.get.mockResolvedValueOnce(sampleModules);

			const { result } = renderHook(() => useModules(), { wrapper: createWrapper() });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			const activeModules = result.current.data?.filter((m) => m.active);
			const inactiveModules = result.current.data?.filter((m) => !m.active);

			expect(activeModules).toHaveLength(2);
			expect(inactiveModules).toHaveLength(2);
		});

		it('gibt leeres Array zurück wenn keine Module', async () => {
			mockedApiClient.get.mockResolvedValueOnce([]);

			const { result } = renderHook(() => useModules(), { wrapper: createWrapper() });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data).toEqual([]);
		});

		it('behandelt API-Fehler korrekt', async () => {
			mockedApiClient.get.mockRejectedValueOnce(new Error('Network Error'));

			const { result } = renderHook(() => useModules(), { wrapper: createWrapper() });

			await waitFor(() => expect(result.current.isError).toBe(true));

			expect(result.current.error).toBeDefined();
		});

		it('setzt isLoading während des Ladens', () => {
			mockedApiClient.get.mockReturnValue(new Promise(() => {}));

			const { result } = renderHook(() => useModules(), { wrapper: createWrapper() });

			expect(result.current.isLoading).toBe(true);
			expect(result.current.data).toBeUndefined();
		});
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useToggleModule Hook (POST toggle)
	// ──────────────────────────────────────────────────────────────────────────

	describe('useToggleModule', () => {
		it('ruft POST admin/modules/{slug}/toggle auf', async () => {
			mockedApiClient.post.mockResolvedValueOnce({ slug: 'purchase-costs', active: true });

			const { result } = renderHook(() => useToggleModule(), { wrapper: createWrapper() });

			result.current.mutate('purchase-costs');

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockedApiClient.post).toHaveBeenCalledWith(
				'admin/modules/purchase-costs/toggle',
				{},
			);
		});

		it('aktiviert ein inaktives Modul', async () => {
			mockedApiClient.post.mockResolvedValueOnce({ slug: 'roi-calculator', active: true });

			const { result } = renderHook(() => useToggleModule(), { wrapper: createWrapper() });

			result.current.mutate('roi-calculator');

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data?.active).toBe(true);
		});

		it('deaktiviert ein aktives Modul', async () => {
			mockedApiClient.post.mockResolvedValueOnce({ slug: 'rent-calculator', active: false });

			const { result } = renderHook(() => useToggleModule(), { wrapper: createWrapper() });

			result.current.mutate('rent-calculator');

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data?.active).toBe(false);
		});

		it('invalidiert modules Cache nach Toggle', async () => {
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

			mockedApiClient.post.mockResolvedValueOnce({ slug: 'purchase-costs', active: true });

			const { result } = renderHook(() => useToggleModule(), { wrapper: Wrapper });

			result.current.mutate('purchase-costs');

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['modules'] });
		});

		it('invalidiert module-settings Cache nach Toggle', async () => {
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

			mockedApiClient.post.mockResolvedValueOnce({ slug: 'purchase-costs', active: true });

			const { result } = renderHook(() => useToggleModule(), { wrapper: Wrapper });

			result.current.mutate('purchase-costs');

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(invalidateSpy).toHaveBeenCalledWith({
				queryKey: ['module-settings', 'purchase-costs'],
			});
		});

		it('behandelt Toggle-Fehler korrekt', async () => {
			mockedApiClient.post.mockRejectedValueOnce(
				new Error('Pro module requires premium plan'),
			);

			const { result } = renderHook(() => useToggleModule(), { wrapper: createWrapper() });

			result.current.mutate('roi-calculator');

			await waitFor(() => expect(result.current.isError).toBe(true));

			expect(result.current.error).toBeDefined();
		});

		it('gibt Modul-Slug und neuen Status zurück', async () => {
			mockedApiClient.post.mockResolvedValueOnce({ slug: 'purchase-costs', active: true });

			const { result } = renderHook(() => useToggleModule(), { wrapper: createWrapper() });

			result.current.mutate('purchase-costs');

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data).toEqual({ slug: 'purchase-costs', active: true });
		});
	});
});
