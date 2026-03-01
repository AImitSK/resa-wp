<?php

declare( strict_types=1 );

namespace Resa\Services\Geocoding;

/**
 * Options for bounded geocoding search.
 *
 * @phpstan-type SearchOptions array{
 *   viewbox?: string,
 *   bounded?: bool,
 *   limit?: int,
 * }
 */

/**
 * Contract for geocoding service implementations.
 *
 * Two implementations planned:
 *  - NominatimGeocoder (OSM Nominatim — free, DSGVO-compliant, default)
 *  - GoogleGeocoder    (Google Places — requires API key, Premium)
 */
interface GeocoderInterface {

	/**
	 * Search for locations by address query.
	 *
	 * @param string               $query   Address search query (e.g. "Bad Oeynhausen, Deutschland").
	 * @param array<string, mixed> $options Optional search options:
	 *                                       - viewbox: Bounding box as "minLng,minLat,maxLng,maxLat"
	 *                                       - bounded: If true, restrict results to viewbox
	 *                                       - limit: Max number of results (default: 5)
	 * @return GeocodingResult[] Array of matching results.
	 *
	 * @throws \RuntimeException When the geocoding request fails.
	 */
	public function search( string $query, array $options = [] ): array;

	/**
	 * Check whether this geocoder is configured and available.
	 *
	 * @return bool True if the geocoder can perform searches.
	 */
	public function isAvailable(): bool;

	/**
	 * Return a human-readable geocoder name.
	 *
	 * @return string E.g. "nominatim", "google".
	 */
	public function getName(): string;
}
