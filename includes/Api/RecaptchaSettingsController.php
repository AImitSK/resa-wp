<?php

declare( strict_types=1 );

namespace Resa\Api;

use Resa\Security\RecaptchaVerifier;

/**
 * REST controller for reCAPTCHA v3 settings.
 *
 * Admin-only endpoints for managing Google reCAPTCHA v3 configuration.
 *
 * GET  /admin/recaptcha-settings — Read current settings.
 * PUT  /admin/recaptcha-settings — Update settings.
 */
final class RecaptchaSettingsController extends RestController {

	private const OPTION_KEY = 'resa_recaptcha_settings';

	/**
	 * Default reCAPTCHA settings.
	 *
	 * @var array<string, mixed>
	 */
	private const DEFAULTS = [
		'enabled'    => false,
		'site_key'   => '',
		'secret_key' => '',
		'threshold'  => 0.5,
	];

	/**
	 * @inheritDoc
	 */
	public function registerRoutes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/admin/recaptcha-settings',
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
	 * GET /admin/recaptcha-settings — Get reCAPTCHA settings.
	 */
	public function show(): \WP_REST_Response {
		return $this->success( self::get() );
	}

	/**
	 * PUT /admin/recaptcha-settings — Update reCAPTCHA settings.
	 */
	public function update( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$params  = $request->get_json_params();
		$current = self::get();
		$updated = [];

		// Boolean: enabled.
		$updated['enabled'] = isset( $params['enabled'] ) ? (bool) $params['enabled'] : $current['enabled'];

		// String: site_key, secret_key.
		$updated['site_key']   = isset( $params['site_key'] )
			? sanitize_text_field( $params['site_key'] )
			: $current['site_key'];
		$updated['secret_key'] = isset( $params['secret_key'] )
			? sanitize_text_field( $params['secret_key'] )
			: $current['secret_key'];

		// Float: threshold (0.0–1.0).
		if ( isset( $params['threshold'] ) ) {
			$threshold = (float) $params['threshold'];
			$updated['threshold'] = max( 0.0, min( 1.0, $threshold ) );
		} else {
			$updated['threshold'] = $current['threshold'];
		}

		// Cannot enable without both keys set.
		if ( $updated['enabled'] && ( $updated['site_key'] === '' || $updated['secret_key'] === '' ) ) {
			$updated['enabled'] = false;
		}

		update_option( self::OPTION_KEY, $updated );

		return $this->success( $updated );
	}

	/**
	 * Get merged reCAPTCHA settings (stored + defaults).
	 *
	 * @return array<string, mixed>
	 */
	public static function get(): array {
		$stored = get_option( self::OPTION_KEY, [] );
		$stored = is_array( $stored ) ? $stored : [];

		return array_merge( self::DEFAULTS, $stored );
	}

	/**
	 * Check if reCAPTCHA is fully configured and enabled.
	 */
	public static function isEnabled(): bool {
		$settings = self::get();

		return (bool) $settings['enabled']
			&& $settings['site_key'] !== ''
			&& $settings['secret_key'] !== '';
	}
}
