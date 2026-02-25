<?php

declare( strict_types=1 );

namespace Resa\Services\Pdf;

/**
 * Contract for PDF generation engines.
 *
 * Two implementations:
 *  - DompdfEngine  (PHP-only fallback, Free plan)
 *  - PuppeteerEngine (Node.js + Chromium, Premium)
 */
interface PdfEngineInterface {

	/**
	 * Generate a PDF from HTML content.
	 *
	 * @param string               $html    Full HTML document.
	 * @param array<string,mixed>  $options Engine-specific options (e.g. format, margins).
	 * @return string Raw PDF binary.
	 *
	 * @throws \RuntimeException When generation fails.
	 */
	public function generate( string $html, array $options = [] ): string;

	/**
	 * Check whether this engine is available in the current environment.
	 *
	 * @return bool True if the engine can be used.
	 */
	public function isAvailable(): bool;

	/**
	 * Return a human-readable engine name (for logging / debugging).
	 *
	 * @return string E.g. "dompdf" or "puppeteer".
	 */
	public function getName(): string;
}
