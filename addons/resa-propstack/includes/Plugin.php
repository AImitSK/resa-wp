<?php
/**
 * Plugin Bootstrap
 *
 * @package Resa\Propstack
 */

namespace Resa\Propstack;

/**
 * Main plugin class - bootstraps hooks and filters
 */
class Plugin {
	/**
	 * Register all plugin hooks
	 *
	 * @return void
	 */
	public static function register(): void {
		// Run migration on activation (handled in main plugin file)
		// register_activation_hook() must be called from main plugin file

		// Register REST API endpoints
		add_action('rest_api_init', [PropstackController::class, 'registerRoutes']);

		// Hook into lead creation
		add_action('resa_lead_created', [new PropstackSync(), 'onLeadCreated']);

		// Register Propstack tab in integrations page
		add_filter('resa_integration_tabs', [self::class, 'registerTab']);
	}

	/**
	 * Register Propstack tab
	 *
	 * @param array $tabs Existing tabs.
	 * @return array Modified tabs.
	 */
	public static function registerTab(array $tabs): array {
		$tabs[] = [
			'slug'  => 'propstack',
			'label' => __('Propstack', 'resa-propstack'),
		];
		return $tabs;
	}
}
