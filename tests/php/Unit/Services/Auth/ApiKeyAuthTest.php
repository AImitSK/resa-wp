<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Services\Auth;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Services\Auth\ApiKeyAuth;

class ApiKeyAuthTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		// Reset static state via reflection.
		$ref = new \ReflectionClass( ApiKeyAuth::class );

		$authenticated = $ref->getProperty( 'authenticated' );
		$authenticated->setAccessible( true );
		$authenticated->setValue( null, false );

		$keyId = $ref->getProperty( 'keyId' );
		$keyId->setAccessible( true );
		$keyId->setValue( null, null );
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_register_adds_filter(): void {
		Functions\expect( 'add_filter' )
			->once()
			->with( 'rest_authentication_errors', Mockery::type( 'array' ), 90 );

		ApiKeyAuth::register();
	}

	public function test_isAuthenticated_returns_false_by_default(): void {
		$this->assertFalse( ApiKeyAuth::isAuthenticated() );
	}

	public function test_authenticate_skips_non_external_routes(): void {
		$_SERVER['REQUEST_URI'] = '/wp-json/resa/v1/admin/leads';

		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'wp_unslash' )->andReturnFirstArg();

		$result = ApiKeyAuth::authenticate( null );

		$this->assertNull( $result );
		$this->assertFalse( ApiKeyAuth::isAuthenticated() );
	}

	public function test_authenticate_passes_through_existing_error(): void {
		$error = new \WP_Error( 'existing', 'Already failed' );

		$result = ApiKeyAuth::authenticate( $error );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'existing', $result->get_error_code() );
	}

	public function test_authenticate_returns_null_when_no_token_on_external_route(): void {
		$_SERVER['REQUEST_URI'] = '/wp-json/resa/v1/external/leads';
		unset( $_SERVER['HTTP_AUTHORIZATION'] );
		unset( $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] );

		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'wp_unslash' )->andReturnFirstArg();

		$result = ApiKeyAuth::authenticate( null );

		$this->assertNull( $result );
	}

	public function test_authenticate_rejects_invalid_token_format(): void {
		$_SERVER['REQUEST_URI']       = '/wp-json/resa/v1/external/leads';
		$_SERVER['HTTP_AUTHORIZATION'] = 'Bearer invalid_short_key';

		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'wp_unslash' )->andReturnFirstArg();
		Functions\expect( '__' )->andReturnFirstArg();

		$result = ApiKeyAuth::authenticate( null );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'resa_invalid_api_key', $result->get_error_code() );
	}

	public function test_authenticate_rejects_unknown_key(): void {
		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';

		$validKey = 'resa_' . str_repeat( 'ab', 32 ); // 69 chars.

		$_SERVER['REQUEST_URI']       = '/wp-json/resa/v1/external/leads';
		$_SERVER['HTTP_AUTHORIZATION'] = 'Bearer ' . $validKey;

		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'wp_unslash' )->andReturnFirstArg();
		Functions\expect( '__' )->andReturnFirstArg();

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'query' );
		$wpdb->shouldReceive( 'get_row' )->once()->andReturn( null );

		$result = ApiKeyAuth::authenticate( null );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'resa_invalid_api_key', $result->get_error_code() );
	}

	public function test_authenticate_succeeds_with_valid_key(): void {
		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';

		$validKey = 'resa_' . str_repeat( 'cd', 32 ); // 69 chars.

		$_SERVER['REQUEST_URI']       = '/wp-json/resa/v1/external/leads';
		$_SERVER['HTTP_AUTHORIZATION'] = 'Bearer ' . $validKey;

		$apiKeyRow = (object) [
			'id'        => 3,
			'name'      => 'Test',
			'is_active' => 1,
		];

		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'wp_unslash' )->andReturnFirstArg();
		Functions\expect( 'current_time' )->andReturn( '2025-06-01 12:00:00' );

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'query' );
		$wpdb->shouldReceive( 'get_row' )->once()->andReturn( $apiKeyRow );
		$wpdb->shouldReceive( 'update' )->once()->andReturn( 1 ); // touchLastUsed.

		$result = ApiKeyAuth::authenticate( null );

		$this->assertTrue( $result );
		$this->assertTrue( ApiKeyAuth::isAuthenticated() );
	}
}
