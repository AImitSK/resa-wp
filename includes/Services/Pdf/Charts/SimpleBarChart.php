<?php

declare( strict_types=1 );

namespace Resa\Services\Pdf\Charts;

/**
 * Simple bar chart with dual rendering.
 *
 * - render()    → Inline SVG for Puppeteer (Chrome-quality).
 * - renderPng() → GD-based PNG data URI for DOMPDF fallback.
 */
final class SimpleBarChart {

	private const DEFAULT_WIDTH  = 500;
	private const DEFAULT_HEIGHT = 250;

	/**
	 * Render a bar chart as inline SVG markup.
	 *
	 * Used by Puppeteer — Chromium renders SVG natively.
	 *
	 * @param array<int,array{label:string,value:float,color?:string}> $bars   Bar data.
	 * @param array<string,mixed>                                      $config Chart config.
	 * @return string SVG markup, or empty on failure.
	 */
	public function render( array $bars, array $config = [] ): string {
		if ( count( $bars ) === 0 ) {
			return '';
		}

		$width  = (int) ( $config['width'] ?? self::DEFAULT_WIDTH );
		$height = (int) ( $config['height'] ?? self::DEFAULT_HEIGHT );
		$unit   = (string) ( $config['unit'] ?? '' );

		// Chart area.
		$paddingLeft   = 20;
		$paddingRight  = 20;
		$paddingTop    = 30;
		$paddingBottom = 40;

		$chartLeft   = $paddingLeft;
		$chartRight  = $width - $paddingRight;
		$chartTop    = $paddingTop;
		$chartBottom = $height - $paddingBottom;
		$chartWidth  = $chartRight - $chartLeft;
		$chartHeight = $chartBottom - $chartTop;

		$barCount = count( $bars );
		$barGap   = 20;
		$totalGap = ( $barCount + 1 ) * $barGap;
		$barWidth = (int) ( ( $chartWidth - $totalGap ) / $barCount );

		// Clamp bar width.
		$maxBarWidth = 80;
		if ( $barWidth > $maxBarWidth ) {
			$barWidth = $maxBarWidth;
			$totalGap = $chartWidth - ( $barCount * $barWidth );
			$barGap   = (int) ( $totalGap / ( $barCount + 1 ) );
		}

		$maxValue = max( array_column( $bars, 'value' ) );
		if ( $maxValue <= 0 ) {
			$maxValue = 1;
		}
		$maxValue *= 1.15; // 15% headroom.

		$svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' . $width . '" height="' . $height . '" viewBox="0 0 ' . $width . ' ' . $height . '">';

		// Background.
		$svg .= '<rect width="' . $width . '" height="' . $height . '" fill="white"/>';

		// Grid lines.
		$gridSteps = 4;
		for ( $i = 1; $i <= $gridSteps; $i++ ) {
			$gridY = $chartBottom - (int) ( ( $i / $gridSteps ) * $chartHeight );
			$svg  .= '<line x1="' . $chartLeft . '" y1="' . $gridY . '" x2="' . $chartRight . '" y2="' . $gridY . '" stroke="#f1f5f9" stroke-width="1"/>';
		}

		// Baseline.
		$svg .= '<line x1="' . $chartLeft . '" y1="' . $chartBottom . '" x2="' . $chartRight . '" y2="' . $chartBottom . '" stroke="#e2e8f0" stroke-width="1"/>';

		// Bars.
		foreach ( $bars as $index => $bar ) {
			$value    = (float) $bar['value'];
			$label    = (string) $bar['label'];
			$barColor = $bar['color'] ?? '#3b82f6';

			$barHeight = (int) ( ( $value / $maxValue ) * $chartHeight );
			$x         = $chartLeft + $barGap + $index * ( $barWidth + $barGap );
			$y         = $chartBottom - $barHeight;
			$radius    = min( 6, $barWidth / 4, $barHeight / 4 );

			// Rounded top bar.
			$svg .= '<rect x="' . $x . '" y="' . $y . '" width="' . $barWidth . '" height="' . $barHeight . '" fill="' . esc_attr( $barColor ) . '" rx="' . $radius . '" ry="' . $radius . '"/>';

			// Value text above bar.
			$valueText = number_format( $value, 1, ',', '.' );
			if ( $unit !== '' ) {
				$valueText .= ' ' . $unit;
			}
			$textX = $x + (int) ( $barWidth / 2 );
			$textY = $y - 8;
			$svg  .= '<text x="' . $textX . '" y="' . $textY . '" text-anchor="middle" font-family="DejaVu Sans, Helvetica, Arial, sans-serif" font-size="11" fill="#1e293b" font-weight="bold">' . esc_html( $valueText ) . '</text>';

			// Label below bar.
			$labelY = $chartBottom + 18;
			$svg   .= '<text x="' . $textX . '" y="' . $labelY . '" text-anchor="middle" font-family="DejaVu Sans, Helvetica, Arial, sans-serif" font-size="10" fill="#64748b">' . esc_html( $label ) . '</text>';
		}

		$svg .= '</svg>';

		return $svg;
	}

	/**
	 * Render a bar chart as base64 PNG data URI (DOMPDF fallback).
	 *
	 * @param array<int,array{label:string,value:float,color?:string}> $bars   Bar data.
	 * @param array<string,mixed>                                      $config Chart config.
	 * @return string Base64 data URI string for <img src="...">, or empty on failure.
	 */
	public function renderPng( array $bars, array $config = [] ): string {
		if ( count( $bars ) === 0 || ! function_exists( 'imagecreatetruecolor' ) ) {
			return '';
		}

		$width  = (int) ( $config['width'] ?? self::DEFAULT_WIDTH );
		$height = (int) ( $config['height'] ?? self::DEFAULT_HEIGHT );
		$unit   = (string) ( $config['unit'] ?? '' );

		// Scale factor for sharper rendering.
		$scale = 2;
		$w     = $width * $scale;
		$h     = $height * $scale;

		$image = imagecreatetruecolor( $w, $h );
		if ( $image === false ) {
			return '';
		}

		imageantialias( $image, true );

		// Colors.
		$bgColor       = (int) imagecolorallocate( $image, 255, 255, 255 );
		$textColor     = (int) imagecolorallocate( $image, 30, 41, 59 );
		$labelColor    = (int) imagecolorallocate( $image, 100, 116, 139 );
		$lineColor     = (int) imagecolorallocate( $image, 226, 232, 240 );
		$gridLineColor = (int) imagecolorallocate( $image, 241, 245, 249 );

		imagefilledrectangle( $image, 0, 0, $w - 1, $h - 1, $bgColor );

		// Chart area.
		$paddingLeft   = 20 * $scale;
		$paddingRight  = 20 * $scale;
		$paddingTop    = 30 * $scale;
		$paddingBottom = 40 * $scale;

		$chartLeft   = $paddingLeft;
		$chartRight  = $w - $paddingRight;
		$chartTop    = $paddingTop;
		$chartBottom = $h - $paddingBottom;
		$chartWidth  = $chartRight - $chartLeft;
		$chartHeight = $chartBottom - $chartTop;

		$barCount = count( $bars );
		$barGap   = (int) ( 20 * $scale );
		$totalGap = ( $barCount + 1 ) * $barGap;
		$barWidth = (int) ( ( $chartWidth - $totalGap ) / $barCount );

		$maxBarWidth = 80 * $scale;
		if ( $barWidth > $maxBarWidth ) {
			$barWidth = $maxBarWidth;
			$totalGap = $chartWidth - ( $barCount * $barWidth );
			$barGap   = (int) ( $totalGap / ( $barCount + 1 ) );
		}

		$maxValue = max( array_column( $bars, 'value' ) );
		if ( $maxValue <= 0 ) {
			$maxValue = 1;
		}
		$maxValue *= 1.15;

		// Grid lines.
		$gridSteps = 4;
		for ( $i = 1; $i <= $gridSteps; $i++ ) {
			$gridY = $chartBottom - (int) ( ( $i / $gridSteps ) * $chartHeight );
			imageline( $image, $chartLeft, $gridY, $chartRight, $gridY, $gridLineColor );
		}

		// Baseline.
		imageline( $image, $chartLeft, $chartBottom, $chartRight, $chartBottom, $lineColor );

		$valueFontSize = (int) ( 5 * $scale );
		$labelFontSize = (int) ( 4 * $scale );

		// Bars.
		foreach ( $bars as $index => $bar ) {
			$value    = (float) $bar['value'];
			$label    = (string) $bar['label'];
			$barColor = $bar['color'] ?? '#3b82f6';

			$rgb     = $this->hexToRgb( $barColor );
			$gdColor = (int) imagecolorallocate( $image, $rgb[0], $rgb[1], $rgb[2] );

			$barHeight = (int) ( ( $value / $maxValue ) * $chartHeight );
			$x1        = $chartLeft + $barGap + $index * ( $barWidth + $barGap );
			$y1        = $chartBottom - $barHeight;
			$x2        = $x1 + $barWidth;
			$y2        = $chartBottom;

			imagefilledrectangle( $image, $x1, $y1, $x2, $y2, $gdColor );

			// Round top corners.
			$radius = min( 6 * $scale, $barWidth / 4, $barHeight / 4 );
			if ( $radius > 2 ) {
				imagefilledarc( $image, $x1 + $radius, $y1 + $radius, $radius * 2, $radius * 2, 180, 270, $gdColor, IMG_ARC_PIE );
				imagefilledarc( $image, $x2 - $radius, $y1 + $radius, $radius * 2, $radius * 2, 270, 360, $gdColor, IMG_ARC_PIE );
				imagefilledrectangle( $image, $x1, $y1, $x1 + $radius, $y1 + $radius, $bgColor );
				imagefilledrectangle( $image, $x2 - $radius, $y1, $x2, $y1 + $radius, $bgColor );
				imagefilledarc( $image, $x1 + $radius, $y1 + $radius, $radius * 2, $radius * 2, 180, 270, $gdColor, IMG_ARC_PIE );
				imagefilledarc( $image, $x2 - $radius, $y1 + $radius, $radius * 2, $radius * 2, 270, 360, $gdColor, IMG_ARC_PIE );
			}

			// Value text above bar.
			$valueText = number_format( $value, 1, ',', '.' );
			if ( $unit !== '' ) {
				$valueText .= ' ' . $unit;
			}
			$this->drawCenteredText( $image, $valueText, $x1, $x2, $y1 - (int) ( 8 * $scale ), $valueFontSize, $textColor );

			// Label below bar.
			$this->drawCenteredText( $image, $label, $x1, $x2, $chartBottom + (int) ( 12 * $scale ), $labelFontSize, $labelColor );
		}

		// Convert to PNG data URI.
		ob_start();
		imagepng( $image, null, 6 );
		$pngData = ob_get_clean();
		imagedestroy( $image );

		if ( $pngData === false || $pngData === '' ) {
			return '';
		}

		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
		return 'data:image/png;base64,' . base64_encode( $pngData );
	}

	/**
	 * Draw centered text between two x positions using GD built-in fonts.
	 */
	private function drawCenteredText( \GdImage $image, string $text, int $x1, int $x2, int $y, int $fontSize, int $color ): void {
		$font      = min( 5, max( 1, (int) round( $fontSize / 3 ) ) );
		$charWidth = imagefontwidth( $font );
		$textWidth = $charWidth * strlen( $text );
		$centerX   = $x1 + (int) ( ( $x2 - $x1 ) / 2 );
		$textX     = $centerX - (int) ( $textWidth / 2 );

		imagestring( $image, $font, $textX, $y, $text, $color );
	}

	/**
	 * Convert hex color to RGB array.
	 *
	 * @param string $hex Hex color (e.g. "#3b82f6").
	 * @return array{0:int,1:int,2:int} RGB values.
	 */
	private function hexToRgb( string $hex ): array {
		$hex = ltrim( $hex, '#' );
		if ( strlen( $hex ) === 3 ) {
			$hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
		}
		return [
			(int) hexdec( substr( $hex, 0, 2 ) ),
			(int) hexdec( substr( $hex, 2, 2 ) ),
			(int) hexdec( substr( $hex, 4, 2 ) ),
		];
	}
}
