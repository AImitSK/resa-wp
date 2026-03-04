<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Cron;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Cron\DataRetentionCleanup;

class DataRetentionCleanupTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_register_plant_cron_wenn_nicht_vorhanden(): void {
		Functions\expect( 'add_action' )
			->once()
			->with( 'resa_data_retention_cleanup', Mockery::type( 'array' ) );

		Functions\expect( 'wp_next_scheduled' )
			->once()
			->with( 'resa_data_retention_cleanup' )
			->andReturn( false );

		Functions\expect( 'wp_schedule_event' )
			->once()
			->with(
				Mockery::type( 'int' ),
				'daily',
				'resa_data_retention_cleanup'
			);

		DataRetentionCleanup::register();
	}

	public function test_register_plant_nicht_erneut_wenn_schon_geplant(): void {
		Functions\expect( 'add_action' )->once();

		Functions\expect( 'wp_next_scheduled' )
			->once()
			->with( 'resa_data_retention_cleanup' )
			->andReturn( 1234567890 );

		Functions\expect( 'wp_schedule_event' )->never();

		DataRetentionCleanup::register();
	}

	public function test_cleanup_tut_nichts_bei_retention_null(): void {
		// Both retention values = 0 → unlimited, no cleanup.
		Functions\expect( 'get_option' )
			->with( 'resa_privacy_settings', [] )
			->andReturn( [
				'lead_retention_days'         => 0,
				'email_log_retention_days'    => 0,
				'anonymize_instead_of_delete' => false,
			] );

		// No database calls should happen.
		DataRetentionCleanup::cleanup();

		// If we reach here without errors, the test passes.
		$this->assertTrue( true );
	}

	public function test_cleanup_loescht_leads_bei_aktiver_retention(): void {
		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';

		Functions\expect( 'get_option' )
			->with( 'resa_privacy_settings', [] )
			->andReturn( [
				'lead_retention_days'         => 365,
				'email_log_retention_days'    => 0,
				'anonymize_instead_of_delete' => false,
			] );

		// Lead query to find expired leads.
		$wpdb->shouldReceive( 'prepare' )
			->once()
			->andReturn( 'PREPARED_LEAD_SQL' );
		$wpdb->shouldReceive( 'get_results' )
			->once()
			->with( 'PREPARED_LEAD_SQL' )
			->andReturn( [ (object) [ 'id' => 1 ], (object) [ 'id' => 2 ] ] );

		// Lead::delete() for each lead (cascade: EmailLogger::deleteByLead + wpdb->delete).
		$wpdb->shouldReceive( 'delete' )->times( 4 )->andReturn( 1 );

		DataRetentionCleanup::cleanup();
	}

	public function test_cleanup_loescht_email_logs_bei_aktiver_retention(): void {
		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';

		Functions\expect( 'get_option' )
			->with( 'resa_privacy_settings', [] )
			->andReturn( [
				'lead_retention_days'         => 0,
				'email_log_retention_days'    => 90,
				'anonymize_instead_of_delete' => false,
			] );

		// EmailLogger::deleteOlderThan() call.
		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'PREPARED_SQL' );
		$wpdb->shouldReceive( 'query' )->once()->with( 'PREPARED_SQL' )->andReturn( 5 );

		DataRetentionCleanup::cleanup();
	}

	public function test_unschedule_entfernt_geplanten_cron(): void {
		Functions\expect( 'wp_next_scheduled' )
			->once()
			->with( 'resa_data_retention_cleanup' )
			->andReturn( 1234567890 );

		Functions\expect( 'wp_unschedule_event' )
			->once()
			->with( 1234567890, 'resa_data_retention_cleanup' );

		DataRetentionCleanup::unschedule();
	}

	public function test_unschedule_tut_nichts_wenn_nicht_geplant(): void {
		Functions\expect( 'wp_next_scheduled' )
			->once()
			->with( 'resa_data_retention_cleanup' )
			->andReturn( false );

		Functions\expect( 'wp_unschedule_event' )->never();

		DataRetentionCleanup::unschedule();
	}
}
