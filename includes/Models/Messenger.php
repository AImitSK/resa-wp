<?php

declare( strict_types=1 );

namespace Resa\Models;

/**
 * Messenger model — CRUD operations for the resa_messengers table.
 *
 * Each messenger sends a notification to a platform (Slack, Teams, Discord)
 * via its incoming webhook URL when a new lead is created.
 */
final class Messenger {

	/**
	 * Allowed platforms.
	 */
	public const PLATFORMS = [ 'slack', 'teams', 'discord' ];

	/**
	 * Get the table name with WP prefix.
	 */
	private static function table(): string {
		global $wpdb;
		return $wpdb->prefix . 'resa_messengers';
	}

	/**
	 * Create a new messenger connection.
	 *
	 * @param array<string,mixed> $data Messenger data.
	 * @return int|false Inserted row ID or false on failure.
	 */
	public static function create( array $data ): int|false {
		global $wpdb;

		$platform = sanitize_text_field( $data['platform'] ?? '' );
		if ( ! in_array( $platform, self::PLATFORMS, true ) ) {
			return false;
		}

		$result = $wpdb->insert(
			self::table(),
			[
				'name'        => sanitize_text_field( $data['name'] ?? '' ),
				'platform'    => $platform,
				'webhook_url' => esc_url_raw( $data['webhook_url'] ?? '' ),
				'is_active'   => isset( $data['is_active'] ) ? (int) $data['is_active'] : 1,
				'created_at'  => current_time( 'mysql' ),
				'updated_at'  => current_time( 'mysql' ),
			],
			[
				'%s', '%s', '%s', '%d', '%s', '%s',
			]
		);

		if ( $result === false ) {
			return false;
		}

		return (int) $wpdb->insert_id;
	}

	/**
	 * Find a messenger by ID.
	 *
	 * @param int $id Messenger ID.
	 * @return object|null Messenger row or null.
	 */
	public static function findById( int $id ): ?object {
		global $wpdb;

		$table = self::table();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		return $wpdb->get_row(
			$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				"SELECT * FROM {$table} WHERE id = %d LIMIT 1",
				$id
			)
		);
	}

	/**
	 * Get all messengers.
	 *
	 * @return object[] Array of messenger rows.
	 */
	public static function getAll(): array {
		global $wpdb;

		$table = self::table();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$results = $wpdb->get_results(
			"SELECT * FROM {$table} ORDER BY created_at DESC"
		);

		return $results ?: [];
	}

	/**
	 * Get all active messengers.
	 *
	 * @return object[] Array of active messenger rows.
	 */
	public static function getActive(): array {
		global $wpdb;

		$table = self::table();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$results = $wpdb->get_results(
			$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				"SELECT * FROM {$table} WHERE is_active = %d ORDER BY created_at DESC",
				1
			)
		);

		return $results ?: [];
	}

	/**
	 * Update a messenger.
	 *
	 * @param int                 $id   Messenger ID.
	 * @param array<string,mixed> $data Fields to update.
	 * @return bool True on success.
	 */
	public static function update( int $id, array $data ): bool {
		global $wpdb;

		$fields  = [];
		$formats = [];

		if ( array_key_exists( 'name', $data ) ) {
			$fields['name'] = sanitize_text_field( $data['name'] );
			$formats[]      = '%s';
		}

		if ( array_key_exists( 'webhook_url', $data ) ) {
			$fields['webhook_url'] = esc_url_raw( $data['webhook_url'] );
			$formats[]             = '%s';
		}

		if ( array_key_exists( 'is_active', $data ) ) {
			$fields['is_active'] = (int) $data['is_active'];
			$formats[]           = '%d';
		}

		if ( empty( $fields ) ) {
			return false;
		}

		$fields['updated_at'] = current_time( 'mysql' );
		$formats[]            = '%s';

		$result = $wpdb->update(
			self::table(),
			$fields,
			[ 'id' => $id ],
			$formats,
			[ '%d' ]
		);

		return $result !== false;
	}

	/**
	 * Delete a messenger.
	 *
	 * @param int $id Messenger ID.
	 * @return bool True on success.
	 */
	public static function delete( int $id ): bool {
		global $wpdb;

		$result = $wpdb->delete(
			self::table(),
			[ 'id' => $id ],
			[ '%d' ]
		);

		return $result !== false;
	}

	/**
	 * Count all messengers.
	 *
	 * @return int Count.
	 */
	public static function count(): int {
		global $wpdb;

		$table = self::table();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$count = $wpdb->get_var(
			"SELECT COUNT(*) FROM {$table}"
		);

		return (int) $count;
	}
}
