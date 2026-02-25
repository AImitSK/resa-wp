<?php

declare( strict_types=1 );

namespace Resa\Admin;

use Resa\Core\Vite;

/**
 * Registers RESA admin pages in the WordPress dashboard.
 */
final class AdminPage {

    private Vite $vite;

    /** @var string The hook suffix returned by add_menu_page. */
    private string $hookSuffix = '';

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
     * Add RESA menu to WP-Admin sidebar.
     */
    public function addMenuPages(): void {
        $this->hookSuffix = (string) add_menu_page(
            __( 'RESA Dashboard', 'resa' ),
            'RESA',
            'manage_options',
            'resa',
            [ $this, 'renderDashboard' ],
            'dashicons-chart-area',
            30
        );
    }

    /**
     * Enqueue admin assets only on RESA pages.
     */
    public function enqueueAssets( string $hookSuffix ): void {
        if ( $hookSuffix !== $this->hookSuffix ) {
            return;
        }

        $this->vite->enqueue( 'src/admin/main.tsx', 'resa-admin' );
    }

    /**
     * Render the admin dashboard page.
     */
    public function renderDashboard(): void {
        echo '<div class="wrap"><div id="resa-admin-root"></div></div>';
    }
}
