<?php

declare( strict_types=1 );

namespace Resa\Api;

/**
 * Health check endpoint for verifying the REST API is functional.
 *
 * GET /wp-json/resa/v1/health
 */
final class HealthController extends RestController {

	/**
	 * Register routes.
	 */
	public function registerRoutes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/health',
			[
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ $this, 'getHealth' ],
				'permission_callback' => [ $this, 'publicAccess' ],
			]
		);
	}

	/**
	 * Return plugin health status.
	 *
	 * @return \WP_REST_Response
	 */
	public function getHealth(): \WP_REST_Response {
		return $this->success(
			[
				'status'  => 'ok',
				'plugin'  => 'resa',
				'version' => RESA_VERSION,
			]
		);
	}
}
