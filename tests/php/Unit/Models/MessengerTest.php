<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Models;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Models\Messenger;

class MessengerTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		// Mock $wpdb.
		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_platforms_constant_contains_expected_values(): void {
		$this->assertContains( 'slack', Messenger::PLATFORMS );
		$this->assertContains( 'teams', Messenger::PLATFORMS );
		$this->assertContains( 'discord', Messenger::PLATFORMS );
		$this->assertCount( 3, Messenger::PLATFORMS );
	}

	public function test_create_inserts_row_and_returns_id(): void {
		global $wpdb;

		Functions\expect( 'sanitize_text_field' )
			->andReturnUsing( fn( $v ) => $v );
		Functions\expect( 'esc_url_raw' )
			->andReturnUsing( fn( $v ) => $v );
		Functions\expect( 'current_time' )
			->andReturn( '2026-03-04 14:00:00' );

		$wpdb->shouldReceive( 'insert' )
			->once()
			->andReturn( 1 );
		$wpdb->insert_id = 42;

		$id = Messenger::create( [
			'name'        => 'Slack Test',
			'platform'    => 'slack',
			'webhook_url' => 'https://hooks.slack.com/services/T/B/xxx',
		] );

		$this->assertSame( 42, $id );
	}

	public function test_create_rejects_invalid_platform(): void {
		Functions\expect( 'sanitize_text_field' )
			->andReturnUsing( fn( $v ) => $v );

		$id = Messenger::create( [
			'name'        => 'Test',
			'platform'    => 'whatsapp',
			'webhook_url' => 'https://example.com',
		] );

		$this->assertFalse( $id );
	}

	public function test_create_returns_false_on_db_failure(): void {
		global $wpdb;

		Functions\expect( 'sanitize_text_field' )
			->andReturnUsing( fn( $v ) => $v );
		Functions\expect( 'esc_url_raw' )
			->andReturnUsing( fn( $v ) => $v );
		Functions\expect( 'current_time' )
			->andReturn( '2026-03-04 14:00:00' );

		$wpdb->shouldReceive( 'insert' )
			->once()
			->andReturn( false );

		$result = Messenger::create( [
			'name'        => 'Test',
			'platform'    => 'discord',
			'webhook_url' => 'https://discord.com/api/webhooks/123/abc',
		] );

		$this->assertFalse( $result );
	}

	public function test_findById_returns_object(): void {
		global $wpdb;

		$row = (object) [
			'id'          => 1,
			'name'        => 'Slack Test',
			'platform'    => 'slack',
			'webhook_url' => 'https://hooks.slack.com/services/T/B/xxx',
			'is_active'   => 1,
		];

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'SELECT ...' );
		$wpdb->shouldReceive( 'get_row' )->once()->andReturn( $row );

		$result = Messenger::findById( 1 );

		$this->assertNotNull( $result );
		$this->assertSame( 'Slack Test', $result->name );
	}

	public function test_findById_returns_null_for_unknown_id(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'SELECT ...' );
		$wpdb->shouldReceive( 'get_row' )->once()->andReturn( null );

		$this->assertNull( Messenger::findById( 999 ) );
	}

	public function test_getAll_returns_array(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'get_results' )
			->once()
			->andReturn( [
				(object) [ 'id' => 1, 'name' => 'A' ],
				(object) [ 'id' => 2, 'name' => 'B' ],
			] );

		$result = Messenger::getAll();

		$this->assertCount( 2, $result );
	}

	public function test_getAll_returns_empty_array_when_no_rows(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'get_results' )
			->once()
			->andReturn( null );

		$this->assertSame( [], Messenger::getAll() );
	}

	public function test_getActive_filters_inactive(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'SELECT ...' );
		$wpdb->shouldReceive( 'get_results' )
			->once()
			->andReturn( [
				(object) [ 'id' => 1, 'is_active' => 1 ],
			] );

		$result = Messenger::getActive();

		$this->assertCount( 1, $result );
	}

	public function test_update_changes_fields(): void {
		global $wpdb;

		Functions\expect( 'sanitize_text_field' )
			->andReturnUsing( fn( $v ) => $v );
		Functions\expect( 'current_time' )
			->andReturn( '2026-03-04 15:00:00' );

		$wpdb->shouldReceive( 'update' )
			->once()
			->andReturn( 1 );

		$result = Messenger::update( 1, [ 'name' => 'Updated' ] );

		$this->assertTrue( $result );
	}

	public function test_update_returns_false_for_empty_data(): void {
		$result = Messenger::update( 1, [] );
		$this->assertFalse( $result );
	}

	public function test_delete_removes_row(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'delete' )
			->once()
			->andReturn( 1 );

		$this->assertTrue( Messenger::delete( 1 ) );
	}

	public function test_count_returns_integer(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'get_var' )
			->once()
			->andReturn( '3' );

		$this->assertSame( 3, Messenger::count() );
	}
}
