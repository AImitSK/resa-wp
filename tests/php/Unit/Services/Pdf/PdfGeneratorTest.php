<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Services\Pdf;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Services\Pdf\PdfEngineInterface;
use Resa\Services\Pdf\PdfGenerator;

class PdfGeneratorTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_detectEngine_prefers_puppeteer_when_available(): void {
		$puppeteer = Mockery::mock( PdfEngineInterface::class );
		$puppeteer->shouldReceive( 'isAvailable' )->andReturn( true );

		$dompdf = Mockery::mock( PdfEngineInterface::class );

		$generator = new PdfGenerator( $puppeteer, $dompdf );
		$engine    = $generator->detectEngine();

		$this->assertSame( $puppeteer, $engine );
	}

	public function test_detectEngine_falls_back_to_dompdf_when_puppeteer_unavailable(): void {
		$puppeteer = Mockery::mock( PdfEngineInterface::class );
		$puppeteer->shouldReceive( 'isAvailable' )->andReturn( false );

		$dompdf = Mockery::mock( PdfEngineInterface::class );
		$dompdf->shouldReceive( 'isAvailable' )->andReturn( true );

		$generator = new PdfGenerator( $puppeteer, $dompdf );
		$engine    = $generator->detectEngine();

		$this->assertSame( $dompdf, $engine );
	}

	public function test_detectEngine_throws_when_no_engine_available(): void {
		$puppeteer = Mockery::mock( PdfEngineInterface::class );
		$puppeteer->shouldReceive( 'isAvailable' )->andReturn( false );

		$dompdf = Mockery::mock( PdfEngineInterface::class );
		$dompdf->shouldReceive( 'isAvailable' )->andReturn( false );

		Functions\when( '__' )->returnArg();

		$generator = new PdfGenerator( $puppeteer, $dompdf );

		$this->expectException( \RuntimeException::class );
		$generator->detectEngine();
	}

	public function test_getEngineInfo_returns_both_engines(): void {
		$puppeteer = Mockery::mock( PdfEngineInterface::class );
		$puppeteer->shouldReceive( 'isAvailable' )->andReturn( true );
		$puppeteer->shouldReceive( 'getName' )->andReturn( 'puppeteer' );

		$dompdf = Mockery::mock( PdfEngineInterface::class );
		$dompdf->shouldReceive( 'isAvailable' )->andReturn( true );
		$dompdf->shouldReceive( 'getName' )->andReturn( 'dompdf' );

		$generator = new PdfGenerator( $puppeteer, $dompdf );
		$info      = $generator->getEngineInfo();

		$this->assertArrayHasKey( 'puppeteer', $info );
		$this->assertArrayHasKey( 'dompdf', $info );
		$this->assertTrue( $info['puppeteer']['available'] );
		$this->assertTrue( $info['dompdf']['available'] );
		$this->assertSame( 'puppeteer', $info['puppeteer']['name'] );
		$this->assertSame( 'dompdf', $info['dompdf']['name'] );
	}

	private function mockCommonPdfFunctions(): void {
		Functions\when( 'apply_filters' )->alias(
			function ( string $tag, $value ) {
				return $value;
			}
		);
		Functions\when( '__' )->returnArg();
		Functions\when( 'sanitize_file_name' )->returnArg();
		Functions\when( 'get_option' )->justReturn( false );
		Functions\when( 'esc_html' )->returnArg();
		Functions\when( 'wp_upload_dir' )->justReturn( [
			'basedir' => sys_get_temp_dir(),
			'baseurl' => 'http://localhost/wp-content/uploads',
		] );
	}

	public function test_generate_uses_detected_engine(): void {
		$pdfBinary = '%PDF-1.4 fake content';

		$puppeteer = Mockery::mock( PdfEngineInterface::class );
		$puppeteer->shouldReceive( 'isAvailable' )->andReturn( false );

		$dompdf = Mockery::mock( PdfEngineInterface::class );
		$dompdf->shouldReceive( 'isAvailable' )->andReturn( true );
		$dompdf->shouldReceive( 'getName' )->andReturn( 'dompdf' );
		$dompdf->shouldReceive( 'generate' )->once()->andReturn( $pdfBinary );

		$this->mockCommonPdfFunctions();

		$generator = new PdfGenerator( $puppeteer, $dompdf );

		// Create a temporary template for testing (no WP functions needed).
		$templateDir = dirname( __DIR__, 5 ) . '/includes/Services/Pdf/Templates';
		$testFile    = $templateDir . '/test-template.php';
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		file_put_contents( $testFile, '<html><body>Test <?php echo htmlspecialchars( $title ?? "", ENT_QUOTES, "UTF-8" ); ?></body></html>' );

		try {
			$result = $generator->generate( 'test-template', [ 'title' => 'Mein Test' ] );
			$this->assertSame( $pdfBinary, $result );
		} finally {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
			unlink( $testFile );
		}
	}

	public function test_generate_falls_back_to_dompdf_on_puppeteer_failure(): void {
		$pdfBinary = '%PDF-1.4 fallback content';

		$puppeteer = Mockery::mock( PdfEngineInterface::class );
		$puppeteer->shouldReceive( 'isAvailable' )->andReturn( true );
		$puppeteer->shouldReceive( 'getName' )->andReturn( 'puppeteer' );
		$puppeteer->shouldReceive( 'generate' )->andThrow( new \RuntimeException( 'Node.js failed' ) );

		$dompdf = Mockery::mock( PdfEngineInterface::class );
		$dompdf->shouldReceive( 'isAvailable' )->andReturn( true );
		$dompdf->shouldReceive( 'generate' )->once()->andReturn( $pdfBinary );

		$this->mockCommonPdfFunctions();

		$generator = new PdfGenerator( $puppeteer, $dompdf );

		$templateDir = dirname( __DIR__, 5 ) . '/includes/Services/Pdf/Templates';
		$testFile    = $templateDir . '/fallback-template.php';
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		file_put_contents( $testFile, '<html><body>Fallback</body></html>' );

		try {
			$result = $generator->generate( 'fallback-template', [] );
			$this->assertSame( $pdfBinary, $result );
		} finally {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
			unlink( $testFile );
		}
	}

	public function test_generate_throws_when_template_not_found(): void {
		$dompdf = Mockery::mock( PdfEngineInterface::class );
		$dompdf->shouldReceive( 'isAvailable' )->andReturn( true );
		$dompdf->shouldReceive( 'getName' )->andReturn( 'dompdf' );

		$puppeteer = Mockery::mock( PdfEngineInterface::class );
		$puppeteer->shouldReceive( 'isAvailable' )->andReturn( false );

		Functions\when( 'apply_filters' )->alias(
			function ( string $tag, $value ) {
				return $value;
			}
		);
		Functions\when( '__' )->returnArg();
		Functions\when( 'sanitize_file_name' )->returnArg();

		$generator = new PdfGenerator( $puppeteer, $dompdf );

		$this->expectException( \RuntimeException::class );
		$generator->generate( 'nonexistent-template', [] );
	}
}
