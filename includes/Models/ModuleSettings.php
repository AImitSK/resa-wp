<?php

declare( strict_types=1 );

namespace Resa\Models;

/**
 * ModuleSettings model — CRUD operations for the resa_module_settings table.
 *
 * Stores per-module configuration including setup mode (pauschal/individuell),
 * calculation factors, and location-specific values.
 */
final class ModuleSettings {

	/**
	 * Get the table name with WP prefix.
	 */
	private static function table(): string {
		global $wpdb;
		return $wpdb->prefix . 'resa_module_settings';
	}

	/**
	 * Get settings for a module by slug.
	 *
	 * @param string $slug Module slug.
	 * @return array<string,mixed>|null Settings array or null if not found.
	 */
	public static function getBySlug( string $slug ): ?array {
		global $wpdb;

		$table = self::table();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$row = $wpdb->get_row(
			$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				"SELECT * FROM {$table} WHERE module_slug = %s LIMIT 1",
				$slug
			)
		);

		if ( ! $row ) {
			return null;
		}

		return self::rowToArray( $row );
	}

	/**
	 * Save settings for a module.
	 *
	 * Creates new record if not exists, updates otherwise.
	 *
	 * @param string              $slug Module slug.
	 * @param array<string,mixed> $data Settings data.
	 * @return bool True on success.
	 */
	public static function save( string $slug, array $data ): bool {
		$existing = self::getBySlug( $slug );

		if ( $existing ) {
			return self::update( $slug, $data );
		}

		return self::create( $slug, $data );
	}

	/**
	 * Create new module settings.
	 *
	 * @param string              $slug Module slug.
	 * @param array<string,mixed> $data Settings data.
	 * @return bool True on success.
	 */
	private static function create( string $slug, array $data ): bool {
		global $wpdb;

		$result = $wpdb->insert(
			self::table(),
			[
				'module_slug'     => sanitize_key( $slug ),
				'setup_mode'      => self::sanitizeSetupMode( $data['setup_mode'] ?? 'pauschal' ),
				'region_preset'   => sanitize_text_field( $data['region_preset'] ?? 'medium_city' ),
				'factors'         => isset( $data['factors'] ) ? wp_json_encode( $data['factors'] ) : null,
				'location_values' => isset( $data['location_values'] ) ? wp_json_encode( $data['location_values'] ) : null,
				'created_at'      => current_time( 'mysql' ),
				'updated_at'      => current_time( 'mysql' ),
			],
			[ '%s', '%s', '%s', '%s', '%s', '%s', '%s' ]
		);

		return $result !== false;
	}

	/**
	 * Update existing module settings.
	 *
	 * @param string              $slug Module slug.
	 * @param array<string,mixed> $data Settings data.
	 * @return bool True on success.
	 */
	private static function update( string $slug, array $data ): bool {
		global $wpdb;

		$fields  = [];
		$formats = [];

		if ( array_key_exists( 'setup_mode', $data ) ) {
			$fields['setup_mode'] = self::sanitizeSetupMode( $data['setup_mode'] );
			$formats[]            = '%s';
		}

		if ( array_key_exists( 'region_preset', $data ) ) {
			$fields['region_preset'] = sanitize_text_field( $data['region_preset'] );
			$formats[]               = '%s';
		}

		if ( array_key_exists( 'factors', $data ) ) {
			$fields['factors'] = $data['factors'] !== null ? wp_json_encode( $data['factors'] ) : null;
			$formats[]         = '%s';
		}

		if ( array_key_exists( 'location_values', $data ) ) {
			$fields['location_values'] = $data['location_values'] !== null ? wp_json_encode( $data['location_values'] ) : null;
			$formats[]                 = '%s';
		}

		if ( empty( $fields ) ) {
			return false;
		}

		$fields['updated_at'] = current_time( 'mysql' );
		$formats[]            = '%s';

		$result = $wpdb->update(
			self::table(),
			$fields,
			[ 'module_slug' => $slug ],
			$formats,
			[ '%s' ]
		);

		return $result !== false;
	}

	/**
	 * Delete settings for a module.
	 *
	 * @param string $slug Module slug.
	 * @return bool True on success.
	 */
	public static function delete( string $slug ): bool {
		global $wpdb;

		$result = $wpdb->delete(
			self::table(),
			[ 'module_slug' => $slug ],
			[ '%s' ]
		);

		return $result !== false;
	}

	/**
	 * Get location-specific values for a module.
	 *
	 * @param string $slug Module slug.
	 * @return array<int,array<string,mixed>> Location ID => values.
	 */
	public static function getLocationValues( string $slug ): array {
		$settings = self::getBySlug( $slug );

		if ( ! $settings || ! isset( $settings['location_values'] ) ) {
			return [];
		}

		return $settings['location_values'];
	}

	/**
	 * Get values for a specific location.
	 *
	 * @param string $slug       Module slug.
	 * @param int    $locationId Location ID.
	 * @return array<string,mixed>|null Values or null.
	 */
	public static function getLocationValue( string $slug, int $locationId ): ?array {
		$values = self::getLocationValues( $slug );

		return $values[ (string) $locationId ] ?? null;
	}

	/**
	 * Set values for a specific location.
	 *
	 * @param string              $slug       Module slug.
	 * @param int                 $locationId Location ID.
	 * @param array<string,mixed> $values     Location-specific values.
	 * @return bool True on success.
	 */
	public static function setLocationValue( string $slug, int $locationId, array $values ): bool {
		$settings = self::getBySlug( $slug );

		if ( ! $settings ) {
			// Create with just location values.
			return self::save( $slug, [
				'location_values' => [ (string) $locationId => $values ],
			] );
		}

		$locationValues                       = $settings['location_values'] ?? [];
		$locationValues[ (string) $locationId ] = $values;

		return self::save( $slug, [ 'location_values' => $locationValues ] );
	}

	/**
	 * Remove values for a specific location.
	 *
	 * @param string $slug       Module slug.
	 * @param int    $locationId Location ID.
	 * @return bool True on success.
	 */
	public static function removeLocationValue( string $slug, int $locationId ): bool {
		$settings = self::getBySlug( $slug );

		if ( ! $settings || ! isset( $settings['location_values'] ) ) {
			return true;
		}

		$locationValues = $settings['location_values'];
		unset( $locationValues[ (string) $locationId ] );

		return self::save( $slug, [ 'location_values' => $locationValues ] );
	}

	/**
	 * Get effective calculation data for a module and location.
	 *
	 * Returns factors merged with location-specific overrides.
	 *
	 * @param string   $slug       Module slug.
	 * @param int|null $locationId Optional location ID for overrides.
	 * @return array<string,mixed> Merged calculation parameters.
	 */
	public static function getCalculationData( string $slug, ?int $locationId = null ): array {
		$settings = self::getBySlug( $slug );

		if ( ! $settings ) {
			return [];
		}

		$factors = $settings['factors'] ?? [];

		if ( $locationId !== null && isset( $settings['location_values'][ (string) $locationId ] ) ) {
			$locationOverrides = $settings['location_values'][ (string) $locationId ];
			$factors           = array_merge( $factors, $locationOverrides );
		}

		return $factors;
	}

	/**
	 * Convert a database row to array with decoded JSON fields.
	 *
	 * @param object $row Database row.
	 * @return array<string,mixed>
	 */
	private static function rowToArray( object $row ): array {
		return [
			'id'              => (int) $row->id,
			'module_slug'     => $row->module_slug,
			'setup_mode'      => $row->setup_mode,
			'region_preset'   => $row->region_preset,
			'factors'         => json_decode( $row->factors ?? 'null', true ),
			'location_values' => json_decode( $row->location_values ?? '{}', true ) ?: [],
			'created_at'      => $row->created_at,
			'updated_at'      => $row->updated_at,
		];
	}

	/**
	 * Sanitize setup mode to allowed values.
	 *
	 * @param string $mode Raw mode value.
	 * @return string Sanitized mode.
	 */
	private static function sanitizeSetupMode( string $mode ): string {
		return in_array( $mode, [ 'pauschal', 'individuell' ], true ) ? $mode : 'pauschal';
	}
}
