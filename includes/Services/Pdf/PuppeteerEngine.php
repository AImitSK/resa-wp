<?php

declare( strict_types=1 );

namespace Resa\Services\Pdf;

/**
 * Puppeteer-based PDF engine via HTTP microservice.
 *
 * Sends HTML to a Node.js/Puppeteer service running in a Docker container.
 * The service renders the HTML with Chromium and returns a PDF binary.
 *
 * Service URL configurable via:
 *  - RESA_PDF_SERVICE_URL env var
 *  - resa_pdf_service_url option
 *  - Default: http://node:3000 (Docker service name)
 */
final class PuppeteerEngine implements PdfEngineInterface {

	/**
	 * PDF magic bytes for validation.
	 */
	private const PDF_MAGIC = '%PDF-';

	/**
	 * HTTP timeout for PDF generation (seconds).
	 */
	private const GENERATE_TIMEOUT = 30;

	/**
	 * HTTP timeout for health check (seconds).
	 */
	private const HEALTH_TIMEOUT = 5;

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
	 * Base URL of the PDF service.
	 *
	 * @var string
	 */
	private string $serviceUrl;

	/**
	 * Constructor.
	 *
	 * @param string|null $serviceUrl Base URL of the PDF service (without trailing slash).
	 */
	public function __construct( ?string $serviceUrl = null ) {
		$this->serviceUrl = $serviceUrl ?? $this->resolveServiceUrl();
	}

	/**
	 * Generate PDF by sending HTML to the Puppeteer service via HTTP.
	 *
	 * @param string              $html    Full HTML document.
	 * @param array<string,mixed> $options Options: margins, format.
	 * @return string Raw PDF binary.
	 *
	 * @throws \RuntimeException When the service is unavailable or returns invalid output.
	 */
	public function generate( string $html, array $options = [] ): string {
		if ( ! $this->isAvailable() ) {
			throw new \RuntimeException( 'Puppeteer PDF service is not available.' );
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

		$response = wp_remote_post(
			$this->serviceUrl . '/api/pdf/generate',
			[
				'body'    => $payload,
				'headers' => [ 'Content-Type' => 'application/json' ],
				'timeout' => self::GENERATE_TIMEOUT,
			]
		);

		if ( is_wp_error( $response ) ) {
			throw new \RuntimeException( 'Puppeteer service request failed: ' . $response->get_error_message() );
		}

		$statusCode = wp_remote_retrieve_response_code( $response );
		$body       = wp_remote_retrieve_body( $response );

		if ( $statusCode !== 200 ) {
			$error = json_decode( $body, true );
			$msg   = $error['message'] ?? 'HTTP ' . $statusCode;
			// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Exception message, not HTML output.
			throw new \RuntimeException( 'Puppeteer service returned error: ' . $msg );
		}

		if ( substr( $body, 0, 5 ) !== self::PDF_MAGIC ) {
			// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Exception message, not HTML output.
			throw new \RuntimeException( 'Puppeteer output is not a valid PDF. First bytes: ' . substr( $body, 0, 100 ) );
		}

		return $body;
	}

	/**
	 * Check if the Puppeteer PDF service is reachable.
	 *
	 * @return bool True if the /health endpoint returns 200.
	 */
	public function isAvailable(): bool {
		$response = wp_remote_get(
			$this->serviceUrl . '/health',
			[
				'timeout' => self::HEALTH_TIMEOUT,
			]
		);

		if ( is_wp_error( $response ) ) {
			return false;
		}

		$statusCode = wp_remote_retrieve_response_code( $response );

		return $statusCode === 200;
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
	 * Resolve the PDF service URL from environment or options.
	 *
	 * Priority:
	 *  1. RESA_PDF_SERVICE_URL env var
	 *  2. resa_pdf_service_url WP option
	 *  3. Default Docker service URL
	 *
	 * @return string Service URL without trailing slash.
	 */
	private function resolveServiceUrl(): string {
		// 1. Environment variable (set in docker-compose or .env).
		$envUrl = getenv( 'RESA_PDF_SERVICE_URL' );
		if ( is_string( $envUrl ) && $envUrl !== '' ) {
			return rtrim( $envUrl, '/' );
		}

		// 2. WordPress option (configurable via admin settings).
		$optionUrl = get_option( 'resa_pdf_service_url', '' );
		if ( is_string( $optionUrl ) && $optionUrl !== '' ) {
			return rtrim( $optionUrl, '/' );
		}

		// 3. Default: Docker service name from docker-compose.
		return 'http://node:3000';
	}
}
