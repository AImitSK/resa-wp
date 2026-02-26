<?php

declare( strict_types=1 );

namespace Resa\Api;

use Resa\Models\ModuleSettings;
use Resa\Core\Plugin;
use Resa\Core\ModuleInterface;
use Resa\Modules\RentCalculator\RentCalculatorService;

/**
 * REST API controller for module settings.
 *
 * Provides endpoints for managing per-module configuration
 * including setup mode, factors, and location-specific values.
 *
 * Endpoints:
 *   GET  /admin/modules/{slug}/settings  — Get module settings
 *   PUT  /admin/modules/{slug}/settings  — Save module settings
 *   GET  /admin/modules/{slug}/presets   — Get available presets
 */
class ModuleSettingsController extends RestController {

	/**
	 * Get a module by slug from the registry.
	 *
	 * @param string $slug Module slug.
	 * @return ModuleInterface|null
	 */
	private function getModule( string $slug ): ?ModuleInterface {
		$plugin = Plugin::getInstance();
		if ( ! $plugin ) {
			return null;
		}
		return $plugin->getModuleRegistry()->get( $slug );
	}

	/**
	 * Register REST routes.
	 */
	public function registerRoutes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/admin/modules/(?P<slug>[a-z0-9-]+)/settings',
			[
				[
					'methods'             => 'GET',
					'callback'            => [ $this, 'getSettings' ],
					'permission_callback' => [ $this, 'adminAccess' ],
					'args'                => [
						'slug' => [
							'type'              => 'string',
							'required'          => true,
							'sanitize_callback' => 'sanitize_key',
						],
					],
				],
				[
					'methods'             => 'PUT',
					'callback'            => [ $this, 'saveSettings' ],
					'permission_callback' => [ $this, 'adminAccess' ],
					'args'                => [
						'slug' => [
							'type'              => 'string',
							'required'          => true,
							'sanitize_callback' => 'sanitize_key',
						],
					],
				],
			]
		);

		register_rest_route(
			self::NAMESPACE,
			'/admin/modules/(?P<slug>[a-z0-9-]+)/presets',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'getPresets' ],
				'permission_callback' => [ $this, 'adminAccess' ],
				'args'                => [
					'slug' => [
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_key',
					],
				],
			]
		);

		register_rest_route(
			self::NAMESPACE,
			'/admin/modules/(?P<slug>[a-z0-9-]+)/settings/locations/(?P<location_id>\d+)',
			[
				[
					'methods'             => 'PUT',
					'callback'            => [ $this, 'saveLocationValue' ],
					'permission_callback' => [ $this, 'adminAccess' ],
					'args'                => [
						'slug'        => [
							'type'              => 'string',
							'required'          => true,
							'sanitize_callback' => 'sanitize_key',
						],
						'location_id' => [
							'type'              => 'integer',
							'required'          => true,
							'sanitize_callback' => 'absint',
						],
					],
				],
				[
					'methods'             => 'DELETE',
					'callback'            => [ $this, 'deleteLocationValue' ],
					'permission_callback' => [ $this, 'adminAccess' ],
					'args'                => [
						'slug'        => [
							'type'              => 'string',
							'required'          => true,
							'sanitize_callback' => 'sanitize_key',
						],
						'location_id' => [
							'type'              => 'integer',
							'required'          => true,
							'sanitize_callback' => 'absint',
						],
					],
				],
			]
		);
	}

	/**
	 * GET /admin/modules/{slug}/settings
	 *
	 * Returns module settings or defaults if not configured.
	 *
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function getSettings( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$slug = $request->get_param( 'slug' );

		// Verify module exists.
		$module = $this->getModule( $slug );
		if ( ! $module ) {
			return $this->notFound(
				/* translators: %s: Module slug */
				sprintf( __( 'Modul "%s" nicht gefunden.', 'resa' ), $slug )
			);
		}

		$settings = ModuleSettings::getBySlug( $slug );

		if ( ! $settings ) {
			// Return defaults.
			$settings = [
				'module_slug'     => $slug,
				'setup_mode'      => 'pauschal',
				'region_preset'   => 'medium_city',
				'factors'         => $this->getDefaultFactors( $slug ),
				'location_values' => [],
			];
		}

		// Add module info.
		$settings['module'] = $module->toArray();

		return $this->success( $settings );
	}

	/**
	 * PUT /admin/modules/{slug}/settings
	 *
	 * Save module settings.
	 *
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function saveSettings( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$slug = $request->get_param( 'slug' );

		// Verify module exists.
		$module = $this->getModule( $slug );
		if ( ! $module ) {
			return $this->notFound(
				/* translators: %s: Module slug */
				sprintf( __( 'Modul "%s" nicht gefunden.', 'resa' ), $slug )
			);
		}

		$body = $request->get_json_params();

		$data = [];

		if ( isset( $body['setup_mode'] ) ) {
			$data['setup_mode'] = sanitize_text_field( $body['setup_mode'] );
		}

		if ( isset( $body['region_preset'] ) ) {
			$data['region_preset'] = sanitize_text_field( $body['region_preset'] );

			// If switching to preset mode, load preset factors.
			if ( ( $data['setup_mode'] ?? '' ) === 'pauschal' || ! isset( $body['factors'] ) ) {
				$presets = $this->getPresetsForModule( $slug );
				if ( isset( $presets[ $data['region_preset'] ] ) ) {
					$data['factors'] = $presets[ $data['region_preset'] ];
				}
			}
		}

		if ( isset( $body['factors'] ) && is_array( $body['factors'] ) ) {
			$data['factors'] = $this->sanitizeFactors( $body['factors'] );
		}

		if ( isset( $body['location_values'] ) && is_array( $body['location_values'] ) ) {
			$data['location_values'] = $this->sanitizeLocationValues( $body['location_values'] );
		}

		$success = ModuleSettings::save( $slug, $data );

		if ( ! $success ) {
			return $this->error(
				'resa_save_failed',
				__( 'Einstellungen konnten nicht gespeichert werden.', 'resa' ),
				500
			);
		}

		$settings            = ModuleSettings::getBySlug( $slug );
		$settings['module']  = $module->toArray();

		return $this->success( $settings );
	}

	/**
	 * GET /admin/modules/{slug}/presets
	 *
	 * Returns available region presets for a module.
	 *
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function getPresets( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$slug = $request->get_param( 'slug' );

		// Verify module exists.
		$module = $this->getModule( $slug );
		if ( ! $module ) {
			return $this->notFound(
				/* translators: %s: Module slug */
				sprintf( __( 'Modul "%s" nicht gefunden.', 'resa' ), $slug )
			);
		}

		$presets = $this->getPresetsForModule( $slug );

		return $this->success( $presets );
	}

	/**
	 * PUT /admin/modules/{slug}/settings/locations/{location_id}
	 *
	 * Save location-specific values for a module.
	 *
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function saveLocationValue( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$slug       = $request->get_param( 'slug' );
		$locationId = (int) $request->get_param( 'location_id' );

		// Verify module exists.
		$module = $this->getModule( $slug );
		if ( ! $module ) {
			return $this->notFound(
				/* translators: %s: Module slug */
				sprintf( __( 'Modul "%s" nicht gefunden.', 'resa' ), $slug )
			);
		}

		$body   = $request->get_json_params();
		$values = $this->sanitizeLocationValue( $body );

		$success = ModuleSettings::setLocationValue( $slug, $locationId, $values );

		if ( ! $success ) {
			return $this->error(
				'resa_save_failed',
				__( 'Standort-Werte konnten nicht gespeichert werden.', 'resa' ),
				500
			);
		}

		return $this->success( [
			'location_id' => $locationId,
			'values'      => $values,
		] );
	}

	/**
	 * DELETE /admin/modules/{slug}/settings/locations/{location_id}
	 *
	 * Remove location-specific values for a module.
	 *
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function deleteLocationValue( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$slug       = $request->get_param( 'slug' );
		$locationId = (int) $request->get_param( 'location_id' );

		$success = ModuleSettings::removeLocationValue( $slug, $locationId );

		if ( ! $success ) {
			return $this->error(
				'resa_delete_failed',
				__( 'Standort-Werte konnten nicht gelöscht werden.', 'resa' ),
				500
			);
		}

		return $this->success( [ 'deleted' => true ] );
	}

	/**
	 * Get presets for a specific module.
	 *
	 * @param string $slug Module slug.
	 * @return array<string,array<string,mixed>>
	 */
	private function getPresetsForModule( string $slug ): array {
		// Currently only rent-calculator has presets.
		if ( $slug === 'rent-calculator' ) {
			return RentCalculatorService::getRegionPresets();
		}

		// Default presets for other modules (can be extended).
		return [
			'rural'       => [ 'label' => __( 'Ländlich', 'resa' ) ],
			'small_town'  => [ 'label' => __( 'Kleinstadt / Stadtrand', 'resa' ) ],
			'medium_city' => [ 'label' => __( 'Mittelstadt', 'resa' ) ],
			'large_city'  => [ 'label' => __( 'Großstadt / Zentrum', 'resa' ) ],
		];
	}

	/**
	 * Get default factors for a module.
	 *
	 * @param string $slug Module slug.
	 * @return array<string,mixed>|null
	 */
	private function getDefaultFactors( string $slug ): ?array {
		if ( $slug === 'rent-calculator' ) {
			$presets = RentCalculatorService::getRegionPresets();
			return $presets['medium_city'] ?? null;
		}

		return null;
	}

	/**
	 * Sanitize factors array recursively.
	 *
	 * @param array<string,mixed> $factors Raw factors.
	 * @return array<string,mixed>
	 */
	private function sanitizeFactors( array $factors ): array {
		$sanitized = [];

		foreach ( $factors as $key => $value ) {
			$key = sanitize_key( $key );

			if ( is_array( $value ) ) {
				$sanitized[ $key ] = $this->sanitizeFactors( $value );
			} elseif ( is_numeric( $value ) ) {
				$sanitized[ $key ] = (float) $value;
			} elseif ( is_string( $value ) ) {
				$sanitized[ $key ] = sanitize_text_field( $value );
			}
		}

		return $sanitized;
	}

	/**
	 * Sanitize location values map.
	 *
	 * @param array<string,mixed> $locationValues Raw location values.
	 * @return array<string,array<string,mixed>>
	 */
	private function sanitizeLocationValues( array $locationValues ): array {
		$sanitized = [];

		foreach ( $locationValues as $locationId => $values ) {
			$locationId = (string) absint( $locationId );

			if ( is_array( $values ) ) {
				$sanitized[ $locationId ] = $this->sanitizeLocationValue( $values );
			}
		}

		return $sanitized;
	}

	/**
	 * Sanitize a single location value.
	 *
	 * @param array<string,mixed> $values Raw values.
	 * @return array<string,mixed>
	 */
	private function sanitizeLocationValue( array $values ): array {
		$sanitized = [];

		$numericKeys = [ 'base_price', 'price_min', 'price_max', 'size_degression' ];

		foreach ( $values as $key => $value ) {
			$key = sanitize_key( $key );

			if ( in_array( $key, $numericKeys, true ) ) {
				$sanitized[ $key ] = (float) $value;
			} elseif ( is_array( $value ) ) {
				$sanitized[ $key ] = $this->sanitizeFactors( $value );
			} elseif ( is_numeric( $value ) ) {
				$sanitized[ $key ] = (float) $value;
			} elseif ( is_string( $value ) ) {
				$sanitized[ $key ] = sanitize_text_field( $value );
			}
		}

		return $sanitized;
	}
}
