<?php

declare( strict_types=1 );

namespace Resa\Api;

use Resa\Core\ErrorMessages;
use Resa\Core\Plugin;
use Resa\Freemius\FeatureGate;

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
			return $this->notFound( ErrorMessages::getWithParam( 'module_not_found', $slug ) );
		}

		// Toggle activation state.
		$newState = ! $module->isActive();

		// Check feature gate before activation.
		if ( $newState ) {
			$featureGate = new FeatureGate( $registry );

			if ( ! $featureGate->canActivateModule( $slug ) ) {
				$module_obj = $registry->get( $slug );
				$flag       = $module_obj ? $module_obj->getFlag() : 'unknown';

				if ( $flag === 'pro' ) {
					return $this->error(
						'resa_upgrade_required',
						__( 'Dieses Modul erfordert ein Premium-Upgrade.', 'resa' ),
						403
					);
				}

				return $this->error(
					'resa_module_limit_reached',
					__( 'Modul-Limit erreicht. Deaktiviere ein anderes Modul oder upgrade auf Premium.', 'resa' ),
					403
				);
			}
		}

		$module->setActive( $newState );

		return $this->success( [
			'slug'   => $slug,
			'active' => $newState,
		] );
	}
}
