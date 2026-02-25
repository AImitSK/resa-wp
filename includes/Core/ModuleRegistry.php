<?php

declare( strict_types=1 );

namespace Resa\Core;

/**
 * Central registry for all RESA modules.
 *
 * Handles module discovery (scanning `modules/` directory),
 * registration, activation state, and retrieval.
 */
class ModuleRegistry {

	/** @var array<string, ModuleInterface> */
	private array $modules = [];

	/**
	 * Register a module.
	 *
	 * @throws \InvalidArgumentException If slug is already registered.
	 */
	public function register( ModuleInterface $module ): void {
		$slug = $module->getSlug();

		if ( isset( $this->modules[ $slug ] ) ) {
			throw new \InvalidArgumentException(
				sprintf( 'Module "%s" is already registered.', esc_html( $slug ) )
			);
		}

		$this->modules[ $slug ] = $module;
	}

	/**
	 * Get a module by slug.
	 */
	public function get( string $slug ): ?ModuleInterface {
		return $this->modules[ $slug ] ?? null;
	}

	/**
	 * Get all registered modules.
	 *
	 * @return array<string, ModuleInterface>
	 */
	public function getAll(): array {
		return $this->modules;
	}

	/**
	 * Get only active modules.
	 *
	 * @return array<string, ModuleInterface>
	 */
	public function getActive(): array {
		return array_filter(
			$this->modules,
			static fn( ModuleInterface $m ): bool => $m->isActive()
		);
	}

	/**
	 * Get count of active modules.
	 */
	public function getActiveCount(): int {
		return count( $this->getActive() );
	}

	/**
	 * Check if a module is registered.
	 */
	public function has( string $slug ): bool {
		return isset( $this->modules[ $slug ] );
	}

	/**
	 * Discover and load modules from `modules/` directory.
	 *
	 * Each module directory must contain a `module.php` file
	 * that hooks into `resa_register_modules` to register itself.
	 */
	public function discover(): void {
		$modulesDir = RESA_PLUGIN_DIR . 'modules/';

		if ( ! is_dir( $modulesDir ) ) {
			return;
		}

		$entries = glob( $modulesDir . '*/module.php' );

		if ( $entries === false ) {
			return;
		}

		foreach ( $entries as $file ) {
			require_once $file;
		}

		/**
		 * Fires after all module.php files have been loaded.
		 *
		 * Modules hook into this action to register themselves
		 * with the registry.
		 *
		 * @param ModuleRegistry $registry The module registry instance.
		 */
		do_action( 'resa_register_modules', $this );
	}

	/**
	 * Register routes for all active modules.
	 *
	 * Called from Plugin::registerRestRoutes().
	 */
	public function registerModuleRoutes(): void {
		foreach ( $this->getActive() as $module ) {
			$module->registerRoutes();
		}
	}
}
