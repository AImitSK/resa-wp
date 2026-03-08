/**
 * Unit tests for useEmailTemplates hooks.
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
	useEmailTemplates,
	useEmailTemplate,
	useSaveEmailTemplate,
	useResetEmailTemplate,
	useSendTestEmail,
	usePreviewEmail,
	type EmailTemplate,
} from '@/admin/hooks/useEmailTemplates';
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

const sampleTemplate: EmailTemplate = {
	id: 'lead_notification',
	name: 'Lead-Benachrichtigung',
	description: 'E-Mail an Makler bei neuem Lead',
	subject: 'Neuer Lead: {{lead_name}}',
	body: '<p>Hallo {{agent_name}},</p><p>Sie haben einen neuen Lead erhalten.</p>',
	is_active: true,
	has_attachment: false,
	available_variables: ['lead_name', 'agent_name', 'lead_email'],
	is_modified: false,
	variable_labels: {
		lead_name: 'Name des Leads',
		agent_name: 'Name des Maklers',
		lead_email: 'E-Mail des Leads',
	},
	variable_groups: {
		lead: ['lead_name', 'lead_email'],
		agent: ['agent_name'],
	},
	example_values: {
		lead_name: 'Max Mustermann',
		agent_name: 'Anna Beispiel',
		lead_email: 'max@example.com',
	},
};

describe('useEmailTemplates', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useEmailTemplates Hook (GET alle)
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft GET admin/email-templates beim Mount auf', async () => {
		mockedApiClient.get.mockResolvedValueOnce([sampleTemplate]);

		const { result } = renderHook(() => useEmailTemplates(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.get).toHaveBeenCalledWith('admin/email-templates');
		expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
	});

	it('gibt Template-Array zurueck', async () => {
		mockedApiClient.get.mockResolvedValueOnce([sampleTemplate]);

		const { result } = renderHook(() => useEmailTemplates(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data).toHaveLength(1);
		expect(result.current.data?.[0].id).toBe('lead_notification');
		expect(result.current.data?.[0].name).toBe('Lead-Benachrichtigung');
	});

	it('gibt leeres Array zurueck wenn keine Templates', async () => {
		mockedApiClient.get.mockResolvedValueOnce([]);

		const { result } = renderHook(() => useEmailTemplates(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data).toEqual([]);
	});

	it('behandelt API-Fehler korrekt', async () => {
		mockedApiClient.get.mockRejectedValueOnce(new Error('Network Error'));

		const { result } = renderHook(() => useEmailTemplates(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(result.current.error).toBeDefined();
	});

	it('setzt isLoading waehrend des Ladens', () => {
		mockedApiClient.get.mockReturnValue(new Promise(() => {}));

		const { result } = renderHook(() => useEmailTemplates(), { wrapper: createWrapper() });

		expect(result.current.isLoading).toBe(true);
		expect(result.current.data).toBeUndefined();
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useEmailTemplate Hook (GET einzelnes Template)
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft GET admin/email-templates/{id} fuer einzelnes Template auf', async () => {
		mockedApiClient.get.mockResolvedValueOnce(sampleTemplate);

		const { result } = renderHook(() => useEmailTemplate('lead_notification'), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.get).toHaveBeenCalledWith('admin/email-templates/lead_notification');
		expect(result.current.data?.id).toBe('lead_notification');
	});

	it('fuehrt keine Abfrage aus wenn id null ist', () => {
		const { result } = renderHook(() => useEmailTemplate(null), {
			wrapper: createWrapper(),
		});

		expect(result.current.fetchStatus).toBe('idle');
		expect(mockedApiClient.get).not.toHaveBeenCalled();
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useSaveEmailTemplate Hook (PUT)
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft PUT admin/email-templates/{id} beim Speichern auf', async () => {
		mockedApiClient.get.mockResolvedValue([sampleTemplate]);
		mockedApiClient.put.mockResolvedValueOnce({ ...sampleTemplate, subject: 'Neuer Betreff' });

		const { result } = renderHook(() => useSaveEmailTemplate('lead_notification'), {
			wrapper: createWrapper(),
		});

		result.current.mutate({ subject: 'Neuer Betreff' });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith(
			'admin/email-templates/lead_notification',
			{
				subject: 'Neuer Betreff',
			},
		);
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

		mockedApiClient.get.mockResolvedValue([sampleTemplate]);
		mockedApiClient.put.mockResolvedValueOnce(sampleTemplate);

		const { result } = renderHook(() => useSaveEmailTemplate('lead_notification'), {
			wrapper: Wrapper,
		});

		result.current.mutate({ is_active: false });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['email-templates'] });
	});

	it('kann Body und Subject zusammen aktualisieren', async () => {
		mockedApiClient.put.mockResolvedValueOnce(sampleTemplate);

		const { result } = renderHook(() => useSaveEmailTemplate('lead_notification'), {
			wrapper: createWrapper(),
		});

		result.current.mutate({
			subject: 'Neuer Betreff',
			body: '<p>Neuer Body</p>',
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith(
			'admin/email-templates/lead_notification',
			{
				subject: 'Neuer Betreff',
				body: '<p>Neuer Body</p>',
			},
		);
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useResetEmailTemplate Hook (POST reset)
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft POST admin/email-templates/{id}/reset beim Zuruecksetzen auf', async () => {
		mockedApiClient.post.mockResolvedValueOnce({ ...sampleTemplate, is_modified: false });

		const { result } = renderHook(() => useResetEmailTemplate('lead_notification'), {
			wrapper: createWrapper(),
		});

		result.current.mutate();

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.post).toHaveBeenCalledWith(
			'admin/email-templates/lead_notification/reset',
			{},
		);
	});

	it('invalidiert Cache nach erfolgreichem Reset', async () => {
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

		mockedApiClient.post.mockResolvedValueOnce(sampleTemplate);

		const { result } = renderHook(() => useResetEmailTemplate('lead_notification'), {
			wrapper: Wrapper,
		});

		result.current.mutate();

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['email-templates'] });
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useSendTestEmail Hook (POST test)
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft POST admin/email-templates/{id}/test beim Senden auf', async () => {
		mockedApiClient.post.mockResolvedValueOnce({ message: 'Test-E-Mail erfolgreich gesendet' });

		const { result } = renderHook(() => useSendTestEmail('lead_notification'), {
			wrapper: createWrapper(),
		});

		result.current.mutate('test@example.com');

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.post).toHaveBeenCalledWith(
			'admin/email-templates/lead_notification/test',
			{ recipient: 'test@example.com' },
		);
	});

	it('gibt Erfolgsmeldung bei Testversand zurueck', async () => {
		mockedApiClient.post.mockResolvedValueOnce({ message: 'Test-E-Mail erfolgreich gesendet' });

		const { result } = renderHook(() => useSendTestEmail('lead_notification'), {
			wrapper: createWrapper(),
		});

		result.current.mutate('test@example.com');

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data?.message).toBe('Test-E-Mail erfolgreich gesendet');
	});

	it('behandelt Fehler beim Testversand', async () => {
		mockedApiClient.post.mockRejectedValueOnce(new Error('SMTP Error'));

		const { result } = renderHook(() => useSendTestEmail('lead_notification'), {
			wrapper: createWrapper(),
		});

		result.current.mutate('test@example.com');

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(result.current.error).toBeDefined();
	});

	// ──────────────────────────────────────────────────────────────────────────
	// usePreviewEmail Hook (POST preview)
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft POST admin/email-templates/{id}/preview fuer Vorschau auf', async () => {
		mockedApiClient.post.mockResolvedValueOnce({
			subject: 'Neuer Lead: Max Mustermann',
			html: '<p>Hallo Anna Beispiel,</p><p>Sie haben einen neuen Lead erhalten.</p>',
		});

		const { result } = renderHook(() => usePreviewEmail('lead_notification'), {
			wrapper: createWrapper(),
		});

		result.current.mutate({ subject: 'Test', body: '<p>Test</p>' });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.post).toHaveBeenCalledWith(
			'admin/email-templates/lead_notification/preview',
			{ subject: 'Test', body: '<p>Test</p>' },
		);
	});

	it('gibt gerenderten HTML-Vorschau zurueck', async () => {
		const previewResponse = {
			subject: 'Neuer Lead: Max Mustermann',
			html: '<p>Hallo Anna Beispiel,</p>',
		};
		mockedApiClient.post.mockResolvedValueOnce(previewResponse);

		const { result } = renderHook(() => usePreviewEmail('lead_notification'), {
			wrapper: createWrapper(),
		});

		result.current.mutate({});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data?.subject).toBe('Neuer Lead: Max Mustermann');
		expect(result.current.data?.html).toContain('Anna Beispiel');
	});
});
