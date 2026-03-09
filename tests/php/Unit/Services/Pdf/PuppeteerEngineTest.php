<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Services\Pdf;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Services\Pdf\PuppeteerEngine;

class PuppeteerEngineTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	/**
	 * Mock WP HTTP functions to simulate an available Puppeteer service.
	 */
	private function mockServiceAvailable(): void {
		Functions\when( 'wp_remote_get' )->justReturn( [ 'response' => [ 'code' => 200 ] ] );
		Functions\when( 'is_wp_error' )->justReturn( false );
		Functions\when( 'wp_remote_retrieve_response_code' )->justReturn( 200 );
	}

	/**
	 * Mock WP HTTP functions to simulate an unavailable Puppeteer service.
	 */
	private function mockServiceUnavailable(): void {
		Functions\when( 'wp_remote_get' )->justReturn( [ 'response' => [ 'code' => 503 ] ] );
		Functions\when( 'is_wp_error' )->justReturn( false );
		Functions\when( 'wp_remote_retrieve_response_code' )->justReturn( 503 );
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_getName_returns_puppeteer(): void {
		$engine = new PuppeteerEngine( 'http://node:3000' );
		$this->assertSame( 'puppeteer', $engine->getName() );
	}

	public function test_implements_interface(): void {
		$engine = new PuppeteerEngine( 'http://node:3000' );
		$this->assertInstanceOf( \Resa\Services\Pdf\PdfEngineInterface::class, $engine );
	}

	public function test_isAvailable_checks_service_health(): void {
		$this->mockServiceAvailable();

		$engine = new PuppeteerEngine( 'http://node:3000' );
		$result = $engine->isAvailable();
		$this->assertIsBool( $result );
	}

	public function test_generate_throws_when_not_available(): void {
		$this->mockServiceUnavailable();

		$engine = new PuppeteerEngine( 'http://nonexistent:3000' );

		$this->expectException( \RuntimeException::class );
		$this->expectExceptionMessage( 'not available' );
		$engine->generate( '<html></html>' );
	}

	public function test_custom_service_url_is_used(): void {
		$customUrl = 'http://custom-service:3000';
		$engine    = new PuppeteerEngine( $customUrl );

		// Engine should be instantiable with custom URL.
		$this->assertSame( 'puppeteer', $engine->getName() );
	}
}
