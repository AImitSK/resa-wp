<?php

declare( strict_types=1 );

namespace Resa\Models;

/**
 * Lead model — CRUD operations for the resa_leads table.
 *
 * Supports two-phase capture:
 *  Phase 1 (partial): Quiz answers saved, no contact data.
 *  Phase 2 (complete): Contact data + DSGVO consent added.
 */
final class Lead {

	/**
	 * Get the table name with WP prefix.
	 */
	private static function table(): string {
		global $wpdb;
		return $wpdb->prefix . 'resa_leads';
	}

	/**
	 * Phase 1 — Create a partial lead (quiz answers only).
	 *
	 * @param array<string,mixed> $data Lead data.
	 * @return int|false Inserted row ID or false on failure.
	 */
	public static function createPartial( array $data ): int|false {
		global $wpdb;

		$gclid  = sanitize_text_field( $data['gclid'] ?? '' );
		$fbclid = sanitize_text_field( $data['fbclid'] ?? '' );

		$result = $wpdb->insert(
			self::table(),
			[
				'session_id'  => sanitize_text_field( $data['session_id'] ?? '' ),
				'asset_type'  => sanitize_text_field( $data['asset_type'] ?? '' ),
				'location_id' => absint( $data['location_id'] ?? 0 ),
				'status'      => 'partial',
				'inputs'      => wp_json_encode( $data['inputs'] ?? [] ),
				'result'      => wp_json_encode( $data['result'] ?? null ),
				'meta'        => wp_json_encode( $data['meta'] ?? [] ),
				'gclid'       => $gclid !== '' ? $gclid : null,
				'fbclid'      => $fbclid !== '' ? $fbclid : null,
				'created_at'  => current_time( 'mysql' ),
				'updated_at'  => current_time( 'mysql' ),
				'expires_at'  => gmdate( 'Y-m-d H:i:s', time() + ( 30 * DAY_IN_SECONDS ) ),
			],
			[
				'%s',
				'%s',
				'%d',
				'%s',
				'%s',
				'%s',
				'%s',
				'%s',
				'%s',
				'%s',
				'%s',
				'%s',
			]
		);

		if ( $result === false ) {
			return false;
		}

		return (int) $wpdb->insert_id;
	}

	/**
	 * Phase 2 — Complete a lead with contact data and DSGVO consent.
	 *
	 * @param string              $sessionId Session UUID from Phase 1.
	 * @param array<string,mixed> $data      Contact data.
	 * @return bool True on success.
	 */
	public static function complete( string $sessionId, array $data ): bool {
		global $wpdb;

		$lastName   = sanitize_text_field( $data['last_name'] ?? '' );
		$phone      = sanitize_text_field( $data['phone'] ?? '' );
		$company    = sanitize_text_field( $data['company'] ?? '' );
		$salutation = sanitize_text_field( $data['salutation'] ?? '' );
		$message    = sanitize_textarea_field( $data['message'] ?? '' );

		$result = $wpdb->update(
			self::table(),
			[
				'status'        => 'new',
				'first_name'    => sanitize_text_field( $data['first_name'] ?? '' ),
				'last_name'     => $lastName !== '' ? $lastName : null,
				'email'         => sanitize_email( $data['email'] ?? '' ),
				'phone'         => $phone !== '' ? $phone : null,
				'company'       => $company !== '' ? $company : null,
				'salutation'    => $salutation !== '' ? $salutation : null,
				'message'       => $message !== '' ? $message : null,
				'consent_given' => 1,
				'consent_text'  => sanitize_textarea_field( $data['consent_text'] ?? '' ),
				'consent_date'  => current_time( 'mysql' ),
				'completed_at'  => current_time( 'mysql' ),
				'updated_at'    => current_time( 'mysql' ),
				'expires_at'    => null,
			],
			[
				'session_id' => $sessionId,
				'status'     => 'partial',
			],
			[
				'%s',
				'%s',
				'%s',
				'%s',
				'%s',
				'%s',
				'%s',
				'%s',
				'%d',
				'%s',
				'%s',
				'%s',
				'%s',
				null,
			],
			[
				'%s',
				'%s',
			]
		);

		return $result !== false;
	}

	/**
	 * Find a lead by session ID.
	 *
	 * @param string $sessionId UUID.
	 * @return object|null Lead row or null.
	 */
	public static function findBySession( string $sessionId ): ?object {
		global $wpdb;

		$table = self::table();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		return $wpdb->get_row(
			$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				"SELECT * FROM {$table} WHERE session_id = %s LIMIT 1",
				$sessionId
			)
		);
	}

	/**
	 * Find a lead by ID.
	 *
	 * @param int $id Lead ID.
	 * @return object|null Lead row or null.
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
	 * Count leads by status.
	 *
	 * @param string $status Lead status.
	 * @return int Count.
	 */
	public static function countByStatus( string $status ): int {
		global $wpdb;

		$table = self::table();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		return (int) $wpdb->get_var(
			$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				"SELECT COUNT(*) FROM {$table} WHERE status = %s",
				$status
			)
		);
	}

	/**
	 * Get all leads with pagination and filters.
	 *
	 * @param array<string,mixed> $filters Filter options.
	 *   - status: string|null Filter by status.
	 *   - asset_type: string|null Filter by asset type.
	 *   - location_id: int|null Filter by location.
	 *   - search: string|null Search in name/email.
	 *   - date_from: string|null Start date (Y-m-d).
	 *   - date_to: string|null End date (Y-m-d).
	 *   - page: int Page number (1-based).
	 *   - per_page: int Items per page (default 25).
	 *   - orderby: string Column to order by.
	 *   - order: string ASC or DESC.
	 * @return array{items: object[], total: int, page: int, per_page: int, total_pages: int}
	 */
	public static function getAll( array $filters = [] ): array {
		global $wpdb;

		$table          = self::table();
		$locations_table = $wpdb->prefix . 'resa_locations';

		// Defaults.
		$page        = max( 1, absint( $filters['page'] ?? 1 ) );
		$max_per_page = ! empty( $filters['export'] ) ? 50000 : 100;
		$per_page     = max( 1, min( $max_per_page, absint( $filters['per_page'] ?? 25 ) ) );
		$orderby  = sanitize_key( $filters['orderby'] ?? 'created_at' );
		$order    = strtoupper( $filters['order'] ?? 'DESC' ) === 'ASC' ? 'ASC' : 'DESC';

		// Whitelist orderby columns.
		$allowed_orderby = [ 'id', 'first_name', 'last_name', 'email', 'asset_type', 'status', 'created_at', 'updated_at' ];
		if ( ! in_array( $orderby, $allowed_orderby, true ) ) {
			$orderby = 'created_at';
		}

		// Build WHERE clauses.
		$where   = [ '1=1' ];
		$prepare = [];

		// Exclude partial leads from admin view by default.
		$where[]   = 'l.status != %s';
		$prepare[] = 'partial';

		if ( ! empty( $filters['status'] ) ) {
			$where[]   = 'l.status = %s';
			$prepare[] = sanitize_text_field( $filters['status'] );
		}

		if ( ! empty( $filters['asset_type'] ) ) {
			$where[]   = 'l.asset_type = %s';
			$prepare[] = sanitize_text_field( $filters['asset_type'] );
		}

		if ( ! empty( $filters['location_id'] ) ) {
			$where[]   = 'l.location_id = %d';
			$prepare[] = absint( $filters['location_id'] );
		}

		if ( ! empty( $filters['search'] ) ) {
			$search    = '%' . $wpdb->esc_like( sanitize_text_field( $filters['search'] ) ) . '%';
			$where[]   = '(l.first_name LIKE %s OR l.last_name LIKE %s OR l.email LIKE %s)';
			$prepare[] = $search;
			$prepare[] = $search;
			$prepare[] = $search;
		}

		if ( ! empty( $filters['date_from'] ) ) {
			$where[]   = 'DATE(l.created_at) >= %s';
			$prepare[] = sanitize_text_field( $filters['date_from'] );
		}

		if ( ! empty( $filters['date_to'] ) ) {
			$where[]   = 'DATE(l.created_at) <= %s';
			$prepare[] = sanitize_text_field( $filters['date_to'] );
		}

		$where_clause = implode( ' AND ', $where );

		// Count total.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$total = (int) $wpdb->get_var(
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$wpdb->prepare(
				"SELECT COUNT(*) FROM {$table} l WHERE {$where_clause}",
				$prepare
			)
		);

		$total_pages = (int) ceil( $total / $per_page );
		$offset      = ( $page - 1 ) * $per_page;

		// Fetch items with location name.
		$prepare[] = $per_page;
		$prepare[] = $offset;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$items = $wpdb->get_results(
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$wpdb->prepare(
				"SELECT l.*, loc.name as location_name
				FROM {$table} l
				LEFT JOIN {$locations_table} loc ON l.location_id = loc.id
				WHERE {$where_clause}
				ORDER BY l.{$orderby} {$order}
				LIMIT %d OFFSET %d",
				$prepare
			)
		);

		return [
			'items'       => $items ?: [],
			'total'       => $total,
			'page'        => $page,
			'per_page'    => $per_page,
			'total_pages' => $total_pages,
		];
	}

	/**
	 * Get lead statistics (counts by status).
	 *
	 * @return array<string, int> Status => count pairs.
	 */
	public static function getStats(): array {
		global $wpdb;

		$table = self::table();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$results = $wpdb->get_results(
			"SELECT status, COUNT(*) as count FROM {$table} WHERE status != 'partial' GROUP BY status"
		);

		$stats = [
			'all'       => 0,
			'new'       => 0,
			'contacted' => 0,
			'qualified' => 0,
			'completed' => 0,
			'lost'      => 0,
		];

		foreach ( $results as $row ) {
			$stats[ $row->status ] = (int) $row->count;
			$stats['all']         += (int) $row->count;
		}

		return $stats;
	}

	/**
	 * Update a lead.
	 *
	 * @param int                 $id   Lead ID.
	 * @param array<string,mixed> $data Fields to update.
	 * @return bool True on success.
	 */
	public static function update( int $id, array $data ): bool {
		global $wpdb;

		$fields  = [];
		$formats = [];

		// Allowed string fields.
		$allowed_strings = [ 'status', 'notes' ];
		foreach ( $allowed_strings as $key ) {
			if ( array_key_exists( $key, $data ) ) {
				if ( $data[ $key ] === null ) {
					$fields[ $key ] = null;
					$formats[]      = null;
				} else {
					$fields[ $key ] = sanitize_text_field( $data[ $key ] );
					$formats[]      = '%s';
				}
			}
		}

		// Agent ID (nullable integer).
		if ( array_key_exists( 'agent_id', $data ) ) {
			if ( $data['agent_id'] === null ) {
				$fields['agent_id'] = null;
				$formats[]          = null;
			} else {
				$fields['agent_id'] = absint( $data['agent_id'] );
				$formats[]          = '%d';
			}
		}

		if ( empty( $fields ) ) {
			return false;
		}

		// Always update timestamp.
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
	 * Delete a lead (hard delete for GDPR compliance).
	 *
	 * @param int $id Lead ID.
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
	 * Count all complete leads (excluding partial).
	 *
	 * @return int Total count.
	 */
	public static function countAll(): int {
		global $wpdb;

		$table = self::table();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		return (int) $wpdb->get_var(
			$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				"SELECT COUNT(*) FROM {$table} WHERE status != %s",
				'partial'
			)
		);
	}
}
