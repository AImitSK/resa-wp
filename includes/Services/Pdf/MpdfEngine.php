<?php

declare( strict_types=1 );

namespace Resa\Services\Pdf;

use Mpdf\Mpdf;

/**
 * mPDF-based PDF engine.
 *
 * Replaces the dual DOMPDF/Puppeteer system with a single, reliable engine.
 * mPDF provides native SVG support and better CSS handling than DOMPDF.
 */
final class MpdfEngine implements PdfEngineInterface {

	/**
	 * Default configuration.
	 *
	 * @var array<string,mixed>
	 */
	private const DEFAULT_CONFIG = [
		'mode'              => 'utf-8',
		'format'            => 'A4',
		'orientation'       => 'P',
		'default_font_size' => 11,
		'default_font'      => 'dejavusans',
		'margin_left'       => 15,
		'margin_right'      => 15,
		'margin_top'        => 20,
		'margin_bottom'     => 25,
		'margin_header'     => 5,
		'margin_footer'     => 5,
	];

	/**
	 * Generate PDF from HTML using mPDF.
	 *
	 * @param string              $html    Full HTML document.
	 * @param array<string,mixed> $options Options: margins, format.
	 * @return string Raw PDF binary.
	 *
	 * @throws \RuntimeException When generation fails.
	 */
	public function generate( string $html, array $options = [] ): string {
		$config = $this->buildConfig( $options );

		$mpdf = new Mpdf( $config );
		$mpdf->WriteHTML( $html );

		$output = $mpdf->Output( '', 'S' ); // S = String.

		if ( $output === '' ) {
			throw new \RuntimeException( 'mPDF returned empty output.' );
		}

		return $output;
	}

	/**
	 * mPDF is always available when the class can be loaded.
	 *
	 * @return bool True if Mpdf class exists.
	 */
	public function isAvailable(): bool {
		return class_exists( Mpdf::class );
	}

	/**
	 * Engine name.
	 *
	 * @return string
	 */
	public function getName(): string {
		return 'mpdf';
	}

	/**
	 * Build mPDF configuration from options.
	 *
	 * @param array<string,mixed> $options Engine options.
	 * @return array<string,mixed> mPDF configuration.
	 */
	private function buildConfig( array $options ): array {
		$config = self::DEFAULT_CONFIG;

		// Temp directory for WordPress — use uploads dir which is always writable.
		$uploadDir        = wp_upload_dir();
		$config['tempDir'] = $uploadDir['basedir'] . '/resa-mpdf-tmp';

		if ( ! is_dir( $config['tempDir'] ) ) {
			wp_mkdir_p( $config['tempDir'] );
		}

		// Override margins from options if provided.
		if ( isset( $options['margins'] ) ) {
			$margins                = $options['margins'];
			$config['margin_left']   = (int) ( $margins['left'] ?? 15 );
			$config['margin_right']  = (int) ( $margins['right'] ?? 15 );
			$config['margin_top']    = (int) ( $margins['top'] ?? 20 );
			$config['margin_bottom'] = (int) ( $margins['bottom'] ?? 25 );
		}

		// Override format if provided.
		if ( isset( $options['format'] ) ) {
			$config['format'] = $options['format'];
		}

		// Override orientation if provided.
		if ( isset( $options['orientation'] ) ) {
			$config['orientation'] = $options['orientation'] === 'landscape' ? 'L' : 'P';
		}

		/**
		 * Filter mPDF configuration before initialization.
		 *
		 * @param array $config  mPDF configuration array.
		 * @param array $options Original options passed to generate().
		 */
		return apply_filters( 'resa_mpdf_config', $config, $options );
	}
}
