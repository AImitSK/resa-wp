/**
 * useAddressSearch — Hook for frontend address autocomplete.
 *
 * Queries the public geocoding API with debouncing and optional
 * city-bounded search using Nominatim viewbox.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { GeocodingResult, AddressBounds } from '../types/address';

/**
 * Options for the address search hook.
 */
export interface UseAddressSearchOptions {
	/** Minimum query length to trigger search (default: 3) */
	minLength?: number;
	/** Debounce delay in ms (default: 300) */
	debounce?: number;
	/** Bound search to a specific region */
	boundTo?: AddressBounds;
	/** Search radius in km when using boundTo (default: 30) */
	radius?: number;
}

/**
 * Return type for the address search hook.
 */
export interface UseAddressSearchResult {
	/** Search results */
	results: GeocodingResult[];
	/** Loading state */
	isLoading: boolean;
	/** Error message if any */
	error: string | null;
	/** Clear results manually */
	clearResults: () => void;
}

/**
 * Calculate a bounding box around a center point with given radius.
 *
 * @param lat    Center latitude.
 * @param lng    Center longitude.
 * @param radius Radius in kilometers.
 * @returns Viewbox string "minLng,minLat,maxLng,maxLat".
 */
function calculateViewbox(lat: number, lng: number, radius: number): string {
	// Approximate degrees per km at given latitude.
	const latPerKm = 1 / 111;
	const lngPerKm = 1 / (111 * Math.cos((lat * Math.PI) / 180));

	const latDelta = radius * latPerKm;
	const lngDelta = radius * lngPerKm;

	const minLng = lng - lngDelta;
	const minLat = lat - latDelta;
	const maxLng = lng + lngDelta;
	const maxLat = lat + latDelta;

	// Nominatim format: minLng,minLat,maxLng,maxLat
	return `${minLng.toFixed(6)},${minLat.toFixed(6)},${maxLng.toFixed(6)},${maxLat.toFixed(6)}`;
}

/**
 * Hook for address search with debouncing and optional city bounds.
 *
 * @param query   Search query string.
 * @param options Search options.
 * @returns Search results, loading state, and error.
 */
export function useAddressSearch(
	query: string,
	options: UseAddressSearchOptions = {},
): UseAddressSearchResult {
	const { minLength = 3, debounce = 300, boundTo, radius = 30 } = options;

	const [results, setResults] = useState<GeocodingResult[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const abortControllerRef = useRef<AbortController | null>(null);
	const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const clearResults = useCallback(() => {
		setResults([]);
		setError(null);
	}, []);

	useEffect(() => {
		// Clear previous timer.
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}

		// Clear previous request.
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}

		// Reset if query too short.
		if (query.trim().length < minLength) {
			setResults([]);
			setIsLoading(false);
			setError(null);
			return;
		}

		setIsLoading(true);
		setError(null);

		// Debounce the search.
		debounceTimerRef.current = setTimeout(async () => {
			const controller = new AbortController();
			abortControllerRef.current = controller;

			try {
				// Build URL.
				const restUrl = window.resaFrontend?.restUrl || '/wp-json/resa/v1/';
				const url = new URL(`${restUrl}geocoding/search`);
				url.searchParams.set('query', query.trim());

				// Add viewbox if bounded.
				if (boundTo?.lat !== undefined && boundTo?.lng !== undefined) {
					const viewbox = calculateViewbox(boundTo.lat, boundTo.lng, radius);
					url.searchParams.set('viewbox', viewbox);
					url.searchParams.set('bounded', '1');
				} else if (boundTo?.boundingBox) {
					const [minLat, maxLat, minLng, maxLng] = boundTo.boundingBox;
					url.searchParams.set('viewbox', `${minLng},${minLat},${maxLng},${maxLat}`);
					url.searchParams.set('bounded', '1');
				}

				const response = await fetch(url.toString(), {
					signal: controller.signal,
					headers: {
						Accept: 'application/json',
					},
				});

				if (!response.ok) {
					throw new Error(`HTTP ${response.status}`);
				}

				const data = await response.json();

				// Handle both wrapped ({success, data: {results}}) and direct ({results}) formats.
				const results = data.data?.results ?? data.results ?? [];
				setResults(results);
			} catch (err) {
				if (err instanceof Error && err.name === 'AbortError') {
					// Request was cancelled, ignore.
					return;
				}

				setError(err instanceof Error ? err.message : 'Suche fehlgeschlagen');
				setResults([]);
			} finally {
				setIsLoading(false);
			}
		}, debounce);

		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, [query, minLength, debounce, boundTo, radius]);

	return { results, isLoading, error, clearResults };
}
