/**
 * Unit tests for useTrackingSettings hooks.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// Mock api-client.
vi.mock('@/admin/lib/api-client', () => ({
	apiClient: {
		get: vi.fn(),
		put: vi.fn(),
	},
}));

import { useTrackingSettings, useSaveTrackingSettings } from '@/admin/hooks/useTrackingSettings';
import { apiClient } from '@/admin/lib/api-client';
import type { TrackingSettings } from '@/admin/types';

const mockedApiClient = apiClient as {
	get: ReturnType<typeof vi.fn>;
	put: ReturnType<typeof vi.fn>;
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

const sampleTrackingSettings: TrackingSettings = {
	funnel_tracking_enabled: true,
	partial_leads_enabled: true,
	partial_lead_ttl_days: 7,
	datalayer_enabled: true,
	google_ads_fv_id: 'AW-123456789',
	google_ads_fv_label: 'abcdef123',
	google_ads_fs_id: 'AW-987654321',
	google_ads_fs_label: 'ghijkl456',
	enhanced_conversions_enabled: true,
	gclid_capture_enabled: true,
	utm_capture_enabled: true,
};

describe('useTrackingSettings', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useTrackingSettings Hook (GET)
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft GET admin/tracking-settings beim Mount auf', async () => {
		mockedApiClient.get.mockResolvedValueOnce(sampleTrackingSettings);

		const { result } = renderHook(() => useTrackingSettings(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.get).toHaveBeenCalledWith('admin/tracking-settings');
		expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
	});

	it('gibt Tracking-Einstellungen zurueck', async () => {
		mockedApiClient.get.mockResolvedValueOnce(sampleTrackingSettings);

		const { result } = renderHook(() => useTrackingSettings(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data).toEqual(sampleTrackingSettings);
		expect(result.current.data?.funnel_tracking_enabled).toBe(true);
		expect(result.current.data?.google_ads_fv_id).toBe('AW-123456789');
	});

	it('gibt Einstellungen mit deaktiviertem Tracking zurueck', async () => {
		const disabledSettings: TrackingSettings = {
			funnel_tracking_enabled: false,
			partial_leads_enabled: false,
			partial_lead_ttl_days: 3,
			datalayer_enabled: false,
			google_ads_fv_id: '',
			google_ads_fv_label: '',
			google_ads_fs_id: '',
			google_ads_fs_label: '',
			enhanced_conversions_enabled: false,
			gclid_capture_enabled: false,
			utm_capture_enabled: false,
		};
		mockedApiClient.get.mockResolvedValueOnce(disabledSettings);

		const { result } = renderHook(() => useTrackingSettings(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data?.funnel_tracking_enabled).toBe(false);
		expect(result.current.data?.datalayer_enabled).toBe(false);
	});

	it('behandelt API-Fehler korrekt', async () => {
		mockedApiClient.get.mockRejectedValueOnce(new Error('Network Error'));

		const { result } = renderHook(() => useTrackingSettings(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(result.current.error).toBeDefined();
	});

	it('setzt isLoading waehrend des Ladens', () => {
		mockedApiClient.get.mockReturnValue(new Promise(() => {}));

		const { result } = renderHook(() => useTrackingSettings(), { wrapper: createWrapper() });

		expect(result.current.isLoading).toBe(true);
		expect(result.current.data).toBeUndefined();
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useSaveTrackingSettings Hook (PUT)
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft PUT admin/tracking-settings beim Speichern auf', async () => {
		mockedApiClient.put.mockResolvedValueOnce(sampleTrackingSettings);

		const { result } = renderHook(() => useSaveTrackingSettings(), {
			wrapper: createWrapper(),
		});

		result.current.mutate({
			funnel_tracking_enabled: true,
			datalayer_enabled: true,
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/tracking-settings', {
			funnel_tracking_enabled: true,
			datalayer_enabled: true,
		});
	});

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

		mockedApiClient.put.mockResolvedValueOnce(sampleTrackingSettings);

		const { result } = renderHook(() => useSaveTrackingSettings(), { wrapper: Wrapper });

		result.current.mutate({ partial_lead_ttl_days: 14 });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['tracking-settings'] });
	});

	it('aktiviert Funnel-Tracking', async () => {
		const enabledSettings = { ...sampleTrackingSettings, funnel_tracking_enabled: true };
		mockedApiClient.put.mockResolvedValueOnce(enabledSettings);

		const { result } = renderHook(() => useSaveTrackingSettings(), {
			wrapper: createWrapper(),
		});

		result.current.mutate({ funnel_tracking_enabled: true });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/tracking-settings', {
			funnel_tracking_enabled: true,
		});
	});

	it('konfiguriert Google Ads Conversion-Tracking', async () => {
		mockedApiClient.put.mockResolvedValueOnce(sampleTrackingSettings);

		const { result } = renderHook(() => useSaveTrackingSettings(), {
			wrapper: createWrapper(),
		});

		result.current.mutate({
			google_ads_fv_id: 'AW-111111111',
			google_ads_fv_label: 'newlabel123',
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/tracking-settings', {
			google_ads_fv_id: 'AW-111111111',
			google_ads_fv_label: 'newlabel123',
		});
	});

	it('aktiviert Enhanced Conversions', async () => {
		const updatedSettings = { ...sampleTrackingSettings, enhanced_conversions_enabled: true };
		mockedApiClient.put.mockResolvedValueOnce(updatedSettings);

		const { result } = renderHook(() => useSaveTrackingSettings(), {
			wrapper: createWrapper(),
		});

		result.current.mutate({ enhanced_conversions_enabled: true });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/tracking-settings', {
			enhanced_conversions_enabled: true,
		});
	});

	it('konfiguriert UTM und GCLID Capture', async () => {
		mockedApiClient.put.mockResolvedValueOnce(sampleTrackingSettings);

		const { result } = renderHook(() => useSaveTrackingSettings(), {
			wrapper: createWrapper(),
		});

		result.current.mutate({
			gclid_capture_enabled: true,
			utm_capture_enabled: true,
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/tracking-settings', {
			gclid_capture_enabled: true,
			utm_capture_enabled: true,
		});
	});

	it('aendert Partial-Lead TTL', async () => {
		const updatedSettings = { ...sampleTrackingSettings, partial_lead_ttl_days: 30 };
		mockedApiClient.put.mockResolvedValueOnce(updatedSettings);

		const { result } = renderHook(() => useSaveTrackingSettings(), {
			wrapper: createWrapper(),
		});

		result.current.mutate({ partial_lead_ttl_days: 30 });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/tracking-settings', {
			partial_lead_ttl_days: 30,
		});
	});

	it('behandelt Fehler beim Speichern korrekt', async () => {
		mockedApiClient.put.mockRejectedValueOnce(new Error('Speichern fehlgeschlagen'));

		const { result } = renderHook(() => useSaveTrackingSettings(), {
			wrapper: createWrapper(),
		});

		result.current.mutate({ funnel_tracking_enabled: false });

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(result.current.error).toBeDefined();
	});

	it('setzt isPending waehrend der Mutation', async () => {
		mockedApiClient.put.mockReturnValue(new Promise(() => {}));

		const { result } = renderHook(() => useSaveTrackingSettings(), {
			wrapper: createWrapper(),
		});

		result.current.mutate({ datalayer_enabled: false });

		await waitFor(() => expect(result.current.isPending).toBe(true));
	});
});
