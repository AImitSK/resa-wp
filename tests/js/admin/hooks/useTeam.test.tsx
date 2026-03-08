/**
 * Unit tests for useTeam hooks.
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
	useTeamMembers,
	useCreateTeamMember,
	useUpdateTeamMember,
	useDeleteTeamMember,
	type TeamMember,
} from '@/admin/hooks/useTeam';
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

const sampleTeamMember: TeamMember = {
	id: 1,
	name: 'Max Mustermann',
	position: 'Immobilienmakler',
	email: 'max@beispiel.de',
	phone: '+49 170 1234567',
	photoUrl: 'https://example.com/photos/max.jpg',
	locationIds: [1, 2],
};

describe('useTeam', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useTeamMembers Hook (GET)
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft GET admin/agents beim Mount auf', async () => {
		mockedApiClient.get.mockResolvedValueOnce([sampleTeamMember]);

		const { result } = renderHook(() => useTeamMembers(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.get).toHaveBeenCalledWith('admin/agents');
		expect(mockedApiClient.get).toHaveBeenCalledTimes(1);
	});

	it('gibt TeamMember-Array zurueck', async () => {
		mockedApiClient.get.mockResolvedValueOnce([sampleTeamMember]);

		const { result } = renderHook(() => useTeamMembers(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data).toHaveLength(1);
		expect(result.current.data?.[0].name).toBe('Max Mustermann');
		expect(result.current.data?.[0].position).toBe('Immobilienmakler');
		expect(result.current.data?.[0].locationIds).toEqual([1, 2]);
	});

	it('gibt leeres Array zurueck wenn keine Teammitglieder', async () => {
		mockedApiClient.get.mockResolvedValueOnce([]);

		const { result } = renderHook(() => useTeamMembers(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data).toEqual([]);
	});

	it('behandelt API-Fehler korrekt', async () => {
		mockedApiClient.get.mockRejectedValueOnce(new Error('Network Error'));

		const { result } = renderHook(() => useTeamMembers(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(result.current.error).toBeDefined();
	});

	it('setzt isLoading waehrend des Ladens', () => {
		mockedApiClient.get.mockReturnValue(new Promise(() => {}));

		const { result } = renderHook(() => useTeamMembers(), { wrapper: createWrapper() });

		expect(result.current.isLoading).toBe(true);
		expect(result.current.data).toBeUndefined();
	});

	it('behandelt Teammitglied ohne Foto', async () => {
		const memberWithoutPhoto: TeamMember = {
			...sampleTeamMember,
			id: 2,
			name: 'Anna Beispiel',
			photoUrl: null,
		};
		mockedApiClient.get.mockResolvedValueOnce([memberWithoutPhoto]);

		const { result } = renderHook(() => useTeamMembers(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data?.[0].photoUrl).toBeNull();
	});

	it('behandelt Teammitglied ohne Standortzuordnung', async () => {
		const memberWithoutLocations: TeamMember = {
			...sampleTeamMember,
			id: 3,
			locationIds: [],
		};
		mockedApiClient.get.mockResolvedValueOnce([memberWithoutLocations]);

		const { result } = renderHook(() => useTeamMembers(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data?.[0].locationIds).toEqual([]);
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useCreateTeamMember Hook (POST)
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft POST admin/agents beim Erstellen auf', async () => {
		mockedApiClient.get.mockResolvedValue([]);
		mockedApiClient.post.mockResolvedValueOnce(sampleTeamMember);

		const { result } = renderHook(() => useCreateTeamMember(), { wrapper: createWrapper() });

		const newMember = {
			name: 'Max Mustermann',
			email: 'max@beispiel.de',
			position: 'Immobilienmakler',
			phone: '+49 170 1234567',
			photoUrl: 'https://example.com/photos/max.jpg',
			locationIds: [1, 2],
		};

		result.current.mutate(newMember);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.post).toHaveBeenCalledWith('admin/agents', newMember);
	});

	it('invalidiert Cache nach erfolgreichem Erstellen', async () => {
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

		mockedApiClient.get.mockResolvedValue([]);
		mockedApiClient.post.mockResolvedValueOnce(sampleTeamMember);

		const { result } = renderHook(() => useCreateTeamMember(), { wrapper: Wrapper });

		result.current.mutate({ name: 'Test', email: 'test@example.com' });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['team-members'] });
	});

	it('kann Teammitglied mit minimalen Daten erstellen', async () => {
		const minimalMember = {
			name: 'Minimal Test',
			email: 'minimal@test.de',
		};
		mockedApiClient.post.mockResolvedValueOnce({
			...sampleTeamMember,
			...minimalMember,
			id: 4,
			position: '',
			phone: '',
			photoUrl: null,
			locationIds: [],
		});

		const { result } = renderHook(() => useCreateTeamMember(), { wrapper: createWrapper() });

		result.current.mutate(minimalMember);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.post).toHaveBeenCalledWith('admin/agents', minimalMember);
	});

	it('behandelt Fehler beim Erstellen', async () => {
		mockedApiClient.post.mockRejectedValueOnce(new Error('E-Mail bereits vergeben'));

		const { result } = renderHook(() => useCreateTeamMember(), { wrapper: createWrapper() });

		result.current.mutate({ name: 'Test', email: 'duplicate@test.de' });

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(result.current.error).toBeDefined();
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useUpdateTeamMember Hook (PUT)
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft PUT admin/agents/{id} beim Update auf', async () => {
		mockedApiClient.get.mockResolvedValue([sampleTeamMember]);
		mockedApiClient.put.mockResolvedValueOnce({ ...sampleTeamMember, name: 'Neuer Name' });

		const { result } = renderHook(() => useUpdateTeamMember(), { wrapper: createWrapper() });

		result.current.mutate({ id: 1, name: 'Neuer Name', email: 'max@beispiel.de' });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/agents/1', {
			name: 'Neuer Name',
			email: 'max@beispiel.de',
		});
	});

	it('kann Position aktualisieren', async () => {
		mockedApiClient.put.mockResolvedValueOnce({
			...sampleTeamMember,
			position: 'Senior Makler',
		});

		const { result } = renderHook(() => useUpdateTeamMember(), { wrapper: createWrapper() });

		result.current.mutate({
			id: 1,
			name: 'Max Mustermann',
			email: 'max@beispiel.de',
			position: 'Senior Makler',
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/agents/1', {
			name: 'Max Mustermann',
			email: 'max@beispiel.de',
			position: 'Senior Makler',
		});
	});

	it('kann Standortzuordnungen aktualisieren', async () => {
		mockedApiClient.put.mockResolvedValueOnce({
			...sampleTeamMember,
			locationIds: [3, 4, 5],
		});

		const { result } = renderHook(() => useUpdateTeamMember(), { wrapper: createWrapper() });

		result.current.mutate({
			id: 1,
			name: 'Max Mustermann',
			email: 'max@beispiel.de',
			locationIds: [3, 4, 5],
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/agents/1', {
			name: 'Max Mustermann',
			email: 'max@beispiel.de',
			locationIds: [3, 4, 5],
		});
	});

	it('kann Foto-URL aktualisieren oder entfernen', async () => {
		mockedApiClient.put.mockResolvedValueOnce({
			...sampleTeamMember,
			photoUrl: null,
		});

		const { result } = renderHook(() => useUpdateTeamMember(), { wrapper: createWrapper() });

		result.current.mutate({
			id: 1,
			name: 'Max Mustermann',
			email: 'max@beispiel.de',
			photoUrl: null,
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.put).toHaveBeenCalledWith('admin/agents/1', {
			name: 'Max Mustermann',
			email: 'max@beispiel.de',
			photoUrl: null,
		});
	});

	it('invalidiert Cache nach erfolgreichem Update', async () => {
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

		mockedApiClient.put.mockResolvedValueOnce(sampleTeamMember);

		const { result } = renderHook(() => useUpdateTeamMember(), { wrapper: Wrapper });

		result.current.mutate({ id: 1, name: 'Test', email: 'test@example.com' });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['team-members'] });
	});

	it('behandelt Fehler beim Update', async () => {
		mockedApiClient.put.mockRejectedValueOnce(new Error('Teammitglied nicht gefunden'));

		const { result } = renderHook(() => useUpdateTeamMember(), { wrapper: createWrapper() });

		result.current.mutate({ id: 999, name: 'Test', email: 'test@example.com' });

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(result.current.error).toBeDefined();
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useDeleteTeamMember Hook (DELETE)
	// ──────────────────────────────────────────────────────────────────────────

	it('ruft DELETE admin/agents/{id} auf', async () => {
		mockedApiClient.get.mockResolvedValue([sampleTeamMember]);
		mockedApiClient.del.mockResolvedValueOnce(undefined);

		const { result } = renderHook(() => useDeleteTeamMember(), { wrapper: createWrapper() });

		result.current.mutate(1);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.del).toHaveBeenCalledWith('admin/agents/1');
	});

	it('invalidiert Cache nach erfolgreichem Loeschen', async () => {
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

		mockedApiClient.del.mockResolvedValueOnce(undefined);

		const { result } = renderHook(() => useDeleteTeamMember(), { wrapper: Wrapper });

		result.current.mutate(1);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['team-members'] });
	});

	it('behandelt Fehler beim Loeschen', async () => {
		mockedApiClient.del.mockRejectedValueOnce(new Error('Teammitglied nicht gefunden'));

		const { result } = renderHook(() => useDeleteTeamMember(), { wrapper: createWrapper() });

		result.current.mutate(999);

		await waitFor(() => expect(result.current.isError).toBe(true));

		expect(result.current.error).toBeDefined();
	});

	it('kann mehrere Teammitglieder nacheinander loeschen', async () => {
		mockedApiClient.del.mockResolvedValue(undefined);

		const { result } = renderHook(() => useDeleteTeamMember(), { wrapper: createWrapper() });

		result.current.mutate(1);
		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		result.current.mutate(2);
		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedApiClient.del).toHaveBeenCalledWith('admin/agents/1');
		expect(mockedApiClient.del).toHaveBeenCalledWith('admin/agents/2');
		expect(mockedApiClient.del).toHaveBeenCalledTimes(2);
	});
});
