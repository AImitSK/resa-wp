/**
 * Unit tests für useLeads Hooks.
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
	useLeads,
	useLead,
	useLeadStats,
	useUpdateLead,
	useDeleteLead,
	useExportLeads,
	type LeadAdmin,
	type LeadDetail,
	type LeadsResponse,
	type LeadStats,
} from '@/admin/hooks/useLeads';
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

const sampleLead: LeadAdmin = {
	id: 1,
	sessionId: 'sess-abc123',
	firstName: 'Max',
	lastName: 'Mustermann',
	email: 'max@example.de',
	phone: '+49 123 456789',
	assetType: 'rent-calculator',
	locationId: 1,
	locationName: 'Berlin',
	status: 'new',
	createdAt: '2025-06-01 12:00:00',
	result: { monthlyRent: 1200 },
};

const sampleLeadDetail: LeadDetail = {
	...sampleLead,
	company: 'Musterfirma GmbH',
	salutation: 'Herr',
	message: 'Ich interessiere mich für eine Bewertung.',
	inputs: { rooms: 3, size: 80 },
	meta: { source: 'google' },
	notes: 'Interessanter Kontakt',
	agentId: 1,
	consentGiven: true,
	consentText: 'Ich stimme der Datenschutzerklärung zu.',
	consentDate: '2025-06-01 12:00:00',
	updatedAt: '2025-06-01 14:00:00',
	completedAt: null,
};

const sampleLeadsResponse: LeadsResponse = {
	items: [sampleLead],
	total: 1,
	page: 1,
	perPage: 20,
	totalPages: 1,
};

const sampleStats: LeadStats = {
	all: 100,
	new: 25,
	contacted: 30,
	qualified: 20,
	completed: 20,
	lost: 5,
};

describe('useLeads', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useLeads Hook (GET mit Pagination & Filter)
	// ──────────────────────────────────────────────────────────────────────────

	describe('useLeads', () => {
		it('ruft GET admin/leads beim Mount auf', async () => {
			mockedApiClient.get.mockResolvedValueOnce(sampleLeadsResponse);

			const { result } = renderHook(() => useLeads(), { wrapper: createWrapper() });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockedApiClient.get).toHaveBeenCalledWith('admin/leads');
			expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
		});

		it('gibt paginierte Lead-Daten zurück', async () => {
			mockedApiClient.get.mockResolvedValueOnce(sampleLeadsResponse);

			const { result } = renderHook(() => useLeads(), { wrapper: createWrapper() });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data?.items).toHaveLength(1);
			expect(result.current.data?.items[0].firstName).toBe('Max');
			expect(result.current.data?.total).toBe(1);
			expect(result.current.data?.page).toBe(1);
		});

		it('übergibt Filter-Parameter an API', async () => {
			mockedApiClient.get.mockResolvedValueOnce(sampleLeadsResponse);

			const filters = {
				status: 'new' as const,
				assetType: 'rent-calculator',
				locationId: 1,
				search: 'Max',
				page: 2,
				perPage: 10,
				orderby: 'createdAt',
				order: 'DESC' as const,
			};

			const { result } = renderHook(() => useLeads(filters), { wrapper: createWrapper() });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockedApiClient.get).toHaveBeenCalledWith(
				'admin/leads?status=new&assetType=rent-calculator&locationId=1&search=Max&page=2&perPage=10&orderby=createdAt&order=DESC',
			);
		});

		it('übergibt Datumsfilter an API', async () => {
			mockedApiClient.get.mockResolvedValueOnce(sampleLeadsResponse);

			const filters = {
				dateFrom: '2025-01-01',
				dateTo: '2025-06-30',
			};

			const { result } = renderHook(() => useLeads(filters), { wrapper: createWrapper() });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockedApiClient.get).toHaveBeenCalledWith(
				'admin/leads?dateFrom=2025-01-01&dateTo=2025-06-30',
			);
		});

		it('behandelt API-Fehler korrekt', async () => {
			mockedApiClient.get.mockRejectedValueOnce(new Error('Network Error'));

			const { result } = renderHook(() => useLeads(), { wrapper: createWrapper() });

			await waitFor(() => expect(result.current.isError).toBe(true));

			expect(result.current.error).toBeDefined();
		});

		it('setzt isLoading während des Ladens', () => {
			mockedApiClient.get.mockReturnValue(new Promise(() => {}));

			const { result } = renderHook(() => useLeads(), { wrapper: createWrapper() });

			expect(result.current.isLoading).toBe(true);
			expect(result.current.data).toBeUndefined();
		});
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useLead Hook (GET einzelner Lead)
	// ──────────────────────────────────────────────────────────────────────────

	describe('useLead', () => {
		it('ruft GET admin/leads/{id} auf', async () => {
			mockedApiClient.get.mockResolvedValueOnce(sampleLeadDetail);

			const { result } = renderHook(() => useLead(1), { wrapper: createWrapper() });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockedApiClient.get).toHaveBeenCalledWith('admin/leads/1');
		});

		it('gibt vollständige Lead-Details zurück', async () => {
			mockedApiClient.get.mockResolvedValueOnce(sampleLeadDetail);

			const { result } = renderHook(() => useLead(1), { wrapper: createWrapper() });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data?.inputs).toEqual({ rooms: 3, size: 80 });
			expect(result.current.data?.notes).toBe('Interessanter Kontakt');
			expect(result.current.data?.consentGiven).toBe(true);
		});

		it('ist deaktiviert bei id = null', async () => {
			const { result } = renderHook(() => useLead(null), { wrapper: createWrapper() });

			// Query sollte nicht gestartet werden
			expect(result.current.fetchStatus).toBe('idle');
			expect(mockedApiClient.get).not.toHaveBeenCalled();
		});
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useLeadStats Hook (GET Statistiken)
	// ──────────────────────────────────────────────────────────────────────────

	describe('useLeadStats', () => {
		it('ruft GET admin/leads/stats auf', async () => {
			mockedApiClient.get.mockResolvedValueOnce(sampleStats);

			const { result } = renderHook(() => useLeadStats(), { wrapper: createWrapper() });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockedApiClient.get).toHaveBeenCalledWith('admin/leads/stats');
		});

		it('gibt Lead-Statistiken nach Status zurück', async () => {
			mockedApiClient.get.mockResolvedValueOnce(sampleStats);

			const { result } = renderHook(() => useLeadStats(), { wrapper: createWrapper() });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data?.all).toBe(100);
			expect(result.current.data?.new).toBe(25);
			expect(result.current.data?.completed).toBe(20);
		});
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useUpdateLead Hook (PUT)
	// ──────────────────────────────────────────────────────────────────────────

	describe('useUpdateLead', () => {
		it('ruft PUT admin/leads/{id} beim Update auf', async () => {
			mockedApiClient.put.mockResolvedValueOnce({ ...sampleLeadDetail, status: 'contacted' });

			const { result } = renderHook(() => useUpdateLead(), { wrapper: createWrapper() });

			result.current.mutate({ id: 1, data: { status: 'contacted' } });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockedApiClient.put).toHaveBeenCalledWith('admin/leads/1', {
				status: 'contacted',
			});
		});

		it('aktualisiert Notes und Agent', async () => {
			mockedApiClient.put.mockResolvedValueOnce({
				...sampleLeadDetail,
				notes: 'Neue Notiz',
				agentId: 2,
			});

			const { result } = renderHook(() => useUpdateLead(), { wrapper: createWrapper() });

			result.current.mutate({ id: 1, data: { notes: 'Neue Notiz', agentId: 2 } });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockedApiClient.put).toHaveBeenCalledWith('admin/leads/1', {
				notes: 'Neue Notiz',
				agentId: 2,
			});
		});

		it('invalidiert Leads und Stats Cache nach Update', async () => {
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

			mockedApiClient.put.mockResolvedValueOnce({ ...sampleLeadDetail, status: 'contacted' });

			const { result } = renderHook(() => useUpdateLead(), { wrapper: Wrapper });

			result.current.mutate({ id: 1, data: { status: 'contacted' } });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['leads'] });
			expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['leads', 'stats'] });
		});
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useDeleteLead Hook (DELETE)
	// ──────────────────────────────────────────────────────────────────────────

	describe('useDeleteLead', () => {
		it('ruft DELETE admin/leads/{id} auf', async () => {
			mockedApiClient.del.mockResolvedValueOnce({ deleted: true });

			const { result } = renderHook(() => useDeleteLead(), { wrapper: createWrapper() });

			result.current.mutate(1);

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockedApiClient.del).toHaveBeenCalledWith('admin/leads/1');
		});

		it('invalidiert Leads und Stats Cache nach Löschen', async () => {
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

			const { result } = renderHook(() => useDeleteLead(), { wrapper: Wrapper });

			result.current.mutate(1);

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['leads'] });
			expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['leads', 'stats'] });
		});
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useExportLeads Hook (GET Export + Download)
	// ──────────────────────────────────────────────────────────────────────────

	describe('useExportLeads', () => {
		beforeEach(() => {
			// Mock DOM-Methoden für Download
			global.URL.createObjectURL = vi.fn(() => 'blob:test');
			global.URL.revokeObjectURL = vi.fn();
		});

		it('ruft GET admin/leads/export auf', async () => {
			const exportResponse = {
				csv: 'Vorname;Nachname;Email\nMax;Mustermann;max@example.de',
				filename: 'leads-export-2025-06-01.csv',
				total: 1,
			};
			mockedApiClient.get.mockResolvedValueOnce(exportResponse);

			const { result } = renderHook(() => useExportLeads(), { wrapper: createWrapper() });

			result.current.mutate({});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockedApiClient.get).toHaveBeenCalledWith('admin/leads/export');
		});

		it('übergibt Filter an Export-Endpoint', async () => {
			const exportResponse = {
				csv: 'data',
				filename: 'export.csv',
				total: 1,
			};
			mockedApiClient.get.mockResolvedValueOnce(exportResponse);

			const { result } = renderHook(() => useExportLeads(), { wrapper: createWrapper() });

			result.current.mutate({
				status: 'new',
				assetType: 'rent-calculator',
				locationId: 1,
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(mockedApiClient.get).toHaveBeenCalledWith(
				'admin/leads/export?status=new&assetType=rent-calculator&locationId=1',
			);
		});

		it('gibt Export-Ergebnis mit Dateiname und Anzahl zurück', async () => {
			const exportResponse = {
				csv: 'data',
				filename: 'leads-export-2025-06-01.csv',
				total: 50,
			};
			mockedApiClient.get.mockResolvedValueOnce(exportResponse);

			const { result } = renderHook(() => useExportLeads(), { wrapper: createWrapper() });

			result.current.mutate({});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));

			expect(result.current.data?.filename).toBe('leads-export-2025-06-01.csv');
			expect(result.current.data?.total).toBe(50);
		});

		it('behandelt Export-Fehler korrekt', async () => {
			mockedApiClient.get.mockRejectedValueOnce(new Error('Export failed'));

			const { result } = renderHook(() => useExportLeads(), { wrapper: createWrapper() });

			result.current.mutate({});

			await waitFor(() => expect(result.current.isError).toBe(true));

			expect(result.current.error).toBeDefined();
		});
	});
});
