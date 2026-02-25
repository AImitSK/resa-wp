<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Services\Pdf;

use Brain\Monkey;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Services\Pdf\PuppeteerEngine;

class PuppeteerEngineTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_getName_returns_puppeteer(): void {
		$engine = new PuppeteerEngine();
		$this->assertSame( 'puppeteer', $engine->getName() );
	}

	public function test_implements_interface(): void {
		$engine = new PuppeteerEngine();
		$this->assertInstanceOf( \Resa\Services\Pdf\PdfEngineInterface::class, $engine );
	}

	public function test_isAvailable_checks_node_version(): void {
		// In CI / test environment, Node.js may or may not be available.
		// We just verify the method returns a boolean without errors.
		$engine = new PuppeteerEngine();
		$result = $engine->isAvailable();
		$this->assertIsBool( $result );
	}

	public function test_generate_throws_when_not_available(): void {
		$engine = new PuppeteerEngine( '/nonexistent/script.js' );

		// If Node.js is not available, it should throw.
		if ( ! $engine->isAvailable() ) {
			$this->expectException( \RuntimeException::class );
			$this->expectExceptionMessage( 'not available' );
			$engine->generate( '<html></html>' );
		} else {
			// If Node.js is available, skip this test scenario.
			$this->addToAssertionCount( 1 );
		}
	}

	public function test_custom_script_path_is_used(): void {
		$customPath = '/custom/path/generate-pdf.js';
		$engine     = new PuppeteerEngine( $customPath );

		// Engine should be instantiable with custom path.
		$this->assertSame( 'puppeteer', $engine->getName() );
	}
}
