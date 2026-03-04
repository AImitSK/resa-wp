<?php

declare( strict_types=1 );

namespace Resa\Models;

/**
 * API Key model — CRUD operations for the resa_api_keys table.
 *
 * Keys are stored as SHA-256 hashes. The plain key is only
 * returned once during creation and never stored.
 */
final class ApiKey {

	/**
	 * Get the table name with WP prefix.
	 */
	private static function table(): string {
		global $wpdb;
		return $wpdb->prefix . 'resa_api_keys';
	}

	/**
	 * Generate a new API key.
	 *
	 * Format: resa_ + 64 hex chars = 69 chars total.
	 *
	 * @return string Plain API key (never stored).
	 */
	public static function generateKey(): string {
		return 'resa_' . bin2hex( random_bytes( 32 ) );
	}

	/**
	 * Create a new API key.
	 *
	 * Stores the SHA-256 hash and prefix. Returns the plain key once.
	 *
	 * @param array<string,mixed> $data Must contain 'name'.
	 * @return array{id: int, key: string}|false ID + plain key, or false on failure.
	 */
	public static function create( array $data ): array|false {
		global $wpdb;

		$plainKey  = self::generateKey();
		$keyHash   = hash( 'sha256', $plainKey );
		$keyPrefix = substr( $plainKey, 0, 13 ); // "resa_xxxxxxxx"

		$result = $wpdb->insert(
			self::table(),
			[
				'name'       => sanitize_text_field( $data['name'] ?? '' ),
				'key_prefix' => $keyPrefix,
				'key_hash'   => $keyHash,
				'is_active'  => 1,
				'created_at' => current_time( 'mysql' ),
			],
			[
				'%s', '%s', '%s', '%d', '%s',
			]
		);

		if ( $result === false ) {
			return false;
		}

		return [
			'id'  => (int) $wpdb->insert_id,
			'key' => $plainKey,
		];
	}

	/**
	 * Find an active API key by plain key (hash lookup).
	 *
	 * @param string $plainKey The bearer token value.
	 * @return object|null API key row or null.
	 */
	public static function findByKey( string $plainKey ): ?object {
		global $wpdb;

		$table   = self::table();
		$keyHash = hash( 'sha256', $plainKey );

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		return $wpdb->get_row(
			$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				"SELECT * FROM {$table} WHERE key_hash = %s AND is_active = 1 LIMIT 1",
				$keyHash
			)
		);
	}

	/**
	 * Find an API key by ID.
	 *
	 * @param int $id API key ID.
	 * @return object|null API key row or null.
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
	 * Get all API keys.
	 *
	 * @return object[] Array of API key rows.
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
	 * Update an API key.
	 *
	 * @param int                 $id   API key ID.
	 * @param array<string,mixed> $data Fields to update (name, is_active).
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

		if ( array_key_exists( 'is_active', $data ) ) {
			$fields['is_active'] = (int) $data['is_active'];
			$formats[]           = '%d';
		}

		if ( empty( $fields ) ) {
			return false;
		}

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
	 * Delete an API key.
	 *
	 * @param int $id API key ID.
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
	 * Count all API keys.
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

	/**
	 * Update the last_used_at timestamp.
	 *
	 * @param int $id API key ID.
	 */
	public static function touchLastUsed( int $id ): void {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$wpdb->update(
			self::table(),
			[ 'last_used_at' => current_time( 'mysql' ) ],
			[ 'id' => $id ],
			[ '%s' ],
			[ '%d' ]
		);
	}
}
