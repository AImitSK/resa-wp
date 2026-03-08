/**
 * Unit tests for useMessengers hooks.
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
	useMessengers,
	useCreateMessenger,
	useUpdateMessenger,
	useDeleteMessenger,
	useTestMessenger,
} from '@/admin/hooks/useMessengers';
import { apiClient } from '@/admin/lib/api-client';
import type { MessengerConfig, MessengerFormData, MessengerTestResult } from '@/admin/types';

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

const sampleMessenger: MessengerConfig = {
	id: 1,
	name: 'Lead-Benachrichtigungen',
	platform: 'slack',
	webhookUrl: 'https://hooks.slack.com/services/T00/B00/XXX',
	isActive: true,
	createdAt: '2025-06-01 12:00:00',
	updatedAt: '2025-06-01 12:00:00',
};

const sampleFormData: MessengerFormData = {
	name: 'Lead-Benachrichtigungen',
	platform: 'slack',
	webhookUrl: 'https://hooks.slack.com/services/T00/B00/XXX',
	isActive: true,
};

describe('useMessengers', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useMessengers Hook (GET)
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft GET admin/messengers beim Mount auf', async () => {
		mockedApiClient.get.mockResolvedValueOnce([sampleMessenger]);

		const { result } = renderHook(() => useMessengers(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.get).toHaveBeenCalledWith('admin/messengers');
		expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
	});

	it('gibt Messenger-Array zurueck', async () => {
		mockedApiClient.get.mockResolvedValueOnce([sampleMessenger]);

		const { result } = renderHook(() => useMessengers(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data).toHaveLength(1);
		expect(result.current.data?.[0].name).toBe('Lead-Benachrichtigungen');
		expect(result.current.data?.[0].platform).toBe('slack');
	});

	it('gibt leeres Array zurueck wenn keine Messengers', async () => {
		mockedApiClient.get.mockResolvedValueOnce([]);

		const { result } = renderHook(() => useMessengers(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data).toEqual([]);
	});

	it('behandelt API-Fehler korrekt', async () => {
		mockedApiClient.get.mockRejectedValueOnce(new Error('Network Error'));

		const { result } = renderHook(() => useMessengers(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(result.current.error).toBeDefined();
	});

	it('setzt isLoading waehrend des Ladens', () => {
		mockedApiClient.get.mockReturnValue(new Promise(() => {}));

		const { result } = renderHook(() => useMessengers(), { wrapper: createWrapper() });

		expect(result.current.isLoading).toBe(true);
		expect(result.current.data).toBeUndefined();
	});

	it('unterstuetzt verschiedene Plattformen', async () => {
		const teamsMessenger: MessengerConfig = {
			...sampleMessenger,
			id: 2,
			name: 'Teams Kanal',
			platform: 'teams',
			webhookUrl: 'https://outlook.office.com/webhook/XXX',
		};
		const discordMessenger: MessengerConfig = {
			...sampleMessenger,
			id: 3,
			name: 'Discord Server',
			platform: 'discord',
			webhookUrl: 'https://discord.com/api/webhooks/XXX',
		};

		mockedApiClient.get.mockResolvedValueOnce([
			sampleMessenger,
			teamsMessenger,
			discordMessenger,
		]);

		const { result } = renderHook(() => useMessengers(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data).toHaveLength(3);
		expect(result.current.data?.map((m) => m.platform)).toEqual(['slack', 'teams', 'discord']);
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useCreateMessenger Hook (POST)
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft POST admin/messengers beim Erstellen auf', async () => {
		mockedApiClient.get.mockResolvedValue([]);
		mockedApiClient.post.mockResolvedValueOnce(sampleMessenger);

		const { result } = renderHook(() => useCreateMessenger(), { wrapper: createWrapper() });

		result.current.mutate(sampleFormData);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.post).toHaveBeenCalledWith('admin/messengers', sampleFormData);
	});

	it('invalidiert Cache nach erfolgreichem Erstellen', async () => {
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

		mockedApiClient.get.mockResolvedValue([]);
		mockedApiClient.post.mockResolvedValueOnce(sampleMessenger);

		const { result } = renderHook(() => useCreateMessenger(), { wrapper: Wrapper });

		result.current.mutate(sampleFormData);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['messengers'] });
	});

	it('kann Teams-Messenger erstellen', async () => {
		const teamsData: MessengerFormData = {
			name: 'Teams Vertrieb',
			platform: 'teams',
			webhookUrl: 'https://outlook.office.com/webhook/XXX',
			isActive: true,
		};
		mockedApiClient.post.mockResolvedValueOnce({ ...sampleMessenger, ...teamsData, id: 2 });

		const { result } = renderHook(() => useCreateMessenger(), { wrapper: createWrapper() });

		result.current.mutate(teamsData);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.post).toHaveBeenCalledWith('admin/messengers', teamsData);
	});

	it('kann Discord-Messenger erstellen', async () => {
		const discordData: MessengerFormData = {
			name: 'Discord Leads',
			platform: 'discord',
			webhookUrl: 'https://discord.com/api/webhooks/XXX',
			isActive: true,
		};
		mockedApiClient.post.mockResolvedValueOnce({ ...sampleMessenger, ...discordData, id: 3 });

		const { result } = renderHook(() => useCreateMessenger(), { wrapper: createWrapper() });

		result.current.mutate(discordData);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.post).toHaveBeenCalledWith('admin/messengers', discordData);
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useUpdateMessenger Hook (PUT)
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft PUT admin/messengers/{id} beim Update auf', async () => {
		mockedApiClient.get.mockResolvedValue([sampleMessenger]);
		mockedApiClient.put.mockResolvedValueOnce({ ...sampleMessenger, name: 'Umbenannt' });

		const { result } = renderHook(() => useUpdateMessenger(), { wrapper: createWrapper() });

		result.current.mutate({ id: 1, data: { name: 'Umbenannt' } });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/messengers/1', {
			name: 'Umbenannt',
		});
	});

	it('kann Messenger deaktivieren via isActive', async () => {
		mockedApiClient.get.mockResolvedValue([sampleMessenger]);
		mockedApiClient.put.mockResolvedValueOnce({ ...sampleMessenger, isActive: false });

		const { result } = renderHook(() => useUpdateMessenger(), { wrapper: createWrapper() });

		result.current.mutate({ id: 1, data: { isActive: false } });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/messengers/1', { isActive: false });
	});

	it('kann Webhook-URL aktualisieren', async () => {
		const newUrl = 'https://hooks.slack.com/services/NEW/URL';
		mockedApiClient.put.mockResolvedValueOnce({ ...sampleMessenger, webhookUrl: newUrl });

		const { result } = renderHook(() => useUpdateMessenger(), { wrapper: createWrapper() });

		result.current.mutate({ id: 1, data: { webhookUrl: newUrl } });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/messengers/1', {
			webhookUrl: newUrl,
		});
	});

	it('invalidiert Cache nach erfolgreichem Update', async () => {
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

		mockedApiClient.put.mockResolvedValueOnce(sampleMessenger);

		const { result } = renderHook(() => useUpdateMessenger(), { wrapper: Wrapper });

		result.current.mutate({ id: 1, data: { name: 'Test' } });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['messengers'] });
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useDeleteMessenger Hook (DELETE)
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft DELETE admin/messengers/{id} auf', async () => {
		mockedApiClient.get.mockResolvedValue([sampleMessenger]);
		mockedApiClient.del.mockResolvedValueOnce({ deleted: true });

		const { result } = renderHook(() => useDeleteMessenger(), { wrapper: createWrapper() });

		result.current.mutate(1);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.del).toHaveBeenCalledWith('admin/messengers/1');
	});

	it('gibt deleted: true bei erfolgreichem Loeschen zurueck', async () => {
		mockedApiClient.del.mockResolvedValueOnce({ deleted: true });

		const { result } = renderHook(() => useDeleteMessenger(), { wrapper: createWrapper() });

		result.current.mutate(1);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data?.deleted).toBe(true);
	});

	it('invalidiert Cache nach erfolgreichem Loeschen', async () => {
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

		const { result } = renderHook(() => useDeleteMessenger(), { wrapper: Wrapper });

		result.current.mutate(1);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['messengers'] });
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useTestMessenger Hook (POST test)
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft POST admin/messengers/{id}/test auf', async () => {
		const testResult: MessengerTestResult = { success: true, statusCode: 200 };
		mockedApiClient.post.mockResolvedValueOnce(testResult);

		const { result } = renderHook(() => useTestMessenger(), { wrapper: createWrapper() });

		result.current.mutate(1);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.post).toHaveBeenCalledWith('admin/messengers/1/test', {});
	});

	it('gibt Erfolgsresultat bei erfolgreichem Test zurueck', async () => {
		const testResult: MessengerTestResult = { success: true, statusCode: 200 };
		mockedApiClient.post.mockResolvedValueOnce(testResult);

		const { result } = renderHook(() => useTestMessenger(), { wrapper: createWrapper() });

		result.current.mutate(1);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data?.success).toBe(true);
		expect(result.current.data?.statusCode).toBe(200);
	});

	it('gibt Fehlerresultat bei fehlgeschlagenem Test zurueck', async () => {
		const testResult: MessengerTestResult = {
			success: false,
			statusCode: 403,
			error: 'Invalid webhook URL',
		};
		mockedApiClient.post.mockResolvedValueOnce(testResult);

		const { result } = renderHook(() => useTestMessenger(), { wrapper: createWrapper() });

		result.current.mutate(1);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data?.success).toBe(false);
		expect(result.current.data?.statusCode).toBe(403);
		expect(result.current.data?.error).toBe('Invalid webhook URL');
	});

	it('behandelt Netzwerkfehler beim Test', async () => {
		mockedApiClient.post.mockRejectedValueOnce(new Error('Network Error'));

		const { result } = renderHook(() => useTestMessenger(), { wrapper: createWrapper() });

		result.current.mutate(1);

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(result.current.error).toBeDefined();
	});
});
