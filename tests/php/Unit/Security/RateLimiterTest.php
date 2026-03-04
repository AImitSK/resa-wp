<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Security;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Security\RateLimiter;

class RateLimiterTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
		$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		unset( $_SERVER['REMOTE_ADDR'], $_SERVER['HTTP_X_FORWARDED_FOR'] );
		parent::tearDown();
	}

	public function test_check_erlaubt_ersten_request(): void {
		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\when( 'wp_unslash' )->returnArg();
		Functions\expect( 'get_transient' )->andReturn( false );
		Functions\expect( 'set_transient' )->andReturn( true );

		$this->assertTrue( RateLimiter::check() );
	}

	public function test_check_erlaubt_bis_minuten_limit(): void {
		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\when( 'wp_unslash' )->returnArg();

		// Minute counter at 4 (below limit of 5), hour counter at 0.
		Functions\expect( 'get_transient' )
			->twice()
			->andReturn( 4, 0 );
		Functions\expect( 'set_transient' )->andReturn( true );

		$this->assertTrue( RateLimiter::check() );
	}

	public function test_check_blockiert_nach_minuten_limit(): void {
		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\when( 'wp_unslash' )->returnArg();

		// Minute counter at 5 (= limit).
		Functions\expect( 'get_transient' )
			->once()
			->andReturn( 5 );

		$this->assertFalse( RateLimiter::check() );
	}

	public function test_check_blockiert_nach_stunden_limit(): void {
		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\when( 'wp_unslash' )->returnArg();

		// Minute counter at 3 (OK), hour counter at 20 (= limit).
		Functions\expect( 'get_transient' )
			->twice()
			->andReturn( 3, 20 );

		$this->assertFalse( RateLimiter::check() );
	}

	public function test_check_nutzt_x_forwarded_for(): void {
		$_SERVER['HTTP_X_FORWARDED_FOR'] = '10.0.0.1, 192.168.1.1';

		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\when( 'wp_unslash' )->returnArg();
		Functions\expect( 'get_transient' )->andReturn( false );
		Functions\expect( 'set_transient' )->andReturn( true );

		$this->assertTrue( RateLimiter::check() );
	}
}
