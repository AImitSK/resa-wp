<?php

declare( strict_types=1 );

namespace Resa\Services\Pdf;

/**
 * PDF generation orchestrator with automatic engine detection.
 *
 * Tries Puppeteer first (better quality), falls back to DOMPDF.
 * Premium users get Puppeteer, Free users always get DOMPDF.
 */
final class PdfGenerator {

	/**
	 * Puppeteer engine instance.
	 *
	 * @var PdfEngineInterface
	 */
	private PdfEngineInterface $puppeteer;

	/**
	 * DOMPDF engine instance.
	 *
	 * @var PdfEngineInterface
	 */
	private PdfEngineInterface $dompdf;

	/**
	 * Constructor.
	 *
	 * @param PdfEngineInterface|null $puppeteer Puppeteer engine (or null for default).
	 * @param PdfEngineInterface|null $dompdf    DOMPDF engine (or null for default).
	 */
	public function __construct( ?PdfEngineInterface $puppeteer = null, ?PdfEngineInterface $dompdf = null ) {
		$this->puppeteer = $puppeteer ?? new PuppeteerEngine();
		$this->dompdf    = $dompdf ?? new DompdfEngine();
	}

	/**
	 * Generate a PDF from template data.
	 *
	 * @param string              $template Template name (e.g. 'rent-analysis').
	 * @param array<string,mixed> $data     Template variables.
	 * @param array<string,mixed> $options  Engine options (paper, margins, etc.).
	 * @return string Raw PDF binary.
	 *
	 * @throws \RuntimeException When no engine can produce a PDF.
	 */
	public function generate( string $template, array $data, array $options = [] ): string {
		$html   = $this->renderTemplate( $template, $data );
		$engine = $this->detectEngine();

		/**
		 * Filter the selected PDF engine before generation.
		 *
		 * @param PdfEngineInterface $engine   Selected engine.
		 * @param string             $template Template name.
		 * @param array              $data     Template data.
		 */
		$engine = apply_filters( 'resa_pdf_engine', $engine, $template, $data );

		try {
			$pdf = $engine->generate( $html, $options );
		} catch ( \RuntimeException $e ) {
			// Falls Puppeteer fehlschlägt, Fallback auf DOMPDF.
			if ( $engine->getName() === 'puppeteer' && $this->dompdf->isAvailable() ) {
				$fallbackHtml = $this->renderTemplate( $template, $data, true );
				$pdf          = $this->dompdf->generate( $fallbackHtml, $options );
			} else {
				throw $e;
			}
		}

		return $pdf;
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
	 * Detect the best available engine.
	 *
	 * Priority: Puppeteer (if available + premium) > DOMPDF.
	 *
	 * @return PdfEngineInterface
	 *
	 * @throws \RuntimeException When no engine is available.
	 */
	public function detectEngine(): PdfEngineInterface {
		if ( $this->puppeteer->isAvailable() && $this->isPremium() ) {
			return $this->puppeteer;
		}

		if ( $this->dompdf->isAvailable() ) {
			return $this->dompdf;
		}

		throw new \RuntimeException( 'Keine PDF-Engine verfügbar. Bitte installieren Sie DOMPDF oder Node.js 18+.' );
	}

	/**
	 * Get information about available engines (for admin UI / diagnostics).
	 *
	 * @return array<string,array<string,mixed>>
	 */
	public function getEngineInfo(): array {
		return [
			'puppeteer' => [
				'available' => $this->puppeteer->isAvailable(),
				'name'      => $this->puppeteer->getName(),
				'premium'   => true,
			],
			'dompdf'    => [
				'available' => $this->dompdf->isAvailable(),
				'name'      => $this->dompdf->getName(),
				'premium'   => false,
			],
		];
	}

	/**
	 * Render an HTML template with data.
	 *
	 * @param string              $template   Template name.
	 * @param array<string,mixed> $data       Template variables.
	 * @param bool                $forDompdf  Whether to render for DOMPDF (simplified charts).
	 * @return string Rendered HTML.
	 *
	 * @throws \RuntimeException When template file not found.
	 */
	private function renderTemplate( string $template, array $data, bool $forDompdf = false ): string {
		$templateFile = $this->getTemplatePath( $template );

		if ( ! file_exists( $templateFile ) ) {
			// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Exception message, not HTML output.
			throw new \RuntimeException( 'PDF-Template nicht gefunden: ' . $template );
		}

		$data['is_dompdf'] = $forDompdf;

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
	 * Check if current user has premium plan.
	 *
	 * @return bool
	 */
	private function isPremium(): bool {
		if ( function_exists( 'resa_fs' ) ) {
			return resa_fs()->can_use_premium_code();
		}

		return false;
	}
}
