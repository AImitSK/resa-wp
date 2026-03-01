<?php

declare( strict_types=1 );

namespace Resa\Api;

/**
 * REST controller for map settings.
 *
 * Admin-only endpoints for managing map provider, tile style,
 * zoom level, and Google Maps API key.
 */
class MapSettingsController extends RestController {

	/**
	 * Option keys for map settings.
	 */
	private const OPT_PROVIDER       = 'resa_map_provider';
	private const OPT_TILE_STYLE     = 'resa_map_tile_style';
	private const OPT_DEFAULT_ZOOM   = 'resa_map_default_zoom';
	private const OPT_GOOGLE_API_KEY = 'resa_map_google_api_key';
	private const OPT_SCROLL_ZOOM    = 'resa_map_scroll_zoom';

	/**
	 * Valid providers.
	 */
	private const PROVIDERS = [ 'osm', 'google' ];

	/**
	 * Valid tile styles.
	 */
	private const TILE_STYLES = [ 'standard', 'minimal', 'dark' ];

	/**
	 * Default values.
	 */
	private const DEFAULT_PROVIDER     = 'osm';
	private const DEFAULT_TILE_STYLE   = 'minimal';
	private const DEFAULT_ZOOM         = 13;
	private const DEFAULT_SCROLL_ZOOM  = false;

	/**
	 * @inheritDoc
	 */
	public function registerRoutes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/admin/map-settings',
			[
				[
					'methods'             => 'GET',
					'callback'            => [ $this, 'show' ],
					'permission_callback' => [ $this, 'adminAccess' ],
				],
				[
					'methods'             => 'PUT',
					'callback'            => [ $this, 'update' ],
					'permission_callback' => [ $this, 'adminAccess' ],
				],
			]
		);
	}

	/**
	 * GET /admin/map-settings — Get map settings.
	 */
	public function show(): \WP_REST_Response {
		return $this->success( $this->getMapSettings() );
	}

	/**
	 * PUT /admin/map-settings — Update map settings.
	 */
	public function update( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$params = $request->get_json_params();

		// Validate provider.
		if ( isset( $params['provider'] ) ) {
			if ( ! in_array( $params['provider'], self::PROVIDERS, true ) ) {
				return $this->validationError( [
					'provider' => __( 'Ungültiger Kartenanbieter.', 'resa' ),
				] );
			}

			// Google Maps requires premium.
			if ( $params['provider'] === 'google' && ! $this->canUseGoogleMaps() ) {
				return $this->validationError( [
					'provider' => __( 'Google Maps ist nur im Premium-Plan verfügbar.', 'resa' ),
				] );
			}
		}

		// Validate tile style.
		if ( isset( $params['tileStyle'] ) ) {
			if ( ! in_array( $params['tileStyle'], self::TILE_STYLES, true ) ) {
				return $this->validationError( [
					'tileStyle' => __( 'Ungültiger Kartenstil.', 'resa' ),
				] );
			}

			// Tile style selection requires premium (Free gets minimal only).
			if ( $params['tileStyle'] !== 'minimal' && ! $this->canSelectTileStyle() ) {
				return $this->validationError( [
					'tileStyle' => __( 'Kartenstil-Auswahl ist nur im Premium-Plan verfügbar.', 'resa' ),
				] );
			}
		}

		// Validate zoom level.
		if ( isset( $params['defaultZoom'] ) ) {
			$zoom = absint( $params['defaultZoom'] );
			if ( $zoom < 1 || $zoom > 20 ) {
				return $this->validationError( [
					'defaultZoom' => __( 'Zoom-Level muss zwischen 1 und 20 liegen.', 'resa' ),
				] );
			}
		}

		// Update settings.
		if ( isset( $params['provider'] ) ) {
			update_option( self::OPT_PROVIDER, sanitize_text_field( $params['provider'] ) );
		}

		if ( isset( $params['tileStyle'] ) ) {
			update_option( self::OPT_TILE_STYLE, sanitize_text_field( $params['tileStyle'] ) );
		}

		if ( isset( $params['defaultZoom'] ) ) {
			update_option( self::OPT_DEFAULT_ZOOM, absint( $params['defaultZoom'] ) );
		}

		if ( array_key_exists( 'googleApiKey', $params ) ) {
			// Only save if user can use Google Maps.
			if ( $this->canUseGoogleMaps() ) {
				$apiKey = $params['googleApiKey'] ? sanitize_text_field( $params['googleApiKey'] ) : '';
				update_option( self::OPT_GOOGLE_API_KEY, $apiKey );
			}
		}

		if ( isset( $params['scrollZoom'] ) ) {
			update_option( self::OPT_SCROLL_ZOOM, $params['scrollZoom'] ? '1' : '0' );
		}

		return $this->success( $this->getMapSettings() );
	}

	/**
	 * Get all map settings as array.
	 *
	 * @return array<string, mixed>
	 */
	private function getMapSettings(): array {
		$isPremium = $this->canUseGoogleMaps();

		return [
			'provider'      => (string) get_option( self::OPT_PROVIDER, self::DEFAULT_PROVIDER ),
			'tileStyle'     => (string) get_option( self::OPT_TILE_STYLE, self::DEFAULT_TILE_STYLE ),
			'defaultZoom'   => (int) get_option( self::OPT_DEFAULT_ZOOM, self::DEFAULT_ZOOM ),
			'googleApiKey'  => $isPremium ? (string) get_option( self::OPT_GOOGLE_API_KEY, '' ) : '',
			'scrollZoom'    => get_option( self::OPT_SCROLL_ZOOM, '0' ) === '1',
			// Feature flags for UI.
			'canUseGoogle'    => $isPremium,
			'canSelectStyle'  => $this->canSelectTileStyle(),
		];
	}

	/**
	 * Check if current plan can use Google Maps.
	 *
	 * @return bool
	 */
	private function canUseGoogleMaps(): bool {
		if ( function_exists( 'resa_fs' ) ) {
			return resa_fs()->can_use_premium_code();
		}

		return false;
	}

	/**
	 * Check if current plan can select tile styles.
	 *
	 * Free plan gets "minimal" style only.
	 *
	 * @return bool
	 */
	private function canSelectTileStyle(): bool {
		if ( function_exists( 'resa_fs' ) ) {
			return resa_fs()->can_use_premium_code();
		}

		return false;
	}
}
