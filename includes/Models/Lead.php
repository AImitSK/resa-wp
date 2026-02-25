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
}
