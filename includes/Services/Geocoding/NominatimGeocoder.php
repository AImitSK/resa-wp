<?php

declare( strict_types=1 );

namespace Resa\Services\Geocoding;

/**
 * Nominatim geocoder implementation using OpenStreetMap.
 *
 * Features:
 * - Free and open-source
 * - DSGVO-compliant (no user data tracking)
 * - Respects rate limiting (1 request/second)
 * - DACH region focus (de, at, ch country codes)
 *
 * @see https://nominatim.org/release-docs/latest/api/Search/
 */
final class NominatimGeocoder implements GeocoderInterface {

	/**
	 * Nominatim API base URL.
	 */
	private const API_URL = 'https://nominatim.openstreetmap.org/search';

	/**
	 * User-Agent header (required by Nominatim ToS).
	 */
	private const USER_AGENT = 'RESA-WordPress-Plugin/1.0 (https://resa.dev)';

	/**
	 * DACH country codes for filtering results.
	 */
	private const COUNTRY_CODES = 'de,at,ch';

	/**
	 * Maximum results to return.
	 */
	private const LIMIT = 5;

	/**
	 * Request timeout in seconds.
	 */
	private const TIMEOUT = 10;

	/**
	 * Transient key prefix for rate limiting.
	 */
	private const RATE_LIMIT_KEY = 'resa_nominatim_last_request';

	/**
	 * @inheritDoc
	 */
	public function search( string $query ): array {
		$query = trim( $query );

		if ( $query === '' ) {
			return [];
		}

		// Rate limiting: wait if last request was < 1 second ago.
		$this->enforceRateLimit();

		$requestUrl = add_query_arg(
			[
				'q'              => $query,
				'format'         => 'jsonv2',
				'addressdetails' => '1',
				'limit'          => (string) self::LIMIT,
				'countrycodes'   => self::COUNTRY_CODES,
				'accept-language' => 'de',
			],
			self::API_URL
		);

		$response = wp_remote_get(
			$requestUrl,
			[
				'timeout'    => self::TIMEOUT,
				'headers'    => [
					'User-Agent' => self::USER_AGENT,
					'Accept'     => 'application/json',
				],
				'sslverify'  => true,
			]
		);

		// Store timestamp for rate limiting.
		set_transient( self::RATE_LIMIT_KEY, time(), 60 );

		if ( is_wp_error( $response ) ) {
			throw new \RuntimeException(
				sprintf(
					/* translators: %s: error message */
					__( 'Geocoding-Anfrage fehlgeschlagen: %s', 'resa' ),
					$response->get_error_message()
				)
			);
		}

		$statusCode = wp_remote_retrieve_response_code( $response );

		if ( $statusCode !== 200 ) {
			throw new \RuntimeException(
				sprintf(
					/* translators: %d: HTTP status code */
					__( 'Geocoding-Server antwortete mit Status %d', 'resa' ),
					$statusCode
				)
			);
		}

		$body = wp_remote_retrieve_body( $response );
		$data = json_decode( $body, true );

		if ( ! is_array( $data ) ) {
			throw new \RuntimeException(
				__( 'Ungültige Antwort vom Geocoding-Server', 'resa' )
			);
		}

		return $this->parseResults( $data );
	}

	/**
	 * @inheritDoc
	 */
	public function isAvailable(): bool {
		// Nominatim is always available (no API key required).
		return true;
	}

	/**
	 * @inheritDoc
	 */
	public function getName(): string {
		return 'nominatim';
	}

	/**
	 * Parse Nominatim API response into GeocodingResult objects.
	 *
	 * @param array<int,array<string,mixed>> $data Raw API response.
	 * @return GeocodingResult[]
	 */
	private function parseResults( array $data ): array {
		$results = [];

		foreach ( $data as $item ) {
			if ( ! isset( $item['lat'], $item['lon'], $item['display_name'] ) ) {
				continue;
			}

			$address = $item['address'] ?? [];

			$results[] = new GeocodingResult(
				latitude: (float) $item['lat'],
				longitude: (float) $item['lon'],
				displayName: $item['display_name'],
				city: $this->extractCity( $address ),
				state: $address['state'] ?? $address['region'] ?? null,
				country: $address['country'] ?? null,
				countryCode: isset( $address['country_code'] ) ? strtolower( $address['country_code'] ) : null,
				postalCode: $address['postcode'] ?? null
			);
		}

		return $results;
	}

	/**
	 * Extract city name from Nominatim address details.
	 *
	 * Nominatim uses different fields for city depending on the result type.
	 *
	 * @param array<string,string> $address Address details.
	 * @return string|null
	 */
	private function extractCity( array $address ): ?string {
		// Priority order for city extraction.
		$cityFields = [ 'city', 'town', 'village', 'municipality', 'county' ];

		foreach ( $cityFields as $field ) {
			if ( ! empty( $address[ $field ] ) ) {
				return $address[ $field ];
			}
		}

		return null;
	}

	/**
	 * Enforce rate limiting to respect Nominatim's 1 request/second policy.
	 *
	 * If the last request was within the last second, sleep until
	 * at least 1 second has passed.
	 */
	private function enforceRateLimit(): void {
		$lastRequest = get_transient( self::RATE_LIMIT_KEY );

		if ( $lastRequest !== false ) {
			$elapsed = time() - (int) $lastRequest;

			if ( $elapsed < 1 ) {
				// Wait for remaining time (add small buffer).
				usleep( ( 1 - $elapsed ) * 1000000 + 100000 );
			}
		}
	}
}
