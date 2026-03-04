<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Cron;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Cron\PartialLeadCleanup;

class PartialLeadCleanupTest extends TestCase {

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
			->with( 'resa_partial_lead_cleanup', Mockery::type( 'array' ) );

		Functions\expect( 'wp_next_scheduled' )
			->once()
			->with( 'resa_partial_lead_cleanup' )
			->andReturn( false );

		Functions\expect( 'wp_schedule_event' )
			->once()
			->with(
				Mockery::type( 'int' ),
				'daily',
				'resa_partial_lead_cleanup'
			);

		PartialLeadCleanup::register();
	}

	public function test_register_plant_nicht_erneut_wenn_schon_geplant(): void {
		Functions\expect( 'add_action' )->once();

		Functions\expect( 'wp_next_scheduled' )
			->once()
			->with( 'resa_partial_lead_cleanup' )
			->andReturn( 1234567890 );

		Functions\expect( 'wp_schedule_event' )->never();

		PartialLeadCleanup::register();
	}

	public function test_cleanup_loescht_abgelaufene_partial_leads(): void {
		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';

		Functions\expect( 'current_time' )
			->once()
			->with( 'mysql', true )
			->andReturn( '2026-03-04 12:00:00' );

		$wpdb->shouldReceive( 'prepare' )
			->once()
			->andReturn( 'PREPARED_SQL' );

		$wpdb->shouldReceive( 'query' )
			->once()
			->with( 'PREPARED_SQL' )
			->andReturn( 3 );

		PartialLeadCleanup::cleanup();
	}

	public function test_unschedule_entfernt_geplanten_cron(): void {
		Functions\expect( 'wp_next_scheduled' )
			->once()
			->with( 'resa_partial_lead_cleanup' )
			->andReturn( 1234567890 );

		Functions\expect( 'wp_unschedule_event' )
			->once()
			->with( 1234567890, 'resa_partial_lead_cleanup' );

		PartialLeadCleanup::unschedule();
	}

	public function test_unschedule_tut_nichts_wenn_nicht_geplant(): void {
		Functions\expect( 'wp_next_scheduled' )
			->once()
			->with( 'resa_partial_lead_cleanup' )
			->andReturn( false );

		Functions\expect( 'wp_unschedule_event' )->never();

		PartialLeadCleanup::unschedule();
	}
}
