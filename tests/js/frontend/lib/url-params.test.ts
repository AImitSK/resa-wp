import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { captureUrlParams, getCapturedParams } from '@frontend/lib/url-params';

const STORAGE_KEY = 'resa_url_params';

beforeEach(() => {
	sessionStorage.clear();
});

afterEach(() => {
	sessionStorage.clear();
});

/**
 * Helper: URL simulieren über location mock.
 */
function mockUrl(url: string) {
	Object.defineProperty(window, 'location', {
		value: new URL(url),
		writable: true,
		configurable: true,
	});
}

describe('captureUrlParams', () => {
	it('captured gclid aus der URL', () => {
		mockUrl('https://example.com/?gclid=abc123');
		captureUrlParams();

		const params = getCapturedParams();
		expect(params.gclid).toBe('abc123');
	});

	it('captured fbclid aus der URL', () => {
		mockUrl('https://example.com/?fbclid=fb_xyz');
		captureUrlParams();

		const params = getCapturedParams();
		expect(params.fbclid).toBe('fb_xyz');
	});

	it('captured msclkid aus der URL', () => {
		mockUrl('https://example.com/?msclkid=ms_abc');
		captureUrlParams();

		const params = getCapturedParams();
		expect(params.msclkid).toBe('ms_abc');
	});

	it('captured alle UTM-Parameter', () => {
		mockUrl(
			'https://example.com/?utm_source=google&utm_medium=cpc&utm_campaign=test&utm_content=ad1&utm_term=keyword',
		);
		captureUrlParams();

		const params = getCapturedParams();
		expect(params.utm_source).toBe('google');
		expect(params.utm_medium).toBe('cpc');
		expect(params.utm_campaign).toBe('test');
		expect(params.utm_content).toBe('ad1');
		expect(params.utm_term).toBe('keyword');
	});

	it('merged mit bestehenden Werten (first-touch wins)', () => {
		// Erster Aufruf mit gclid.
		mockUrl('https://example.com/?gclid=first');
		captureUrlParams();

		// Zweiter Aufruf mit anderem gclid — sollte NICHT überschrieben werden.
		mockUrl('https://example.com/?gclid=second&utm_source=facebook');
		captureUrlParams();

		const params = getCapturedParams();
		expect(params.gclid).toBe('first');
		expect(params.utm_source).toBe('facebook');
	});

	it('gibt leeres Objekt zurück wenn keine Parameter', () => {
		mockUrl('https://example.com/');
		captureUrlParams();

		const params = getCapturedParams();
		expect(params).toEqual({});
	});
});

describe('getCapturedParams', () => {
	it('gibt leeres Objekt zurück wenn nichts gespeichert', () => {
		const params = getCapturedParams();
		expect(params).toEqual({});
	});

	it('gibt leeres Objekt zurück bei korruptem Storage', () => {
		sessionStorage.setItem(STORAGE_KEY, 'invalid-json');

		const params = getCapturedParams();
		expect(params).toEqual({});
	});
});
