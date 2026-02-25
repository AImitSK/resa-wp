<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Services\Pdf;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Services\Pdf\DompdfEngine;

class DompdfEngineTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_getName_returns_dompdf(): void {
		$engine = new DompdfEngine();
		$this->assertSame( 'dompdf', $engine->getName() );
	}

	public function test_isAvailable_returns_true_when_class_exists(): void {
		$engine = new DompdfEngine();
		// Dompdf class is autoloaded via Composer.
		$this->assertTrue( $engine->isAvailable() );
	}

	public function test_generate_produces_pdf_output(): void {
		Functions\when( 'apply_filters' )->returnArg( 2 );

		$engine = new DompdfEngine();
		$html   = '<!DOCTYPE html><html><body><h1>Test</h1></body></html>';

		$result = $engine->generate( $html );

		$this->assertStringStartsWith( '%PDF-', $result );
		$this->assertGreaterThan( 100, strlen( $result ) );
	}

	public function test_generate_accepts_landscape_orientation(): void {
		Functions\when( 'apply_filters' )->returnArg( 2 );

		$engine = new DompdfEngine();
		$html   = '<!DOCTYPE html><html><body><p>Landscape</p></body></html>';

		$result = $engine->generate( $html, [ 'orientation' => 'landscape' ] );

		$this->assertStringStartsWith( '%PDF-', $result );
	}

	public function test_implements_interface(): void {
		$engine = new DompdfEngine();
		$this->assertInstanceOf( \Resa\Services\Pdf\PdfEngineInterface::class, $engine );
	}
}
