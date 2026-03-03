/**
 * React Query hooks for PDF template settings.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

export interface PdfSettings {
	headerText: string;
	footerText: string;
	showDate: boolean;
	showAgents: boolean;
	logoPosition: 'left' | 'center' | 'right';
	logoSize: number;
	margins: {
		top: number;
		bottom: number;
		left: number;
		right: number;
	};
}

const QUERY_KEY = ['pdf-settings'];

/**
 * Fetch PDF template settings.
 */
export function usePdfSettings() {
	return useQuery<PdfSettings>({
		queryKey: QUERY_KEY,
		queryFn: () => apiClient.get<PdfSettings>('admin/pdf/settings'),
	});
}

/**
 * Save PDF template settings.
 */
export function useSavePdfSettings() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: PdfSettings) => apiClient.put<PdfSettings>('admin/pdf/settings', data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}
