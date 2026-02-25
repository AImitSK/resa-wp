<?php

declare( strict_types=1 );

namespace Resa\Core;

/**
 * Main plugin bootstrap class.
 *
 * Initializes the plugin, registers hooks, and orchestrates
 * all core services. Entry point is Plugin::init().
 */
final class Plugin {

    private static ?self $instance = null;

    private function __construct() {
        // Use init() to create the instance.
    }

    /**
     * Initialize the plugin. Safe to call multiple times.
     */
    public static function init(): void {
        if ( self::$instance !== null ) {
            return;
        }

        self::$instance = new self();
        self::$instance->registerHooks();
    }

    /**
     * Get the plugin instance (available after init).
     */
    public static function getInstance(): ?self {
        return self::$instance;
    }

    /**
     * Register all WordPress hooks.
     */
    private function registerHooks(): void {
        // Activation & Deactivation.
        register_activation_hook( RESA_PLUGIN_FILE, [ Activator::class, 'activate' ] );
        register_deactivation_hook( RESA_PLUGIN_FILE, [ Deactivator::class, 'deactivate' ] );

        // Core hooks.
        add_action( 'init', [ $this, 'loadTextDomain' ] );
        add_action( 'plugins_loaded', [ $this, 'boot' ] );
    }

    /**
     * Load plugin text domain for translations.
     */
    public function loadTextDomain(): void {
        load_plugin_textdomain(
            'resa',
            false,
            dirname( RESA_PLUGIN_BASENAME ) . '/languages'
        );
    }

    /**
     * Boot all plugin services.
     *
     * Called on `plugins_loaded`. Services, REST-API, Admin-Menü,
     * Module-Registry etc. werden hier Schritt für Schritt ergänzt.
     */
    public function boot(): void {
        // Phase 2+: Services werden hier registriert.
        // - REST API (Phase 2.1)
        // - Database migration check (Phase 2.2)
        // - ModuleRegistry (Phase 2.3)
        // - FeatureGate (Phase 2.4)
        // - Admin pages (Phase 3.2)
        // - Shortcode (Phase 3.3)
    }
}
