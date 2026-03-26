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

	public function test_getEngine_returns_injected_engine(): void {
		$engine = Mockery::mock( PdfEngineInterface::class );

		$generator = new PdfGenerator( $engine );

		$this->assertSame( $engine, $generator->getEngine() );
	}

	public function test_getEngineInfo_returns_engine_name_and_availability(): void {
		$engine = Mockery::mock( PdfEngineInterface::class );
		$engine->shouldReceive( 'isAvailable' )->andReturn( true );
		$engine->shouldReceive( 'getName' )->andReturn( 'mpdf' );

		$generator = new PdfGenerator( $engine );
		$info      = $generator->getEngineInfo();

		$this->assertArrayHasKey( 'engine', $info );
		$this->assertArrayHasKey( 'available', $info );
		$this->assertSame( 'mpdf', $info['engine'] );
		$this->assertTrue( $info['available'] );
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

	public function test_generate_uses_injected_engine(): void {
		$pdfBinary = '%PDF-1.4 fake content';

		$engine = Mockery::mock( PdfEngineInterface::class );
		$engine->shouldReceive( 'generate' )->once()->andReturn( $pdfBinary );

		$this->mockCommonPdfFunctions();

		$generator = new PdfGenerator( $engine );

		// Create a temporary template for testing.
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

	public function test_generate_throws_when_template_not_found(): void {
		$engine = Mockery::mock( PdfEngineInterface::class );

		Functions\when( 'apply_filters' )->alias(
			function ( string $tag, $value ) {
				return $value;
			}
		);
		Functions\when( '__' )->returnArg();
		Functions\when( 'sanitize_file_name' )->returnArg();

		$generator = new PdfGenerator( $engine );

		$this->expectException( \RuntimeException::class );
		$generator->generate( 'nonexistent-template', [] );
	}

	public function test_generateToFile_writes_pdf_to_disk(): void {
		$pdfBinary = '%PDF-1.4 file content';

		$engine = Mockery::mock( PdfEngineInterface::class );
		$engine->shouldReceive( 'generate' )->once()->andReturn( $pdfBinary );

		$this->mockCommonPdfFunctions();
		Functions\when( 'wp_mkdir_p' )->justReturn( true );

		$generator = new PdfGenerator( $engine );

		// Create a temporary template.
		$templateDir = dirname( __DIR__, 5 ) . '/includes/Services/Pdf/Templates';
		$testFile    = $templateDir . '/write-test.php';
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		file_put_contents( $testFile, '<html><body>Write Test</body></html>' );

		$outputPath = sys_get_temp_dir() . '/test-output-' . uniqid() . '.pdf';

		try {
			$result = $generator->generateToFile( 'write-test', [], $outputPath );

			$this->assertTrue( $result );
			$this->assertFileExists( $outputPath );
			$this->assertSame( $pdfBinary, file_get_contents( $outputPath ) );
		} finally {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
			@unlink( $testFile );
			// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
			@unlink( $outputPath );
		}
	}

	public function test_constructor_creates_default_mpdf_engine_when_no_engine_provided(): void {
		$this->mockCommonPdfFunctions();

		// MpdfEngine requires wp_upload_dir which we've mocked.
		$generator = new PdfGenerator();
		$engine    = $generator->getEngine();

		$this->assertInstanceOf( \Resa\Services\Pdf\MpdfEngine::class, $engine );
	}
}
