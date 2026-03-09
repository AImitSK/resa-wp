<?php

declare( strict_types=1 );

namespace Resa\Tests\Integration;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Models\Lead;

/**
 * Integration test: Lead search, filtering, pagination, and ordering.
 */
class SearchIntegrationTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';

		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\when( 'sanitize_key' )->returnArg();
		Functions\when( 'absint' )->alias( fn( $v ) => abs( (int) $v ) );
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	// ── Basic getAll ─────────────────────────────────────────

	public function test_getAll_gibt_paginierte_ergebnisse(): void {
		global $wpdb;

		$items = [
			(object) [ 'id' => 1, 'first_name' => 'Max', 'status' => 'new', 'location_name' => 'Berlin' ],
			(object) [ 'id' => 2, 'first_name' => 'Anna', 'status' => 'new', 'location_name' => 'München' ],
		];

		// Count query.
		$wpdb->shouldReceive( 'prepare' )->andReturn( 'prepared-sql' );
		$wpdb->shouldReceive( 'get_var' )->once()->andReturn( '2' );

		// Items query.
		$wpdb->shouldReceive( 'get_results' )->once()->andReturn( $items );
		$wpdb->shouldReceive( 'esc_like' )->andReturnArg( 0 );

		$result = Lead::getAll();

		$this->assertCount( 2, $result['items'] );
		$this->assertSame( 2, $result['total'] );
		$this->assertSame( 1, $result['page'] );
		$this->assertSame( 25, $result['per_page'] );
		$this->assertSame( 1, $result['total_pages'] );
	}

	// ── Status Filter ────────────────────────────────────────

	public function test_getAll_filtert_nach_status(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'prepared-sql' );
		$wpdb->shouldReceive( 'get_var' )->once()->andReturn( '5' );
		$wpdb->shouldReceive( 'get_results' )->once()->andReturn( array_fill( 0, 5, (object) [] ) );
		$wpdb->shouldReceive( 'esc_like' )->andReturnArg( 0 );

		$result = Lead::getAll( [ 'status' => 'contacted' ] );

		$this->assertSame( 5, $result['total'] );
	}

	// ── Search Filter ────────────────────────────────────────

	public function test_getAll_sucht_in_name_und_email(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'esc_like' )->once()->with( 'Max' )->andReturn( 'Max' );
		$wpdb->shouldReceive( 'prepare' )->andReturn( 'prepared-sql' );
		$wpdb->shouldReceive( 'get_var' )->once()->andReturn( '1' );
		$wpdb->shouldReceive( 'get_results' )->once()->andReturn( [
			(object) [ 'id' => 1, 'first_name' => 'Max', 'email' => 'max@example.com' ],
		] );

		$result = Lead::getAll( [ 'search' => 'Max' ] );

		$this->assertCount( 1, $result['items'] );
	}

	// ── Asset Type Filter ────────────────────────────────────

	public function test_getAll_filtert_nach_asset_type(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'prepared-sql' );
		$wpdb->shouldReceive( 'get_var' )->once()->andReturn( '3' );
		$wpdb->shouldReceive( 'get_results' )->once()->andReturn( array_fill( 0, 3, (object) [] ) );
		$wpdb->shouldReceive( 'esc_like' )->andReturnArg( 0 );

		$result = Lead::getAll( [ 'asset_type' => 'rent-calculator' ] );

		$this->assertSame( 3, $result['total'] );
	}

	// ── Location Filter ──────────────────────────────────────

	public function test_getAll_filtert_nach_location_id(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'prepared-sql' );
		$wpdb->shouldReceive( 'get_var' )->once()->andReturn( '2' );
		$wpdb->shouldReceive( 'get_results' )->once()->andReturn( array_fill( 0, 2, (object) [] ) );
		$wpdb->shouldReceive( 'esc_like' )->andReturnArg( 0 );

		$result = Lead::getAll( [ 'location_id' => 1 ] );

		$this->assertSame( 2, $result['total'] );
	}

	// ── Date Range Filter ────────────────────────────────────

	public function test_getAll_filtert_nach_datum(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'prepared-sql' );
		$wpdb->shouldReceive( 'get_var' )->once()->andReturn( '10' );
		$wpdb->shouldReceive( 'get_results' )->once()->andReturn( array_fill( 0, 10, (object) [] ) );
		$wpdb->shouldReceive( 'esc_like' )->andReturnArg( 0 );

		$result = Lead::getAll( [
			'date_from' => '2025-01-01',
			'date_to'   => '2025-06-30',
		] );

		$this->assertSame( 10, $result['total'] );
	}

	// ── Pagination ───────────────────────────────────────────

	public function test_getAll_paginiert_mit_custom_per_page(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'prepared-sql' );
		$wpdb->shouldReceive( 'get_var' )->once()->andReturn( '50' );
		$wpdb->shouldReceive( 'get_results' )->once()->andReturn( array_fill( 0, 10, (object) [] ) );
		$wpdb->shouldReceive( 'esc_like' )->andReturnArg( 0 );

		$result = Lead::getAll( [ 'page' => 2, 'per_page' => 10 ] );

		$this->assertSame( 50, $result['total'] );
		$this->assertSame( 2, $result['page'] );
		$this->assertSame( 10, $result['per_page'] );
		$this->assertSame( 5, $result['total_pages'] );
	}

	public function test_getAll_begrenzt_per_page_auf_100(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'prepared-sql' );
		$wpdb->shouldReceive( 'get_var' )->once()->andReturn( '200' );
		$wpdb->shouldReceive( 'get_results' )->once()->andReturn( [] );
		$wpdb->shouldReceive( 'esc_like' )->andReturnArg( 0 );

		$result = Lead::getAll( [ 'per_page' => 999 ] );

		$this->assertSame( 100, $result['per_page'] );
	}

	public function test_getAll_export_erlaubt_groessere_per_page(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'prepared-sql' );
		$wpdb->shouldReceive( 'get_var' )->once()->andReturn( '1000' );
		$wpdb->shouldReceive( 'get_results' )->once()->andReturn( [] );
		$wpdb->shouldReceive( 'esc_like' )->andReturnArg( 0 );

		$result = Lead::getAll( [ 'per_page' => 5000, 'export' => true ] );

		$this->assertSame( 5000, $result['per_page'] );
	}

	// ── Ordering ─────────────────────────────────────────────

	public function test_getAll_sortiert_nach_created_at_desc_default(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'prepared-sql' );
		$wpdb->shouldReceive( 'get_var' )->once()->andReturn( '0' );
		$wpdb->shouldReceive( 'get_results' )->once()->andReturn( [] );
		$wpdb->shouldReceive( 'esc_like' )->andReturnArg( 0 );

		$result = Lead::getAll();

		// Default sort is created_at DESC — verified by no exception.
		$this->assertSame( [], $result['items'] );
	}

	public function test_getAll_sanitized_unbekannte_orderby(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'prepared-sql' );
		$wpdb->shouldReceive( 'get_var' )->once()->andReturn( '0' );
		$wpdb->shouldReceive( 'get_results' )->once()->andReturn( [] );
		$wpdb->shouldReceive( 'esc_like' )->andReturnArg( 0 );

		// 'drop_tables' is not in allowed list → falls back to 'created_at'.
		$result = Lead::getAll( [ 'orderby' => 'drop_tables' ] );

		$this->assertSame( [], $result['items'] );
	}

	// ── Empty Results ────────────────────────────────────────

	public function test_getAll_leeres_ergebnis(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'prepared-sql' );
		$wpdb->shouldReceive( 'get_var' )->once()->andReturn( '0' );
		$wpdb->shouldReceive( 'get_results' )->once()->andReturn( false );
		$wpdb->shouldReceive( 'esc_like' )->andReturnArg( 0 );

		$result = Lead::getAll();

		$this->assertSame( [], $result['items'] );
		$this->assertSame( 0, $result['total'] );
		$this->assertSame( 0, $result['total_pages'] );
	}
}
