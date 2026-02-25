<?php

declare( strict_types=1 );

namespace Resa\Shortcode;

use Resa\Core\Vite;

/**
 * [resa] shortcode handler.
 *
 * Renders the widget container for a specific module and enqueues
 * the frontend React app with the necessary configuration.
 *
 * Usage:
 *   [resa module="rent-calculator"]
 *   [resa module="rent-calculator" city="muenchen"]
 */
final class ResaShortcode {

	private Vite $vite;
	private bool $enqueued = false;

	public function __construct( Vite $vite ) {
		$this->vite = $vite;
	}

	/**
	 * Register the shortcode with WordPress.
	 */
	public function register(): void {
		add_shortcode( 'resa', [ $this, 'render' ] );
	}

	/**
	 * Render the shortcode output.
	 *
	 * @param array<string,string>|string $atts Shortcode attributes.
	 * @return string HTML output.
	 */
	public function render( $atts ): string {
		$atts = shortcode_atts(
			[
				'module' => '',
				'city'   => '',
			],
			$atts,
			'resa'
		);

		$module = sanitize_text_field( $atts['module'] );
		$city   = sanitize_text_field( $atts['city'] );

		if ( $module === '' ) {
			return '<!-- RESA: module attribute required -->';
		}

		$this->enqueueAssets( $module, $city );

		$dataAttrs = sprintf( 'data-module="%s"', esc_attr( $module ) );
		if ( $city !== '' ) {
			$dataAttrs .= sprintf( ' data-city="%s"', esc_attr( $city ) );
		}

		return sprintf(
			'<div class="resa-widget-root" %s></div>',
			$dataAttrs
		);
	}

	/**
	 * Enqueue frontend assets (only once per page).
	 */
	private function enqueueAssets( string $module, string $city ): void {
		if ( $this->enqueued ) {
			return;
		}

		$this->vite->enqueue( 'src/frontend/main.tsx', 'resa-frontend' );

		$frontendData = [
			'restUrl' => esc_url_raw( rest_url( 'resa/v1/' ) ),
			'module'  => $module,
			'version' => RESA_VERSION,
		];

		if ( $city !== '' ) {
			$frontendData['city'] = $city;
		}

		wp_localize_script( 'resa-frontend', 'resaFrontend', $frontendData );

		$this->enqueued = true;
	}
}
