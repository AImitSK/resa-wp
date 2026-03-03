/**
 * React Query hooks for team member (agent) CRUD operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

export interface TeamMember {
	id: number | null;
	name: string;
	position: string;
	email: string;
	phone: string;
	photoUrl: string | null;
	locationIds: number[];
}

interface SaveTeamMember {
	name: string;
	position?: string;
	email: string;
	phone?: string;
	photoUrl?: string | null;
	locationIds?: number[];
}

const QUERY_KEY = ['team-members'];

/**
 * Fetch all team members.
 */
export function useTeamMembers() {
	return useQuery<TeamMember[]>({
		queryKey: QUERY_KEY,
		queryFn: () => apiClient.get<TeamMember[]>('admin/agents'),
	});
}

/**
 * Create a new team member.
 */
export function useCreateTeamMember() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: SaveTeamMember) => apiClient.post<TeamMember>('admin/agents', data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

/**
 * Update an existing team member.
 */
export function useUpdateTeamMember() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, ...data }: SaveTeamMember & { id: number }) =>
			apiClient.put<TeamMember>(`admin/agents/${id}`, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}

/**
 * Delete a team member.
 */
export function useDeleteTeamMember() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: number) => apiClient.del(`admin/agents/${id}`),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}
