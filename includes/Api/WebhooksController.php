<?php

declare( strict_types=1 );

namespace Resa\Api;

use Resa\Core\ErrorMessages;
use Resa\Core\Plugin;
use Resa\Models\Webhook;
use Resa\Services\Integration\WebhookDispatcher;

/**
 * REST controller for webhook management (admin-only, premium feature).
 *
 * Provides CRUD endpoints and a test-send action for webhooks.
 */
class WebhooksController extends RestController {

	/**
	 * @inheritDoc
	 */
	public function registerRoutes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/admin/webhooks',
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
			'/admin/webhooks/(?P<id>\d+)',
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
			'/admin/webhooks/(?P<id>\d+)/test',
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
	 * GET /admin/webhooks — List all webhooks.
	 */
	public function index(): \WP_REST_Response|\WP_Error {
		$gate = $this->checkFeatureGate();
		if ( $gate !== null ) {
			return $gate;
		}

		$webhooks = Webhook::getAll();

		$result = array_map(
			[ self::class, 'formatWebhook' ],
			$webhooks
		);

		return $this->success( $result );
	}

	/**
	 * POST /admin/webhooks — Create a new webhook.
	 */
	public function create( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$gate = $this->checkFeatureGate();
		if ( $gate !== null ) {
			return $gate;
		}

		// Limit check.
		if ( Webhook::count() >= 5 ) {
			return $this->error(
				ErrorMessages::WEBHOOK_LIMIT,
				ErrorMessages::get( ErrorMessages::WEBHOOK_LIMIT ),
				400
			);
		}

		$name = $this->requiredString( $request, 'name' );
		if ( is_wp_error( $name ) ) {
			return $name;
		}

		$url = $request->get_param( 'url' );
		if ( ! is_string( $url ) || ! filter_var( $url, FILTER_VALIDATE_URL ) ) {
			return $this->error(
				ErrorMessages::WEBHOOK_INVALID_URL,
				ErrorMessages::get( ErrorMessages::WEBHOOK_INVALID_URL ),
				400
			);
		}

		$webhookData = [
			'name'      => $name,
			'url'       => $url,
			'events'    => $request->get_param( 'events' ) ?? [ 'lead.created' ],
			'is_active' => $request->get_param( 'isActive' ) ?? true,
		];

		$secret = $request->get_param( 'secret' );
		if ( is_string( $secret ) && $secret !== '' ) {
			$webhookData['secret'] = $secret;
		}

		$id = Webhook::create( $webhookData );

		if ( $id === false ) {
			return $this->error(
				'resa_create_failed',
				__( 'Webhook konnte nicht erstellt werden.', 'resa' ),
				500
			);
		}

		$webhook = Webhook::findById( $id );

		return $this->success( self::formatWebhook( $webhook ), 201 );
	}

	/**
	 * PUT /admin/webhooks/{id} — Update a webhook.
	 */
	public function update( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$gate = $this->checkFeatureGate();
		if ( $gate !== null ) {
			return $gate;
		}

		$id      = (int) $request->get_param( 'id' );
		$webhook = Webhook::findById( $id );

		if ( ! $webhook ) {
			return $this->error(
				ErrorMessages::WEBHOOK_NOT_FOUND,
				ErrorMessages::get( ErrorMessages::WEBHOOK_NOT_FOUND ),
				404
			);
		}

		$updateData = [];
		$params     = $request->get_json_params();

		$stringFields = [ 'name', 'url', 'secret' ];
		foreach ( $stringFields as $field ) {
			if ( array_key_exists( $field, $params ) ) {
				$updateData[ $field ] = (string) $params[ $field ];
			}
		}

		// Validate URL if provided.
		if ( isset( $updateData['url'] ) && ! filter_var( $updateData['url'], FILTER_VALIDATE_URL ) ) {
			return $this->error(
				ErrorMessages::WEBHOOK_INVALID_URL,
				ErrorMessages::get( ErrorMessages::WEBHOOK_INVALID_URL ),
				400
			);
		}

		if ( array_key_exists( 'events', $params ) ) {
			$updateData['events'] = $params['events'];
		}

		if ( array_key_exists( 'isActive', $params ) ) {
			$updateData['is_active'] = $params['isActive'];
		}

		$success = Webhook::update( $id, $updateData );

		if ( ! $success ) {
			return $this->error(
				'resa_update_failed',
				__( 'Webhook konnte nicht aktualisiert werden.', 'resa' ),
				500
			);
		}

		$webhook = Webhook::findById( $id );

		return $this->success( self::formatWebhook( $webhook ) );
	}

	/**
	 * DELETE /admin/webhooks/{id} — Delete a webhook.
	 */
	public function destroy( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$gate = $this->checkFeatureGate();
		if ( $gate !== null ) {
			return $gate;
		}

		$id      = (int) $request->get_param( 'id' );
		$webhook = Webhook::findById( $id );

		if ( ! $webhook ) {
			return $this->error(
				ErrorMessages::WEBHOOK_NOT_FOUND,
				ErrorMessages::get( ErrorMessages::WEBHOOK_NOT_FOUND ),
				404
			);
		}

		$success = Webhook::delete( $id );

		if ( ! $success ) {
			return $this->error(
				'resa_delete_failed',
				__( 'Webhook konnte nicht gelöscht werden.', 'resa' ),
				500
			);
		}

		return $this->success( [ 'deleted' => true ] );
	}

	/**
	 * POST /admin/webhooks/{id}/test — Send a test payload.
	 */
	public function test( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$gate = $this->checkFeatureGate();
		if ( $gate !== null ) {
			return $gate;
		}

		$id      = (int) $request->get_param( 'id' );
		$webhook = Webhook::findById( $id );

		if ( ! $webhook ) {
			return $this->error(
				ErrorMessages::WEBHOOK_NOT_FOUND,
				ErrorMessages::get( ErrorMessages::WEBHOOK_NOT_FOUND ),
				404
			);
		}

		$dispatcher = new WebhookDispatcher();
		$result     = $dispatcher->sendTest( $webhook );

		return $this->success( $result );
	}

	/**
	 * Check the feature gate for webhook access.
	 *
	 * @return \WP_Error|null Error if not allowed, null if OK.
	 */
	private function checkFeatureGate(): ?\WP_Error {
		$plugin = Plugin::getInstance();
		if ( $plugin && ! $plugin->getFeatureGate()->canUseWebhooks() ) {
			return $this->error(
				'resa_feature_restricted',
				__( 'Webhooks sind nur mit Premium verfügbar.', 'resa' ),
				403
			);
		}

		return null;
	}

	/**
	 * Format a webhook row for API responses.
	 *
	 * @param object|null $webhook Webhook row.
	 * @return array<string,mixed>
	 */
	private static function formatWebhook( ?object $webhook ): array {
		if ( ! $webhook ) {
			return [];
		}

		return [
			'id'        => (int) $webhook->id,
			'name'      => $webhook->name,
			'url'       => $webhook->url,
			'secret'    => $webhook->secret,
			'events'    => json_decode( $webhook->events ?? '[]', true ) ?: [],
			'isActive'  => (bool) $webhook->is_active,
			'createdAt' => $webhook->created_at,
			'updatedAt' => $webhook->updated_at,
		];
	}
}
