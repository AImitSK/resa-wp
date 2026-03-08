/**
 * Unit tests for useLeadEmails hook.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// Mock api-client.
vi.mock('@/admin/lib/api-client', () => ({
	apiClient: {
		get: vi.fn(),
	},
}));

import { useLeadEmails, type LeadEmail } from '@/admin/hooks/useLeadEmails';
import { apiClient } from '@/admin/lib/api-client';

const mockedApiClient = apiClient as {
	get: ReturnType<typeof vi.fn>;
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

const sampleEmails: LeadEmail[] = [
	{
		id: 1,
		templateId: 'lead_notification',
		recipient: 'makler@example.com',
		subject: 'Neuer Lead: Max Mustermann',
		status: 'sent',
		error: null,
		sentAt: '2025-06-15 10:30:00',
	},
	{
		id: 2,
		templateId: 'lead_confirmation',
		recipient: 'max@mustermann.de',
		subject: 'Ihre Anfrage bei Immobilien GmbH',
		status: 'delivered',
		error: null,
		sentAt: '2025-06-15 10:30:05',
	},
	{
		id: 3,
		templateId: 'pdf_attachment',
		recipient: 'max@mustermann.de',
		subject: 'Ihre Immobilienbewertung als PDF',
		status: 'opened',
		error: null,
		sentAt: '2025-06-15 10:31:00',
	},
];

describe('useLeadEmails', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useLeadEmails Hook (GET)
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft GET admin/leads/{id}/emails beim Mount auf', async () => {
		mockedApiClient.get.mockResolvedValueOnce(sampleEmails);

		const { result } = renderHook(() => useLeadEmails(42), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.get).toHaveBeenCalledWith('admin/leads/42/emails');
		expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
	});

	it('gibt E-Mail-Liste zurueck', async () => {
		mockedApiClient.get.mockResolvedValueOnce(sampleEmails);

		const { result } = renderHook(() => useLeadEmails(42), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data).toHaveLength(3);
		expect(result.current.data?.[0].templateId).toBe('lead_notification');
		expect(result.current.data?.[1].status).toBe('delivered');
	});

	it('gibt leere Liste zurueck wenn keine E-Mails', async () => {
		mockedApiClient.get.mockResolvedValueOnce([]);

		const { result } = renderHook(() => useLeadEmails(99), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data).toEqual([]);
	});

	it('fuehrt Query nicht aus wenn leadId null ist', async () => {
		const { result } = renderHook(() => useLeadEmails(null), { wrapper: createWrapper() });

		// Query sollte nicht gestartet werden (enabled: false)
		expect(result.current.fetchStatus).toBe('idle');
		expect(mockedApiClient.get).not.toHaveBeenCalled();
	});

	it('verwendet unterschiedliche Query-Keys pro Lead', async () => {
		mockedApiClient.get.mockResolvedValue(sampleEmails);

		const { result: result1 } = renderHook(() => useLeadEmails(1), {
			wrapper: createWrapper(),
		});
		const { result: result2 } = renderHook(() => useLeadEmails(2), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result1.current.isSuccess).toBe(true));
		await waitFor(() => expect(result2.current.isSuccess).toBe(true));

		expect(mockedApiClient.get).toHaveBeenCalledWith('admin/leads/1/emails');
		expect(mockedApiClient.get).toHaveBeenCalledWith('admin/leads/2/emails');
	});

	it('behandelt verschiedene E-Mail-Status korrekt', async () => {
		const mixedStatusEmails: LeadEmail[] = [
			{
				id: 1,
				templateId: 'test',
				recipient: 'test@example.com',
				subject: 'Test 1',
				status: 'sent',
				error: null,
				sentAt: '2025-06-15 10:00:00',
			},
			{
				id: 2,
				templateId: 'test',
				recipient: 'test@example.com',
				subject: 'Test 2',
				status: 'failed',
				error: 'SMTP connection failed',
				sentAt: '2025-06-15 10:01:00',
			},
			{
				id: 3,
				templateId: 'test',
				recipient: 'test@example.com',
				subject: 'Test 3',
				status: 'bounced',
				error: 'Mailbox not found',
				sentAt: '2025-06-15 10:02:00',
			},
		];
		mockedApiClient.get.mockResolvedValueOnce(mixedStatusEmails);

		const { result } = renderHook(() => useLeadEmails(42), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		const sentEmail = result.current.data?.find((e) => e.status === 'sent');
		const failedEmail = result.current.data?.find((e) => e.status === 'failed');
		const bouncedEmail = result.current.data?.find((e) => e.status === 'bounced');

		expect(sentEmail?.error).toBeNull();
		expect(failedEmail?.error).toBe('SMTP connection failed');
		expect(bouncedEmail?.error).toBe('Mailbox not found');
	});

	it('behandelt API-Fehler korrekt', async () => {
		mockedApiClient.get.mockRejectedValueOnce(new Error('Network Error'));

		const { result } = renderHook(() => useLeadEmails(42), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(result.current.error).toBeDefined();
	});

	it('setzt isLoading waehrend des Ladens', () => {
		mockedApiClient.get.mockReturnValue(new Promise(() => {}));

		const { result } = renderHook(() => useLeadEmails(42), { wrapper: createWrapper() });

		expect(result.current.isLoading).toBe(true);
		expect(result.current.data).toBeUndefined();
	});

	it('behandelt E-Mails mit clicked Status', async () => {
		const clickedEmails: LeadEmail[] = [
			{
				id: 1,
				templateId: 'marketing',
				recipient: 'kunde@example.com',
				subject: 'Ihre Immobilie im Fokus',
				status: 'clicked',
				error: null,
				sentAt: '2025-06-15 10:00:00',
			},
		];
		mockedApiClient.get.mockResolvedValueOnce(clickedEmails);

		const { result } = renderHook(() => useLeadEmails(42), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data?.[0].status).toBe('clicked');
	});

	it('gibt korrekte Lead-ID im API-Pfad an', async () => {
		mockedApiClient.get.mockResolvedValueOnce([]);

		const leadId = 12345;
		const { result } = renderHook(() => useLeadEmails(leadId), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.get).toHaveBeenCalledWith(`admin/leads/${leadId}/emails`);
	});
});
