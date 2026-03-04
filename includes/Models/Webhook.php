<?php

declare( strict_types=1 );

namespace Resa\Models;

/**
 * Webhook model — CRUD operations for the resa_webhooks table.
 *
 * Each webhook sends a POST request to a configured URL when
 * specific events occur (e.g. lead.created).
 */
final class Webhook {

	/**
	 * Get the table name with WP prefix.
	 */
	private static function table(): string {
		global $wpdb;
		return $wpdb->prefix . 'resa_webhooks';
	}

	/**
	 * Create a new webhook.
	 *
	 * @param array<string,mixed> $data Webhook data.
	 * @return int|false Inserted row ID or false on failure.
	 */
	public static function create( array $data ): int|false {
		global $wpdb;

		$result = $wpdb->insert(
			self::table(),
			[
				'name'       => sanitize_text_field( $data['name'] ?? '' ),
				'url'        => esc_url_raw( $data['url'] ?? '' ),
				'secret'     => sanitize_text_field( $data['secret'] ?? self::generateSecret() ),
				'events'     => wp_json_encode( $data['events'] ?? [ 'lead.created' ] ),
				'is_active'  => isset( $data['is_active'] ) ? (int) $data['is_active'] : 1,
				'created_at' => current_time( 'mysql' ),
				'updated_at' => current_time( 'mysql' ),
			],
			[
				'%s', '%s', '%s', '%s', '%d', '%s', '%s',
			]
		);

		if ( $result === false ) {
			return false;
		}

		return (int) $wpdb->insert_id;
	}

	/**
	 * Find a webhook by ID.
	 *
	 * @param int $id Webhook ID.
	 * @return object|null Webhook row or null.
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
	 * Get all webhooks.
	 *
	 * @return object[] Array of webhook rows.
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
	 * Get all active webhooks.
	 *
	 * @return object[] Array of active webhook rows.
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
	 * Update a webhook.
	 *
	 * @param int                 $id   Webhook ID.
	 * @param array<string,mixed> $data Fields to update.
	 * @return bool True on success.
	 */
	public static function update( int $id, array $data ): bool {
		global $wpdb;

		$fields  = [];
		$formats = [];

		$allowedStrings = [ 'name', 'url', 'secret' ];
		foreach ( $allowedStrings as $key ) {
			if ( array_key_exists( $key, $data ) ) {
				$fields[ $key ] = $key === 'url'
					? esc_url_raw( $data[ $key ] )
					: sanitize_text_field( $data[ $key ] );
				$formats[]      = '%s';
			}
		}

		if ( array_key_exists( 'events', $data ) ) {
			$fields['events'] = wp_json_encode( $data['events'] );
			$formats[]        = '%s';
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
	 * Delete a webhook.
	 *
	 * @param int $id Webhook ID.
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
	 * Count all webhooks.
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
	 * Generate a random webhook secret.
	 *
	 * @return string Secret with 'whsec_' prefix.
	 */
	public static function generateSecret(): string {
		return 'whsec_' . bin2hex( random_bytes( 24 ) );
	}
}
