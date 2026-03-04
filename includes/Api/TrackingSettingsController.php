<?php

declare( strict_types=1 );

namespace Resa\Api;

/**
 * REST controller for tracking settings.
 *
 * Admin-only endpoints for managing dataLayer, Google Ads conversions,
 * GCLID/UTM capture, and partial lead configuration.
 *
 * GET  /admin/tracking-settings — Read current settings.
 * PUT  /admin/tracking-settings — Update settings.
 */
final class TrackingSettingsController extends RestController {

	private const OPTION_KEY = 'resa_tracking_settings';

	/**
	 * Default tracking settings.
	 *
	 * @var array<string, mixed>
	 */
	private const DEFAULTS = [
		'funnel_tracking_enabled'      => true,
		'partial_leads_enabled'        => true,
		'partial_lead_ttl_days'        => 30,
		'datalayer_enabled'            => false,
		'google_ads_fv_id'             => '',
		'google_ads_fv_label'          => '',
		'google_ads_fs_id'             => '',
		'google_ads_fs_label'          => '',
		'enhanced_conversions_enabled' => false,
		'gclid_capture_enabled'        => true,
		'utm_capture_enabled'          => true,
	];

	/**
	 * @inheritDoc
	 */
	public function registerRoutes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/admin/tracking-settings',
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
	 * GET /admin/tracking-settings — Get tracking settings.
	 */
	public function show(): \WP_REST_Response {
		return $this->success( self::get() );
	}

	/**
	 * PUT /admin/tracking-settings — Update tracking settings.
	 */
	public function update( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$params = $request->get_json_params();
		$errors = [];

		// Validate conversion IDs (must be AW-XXXXX format or empty).
		foreach ( [ 'google_ads_fv_id', 'google_ads_fs_id' ] as $key ) {
			if ( isset( $params[ $key ] ) && $params[ $key ] !== '' ) {
				if ( ! preg_match( '/^AW-\d+$/', $params[ $key ] ) ) {
					$errors[ $key ] = __( 'Ungültiges Format. Erwartet: AW-XXXXXXXXX', 'resa' );
				}
			}
		}

		// Validate TTL (7–365 days).
		if ( isset( $params['partial_lead_ttl_days'] ) ) {
			$ttl = (int) $params['partial_lead_ttl_days'];
			if ( $ttl < 7 || $ttl > 365 ) {
				$errors['partial_lead_ttl_days'] = __( 'TTL muss zwischen 7 und 365 Tagen liegen.', 'resa' );
			}
		}

		if ( ! empty( $errors ) ) {
			return $this->validationError( $errors );
		}

		// Merge with current settings.
		$current = self::get();
		$updated = [];

		// Boolean fields.
		$booleans = [
			'funnel_tracking_enabled',
			'partial_leads_enabled',
			'datalayer_enabled',
			'enhanced_conversions_enabled',
			'gclid_capture_enabled',
			'utm_capture_enabled',
		];

		foreach ( $booleans as $key ) {
			$updated[ $key ] = isset( $params[ $key ] ) ? (bool) $params[ $key ] : $current[ $key ];
		}

		// String fields (conversion IDs / labels).
		$strings = [
			'google_ads_fv_id',
			'google_ads_fv_label',
			'google_ads_fs_id',
			'google_ads_fs_label',
		];

		foreach ( $strings as $key ) {
			$updated[ $key ] = isset( $params[ $key ] )
				? sanitize_text_field( $params[ $key ] )
				: $current[ $key ];
		}

		// Integer fields.
		$updated['partial_lead_ttl_days'] = isset( $params['partial_lead_ttl_days'] )
			? (int) $params['partial_lead_ttl_days']
			: $current['partial_lead_ttl_days'];

		update_option( self::OPTION_KEY, $updated );

		return $this->success( $updated );
	}

	/**
	 * Get merged tracking settings (stored + defaults).
	 *
	 * Also used by ResaShortcode to pass config to the frontend.
	 *
	 * @return array<string, mixed>
	 */
	public static function get(): array {
		$stored = get_option( self::OPTION_KEY, [] );
		$stored = is_array( $stored ) ? $stored : [];

		return array_merge( self::DEFAULTS, $stored );
	}
}
