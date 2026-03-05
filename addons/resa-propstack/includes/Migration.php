<?php
/**
 * Database Migration
 *
 * @package Resa\Propstack
 */

namespace Resa\Propstack;

/**
 * Handles database schema migrations for Propstack add-on
 */
class Migration {
	/**
	 * WordPress option key for tracking migration version
	 */
	private const OPTION_KEY = 'resa_propstack_db_version';

	/**
	 * Current database schema version
	 */
	private const CURRENT_VERSION = '1.0.0';

	/**
	 * Run all pending migrations
	 *
	 * @return void
	 */
	public static function run(): void {
		$installed = get_option(self::OPTION_KEY, '0');

		// Initial migration
		if (version_compare($installed, '1.0.0', '<')) {
			self::migrateToV100();
		}

		// Update version marker
		update_option(self::OPTION_KEY, self::CURRENT_VERSION);
	}

	/**
	 * Migration to version 1.0.0
	 *
	 * Adds Propstack sync columns to resa_leads table
	 *
	 * @return void
	 */
	private static function migrateToV100(): void {
		global $wpdb;
		$table = $wpdb->prefix . 'resa_leads';

		// Add propstack_id column (foreign key to Propstack contact)
		self::addColumnIfNotExists(
			$table,
			'propstack_id',
			'BIGINT DEFAULT NULL COMMENT "Propstack contact ID"'
		);

		// Add propstack_synced flag
		self::addColumnIfNotExists(
			$table,
			'propstack_synced',
			'TINYINT(1) NOT NULL DEFAULT 0 COMMENT "1 = successfully synced, 0 = pending/failed"'
		);

		// Add propstack_error for error messages
		self::addColumnIfNotExists(
			$table,
			'propstack_error',
			'TEXT DEFAULT NULL COMMENT "Last sync error message"'
		);

		// Add propstack_synced_at timestamp
		self::addColumnIfNotExists(
			$table,
			'propstack_synced_at',
			'DATETIME DEFAULT NULL COMMENT "Last successful sync timestamp"'
		);

		// Add index on propstack_synced for query performance
		self::addIndexIfNotExists($table, 'idx_propstack_synced', 'propstack_synced');

		error_log('[RESA Propstack] Migration to v1.0.0 completed');
	}

	/**
	 * Add column to table if it doesn't exist
	 *
	 * @param string $table      Table name (with prefix).
	 * @param string $column     Column name.
	 * @param string $definition Column definition (type, default, constraints).
	 * @return bool True if column was added or already exists.
	 */
	private static function addColumnIfNotExists(string $table, string $column, string $definition): bool {
		global $wpdb;

		// Check if column exists
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$exists = $wpdb->get_results(
			$wpdb->prepare(
				'SHOW COLUMNS FROM `%s` LIKE %s',
				$table,
				$column
			)
		);

		if (!empty($exists)) {
			return true; // Already exists
		}

		// Add column
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange
		$result = $wpdb->query(
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			"ALTER TABLE `{$table}` ADD COLUMN `{$column}` {$definition}"
		);

		if ($result === false) {
			error_log(sprintf(
				'[RESA Propstack] Failed to add column %s to table %s',
				$column,
				$table
			));
			return false;
		}

		error_log(sprintf(
			'[RESA Propstack] Added column %s to table %s',
			$column,
			$table
		));

		return true;
	}

	/**
	 * Add index to table if it doesn't exist
	 *
	 * @param string $table     Table name (with prefix).
	 * @param string $indexName Index name.
	 * @param string $column    Column(s) to index.
	 * @return bool True if index was added or already exists.
	 */
	private static function addIndexIfNotExists(string $table, string $indexName, string $column): bool {
		global $wpdb;

		// Check if index exists
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$exists = $wpdb->get_results(
			$wpdb->prepare(
				'SHOW INDEX FROM `%s` WHERE Key_name = %s',
				$table,
				$indexName
			)
		);

		if (!empty($exists)) {
			return true; // Already exists
		}

		// Add index
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange
		$result = $wpdb->query(
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			"ALTER TABLE `{$table}` ADD INDEX `{$indexName}` (`{$column}`)"
		);

		if ($result === false) {
			error_log(sprintf(
				'[RESA Propstack] Failed to add index %s to table %s',
				$indexName,
				$table
			));
			return false;
		}

		error_log(sprintf(
			'[RESA Propstack] Added index %s to table %s',
			$indexName,
			$table
		));

		return true;
	}
}
