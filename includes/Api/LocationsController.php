<?php

declare( strict_types=1 );

namespace Resa\Api;

use Resa\Core\Plugin;
use Resa\Freemius\FeatureGate;
use Resa\Models\Location;

/**
 * REST controller for locations (cities/regions).
 *
 * Public: GET list + single (for frontend dropdowns).
 * Admin: Full CRUD (for location management page).
 */
class LocationsController extends RestController {

	/**
	 * @inheritDoc
	 */
	public function registerRoutes(): void {
		// Public endpoints.
		register_rest_route(
			self::NAMESPACE,
			'/locations',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'index' ],
				'permission_callback' => [ $this, 'publicAccess' ],
			]
		);

		register_rest_route(
			self::NAMESPACE,
			'/locations/(?P<id>\d+)',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'show' ],
				'permission_callback' => [ $this, 'publicAccess' ],
				'args'                => [
					'id' => [
						'type'              => 'integer',
						'required'          => true,
						'sanitize_callback' => 'absint',
					],
				],
			]
		);

		// Admin endpoints.
		register_rest_route(
			self::NAMESPACE,
			'/admin/locations',
			[
				[
					'methods'             => 'GET',
					'callback'            => [ $this, 'adminIndex' ],
					'permission_callback' => [ $this, 'adminAccess' ],
				],
				[
					'methods'             => 'POST',
					'callback'            => [ $this, 'create' ],
					'permission_callback' => [ $this, 'adminAccess' ],
				],
			]
		);

		register_rest_route(
			self::NAMESPACE,
			'/admin/locations/(?P<id>\d+)',
			[
				[
					'methods'             => 'PUT',
					'callback'            => [ $this, 'update' ],
					'permission_callback' => [ $this, 'adminAccess' ],
					'args'                => [
						'id' => [
							'type'              => 'integer',
							'required'          => true,
							'sanitize_callback' => 'absint',
						],
					],
				],
				[
					'methods'             => 'DELETE',
					'callback'            => [ $this, 'destroy' ],
					'permission_callback' => [ $this, 'adminAccess' ],
					'args'                => [
						'id' => [
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
	 * GET /locations — List all active locations (public).
	 */
	public function index(): \WP_REST_Response {
		$locations = Location::getAll( true );

		$result = array_map(
			static function ( object $loc ): array {
				return [
					'id'   => (int) $loc->id,
					'slug' => $loc->slug,
					'name' => $loc->name,
				];
			},
			$locations
		);

		return $this->success( $result );
	}

	/**
	 * GET /locations/{id} — Single location (public).
	 */
	public function show( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$id       = (int) $request->get_param( 'id' );
		$location = Location::findById( $id );

		if ( ! $location ) {
			return $this->notFound( __( 'Location nicht gefunden.', 'resa' ) );
		}

		return $this->success( [
			'id'   => (int) $location->id,
			'slug' => $location->slug,
			'name' => $location->name,
		] );
	}

	/**
	 * GET /admin/locations — List all locations with full data (admin).
	 */
	public function adminIndex(): \WP_REST_Response {
		$locations = Location::getAll( false );

		$result = array_map(
			[ self::class, 'formatAdmin' ],
			$locations
		);

		return $this->success( $result );
	}

	/**
	 * POST /admin/locations — Create a location.
	 */
	public function create( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		// Check feature gate for location limit.
		$plugin = Plugin::getInstance();
		if ( $plugin ) {
			$featureGate  = new FeatureGate( $plugin->getModuleRegistry() );
			$currentCount = Location::count();

			if ( ! $featureGate->canAddLocation( $currentCount ) ) {
				return $this->error(
					'resa_location_limit_reached',
					__( 'Standort-Limit erreicht. Upgrade auf Premium für unbegrenzte Standorte.', 'resa' ),
					403
				);
			}
		}

		$name = $this->requiredString( $request, 'name' );
		if ( is_wp_error( $name ) ) {
			return $name;
		}

		$slug = $request->get_param( 'slug' );
		if ( ! $slug ) {
			$slug = sanitize_title( $name );
		}

		// Check for duplicate slug.
		$existing = Location::findBySlug( $slug );
		if ( $existing ) {
			return $this->validationError( [
				'slug' => __( 'Eine Location mit diesem Slug existiert bereits.', 'resa' ),
			] );
		}

		$locationData = [
			'slug'        => $slug,
			'name'        => $name,
			'country'     => sanitize_text_field( $request->get_param( 'country' ) ?? 'DE' ),
			'bundesland'  => sanitize_text_field( $request->get_param( 'bundesland' ) ?? '' ),
			'region_type' => sanitize_text_field( $request->get_param( 'region_type' ) ?? 'city' ),
			'data'        => $request->get_param( 'data' ) ?? [],
			'factors'     => $request->get_param( 'factors' ),
			'is_active'   => $request->get_param( 'is_active' ) ?? true,
		];

		$id = Location::create( $locationData );

		if ( $id === false ) {
			return $this->error(
				'resa_create_failed',
				__( 'Location konnte nicht erstellt werden.', 'resa' ),
				500
			);
		}

		$location = Location::findById( $id );

		return $this->success( self::formatAdmin( $location ), 201 );
	}

	/**
	 * PUT /admin/locations/{id} — Update a location.
	 */
	public function update( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$id       = (int) $request->get_param( 'id' );
		$location = Location::findById( $id );

		if ( ! $location ) {
			return $this->notFound( __( 'Location nicht gefunden.', 'resa' ) );
		}

		$updateData = [];
		$params     = $request->get_json_params();

		$stringFields = [ 'name', 'slug', 'country', 'bundesland', 'region_type' ];
		foreach ( $stringFields as $field ) {
			if ( array_key_exists( $field, $params ) ) {
				$updateData[ $field ] = sanitize_text_field( (string) $params[ $field ] );
			}
		}

		if ( array_key_exists( 'data', $params ) ) {
			$updateData['data'] = $params['data'];
		}

		if ( array_key_exists( 'factors', $params ) ) {
			$updateData['factors'] = $params['factors'];
		}

		if ( array_key_exists( 'is_active', $params ) ) {
			$updateData['is_active'] = $params['is_active'];
		}

		$success = Location::update( $id, $updateData );

		if ( ! $success ) {
			return $this->error(
				'resa_update_failed',
				__( 'Location konnte nicht aktualisiert werden.', 'resa' ),
				500
			);
		}

		$location = Location::findById( $id );

		return $this->success( self::formatAdmin( $location ) );
	}

	/**
	 * DELETE /admin/locations/{id} — Delete a location.
	 */
	public function destroy( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$id       = (int) $request->get_param( 'id' );
		$location = Location::findById( $id );

		if ( ! $location ) {
			return $this->notFound( __( 'Location nicht gefunden.', 'resa' ) );
		}

		$success = Location::delete( $id );

		if ( ! $success ) {
			return $this->error(
				'resa_delete_failed',
				__( 'Location konnte nicht gelöscht werden.', 'resa' ),
				500
			);
		}

		return $this->success( [ 'deleted' => true ] );
	}

	/**
	 * Format a location row for admin API responses (includes full data).
	 *
	 * @param object|null $location Location row.
	 * @return array<string,mixed>
	 */
	private static function formatAdmin( ?object $location ): array {
		if ( ! $location ) {
			return [];
		}

		return [
			'id'          => (int) $location->id,
			'slug'        => $location->slug,
			'name'        => $location->name,
			'country'     => $location->country,
			'bundesland'  => $location->bundesland,
			'region_type' => $location->region_type,
			'currency'    => $location->currency,
			'data'        => json_decode( $location->data ?? '{}', true ),
			'factors'     => json_decode( $location->factors ?? 'null', true ),
			'agent_id'    => $location->agent_id ? (int) $location->agent_id : null,
			'is_active'   => (bool) $location->is_active,
			'created_at'  => $location->created_at,
			'updated_at'  => $location->updated_at,
		];
	}
}
