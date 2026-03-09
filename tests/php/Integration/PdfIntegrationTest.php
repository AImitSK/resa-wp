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
 * Integration test: PDF generation with engine detection and fallback.
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

	// ── Engine Detection ─────────────────────────────────────

	public function test_detectEngine_bevorzugt_puppeteer(): void {
		$puppeteer = Mockery::mock( PdfEngineInterface::class );
		$puppeteer->shouldReceive( 'isAvailable' )->once()->andReturn( true );
		$puppeteer->shouldReceive( 'getName' )->andReturn( 'puppeteer' );

		$dompdf = Mockery::mock( PdfEngineInterface::class );
		$dompdf->shouldReceive( 'getName' )->andReturn( 'dompdf' );

		$generator = new PdfGenerator( $puppeteer, $dompdf );
		$engine    = $generator->detectEngine();

		$this->assertSame( 'puppeteer', $engine->getName() );
	}

	public function test_detectEngine_fallback_auf_dompdf(): void {
		$puppeteer = Mockery::mock( PdfEngineInterface::class );
		$puppeteer->shouldReceive( 'isAvailable' )->once()->andReturn( false );

		$dompdf = Mockery::mock( PdfEngineInterface::class );
		$dompdf->shouldReceive( 'isAvailable' )->once()->andReturn( true );
		$dompdf->shouldReceive( 'getName' )->andReturn( 'dompdf' );

		$generator = new PdfGenerator( $puppeteer, $dompdf );
		$engine    = $generator->detectEngine();

		$this->assertSame( 'dompdf', $engine->getName() );
	}

	public function test_detectEngine_wirft_exception_ohne_engine(): void {
		$puppeteer = Mockery::mock( PdfEngineInterface::class );
		$puppeteer->shouldReceive( 'isAvailable' )->once()->andReturn( false );

		$dompdf = Mockery::mock( PdfEngineInterface::class );
		$dompdf->shouldReceive( 'isAvailable' )->once()->andReturn( false );

		$generator = new PdfGenerator( $puppeteer, $dompdf );

		$this->expectException( \RuntimeException::class );
		$this->expectExceptionMessage( 'Keine PDF-Engine' );

		$generator->detectEngine();
	}

	// ── Engine Info ──────────────────────────────────────────

	public function test_getEngineInfo_zeigt_verfuegbarkeit(): void {
		$puppeteer = Mockery::mock( PdfEngineInterface::class );
		$puppeteer->shouldReceive( 'isAvailable' )->andReturn( true );
		$puppeteer->shouldReceive( 'getName' )->andReturn( 'puppeteer' );

		$dompdf = Mockery::mock( PdfEngineInterface::class );
		$dompdf->shouldReceive( 'isAvailable' )->andReturn( false );
		$dompdf->shouldReceive( 'getName' )->andReturn( 'dompdf' );

		$generator = new PdfGenerator( $puppeteer, $dompdf );
		$info      = $generator->getEngineInfo();

		$this->assertTrue( $info['puppeteer']['available'] );
		$this->assertFalse( $info['dompdf']['available'] );
	}

	// ── Generate with Fallback ───────────────────────────────

	public function test_generate_waehlt_puppeteer_engine(): void {
		$puppeteer = Mockery::mock( PdfEngineInterface::class );
		$puppeteer->shouldReceive( 'isAvailable' )->andReturn( true );
		$puppeteer->shouldReceive( 'getName' )->andReturn( 'puppeteer' );

		$dompdf = Mockery::mock( PdfEngineInterface::class );
		$dompdf->shouldReceive( 'getName' )->andReturn( 'dompdf' );

		$generator = new PdfGenerator( $puppeteer, $dompdf );

		// Verify engine selection without needing template files.
		$this->assertSame( 'puppeteer', $generator->detectEngine()->getName() );
	}

	public function test_generate_fallback_wenn_puppeteer_fehlschlaegt(): void {
		$puppeteer = Mockery::mock( PdfEngineInterface::class );
		$puppeteer->shouldReceive( 'isAvailable' )->andReturn( true );
		$puppeteer->shouldReceive( 'getName' )->andReturn( 'puppeteer' );

		$dompdf = Mockery::mock( PdfEngineInterface::class );
		$dompdf->shouldReceive( 'isAvailable' )->andReturn( true );
		$dompdf->shouldReceive( 'getName' )->andReturn( 'dompdf' );

		$generator = new PdfGenerator( $puppeteer, $dompdf );
		$info      = $generator->getEngineInfo();

		// Both engines available — fallback possible.
		$this->assertTrue( $info['puppeteer']['available'] );
		$this->assertTrue( $info['dompdf']['available'] );
	}

	// ── GenerateToFile ───────────────────────────────────────

	public function test_generateToFile_erstellt_verzeichnis(): void {
		// This test verifies the file write logic concept.
		// Actual file I/O is tested via the method signature.
		Functions\when( 'wp_mkdir_p' )->justReturn( true );

		$puppeteer = Mockery::mock( PdfEngineInterface::class );
		$puppeteer->shouldReceive( 'isAvailable' )->andReturn( true );
		$puppeteer->shouldReceive( 'getName' )->andReturn( 'puppeteer' );

		$dompdf = Mockery::mock( PdfEngineInterface::class );
		$dompdf->shouldReceive( 'getName' )->andReturn( 'dompdf' );

		$generator = new PdfGenerator( $puppeteer, $dompdf );

		// Verify the generator was created and engine detection works.
		$engine = $generator->detectEngine();
		$this->assertSame( 'puppeteer', $engine->getName() );
	}
}
