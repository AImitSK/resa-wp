<?php

declare( strict_types=1 );

namespace Resa\Core;

use Resa\Database\Schema;
use Resa\Database\Seeder;

/**
 * Handles plugin activation.
 *
 * Creates database tables, sets default options, and performs
 * any first-time setup needed when the plugin is activated.
 */
final class Activator {

	/**
	 * Run on plugin activation.
	 */
	public static function activate(): void {
		// PHP version guard (catches wp-cli activation without resa.php check).
		if ( version_compare( PHP_VERSION, '8.1', '<' ) ) {
			deactivate_plugins( RESA_PLUGIN_BASENAME );
			wp_die(
				esc_html__( 'RESA benötigt mindestens PHP 8.1.', 'resa' ),
				esc_html__( 'Plugin-Aktivierung fehlgeschlagen', 'resa' ),
				[ 'back_link' => true ]
			);
		}

		// Plugin version.
		update_option( 'resa_version', RESA_VERSION );

		// First install timestamp.
		if ( ! get_option( 'resa_installed_at' ) ) {
			update_option( 'resa_installed_at', current_time( 'mysql' ) );
		}

		// Database schema.
		$dbVersion = (string) get_option( 'resa_db_version', '' );
		Schema::migrate( $dbVersion );
		Seeder::run();

		// Redirect to welcome page after activation.
		set_transient( 'resa_activation_redirect', true, 30 );

		// Flush rewrite rules for custom endpoints.
		flush_rewrite_rules();
	}
}
