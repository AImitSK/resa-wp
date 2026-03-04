<?php

declare( strict_types=1 );

namespace Resa\Shortcode;

use Resa\Api\PrivacySettingsController;
use Resa\Core\Vite;
use Resa\Security\SpamGuard;

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

		$styleAttr = $this->buildColorStyle();

		return sprintf(
			'<div class="resa-widget-root" %s%s></div>',
			$dataAttrs,
			$styleAttr
		);
	}

	/**
	 * Enqueue frontend assets (only once per page).
	 */
	private function enqueueAssets( string $module, string $city ): void {
		if ( $this->enqueued ) {
			return;
		}

		// wp-i18n must be loaded before the frontend bundle (provides window.wp.i18n).
		$this->vite->enqueue( 'src/frontend/main.tsx', 'resa-frontend', [ 'wp-i18n' ] );

		$frontendData = [
			'restUrl'        => esc_url_raw( rest_url( 'resa/v1/' ) ),
			'nonce'          => SpamGuard::createNonce(),
			'wpNonce'        => wp_create_nonce( 'wp_rest' ),
			'ts'             => SpamGuard::timestamp(),
			'module'         => $module,
			'version'        => RESA_VERSION,
			'trackingConfig' => self::getTrackingConfig(),
			'privacyConfig'  => self::getPrivacyConfig(),
		];

		if ( $city !== '' ) {
			$frontendData['city'] = $city;
		}

		wp_localize_script( 'resa-frontend', 'resaFrontend', $frontendData );

		$this->enqueued = true;
	}

	/**
	 * Get tracking configuration for the frontend widget.
	 *
	 * Merges stored settings with defaults. Used by wp_localize_script
	 * to expose config as `window.resaFrontend.trackingConfig`.
	 *
	 * @return array<string, mixed>
	 */
	private static function getTrackingConfig(): array {
		$defaults = [
			'datalayer_enabled'           => false,
			'google_ads_fv_id'            => '',
			'google_ads_fv_label'         => '',
			'google_ads_fs_id'            => '',
			'google_ads_fs_label'         => '',
			'enhanced_conversions_enabled' => false,
			'gclid_capture_enabled'       => true,
			'utm_capture_enabled'         => true,
		];

		$stored   = get_option( 'resa_tracking_settings', [] );
		$settings = is_array( $stored ) ? array_merge( $defaults, $stored ) : $defaults;

		return [
			'datalayer_enabled'   => (bool) $settings['datalayer_enabled'],
			'google_ads'          => [
				'form_view'  => [
					'id'    => sanitize_text_field( $settings['google_ads_fv_id'] ),
					'label' => sanitize_text_field( $settings['google_ads_fv_label'] ),
				],
				'form_submit' => [
					'id'    => sanitize_text_field( $settings['google_ads_fs_id'] ),
					'label' => sanitize_text_field( $settings['google_ads_fs_label'] ),
				],
			],
			'enhanced_conversions' => (bool) $settings['enhanced_conversions_enabled'],
			'gclid_capture'        => (bool) $settings['gclid_capture_enabled'],
			'utm_capture'          => (bool) $settings['utm_capture_enabled'],
		];
	}

	/**
	 * Get privacy configuration for the frontend widget.
	 *
	 * Provides privacy URL, consent text, and newsletter text
	 * from central privacy settings for use in LeadForm.
	 *
	 * @return array<string, string>
	 */
	private static function getPrivacyConfig(): array {
		$settings = PrivacySettingsController::get();

		return [
			'privacyUrl'     => PrivacySettingsController::getPrivacyUrl(),
			'consentText'    => $settings['consent_text'],
			'newsletterText' => $settings['newsletter_text'],
		];
	}

	/**
	 * Build inline style attribute for primary color CSS variables.
	 *
	 * @return string Empty string or ' style="..."' with leading space.
	 */
	private function buildColorStyle(): string {
		$color = get_option( 'resa_branding_primary_color', '' );
		if ( ! is_string( $color ) || $color === '' ) {
			return '';
		}

		// Sanitize: nur gültige Hex-Farben (#abc oder #aabbcc)
		if ( ! preg_match( '/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/', $color ) ) {
			return '';
		}

		$hsl = $this->hexToHsl( $color );

		// Abgeleitete Icon-Farben: primary + aufgehellte Varianten.
		$secondary = $this->lightenHex( $color, 0.35 );
		$light     = $this->lightenHex( $color, 0.55 );
		$bg        = $this->lightenHex( $color, 0.85 );

		return sprintf(
			' style="--resa-primary: %s; --resa-ring: %s; --resa-icon-primary: %s; --resa-icon-secondary: %s; --resa-icon-light: %s; --resa-icon-bg: %s;"',
			esc_attr( $hsl ),
			esc_attr( $hsl ),
			esc_attr( $color ),
			esc_attr( $secondary ),
			esc_attr( $light ),
			esc_attr( $bg )
		);
	}

	/**
	 * Lighten a hex color by mixing with white.
	 *
	 * @param string $hex   Hex color like #aabbcc.
	 * @param float  $amount Mix amount (0 = original, 1 = white).
	 * @return string Lightened hex color like #ddeeff.
	 */
	private function lightenHex( string $hex, float $amount ): string {
		$hex = ltrim( $hex, '#' );
		if ( strlen( $hex ) === 3 ) {
			$hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
		}

		$r = hexdec( substr( $hex, 0, 2 ) );
		$g = hexdec( substr( $hex, 2, 2 ) );
		$b = hexdec( substr( $hex, 4, 2 ) );

		// Mix with white (255, 255, 255).
		$r = (int) round( $r + ( 255 - $r ) * $amount );
		$g = (int) round( $g + ( 255 - $g ) * $amount );
		$b = (int) round( $b + ( 255 - $b ) * $amount );

		return sprintf( '#%02x%02x%02x', $r, $g, $b );
	}

	/**
	 * Convert hex color to HSL string without units (for CSS hsl() usage).
	 *
	 * Returns format: "210 80% 50%" (compatible with Tailwind CSS hsl(var(--color)) pattern).
	 *
	 * @param string $hex Hex color like #aabbcc or #abc.
	 * @return string HSL values like "210 80% 50%".
	 */
	private function hexToHsl( string $hex ): string {
		$hex = ltrim( $hex, '#' );

		// Expand shorthand (#abc → #aabbcc)
		if ( strlen( $hex ) === 3 ) {
			$hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
		}

		$r = hexdec( substr( $hex, 0, 2 ) ) / 255;
		$g = hexdec( substr( $hex, 2, 2 ) ) / 255;
		$b = hexdec( substr( $hex, 4, 2 ) ) / 255;

		$max   = max( $r, $g, $b );
		$min   = min( $r, $g, $b );
		$delta = $max - $min;

		// Lightness
		$l = ( $max + $min ) / 2;

		if ( $delta == 0 ) {
			return sprintf( '0 0%% %.1f%%', $l * 100 );
		}

		// Saturation
		$s = $delta / ( 1 - abs( 2 * $l - 1 ) );

		// Hue
		if ( $max === $r ) {
			$h = 60 * fmod( ( $g - $b ) / $delta, 6 );
		} elseif ( $max === $g ) {
			$h = 60 * ( ( $b - $r ) / $delta + 2 );
		} else {
			$h = 60 * ( ( $r - $g ) / $delta + 4 );
		}

		if ( $h < 0 ) {
			$h += 360;
		}

		return sprintf( '%.1f %.1f%% %.1f%%', $h, $s * 100, $l * 100 );
	}
}
