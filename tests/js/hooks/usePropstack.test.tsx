/**
 * Tests for usePropstack hooks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePropstackSettings, useSavePropstackSettings } from '@/admin/hooks/usePropstack';
import { apiClient } from '@/admin/lib/api-client';
import type { PropsWithChildren } from 'react';

// Mock apiClient
vi.mock('@/admin/lib/api-client', () => ({
	apiClient: {
		get: vi.fn(),
		put: vi.fn(),
		post: vi.fn(),
	},
}));

describe('usePropstack hooks', () => {
	let queryClient: QueryClient;

	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});
		vi.clearAllMocks();
	});

	const wrapper = ({ children }: PropsWithChildren) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);

	describe('usePropstackSettings', () => {
		it('query key is correct', () => {
			const { result } = renderHook(() => usePropstackSettings(), { wrapper });
			expect(result.current.queryKey).toEqual(['propstack-settings']);
		});

		it('fetches settings from API', async () => {
			const mockSettings = {
				enabled: true,
				api_key: '',
				api_key_masked: '****abcd',
				city_broker_mapping: {},
				default_broker_id: 123,
			};

			vi.mocked(apiClient.get).mockResolvedValueOnce(mockSettings);

			const { result } = renderHook(() => usePropstackSettings(), { wrapper });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));
			expect(result.current.data).toEqual(mockSettings);
			expect(apiClient.get).toHaveBeenCalledWith('admin/propstack/settings');
		});
	});

	describe('useSavePropstackSettings', () => {
		it('save mutation invalidates all caches', async () => {
			const mockUpdated = { enabled: false };
			vi.mocked(apiClient.put).mockResolvedValueOnce(mockUpdated);

			const { result } = renderHook(() => useSavePropstackSettings(), { wrapper });

			const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

			await result.current.mutateAsync({ enabled: false });

			expect(apiClient.put).toHaveBeenCalledWith('admin/propstack/settings', {
				enabled: false,
			});

			// Should invalidate all propstack-related queries
			expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['propstack-settings'] });
			expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['propstack-brokers'] });
			expect(invalidateSpy).toHaveBeenCalledWith({
				queryKey: ['propstack-contact-sources'],
			});
			expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['propstack-activity-types'] });
		});
	});
});
