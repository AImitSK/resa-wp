/**
 * Unit tests for useRecaptchaSettings hooks.
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

import { useRecaptchaSettings, useSaveRecaptchaSettings } from '@/admin/hooks/useRecaptchaSettings';
import { apiClient } from '@/admin/lib/api-client';
import type { RecaptchaSettings } from '@/admin/types';

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

const sampleRecaptchaSettings: RecaptchaSettings = {
	enabled: true,
	site_key: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
	secret_key: '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe',
	threshold: 0.5,
};

describe('useRecaptchaSettings', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useRecaptchaSettings Hook (GET)
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft GET admin/recaptcha-settings beim Mount auf', async () => {
		mockedApiClient.get.mockResolvedValueOnce(sampleRecaptchaSettings);

		const { result } = renderHook(() => useRecaptchaSettings(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.get).toHaveBeenCalledWith('admin/recaptcha-settings');
		expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
	});

	it('gibt reCAPTCHA-Einstellungen zurueck', async () => {
		mockedApiClient.get.mockResolvedValueOnce(sampleRecaptchaSettings);

		const { result } = renderHook(() => useRecaptchaSettings(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data).toEqual(sampleRecaptchaSettings);
		expect(result.current.data?.enabled).toBe(true);
		expect(result.current.data?.threshold).toBe(0.5);
	});

	it('gibt deaktivierte Einstellungen zurueck', async () => {
		const disabledSettings: RecaptchaSettings = {
			enabled: false,
			site_key: '',
			secret_key: '',
			threshold: 0.5,
		};
		mockedApiClient.get.mockResolvedValueOnce(disabledSettings);

		const { result } = renderHook(() => useRecaptchaSettings(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data?.enabled).toBe(false);
		expect(result.current.data?.site_key).toBe('');
	});

	it('behandelt API-Fehler korrekt', async () => {
		mockedApiClient.get.mockRejectedValueOnce(new Error('Network Error'));

		const { result } = renderHook(() => useRecaptchaSettings(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(result.current.error).toBeDefined();
	});

	it('setzt isLoading waehrend des Ladens', () => {
		mockedApiClient.get.mockReturnValue(new Promise(() => {}));

		const { result } = renderHook(() => useRecaptchaSettings(), { wrapper: createWrapper() });

		expect(result.current.isLoading).toBe(true);
		expect(result.current.data).toBeUndefined();
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useSaveRecaptchaSettings Hook (PUT)
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft PUT admin/recaptcha-settings beim Speichern auf', async () => {
		mockedApiClient.put.mockResolvedValueOnce(sampleRecaptchaSettings);

		const { result } = renderHook(() => useSaveRecaptchaSettings(), {
			wrapper: createWrapper(),
		});

		result.current.mutate({
			enabled: true,
			site_key: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
			secret_key: '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe',
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/recaptcha-settings', {
			enabled: true,
			site_key: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
			secret_key: '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe',
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

		mockedApiClient.put.mockResolvedValueOnce(sampleRecaptchaSettings);

		const { result } = renderHook(() => useSaveRecaptchaSettings(), { wrapper: Wrapper });

		result.current.mutate({ threshold: 0.7 });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['recaptcha-settings'] });
	});

	it('aktiviert reCAPTCHA mit neuen Keys', async () => {
		const newSettings = { ...sampleRecaptchaSettings, enabled: true };
		mockedApiClient.put.mockResolvedValueOnce(newSettings);

		const { result } = renderHook(() => useSaveRecaptchaSettings(), {
			wrapper: createWrapper(),
		});

		result.current.mutate({
			enabled: true,
			site_key: 'new-site-key',
			secret_key: 'new-secret-key',
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/recaptcha-settings', {
			enabled: true,
			site_key: 'new-site-key',
			secret_key: 'new-secret-key',
		});
	});

	it('deaktiviert reCAPTCHA', async () => {
		const disabledSettings = { ...sampleRecaptchaSettings, enabled: false };
		mockedApiClient.put.mockResolvedValueOnce(disabledSettings);

		const { result } = renderHook(() => useSaveRecaptchaSettings(), {
			wrapper: createWrapper(),
		});

		result.current.mutate({ enabled: false });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/recaptcha-settings', {
			enabled: false,
		});
	});

	it('aktualisiert Threshold-Wert', async () => {
		const updatedSettings = { ...sampleRecaptchaSettings, threshold: 0.8 };
		mockedApiClient.put.mockResolvedValueOnce(updatedSettings);

		const { result } = renderHook(() => useSaveRecaptchaSettings(), {
			wrapper: createWrapper(),
		});

		result.current.mutate({ threshold: 0.8 });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/recaptcha-settings', {
			threshold: 0.8,
		});
	});

	it('behandelt Fehler beim Speichern korrekt', async () => {
		mockedApiClient.put.mockRejectedValueOnce(new Error('Speichern fehlgeschlagen'));

		const { result } = renderHook(() => useSaveRecaptchaSettings(), {
			wrapper: createWrapper(),
		});

		result.current.mutate({ enabled: true });

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(result.current.error).toBeDefined();
	});

	it('setzt isPending waehrend der Mutation', async () => {
		mockedApiClient.put.mockReturnValue(new Promise(() => {}));

		const { result } = renderHook(() => useSaveRecaptchaSettings(), {
			wrapper: createWrapper(),
		});

		result.current.mutate({ threshold: 0.6 });

		await waitFor(() => expect(result.current.isPending).toBe(true));
	});
});
