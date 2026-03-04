<?php

declare( strict_types=1 );

namespace Resa\Api;

use Resa\Core\ErrorMessages;
use Resa\Core\Plugin;
use Resa\Models\Messenger;
use Resa\Services\Integration\MessengerDispatcher;

/**
 * REST controller for messenger management (admin-only, premium feature).
 *
 * Provides CRUD endpoints and a test-send action for messenger connections
 * (Slack, Microsoft Teams, Discord).
 */
class MessengersController extends RestController {

	/**
	 * URL validation patterns per platform.
	 */
	private const URL_PATTERNS = [
		'slack'   => '#^https://hooks\.slack\.com/services/T[A-Z0-9]+/B[A-Z0-9]+/[A-Za-z0-9]+$#',
		'teams'   => '#^https://[a-zA-Z0-9.-]+\.(webhook\.office\.com|logic\.azure\.com|api\.powerplatform\.com)[:/]#',
		'discord' => '#^https://(discord\.com|discordapp\.com)/api/webhooks/\d+/[A-Za-z0-9_-]+$#',
	];

	/**
	 * @inheritDoc
	 */
	public function registerRoutes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/admin/messengers',
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
			'/admin/messengers/(?P<id>\d+)',
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

		register_rest_route(
			self::NAMESPACE,
			'/admin/messengers/(?P<id>\d+)/test',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'test' ],
				'permission_callback' => [ $this, 'adminAccess' ],
				'args'                => [
					'id' => [
						'type'              => 'integer',
						'required'          => true,
						'sanitize_callback' => 'absint',
					],
				],
			]
		);
	}

	/**
	 * GET /admin/messengers — List all messenger connections.
	 */
	public function index(): \WP_REST_Response|\WP_Error {
		$gate = $this->checkFeatureGate();
		if ( $gate !== null ) {
			return $gate;
		}

		$messengers = Messenger::getAll();

		$result = array_map(
			[ self::class, 'formatMessenger' ],
			$messengers
		);

		return $this->success( $result );
	}

	/**
	 * POST /admin/messengers — Create a new messenger connection.
	 */
	public function create( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$gate = $this->checkFeatureGate();
		if ( $gate !== null ) {
			return $gate;
		}

		// Limit check.
		if ( Messenger::count() >= 5 ) {
			return $this->error(
				ErrorMessages::MESSENGER_LIMIT,
				ErrorMessages::get( ErrorMessages::MESSENGER_LIMIT ),
				400
			);
		}

		$name = $this->requiredString( $request, 'name' );
		if ( is_wp_error( $name ) ) {
			return $name;
		}

		$platform = $request->get_param( 'platform' );
		if ( ! is_string( $platform ) || ! in_array( $platform, Messenger::PLATFORMS, true ) ) {
			return $this->error(
				'resa_invalid_platform',
				__( 'Ungültige Plattform. Erlaubt: slack, teams, discord.', 'resa' ),
				400
			);
		}

		$webhookUrl = $request->get_param( 'webhookUrl' );
		if ( ! is_string( $webhookUrl ) || ! filter_var( $webhookUrl, FILTER_VALIDATE_URL ) ) {
			return $this->error(
				ErrorMessages::MESSENGER_INVALID_URL,
				ErrorMessages::get( ErrorMessages::MESSENGER_INVALID_URL ),
				400
			);
		}

		// Platform-specific URL validation.
		if ( ! $this->validatePlatformUrl( $platform, $webhookUrl ) ) {
			return $this->error(
				ErrorMessages::MESSENGER_INVALID_URL,
				ErrorMessages::get( ErrorMessages::MESSENGER_INVALID_URL ),
				400
			);
		}

		$id = Messenger::create( [
			'name'        => $name,
			'platform'    => $platform,
			'webhook_url' => $webhookUrl,
			'is_active'   => $request->get_param( 'isActive' ) ?? true,
		] );

		if ( $id === false ) {
			return $this->error(
				'resa_create_failed',
				__( 'Messenger-Verbindung konnte nicht erstellt werden.', 'resa' ),
				500
			);
		}

		$messenger = Messenger::findById( $id );

		return $this->success( self::formatMessenger( $messenger ), 201 );
	}

	/**
	 * PUT /admin/messengers/{id} — Update a messenger connection.
	 */
	public function update( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$gate = $this->checkFeatureGate();
		if ( $gate !== null ) {
			return $gate;
		}

		$id        = (int) $request->get_param( 'id' );
		$messenger = Messenger::findById( $id );

		if ( ! $messenger ) {
			return $this->error(
				ErrorMessages::MESSENGER_NOT_FOUND,
				ErrorMessages::get( ErrorMessages::MESSENGER_NOT_FOUND ),
				404
			);
		}

		$updateData = [];
		$params     = $request->get_json_params();

		if ( array_key_exists( 'name', $params ) ) {
			$updateData['name'] = (string) $params['name'];
		}

		if ( array_key_exists( 'webhookUrl', $params ) ) {
			$url = (string) $params['webhookUrl'];

			if ( ! filter_var( $url, FILTER_VALIDATE_URL ) ) {
				return $this->error(
					ErrorMessages::MESSENGER_INVALID_URL,
					ErrorMessages::get( ErrorMessages::MESSENGER_INVALID_URL ),
					400
				);
			}

			// Validate URL against the existing platform.
			if ( ! $this->validatePlatformUrl( $messenger->platform, $url ) ) {
				return $this->error(
					ErrorMessages::MESSENGER_INVALID_URL,
					ErrorMessages::get( ErrorMessages::MESSENGER_INVALID_URL ),
					400
				);
			}

			$updateData['webhook_url'] = $url;
		}

		if ( array_key_exists( 'isActive', $params ) ) {
			$updateData['is_active'] = $params['isActive'];
		}

		$success = Messenger::update( $id, $updateData );

		if ( ! $success ) {
			return $this->error(
				'resa_update_failed',
				__( 'Messenger-Verbindung konnte nicht aktualisiert werden.', 'resa' ),
				500
			);
		}

		$messenger = Messenger::findById( $id );

		return $this->success( self::formatMessenger( $messenger ) );
	}

	/**
	 * DELETE /admin/messengers/{id} — Delete a messenger connection.
	 */
	public function destroy( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$gate = $this->checkFeatureGate();
		if ( $gate !== null ) {
			return $gate;
		}

		$id        = (int) $request->get_param( 'id' );
		$messenger = Messenger::findById( $id );

		if ( ! $messenger ) {
			return $this->error(
				ErrorMessages::MESSENGER_NOT_FOUND,
				ErrorMessages::get( ErrorMessages::MESSENGER_NOT_FOUND ),
				404
			);
		}

		$success = Messenger::delete( $id );

		if ( ! $success ) {
			return $this->error(
				'resa_delete_failed',
				__( 'Messenger-Verbindung konnte nicht gelöscht werden.', 'resa' ),
				500
			);
		}

		return $this->success( [ 'deleted' => true ] );
	}

	/**
	 * POST /admin/messengers/{id}/test — Send a test notification.
	 */
	public function test( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$gate = $this->checkFeatureGate();
		if ( $gate !== null ) {
			return $gate;
		}

		$id        = (int) $request->get_param( 'id' );
		$messenger = Messenger::findById( $id );

		if ( ! $messenger ) {
			return $this->error(
				ErrorMessages::MESSENGER_NOT_FOUND,
				ErrorMessages::get( ErrorMessages::MESSENGER_NOT_FOUND ),
				404
			);
		}

		$dispatcher = new MessengerDispatcher();
		$result     = $dispatcher->sendTest( $messenger );

		return $this->success( $result );
	}

	/**
	 * Validate a webhook URL against its platform's expected pattern.
	 *
	 * @param string $platform Platform name.
	 * @param string $url      Webhook URL.
	 * @return bool True if URL matches the platform pattern.
	 */
	private function validatePlatformUrl( string $platform, string $url ): bool {
		if ( ! isset( self::URL_PATTERNS[ $platform ] ) ) {
			return false;
		}

		return (bool) preg_match( self::URL_PATTERNS[ $platform ], $url );
	}

	/**
	 * Check the feature gate for messenger access.
	 *
	 * @return \WP_Error|null Error if not allowed, null if OK.
	 */
	private function checkFeatureGate(): ?\WP_Error {
		$plugin = Plugin::getInstance();
		if ( $plugin && ! $plugin->getFeatureGate()->canUseMessenger() ) {
			return $this->error(
				'resa_feature_restricted',
				__( 'Messenger-Benachrichtigungen sind nur mit Premium verfügbar.', 'resa' ),
				403
			);
		}

		return null;
	}

	/**
	 * Format a messenger row for API responses.
	 *
	 * @param object|null $messenger Messenger row.
	 * @return array<string,mixed>
	 */
	private static function formatMessenger( ?object $messenger ): array {
		if ( ! $messenger ) {
			return [];
		}

		return [
			'id'         => (int) $messenger->id,
			'name'       => $messenger->name,
			'platform'   => $messenger->platform,
			'webhookUrl' => $messenger->webhook_url,
			'isActive'   => (bool) $messenger->is_active,
			'createdAt'  => $messenger->created_at,
			'updatedAt'  => $messenger->updated_at,
		];
	}
}
