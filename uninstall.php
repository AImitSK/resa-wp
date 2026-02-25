<?php
/**
 * RESA Uninstall.
 *
 * Wird ausgeführt wenn das Plugin über das WordPress-Dashboard gelöscht wird.
 * Entfernt alle Plugin-Daten vollständig aus der Datenbank.
 *
 * Hinweis: Freemius after_uninstall Hook wird in Phase 2.4 ergänzt.
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

// Autoloader laden für Schema::dropAll().
if ( file_exists( __DIR__ . '/vendor/autoload.php' ) ) {
	require_once __DIR__ . '/vendor/autoload.php';
	Resa\Database\Schema::dropAll();
}

// Plugin-Optionen entfernen.
$resa_options = [
	'resa_version',
	'resa_db_version',
	'resa_installed_at',
	'resa_settings',
];

foreach ( $resa_options as $option ) {
	delete_option( $option );
}

// Transients aufräumen.
delete_transient( 'resa_activation_redirect' );
