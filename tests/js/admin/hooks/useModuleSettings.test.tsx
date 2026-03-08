/**
 * Unit tests für useModuleSettings Hooks.
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
	useModuleSettings,
	useModulePresets,
	useSaveModuleSettings,
	useSaveLocationValue,
	useDeleteLocationValue,
	type ModuleSettingsData,
	type RegionPreset,
	type LocationValue,
} from '@/admin/hooks/useModuleSettings';
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

const sampleSettings: ModuleSettingsData = {
	id: 1,
	module_slug: 'rent-calculator',
	setup_mode: 'individuell',
	region_preset: 'grossstadt',
	factors: {
		size_degression: 0.02,
		age_factor: 0.01,
	},
	location_values: {
		'1': { base_price: 12.5, price_min: 8.0, price_max: 18.0 },
		'2': { base_price: 15.0, price_min: 10.0, price_max: 22.0 },
	},
	module: {
		slug: 'rent-calculator',
		name: 'Mietpreis-Kalkulator',
		description: 'Berechnet den fairen Mietpreis für Wohnungen.',
		icon: 'calculator-rent',
		category: 'calculators',
		flag: 'free',
		active: true,
	},
	created_at: '2025-01-01 00:00:00',
	updated_at: '2025-06-01 12:00:00',
};

const samplePresets: Record<string, RegionPreset> = {
	grossstadt: {
		label: 'Großstadt (> 500.000 Einwohner)',
		base_price: 14.0,
		size_degression: 0.02,
	},
	mittelstadt: {
		label: 'Mittelstadt (50.000 - 500.000 Einwohner)',
		base_price: 10.0,
		size_degression: 0.015,
	},
	kleinstadt: {
		label: 'Kleinstadt (< 50.000 Einwohner)',
		base_price: 7.5,
		size_degression: 0.01,
	},
};

describe('useModuleSettings', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useModuleSettings Hook (GET Einstellungen)
	// ──────────────────────────────────────────────────────────────────────────

	describe('useModuleSettings', () => {
		it('ruft GET admin/modules/{slug}/settings auf', async () => {
			mockedApiClient.get.mockResolvedValueOnce(sampleSettings);

			const { result } = renderHook(() => useModuleSettings('rent-calculator'), {
				wrapper: createWrapper(),
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockedApiClient.get).toHaveBeenCalledWith(
				'admin/modules/rent-calculator/settings',
			);
		});

		it('gibt Modul-Einstellungen zurück', async () => {
			mockedApiClient.get.mockResolvedValueOnce(sampleSettings);

			const { result } = renderHook(() => useModuleSettings('rent-calculator'), {
				wrapper: createWrapper(),
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data?.module_slug).toBe('rent-calculator');
			expect(result.current.data?.setup_mode).toBe('individuell');
			expect(result.current.data?.region_preset).toBe('grossstadt');
		});

		it('enthält Faktoren und Location-Werte', async () => {
			mockedApiClient.get.mockResolvedValueOnce(sampleSettings);

			const { result } = renderHook(() => useModuleSettings('rent-calculator'), {
				wrapper: createWrapper(),
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data?.factors).toEqual({
				size_degression: 0.02,
				age_factor: 0.01,
			});
			expect(result.current.data?.location_values['1'].base_price).toBe(12.5);
		});

		it('enthält Modul-Info', async () => {
			mockedApiClient.get.mockResolvedValueOnce(sampleSettings);

			const { result } = renderHook(() => useModuleSettings('rent-calculator'), {
				wrapper: createWrapper(),
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data?.module?.name).toBe('Mietpreis-Kalkulator');
			expect(result.current.data?.module?.flag).toBe('free');
			expect(result.current.data?.module?.active).toBe(true);
		});

		it('ist deaktiviert bei slug = undefined', async () => {
			const { result } = renderHook(() => useModuleSettings(undefined), {
				wrapper: createWrapper(),
			});

			// Query sollte nicht gestartet werden
			expect(result.current.fetchStatus).toBe('idle');
			expect(mockedApiClient.get).not.toHaveBeenCalled();
		});

		it('behandelt API-Fehler korrekt', async () => {
			mockedApiClient.get.mockRejectedValueOnce(new Error('Module not found'));

			const { result } = renderHook(() => useModuleSettings('invalid-module'), {
				wrapper: createWrapper(),
			});

			await waitFor(() => expect(result.current.isError).toBe(true));

			expect(result.current.error).toBeDefined();
		});
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useModulePresets Hook (GET Presets)
	// ──────────────────────────────────────────────────────────────────────────

	describe('useModulePresets', () => {
		it('ruft GET admin/modules/{slug}/presets auf', async () => {
			mockedApiClient.get.mockResolvedValueOnce(samplePresets);

			const { result } = renderHook(() => useModulePresets('rent-calculator'), {
				wrapper: createWrapper(),
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockedApiClient.get).toHaveBeenCalledWith(
				'admin/modules/rent-calculator/presets',
			);
		});

		it('gibt Region-Presets zurück', async () => {
			mockedApiClient.get.mockResolvedValueOnce(samplePresets);

			const { result } = renderHook(() => useModulePresets('rent-calculator'), {
				wrapper: createWrapper(),
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data?.grossstadt.label).toBe('Großstadt (> 500.000 Einwohner)');
			expect(result.current.data?.grossstadt.base_price).toBe(14.0);
			expect(result.current.data?.mittelstadt.base_price).toBe(10.0);
			expect(result.current.data?.kleinstadt.base_price).toBe(7.5);
		});

		it('ist deaktiviert bei slug = undefined', async () => {
			const { result } = renderHook(() => useModulePresets(undefined), {
				wrapper: createWrapper(),
			});

			expect(result.current.fetchStatus).toBe('idle');
			expect(mockedApiClient.get).not.toHaveBeenCalled();
		});
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useSaveModuleSettings Hook (PUT Einstellungen)
	// ──────────────────────────────────────────────────────────────────────────

	describe('useSaveModuleSettings', () => {
		it('ruft PUT admin/modules/{slug}/settings auf', async () => {
			mockedApiClient.put.mockResolvedValueOnce(sampleSettings);

			const { result } = renderHook(() => useSaveModuleSettings('rent-calculator'), {
				wrapper: createWrapper(),
			});

			result.current.mutate({
				setup_mode: 'pauschal',
				region_preset: 'mittelstadt',
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockedApiClient.put).toHaveBeenCalledWith(
				'admin/modules/rent-calculator/settings',
				{
					setup_mode: 'pauschal',
					region_preset: 'mittelstadt',
				},
			);
		});

		it('speichert Faktoren', async () => {
			const newFactors = { size_degression: 0.03, age_factor: 0.02 };
			mockedApiClient.put.mockResolvedValueOnce({ ...sampleSettings, factors: newFactors });

			const { result } = renderHook(() => useSaveModuleSettings('rent-calculator'), {
				wrapper: createWrapper(),
			});

			result.current.mutate({ factors: newFactors });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockedApiClient.put).toHaveBeenCalledWith(
				'admin/modules/rent-calculator/settings',
				{
					factors: newFactors,
				},
			);
		});

		it('invalidiert Cache nach Speichern', async () => {
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

			mockedApiClient.put.mockResolvedValueOnce(sampleSettings);

			const { result } = renderHook(() => useSaveModuleSettings('rent-calculator'), {
				wrapper: Wrapper,
			});

			result.current.mutate({ setup_mode: 'pauschal' });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(invalidateSpy).toHaveBeenCalledWith({
				queryKey: ['module-settings', 'rent-calculator'],
			});
		});

		it('behandelt Speicher-Fehler korrekt', async () => {
			mockedApiClient.put.mockRejectedValueOnce(new Error('Validation failed'));

			const { result } = renderHook(() => useSaveModuleSettings('rent-calculator'), {
				wrapper: createWrapper(),
			});

			result.current.mutate({ setup_mode: 'pauschal' });

			await waitFor(() => expect(result.current.isError).toBe(true));

			expect(result.current.error).toBeDefined();
		});
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useSaveLocationValue Hook (PUT Location-Wert)
	// ──────────────────────────────────────────────────────────────────────────

	describe('useSaveLocationValue', () => {
		it('ruft PUT admin/modules/{slug}/settings/locations/{id} auf', async () => {
			const locationValue: LocationValue = {
				base_price: 13.0,
				price_min: 9.0,
				price_max: 19.0,
			};
			mockedApiClient.put.mockResolvedValueOnce({ location_id: 1, values: locationValue });

			const { result } = renderHook(() => useSaveLocationValue('rent-calculator'), {
				wrapper: createWrapper(),
			});

			result.current.mutate({ locationId: 1, values: locationValue });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockedApiClient.put).toHaveBeenCalledWith(
				'admin/modules/rent-calculator/settings/locations/1',
				locationValue,
			);
		});

		it('gibt gespeicherte Location-Werte zurück', async () => {
			const locationValue: LocationValue = {
				base_price: 13.0,
				price_min: 9.0,
				price_max: 19.0,
			};
			mockedApiClient.put.mockResolvedValueOnce({ location_id: 1, values: locationValue });

			const { result } = renderHook(() => useSaveLocationValue('rent-calculator'), {
				wrapper: createWrapper(),
			});

			result.current.mutate({ locationId: 1, values: locationValue });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data?.location_id).toBe(1);
			expect(result.current.data?.values.base_price).toBe(13.0);
		});

		it('invalidiert Cache nach Speichern', async () => {
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

			const locationValue: LocationValue = { base_price: 13.0 };
			mockedApiClient.put.mockResolvedValueOnce({ location_id: 1, values: locationValue });

			const { result } = renderHook(() => useSaveLocationValue('rent-calculator'), {
				wrapper: Wrapper,
			});

			result.current.mutate({ locationId: 1, values: locationValue });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(invalidateSpy).toHaveBeenCalledWith({
				queryKey: ['module-settings', 'rent-calculator'],
			});
		});
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useDeleteLocationValue Hook (DELETE Location-Wert)
	// ──────────────────────────────────────────────────────────────────────────

	describe('useDeleteLocationValue', () => {
		it('ruft DELETE admin/modules/{slug}/settings/locations/{id} auf', async () => {
			mockedApiClient.del.mockResolvedValueOnce({ deleted: true });

			const { result } = renderHook(() => useDeleteLocationValue('rent-calculator'), {
				wrapper: createWrapper(),
			});

			result.current.mutate(1);

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockedApiClient.del).toHaveBeenCalledWith(
				'admin/modules/rent-calculator/settings/locations/1',
			);
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

			const { result } = renderHook(() => useDeleteLocationValue('rent-calculator'), {
				wrapper: Wrapper,
			});

			result.current.mutate(1);

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(invalidateSpy).toHaveBeenCalledWith({
				queryKey: ['module-settings', 'rent-calculator'],
			});
		});

		it('behandelt Lösch-Fehler korrekt', async () => {
			mockedApiClient.del.mockRejectedValueOnce(new Error('Location not found'));

			const { result } = renderHook(() => useDeleteLocationValue('rent-calculator'), {
				wrapper: createWrapper(),
			});

			result.current.mutate(999);

			await waitFor(() => expect(result.current.isError).toBe(true));

			expect(result.current.error).toBeDefined();
		});
	});
});
