/**
 * React Query hooks for lead CRUD operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

// ─── Types ──────────────────────────────────────────────

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'completed' | 'lost';

export interface LeadAdmin {
	id: number;
	sessionId: string;
	firstName: string;
	lastName: string | null;
	email: string;
	phone: string | null;
	assetType: string;
	locationId: number | null;
	locationName: string | null;
	status: LeadStatus;
	createdAt: string;
	result: Record<string, unknown> | null;
}

export interface LeadDetail extends LeadAdmin {
	company: string | null;
	salutation: string | null;
	message: string | null;
	inputs: Record<string, unknown>;
	meta: Record<string, unknown>;
	notes: string | null;
	agentId: number | null;
	consentGiven: boolean;
	consentText: string | null;
	consentDate: string | null;
	updatedAt: string;
	completedAt: string | null;
	propstack?: {
		synced: boolean;
		propstackId: number | null;
		error: string | null;
		syncedAt: string | null;
	};
}

export interface LeadsFilter {
	status?: LeadStatus;
	assetType?: string;
	locationId?: number;
	search?: string;
	dateFrom?: string;
	dateTo?: string;
	page?: number;
	perPage?: number;
	orderby?: string;
	order?: 'ASC' | 'DESC';
}

export interface LeadsResponse {
	items: LeadAdmin[];
	total: number;
	page: number;
	perPage: number;
	totalPages: number;
}

export interface LeadStats {
	all: number;
	new: number;
	contacted: number;
	qualified: number;
	completed: number;
	lost: number;
}

interface UpdateLeadData {
	status?: LeadStatus;
	notes?: string | null;
	agentId?: number | null;
}

// ─── Query Keys ─────────────────────────────────────────

const QUERY_KEY = ['leads'];
const STATS_KEY = ['leads', 'stats'];

// ─── Hooks ──────────────────────────────────────────────

/**
 * Fetch leads with pagination and filters.
 */
export function useLeads(filters: LeadsFilter = {}) {
	const params = new URLSearchParams();

	if (filters.status) params.set('status', filters.status);
	if (filters.assetType) params.set('assetType', filters.assetType);
	if (filters.locationId) params.set('locationId', String(filters.locationId));
	if (filters.search) params.set('search', filters.search);
	if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
	if (filters.dateTo) params.set('dateTo', filters.dateTo);
	if (filters.page) params.set('page', String(filters.page));
	if (filters.perPage) params.set('perPage', String(filters.perPage));
	if (filters.orderby) params.set('orderby', filters.orderby);
	if (filters.order) params.set('order', filters.order);

	const queryString = params.toString();
	const endpoint = `admin/leads${queryString ? `?${queryString}` : ''}`;

	return useQuery<LeadsResponse>({
		queryKey: [...QUERY_KEY, filters],
		queryFn: () => apiClient.get<LeadsResponse>(endpoint),
	});
}

/**
 * Fetch a single lead by ID with full details.
 */
export function useLead(id: number | null) {
	return useQuery<LeadDetail>({
		queryKey: [...QUERY_KEY, id],
		queryFn: () => apiClient.get<LeadDetail>(`admin/leads/${id}`),
		enabled: id !== null,
	});
}

/**
 * Fetch lead statistics (counts by status).
 */
export function useLeadStats() {
	return useQuery<LeadStats>({
		queryKey: STATS_KEY,
		queryFn: () => apiClient.get<LeadStats>('admin/leads/stats'),
	});
}

/**
 * Update a lead (status, notes, agentId).
 */
export function useUpdateLead() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: number; data: UpdateLeadData }) =>
			apiClient.put<LeadDetail>(`admin/leads/${id}`, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: STATS_KEY });
		},
	});
}

/**
 * Delete a lead.
 */
export function useDeleteLead() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: number) => apiClient.del<{ deleted: boolean }>(`admin/leads/${id}`),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: STATS_KEY });
		},
	});
}

/**
 * Export leads as CSV. Returns a function that triggers the export.
 */
export function useExportLeads() {
	return useMutation({
		mutationFn: async (filters: LeadsFilter = {}) => {
			const params = new URLSearchParams();

			if (filters.status) params.set('status', filters.status);
			if (filters.assetType) params.set('assetType', filters.assetType);
			if (filters.locationId) params.set('locationId', String(filters.locationId));
			if (filters.search) params.set('search', filters.search);
			if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
			if (filters.dateTo) params.set('dateTo', filters.dateTo);

			const queryString = params.toString();
			const endpoint = `admin/leads/export${queryString ? `?${queryString}` : ''}`;

			const result = await apiClient.get<{ csv: string; filename: string; total: number }>(
				endpoint,
			);

			// Trigger download.
			const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = result.filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			return result;
		},
	});
}
