<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Models;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Models\ApiKey;

class ApiKeyTest extends TestCase {

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

	public function test_generateKey_has_correct_format(): void {
		$key = ApiKey::generateKey();

		$this->assertStringStartsWith( 'resa_', $key );
		$this->assertEquals( 69, strlen( $key ) ); // resa_ (5) + 64 hex chars.
	}

	public function test_generateKey_is_unique(): void {
		$key1 = ApiKey::generateKey();
		$key2 = ApiKey::generateKey();

		$this->assertNotEquals( $key1, $key2 );
	}

	public function test_create_returns_id_and_key(): void {
		global $wpdb;

		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'current_time' )->andReturn( '2025-06-01 12:00:00' );

		$wpdb->shouldReceive( 'insert' )
			->once()
			->andReturnUsing( function ( $table, $data ) use ( $wpdb ) {
				// Verify hash is stored (64 hex chars).
				$this->assertEquals( 64, strlen( $data['key_hash'] ) );
				// Verify prefix is stored (13 chars: resa_xxxxxxxx).
				$this->assertEquals( 13, strlen( $data['key_prefix'] ) );
				$this->assertStringStartsWith( 'resa_', $data['key_prefix'] );
				$wpdb->insert_id = 7;
				return 1;
			} );

		$result = ApiKey::create( [ 'name' => 'Test Key' ] );

		$this->assertIsArray( $result );
		$this->assertEquals( 7, $result['id'] );
		$this->assertStringStartsWith( 'resa_', $result['key'] );
		$this->assertEquals( 69, strlen( $result['key'] ) );
	}

	public function test_create_returns_false_on_failure(): void {
		global $wpdb;

		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'current_time' )->andReturn( '2025-06-01 12:00:00' );

		$wpdb->shouldReceive( 'insert' )->once()->andReturn( false );

		$result = ApiKey::create( [ 'name' => 'Fail' ] );

		$this->assertFalse( $result );
	}

	public function test_create_hash_matches_generated_key(): void {
		global $wpdb;

		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'current_time' )->andReturn( '2025-06-01 12:00:00' );

		$capturedHash = '';
		$wpdb->shouldReceive( 'insert' )
			->once()
			->andReturnUsing( function ( $table, $data ) use ( $wpdb, &$capturedHash ) {
				$capturedHash    = $data['key_hash'];
				$wpdb->insert_id = 1;
				return 1;
			} );

		$result = ApiKey::create( [ 'name' => 'Hash Test' ] );

		// The stored hash should match the hash of the returned key.
		$this->assertEquals( $capturedHash, hash( 'sha256', $result['key'] ) );
	}

	public function test_findByKey_returns_active_key(): void {
		global $wpdb;

		$plainKey = 'resa_' . str_repeat( 'ab', 32 );
		$keyHash  = hash( 'sha256', $plainKey );

		$row = (object) [
			'id'        => 1,
			'name'      => 'My Key',
			'key_hash'  => $keyHash,
			'is_active' => 1,
		];

		$wpdb->shouldReceive( 'prepare' )
			->once()
			->andReturn( 'SELECT * FROM wp_resa_api_keys WHERE key_hash = ... AND is_active = 1 LIMIT 1' );

		$wpdb->shouldReceive( 'get_row' )
			->once()
			->andReturn( $row );

		$result = ApiKey::findByKey( $plainKey );

		$this->assertNotNull( $result );
		$this->assertEquals( 'My Key', $result->name );
	}

	public function test_findByKey_returns_null_for_invalid_key(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'query' );
		$wpdb->shouldReceive( 'get_row' )->once()->andReturn( null );

		$result = ApiKey::findByKey( 'resa_invalid_key' );

		$this->assertNull( $result );
	}

	public function test_findById_returns_object(): void {
		global $wpdb;

		$row = (object) [
			'id'   => 5,
			'name' => 'Dashboard',
		];

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'query' );
		$wpdb->shouldReceive( 'get_row' )->once()->andReturn( $row );

		$result = ApiKey::findById( 5 );

		$this->assertNotNull( $result );
		$this->assertEquals( 'Dashboard', $result->name );
	}

	public function test_findById_returns_null_for_missing(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'query' );
		$wpdb->shouldReceive( 'get_row' )->once()->andReturn( null );

		$this->assertNull( ApiKey::findById( 999 ) );
	}

	public function test_getAll_returns_array(): void {
		global $wpdb;

		$rows = [
			(object) [ 'id' => 1, 'name' => 'A' ],
			(object) [ 'id' => 2, 'name' => 'B' ],
		];

		$wpdb->shouldReceive( 'get_results' )->once()->andReturn( $rows );

		$this->assertCount( 2, ApiKey::getAll() );
	}

	public function test_getAll_returns_empty_on_null(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'get_results' )->once()->andReturn( null );

		$result = ApiKey::getAll();
		$this->assertIsArray( $result );
		$this->assertEmpty( $result );
	}

	public function test_update_returns_true_on_success(): void {
		global $wpdb;

		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();

		$wpdb->shouldReceive( 'update' )->once()->andReturn( 1 );

		$this->assertTrue( ApiKey::update( 1, [ 'name' => 'Updated' ] ) );
	}

	public function test_update_returns_false_for_empty_data(): void {
		$this->assertFalse( ApiKey::update( 1, [] ) );
	}

	public function test_update_sets_is_active(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'update' )
			->once()
			->andReturnUsing( function ( $table, $fields ) {
				$this->assertEquals( 0, $fields['is_active'] );
				return 1;
			} );

		ApiKey::update( 1, [ 'is_active' => false ] );
	}

	public function test_delete_returns_true(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'delete' )
			->once()
			->with( 'wp_resa_api_keys', [ 'id' => 3 ], [ '%d' ] )
			->andReturn( 1 );

		$this->assertTrue( ApiKey::delete( 3 ) );
	}

	public function test_delete_returns_false_on_failure(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'delete' )->once()->andReturn( false );

		$this->assertFalse( ApiKey::delete( 999 ) );
	}

	public function test_count_returns_integer(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'get_var' )->once()->andReturn( '3' );

		$this->assertEquals( 3, ApiKey::count() );
	}

	public function test_count_returns_zero_for_empty_table(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'get_var' )->once()->andReturn( '0' );

		$this->assertEquals( 0, ApiKey::count() );
	}

	public function test_touchLastUsed_calls_update(): void {
		global $wpdb;

		Functions\expect( 'current_time' )->once()->andReturn( '2025-06-01 15:00:00' );

		$wpdb->shouldReceive( 'update' )
			->once()
			->with(
				'wp_resa_api_keys',
				[ 'last_used_at' => '2025-06-01 15:00:00' ],
				[ 'id' => 5 ],
				[ '%s' ],
				[ '%d' ]
			)
			->andReturn( 1 );

		ApiKey::touchLastUsed( 5 );
	}
}
