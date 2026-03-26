<?php

declare( strict_types=1 );

namespace Resa\Services\Pdf;

use Resa\Api\PdfSettingsController;
use Resa\Models\Agent;

/**
 * PDF generation orchestrator.
 *
 * Uses mPDF for all PDF generation. The previous dual-engine system
 * (DOMPDF + Puppeteer) has been replaced with a single, reliable engine.
 */
class PdfGenerator {

	/**
	 * PDF engine instance.
	 *
	 * @var PdfEngineInterface
	 */
	private PdfEngineInterface $engine;

	/**
	 * Constructor.
	 *
	 * @param PdfEngineInterface|null $engine PDF engine (or null for default MpdfEngine).
	 */
	public function __construct( ?PdfEngineInterface $engine = null ) {
		$this->engine = $engine ?? new MpdfEngine();
	}

	/**
	 * Generate a PDF from template data.
	 *
	 * @param string              $template Template name (e.g. 'rent-analysis').
	 * @param array<string,mixed> $data     Template variables.
	 * @param array<string,mixed> $options  Engine options (paper, margins, etc.).
	 * @return string Raw PDF binary.
	 *
	 * @throws \RuntimeException When engine cannot produce a PDF.
	 */
	public function generate( string $template, array $data, array $options = [] ): string {
		$html = $this->renderTemplate( $template, $data );

		return $this->engine->generate( $html, $options );
	}

	/**
	 * Generate PDF and save to a file.
	 *
	 * @param string              $template Template name.
	 * @param array<string,mixed> $data     Template data.
	 * @param string              $filePath Destination file path.
	 * @param array<string,mixed> $options  Engine options.
	 * @return bool True on success.
	 *
	 * @throws \RuntimeException When generation or file write fails.
	 */
	public function generateToFile( string $template, array $data, string $filePath, array $options = [] ): bool {
		$pdf = $this->generate( $template, $data, $options );

		$dir = dirname( $filePath );
		if ( ! is_dir( $dir ) ) {
			wp_mkdir_p( $dir );
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		$written = file_put_contents( $filePath, $pdf );

		if ( $written === false ) {
			// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Exception message, not HTML output.
			throw new \RuntimeException( 'PDF konnte nicht gespeichert werden: ' . $filePath );
		}

		return true;
	}

	/**
	 * Get the PDF engine instance.
	 *
	 * @return PdfEngineInterface
	 */
	public function getEngine(): PdfEngineInterface {
		return $this->engine;
	}

	/**
	 * Get information about the engine (for admin UI / diagnostics).
	 *
	 * @return array<string,mixed>
	 */
	public function getEngineInfo(): array {
		return [
			'engine'    => $this->engine->getName(),
			'available' => $this->engine->isAvailable(),
		];
	}

	/**
	 * Render an HTML template with data.
	 *
	 * @param string              $template Template name.
	 * @param array<string,mixed> $data     Template variables.
	 * @return string Rendered HTML.
	 *
	 * @throws \RuntimeException When template file not found.
	 */
	private function renderTemplate( string $template, array $data ): string {
		$templateFile = $this->getTemplatePath( $template );

		if ( ! file_exists( $templateFile ) ) {
			// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Exception message, not HTML output.
			throw new \RuntimeException( 'PDF-Template nicht gefunden: ' . $template );
		}

		// Inject PDF settings if not already provided.
		if ( ! isset( $data['margins'] ) || ! isset( $data['show_agents'] ) ) {
			$pdfSettings = PdfSettingsController::getSettings();

			$data = array_merge(
				[
					'header_text'   => $pdfSettings['header_text'] ?? '',
					'footer_text'   => $pdfSettings['footer_text'] ?? '',
					'show_date'     => $pdfSettings['show_date'] ?? true,
					'show_agents'   => $pdfSettings['show_agents'] ?? true,
					'logo_position' => $pdfSettings['logo_position'] ?? 'left',
					'logo_size'     => (int) ( $pdfSettings['logo_size'] ?? 36 ),
					'margins'       => $pdfSettings['margins'] ?? [],
				],
				$data
			);
		}

		// Inject agents based on location if not already provided.
		if ( ! isset( $data['agents'] ) && ( $data['show_agents'] ?? true ) ) {
			$locationId = $data['location_id'] ?? 0;
			$agents     = [];

			if ( $locationId > 0 ) {
				$agents = Agent::getByLocationId( (int) $locationId );
			}

			// Fallback: use default agent if no location-specific agents found.
			if ( empty( $agents ) ) {
				$default = Agent::getDefault();
				if ( $default ) {
					$agents = [ $default ];
				}
			}

			$data['agents'] = $agents;
		}

		// Inject broker info (from Maklerdaten/default agent) for footer address line.
		if ( ! isset( $data['broker'] ) ) {
			$defaultAgent = Agent::getDefault();
			if ( $defaultAgent ) {
				$data['broker'] = [
					'company'     => $defaultAgent->company ?? '',
					'address'     => $defaultAgent->address ?? '',
					'phone'       => $defaultAgent->phone ?? '',
					'email'       => $defaultAgent->email ?? '',
					'website'     => $defaultAgent->website ?? '',
					'imprint_url' => $defaultAgent->imprint_url ?? '',
				];
			} else {
				$data['broker'] = [];
			}
		}

		// Convert agent photo URLs to base64 data URIs for reliable rendering.
		$this->convertAgentPhotos( $data );

		// Inject per-module PDF section settings.
		if ( ! isset( $data['pdf_sections'] ) ) {
			$moduleSlug = $this->resolveModuleSlug( $template );
			if ( $moduleSlug !== null ) {
				$data['pdf_sections'] = \Resa\Api\ModuleSettingsController::getModulePdfSettings( $moduleSlug );
			}
		}

		/**
		 * Filter template data before rendering.
		 *
		 * @param array  $data     Template data.
		 * @param string $template Template name.
		 */
		$data = apply_filters( 'resa_pdf_template_data', $data, $template );

		ob_start();
		// phpcs:ignore WordPress.PHP.DontExtract.extract_extract -- Template rendering requires extract.
		extract( $data, EXTR_SKIP );
		include $templateFile;

		return (string) ob_get_clean();
	}

	/**
	 * Resolve template name to file path.
	 *
	 * @param string $template Template name.
	 * @return string File path.
	 */
	private function getTemplatePath( string $template ): string {
		$sanitized = sanitize_file_name( $template );

		/**
		 * Filter the PDF template file path.
		 *
		 * @param string $path     Template file path.
		 * @param string $template Template name.
		 */
		return (string) apply_filters(
			'resa_pdf_template_path',
			dirname( __DIR__, 2 ) . '/Services/Pdf/Templates/' . $sanitized . '.php',
			$template
		);
	}

	/**
	 * Map template name back to module slug.
	 *
	 * @param string $template Template name.
	 * @return string|null Module slug, or null if unknown.
	 */
	private function resolveModuleSlug( string $template ): ?string {
		$map = [
			'rent-analysis'   => 'rent-calculator',
			'purchase-costs'  => 'purchase-costs',
			'budget-analysis' => 'budget-calculator',
			'roi-analysis'    => 'roi-calculator',
		];

		return $map[ $template ] ?? null;
	}

	/**
	 * Convert agent photo URLs to base64 data URIs.
	 *
	 * Photos must be embedded as data URIs for reliable rendering in PDF.
	 *
	 * @param array<string,mixed> &$data Template data (modified in place).
	 */
	private function convertAgentPhotos( array &$data ): void {
		if ( empty( $data['agents'] ) || ! is_array( $data['agents'] ) ) {
			return;
		}

		$uploadDir = wp_upload_dir();
		$baseUrl   = $uploadDir['baseurl'];
		$basePath  = $uploadDir['basedir'];

		$mimeMap = [
			'png'  => 'image/png',
			'jpg'  => 'image/jpeg',
			'jpeg' => 'image/jpeg',
			'gif'  => 'image/gif',
			'webp' => 'image/webp',
		];

		foreach ( $data['agents'] as $agent ) {
			$photoUrl = $agent->photo_url ?? '';

			if ( empty( $photoUrl ) || strpos( $photoUrl, 'data:' ) === 0 ) {
				continue;
			}

			$imageData = '';
			$mime      = 'image/jpeg';

			// Try local filesystem first (WordPress uploads).
			$localPath = null;
			if ( strpos( $photoUrl, $baseUrl ) === 0 ) {
				$localPath = $basePath . substr( $photoUrl, strlen( $baseUrl ) );
			}

			if ( $localPath !== null && file_exists( $localPath ) ) {
				// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
				$imageData = file_get_contents( $localPath );
				$ext       = strtolower( pathinfo( $localPath, PATHINFO_EXTENSION ) );
				$mime      = $mimeMap[ $ext ] ?? 'image/jpeg';
			} else {
				// Fetch remotely.
				$response = wp_remote_get(
					$photoUrl,
					[
						'timeout'   => 10,
						'sslverify' => false,
					]
				);

				if ( is_wp_error( $response ) || wp_remote_retrieve_response_code( $response ) !== 200 ) {
					continue;
				}

				$imageData = wp_remote_retrieve_body( $response );
				$mime      = wp_remote_retrieve_header( $response, 'content-type' );

				if ( strpos( $mime, ';' ) !== false ) {
					$mime = trim( explode( ';', $mime )[0] );
				}
			}

			if ( ! empty( $imageData ) ) {
				// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
				$agent->photo_url = 'data:' . $mime . ';base64,' . base64_encode( $imageData );
			}
		}
	}

}
