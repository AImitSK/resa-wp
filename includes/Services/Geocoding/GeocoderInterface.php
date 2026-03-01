<?php

declare( strict_types=1 );

namespace Resa\Services\Geocoding;

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
	 * @param string $query Address search query (e.g. "Bad Oeynhausen, Deutschland").
	 * @return GeocodingResult[] Array of matching results.
	 *
	 * @throws \RuntimeException When the geocoding request fails.
	 */
	public function search( string $query ): array;

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
