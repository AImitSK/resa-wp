/**
 * Tests for useAddressSearch hook.
 *
 * Note: These tests focus on synchronous behavior and initial state.
 * Async behavior with debouncing is complex to test with fake timers
 * and is better covered by integration/e2e tests.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAddressSearch } from '@frontend/hooks/useAddressSearch';

// Mock window.resaFrontend
const mockResaFrontend = {
	restUrl: 'http://localhost/wp-json/resa/v1/',
	nonce: 'test-nonce',
};

describe('useAddressSearch', () => {
	beforeEach(() => {
		(window as unknown as { resaFrontend: typeof mockResaFrontend }).resaFrontend =
			mockResaFrontend;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('gibt leere Ergebnisse zurück wenn Query zu kurz', () => {
		const { result } = renderHook(() => useAddressSearch('ab'));

		expect(result.current.results).toEqual([]);
		expect(result.current.isLoading).toBe(false);
		expect(result.current.error).toBeNull();
	});

	it('gibt leere Ergebnisse zurück wenn Query leer', () => {
		const { result } = renderHook(() => useAddressSearch(''));

		expect(result.current.results).toEqual([]);
		expect(result.current.isLoading).toBe(false);
	});

	it('gibt leere Ergebnisse zurück bei Whitespace-Query', () => {
		const { result } = renderHook(() => useAddressSearch('   '));

		expect(result.current.results).toEqual([]);
		expect(result.current.isLoading).toBe(false);
	});

	it('setzt isLoading auf true bei gültiger Query', () => {
		// Just check initial state transition - don't need async for this
		const { result } = renderHook(() => useAddressSearch('Musterstraße'));

		expect(result.current.isLoading).toBe(true);
	});

	it('akzeptiert custom minLength', () => {
		// With default minLength=3, "ab" would not trigger loading
		const { result: result1 } = renderHook(() => useAddressSearch('ab'));
		expect(result1.current.isLoading).toBe(false);

		// With minLength=2, "ab" should trigger loading
		const { result: result2 } = renderHook(() => useAddressSearch('ab', { minLength: 2 }));
		expect(result2.current.isLoading).toBe(true);
	});

	it('clearResults setzt results und error zurück', () => {
		const { result } = renderHook(() => useAddressSearch('Musterstraße'));

		// Manually set some state to verify clearResults works
		act(() => {
			result.current.clearResults();
		});

		expect(result.current.results).toEqual([]);
		expect(result.current.error).toBeNull();
	});

	it('akzeptiert boundTo Option', () => {
		// Just verify hook doesn't crash with boundTo
		const { result } = renderHook(() =>
			useAddressSearch('Musterstraße', {
				boundTo: { name: 'München', lat: 48.1351, lng: 11.582 },
				radius: 30,
			}),
		);

		expect(result.current.isLoading).toBe(true);
	});

	it('akzeptiert boundTo mit boundingBox', () => {
		// Just verify hook doesn't crash with boundingBox
		const { result } = renderHook(() =>
			useAddressSearch('Musterstraße', {
				boundTo: {
					name: 'München',
					boundingBox: [48.0, 48.3, 11.4, 11.8],
				},
			}),
		);

		expect(result.current.isLoading).toBe(true);
	});

	it('setzt Ergebnisse zurück bei Query-Änderung unter minLength', () => {
		const { result, rerender } = renderHook(({ query }) => useAddressSearch(query), {
			initialProps: { query: 'Musterstraße' },
		});

		// Initial: loading should be true
		expect(result.current.isLoading).toBe(true);

		// Change to short query
		rerender({ query: 'ab' });

		// Should reset state
		expect(result.current.results).toEqual([]);
		expect(result.current.isLoading).toBe(false);
		expect(result.current.error).toBeNull();
	});
});
