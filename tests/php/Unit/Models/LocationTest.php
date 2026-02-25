<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Models;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Models\Location;

class LocationTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_create_returns_id(): void {
		global $wpdb;

		Functions\expect( 'sanitize_title' )->andReturn( 'teststadt' );
		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'wp_json_encode' )->andReturnUsing( 'json_encode' );
		Functions\expect( 'current_time' )->andReturn( '2025-01-01 12:00:00' );
		Functions\expect( 'absint' )->andReturnUsing( 'intval' );

		$wpdb->shouldReceive( 'insert' )
			->once()
			->andReturnUsing( function () use ( $wpdb ) {
				$wpdb->insert_id = 7;
				return 1;
			} );

		$id = Location::create( [
			'name' => 'Teststadt',
			'slug' => 'teststadt',
			'data' => [ 'base_price' => 9.50 ],
		] );

		$this->assertEquals( 7, $id );
	}

	public function test_create_returns_false_on_failure(): void {
		global $wpdb;

		Functions\expect( 'sanitize_title' )->andReturn( '' );
		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'wp_json_encode' )->andReturnUsing( 'json_encode' );
		Functions\expect( 'current_time' )->andReturn( '2025-01-01 12:00:00' );
		Functions\expect( 'absint' )->andReturnUsing( 'intval' );

		$wpdb->shouldReceive( 'insert' )->once()->andReturn( false );

		$result = Location::create( [ 'name' => '' ] );

		$this->assertFalse( $result );
	}

	public function test_findById_returns_object(): void {
		global $wpdb;

		$row     = (object) [ 'id' => 5, 'slug' => 'berlin', 'name' => 'Berlin' ];

		$wpdb->shouldReceive( 'prepare' )
			->once()
			->andReturn( 'SELECT * FROM wp_resa_locations WHERE id = 5 LIMIT 1' );

		$wpdb->shouldReceive( 'get_row' )
			->once()
			->andReturn( $row );

		$result = Location::findById( 5 );

		$this->assertNotNull( $result );
		$this->assertEquals( 'berlin', $result->slug );
	}

	public function test_findBySlug_returns_object(): void {
		global $wpdb;

		$row = (object) [ 'id' => 5, 'slug' => 'berlin', 'name' => 'Berlin' ];

		$wpdb->shouldReceive( 'prepare' )
			->once()
			->andReturn( 'SELECT * FROM wp_resa_locations WHERE slug = "berlin" LIMIT 1' );

		$wpdb->shouldReceive( 'get_row' )
			->once()
			->andReturn( $row );

		$result = Location::findBySlug( 'berlin' );

		$this->assertNotNull( $result );
		$this->assertEquals( 5, $result->id );
	}

	public function test_getAll_returns_array(): void {
		global $wpdb;

		$rows = [
			(object) [ 'id' => 1, 'name' => 'A' ],
			(object) [ 'id' => 2, 'name' => 'B' ],
		];

		$wpdb->shouldReceive( 'get_results' )
			->once()
			->andReturn( $rows );

		$result = Location::getAll();

		$this->assertCount( 2, $result );
	}

	public function test_delete_returns_true(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'delete' )
			->once()
			->with( 'wp_resa_locations', [ 'id' => 3 ], [ '%d' ] )
			->andReturn( 1 );

		$this->assertTrue( Location::delete( 3 ) );
	}

	public function test_count_returns_integer(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'get_var' )
			->once()
			->andReturn( '5' );

		$this->assertEquals( 5, Location::count() );
	}

	public function test_getCalculationData_prefers_factors(): void {
		$location = (object) [
			'data'    => json_encode( [ 'base_price' => 9.50 ] ),
			'factors' => json_encode( [ 'base_price' => 12.00 ] ),
		];

		$result = Location::getCalculationData( $location );

		$this->assertEquals( 12.00, $result['base_price'] );
	}

	public function test_getCalculationData_falls_back_to_data(): void {
		$location = (object) [
			'data'    => json_encode( [ 'base_price' => 9.50 ] ),
			'factors' => null,
		];

		$result = Location::getCalculationData( $location );

		$this->assertEquals( 9.50, $result['base_price'] );
	}
}
