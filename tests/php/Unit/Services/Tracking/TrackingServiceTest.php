<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Services\Tracking;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Services\Tracking\TrackingService;

class TrackingServiceTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';

		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\when( 'current_time' )->justReturn( '2026-02-25' );
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_isValidEvent_accepts_known_events(): void {
		$this->assertTrue( TrackingService::isValidEvent( 'asset_view' ) );
		$this->assertTrue( TrackingService::isValidEvent( 'asset_start' ) );
		$this->assertTrue( TrackingService::isValidEvent( 'step_complete' ) );
		$this->assertTrue( TrackingService::isValidEvent( 'form_view' ) );
		$this->assertTrue( TrackingService::isValidEvent( 'form_submit' ) );
		$this->assertTrue( TrackingService::isValidEvent( 'result_view' ) );
	}

	public function test_isValidEvent_rejects_unknown_events(): void {
		$this->assertFalse( TrackingService::isValidEvent( 'invalid_event' ) );
		$this->assertFalse( TrackingService::isValidEvent( '' ) );
		$this->assertFalse( TrackingService::isValidEvent( 'page_view' ) );
	}

	public function test_record_returns_false_for_invalid_event(): void {
		$result = TrackingService::record( 'invalid', 'mietpreis' );
		$this->assertFalse( $result );
	}

	public function test_record_creates_new_daily_row(): void {
		global $wpdb;

		// findDailyRow returns null (no existing row).
		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( null );

		// createDailyRow inserts new row.
		$wpdb->shouldReceive( 'insert' )
			->once()
			->with(
				'wp_resa_tracking_daily',
				Mockery::on( function ( array $data ): bool {
					return $data['date'] === '2026-02-25'
						&& $data['asset_type'] === 'mietpreis'
						&& $data['views'] === 1;
				} ),
				Mockery::type( 'array' )
			)
			->andReturn( 1 );

		$result = TrackingService::record( 'asset_view', 'mietpreis' );
		$this->assertTrue( $result );
	}

	public function test_record_increments_existing_row(): void {
		global $wpdb;

		$existingRow = (object) [
			'id'           => 42,
			'views'        => 10,
			'starts'       => 5,
			'form_views'   => 3,
			'form_submits' => 1,
		];

		// findDailyRow returns existing row.
		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( $existingRow );

		// incrementColumn updates the counter.
		$wpdb->shouldReceive( 'query' )->once()->andReturn( 1 );

		// recalculateRates updates rates.
		$wpdb->shouldReceive( 'update' )->once()->andReturn( 1 );

		$result = TrackingService::record( 'asset_view', 'mietpreis' );
		$this->assertTrue( $result );
	}

	public function test_record_with_location_id(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( null );

		$wpdb->shouldReceive( 'insert' )
			->once()
			->with(
				'wp_resa_tracking_daily',
				Mockery::on( function ( array $data ): bool {
					return $data['location_id'] === 5
						&& $data['starts'] === 1;
				} ),
				Mockery::type( 'array' )
			)
			->andReturn( 1 );

		$result = TrackingService::record( 'asset_start', 'mietpreis', 5 );
		$this->assertTrue( $result );
	}

	public function test_record_step_complete_fires_action_only(): void {
		// step_complete is valid but not aggregated into daily columns.
		Monkey\Actions\expectDone( 'resa_tracking_event' )
			->once()
			->with( 'step_complete', 'mietpreis', 0 );

		$result = TrackingService::record( 'step_complete', 'mietpreis' );
		$this->assertTrue( $result );
	}

	public function test_record_maps_events_to_correct_columns(): void {
		global $wpdb;

		$eventColumns = [
			'asset_view'  => 'views',
			'asset_start' => 'starts',
			'form_view'   => 'form_views',
			'form_submit' => 'form_submits',
			'result_view' => 'result_views',
		];

		foreach ( $eventColumns as $event => $column ) {
			$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
			$wpdb->shouldReceive( 'get_row' )->andReturn( null );
			$wpdb->shouldReceive( 'insert' )
				->once()
				->with(
					'wp_resa_tracking_daily',
					Mockery::on( function ( array $data ) use ( $column ): bool {
						return isset( $data[ $column ] ) && $data[ $column ] === 1;
					} ),
					Mockery::type( 'array' )
				)
				->andReturn( 1 );

			TrackingService::record( $event, 'test' );
		}
	}

	public function test_getFunnelData_returns_aggregated_data(): void {
		global $wpdb;

		$row = (object) [
			'views'        => '100',
			'starts'       => '62',
			'form_views'   => '40',
			'form_submits' => '20',
			'result_views' => '18',
		];

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( $row );

		$funnel = TrackingService::getFunnelData( '2026-02-01', '2026-02-25' );

		$this->assertSame( 100, $funnel['views'] );
		$this->assertSame( 62, $funnel['starts'] );
		$this->assertSame( 40, $funnel['form_views'] );
		$this->assertSame( 20, $funnel['form_submits'] );
		$this->assertSame( 62.0, $funnel['start_rate'] );
		$this->assertSame( 64.52, $funnel['completion_rate'] );
		$this->assertSame( 50.0, $funnel['conversion_rate'] );
	}

	public function test_getFunnelData_returns_empty_when_no_data(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( null );

		$funnel = TrackingService::getFunnelData( '2026-02-01', '2026-02-25' );

		$this->assertSame( 0, $funnel['views'] );
		$this->assertSame( 0.0, $funnel['start_rate'] );
	}

	public function test_getFunnelData_avoids_division_by_zero(): void {
		global $wpdb;

		$row = (object) [
			'views'        => '0',
			'starts'       => '0',
			'form_views'   => '0',
			'form_submits' => '0',
			'result_views' => '0',
		];

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( $row );

		$funnel = TrackingService::getFunnelData( '2026-02-01', '2026-02-25' );

		$this->assertSame( 0.0, $funnel['start_rate'] );
		$this->assertSame( 0.0, $funnel['completion_rate'] );
		$this->assertSame( 0.0, $funnel['conversion_rate'] );
	}

	public function test_getDailyBreakdown_returns_rows(): void {
		global $wpdb;

		$rows = [
			(object) [ 'date' => '2026-02-24', 'views' => 50 ],
			(object) [ 'date' => '2026-02-25', 'views' => 60 ],
		];

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_results' )->andReturn( $rows );

		$result = TrackingService::getDailyBreakdown( '2026-02-24', '2026-02-25' );

		$this->assertCount( 2, $result );
	}

	public function test_recalculateRates_updates_rates_correctly(): void {
		global $wpdb;

		$row = (object) [
			'views'        => 200,
			'starts'       => 100,
			'form_views'   => 50,
			'form_submits' => 25,
		];

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( $row );

		$wpdb->shouldReceive( 'update' )
			->once()
			->with(
				'wp_resa_tracking_daily',
				Mockery::on( function ( array $data ): bool {
					return $data['start_rate'] === 50.0
						&& $data['completion_rate'] === 50.0
						&& $data['conversion_rate'] === 50.0;
				} ),
				[ 'id' => 1 ],
				[ '%f', '%f', '%f' ],
				[ '%d' ]
			)
			->andReturn( 1 );

		$result = TrackingService::recalculateRates( 1 );
		$this->assertTrue( $result );
	}
}
