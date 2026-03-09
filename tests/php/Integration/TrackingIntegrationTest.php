<?php

declare( strict_types=1 );

namespace Resa\Tests\Integration;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Services\Tracking\TrackingService;

/**
 * Integration test: Tracking events, aggregation, and funnel data.
 */
class TrackingIntegrationTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';

		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\when( 'current_time' )->justReturn( '2025-06-01' );
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	// ── Event Validation ─────────────────────────────────────

	public function test_isValidEvent_akzeptiert_gueltige_events(): void {
		$this->assertTrue( TrackingService::isValidEvent( 'asset_view' ) );
		$this->assertTrue( TrackingService::isValidEvent( 'asset_start' ) );
		$this->assertTrue( TrackingService::isValidEvent( 'form_view' ) );
		$this->assertTrue( TrackingService::isValidEvent( 'form_submit' ) );
		$this->assertTrue( TrackingService::isValidEvent( 'result_view' ) );
		$this->assertTrue( TrackingService::isValidEvent( 'step_complete' ) );
		$this->assertTrue( TrackingService::isValidEvent( 'step_back' ) );
		$this->assertTrue( TrackingService::isValidEvent( 'form_interact' ) );
	}

	public function test_isValidEvent_lehnt_ungueltige_ab(): void {
		$this->assertFalse( TrackingService::isValidEvent( 'invalid_event' ) );
		$this->assertFalse( TrackingService::isValidEvent( '' ) );
		$this->assertFalse( TrackingService::isValidEvent( 'click' ) );
	}

	// ── Record Event ─────────────────────────────────────────

	public function test_record_erstellt_neue_daily_row(): void {
		global $wpdb;

		// findDailyRow → null (no existing row).
		$wpdb->shouldReceive( 'prepare' )->andReturn( 'sql' );
		$wpdb->shouldReceive( 'get_row' )->once()->andReturn( null );

		// createDailyRow.
		$wpdb->shouldReceive( 'insert' )
			->once()
			->with(
				'wp_resa_tracking_daily',
				Mockery::on( fn( $data ) =>
					$data['date'] === '2025-06-01' &&
					$data['asset_type'] === 'rent-calculator' &&
					$data['views'] === 1
				),
				Mockery::type( 'array' )
			)
			->andReturn( 1 );

		Functions\expect( 'do_action' )
			->once()
			->with( 'resa_tracking_event', 'asset_view', 'rent-calculator', 0 );

		$result = TrackingService::record( 'asset_view', 'rent-calculator' );

		$this->assertTrue( $result );
	}

	public function test_record_inkrementiert_bestehende_row(): void {
		global $wpdb;

		$existing = (object) [ 'id' => 7, 'views' => 5 ];

		// findDailyRow → existing.
		$wpdb->shouldReceive( 'prepare' )->andReturn( 'sql' );
		$wpdb->shouldReceive( 'get_row' )->once()->andReturn( $existing );

		// incrementColumn (UPDATE ... SET views = views + 1).
		$wpdb->shouldReceive( 'query' )->once()->andReturn( 1 );

		// recalculateRates after increment.
		$rateRow = (object) [
			'views'        => 6,
			'starts'       => 4,
			'form_views'   => 3,
			'form_submits' => 1,
		];
		$wpdb->shouldReceive( 'get_row' )->once()->andReturn( $rateRow );
		$wpdb->shouldReceive( 'update' )->once()->andReturn( 1 );

		Functions\expect( 'do_action' )
			->once()
			->with( 'resa_tracking_event', 'asset_view', 'rent-calculator', 0 );

		$result = TrackingService::record( 'asset_view', 'rent-calculator' );

		$this->assertTrue( $result );
	}

	public function test_record_mit_location_id(): void {
		global $wpdb;

		// findDailyRow with location_id.
		$wpdb->shouldReceive( 'prepare' )->andReturn( 'sql' );
		$wpdb->shouldReceive( 'get_row' )->once()->andReturn( null );

		// createDailyRow with location_id.
		$wpdb->shouldReceive( 'insert' )
			->once()
			->with(
				'wp_resa_tracking_daily',
				Mockery::on( fn( $data ) =>
					$data['location_id'] === 5 &&
					$data['starts'] === 1
				),
				Mockery::type( 'array' )
			)
			->andReturn( 1 );

		Functions\expect( 'do_action' )->once();

		$this->assertTrue( TrackingService::record( 'asset_start', 'rent-calculator', 5 ) );
	}

	public function test_record_lehnt_ungueltiges_event_ab(): void {
		$this->assertFalse( TrackingService::record( 'invalid', 'rent-calculator' ) );
	}

	public function test_record_nicht_aggregiertes_event_feuert_nur_action(): void {
		// step_complete is valid but not aggregated.
		Functions\expect( 'do_action' )
			->once()
			->with( 'resa_tracking_event', 'step_complete', 'rent-calculator', 0 );

		$result = TrackingService::record( 'step_complete', 'rent-calculator' );

		$this->assertTrue( $result );
	}

	// ── Funnel Data ──────────────────────────────────────────

	public function test_getFunnelData_aggregiert_korrekt(): void {
		global $wpdb;

		$row = (object) [
			'views'        => '100',
			'starts'       => '60',
			'form_views'   => '40',
			'form_submits' => '20',
			'result_views' => '18',
		];

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'sql' );
		$wpdb->shouldReceive( 'get_row' )->once()->andReturn( $row );

		$funnel = TrackingService::getFunnelData( '2025-01-01', '2025-06-30' );

		$this->assertSame( 100, $funnel['views'] );
		$this->assertSame( 60, $funnel['starts'] );
		$this->assertSame( 40, $funnel['form_views'] );
		$this->assertSame( 20, $funnel['form_submits'] );
		$this->assertSame( 18, $funnel['result_views'] );
		$this->assertSame( 60.0, $funnel['start_rate'] );
		$this->assertSame( 66.67, $funnel['completion_rate'] );
		$this->assertSame( 50.0, $funnel['conversion_rate'] );
	}

	public function test_getFunnelData_leeres_ergebnis(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'sql' );
		$wpdb->shouldReceive( 'get_row' )->once()->andReturn( null );

		$funnel = TrackingService::getFunnelData( '2025-01-01', '2025-06-30' );

		$this->assertSame( 0, $funnel['views'] );
		$this->assertSame( 0.0, $funnel['start_rate'] );
		$this->assertSame( 0.0, $funnel['conversion_rate'] );
	}

	public function test_getFunnelData_mit_asset_type_filter(): void {
		global $wpdb;

		$row = (object) [
			'views'        => '50',
			'starts'       => '30',
			'form_views'   => '20',
			'form_submits' => '10',
			'result_views' => '8',
		];

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'sql' );
		$wpdb->shouldReceive( 'get_row' )->once()->andReturn( $row );

		$funnel = TrackingService::getFunnelData( '2025-01-01', '2025-06-30', 'rent-calculator' );

		$this->assertSame( 50, $funnel['views'] );
	}

	// ── Daily Breakdown ──────────────────────────────────────

	public function test_getDailyBreakdown_gibt_tageswerte(): void {
		global $wpdb;

		$rows = [
			(object) [ 'date' => '2025-06-01', 'views' => 10, 'starts' => 6 ],
			(object) [ 'date' => '2025-06-02', 'views' => 15, 'starts' => 9 ],
		];

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'sql' );
		$wpdb->shouldReceive( 'get_results' )->once()->andReturn( $rows );

		$result = TrackingService::getDailyBreakdown( '2025-06-01', '2025-06-02' );

		$this->assertCount( 2, $result );
		$this->assertSame( '2025-06-01', $result[0]->date );
	}

	// ── Recalculate Rates ────────────────────────────────────

	public function test_recalculateRates_berechnet_korrekt(): void {
		global $wpdb;

		$row = (object) [
			'views'        => 100,
			'starts'       => 50,
			'form_views'   => 25,
			'form_submits' => 10,
		];

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'sql' );
		$wpdb->shouldReceive( 'get_row' )->once()->andReturn( $row );

		$wpdb->shouldReceive( 'update' )
			->once()
			->with(
				'wp_resa_tracking_daily',
				Mockery::on( fn( $data ) =>
					$data['start_rate'] === 50.0 &&
					$data['completion_rate'] === 50.0 &&
					$data['conversion_rate'] === 40.0
				),
				[ 'id' => 7 ],
				[ '%f', '%f', '%f' ],
				[ '%d' ]
			)
			->andReturn( 1 );

		$this->assertTrue( TrackingService::recalculateRates( 7 ) );
	}

	public function test_recalculateRates_gibt_false_fuer_fehlende_row(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'sql' );
		$wpdb->shouldReceive( 'get_row' )->once()->andReturn( null );

		$this->assertFalse( TrackingService::recalculateRates( 999 ) );
	}
}
