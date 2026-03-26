<?php

declare( strict_types=1 );

namespace Resa\Services\Pdf\Charts;

/**
 * Simple bar chart rendered as SVG.
 *
 * Used for PDF generation with mPDF, which natively supports SVG rendering.
 */
final class SimpleBarChart {

	private const DEFAULT_WIDTH  = 500;
	private const DEFAULT_HEIGHT = 250;

	/**
	 * Render a bar chart as inline SVG markup.
	 *
	 * mPDF natively renders SVG, so no fallback (PNG) is needed.
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
}
