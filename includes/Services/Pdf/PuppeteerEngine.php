<?php

declare( strict_types=1 );

namespace Resa\Services\Pdf;

/**
 * Puppeteer-based PDF engine (Node.js + Chromium).
 *
 * Calls an external Node.js script that uses Puppeteer to render
 * HTML to PDF with full CSS/SVG support.
 *
 * Requires Node.js 18+ and the generate-pdf script.
 */
final class PuppeteerEngine implements PdfEngineInterface {

	/**
	 * Minimum required Node.js version.
	 */
	private const MIN_NODE_VERSION = '18.0.0';

	/**
	 * PDF magic bytes for validation.
	 */
	private const PDF_MAGIC = '%PDF-';

	/**
	 * Default margins (mm).
	 *
	 * @var array<string,string>
	 */
	private const DEFAULT_MARGINS = [
		'top'    => '20mm',
		'right'  => '15mm',
		'bottom' => '25mm',
		'left'   => '15mm',
	];

	/**
	 * Path to the Node.js generate-pdf script.
	 *
	 * @var string
	 */
	private string $scriptPath;

	/**
	 * Constructor.
	 *
	 * @param string|null $scriptPath Path to generate-pdf.js. Defaults to plugin scripts/ dir.
	 */
	public function __construct( ?string $scriptPath = null ) {
		$this->scriptPath = $scriptPath ?? $this->defaultScriptPath();
	}

	/**
	 * Generate PDF by calling the Node.js Puppeteer script.
	 *
	 * @param string              $html    Full HTML document.
	 * @param array<string,mixed> $options Options: margins, format.
	 * @return string Raw PDF binary.
	 *
	 * @throws \RuntimeException When Node.js script fails or returns invalid output.
	 */
	public function generate( string $html, array $options = [] ): string {
		if ( ! $this->isAvailable() ) {
			throw new \RuntimeException( 'Puppeteer engine is not available. Node.js 18+ required.' );
		}

		$margins = $options['margins'] ?? self::DEFAULT_MARGINS;
		$format  = $options['format'] ?? 'A4';

		$payload = wp_json_encode(
			[
				'html'    => $html,
				'format'  => $format,
				'margins' => $margins,
			]
		);

		$tmpFile = wp_tempnam( 'resa-pdf-input-' );
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		file_put_contents( $tmpFile, $payload );

		$command = sprintf(
			'node %s %s 2>&1',
			escapeshellarg( $this->scriptPath ),
			escapeshellarg( $tmpFile )
		);

		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.system_calls_shell_exec
		$output = shell_exec( $command );

		// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
		unlink( $tmpFile );

		if ( empty( $output ) ) {
			throw new \RuntimeException( 'Puppeteer script returned no output.' );
		}

		if ( substr( $output, 0, 5 ) !== self::PDF_MAGIC ) {
			// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Exception message, not HTML output.
			throw new \RuntimeException( 'Puppeteer output is not a valid PDF. First bytes: ' . substr( $output, 0, 100 ) );
		}

		return $output;
	}

	/**
	 * Check if Node.js 18+ is available.
	 *
	 * @return bool True if Node.js is present and version >= 18.
	 */
	public function isAvailable(): bool {
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.system_calls_shell_exec
		$nodeVersion = shell_exec( 'node --version 2>/dev/null' );

		if ( empty( $nodeVersion ) ) {
			return false;
		}

		$version = ltrim( trim( $nodeVersion ), 'v' );

		return version_compare( $version, self::MIN_NODE_VERSION, '>=' );
	}

	/**
	 * Engine name.
	 *
	 * @return string
	 */
	public function getName(): string {
		return 'puppeteer';
	}

	/**
	 * Get default script path inside the plugin.
	 *
	 * @return string
	 */
	private function defaultScriptPath(): string {
		return dirname( __DIR__, 3 ) . '/scripts/generate-pdf.js';
	}
}
