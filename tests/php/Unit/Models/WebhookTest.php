<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Models;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Models\Webhook;

class WebhookTest extends TestCase {

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

		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'esc_url_raw' )->andReturnFirstArg();
		Functions\expect( 'wp_json_encode' )->andReturnUsing( 'json_encode' );
		Functions\expect( 'current_time' )->andReturn( '2025-06-01 12:00:00' );

		$wpdb->shouldReceive( 'insert' )
			->once()
			->andReturnUsing( function () use ( $wpdb ) {
				$wpdb->insert_id = 3;
				return 1;
			} );

		$id = Webhook::create( [
			'name'   => 'Test Webhook',
			'url'    => 'https://hooks.zapier.com/test',
			'secret' => 'whsec_abc123',
		] );

		$this->assertEquals( 3, $id );
	}

	public function test_create_returns_false_on_failure(): void {
		global $wpdb;

		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'esc_url_raw' )->andReturnFirstArg();
		Functions\expect( 'wp_json_encode' )->andReturnUsing( 'json_encode' );
		Functions\expect( 'current_time' )->andReturn( '2025-06-01 12:00:00' );

		$wpdb->shouldReceive( 'insert' )->once()->andReturn( false );

		$result = Webhook::create( [ 'name' => '', 'url' => '' ] );

		$this->assertFalse( $result );
	}

	public function test_create_generates_default_secret(): void {
		global $wpdb;

		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'esc_url_raw' )->andReturnFirstArg();
		Functions\expect( 'wp_json_encode' )->andReturnUsing( 'json_encode' );
		Functions\expect( 'current_time' )->andReturn( '2025-06-01 12:00:00' );

		$wpdb->shouldReceive( 'insert' )
			->once()
			->andReturnUsing( function ( $table, $data ) use ( $wpdb ) {
				// Verify secret was auto-generated with whsec_ prefix.
				$this->assertStringStartsWith( 'whsec_', $data['secret'] );
				$this->assertEquals( 54, strlen( $data['secret'] ) ); // whsec_ (6) + 48 hex chars.
				$wpdb->insert_id = 1;
				return 1;
			} );

		Webhook::create( [
			'name' => 'Auto Secret',
			'url'  => 'https://example.com/webhook',
		] );
	}

	public function test_create_uses_default_events(): void {
		global $wpdb;

		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'esc_url_raw' )->andReturnFirstArg();
		Functions\expect( 'wp_json_encode' )->andReturnUsing( 'json_encode' );
		Functions\expect( 'current_time' )->andReturn( '2025-06-01 12:00:00' );

		$wpdb->shouldReceive( 'insert' )
			->once()
			->andReturnUsing( function ( $table, $data ) use ( $wpdb ) {
				$events = json_decode( $data['events'], true );
				$this->assertEquals( [ 'lead.created' ], $events );
				$wpdb->insert_id = 1;
				return 1;
			} );

		Webhook::create( [
			'name' => 'Default Events',
			'url'  => 'https://example.com/webhook',
		] );
	}

	public function test_findById_returns_object(): void {
		global $wpdb;

		$row = (object) [
			'id'     => 5,
			'name'   => 'Zapier',
			'url'    => 'https://hooks.zapier.com/test',
			'secret' => 'whsec_abc',
		];

		$wpdb->shouldReceive( 'prepare' )
			->once()
			->andReturn( 'SELECT * FROM wp_resa_webhooks WHERE id = 5 LIMIT 1' );

		$wpdb->shouldReceive( 'get_row' )
			->once()
			->andReturn( $row );

		$result = Webhook::findById( 5 );

		$this->assertNotNull( $result );
		$this->assertEquals( 'Zapier', $result->name );
	}

	public function test_findById_returns_null_for_missing(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'query' );
		$wpdb->shouldReceive( 'get_row' )->once()->andReturn( null );

		$result = Webhook::findById( 999 );

		$this->assertNull( $result );
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

		$result = Webhook::getAll();

		$this->assertCount( 2, $result );
	}

	public function test_getAll_returns_empty_on_null(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'get_results' )
			->once()
			->andReturn( null );

		$result = Webhook::getAll();

		$this->assertIsArray( $result );
		$this->assertEmpty( $result );
	}

	public function test_getActive_filters_active_webhooks(): void {
		global $wpdb;

		$rows = [
			(object) [ 'id' => 1, 'name' => 'Active', 'is_active' => 1 ],
		];

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'query' );
		$wpdb->shouldReceive( 'get_results' )->once()->andReturn( $rows );

		$result = Webhook::getActive();

		$this->assertCount( 1, $result );
	}

	public function test_update_returns_true_on_success(): void {
		global $wpdb;

		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'current_time' )->andReturn( '2025-06-01 13:00:00' );

		$wpdb->shouldReceive( 'update' )
			->once()
			->andReturn( 1 );

		$result = Webhook::update( 1, [ 'name' => 'Updated Webhook' ] );

		$this->assertTrue( $result );
	}

	public function test_update_returns_false_for_empty_data(): void {
		$result = Webhook::update( 1, [] );

		$this->assertFalse( $result );
	}

	public function test_update_sanitizes_url(): void {
		global $wpdb;

		Functions\expect( 'esc_url_raw' )->once()->andReturn( 'https://safe.com' );
		Functions\expect( 'current_time' )->andReturn( '2025-06-01 13:00:00' );

		$wpdb->shouldReceive( 'update' )
			->once()
			->andReturnUsing( function ( $table, $fields ) {
				$this->assertEquals( 'https://safe.com', $fields['url'] );
				return 1;
			} );

		Webhook::update( 1, [ 'url' => 'https://safe.com' ] );
	}

	public function test_update_sets_is_active(): void {
		global $wpdb;

		Functions\expect( 'current_time' )->andReturn( '2025-06-01 13:00:00' );

		$wpdb->shouldReceive( 'update' )
			->once()
			->andReturnUsing( function ( $table, $fields ) {
				$this->assertEquals( 0, $fields['is_active'] );
				return 1;
			} );

		Webhook::update( 1, [ 'is_active' => false ] );
	}

	public function test_delete_returns_true(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'delete' )
			->once()
			->with( 'wp_resa_webhooks', [ 'id' => 3 ], [ '%d' ] )
			->andReturn( 1 );

		$this->assertTrue( Webhook::delete( 3 ) );
	}

	public function test_delete_returns_false_on_failure(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'delete' )
			->once()
			->andReturn( false );

		$this->assertFalse( Webhook::delete( 999 ) );
	}

	public function test_count_returns_integer(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'get_var' )
			->once()
			->andReturn( '3' );

		$this->assertEquals( 3, Webhook::count() );
	}

	public function test_count_returns_zero_for_empty_table(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'get_var' )
			->once()
			->andReturn( '0' );

		$this->assertEquals( 0, Webhook::count() );
	}

	public function test_generateSecret_has_correct_format(): void {
		$secret = Webhook::generateSecret();

		$this->assertStringStartsWith( 'whsec_', $secret );
		$this->assertEquals( 54, strlen( $secret ) ); // whsec_ (6) + 48 hex chars.
	}

	public function test_generateSecret_is_unique(): void {
		$secret1 = Webhook::generateSecret();
		$secret2 = Webhook::generateSecret();

		$this->assertNotEquals( $secret1, $secret2 );
	}
}
