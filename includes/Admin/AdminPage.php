<?php

declare( strict_types=1 );

namespace Resa\Admin;

use Resa\Core\Plugin;
use Resa\Core\Vite;
use Resa\Freemius\FeatureGate;
use Resa\Models\Location;

/**
 * Registers RESA admin pages in the WordPress dashboard.
 *
 * All submenus render the same React SPA container.
 * The current page slug is passed to JavaScript so
 * React Router can show the correct view.
 */
final class AdminPage {

	private Vite $vite;

	/** @var string[] Hook suffixes for all registered RESA pages. */
	private array $hookSuffixes = [];

	/**
	 * Get submenu definitions with translated labels.
	 *
	 * @return array<string, string> slug => label
	 */
	private function getSubmenus(): array {
		return [
			'resa'               => __( 'Dashboard', 'resa' ),
			'resa-leads'         => __( 'Leads', 'resa' ),
			'resa-modules'       => __( 'Smart Assets', 'resa' ),
			'resa-locations'     => __( 'Standorte', 'resa' ),
			'resa-templates'     => __( 'Vorlagen', 'resa' ),
			'resa-integrations'  => __( 'Integrationen', 'resa' ),
			'resa-settings'      => __( 'Einstellungen', 'resa' ),
		];
	}

	public function __construct( Vite $vite ) {
		$this->vite = $vite;
	}

	/**
	 * Register hooks for admin pages.
	 */
	public function register(): void {
		add_action( 'admin_menu', [ $this, 'addMenuPages' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueueAssets' ] );
	}

	/**
	 * Add RESA menu and submenus to WP-Admin sidebar.
	 */
	public function addMenuPages(): void {
		// Parent menu.
		$hook = (string) add_menu_page(
			__( 'RESA Dashboard', 'resa' ),
			'RESA',
			'manage_options',
			'resa',
			[ $this, 'renderPage' ],
			'dashicons-chart-area',
			30
		);

		$this->hookSuffixes[] = $hook;

		// Submenus (first entry replaces the parent duplicate).
		foreach ( $this->getSubmenus() as $slug => $label ) {
			$pageTitle = sprintf(
				/* translators: %s: submenu page title */
				__( 'RESA — %s', 'resa' ),
				$label
			);

			$subHook = (string) add_submenu_page(
				'resa',
				$pageTitle,
				esc_html( $label ),
				'manage_options',
				$slug,
				[ $this, 'renderPage' ]
			);

			$this->hookSuffixes[] = $subHook;
		}
	}

	/**
	 * Enqueue admin assets only on RESA pages.
	 */
	public function enqueueAssets( string $hookSuffix ): void {
		if ( ! in_array( $hookSuffix, $this->hookSuffixes, true ) ) {
			return;
		}

		$this->vite->enqueue( 'src/admin/main.tsx', 'resa-admin' );

		// WordPress Media Library for logo upload.
		wp_enqueue_media();

		// Build feature gate data for frontend.
		$featureData = $this->getFeatureGateData();

		// Collect integration tabs registered by add-on plugins.
		$addon_tabs = apply_filters( 'resa_integration_tabs', [] );

		// Pass context to React app.
		wp_localize_script(
			'resa-admin',
			'resaAdmin',
			[
				'restUrl'           => esc_url_raw( rest_url( 'resa/v1/' ) ),
				'nonce'             => wp_create_nonce( 'wp_rest' ),
					// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Reading WP admin page slug, no form data.
				'page'              => isset( $_GET['page'] ) ? sanitize_key( $_GET['page'] ) : 'resa',
				'adminUrl'          => esc_url_raw( admin_url( 'admin.php' ) ),
				'pluginUrl'         => esc_url_raw( RESA_PLUGIN_URL ),
				'version'           => RESA_VERSION,
				'features'          => $featureData,
				'locationCount'     => Location::count(),
				'siteName'          => get_bloginfo( 'name' ),
				'adminEmail'        => get_option( 'admin_email', '' ),
				'integrationTabs'   => $addon_tabs,
			]
		);
	}

	/**
	 * Render the React SPA container (shared by all pages).
	 *
	 * When Freemius opt-in is pending, renders the SDK connect page
	 * instead of the React app so the user can complete registration.
	 */
	public function renderPage(): void {
		// Show Freemius connect page when not yet registered.
		if ( $this->shouldShowFreemiusConnect() ) {
			resa_fs()->_connect_page_render();
			return;
		}

		echo '<div class="wrap">';
		echo '<h1 class="wp-heading-inline" style="display:none;">'
			. esc_html( get_admin_page_title() )
			. '</h1>';
		echo '<hr class="wp-header-end">';
		echo '<div id="resa-admin-root"></div>';
		echo '</div>';
	}

	/**
	 * Whether to show the Freemius connect/opt-in page instead of the SPA.
	 */
	private function shouldShowFreemiusConnect(): bool {
		if ( ! function_exists( 'resa_fs' ) || ! resa_fs() ) {
			return false;
		}

		$fs = resa_fs();

		// Only on the main RESA page.
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$page = isset( $_GET['page'] ) ? sanitize_key( $_GET['page'] ) : '';
		if ( 'resa' !== $page ) {
			return false;
		}

		// Show connect page when not registered and not anonymous (skipped).
		return ! $fs->is_registered() && ! $fs->is_anonymous();
	}

	/**
	 * Get feature gate data for the frontend.
	 *
	 * @return array<string, mixed>
	 */
	private function getFeatureGateData(): array {
		$plugin = Plugin::getInstance();
		if ( ! $plugin ) {
			// Fallback to free plan limits.
			return [
				'plan'          => 'free',
				'is_trial'      => false,
				'max_modules'   => FeatureGate::FREE_MAX_MODULES,
				'max_locations' => FeatureGate::FREE_MAX_LOCATIONS,
				'max_leads'     => FeatureGate::FREE_MAX_LEADS,
			];
		}

		$featureGate = new FeatureGate( $plugin->getModuleRegistry() );

		return $featureGate->toArray();
	}
}
