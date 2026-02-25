<?php

declare( strict_types=1 );

namespace Resa\Services\Pdf\Charts;

/**
 * Simple SVG bar chart for DOMPDF rendering.
 *
 * Generates basic vertical bar charts as inline SVG.
 * No gradients, filters, or advanced CSS — DOMPDF compatible.
 */
final class SimpleBarChart {

	/**
	 * Default chart dimensions.
	 */
	private const DEFAULT_WIDTH  = 500;
	private const DEFAULT_HEIGHT = 250;
	private const BAR_GAP        = 10;
	private const LABEL_HEIGHT   = 30;
	private const VALUE_OFFSET   = 15;
	private const PADDING_TOP    = 20;

	/**
	 * Render a bar chart as SVG string.
	 *
	 * @param array<int,array{label:string,value:float,color?:string}> $bars   Bar data.
	 * @param array<string,mixed>                                      $config Chart config.
	 * @return string SVG markup.
	 */
	public function render( array $bars, array $config = [] ): string {
		if ( count( $bars ) === 0 ) {
			return '';
		}

		$width    = (int) ( $config['width'] ?? self::DEFAULT_WIDTH );
		$height   = (int) ( $config['height'] ?? self::DEFAULT_HEIGHT );
		$title    = $config['title'] ?? '';
		$unit     = $config['unit'] ?? '';
		$colors   = $config['colors'] ?? [ '#3b82f6', '#94a3b8', '#cbd5e1', '#e2e8f0' ];
		$fontSize = (int) ( $config['fontSize'] ?? 12 );

		$barCount    = count( $bars );
		$chartTop    = $title !== '' ? self::PADDING_TOP + 25 : self::PADDING_TOP;
		$chartBottom = $height - self::LABEL_HEIGHT;
		$chartHeight = $chartBottom - $chartTop;

		$totalGaps = ( $barCount + 1 ) * self::BAR_GAP;
		$barWidth  = (int) ( ( $width - $totalGaps ) / $barCount );

		$maxValue = max( array_column( $bars, 'value' ) );
		if ( $maxValue <= 0 ) {
			$maxValue = 1;
		}

		$svg = sprintf(
			'<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d">',
			$width,
			$height,
			$width,
			$height
		);

		// Title.
		if ( $title !== '' ) {
			$svg .= sprintf(
				'<text x="%d" y="%d" font-family="sans-serif" font-size="14" font-weight="bold" fill="#1e293b" text-anchor="middle">%s</text>',
				(int) ( $width / 2 ),
				self::PADDING_TOP,
				esc_html( $title )
			);
		}

		// Bars.
		foreach ( $bars as $index => $bar ) {
			$value    = (float) $bar['value'];
			$label    = (string) $bar['label'];
			$barColor = $bar['color'] ?? $colors[ $index % count( $colors ) ];

			$barHeight = (int) ( ( $value / $maxValue ) * $chartHeight );
			$x         = self::BAR_GAP + $index * ( $barWidth + self::BAR_GAP );
			$y         = $chartBottom - $barHeight;
			$centerX   = $x + (int) ( $barWidth / 2 );

			// Bar rectangle.
			$svg .= sprintf(
				'<rect x="%d" y="%d" width="%d" height="%d" fill="%s" rx="3" />',
				$x,
				$y,
				$barWidth,
				$barHeight,
				esc_attr( $barColor )
			);

			// Value above bar.
			$valueText = $unit !== '' ? number_format( $value, 0, ',', '.' ) . ' ' . esc_html( $unit ) : number_format( $value, 0, ',', '.' );
			$svg      .= sprintf(
				'<text x="%d" y="%d" font-family="sans-serif" font-size="%d" fill="#1e293b" text-anchor="middle" font-weight="500">%s</text>',
				$centerX,
				$y - self::VALUE_OFFSET + 10,
				$fontSize,
				$valueText
			);

			// Label below bar.
			$svg .= sprintf(
				'<text x="%d" y="%d" font-family="sans-serif" font-size="%d" fill="#64748b" text-anchor="middle">%s</text>',
				$centerX,
				$height - 8,
				$fontSize,
				esc_html( $label )
			);
		}

		// Baseline.
		$svg .= sprintf(
			'<line x1="0" y1="%d" x2="%d" y2="%d" stroke="#e2e8f0" stroke-width="1" />',
			$chartBottom,
			$width,
			$chartBottom
		);

		$svg .= '</svg>';

		return $svg;
	}
}
