/**
 * React Query hooks for reCAPTCHA v3 settings.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type { RecaptchaSettings } from '../types';

const QUERY_KEY = ['recaptcha-settings'];

/**
 * Fetch reCAPTCHA settings.
 */
export function useRecaptchaSettings() {
	return useQuery<RecaptchaSettings>({
		queryKey: QUERY_KEY,
		queryFn: () => apiClient.get<RecaptchaSettings>('admin/recaptcha-settings'),
	});
}

/**
 * Save reCAPTCHA settings.
 */
export function useSaveRecaptchaSettings() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: Partial<RecaptchaSettings>) =>
			apiClient.put<RecaptchaSettings>('admin/recaptcha-settings', data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: QUERY_KEY });
		},
	});
}
