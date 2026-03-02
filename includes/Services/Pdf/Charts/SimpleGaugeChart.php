<?php

declare( strict_types=1 );

namespace Resa\Services\Pdf\Charts;

/**
 * Simple gauge (semi-circle) chart with dual rendering.
 *
 * - render()    → Inline SVG for Puppeteer (Chrome-quality).
 * - renderPng() → GD-based PNG data URI for DOMPDF fallback.
 *
 * Mimics the frontend MarketPositionGauge component.
 */
final class SimpleGaugeChart {

	private const DEFAULT_SIZE = 200;

	/**
	 * Render a gauge chart as inline SVG markup.
	 *
	 * Used by Puppeteer — Chromium renders SVG natively.
	 *
	 * @param int                  $percentile Value 0-100.
	 * @param string               $label      Label below the gauge.
	 * @param array<string,mixed>  $config     Optional config (size).
	 * @return string SVG markup, or empty string.
	 */
	public function render( int $percentile, string $label = '', array $config = [] ): string {
		$percentile = max( 0, min( 100, $percentile ) );
		$size       = (int) ( $config['size'] ?? self::DEFAULT_SIZE );
		$halfH      = (int) ( $size * 0.65 );

		$cx     = (int) ( $size / 2 );
		$cy     = (int) ( $halfH * 0.72 );
		$radius = (int) ( $size * 0.38 );
		$thick  = 12;

		$arcColor = $this->getPercentileHexColor( $percentile );

		$svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' . $size . '" height="' . $halfH . '" viewBox="0 0 ' . $size . ' ' . $halfH . '">';

		// Background.
		$svg .= '<rect width="' . $size . '" height="' . $halfH . '" fill="white"/>';

		// Background arc (full semicircle).
		$svg .= $this->svgArc( $cx, $cy, $radius, $thick, 180, 360, '#e2e8f0' );

		// Colored arc.
		if ( $percentile > 0 ) {
			$endAngle = 180.0 + ( $percentile / 100.0 ) * 180.0;
			$svg     .= $this->svgArc( $cx, $cy, $radius, $thick, 180, $endAngle, $arcColor );
		}

		// Needle.
		$needleAngle = 180.0 + ( $percentile / 100.0 ) * 180.0;
		$needleRad   = deg2rad( $needleAngle );
		$needleLen   = $radius * 0.85;
		$needleX     = $cx + (int) ( $needleLen * cos( $needleRad ) );
		$needleY     = $cy + (int) ( $needleLen * sin( $needleRad ) );

		$svg .= '<line x1="' . $cx . '" y1="' . $cy . '" x2="' . $needleX . '" y2="' . $needleY . '" stroke="#334155" stroke-width="2" stroke-linecap="round"/>';

		// Center dot.
		$svg .= '<circle cx="' . $cx . '" cy="' . $cy . '" r="5" fill="#334155"/>';

		// Percentile text.
		$textY = $cy - $radius + (int) ( $radius * 0.4 );
		$svg  .= '<text x="' . $cx . '" y="' . $textY . '" text-anchor="middle" font-family="DejaVu Sans, Helvetica, Arial, sans-serif" font-size="16" font-weight="bold" fill="#1e293b">' . $percentile . '%</text>';

		// Label.
		if ( $label !== '' ) {
			$labelY = $cy + 16;
			$svg   .= '<text x="' . $cx . '" y="' . $labelY . '" text-anchor="middle" font-family="DejaVu Sans, Helvetica, Arial, sans-serif" font-size="11" fill="#64748b">' . esc_html( $label ) . '</text>';
		}

		$svg .= '</svg>';

		return $svg;
	}

	/**
	 * Render a gauge chart as base64 PNG data URI (DOMPDF fallback).
	 *
	 * @param int                  $percentile Value 0-100.
	 * @param string               $label      Label below the gauge.
	 * @param array<string,mixed>  $config     Optional config (size).
	 * @return string Base64 data URI string, or empty on failure.
	 */
	public function renderPng( int $percentile, string $label = '', array $config = [] ): string {
		if ( ! function_exists( 'imagecreatetruecolor' ) ) {
			return '';
		}

		$percentile = max( 0, min( 100, $percentile ) );
		$size       = (int) ( $config['size'] ?? self::DEFAULT_SIZE );

		$scale = 2;
		$w     = $size * $scale;
		$h     = (int) ( ( $size * 0.65 ) * $scale );

		$image = imagecreatetruecolor( $w, $h );
		if ( $image === false ) {
			return '';
		}

		imageantialias( $image, true );

		// Colors.
		$bgColor   = (int) imagecolorallocate( $image, 255, 255, 255 );
		$textColor = (int) imagecolorallocate( $image, 30, 41, 59 );
		$grayColor = (int) imagecolorallocate( $image, 226, 232, 240 );
		$darkColor = (int) imagecolorallocate( $image, 51, 65, 85 );

		$arcRgb   = $this->getPercentileColor( $percentile );
		$arcColor = (int) imagecolorallocate( $image, $arcRgb[0], $arcRgb[1], $arcRgb[2] );

		imagefilledrectangle( $image, 0, 0, $w - 1, $h - 1, $bgColor );

		$cx     = (int) ( $w / 2 );
		$cy     = (int) ( $h * 0.72 );
		$radius = (int) ( $w * 0.38 );
		$thick  = (int) ( 12 * $scale );

		// Background arc.
		$this->drawThickArc( $image, $cx, $cy, $radius, $thick, 180.0, 360.0, $grayColor );

		// Colored arc.
		if ( $percentile > 0 ) {
			$endAngle = 180.0 + ( $percentile / 100.0 ) * 180.0;
			$this->drawThickArc( $image, $cx, $cy, $radius, $thick, 180.0, $endAngle, $arcColor );
		}

		// Needle.
		$needleAngle = 180.0 + ( $percentile / 100.0 ) * 180.0;
		$needleRad   = deg2rad( $needleAngle );
		$needleLen   = $radius * 0.85;
		$needleX     = $cx + (int) ( $needleLen * cos( $needleRad ) );
		$needleY     = $cy + (int) ( $needleLen * sin( $needleRad ) );

		for ( $offset = -1; $offset <= 1; $offset++ ) {
			imageline( $image, $cx + $offset, $cy, $needleX + $offset, $needleY, $darkColor );
			imageline( $image, $cx, $cy + $offset, $needleX, $needleY + $offset, $darkColor );
		}

		// Center dot.
		$dotRadius = (int) ( 5 * $scale );
		imagefilledellipse( $image, $cx, $cy, $dotRadius * 2, $dotRadius * 2, $darkColor );

		// Percentile text.
		$percText = $percentile . '%';
		$font     = 5;
		$charW    = imagefontwidth( $font );
		$textW    = $charW * strlen( $percText );
		$textX    = $cx - (int) ( $textW / 2 );
		$textY    = $cy - $radius + (int) ( $radius * 0.35 );
		imagestring( $image, $font, $textX, $textY, $percText, $textColor );

		// Label.
		if ( $label !== '' ) {
			$labelFont  = 3;
			$labelCharW = imagefontwidth( $labelFont );
			$labelW     = $labelCharW * strlen( $label );
			$labelX     = $cx - (int) ( $labelW / 2 );
			$labelY     = $cy + (int) ( 8 * $scale );
			$labelColor = (int) imagecolorallocate( $image, 100, 116, 139 );
			imagestring( $image, $labelFont, $labelX, $labelY, $label, $labelColor );
		}

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
	 * Generate SVG arc path for the gauge.
	 *
	 * @param int    $cx         Center X.
	 * @param int    $cy         Center Y.
	 * @param int    $radius     Radius.
	 * @param int    $thickness  Stroke width.
	 * @param float  $startAngle Start angle in degrees.
	 * @param float  $endAngle   End angle in degrees.
	 * @param string $color      Hex color.
	 * @return string SVG path element.
	 */
	private function svgArc( int $cx, int $cy, int $radius, int $thickness, float $startAngle, float $endAngle, string $color ): string {
		$startRad = deg2rad( $startAngle );
		$endRad   = deg2rad( $endAngle );

		$x1 = $cx + $radius * cos( $startRad );
		$y1 = $cy + $radius * sin( $startRad );
		$x2 = $cx + $radius * cos( $endRad );
		$y2 = $cy + $radius * sin( $endRad );

		$largeArc = ( $endAngle - $startAngle > 180 ) ? 1 : 0;

		$d = sprintf(
			'M %.2f %.2f A %d %d 0 %d 1 %.2f %.2f',
			$x1,
			$y1,
			$radius,
			$radius,
			$largeArc,
			$x2,
			$y2
		);

		return '<path d="' . $d . '" fill="none" stroke="' . esc_attr( $color ) . '" stroke-width="' . $thickness . '" stroke-linecap="round"/>';
	}

	/**
	 * Draw a thick arc using multiple thin arcs at different radii (GD).
	 */
	private function drawThickArc( \GdImage $image, int $cx, int $cy, int $radius, int $thickness, float $startAngle, float $endAngle, int $color ): void {
		$halfThick = (int) ( $thickness / 2 );
		for ( $r = $radius - $halfThick; $r <= $radius + $halfThick; $r++ ) {
			imagearc( $image, $cx, $cy, $r * 2, $r * 2, (int) $startAngle, (int) $endAngle, $color );
		}
	}

	/**
	 * Get hex color for a percentile value.
	 *
	 * @param int $percentile 0-100.
	 * @return string Hex color.
	 */
	private function getPercentileHexColor( int $percentile ): string {
		if ( $percentile <= 20 ) {
			return '#64748b';
		}
		if ( $percentile <= 35 ) {
			return '#06b6d4';
		}
		if ( $percentile <= 50 ) {
			return '#3b82f6';
		}
		if ( $percentile <= 65 ) {
			return '#22c55e';
		}
		if ( $percentile <= 80 ) {
			return '#f97316';
		}
		return '#ef4444';
	}

	/**
	 * Get RGB color for a percentile value (GD).
	 *
	 * @param int $percentile 0-100.
	 * @return array{0:int,1:int,2:int} RGB.
	 */
	private function getPercentileColor( int $percentile ): array {
		if ( $percentile <= 20 ) {
			return [ 100, 116, 139 ];
		}
		if ( $percentile <= 35 ) {
			return [ 6, 182, 212 ];
		}
		if ( $percentile <= 50 ) {
			return [ 59, 130, 246 ];
		}
		if ( $percentile <= 65 ) {
			return [ 34, 197, 94 ];
		}
		if ( $percentile <= 80 ) {
			return [ 249, 115, 22 ];
		}
		return [ 239, 68, 68 ];
	}
}
