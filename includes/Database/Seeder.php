<?php

declare( strict_types=1 );

namespace Resa\Database;

/**
 * Database seeder for development environments.
 *
 * Seeds sample locations and agents for testing.
 * Only runs when RESA_DEV_SEED is defined and true.
 */
final class Seeder {

	/**
	 * Run all seeders if the database is empty.
	 */
	public static function run(): void {
		if ( ! self::shouldSeed() ) {
			return;
		}

		self::seedLocations();
		self::seedAgents();
	}

	/**
	 * Check if seeding should run.
	 */
	private static function shouldSeed(): bool {
		if ( ! defined( 'RESA_DEV_SEED' ) || ! RESA_DEV_SEED ) {
			return false;
		}

		global $wpdb;
		$table = $wpdb->prefix . 'resa_locations';

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.NoCaching
		$count = (int) $wpdb->get_var(
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			"SELECT COUNT(*) FROM {$table}"
		);

		return $count === 0;
	}

	/**
	 * Seed sample locations for DACH region.
	 *
	 * Uses the new Mietpreis-Kalkulator compatible data format
	 * with region preset values.
	 */
	private static function seedLocations(): void {
		global $wpdb;

		$table = $wpdb->prefix . 'resa_locations';

		// Mittelstadt-Preset for default "Musterstadt".
		$mittelstadtData = [
			'setup_mode'            => 'pauschal',
			'region_preset'         => 'medium_city',
			'base_price'            => 9.50,
			'size_degression'       => 0.20,
			'location_ratings'      => [ '1' => 0.85, '2' => 0.95, '3' => 1.00, '4' => 1.10, '5' => 1.25 ],
			'condition_multipliers' => [ 'new' => 1.25, 'renovated' => 1.10, 'good' => 1.00, 'needs_renovation' => 0.80 ],
			'type_multipliers'      => [ 'apartment' => 1.00, 'house' => 1.15 ],
			'feature_premiums'      => [ 'balcony' => 0.50, 'terrace' => 0.75, 'garden' => 1.00, 'elevator' => 0.30, 'parking' => 0.40, 'garage' => 0.60, 'cellar' => 0.20, 'fitted_kitchen' => 0.50, 'floor_heating' => 0.40, 'guest_toilet' => 0.25, 'barrier_free' => 0.30 ],
			'age_multipliers'       => [ 'before_1946' => 1.05, '1946_1959' => 0.95, '1960_1979' => 0.90, '1980_1989' => 0.95, '1990_1999' => 1.00, '2000_2014' => 1.05, '2015_plus' => 1.10 ],
		];

		$locations = [
			[
				'slug'        => 'musterstadt',
				'name'        => 'Musterstadt',
				'bundesland'  => '',
				'region_type' => 'city',
				'data'        => wp_json_encode( $mittelstadtData ),
			],
			[
				'slug'        => 'berlin',
				'name'        => 'Berlin',
				'bundesland'  => 'Berlin',
				'region_type' => 'metro',
				'data'        => wp_json_encode(
					array_merge(
						$mittelstadtData,
						[
							'region_preset' => 'large_city',
							'base_price'    => 14.00,
							'size_degression' => 0.22,
						]
					)
				),
			],
			[
				'slug'        => 'muenchen',
				'name'        => 'München',
				'bundesland'  => 'Bayern',
				'region_type' => 'metro',
				'data'        => wp_json_encode(
					array_merge(
						$mittelstadtData,
						[
							'region_preset' => 'large_city',
							'base_price'    => 18.50,
							'size_degression' => 0.22,
						]
					)
				),
			],
		];

		foreach ( $locations as $location ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->insert(
				$table,
				array_merge(
					$location,
					[
						'country'  => 'DE',
						'currency' => 'EUR',
					]
				)
			);
		}
	}

	/**
	 * Seed a sample agent.
	 */
	private static function seedAgents(): void {
		global $wpdb;

		$table = $wpdb->prefix . 'resa_agents';

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$wpdb->insert(
			$table,
			[
				'name'  => 'Demo Makler',
				'email' => 'demo@resa-wt.com',
				'phone' => '+49 30 123456',
			]
		);
	}
}
