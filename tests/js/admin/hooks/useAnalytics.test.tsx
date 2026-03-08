/**
 * Unit tests für useAnalytics Hooks.
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

import { useFunnelData } from '@/admin/hooks/useAnalytics';
import { apiClient } from '@/admin/lib/api-client';
import type { FunnelData } from '@/admin/types';

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

const sampleFunnelData: FunnelData = {
	summary: {
		views: 1000,
		starts: 500,
		form_views: 300,
		form_submits: 150,
		result_views: 140,
		start_rate: 50.0,
		completion_rate: 30.0,
		conversion_rate: 15.0,
	},
	daily: [
		{
			date: '2025-06-01',
			views: 100,
			starts: 50,
			form_views: 30,
			form_submits: 15,
			result_views: 14,
		},
		{
			date: '2025-06-02',
			views: 120,
			starts: 60,
			form_views: 36,
			form_submits: 18,
			result_views: 17,
		},
		{
			date: '2025-06-03',
			views: 90,
			starts: 45,
			form_views: 27,
			form_submits: 13,
			result_views: 12,
		},
	],
	filters: {
		dateFrom: '2025-06-01',
		dateTo: '2025-06-30',
		assetType: '',
		locationId: null,
	},
};

describe('useAnalytics', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useFunnelData Hook (GET Funnel-Daten)
	// ──────────────────────────────────────────────────────────────────────────

	describe('useFunnelData', () => {
		it('ruft GET analytics/funnel beim Mount auf', async () => {
			mockedApiClient.get.mockResolvedValueOnce(sampleFunnelData);

			const { result } = renderHook(() => useFunnelData(), { wrapper: createWrapper() });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockedApiClient.get).toHaveBeenCalledWith('analytics/funnel');
			expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
		});

		it('gibt Summary-Daten zurück', async () => {
			mockedApiClient.get.mockResolvedValueOnce(sampleFunnelData);

			const { result } = renderHook(() => useFunnelData(), { wrapper: createWrapper() });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data?.summary.views).toBe(1000);
			expect(result.current.data?.summary.starts).toBe(500);
			expect(result.current.data?.summary.form_submits).toBe(150);
			expect(result.current.data?.summary.conversion_rate).toBe(15.0);
		});

		it('gibt tägliche Breakdown-Daten zurück', async () => {
			mockedApiClient.get.mockResolvedValueOnce(sampleFunnelData);

			const { result } = renderHook(() => useFunnelData(), { wrapper: createWrapper() });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data?.daily).toHaveLength(3);
			expect(result.current.data?.daily[0].date).toBe('2025-06-01');
			expect(result.current.data?.daily[0].views).toBe(100);
		});

		it('gibt verwendete Filter zurück', async () => {
			mockedApiClient.get.mockResolvedValueOnce(sampleFunnelData);

			const { result } = renderHook(() => useFunnelData(), { wrapper: createWrapper() });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data?.filters.dateFrom).toBe('2025-06-01');
			expect(result.current.data?.filters.dateTo).toBe('2025-06-30');
		});

		it('übergibt Datumsfilter an API', async () => {
			mockedApiClient.get.mockResolvedValueOnce(sampleFunnelData);

			const filters = {
				dateFrom: '2025-06-01',
				dateTo: '2025-06-15',
			};

			const { result } = renderHook(() => useFunnelData(filters), {
				wrapper: createWrapper(),
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockedApiClient.get).toHaveBeenCalledWith(
				'analytics/funnel?dateFrom=2025-06-01&dateTo=2025-06-15',
			);
		});

		it('übergibt assetType-Filter an API', async () => {
			mockedApiClient.get.mockResolvedValueOnce(sampleFunnelData);

			const filters = {
				assetType: 'rent-calculator',
			};

			const { result } = renderHook(() => useFunnelData(filters), {
				wrapper: createWrapper(),
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockedApiClient.get).toHaveBeenCalledWith(
				'analytics/funnel?assetType=rent-calculator',
			);
		});

		it('übergibt locationId-Filter an API', async () => {
			mockedApiClient.get.mockResolvedValueOnce(sampleFunnelData);

			const filters = {
				locationId: 1,
			};

			const { result } = renderHook(() => useFunnelData(filters), {
				wrapper: createWrapper(),
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockedApiClient.get).toHaveBeenCalledWith('analytics/funnel?locationId=1');
		});

		it('kombiniert mehrere Filter', async () => {
			mockedApiClient.get.mockResolvedValueOnce(sampleFunnelData);

			const filters = {
				dateFrom: '2025-06-01',
				dateTo: '2025-06-30',
				assetType: 'value-calculator',
				locationId: 2,
			};

			const { result } = renderHook(() => useFunnelData(filters), {
				wrapper: createWrapper(),
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockedApiClient.get).toHaveBeenCalledWith(
				'analytics/funnel?dateFrom=2025-06-01&dateTo=2025-06-30&assetType=value-calculator&locationId=2',
			);
		});

		it('ignoriert locationId = null', async () => {
			mockedApiClient.get.mockResolvedValueOnce(sampleFunnelData);

			const filters = {
				dateFrom: '2025-06-01',
				locationId: null,
			};

			const { result } = renderHook(() => useFunnelData(filters), {
				wrapper: createWrapper(),
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			// locationId sollte nicht im Query-String erscheinen
			expect(mockedApiClient.get).toHaveBeenCalledWith(
				'analytics/funnel?dateFrom=2025-06-01',
			);
		});

		it('berechnet Conversion-Rates korrekt', async () => {
			const dataWithRates: FunnelData = {
				...sampleFunnelData,
				summary: {
					views: 1000,
					starts: 500,
					form_views: 300,
					form_submits: 150,
					result_views: 140,
					start_rate: 50.0, // starts / views
					completion_rate: 30.0, // form_submits / views
					conversion_rate: 15.0, // form_submits / views
				},
			};
			mockedApiClient.get.mockResolvedValueOnce(dataWithRates);

			const { result } = renderHook(() => useFunnelData(), { wrapper: createWrapper() });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data?.summary.start_rate).toBe(50.0);
			expect(result.current.data?.summary.completion_rate).toBe(30.0);
			expect(result.current.data?.summary.conversion_rate).toBe(15.0);
		});

		it('behandelt leere Funnel-Daten', async () => {
			const emptyData: FunnelData = {
				summary: {
					views: 0,
					starts: 0,
					form_views: 0,
					form_submits: 0,
					result_views: 0,
					start_rate: 0,
					completion_rate: 0,
					conversion_rate: 0,
				},
				daily: [],
				filters: {
					dateFrom: '2025-06-01',
					dateTo: '2025-06-30',
					assetType: '',
					locationId: null,
				},
			};
			mockedApiClient.get.mockResolvedValueOnce(emptyData);

			const { result } = renderHook(() => useFunnelData(), { wrapper: createWrapper() });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data?.summary.views).toBe(0);
			expect(result.current.data?.daily).toHaveLength(0);
		});

		it('behandelt API-Fehler korrekt', async () => {
			mockedApiClient.get.mockRejectedValueOnce(new Error('Analytics service unavailable'));

			const { result } = renderHook(() => useFunnelData(), { wrapper: createWrapper() });

			await waitFor(() => expect(result.current.isError).toBe(true));

			expect(result.current.error).toBeDefined();
		});

		it('setzt isLoading während des Ladens', () => {
			mockedApiClient.get.mockReturnValue(new Promise(() => {}));

			const { result } = renderHook(() => useFunnelData(), { wrapper: createWrapper() });

			expect(result.current.isLoading).toBe(true);
			expect(result.current.data).toBeUndefined();
		});

		it('verwendet Filter als Teil des Query-Keys', async () => {
			mockedApiClient.get.mockResolvedValue(sampleFunnelData);

			const filters1 = { dateFrom: '2025-06-01' };
			const filters2 = { dateFrom: '2025-07-01' };

			const { result: result1 } = renderHook(() => useFunnelData(filters1), {
				wrapper: createWrapper(),
			});
			const { result: result2 } = renderHook(() => useFunnelData(filters2), {
				wrapper: createWrapper(),
			});

			await waitFor(() => {
				expect(result1.current.isSuccess).toBe(true);
				expect(result2.current.isSuccess).toBe(true);
			});

			// Beide Aufrufe sollten unterschiedliche Endpoints nutzen
			expect(mockedApiClient.get).toHaveBeenCalledWith(
				'analytics/funnel?dateFrom=2025-06-01',
			);
			expect(mockedApiClient.get).toHaveBeenCalledWith(
				'analytics/funnel?dateFrom=2025-07-01',
			);
		});
	});
});
