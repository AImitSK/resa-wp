<?php

declare( strict_types=1 );

namespace Resa\Tests\Integration;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Models\Location;

/**
 * Integration test: Location CRUD with geocoding data and calculation mode.
 */
class LocationIntegrationTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';

		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\when( 'sanitize_title' )->returnArg();
		Functions\when( 'absint' )->alias( fn( $v ) => abs( (int) $v ) );
		Functions\when( 'wp_json_encode' )->alias( 'json_encode' );
		Functions\when( 'current_time' )->justReturn( '2025-06-01 12:00:00' );
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	// ── Create ───────────────────────────────────────────────

	public function test_create_erstellt_standort_mit_koordinaten(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'insert' )
			->once()
			->with(
				'wp_resa_locations',
				Mockery::on( fn( $data ) =>
					$data['slug'] === 'muenchen' &&
					$data['name'] === 'München' &&
					$data['bundesland'] === 'Bayern' &&
					$data['latitude'] === 48.1351 &&
					$data['longitude'] === 11.5820 &&
					$data['zoom_level'] === 12
				),
				Mockery::type( 'array' )
			)
			->andReturnUsing( function () use ( $wpdb ) {
				$wpdb->insert_id = 1;
				return 1;
			} );

		$id = Location::create( [
			'slug'        => 'muenchen',
			'name'        => 'München',
			'bundesland'  => 'Bayern',
			'region_type' => 'large_city',
			'latitude'    => 48.1351,
			'longitude'   => 11.5820,
			'zoom_level'  => 12,
			'data'        => [ 'base_price' => 14.0 ],
		] );

		$this->assertSame( 1, $id );
	}

	public function test_create_setzt_defaults(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'insert' )
			->once()
			->with(
				'wp_resa_locations',
				Mockery::on( fn( $data ) =>
					$data['country'] === 'DE' &&
					$data['currency'] === 'EUR' &&
					$data['zoom_level'] === 13 &&
					$data['is_active'] === 1
				),
				Mockery::type( 'array' )
			)
			->andReturnUsing( function () use ( $wpdb ) {
				$wpdb->insert_id = 2;
				return 1;
			} );

		$this->assertSame( 2, Location::create( [ 'name' => 'Berlin' ] ) );
	}

	// ── Read ─────────────────────────────────────────────────

	public function test_findById_gibt_standort_zurueck(): void {
		global $wpdb;

		$location = (object) [
			'id'          => 1,
			'slug'        => 'muenchen',
			'name'        => 'München',
			'bundesland'  => 'Bayern',
			'region_type' => 'large_city',
			'is_active'   => 1,
		];

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'sql' );
		$wpdb->shouldReceive( 'get_row' )->once()->andReturn( $location );

		$result = Location::findById( 1 );

		$this->assertSame( 'München', $result->name );
	}

	public function test_findBySlug_gibt_standort_zurueck(): void {
		global $wpdb;

		$location = (object) [ 'id' => 1, 'slug' => 'muenchen' ];

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'sql' );
		$wpdb->shouldReceive( 'get_row' )->once()->andReturn( $location );

		$this->assertSame( 1, Location::findBySlug( 'muenchen' )->id );
	}

	public function test_getAll_gibt_alle_standorte_zurueck(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'get_results' )
			->once()
			->andReturn( [
				(object) [ 'id' => 1, 'name' => 'Berlin', 'is_active' => 1 ],
				(object) [ 'id' => 2, 'name' => 'München', 'is_active' => 0 ],
			] );

		$this->assertCount( 2, Location::getAll() );
	}

	public function test_getAll_nur_aktive(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'sql' );
		$wpdb->shouldReceive( 'get_results' )
			->once()
			->andReturn( [
				(object) [ 'id' => 1, 'name' => 'Berlin', 'is_active' => 1 ],
			] );

		$this->assertCount( 1, Location::getAll( true ) );
	}

	// ── Update ───────────────────────────────────────────────

	public function test_update_aendert_name_und_koordinaten(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'update' )
			->once()
			->with(
				'wp_resa_locations',
				Mockery::on( fn( $data ) =>
					$data['name'] === 'München Zentrum' &&
					$data['latitude'] === 48.14 &&
					$data['longitude'] === 11.58
				),
				[ 'id' => 1 ],
				Mockery::type( 'array' ),
				[ '%d' ]
			)
			->andReturn( 1 );

		$this->assertTrue( Location::update( 1, [
			'name'      => 'München Zentrum',
			'latitude'  => 48.14,
			'longitude' => 11.58,
		] ) );
	}

	public function test_update_mit_custom_factors(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'update' )
			->once()
			->with(
				'wp_resa_locations',
				Mockery::on( fn( $data ) => $data['factors'] !== null ),
				[ 'id' => 1 ],
				Mockery::type( 'array' ),
				[ '%d' ]
			)
			->andReturn( 1 );

		$this->assertTrue( Location::update( 1, [
			'factors' => [ 'base_price' => 16.0, 'size_degression' => 0.07 ],
		] ) );
	}

	public function test_update_gibt_false_fuer_leere_daten(): void {
		$this->assertFalse( Location::update( 1, [] ) );
	}

	// ── Delete ───────────────────────────────────────────────

	public function test_delete_loescht_standort(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'delete' )
			->once()
			->with( 'wp_resa_locations', [ 'id' => 1 ], [ '%d' ] )
			->andReturn( 1 );

		$this->assertTrue( Location::delete( 1 ) );
	}

	// ── Count ────────────────────────────────────────────────

	public function test_count_alle(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'get_var' )->once()->andReturn( '5' );

		$this->assertSame( 5, Location::count() );
	}

	public function test_count_nur_aktive(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'sql' );
		$wpdb->shouldReceive( 'get_var' )->once()->andReturn( '3' );

		$this->assertSame( 3, Location::count( true ) );
	}

	// ── Calculation Data ─────────────────────────────────────

	public function test_getCalculationData_nutzt_factors_wenn_vorhanden(): void {
		$location = (object) [
			'data'    => json_encode( [ 'base_price' => 10.0 ] ),
			'factors' => json_encode( [ 'base_price' => 16.0, 'custom' => true ] ),
		];

		$result = Location::getCalculationData( $location );

		$this->assertEquals( 16.0, $result['base_price'] );
		$this->assertTrue( $result['custom'] );
	}

	public function test_getCalculationData_faellt_auf_data_zurueck(): void {
		$location = (object) [
			'data'    => json_encode( [ 'base_price' => 10.0 ] ),
			'factors' => null,
		];

		$result = Location::getCalculationData( $location );

		$this->assertEquals( 10.0, $result['base_price'] );
	}

	public function test_getCalculationData_leere_daten(): void {
		$location = (object) [
			'data'    => '{}',
			'factors' => null,
		];

		$this->assertSame( [], Location::getCalculationData( $location ) );
	}
}
