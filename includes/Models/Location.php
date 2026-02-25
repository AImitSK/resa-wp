<?php

declare( strict_types=1 );

namespace Resa\Models;

/**
 * Location model — CRUD operations for the resa_locations table.
 *
 * Each location holds regional market data (base_price, multipliers)
 * used by calculator modules. Supports preset-based (pauschal) or
 * custom (individuell) configuration.
 */
final class Location {

	/**
	 * Get the table name with WP prefix.
	 */
	private static function table(): string {
		global $wpdb;
		return $wpdb->prefix . 'resa_locations';
	}

	/**
	 * Create a new location.
	 *
	 * @param array<string,mixed> $data Location data.
	 * @return int|false Inserted row ID or false on failure.
	 */
	public static function create( array $data ): int|false {
		global $wpdb;

		$result = $wpdb->insert(
			self::table(),
			[
				'slug'        => sanitize_title( $data['slug'] ?? '' ),
				'name'        => sanitize_text_field( $data['name'] ?? '' ),
				'country'     => sanitize_text_field( $data['country'] ?? 'DE' ),
				'bundesland'  => sanitize_text_field( $data['bundesland'] ?? '' ),
				'region_type' => sanitize_text_field( $data['region_type'] ?? 'city' ),
				'currency'    => sanitize_text_field( $data['currency'] ?? 'EUR' ),
				'data'        => wp_json_encode( $data['data'] ?? [] ),
				'factors'     => isset( $data['factors'] ) ? wp_json_encode( $data['factors'] ) : null,
				'agent_id'    => isset( $data['agent_id'] ) ? absint( $data['agent_id'] ) : null,
				'is_active'   => isset( $data['is_active'] ) ? (int) $data['is_active'] : 1,
				'created_at'  => current_time( 'mysql' ),
				'updated_at'  => current_time( 'mysql' ),
			],
			[
				'%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%d', '%s', '%s',
			]
		);

		if ( $result === false ) {
			return false;
		}

		return (int) $wpdb->insert_id;
	}

	/**
	 * Find a location by ID.
	 *
	 * @param int $id Location ID.
	 * @return object|null Location row or null.
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
	 * Find a location by slug.
	 *
	 * @param string $slug Location slug.
	 * @return object|null Location row or null.
	 */
	public static function findBySlug( string $slug ): ?object {
		global $wpdb;

		$table = self::table();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		return $wpdb->get_row(
			$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				"SELECT * FROM {$table} WHERE slug = %s LIMIT 1",
				$slug
			)
		);
	}

	/**
	 * Get all locations (optionally only active).
	 *
	 * @param bool $activeOnly Only return active locations.
	 * @return object[] Array of location rows.
	 */
	public static function getAll( bool $activeOnly = false ): array {
		global $wpdb;

		$table = self::table();
		$where = $activeOnly ? 'WHERE is_active = 1' : '';

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$results = $wpdb->get_results(
			"SELECT * FROM {$table} {$where} ORDER BY name ASC"
		);

		return $results ?: [];
	}

	/**
	 * Update a location.
	 *
	 * @param int                 $id   Location ID.
	 * @param array<string,mixed> $data Fields to update.
	 * @return bool True on success.
	 */
	public static function update( int $id, array $data ): bool {
		global $wpdb;

		$fields  = [];
		$formats = [];

		$allowedStrings = [ 'slug', 'name', 'country', 'bundesland', 'region_type', 'currency' ];
		foreach ( $allowedStrings as $key ) {
			if ( array_key_exists( $key, $data ) ) {
				$fields[ $key ] = $key === 'slug'
					? sanitize_title( $data[ $key ] )
					: sanitize_text_field( $data[ $key ] );
				$formats[]      = '%s';
			}
		}

		if ( array_key_exists( 'data', $data ) ) {
			$fields['data'] = wp_json_encode( $data['data'] );
			$formats[]      = '%s';
		}

		if ( array_key_exists( 'factors', $data ) ) {
			$fields['factors'] = $data['factors'] !== null ? wp_json_encode( $data['factors'] ) : null;
			$formats[]         = $data['factors'] !== null ? '%s' : null;
		}

		if ( array_key_exists( 'agent_id', $data ) ) {
			$fields['agent_id'] = $data['agent_id'] !== null ? absint( $data['agent_id'] ) : null;
			$formats[]          = $data['agent_id'] !== null ? '%d' : null;
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
	 * Delete a location.
	 *
	 * @param int $id Location ID.
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
	 * Count all locations (optionally only active).
	 *
	 * @param bool $activeOnly Only count active locations.
	 * @return int Count.
	 */
	public static function count( bool $activeOnly = false ): int {
		global $wpdb;

		$table = self::table();
		$where = $activeOnly ? 'WHERE is_active = 1' : '';

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		return (int) $wpdb->get_var(
			"SELECT COUNT(*) FROM {$table} {$where}"
		);
	}

	/**
	 * Get the effective calculation data for a location.
	 *
	 * Returns `factors` if set (individuell mode),
	 * otherwise `data` (pauschal mode with preset values).
	 *
	 * @param object $location Location row from DB.
	 * @return array<string,mixed> Merged calculation parameters.
	 */
	public static function getCalculationData( object $location ): array {
		$data    = json_decode( $location->data ?? '{}', true ) ?: [];
		$factors = json_decode( $location->factors ?? 'null', true );

		return $factors ?? $data;
	}
}
