<?php

declare( strict_types=1 );

namespace Resa\Api;

/**
 * REST controller for branding settings.
 *
 * Admin-only endpoints for managing logo, colors, and
 * "Powered by RESA" display setting.
 */
class BrandingController extends RestController {

	/**
	 * Option keys for branding settings.
	 */
	private const OPT_LOGO_URL       = 'resa_branding_logo_url';
	private const OPT_LOGO_ID        = 'resa_branding_logo_id';
	private const OPT_PRIMARY_COLOR  = 'resa_branding_primary_color';
	private const OPT_SECONDARY_COLOR = 'resa_branding_secondary_color';
	private const OPT_SHOW_POWERED_BY = 'resa_branding_show_powered_by';

	/**
	 * Default branding values.
	 */
	private const DEFAULT_PRIMARY_COLOR   = '#a9e43f';
	private const DEFAULT_SECONDARY_COLOR = '#1e303a';

	/**
	 * @inheritDoc
	 */
	public function registerRoutes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/admin/branding',
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
	 * GET /admin/branding — Get branding settings.
	 */
	public function show(): \WP_REST_Response {
		return $this->success( $this->getBrandingData() );
	}

	/**
	 * PUT /admin/branding — Update branding settings.
	 */
	public function update( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$params = $request->get_json_params();

		// Validate colors (must be valid hex).
		if ( isset( $params['primaryColor'] ) && ! $this->isValidHexColor( $params['primaryColor'] ) ) {
			return $this->validationError( [
				'primaryColor' => __( 'Ungültiger Hex-Farbwert.', 'resa' ),
			] );
		}

		if ( isset( $params['secondaryColor'] ) && ! $this->isValidHexColor( $params['secondaryColor'] ) ) {
			return $this->validationError( [
				'secondaryColor' => __( 'Ungültiger Hex-Farbwert.', 'resa' ),
			] );
		}

		// Validate logo ID (must be a valid attachment if provided).
		if ( isset( $params['logoId'] ) && $params['logoId'] !== null && $params['logoId'] !== 0 ) {
			$logoId = absint( $params['logoId'] );
			if ( get_post_type( $logoId ) !== 'attachment' ) {
				return $this->validationError( [
					'logoId' => __( 'Ungültige Medien-ID.', 'resa' ),
				] );
			}
		}

		// Update settings.
		if ( array_key_exists( 'logoUrl', $params ) ) {
			$logoUrl = $params['logoUrl'] ? esc_url_raw( $params['logoUrl'] ) : '';
			update_option( self::OPT_LOGO_URL, $logoUrl );
		}

		if ( array_key_exists( 'logoId', $params ) ) {
			$logoId = $params['logoId'] ? absint( $params['logoId'] ) : 0;
			update_option( self::OPT_LOGO_ID, $logoId );
		}

		if ( isset( $params['primaryColor'] ) ) {
			update_option( self::OPT_PRIMARY_COLOR, sanitize_hex_color( $params['primaryColor'] ) );
		}

		if ( isset( $params['secondaryColor'] ) ) {
			update_option( self::OPT_SECONDARY_COLOR, sanitize_hex_color( $params['secondaryColor'] ) );
		}

		if ( isset( $params['showPoweredBy'] ) ) {
			// Free plan always shows "Powered by RESA" — enforce on backend.
			$showPoweredBy = $this->canDisablePoweredBy() ? (bool) $params['showPoweredBy'] : true;
			update_option( self::OPT_SHOW_POWERED_BY, $showPoweredBy ? '1' : '0' );
		}

		return $this->success( $this->getBrandingData() );
	}

	/**
	 * Get all branding settings as array.
	 *
	 * @return array<string, mixed>
	 */
	private function getBrandingData(): array {
		return [
			'logoUrl'        => (string) get_option( self::OPT_LOGO_URL, '' ),
			'logoId'         => (int) get_option( self::OPT_LOGO_ID, 0 ),
			'primaryColor'   => (string) get_option( self::OPT_PRIMARY_COLOR, self::DEFAULT_PRIMARY_COLOR ),
			'secondaryColor' => (string) get_option( self::OPT_SECONDARY_COLOR, self::DEFAULT_SECONDARY_COLOR ),
			'showPoweredBy'  => get_option( self::OPT_SHOW_POWERED_BY, '1' ) === '1',
		];
	}

	/**
	 * Validate hex color format.
	 *
	 * @param string $color Color value to validate.
	 * @return bool True if valid hex color.
	 */
	private function isValidHexColor( string $color ): bool {
		return (bool) preg_match( '/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/', $color );
	}

	/**
	 * Check if current plan allows disabling "Powered by RESA".
	 *
	 * Free plan must always show the badge.
	 *
	 * @return bool True if user can disable the badge.
	 */
	private function canDisablePoweredBy(): bool {
		// Check Freemius plan.
		if ( function_exists( 'resa_fs' ) ) {
			return resa_fs()->can_use_premium_code();
		}

		return false;
	}
}
