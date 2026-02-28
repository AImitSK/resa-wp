/**
 * React Query hooks for agent (broker) data operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

export interface AgentData {
	id: number | null;
	name: string;
	company: string;
	email: string;
	phone: string;
	address: string;
	website: string;
	imprintUrl: string;
	photoUrl: string | null;
}

interface SaveAgentData {
	name: string;
	email: string;
	phone?: string;
	company?: string;
	address?: string;
	website?: string;
	imprint_url?: string;
	photo_url?: string | null;
}

const QUERY_KEY = ['agent'];

/**
 * Fetch the primary agent's data.
 */
export function useAgentData() {
	return useQuery<AgentData>({
		queryKey: QUERY_KEY,
		queryFn: () => apiClient.get<AgentData>('admin/agent'),
	});
}

/**
 * Save (create or update) the primary agent's data.
 */
export function useSaveAgentData() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: SaveAgentData) => apiClient.put<AgentData>('admin/agent', data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}
