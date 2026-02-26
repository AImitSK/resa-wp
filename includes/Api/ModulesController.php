<?php

declare( strict_types=1 );

namespace Resa\Api;

use Resa\Core\Plugin;

/**
 * REST API controller for module management.
 *
 * Provides endpoints for listing and toggling module activation.
 *
 * Endpoints:
 *   GET  /admin/modules           — List all modules
 *   POST /admin/modules/{slug}/toggle — Toggle module activation
 */
class ModulesController extends RestController {

	/**
	 * Register REST routes.
	 */
	public function registerRoutes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/admin/modules',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'listModules' ],
				'permission_callback' => [ $this, 'adminAccess' ],
			]
		);

		register_rest_route(
			self::NAMESPACE,
			'/admin/modules/(?P<slug>[a-z0-9-]+)/toggle',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'toggleModule' ],
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
	}

	/**
	 * GET /admin/modules
	 *
	 * Returns all registered modules with their activation state.
	 *
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function listModules( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$plugin = Plugin::getInstance();
		if ( ! $plugin ) {
			return $this->error(
				'resa_plugin_not_initialized',
				__( 'Plugin nicht initialisiert.', 'resa' ),
				500
			);
		}

		$registry = $plugin->getModuleRegistry();
		$modules  = [];

		foreach ( $registry->getAll() as $module ) {
			$modules[] = $module->toArray();
		}

		return $this->success( $modules );
	}

	/**
	 * POST /admin/modules/{slug}/toggle
	 *
	 * Toggles module activation state.
	 *
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function toggleModule( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$slug = $request->get_param( 'slug' );

		$plugin = Plugin::getInstance();
		if ( ! $plugin ) {
			return $this->error(
				'resa_plugin_not_initialized',
				__( 'Plugin nicht initialisiert.', 'resa' ),
				500
			);
		}

		$registry = $plugin->getModuleRegistry();
		$module   = $registry->get( $slug );

		if ( ! $module ) {
			return $this->notFound(
				/* translators: %s: Module slug */
				sprintf( __( 'Modul "%s" nicht gefunden.', 'resa' ), $slug )
			);
		}

		// Toggle activation state.
		$newState = ! $module->isActive();
		$module->setActive( $newState );

		return $this->success( [
			'slug'   => $slug,
			'active' => $newState,
		] );
	}
}
