<?php

declare( strict_types=1 );

namespace Resa\Api;

/**
 * REST controller for privacy / GDPR settings.
 *
 * Admin-only endpoints for managing consent text, retention periods,
 * and anonymization preferences.
 *
 * GET  /admin/privacy-settings — Read current settings.
 * PUT  /admin/privacy-settings — Update settings.
 */
final class PrivacySettingsController extends RestController {

	private const OPTION_KEY = 'resa_privacy_settings';

	/**
	 * Default privacy settings.
	 *
	 * @var array<string, mixed>
	 */
	private const DEFAULTS = [
		'privacy_url'                 => '',
		'consent_text'                => 'Ich stimme der Verarbeitung meiner Daten gemäß der [Datenschutzerklärung] zu.',
		'newsletter_text'             => 'Ja, ich möchte Markt-Updates per E-Mail erhalten.',
		'lead_retention_days'         => 0,
		'email_log_retention_days'    => 365,
		'anonymize_instead_of_delete' => false,
	];

	/**
	 * Allowed values for lead retention days.
	 *
	 * @var int[]
	 */
	private const LEAD_RETENTION_WHITELIST = [ 0, 90, 180, 365, 730 ];

	/**
	 * Allowed values for email log retention days.
	 *
	 * @var int[]
	 */
	private const EMAIL_LOG_RETENTION_WHITELIST = [ 0, 90, 180, 365 ];

	/**
	 * @inheritDoc
	 */
	public function registerRoutes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/admin/privacy-settings',
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
	 * GET /admin/privacy-settings — Get privacy settings.
	 */
	public function show(): \WP_REST_Response {
		return $this->success( self::get() );
	}

	/**
	 * PUT /admin/privacy-settings — Update privacy settings.
	 */
	public function update( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$params = $request->get_json_params();
		$errors = [];

		// Validate consent_text must contain placeholder.
		if ( isset( $params['consent_text'] ) && $params['consent_text'] !== '' ) {
			if ( strpos( $params['consent_text'], '[Datenschutzerklärung]' ) === false ) {
				$errors['consent_text'] = __( 'Der Einwilligungstext muss den Platzhalter [Datenschutzerklärung] enthalten.', 'resa' );
			}
		}

		// Validate lead retention days (whitelist).
		if ( isset( $params['lead_retention_days'] ) ) {
			$days = (int) $params['lead_retention_days'];
			if ( ! in_array( $days, self::LEAD_RETENTION_WHITELIST, true ) ) {
				$errors['lead_retention_days'] = __( 'Ungültiger Wert für die Lead-Aufbewahrungsfrist.', 'resa' );
			}
		}

		// Validate email log retention days (whitelist).
		if ( isset( $params['email_log_retention_days'] ) ) {
			$days = (int) $params['email_log_retention_days'];
			if ( ! in_array( $days, self::EMAIL_LOG_RETENTION_WHITELIST, true ) ) {
				$errors['email_log_retention_days'] = __( 'Ungültiger Wert für die E-Mail-Log-Aufbewahrungsfrist.', 'resa' );
			}
		}

		if ( ! empty( $errors ) ) {
			return $this->validationError( $errors );
		}

		// Merge with current settings.
		$current = self::get();
		$updated = [];

		// URL field.
		$updated['privacy_url'] = isset( $params['privacy_url'] )
			? esc_url_raw( $params['privacy_url'] )
			: $current['privacy_url'];

		// Text fields (sanitize with wp_kses).
		$allowed_html = [
			'a'      => [ 'href' => [], 'target' => [], 'rel' => [] ],
			'strong' => [],
			'em'     => [],
			'br'     => [],
		];

		$text_fields = [ 'consent_text', 'newsletter_text' ];
		foreach ( $text_fields as $key ) {
			$updated[ $key ] = isset( $params[ $key ] )
				? wp_kses( $params[ $key ], $allowed_html )
				: $current[ $key ];
		}

		// Integer fields.
		$updated['lead_retention_days'] = isset( $params['lead_retention_days'] )
			? (int) $params['lead_retention_days']
			: $current['lead_retention_days'];

		$updated['email_log_retention_days'] = isset( $params['email_log_retention_days'] )
			? (int) $params['email_log_retention_days']
			: $current['email_log_retention_days'];

		// Boolean fields.
		$updated['anonymize_instead_of_delete'] = isset( $params['anonymize_instead_of_delete'] )
			? (bool) $params['anonymize_instead_of_delete']
			: $current['anonymize_instead_of_delete'];

		update_option( self::OPTION_KEY, $updated );

		return $this->success( $updated );
	}

	/**
	 * Get merged privacy settings (stored + defaults).
	 *
	 * Also used by ResaShortcode and Privacy Tools.
	 *
	 * @return array<string, mixed>
	 */
	public static function get(): array {
		$stored = get_option( self::OPTION_KEY, [] );
		$stored = is_array( $stored ) ? $stored : [];

		return array_merge( self::DEFAULTS, $stored );
	}

	/**
	 * Get the privacy policy URL with WordPress fallback.
	 *
	 * @return string Privacy URL or empty string.
	 */
	public static function getPrivacyUrl(): string {
		$settings = self::get();
		$url      = $settings['privacy_url'];

		if ( $url !== '' ) {
			return $url;
		}

		// Fallback to WordPress privacy page.
		$wp_url = get_privacy_policy_url();

		return $wp_url !== '' ? $wp_url : '';
	}
}
