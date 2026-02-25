<?php

declare( strict_types=1 );

namespace Resa\Core;

/**
 * Handles plugin deactivation.
 *
 * Cleans up transients, scheduled events, and temporary data.
 * Does NOT delete user data — that happens in uninstall.php.
 */
final class Deactivator {

	/**
	 * Run on plugin deactivation.
	 */
	public static function deactivate(): void {
		// Clean up transients.
		delete_transient( 'resa_activation_redirect' );

		// Remove scheduled events.
		wp_clear_scheduled_hook( 'resa_daily_cleanup' );

		// Flush rewrite rules.
		flush_rewrite_rules();
	}
}
