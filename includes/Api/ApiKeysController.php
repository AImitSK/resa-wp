<?php

declare( strict_types=1 );

namespace Resa\Api;

use Resa\Core\ErrorMessages;
use Resa\Core\Plugin;
use Resa\Models\ApiKey;

/**
 * REST controller for API key management (admin-only, premium feature).
 *
 * API keys allow external read-only access to leads and locations.
 * Keys are stored as SHA-256 hashes; the plain key is returned only on creation.
 */
class ApiKeysController extends RestController {

	/**
	 * @inheritDoc
	 */
	public function registerRoutes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/admin/api-keys',
			[
				[
					'methods'             => 'GET',
					'callback'            => [ $this, 'index' ],
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
			'/admin/api-keys/(?P<id>\d+)',
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
	 * GET /admin/api-keys — List all API keys (without plain key).
	 */
	public function index(): \WP_REST_Response|\WP_Error {
		$gate = $this->checkFeatureGate();
		if ( $gate !== null ) {
			return $gate;
		}

		$keys = ApiKey::getAll();

		$result = array_map(
			[ self::class, 'formatApiKey' ],
			$keys
		);

		return $this->success( $result );
	}

	/**
	 * POST /admin/api-keys — Create a new API key.
	 */
	public function create( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$gate = $this->checkFeatureGate();
		if ( $gate !== null ) {
			return $gate;
		}

		// Limit check.
		if ( ApiKey::count() >= 5 ) {
			return $this->error(
				ErrorMessages::API_KEY_LIMIT,
				ErrorMessages::get( ErrorMessages::API_KEY_LIMIT ),
				400
			);
		}

		$name = $this->requiredString( $request, 'name' );
		if ( is_wp_error( $name ) ) {
			return $name;
		}

		$result = ApiKey::create( [ 'name' => $name ] );

		if ( $result === false ) {
			return $this->error(
				'resa_create_failed',
				__( 'API-Schlüssel konnte nicht erstellt werden.', 'resa' ),
				500
			);
		}

		$apiKey = ApiKey::findById( $result['id'] );
		$formatted = self::formatApiKey( $apiKey );

		// Include the plain key (only on creation).
		$formatted['key'] = $result['key'];

		return $this->success( $formatted, 201 );
	}

	/**
	 * PUT /admin/api-keys/{id} — Update name or active status.
	 */
	public function update( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$gate = $this->checkFeatureGate();
		if ( $gate !== null ) {
			return $gate;
		}

		$id     = (int) $request->get_param( 'id' );
		$apiKey = ApiKey::findById( $id );

		if ( ! $apiKey ) {
			return $this->error(
				ErrorMessages::API_KEY_NOT_FOUND,
				ErrorMessages::get( ErrorMessages::API_KEY_NOT_FOUND ),
				404
			);
		}

		$updateData = [];
		$params     = $request->get_json_params();

		if ( array_key_exists( 'name', $params ) ) {
			$updateData['name'] = (string) $params['name'];
		}

		if ( array_key_exists( 'isActive', $params ) ) {
			$updateData['is_active'] = $params['isActive'];
		}

		$success = ApiKey::update( $id, $updateData );

		if ( ! $success ) {
			return $this->error(
				'resa_update_failed',
				__( 'API-Schlüssel konnte nicht aktualisiert werden.', 'resa' ),
				500
			);
		}

		$apiKey = ApiKey::findById( $id );

		return $this->success( self::formatApiKey( $apiKey ) );
	}

	/**
	 * DELETE /admin/api-keys/{id} — Delete an API key.
	 */
	public function destroy( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$gate = $this->checkFeatureGate();
		if ( $gate !== null ) {
			return $gate;
		}

		$id     = (int) $request->get_param( 'id' );
		$apiKey = ApiKey::findById( $id );

		if ( ! $apiKey ) {
			return $this->error(
				ErrorMessages::API_KEY_NOT_FOUND,
				ErrorMessages::get( ErrorMessages::API_KEY_NOT_FOUND ),
				404
			);
		}

		$success = ApiKey::delete( $id );

		if ( ! $success ) {
			return $this->error(
				'resa_delete_failed',
				__( 'API-Schlüssel konnte nicht gelöscht werden.', 'resa' ),
				500
			);
		}

		return $this->success( [ 'deleted' => true ] );
	}

	/**
	 * Check the feature gate for API key access.
	 *
	 * @return \WP_Error|null Error if not allowed, null if OK.
	 */
	private function checkFeatureGate(): ?\WP_Error {
		$plugin = Plugin::getInstance();
		if ( $plugin && ! $plugin->getFeatureGate()->canUseApiKeys() ) {
			return $this->error(
				'resa_feature_restricted',
				__( 'API-Schlüssel sind nur mit Premium verfügbar.', 'resa' ),
				403
			);
		}

		return null;
	}

	/**
	 * Format an API key row for responses (never includes plain key).
	 *
	 * @param object|null $apiKey API key row.
	 * @return array<string,mixed>
	 */
	private static function formatApiKey( ?object $apiKey ): array {
		if ( ! $apiKey ) {
			return [];
		}

		return [
			'id'         => (int) $apiKey->id,
			'name'       => $apiKey->name,
			'keyPrefix'  => $apiKey->key_prefix,
			'isActive'   => (bool) $apiKey->is_active,
			'lastUsedAt' => $apiKey->last_used_at,
			'createdAt'  => $apiKey->created_at,
		];
	}
}
