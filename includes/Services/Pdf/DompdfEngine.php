<?php

declare( strict_types=1 );

namespace Resa\Services\Pdf;

use Dompdf\Dompdf;
use Dompdf\Options;

/**
 * DOMPDF-based PDF engine (PHP-only fallback).
 *
 * Works on shared hosting without Node.js.
 * Limitations: no JavaScript, basic CSS support, simple SVG only.
 */
final class DompdfEngine implements PdfEngineInterface {

	/**
	 * Default PDF options.
	 *
	 * @var array<string,mixed>
	 */
	private const DEFAULTS = [
		'paper'       => 'A4',
		'orientation' => 'portrait',
	];

	/**
	 * Generate PDF from HTML using DOMPDF.
	 *
	 * @param string              $html    Full HTML document.
	 * @param array<string,mixed> $options Options: paper, orientation.
	 * @return string Raw PDF binary.
	 *
	 * @throws \RuntimeException When generation fails.
	 */
	public function generate( string $html, array $options = [] ): string {
		$options = array_merge( self::DEFAULTS, $options );

		$dompdfOptions = new Options();
		$dompdfOptions->set( 'isRemoteEnabled', true );
		$dompdfOptions->set( 'isHtml5ParserEnabled', true );
		$dompdfOptions->set( 'defaultFont', 'sans-serif' );

		/**
		 * Filter DOMPDF options before rendering.
		 *
		 * @param Options $dompdfOptions DOMPDF options instance.
		 */
		$dompdfOptions = apply_filters( 'resa_dompdf_options', $dompdfOptions );

		$dompdf = new Dompdf( $dompdfOptions );
		$dompdf->loadHtml( $html );
		$dompdf->setPaper( $options['paper'], $options['orientation'] );
		$dompdf->render();

		$output = $dompdf->output();

		if ( $output === null || $output === '' ) {
			throw new \RuntimeException( 'DOMPDF returned empty output.' );
		}

		return $output;
	}

	/**
	 * DOMPDF is always available when the class can be loaded.
	 *
	 * @return bool True if Dompdf class exists.
	 */
	public function isAvailable(): bool {
		return class_exists( Dompdf::class );
	}

	/**
	 * Engine name.
	 *
	 * @return string
	 */
	public function getName(): string {
		return 'dompdf';
	}
}
