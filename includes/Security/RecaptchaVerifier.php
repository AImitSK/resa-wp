<?php

declare( strict_types=1 );

namespace Resa\Security;

use Resa\Api\RecaptchaSettingsController;

/**
 * Google reCAPTCHA v3 token verifier.
 *
 * Validates a reCAPTCHA token against the Google API.
 * Implements fail-open: if the Google API is unreachable, the check passes.
 */
final class RecaptchaVerifier {

	private const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

	/**
	 * Verify a reCAPTCHA v3 token.
	 *
	 * @param string $token The reCAPTCHA response token from the frontend.
	 * @return bool True if token is valid and score meets threshold, or on API error (fail-open).
	 */
	public static function verify( string $token ): bool {
		if ( $token === '' ) {
			return false;
		}

		$settings  = RecaptchaSettingsController::get();
		$secretKey = $settings['secret_key'];

		if ( $secretKey === '' ) {
			return true;
		}

		$response = wp_remote_post(
			self::VERIFY_URL,
			[
				'timeout' => 5,
				'body'    => [
					'secret'   => $secretKey,
					'response' => $token,
					'remoteip' => self::getClientIp(),
				],
			]
		);

		// Fail-open: if Google API is unreachable, let the request through.
		if ( is_wp_error( $response ) ) {
			return true;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( ! is_array( $body ) ) {
			return true;
		}

		if ( empty( $body['success'] ) ) {
			return false;
		}

		$score     = (float) ( $body['score'] ?? 0.0 );
		$threshold = (float) $settings['threshold'];

		return $score >= $threshold;
	}

	/**
	 * Get the client IP address, respecting X-Forwarded-For behind proxies.
	 */
	private static function getClientIp(): string {
		if ( ! empty( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) {
			$ips = explode( ',', sanitize_text_field( wp_unslash( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) );
			return trim( $ips[0] );
		}

		return sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1' ) );
	}
}
