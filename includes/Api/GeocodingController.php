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
	 * @inheritDoc
	 */
	public function registerRoutes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/admin/geocoding/search',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'search' ],
				'permission_callback' => [ $this, 'adminAccess' ],
				'args'                => [
					'query' => [
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
						'validate_callback' => static function ( $value ): bool {
							return is_string( $value ) && strlen( trim( $value ) ) >= 2;
						},
						'description'       => __( 'Suchbegriff für Adresssuche (min. 2 Zeichen)', 'resa' ),
					],
				],
			]
		);
	}

	/**
	 * GET /admin/geocoding/search — Search for addresses.
	 *
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function search( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$query = $request->get_param( 'query' );

		if ( ! $this->geocoder->isAvailable() ) {
			return $this->error(
				'resa_geocoder_unavailable',
				__( 'Geocoding-Dienst ist nicht verfügbar.', 'resa' ),
				503
			);
		}

		try {
			$results = $this->geocoder->search( $query );

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
