<?php

declare( strict_types=1 );

namespace Resa\Admin;

use Resa\Core\Vite;

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
			'resa-communication' => __( 'Kommunikation', 'resa' ),
			'resa-pdf'           => __( 'PDF-Vorlagen', 'resa' ),
			'resa-shortcode'     => __( 'Shortcode', 'resa' ),
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

		// Pass context to React app.
		wp_localize_script(
			'resa-admin',
			'resaAdmin',
			[
				'restUrl'  => esc_url_raw( rest_url( 'resa/v1/' ) ),
				'nonce'    => wp_create_nonce( 'wp_rest' ),
					// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Reading WP admin page slug, no form data.
				'page'     => isset( $_GET['page'] ) ? sanitize_key( $_GET['page'] ) : 'resa',
				'adminUrl' => esc_url_raw( admin_url( 'admin.php' ) ),
				'version'  => RESA_VERSION,
			]
		);
	}

	/**
	 * Render the React SPA container (shared by all pages).
	 */
	public function renderPage(): void {
		echo '<div class="wrap"><div id="resa-admin-root"></div></div>';
	}
}
