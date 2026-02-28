<?php

declare( strict_types=1 );

namespace Resa\Models;

/**
 * Agent model — CRUD operations for the resa_agents table.
 *
 * Stores agent/broker data: name, company, contact info, etc.
 * Used for PDF generation, email templates, and lead assignment.
 */
final class Agent {

	/**
	 * Get the table name with WP prefix.
	 */
	private static function table(): string {
		global $wpdb;
		return $wpdb->prefix . 'resa_agents';
	}

	/**
	 * Get the default (primary) agent.
	 *
	 * Returns the first active agent. In single-agent setups,
	 * this is the main broker/agent for all leads.
	 *
	 * @return object|null Agent row or null if none exists.
	 */
	public static function getDefault(): ?object {
		global $wpdb;

		$table = self::table();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		return $wpdb->get_row(
			$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				"SELECT * FROM {$table} WHERE is_active = %d ORDER BY id ASC LIMIT 1",
				1
			)
		);
	}

	/**
	 * Find an agent by ID.
	 *
	 * @param int $id Agent ID.
	 * @return object|null Agent row or null.
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
	 * Create or update the default agent.
	 *
	 * If no agent exists, creates one. Otherwise updates the first active agent.
	 * This is a convenience method for single-agent setups.
	 *
	 * @param array<string,mixed> $data Agent data.
	 * @return int|false Agent ID or false on failure.
	 */
	public static function saveDefault( array $data ): int|false {
		$existing = self::getDefault();

		if ( $existing ) {
			$success = self::update( (int) $existing->id, $data );
			return $success ? (int) $existing->id : false;
		}

		return self::create( $data );
	}

	/**
	 * Create a new agent.
	 *
	 * @param array<string,mixed> $data Agent data.
	 * @return int|false Inserted row ID or false on failure.
	 */
	public static function create( array $data ): int|false {
		global $wpdb;

		$result = $wpdb->insert(
			self::table(),
			[
				'wp_user_id'  => isset( $data['wp_user_id'] ) ? absint( $data['wp_user_id'] ) : null,
				'name'        => sanitize_text_field( $data['name'] ?? '' ),
				'email'       => sanitize_email( $data['email'] ?? '' ),
				'phone'       => sanitize_text_field( $data['phone'] ?? '' ),
				'photo_url'   => esc_url_raw( $data['photo_url'] ?? '' ),
				'company'     => sanitize_text_field( $data['company'] ?? '' ),
				'address'     => sanitize_textarea_field( $data['address'] ?? '' ),
				'website'     => esc_url_raw( $data['website'] ?? '' ),
				'imprint_url' => esc_url_raw( $data['imprint_url'] ?? '' ),
				'is_active'   => isset( $data['is_active'] ) ? (int) $data['is_active'] : 1,
				'created_at'  => current_time( 'mysql' ),
			],
			[
				'%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%s',
			]
		);

		if ( $result === false ) {
			return false;
		}

		return (int) $wpdb->insert_id;
	}

	/**
	 * Update an agent.
	 *
	 * @param int                 $id   Agent ID.
	 * @param array<string,mixed> $data Fields to update.
	 * @return bool True on success.
	 */
	public static function update( int $id, array $data ): bool {
		global $wpdb;

		$fields  = [];
		$formats = [];

		// String fields with text sanitization.
		if ( array_key_exists( 'name', $data ) ) {
			$fields['name'] = sanitize_text_field( $data['name'] );
			$formats[]      = '%s';
		}

		if ( array_key_exists( 'phone', $data ) ) {
			$fields['phone'] = sanitize_text_field( $data['phone'] );
			$formats[]       = '%s';
		}

		if ( array_key_exists( 'company', $data ) ) {
			$fields['company'] = sanitize_text_field( $data['company'] );
			$formats[]         = '%s';
		}

		// Email field.
		if ( array_key_exists( 'email', $data ) ) {
			$fields['email'] = sanitize_email( $data['email'] );
			$formats[]       = '%s';
		}

		// Textarea field.
		if ( array_key_exists( 'address', $data ) ) {
			$fields['address'] = sanitize_textarea_field( $data['address'] );
			$formats[]         = '%s';
		}

		// URL fields.
		if ( array_key_exists( 'photo_url', $data ) ) {
			$fields['photo_url'] = esc_url_raw( $data['photo_url'] );
			$formats[]           = '%s';
		}

		if ( array_key_exists( 'website', $data ) ) {
			$fields['website'] = esc_url_raw( $data['website'] );
			$formats[]         = '%s';
		}

		if ( array_key_exists( 'imprint_url', $data ) ) {
			$fields['imprint_url'] = esc_url_raw( $data['imprint_url'] );
			$formats[]             = '%s';
		}

		// Integer fields.
		if ( array_key_exists( 'wp_user_id', $data ) ) {
			$fields['wp_user_id'] = $data['wp_user_id'] !== null ? absint( $data['wp_user_id'] ) : null;
			$formats[]            = $data['wp_user_id'] !== null ? '%d' : null;
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
}
