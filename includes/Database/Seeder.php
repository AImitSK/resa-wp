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
	 */
	private static function seedLocations(): void {
		global $wpdb;

		$table     = $wpdb->prefix . 'resa_locations';
		$locations = [
			[
				'slug'        => 'berlin',
				'name'        => 'Berlin',
				'bundesland'  => 'Berlin',
				'region_type' => 'metro',
				'data'        => wp_json_encode(
					[
						'rent_data' => [
							'sqm_per_month' => [
								'premium'  => 16.50,
								'standard' => 11.80,
								'economy'  => 7.50,
							],
						],
					]
				),
			],
			[
				'slug'        => 'muenchen',
				'name'        => 'München',
				'bundesland'  => 'Bayern',
				'region_type' => 'metro',
				'data'        => wp_json_encode(
					[
						'rent_data' => [
							'sqm_per_month' => [
								'premium'  => 22.00,
								'standard' => 16.50,
								'economy'  => 11.00,
							],
						],
					]
				),
			],
			[
				'slug'        => 'hamburg',
				'name'        => 'Hamburg',
				'bundesland'  => 'Hamburg',
				'region_type' => 'metro',
				'data'        => wp_json_encode(
					[
						'rent_data' => [
							'sqm_per_month' => [
								'premium'  => 17.00,
								'standard' => 12.50,
								'economy'  => 8.50,
							],
						],
					]
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
