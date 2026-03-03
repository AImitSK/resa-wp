/**
 * React Query hooks for email template operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

export interface EmailTemplate {
	id: string;
	name: string;
	description: string;
	subject: string;
	body: string;
	is_active: boolean;
	has_attachment: boolean;
	available_variables: string[];
	is_modified: boolean;
	variable_labels: Record<string, string>;
	variable_groups: Record<string, string[]>;
	example_values: Record<string, string>;
}

interface SaveEmailTemplate {
	subject?: string;
	body?: string;
	is_active?: boolean;
}

interface TestEmailResponse {
	message: string;
}

interface PreviewResponse {
	subject: string;
	html: string;
}

const QUERY_KEY = ['email-templates'];

/**
 * Fetch all email templates.
 */
export function useEmailTemplates() {
	return useQuery<EmailTemplate[]>({
		queryKey: QUERY_KEY,
		queryFn: () => apiClient.get<EmailTemplate[]>('admin/email-templates'),
	});
}

/**
 * Fetch a single email template by ID.
 */
export function useEmailTemplate(id: string | null) {
	return useQuery<EmailTemplate>({
		queryKey: [...QUERY_KEY, id],
		queryFn: () => apiClient.get<EmailTemplate>(`admin/email-templates/${id}`),
		enabled: id !== null,
	});
}

/**
 * Save (update) an email template.
 */
export function useSaveEmailTemplate(id: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: SaveEmailTemplate) =>
			apiClient.put<EmailTemplate>(`admin/email-templates/${id}`, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

/**
 * Reset an email template to defaults.
 */
export function useResetEmailTemplate(id: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => apiClient.post<EmailTemplate>(`admin/email-templates/${id}/reset`, {}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

/**
 * Send a test email for a template.
 */
export function useSendTestEmail(id: string) {
	return useMutation({
		mutationFn: (recipient: string) =>
			apiClient.post<TestEmailResponse>(`admin/email-templates/${id}/test`, {
				recipient,
			}),
	});
}

/**
 * Get preview HTML for a template.
 */
export function usePreviewEmail(id: string) {
	return useMutation({
		mutationFn: (data: { subject?: string; body?: string }) =>
			apiClient.post<PreviewResponse>(`admin/email-templates/${id}/preview`, data),
	});
}
