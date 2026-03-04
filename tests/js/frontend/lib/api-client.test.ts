import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock window.resaFrontend before importing the module.
const mockFrontend = {
	restUrl: 'https://example.com/wp-json/resa/v1/',
	nonce: 'test_nonce_abc123',
	ts: 1709500000,
	module: 'rent-calculator',
	version: '1.0.0',
};

beforeEach(() => {
	(window as unknown as Record<string, unknown>).resaFrontend = { ...mockFrontend };
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('api-client', () => {
	it('sendet X-WP-Nonce Header bei postLead', async () => {
		const fetchSpy = vi
			.spyOn(globalThis, 'fetch')
			.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

		const { api } = await import('@frontend/lib/api-client');
		await api.postLead('leads/partial', { sessionId: 'abc' });

		const [, options] = fetchSpy.mock.calls[0];
		const headers = options?.headers as Record<string, string>;
		expect(headers['X-WP-Nonce']).toBe('test_nonce_abc123');
	});

	it('sendet keinen X-WP-Nonce Header bei GET', async () => {
		const fetchSpy = vi
			.spyOn(globalThis, 'fetch')
			.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

		const { api } = await import('@frontend/lib/api-client');
		await api.get('some-endpoint');

		const [, options] = fetchSpy.mock.calls[0];
		const headers = options?.headers as Record<string, string>;
		expect(headers['X-WP-Nonce']).toBeUndefined();
	});

	it('sendet keinen X-WP-Nonce Header bei post', async () => {
		const fetchSpy = vi
			.spyOn(globalThis, 'fetch')
			.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

		const { api } = await import('@frontend/lib/api-client');
		await api.post('tracking', { event: 'page_view' });

		const [, options] = fetchSpy.mock.calls[0];
		const headers = options?.headers as Record<string, string>;
		expect(headers['X-WP-Nonce']).toBeUndefined();
	});

	it('fuegt _hp und _ts in postLead-Body ein', async () => {
		const fetchSpy = vi
			.spyOn(globalThis, 'fetch')
			.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

		const { api } = await import('@frontend/lib/api-client');
		await api.postLead('leads/complete', { sessionId: 'xyz', firstName: 'Max' });

		const [, options] = fetchSpy.mock.calls[0];
		const body = JSON.parse(options?.body as string);
		expect(body._hp).toBe('');
		expect(body._ts).toBe(1709500000);
		expect(body.sessionId).toBe('xyz');
		expect(body.firstName).toBe('Max');
	});

	it('fuegt keine _hp/_ts in normalen post-Body ein', async () => {
		const fetchSpy = vi
			.spyOn(globalThis, 'fetch')
			.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

		const { api } = await import('@frontend/lib/api-client');
		await api.post('tracking', { event: 'page_view' });

		const [, options] = fetchSpy.mock.calls[0];
		const body = JSON.parse(options?.body as string);
		expect(body._hp).toBeUndefined();
		expect(body._ts).toBeUndefined();
	});

	it('Honeypot _hp ist immer leer bei postLead', async () => {
		const fetchSpy = vi
			.spyOn(globalThis, 'fetch')
			.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

		const { api } = await import('@frontend/lib/api-client');
		await api.postLead('leads/partial', { _hp: 'should-be-overwritten' });

		const [, options] = fetchSpy.mock.calls[0];
		const body = JSON.parse(options?.body as string);
		expect(body._hp).toBe('');
	});
});
