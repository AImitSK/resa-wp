<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Services\Pdf;

use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\TestCase;
use Resa\Services\Pdf\MpdfEngine;

class MpdfEngineTest extends TestCase {

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		// Mock WordPress functions used by MpdfEngine.
		Functions\when( 'wp_upload_dir' )->justReturn( [
			'basedir' => sys_get_temp_dir(),
			'baseurl' => 'http://localhost/wp-content/uploads',
		] );
		Functions\when( 'wp_mkdir_p' )->justReturn( true );
		Functions\when( 'apply_filters' )->alias(
			function ( string $tag, $value ) {
				return $value;
			}
		);
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_is_available_returns_true_when_mpdf_class_exists(): void {
		$engine = new MpdfEngine();
		$this->assertTrue( $engine->isAvailable() );
	}

	public function test_get_name_returns_mpdf(): void {
		$engine = new MpdfEngine();
		$this->assertSame( 'mpdf', $engine->getName() );
	}

	public function test_generate_returns_pdf_binary(): void {
		$engine = new MpdfEngine();
		$html   = '<html><body><h1>Test</h1></body></html>';

		$pdf = $engine->generate( $html );

		$this->assertStringStartsWith( '%PDF-', $pdf );
	}

	public function test_generate_with_custom_margins(): void {
		$engine = new MpdfEngine();
		$html   = '<html><body><h1>Test with margins</h1></body></html>';

		$options = [
			'margins' => [
				'top'    => 10,
				'bottom' => 15,
				'left'   => 20,
				'right'  => 25,
			],
		];

		$pdf = $engine->generate( $html, $options );

		$this->assertStringStartsWith( '%PDF-', $pdf );
	}

	public function test_generate_with_landscape_orientation(): void {
		$engine = new MpdfEngine();
		$html   = '<html><body><h1>Landscape PDF</h1></body></html>';

		$options = [
			'orientation' => 'landscape',
		];

		$pdf = $engine->generate( $html, $options );

		$this->assertStringStartsWith( '%PDF-', $pdf );
	}

	public function test_generate_renders_svg_content(): void {
		$engine = new MpdfEngine();
		$html   = '<html><body>
			<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
				<circle cx="50" cy="50" r="40" fill="blue"/>
			</svg>
		</body></html>';

		$pdf = $engine->generate( $html );

		$this->assertStringStartsWith( '%PDF-', $pdf );
		$this->assertNotEmpty( $pdf );
	}

	public function test_generate_handles_utf8_content(): void {
		$engine = new MpdfEngine();
		$html   = '<html><body><h1>Mietpreis-Analyse für München</h1><p>Preis: 1.234,56 €/m²</p></body></html>';

		$pdf = $engine->generate( $html );

		$this->assertStringStartsWith( '%PDF-', $pdf );
	}
}
