/**
 * Tests for PropstackTab component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropstackTab } from '@/admin/components/integrations/PropstackTab';
import * as propstackHooks from '@/admin/hooks/usePropstack';
import * as locationHooks from '@/admin/hooks/useLocations';
import type { PropsWithChildren } from 'react';

// Mock hooks
vi.mock('@/admin/hooks/usePropstack');
vi.mock('@/admin/hooks/useLocations');

describe('PropstackTab', () => {
	let queryClient: QueryClient;

	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});
		vi.clearAllMocks();

		// Default mock implementations
		vi.mocked(propstackHooks.usePropstackSettings).mockReturnValue({
			data: undefined,
			isLoading: false,
		} as any);

		vi.mocked(propstackHooks.useSavePropstackSettings).mockReturnValue({
			mutate: vi.fn(),
			isPending: false,
			isSuccess: false,
		} as any);

		vi.mocked(propstackHooks.useTestPropstackConnection).mockReturnValue({
			mutateAsync: vi.fn(),
			isPending: false,
		} as any);

		vi.mocked(propstackHooks.usePropstackBrokers).mockReturnValue({
			data: undefined,
			isLoading: false,
		} as any);

		vi.mocked(propstackHooks.usePropstackContactSources).mockReturnValue({
			data: undefined,
			isLoading: false,
		} as any);

		vi.mocked(propstackHooks.usePropstackActivityTypes).mockReturnValue({
			data: undefined,
			isLoading: false,
		} as any);

		vi.mocked(locationHooks.useLocations).mockReturnValue({
			data: [],
		} as any);
	});

	const wrapper = ({ children }: PropsWithChildren) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);

	it('renders connection card', async () => {
		render(<PropstackTab />, { wrapper });

		await waitFor(() => {
			expect(screen.getByText(/Propstack-Integration/i)).toBeInTheDocument();
		});
	});

	it('shows loading spinner when settings are loading', () => {
		vi.mocked(propstackHooks.usePropstackSettings).mockReturnValue({
			data: undefined,
			isLoading: true,
		} as any);

		render(<PropstackTab />, { wrapper });

		expect(screen.getByText(/Lade Propstack-Einstellungen/i)).toBeInTheDocument();
	});

	it('shows only connection card when not connected', async () => {
		vi.mocked(propstackHooks.usePropstackSettings).mockReturnValue({
			data: {
				enabled: false,
				api_key: '',
				city_broker_mapping: {},
				default_broker_id: null,
				contact_source_id: null,
				activity_enabled: false,
				activity_type_id: null,
				activity_create_task: false,
				activity_task_due_days: 3,
				sync_newsletter_only: false,
				newsletter_broker_id: null,
			},
			isLoading: false,
		} as any);

		render(<PropstackTab />, { wrapper });

		await waitFor(() => {
			expect(screen.getByText(/Propstack-Integration/i)).toBeInTheDocument();
		});

		// Should NOT show other cards (Makler-Zuweisung, Aktivitäten, Newsletter)
		expect(screen.queryByText(/Makler-Zuweisung/i)).not.toBeInTheDocument();
	});

	it('save button is disabled when not dirty', async () => {
		vi.mocked(propstackHooks.usePropstackSettings).mockReturnValue({
			data: {
				enabled: false,
				api_key: '',
				city_broker_mapping: {},
				default_broker_id: null,
				contact_source_id: null,
				activity_enabled: false,
				activity_type_id: null,
				activity_create_task: false,
				activity_task_due_days: 3,
				sync_newsletter_only: false,
				newsletter_broker_id: null,
			},
			isLoading: false,
		} as any);

		render(<PropstackTab />, { wrapper });

		await waitFor(() => {
			const saveButton = screen.getByRole('button', { name: /Einstellungen speichern/i });
			expect(saveButton).toBeDisabled();
		});
	});
});
