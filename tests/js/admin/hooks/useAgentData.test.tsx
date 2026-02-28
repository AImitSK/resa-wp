import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { useAgentData, useSaveAgentData, type AgentData } from '@admin/hooks/useAgentData';

// MSW Server Setup
const mockAgentData: AgentData = {
	id: 1,
	name: 'Max Mustermann',
	company: 'Mustermann Immobilien GmbH',
	email: 'max@mustermann-immo.de',
	phone: '+49 123 456789',
	address: 'Musterstraße 1\n12345 Musterstadt',
	website: 'https://mustermann-immo.de',
	imprintUrl: 'https://mustermann-immo.de/impressum',
	photoUrl: null,
};

const emptyAgentData: AgentData = {
	id: null,
	name: '',
	company: '',
	email: '',
	phone: '',
	address: '',
	website: '',
	imprintUrl: '',
	photoUrl: null,
};

const server = setupServer(
	http.get('*/resa/v1/admin/agent', () => {
		return HttpResponse.json(mockAgentData);
	}),
	http.put('*/resa/v1/admin/agent', async ({ request }) => {
		const body = (await request.json()) as Record<string, unknown>;
		return HttpResponse.json({
			...mockAgentData,
			name: body.name as string,
			email: body.email as string,
		});
	}),
);

beforeEach(() => {
	window.resaAdmin = {
		restUrl: '/wp-json/resa/v1/',
		nonce: 'test-nonce',
		page: 'resa-settings',
		adminUrl: '/wp-admin/admin.php',
		version: '1.0.0',
	};
});

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Wrapper mit QueryClientProvider
function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});

	return function Wrapper({ children }: { children: React.ReactNode }) {
		return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	};
}

describe('useAgentData', () => {
	it('lädt Maklerdaten erfolgreich', async () => {
		const { result } = renderHook(() => useAgentData(), {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual(mockAgentData);
		expect(result.current.data?.name).toBe('Max Mustermann');
		expect(result.current.data?.email).toBe('max@mustermann-immo.de');
	});

	it('gibt leere Struktur zurück wenn kein Agent existiert', async () => {
		server.use(
			http.get('*/resa/v1/admin/agent', () => {
				return HttpResponse.json(emptyAgentData);
			}),
		);

		const { result } = renderHook(() => useAgentData(), {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data?.id).toBeNull();
		expect(result.current.data?.name).toBe('');
	});

	it('setzt isLoading während des Ladens', () => {
		const { result } = renderHook(() => useAgentData(), {
			wrapper: createWrapper(),
		});

		expect(result.current.isLoading).toBe(true);
	});

	it('setzt isError bei Netzwerkfehler', async () => {
		server.use(
			http.get('*/resa/v1/admin/agent', () => {
				return HttpResponse.error();
			}),
		);

		const { result } = renderHook(() => useAgentData(), {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});
	});
});

describe('useSaveAgentData', () => {
	it('speichert Maklerdaten erfolgreich', async () => {
		const { result } = renderHook(() => useSaveAgentData(), {
			wrapper: createWrapper(),
		});

		await result.current.mutateAsync({
			name: 'Neuer Name',
			email: 'neu@email.de',
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data?.name).toBe('Neuer Name');
	});

	it('setzt isPending während des Speicherns', async () => {
		// Verzögerte Response für bessere Timing-Kontrolle
		server.use(
			http.put('*/resa/v1/admin/agent', async () => {
				await new Promise((resolve) => setTimeout(resolve, 50));
				return HttpResponse.json(mockAgentData);
			}),
		);

		const { result } = renderHook(() => useSaveAgentData(), {
			wrapper: createWrapper(),
		});

		// Mutation starten ohne await
		const promise = result.current.mutateAsync({
			name: 'Test',
			email: 'test@test.de',
		});

		// isPending sollte jetzt true sein
		await waitFor(() => {
			expect(result.current.isPending).toBe(true);
		});

		await promise;
	});

	it('gibt Fehler bei ungültigen Daten zurück', async () => {
		server.use(
			http.put('*/resa/v1/admin/agent', () => {
				return HttpResponse.json(
					{
						code: 'resa_validation_error',
						message: 'Name ist erforderlich.',
						data: { status: 400 },
					},
					{ status: 400 },
				);
			}),
		);

		const { result } = renderHook(() => useSaveAgentData(), {
			wrapper: createWrapper(),
		});

		await expect(
			result.current.mutateAsync({
				name: '',
				email: 'test@test.de',
			}),
		).rejects.toThrow();

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});
	});

	it('speichert alle optionalen Felder', async () => {
		let capturedBody: Record<string, unknown> | null = null;

		server.use(
			http.put('*/resa/v1/admin/agent', async ({ request }) => {
				capturedBody = (await request.json()) as Record<string, unknown>;
				return HttpResponse.json(mockAgentData);
			}),
		);

		const { result } = renderHook(() => useSaveAgentData(), {
			wrapper: createWrapper(),
		});

		await result.current.mutateAsync({
			name: 'Hans Makler',
			email: 'hans@makler.de',
			phone: '+49 999 888777',
			company: 'Makler GmbH',
			address: 'Maklerstraße 5\n54321 Maklerstadt',
			website: 'https://makler.de',
			imprint_url: 'https://makler.de/impressum',
		});

		expect(capturedBody).toMatchObject({
			name: 'Hans Makler',
			email: 'hans@makler.de',
			phone: '+49 999 888777',
			company: 'Makler GmbH',
		});
	});
});
