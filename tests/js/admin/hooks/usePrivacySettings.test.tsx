/**
 * Unit tests for usePrivacySettings hooks.
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

import { usePrivacySettings, useSavePrivacySettings } from '@/admin/hooks/usePrivacySettings';
import { apiClient } from '@/admin/lib/api-client';
import type { PrivacySettings } from '@/admin/types';

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

const samplePrivacySettings: PrivacySettings = {
	privacy_url: 'https://example.com/datenschutz',
	consent_text: 'Ich stimme der Verarbeitung meiner Daten zu.',
	newsletter_text: 'Ich moechte den Newsletter erhalten.',
	lead_retention_days: 365,
	email_log_retention_days: 90,
	anonymize_instead_of_delete: true,
};

describe('usePrivacySettings', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	// ──────────────────────────────────────────────────────────────────────────
	// usePrivacySettings Hook (GET)
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft GET admin/privacy-settings beim Mount auf', async () => {
		mockedApiClient.get.mockResolvedValueOnce(samplePrivacySettings);

		const { result } = renderHook(() => usePrivacySettings(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.get).toHaveBeenCalledWith('admin/privacy-settings');
		expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
	});

	it('gibt Datenschutz-Einstellungen zurueck', async () => {
		mockedApiClient.get.mockResolvedValueOnce(samplePrivacySettings);

		const { result } = renderHook(() => usePrivacySettings(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data).toEqual(samplePrivacySettings);
		expect(result.current.data?.privacy_url).toBe('https://example.com/datenschutz');
		expect(result.current.data?.lead_retention_days).toBe(365);
	});

	it('behandelt API-Fehler korrekt', async () => {
		mockedApiClient.get.mockRejectedValueOnce(new Error('Network Error'));

		const { result } = renderHook(() => usePrivacySettings(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(result.current.error).toBeDefined();
	});

	it('setzt isLoading waehrend des Ladens', () => {
		mockedApiClient.get.mockReturnValue(new Promise(() => {}));

		const { result } = renderHook(() => usePrivacySettings(), { wrapper: createWrapper() });

		expect(result.current.isLoading).toBe(true);
		expect(result.current.data).toBeUndefined();
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useSavePrivacySettings Hook (PUT)
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft PUT admin/privacy-settings beim Speichern auf', async () => {
		mockedApiClient.put.mockResolvedValueOnce(samplePrivacySettings);

		const { result } = renderHook(() => useSavePrivacySettings(), {
			wrapper: createWrapper(),
		});

		result.current.mutate({
			privacy_url: 'https://example.com/datenschutz',
			lead_retention_days: 365,
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/privacy-settings', {
			privacy_url: 'https://example.com/datenschutz',
			lead_retention_days: 365,
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

		mockedApiClient.put.mockResolvedValueOnce(samplePrivacySettings);

		const { result } = renderHook(() => useSavePrivacySettings(), { wrapper: Wrapper });

		result.current.mutate({ lead_retention_days: 180 });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['privacy-settings'] });
	});

	it('aktualisiert Einstellungen teilweise (Partial Update)', async () => {
		const updatedSettings = { ...samplePrivacySettings, anonymize_instead_of_delete: false };
		mockedApiClient.put.mockResolvedValueOnce(updatedSettings);

		const { result } = renderHook(() => useSavePrivacySettings(), {
			wrapper: createWrapper(),
		});

		result.current.mutate({ anonymize_instead_of_delete: false });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/privacy-settings', {
			anonymize_instead_of_delete: false,
		});
	});

	it('behandelt Fehler beim Speichern korrekt', async () => {
		mockedApiClient.put.mockRejectedValueOnce(new Error('Speichern fehlgeschlagen'));

		const { result } = renderHook(() => useSavePrivacySettings(), {
			wrapper: createWrapper(),
		});

		result.current.mutate({ lead_retention_days: 30 });

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(result.current.error).toBeDefined();
	});

	it('setzt isPending waehrend der Mutation', async () => {
		mockedApiClient.put.mockReturnValue(new Promise(() => {}));

		const { result } = renderHook(() => useSavePrivacySettings(), {
			wrapper: createWrapper(),
		});

		result.current.mutate({ lead_retention_days: 60 });

		await waitFor(() => expect(result.current.isPending).toBe(true));
	});
});
