<?php

declare( strict_types=1 );

namespace Resa\Api;

use Resa\Services\Geocoding\GeocoderInterface;
use Resa\Services\Geocoding\NominatimGeocoder;

/**
 * REST controller for geocoding/address search.
 *
 * Provides address autocomplete functionality for the Location Editor.
 * Uses Nominatim (OSM) as the default geocoder.
 */
class GeocodingController extends RestController {

	/**
	 * Geocoder service instance.
	 */
	private GeocoderInterface $geocoder;

	/**
	 * Initialize with default geocoder.
	 */
	public function __construct() {
		// TODO: Add GoogleGeocoder support via option check in future.
		$this->geocoder = new NominatimGeocoder();
	}

	/**
	 * Search arguments shared by both endpoints.
	 *
	 * @return array<string, array<string, mixed>>
	 */
	private function getSearchArgs(): array {
		return [
			'query'   => [
				'type'              => 'string',
				'required'          => true,
				'sanitize_callback' => 'sanitize_text_field',
				'validate_callback' => static function ( $value ): bool {
					return is_string( $value ) && strlen( trim( $value ) ) >= 2;
				},
				'description'       => __( 'Suchbegriff für Adresssuche (min. 2 Zeichen)', 'resa' ),
			],
			'viewbox' => [
				'type'              => 'string',
				'required'          => false,
				'sanitize_callback' => 'sanitize_text_field',
				'validate_callback' => [ $this, 'validateViewbox' ],
				'description'       => __( 'Bounding Box als minLng,minLat,maxLng,maxLat', 'resa' ),
			],
			'bounded' => [
				'type'              => 'boolean',
				'required'          => false,
				'default'           => false,
				'description'       => __( 'Ergebnisse auf Viewbox beschränken', 'resa' ),
			],
			'limit'   => [
				'type'              => 'integer',
				'required'          => false,
				'default'           => 5,
				'minimum'           => 1,
				'maximum'           => 10,
				'sanitize_callback' => 'absint',
				'description'       => __( 'Maximale Anzahl Ergebnisse', 'resa' ),
			],
		];
	}

	/**
	 * @inheritDoc
	 */
	public function registerRoutes(): void {
		// Public endpoint for frontend address input.
		register_rest_route(
			self::NAMESPACE,
			'/geocoding/search',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'search' ],
				'permission_callback' => [ $this, 'publicAccess' ],
				'args'                => $this->getSearchArgs(),
			]
		);

		// Admin endpoint (kept for backwards compatibility).
		register_rest_route(
			self::NAMESPACE,
			'/admin/geocoding/search',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'search' ],
				'permission_callback' => [ $this, 'adminAccess' ],
				'args'                => $this->getSearchArgs(),
			]
		);
	}

	/**
	 * Validate viewbox format (minLng,minLat,maxLng,maxLat).
	 *
	 * @param mixed $value Viewbox string.
	 * @return bool
	 */
	public function validateViewbox( $value ): bool {
		if ( $value === null || $value === '' ) {
			return true; // Optional field.
		}

		if ( ! is_string( $value ) ) {
			return false;
		}

		$parts = explode( ',', $value );
		if ( count( $parts ) !== 4 ) {
			return false;
		}

		// All parts must be valid coordinates.
		foreach ( $parts as $part ) {
			if ( ! is_numeric( trim( $part ) ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * GET /geocoding/search — Search for addresses (public + admin).
	 *
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function search( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$query   = $request->get_param( 'query' );
		$viewbox = $request->get_param( 'viewbox' );
		$bounded = (bool) $request->get_param( 'bounded' );
		$limit   = (int) $request->get_param( 'limit' );

		if ( ! $this->geocoder->isAvailable() ) {
			return $this->error(
				'resa_geocoder_unavailable',
				__( 'Geocoding-Dienst ist nicht verfügbar.', 'resa' ),
				503
			);
		}

		try {
			$options = [];

			if ( $viewbox ) {
				$options['viewbox'] = $viewbox;
				$options['bounded'] = $bounded;
			}

			if ( $limit > 0 ) {
				$options['limit'] = min( $limit, 10 );
			}

			$results = $this->geocoder->search( $query, $options );

			$formatted = array_map(
				static fn( $result ) => $result->toArray(),
				$results
			);

			return $this->success( [
				'results'  => $formatted,
				'provider' => $this->geocoder->getName(),
			] );
		} catch ( \RuntimeException $e ) {
			return $this->error(
				'resa_geocoding_failed',
				$e->getMessage(),
				500
			);
		}
	}
}
