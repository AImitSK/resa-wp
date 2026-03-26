<?php

declare( strict_types=1 );

namespace Resa\Services\Pdf\Charts;

/**
 * Simple gauge (semi-circle) chart rendered as SVG.
 *
 * Mimics the frontend MarketPositionGauge component.
 * mPDF natively supports SVG rendering, so no PNG fallback is needed.
 */
final class SimpleGaugeChart {

	private const DEFAULT_SIZE = 200;

	/**
	 * Render a gauge chart as inline SVG markup.
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
}
