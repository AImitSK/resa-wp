<?php

declare( strict_types=1 );

namespace Resa\Services\Pdf\Charts;

/**
 * Simple SVG pie chart for DOMPDF rendering.
 *
 * Generates basic pie/donut charts as inline SVG using arc paths.
 * No gradients, filters, or animations — DOMPDF compatible.
 */
final class SimplePieChart {

	/**
	 * Default chart dimensions.
	 */
	private const DEFAULT_SIZE    = 250;
	private const LEGEND_WIDTH    = 180;
	private const LEGEND_ITEM_GAP = 22;

	/**
	 * Render a pie chart as SVG string.
	 *
	 * @param array<int,array{label:string,value:float,color?:string}> $slices Slice data.
	 * @param array<string,mixed>                                      $config Chart config.
	 * @return string SVG markup.
	 */
	public function render( array $slices, array $config = [] ): string {
		if ( count( $slices ) === 0 ) {
			return '';
		}

		$size       = (int) ( $config['size'] ?? self::DEFAULT_SIZE );
		$title      = $config['title'] ?? '';
		$donut      = (bool) ( $config['donut'] ?? false );
		$showLegend = (bool) ( $config['showLegend'] ?? true );
		$colors     = $config['colors'] ?? [ '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899' ];
		$fontSize   = (int) ( $config['fontSize'] ?? 11 );

		$totalValue = array_sum( array_column( $slices, 'value' ) );
		if ( $totalValue <= 0 ) {
			return '';
		}

		$totalWidth = $showLegend ? $size + self::LEGEND_WIDTH : $size;
		$titleGap   = $title !== '' ? 30 : 0;
		$svgHeight  = $size + $titleGap;

		$svg = sprintf(
			'<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d">',
			$totalWidth,
			$svgHeight,
			$totalWidth,
			$svgHeight
		);

		// Title.
		if ( $title !== '' ) {
			$svg .= sprintf(
				'<text x="%d" y="18" font-family="sans-serif" font-size="14" font-weight="bold" fill="#1e293b" text-anchor="middle">%s</text>',
				(int) ( $totalWidth / 2 ),
				esc_html( $title )
			);
		}

		$cx     = (int) ( $size / 2 );
		$cy     = (int) ( $size / 2 ) + $titleGap;
		$radius = (int) ( $size / 2 ) - 10;
		$inner  = $donut ? (int) ( $radius * 0.55 ) : 0;

		$startAngle = -90.0; // Start at top.

		foreach ( $slices as $index => $slice ) {
			$value      = (float) $slice['value'];
			$sliceColor = $slice['color'] ?? $colors[ $index % count( $colors ) ];
			$percentage = $value / $totalValue;
			$angle      = $percentage * 360;
			$endAngle   = $startAngle + $angle;

			// Draw arc path.
			$svg .= $this->arcPath( $cx, $cy, $radius, $inner, $startAngle, $endAngle, $sliceColor );

			$startAngle = $endAngle;
		}

		// Legend.
		if ( $showLegend ) {
			$legendX = $size + 15;
			$legendY = $titleGap + 20;

			foreach ( $slices as $index => $slice ) {
				$sliceColor = $slice['color'] ?? $colors[ $index % count( $colors ) ];
				$percentage = ( (float) $slice['value'] / $totalValue ) * 100;
				$itemY      = $legendY + ( $index * self::LEGEND_ITEM_GAP );

				$svg .= sprintf(
					'<rect x="%d" y="%d" width="12" height="12" fill="%s" rx="2" />',
					$legendX,
					$itemY - 10,
					esc_attr( $sliceColor )
				);

				$svg .= sprintf(
					'<text x="%d" y="%d" font-family="sans-serif" font-size="%d" fill="#334155">%s (%s%%)</text>',
					$legendX + 18,
					$itemY,
					$fontSize,
					esc_html( (string) $slice['label'] ),
					number_format( $percentage, 0 )
				);
			}
		}

		$svg .= '</svg>';

		return $svg;
	}

	/**
	 * Generate an SVG arc path for a pie slice.
	 *
	 * @param int    $cx         Center X.
	 * @param int    $cy         Center Y.
	 * @param int    $outer      Outer radius.
	 * @param int    $inner      Inner radius (0 for full pie).
	 * @param float  $startAngle Start angle in degrees.
	 * @param float  $endAngle   End angle in degrees.
	 * @param string $color      Fill color.
	 * @return string SVG path element.
	 */
	private function arcPath( int $cx, int $cy, int $outer, int $inner, float $startAngle, float $endAngle, string $color ): string {
		$largeArc = ( $endAngle - $startAngle ) > 180 ? 1 : 0;

		$startRad = deg2rad( $startAngle );
		$endRad   = deg2rad( $endAngle );

		$x1 = $cx + $outer * cos( $startRad );
		$y1 = $cy + $outer * sin( $startRad );
		$x2 = $cx + $outer * cos( $endRad );
		$y2 = $cy + $outer * sin( $endRad );

		if ( $inner > 0 ) {
			$ix1 = $cx + $inner * cos( $endRad );
			$iy1 = $cy + $inner * sin( $endRad );
			$ix2 = $cx + $inner * cos( $startRad );
			$iy2 = $cy + $inner * sin( $startRad );

			return sprintf(
				'<path d="M %.2f %.2f A %d %d 0 %d 1 %.2f %.2f L %.2f %.2f A %d %d 0 %d 0 %.2f %.2f Z" fill="%s" />',
				$x1,
				$y1,
				$outer,
				$outer,
				$largeArc,
				$x2,
				$y2,
				$ix1,
				$iy1,
				$inner,
				$inner,
				$largeArc,
				$ix2,
				$iy2,
				esc_attr( $color )
			);
		}

		return sprintf(
			'<path d="M %d %d L %.2f %.2f A %d %d 0 %d 1 %.2f %.2f Z" fill="%s" />',
			$cx,
			$cy,
			$x1,
			$y1,
			$outer,
			$outer,
			$largeArc,
			$x2,
			$y2,
			esc_attr( $color )
		);
	}
}
