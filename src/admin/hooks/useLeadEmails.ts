/**
 * Hook for fetching email log entries for a specific lead.
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

export interface LeadEmail {
	id: number;
	templateId: string;
	recipient: string;
	subject: string;
	status: 'sent' | 'failed' | 'delivered' | 'opened' | 'clicked' | 'bounced';
	error: string | null;
	sentAt: string;
}

export function useLeadEmails(leadId: number | null) {
	return useQuery<LeadEmail[]>({
		queryKey: ['lead-emails', leadId],
		queryFn: () => apiClient.get<LeadEmail[]>(`admin/leads/${leadId}/emails`),
		enabled: leadId !== null,
	});
}
