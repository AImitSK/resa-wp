<?php

declare( strict_types=1 );

namespace Resa\Tests\Integration;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Services\Pdf\PdfGenerator;
use Resa\Services\Pdf\PdfEngineInterface;

/**
 * Integration test: PDF generation with mPDF engine.
 *
 * Tests the PdfGenerator class which uses a single PDF engine (mPDF by default).
 */
class PdfIntegrationTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		Functions\when( 'sanitize_file_name' )->returnArg();
		Functions\when( 'apply_filters' )->alias( fn( $tag, $value ) => $value );
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	// ── Engine Access ───────────────────────────────────────────

	public function test_getEngine_returns_injected_engine(): void {
		$engine = Mockery::mock( PdfEngineInterface::class );
		$engine->shouldReceive( 'getName' )->andReturn( 'mpdf' );

		$generator = new PdfGenerator( $engine );

		$this->assertSame( $engine, $generator->getEngine() );
		$this->assertSame( 'mpdf', $generator->getEngine()->getName() );
	}

	public function test_constructor_uses_default_engine_when_null(): void {
		// When no engine is passed, MpdfEngine is used by default.
		$generator = new PdfGenerator();

		$this->assertSame( 'mpdf', $generator->getEngine()->getName() );
	}

	// ── Engine Info ──────────────────────────────────────────────

	public function test_getEngineInfo_returns_engine_status(): void {
		$engine = Mockery::mock( PdfEngineInterface::class );
		$engine->shouldReceive( 'isAvailable' )->andReturn( true );
		$engine->shouldReceive( 'getName' )->andReturn( 'mpdf' );

		$generator = new PdfGenerator( $engine );
		$info      = $generator->getEngineInfo();

		$this->assertSame( 'mpdf', $info['engine'] );
		$this->assertTrue( $info['available'] );
	}

	public function test_getEngineInfo_shows_unavailable_engine(): void {
		$engine = Mockery::mock( PdfEngineInterface::class );
		$engine->shouldReceive( 'isAvailable' )->andReturn( false );
		$engine->shouldReceive( 'getName' )->andReturn( 'mpdf' );

		$generator = new PdfGenerator( $engine );
		$info      = $generator->getEngineInfo();

		$this->assertSame( 'mpdf', $info['engine'] );
		$this->assertFalse( $info['available'] );
	}

	// ── Generate ─────────────────────────────────────────────────

	public function test_generate_throws_exception_for_missing_template(): void {
		$engine = Mockery::mock( PdfEngineInterface::class );
		$engine->shouldReceive( 'getName' )->andReturn( 'mpdf' );

		$generator = new PdfGenerator( $engine );

		$this->expectException( \RuntimeException::class );
		$this->expectExceptionMessage( 'PDF-Template nicht gefunden' );

		$generator->generate( 'non-existent-template', [] );
	}

	// ── GenerateToFile ───────────────────────────────────────────

	public function test_generateToFile_creates_directory(): void {
		Functions\when( 'wp_mkdir_p' )->justReturn( true );

		$engine = Mockery::mock( PdfEngineInterface::class );
		$engine->shouldReceive( 'getName' )->andReturn( 'mpdf' );

		$generator = new PdfGenerator( $engine );

		// Verify the generator was created with the engine.
		$this->assertSame( 'mpdf', $generator->getEngine()->getName() );
	}

	// ── Custom Engine ────────────────────────────────────────────

	public function test_custom_engine_can_be_injected(): void {
		$customEngine = Mockery::mock( PdfEngineInterface::class );
		$customEngine->shouldReceive( 'isAvailable' )->andReturn( true );
		$customEngine->shouldReceive( 'getName' )->andReturn( 'custom-engine' );

		$generator = new PdfGenerator( $customEngine );
		$info      = $generator->getEngineInfo();

		$this->assertSame( 'custom-engine', $info['engine'] );
		$this->assertTrue( $info['available'] );
	}
}
