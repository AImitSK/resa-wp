<?php
/**
 * Central registry for error messages.
 *
 * All user-facing error messages in one place for
 * consistency and easy translation management.
 *
 * @package Resa\Core
 */

declare( strict_types=1 );

namespace Resa\Core;

/**
 * Central registry for error messages.
 */
final class ErrorMessages {

	// Error Codes.
	public const NOT_FOUND              = 'resa_not_found';
	public const VALIDATION             = 'resa_validation_error';
	public const LEAD_CREATE_FAILED     = 'resa_lead_create_failed';
	public const LEAD_COMPLETE_FAILED   = 'resa_lead_complete_failed';
	public const LEAD_ALREADY_COMPLETED = 'resa_lead_already_completed';
	public const LEAD_NOT_FOUND         = 'resa_lead_not_found';
	public const MODULE_NOT_FOUND       = 'resa_module_not_found';
	public const SETTINGS_SAVE_FAILED   = 'resa_save_failed';
	public const INVALID_EMAIL          = 'resa_invalid_email';
	public const CONSENT_REQUIRED       = 'resa_consent_required';
	public const FIELD_REQUIRED         = 'resa_field_required';
	public const UNAUTHORIZED           = 'resa_unauthorized';
	public const WEBHOOK_NOT_FOUND     = 'resa_webhook_not_found';
	public const WEBHOOK_LIMIT         = 'resa_webhook_limit';
	public const WEBHOOK_INVALID_URL   = 'resa_webhook_invalid_url';

	/**
	 * Get error message by code.
	 *
	 * @param string $code Error code constant.
	 * @return string Translated error message.
	 */
	public static function get( string $code ): string {
		return match ( $code ) {
			self::NOT_FOUND              => __( 'Ressource nicht gefunden.', 'resa' ),
			self::VALIDATION             => __( 'Validierungsfehler.', 'resa' ),
			self::LEAD_CREATE_FAILED     => __( 'Lead konnte nicht erstellt werden.', 'resa' ),
			self::LEAD_COMPLETE_FAILED   => __( 'Lead konnte nicht abgeschlossen werden.', 'resa' ),
			self::LEAD_ALREADY_COMPLETED => __( 'Dieser Lead wurde bereits abgeschlossen.', 'resa' ),
			self::LEAD_NOT_FOUND         => __( 'Kein passender Lead für diese Session gefunden.', 'resa' ),
			self::MODULE_NOT_FOUND       => __( 'Das Modul konnte nicht gefunden werden.', 'resa' ),
			self::SETTINGS_SAVE_FAILED   => __( 'Einstellungen konnten nicht gespeichert werden.', 'resa' ),
			self::INVALID_EMAIL          => __( 'Bitte geben Sie eine gültige E-Mail-Adresse ein.', 'resa' ),
			self::CONSENT_REQUIRED       => __( 'Die Datenschutz-Einwilligung ist erforderlich.', 'resa' ),
			self::FIELD_REQUIRED         => __( 'Dieses Feld ist erforderlich.', 'resa' ),
			self::UNAUTHORIZED           => __( 'Sie haben keine Berechtigung für diese Aktion.', 'resa' ),
			self::WEBHOOK_NOT_FOUND     => __( 'Webhook nicht gefunden.', 'resa' ),
			self::WEBHOOK_LIMIT         => __( 'Maximal 5 Webhooks erlaubt.', 'resa' ),
			self::WEBHOOK_INVALID_URL   => __( 'Bitte geben Sie eine gültige URL ein.', 'resa' ),
			default                      => __( 'Ein Fehler ist aufgetreten.', 'resa' ),
		};
	}

	/**
	 * Get parametrized error message.
	 *
	 * @param string $code  Error code.
	 * @param string $param Dynamic parameter value.
	 * @return string Translated error message with parameter.
	 */
	public static function getWithParam( string $code, string $param ): string {
		return match ( $code ) {
			'module_not_found' => sprintf(
				/* translators: %s: Module slug */
				__( 'Modul "%s" nicht gefunden.', 'resa' ),
				$param
			),
			'field_required'   => sprintf(
				/* translators: %s: Field name */
				__( '%s ist erforderlich.', 'resa' ),
				$param
			),
			'invalid_value'    => sprintf(
				/* translators: %s: Field name */
				__( 'Ungültiger Wert für %s.', 'resa' ),
				$param
			),
			default            => self::get( $code ),
		};
	}
}
