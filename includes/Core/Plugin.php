<?php

declare( strict_types=1 );

namespace Resa\Core;

use Resa\Admin\AdminPage;
use Resa\Api\AgentsController;
use Resa\Api\BrandingController;
use Resa\Api\EmailTemplatesController;
use Resa\Api\GeocodingController;
use Resa\Api\HealthController;
use Resa\Api\LeadsController;
use Resa\Api\LocationsController;
use Resa\Api\MapSettingsController;
use Resa\Api\ModulesController;
use Resa\Api\ModuleSettingsController;
use Resa\Api\PdfSettingsController;
use Resa\Api\RecaptchaSettingsController;
use Resa\Api\TrackingController;
use Resa\Api\TrackingSettingsController;
use Resa\Api\PrivacySettingsController;
use Resa\Api\ApiKeysController;
use Resa\Api\ExternalController;
use Resa\Api\MessengersController;
use Resa\Api\WebhooksController;
use Resa\Cron\PartialLeadCleanup;
use Resa\Cron\DataRetentionCleanup;
use Resa\Privacy\PersonalDataExporter;
use Resa\Privacy\PersonalDataEraser;
use Resa\Database\Schema;
use Resa\Services\Auth\ApiKeyAuth;
use Resa\Core\ModuleRegistry;
use Resa\Freemius\FeatureGate;
use Resa\Services\Integration\MessengerDispatcher;
use Resa\Services\Integration\WebhookDispatcher;
use Resa\Shortcode\ResaShortcode;

/**
 * Main plugin bootstrap class.
 *
 * Initializes the plugin, registers hooks, and orchestrates
 * all core services. Entry point is Plugin::init().
 */
final class Plugin {

	private static ?self $instance = null;
	private Vite $vite;
	private ModuleRegistry $moduleRegistry;
	private FeatureGate $featureGate;

	private function __construct() {
		$this->vite           = new Vite();
		$this->moduleRegistry = new ModuleRegistry();
		$this->featureGate    = new FeatureGate( $this->moduleRegistry );
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
	 * Get the module registry.
	 */
	public function getModuleRegistry(): ModuleRegistry {
		return $this->moduleRegistry;
	}

	/**
	 * Get the feature gate.
	 */
	public function getFeatureGate(): FeatureGate {
		return $this->featureGate;
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
		add_action( 'rest_api_init', [ $this, 'registerRestRoutes' ] );
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
		// Auto-migrate database if version mismatch (e.g. after plugin update).
		if ( Schema::needsMigration() ) {
			$dbVersion = (string) get_option( 'resa_db_version', '' );
			Schema::migrate( $dbVersion );
		}

		// API key authentication for external endpoints.
		ApiKeyAuth::register();

		// Admin pages.
		if ( is_admin() ) {
			$adminPage = new AdminPage( $this->vite );
			$adminPage->register();
		}

		// Module discovery & registration.
		$this->moduleRegistry->discover();

		// [resa] shortcode for frontend widget embedding.
		$shortcode = new ResaShortcode( $this->vite );
		$shortcode->register();

		// Partial lead cleanup cron job.
		PartialLeadCleanup::register();

		// Data retention cleanup cron job (GDPR retention periods).
		DataRetentionCleanup::register();

		// WordPress Privacy Tools integration (GDPR Art. 15/17/20).
		PersonalDataExporter::register();
		PersonalDataEraser::register();

		// Webhook dispatcher — fires on lead creation.
		$webhookDispatcher = new WebhookDispatcher();
		add_action( 'resa_lead_created', [ $webhookDispatcher, 'onLeadCreated' ] );

		// Messenger dispatcher — fires on lead creation (Slack, Teams, Discord).
		$messengerDispatcher = new MessengerDispatcher();
		add_action( 'resa_lead_created', [ $messengerDispatcher, 'onLeadCreated' ] );
	}

	/**
	 * Register all REST API routes.
	 *
	 * Called on `rest_api_init`. Each controller registers
	 * its own routes via registerRoutes().
	 */
	public function registerRestRoutes(): void {
		$controllers = [
			new AgentsController(),
			new BrandingController(),
			new EmailTemplatesController(),
			new GeocodingController(),
			new HealthController(),
			new LeadsController(),
			new LocationsController(),
			new MapSettingsController(),
			new ModulesController(),
			new ModuleSettingsController(),
			new PdfSettingsController(),
			new RecaptchaSettingsController(),
			new TrackingController(),
			new TrackingSettingsController(),
			new PrivacySettingsController(),
			new WebhooksController(),
			new MessengersController(),
			new ApiKeysController(),
			new ExternalController(),
		];

		foreach ( $controllers as $controller ) {
			$controller->registerRoutes();
		}

		// Module routes (only active modules).
		$this->moduleRegistry->registerModuleRoutes();
	}
}
