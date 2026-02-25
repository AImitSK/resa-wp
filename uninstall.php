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

// phpcs:disable Squiz.PHP.CommentedOutCode.Found -- Phase 2.2: wird aktiviert wenn DB-Schema steht.
// global $wpdb;
// $tables = [
//     $wpdb->prefix . 'resa_leads',
//     $wpdb->prefix . 'resa_tracking_daily',
//     $wpdb->prefix . 'resa_locations',
//     $wpdb->prefix . 'resa_email_log',
//     $wpdb->prefix . 'resa_agents',
//     $wpdb->prefix . 'resa_agent_locations',
// ];
// foreach ( $tables as $table ) {
//     $wpdb->query( $wpdb->prepare( 'DROP TABLE IF EXISTS %i', $table ) );
// }

// Transients aufräumen.
delete_transient( 'resa_activation_redirect' );
