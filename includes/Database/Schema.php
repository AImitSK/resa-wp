<?php

declare( strict_types=1 );

namespace Resa\Database;

/**
 * Database schema management.
 *
 * Creates and migrates all resa_* custom tables via dbDelta().
 * Versioned migrations allow incremental schema updates.
 */
final class Schema {

	/**
	 * Current schema version.
	 */
	public const VERSION = '0.4.0';

	/**
	 * Run migrations from the given version to current.
	 *
	 * @param string $fromVersion Previously installed schema version.
	 */
	public static function migrate( string $fromVersion ): void {
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		if ( version_compare( $fromVersion, '0.1.0', '<' ) ) {
			self::migrateToV010();
		}

		if ( version_compare( $fromVersion, '0.2.0', '<' ) ) {
			self::migrateToV020();
		}

		if ( version_compare( $fromVersion, '0.3.0', '<' ) ) {
			self::migrateToV030();
		}

		if ( version_compare( $fromVersion, '0.4.0', '<' ) ) {
			self::migrateToV040();
		}

		update_option( 'resa_db_version', self::VERSION );
	}

	/**
	 * Drop all custom tables. Called on uninstall.
	 */
	public static function dropAll(): void {
		global $wpdb;

		$tables = self::getTableNames();

		foreach ( $tables as $table ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.SchemaChange,WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->query(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				"DROP TABLE IF EXISTS {$table}"
			);
		}

		delete_option( 'resa_db_version' );
	}

	/**
	 * Get all custom table names (with WP prefix).
	 *
	 * @return string[]
	 */
	public static function getTableNames(): array {
		global $wpdb;

		return [
			$wpdb->prefix . 'resa_leads',
			$wpdb->prefix . 'resa_tracking_daily',
			$wpdb->prefix . 'resa_locations',
			$wpdb->prefix . 'resa_email_log',
			$wpdb->prefix . 'resa_agents',
			$wpdb->prefix . 'resa_agent_locations',
			$wpdb->prefix . 'resa_module_settings',
		];
	}

	/**
	 * Check if a migration is needed.
	 */
	public static function needsMigration(): bool {
		$installed = (string) get_option( 'resa_db_version', '' );
		return version_compare( $installed, self::VERSION, '<' );
	}

	/**
	 * Initial schema — v0.1.0.
	 *
	 * Creates all 6 base tables.
	 */
	private static function migrateToV010(): void {
		global $wpdb;

		$charset = $wpdb->get_charset_collate();
		$prefix  = $wpdb->prefix;

		// dbDelta requires: each field on its own line, two spaces before PRIMARY KEY,
		// KEY instead of INDEX, no trailing commas, no IF NOT EXISTS.

		$sql = "CREATE TABLE {$prefix}resa_leads (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  session_id varchar(36) NOT NULL,
  asset_type varchar(50) NOT NULL,
  location_id bigint(20) unsigned NOT NULL DEFAULT 0,
  agent_id bigint(20) unsigned DEFAULT NULL,
  status varchar(20) NOT NULL DEFAULT 'partial',
  first_name varchar(100) DEFAULT NULL,
  last_name varchar(100) DEFAULT NULL,
  email varchar(255) DEFAULT NULL,
  phone varchar(50) DEFAULT NULL,
  company varchar(200) DEFAULT NULL,
  salutation varchar(10) DEFAULT NULL,
  message text DEFAULT NULL,
  consent_given tinyint(1) NOT NULL DEFAULT 0,
  consent_text text DEFAULT NULL,
  consent_date datetime DEFAULT NULL,
  inputs longtext NOT NULL,
  result longtext DEFAULT NULL,
  meta longtext DEFAULT NULL,
  notes text DEFAULT NULL,
  gclid varchar(255) DEFAULT NULL,
  fbclid varchar(255) DEFAULT NULL,
  pdf_sent tinyint(1) NOT NULL DEFAULT 0,
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at datetime DEFAULT NULL,
  expires_at datetime DEFAULT NULL,
  PRIMARY KEY  (id),
  KEY idx_session (session_id),
  KEY idx_status (status),
  KEY idx_asset (asset_type),
  KEY idx_location (location_id),
  KEY idx_agent (agent_id),
  KEY idx_created (created_at),
  KEY idx_email (email(191)),
  KEY idx_gclid (gclid(191)),
  KEY idx_expires (expires_at)
) {$charset};

CREATE TABLE {$prefix}resa_tracking_daily (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  date date NOT NULL,
  asset_type varchar(50) NOT NULL,
  location_id bigint(20) unsigned DEFAULT NULL,
  views int(10) unsigned NOT NULL DEFAULT 0,
  starts int(10) unsigned NOT NULL DEFAULT 0,
  form_views int(10) unsigned NOT NULL DEFAULT 0,
  form_submits int(10) unsigned NOT NULL DEFAULT 0,
  result_views int(10) unsigned NOT NULL DEFAULT 0,
  start_rate decimal(5,2) DEFAULT NULL,
  completion_rate decimal(5,2) DEFAULT NULL,
  conversion_rate decimal(5,2) DEFAULT NULL,
  PRIMARY KEY  (id),
  UNIQUE KEY idx_date_asset_loc (date,asset_type,location_id),
  KEY idx_date (date)
) {$charset};

CREATE TABLE {$prefix}resa_locations (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  slug varchar(100) NOT NULL,
  name varchar(255) NOT NULL,
  country varchar(2) NOT NULL DEFAULT 'DE',
  bundesland varchar(100) DEFAULT NULL,
  region_type varchar(20) NOT NULL DEFAULT 'city',
  currency varchar(3) NOT NULL DEFAULT 'EUR',
  data longtext NOT NULL,
  factors longtext DEFAULT NULL,
  agent_id bigint(20) unsigned DEFAULT NULL,
  is_active tinyint(1) NOT NULL DEFAULT 1,
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY  (id),
  UNIQUE KEY idx_slug (slug),
  KEY idx_active (is_active)
) {$charset};

CREATE TABLE {$prefix}resa_email_log (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  lead_id bigint(20) unsigned NOT NULL,
  template_id varchar(100) NOT NULL,
  recipient varchar(255) NOT NULL,
  subject varchar(500) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'sent',
  error_message text DEFAULT NULL,
  sent_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  opened_at datetime DEFAULT NULL,
  clicked_at datetime DEFAULT NULL,
  PRIMARY KEY  (id),
  KEY idx_lead (lead_id),
  KEY idx_status (status)
) {$charset};

CREATE TABLE {$prefix}resa_agents (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  wp_user_id bigint(20) unsigned DEFAULT NULL,
  name varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  phone varchar(50) DEFAULT NULL,
  photo_url varchar(500) DEFAULT NULL,
  is_active tinyint(1) NOT NULL DEFAULT 1,
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY  (id),
  KEY idx_wp_user (wp_user_id),
  KEY idx_active (is_active)
) {$charset};

CREATE TABLE {$prefix}resa_agent_locations (
  agent_id bigint(20) unsigned NOT NULL,
  location_id bigint(20) unsigned NOT NULL,
  PRIMARY KEY  (agent_id,location_id),
  KEY idx_location (location_id)
) {$charset};";

		dbDelta( $sql );
	}

	/**
	 * v0.2.0 — Add module settings table.
	 *
	 * Stores per-module configuration (factors, location values)
	 * separate from locations.
	 */
	private static function migrateToV020(): void {
		global $wpdb;

		$charset = $wpdb->get_charset_collate();
		$prefix  = $wpdb->prefix;

		$sql = "CREATE TABLE {$prefix}resa_module_settings (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  module_slug varchar(50) NOT NULL,
  setup_mode varchar(20) NOT NULL DEFAULT 'pauschal',
  region_preset varchar(30) DEFAULT 'medium_city',
  factors longtext DEFAULT NULL,
  location_values longtext DEFAULT NULL,
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY  (id),
  UNIQUE KEY idx_module_slug (module_slug)
) {$charset};";

		dbDelta( $sql );
	}

	/**
	 * v0.3.0 — Extend agents table with company info.
	 *
	 * Adds columns for company name, address, website, and imprint URL.
	 */
	private static function migrateToV030(): void {
		global $wpdb;

		$table = $wpdb->prefix . 'resa_agents';

		// Add company column if not exists.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$company_exists = $wpdb->get_var(
			"SHOW COLUMNS FROM {$table} LIKE 'company'"
		);
		if ( ! $company_exists ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.SchemaChange,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$wpdb->query( "ALTER TABLE {$table} ADD COLUMN company VARCHAR(255) DEFAULT NULL AFTER photo_url" );
		}

		// Add address column if not exists.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$address_exists = $wpdb->get_var(
			"SHOW COLUMNS FROM {$table} LIKE 'address'"
		);
		if ( ! $address_exists ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.SchemaChange,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$wpdb->query( "ALTER TABLE {$table} ADD COLUMN address TEXT DEFAULT NULL AFTER company" );
		}

		// Add website column if not exists.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$website_exists = $wpdb->get_var(
			"SHOW COLUMNS FROM {$table} LIKE 'website'"
		);
		if ( ! $website_exists ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.SchemaChange,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$wpdb->query( "ALTER TABLE {$table} ADD COLUMN website VARCHAR(500) DEFAULT NULL AFTER address" );
		}

		// Add imprint_url column if not exists.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$imprint_exists = $wpdb->get_var(
			"SHOW COLUMNS FROM {$table} LIKE 'imprint_url'"
		);
		if ( ! $imprint_exists ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.SchemaChange,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$wpdb->query( "ALTER TABLE {$table} ADD COLUMN imprint_url VARCHAR(500) DEFAULT NULL AFTER website" );
		}
	}

	/**
	 * v0.4.0 — Add location coordinates for maps.
	 *
	 * Adds latitude, longitude, and zoom_level columns to resa_locations.
	 */
	private static function migrateToV040(): void {
		global $wpdb;

		$table = $wpdb->prefix . 'resa_locations';

		// Add latitude column if not exists.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$latitude_exists = $wpdb->get_var(
			"SHOW COLUMNS FROM {$table} LIKE 'latitude'"
		);
		if ( ! $latitude_exists ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.SchemaChange,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$wpdb->query( "ALTER TABLE {$table} ADD COLUMN latitude DECIMAL(10,8) DEFAULT NULL AFTER currency" );
		}

		// Add longitude column if not exists.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$longitude_exists = $wpdb->get_var(
			"SHOW COLUMNS FROM {$table} LIKE 'longitude'"
		);
		if ( ! $longitude_exists ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.SchemaChange,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$wpdb->query( "ALTER TABLE {$table} ADD COLUMN longitude DECIMAL(11,8) DEFAULT NULL AFTER latitude" );
		}

		// Add zoom_level column if not exists.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$zoom_exists = $wpdb->get_var(
			"SHOW COLUMNS FROM {$table} LIKE 'zoom_level'"
		);
		if ( ! $zoom_exists ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.SchemaChange,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$wpdb->query( "ALTER TABLE {$table} ADD COLUMN zoom_level TINYINT UNSIGNED DEFAULT 13 AFTER longitude" );
		}
	}
}
