<?php

declare( strict_types=1 );

namespace Resa\Api;

/**
 * REST controller for PDF template settings.
 *
 * Admin-only endpoints for managing base PDF layout:
 * header/footer text, margins, agent display toggle.
 */
class PdfSettingsController extends RestController {

	/**
	 * Option key for all PDF settings.
	 */
	private const OPTION_KEY = 'resa_pdf_settings';

	/**
	 * Default settings.
	 *
	 * @var array<string,mixed>
	 */
	private const DEFAULTS = [
		'header_text'    => '',
		'footer_text'    => '',
		'show_date'      => true,
		'show_agents'    => true,
		'logo_position'  => 'left',
		'logo_size'      => 36,
		'margins'        => [
			'top'    => 20,
			'bottom' => 25,
			'left'   => 15,
			'right'  => 15,
		],
	];

	/**
	 * @inheritDoc
	 */
	public function registerRoutes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/admin/pdf/settings',
			[
				[
					'methods'             => 'GET',
					'callback'            => [ $this, 'show' ],
					'permission_callback' => [ $this, 'adminAccess' ],
				],
				[
					'methods'             => 'PUT',
					'callback'            => [ $this, 'update' ],
					'permission_callback' => [ $this, 'adminAccess' ],
				],
			]
		);
	}

	/**
	 * GET /admin/pdf/settings — Get PDF settings.
	 */
	public function show(): \WP_REST_Response {
		return $this->success( self::formatForApi( self::getSettings() ) );
	}

	/**
	 * PUT /admin/pdf/settings — Update PDF settings.
	 */
	public function update( \WP_REST_Request $request ): \WP_REST_Response {
		$params   = $request->get_json_params();
		$settings = self::getSettings();

		if ( array_key_exists( 'headerText', $params ) ) {
			$settings['header_text'] = sanitize_text_field( $params['headerText'] ?? '' );
		}

		if ( array_key_exists( 'footerText', $params ) ) {
			$settings['footer_text'] = sanitize_text_field( $params['footerText'] ?? '' );
		}

		if ( array_key_exists( 'showDate', $params ) ) {
			$settings['show_date'] = (bool) $params['showDate'];
		}

		if ( array_key_exists( 'showAgents', $params ) ) {
			$settings['show_agents'] = (bool) $params['showAgents'];
		}

		if ( array_key_exists( 'logoPosition', $params ) ) {
			$allowed = [ 'left', 'center', 'right' ];
			$pos     = sanitize_text_field( $params['logoPosition'] ?? 'left' );
			$settings['logo_position'] = in_array( $pos, $allowed, true ) ? $pos : 'left';
		}

		if ( array_key_exists( 'logoSize', $params ) ) {
			$size = absint( $params['logoSize'] ?? 36 );
			$settings['logo_size'] = max( 16, min( $size, 80 ) );
		}

		if ( isset( $params['margins'] ) && is_array( $params['margins'] ) ) {
			$margins = $params['margins'];
			$settings['margins'] = [
				'top'    => self::clampMargin( $margins['top'] ?? 20 ),
				'bottom' => self::clampMargin( $margins['bottom'] ?? 25 ),
				'left'   => self::clampMargin( $margins['left'] ?? 15 ),
				'right'  => self::clampMargin( $margins['right'] ?? 15 ),
			];
		}

		update_option( self::OPTION_KEY, $settings );

		return $this->success( self::formatForApi( $settings ) );
	}

	/**
	 * Get stored settings merged with defaults.
	 *
	 * @return array<string,mixed>
	 */
	public static function getSettings(): array {
		$stored = get_option( self::OPTION_KEY, [] );

		if ( ! is_array( $stored ) ) {
			$stored = [];
		}

		$settings = array_merge( self::DEFAULTS, $stored );

		// Merge margins separately to ensure all keys exist.
		$settings['margins'] = array_merge(
			self::DEFAULTS['margins'],
			is_array( $settings['margins'] ) ? $settings['margins'] : []
		);

		return $settings;
	}

	/**
	 * Format settings for API response (camelCase keys).
	 *
	 * @param array<string,mixed> $settings Settings array.
	 * @return array<string,mixed>
	 */
	private static function formatForApi( array $settings ): array {
		return [
			'headerText'   => $settings['header_text'] ?? '',
			'footerText'   => $settings['footer_text'] ?? '',
			'showDate'     => (bool) ( $settings['show_date'] ?? true ),
			'showAgents'   => (bool) ( $settings['show_agents'] ?? true ),
			'logoPosition' => $settings['logo_position'] ?? 'left',
			'logoSize'     => (int) ( $settings['logo_size'] ?? 36 ),
			'margins'      => $settings['margins'] ?? self::DEFAULTS['margins'],
		];
	}

	/**
	 * Clamp a margin value between 0 and 50mm.
	 *
	 * @param mixed $value Input value.
	 * @return int Clamped integer.
	 */
	private static function clampMargin( mixed $value ): int {
		$int = absint( $value );
		return min( $int, 50 );
	}
}
