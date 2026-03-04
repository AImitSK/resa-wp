<?php

declare( strict_types=1 );

namespace Resa\Security;

/**
 * Central spam guard for public lead endpoints.
 *
 * Checks (in order, cheapest first):
 * 1. WordPress Nonce (CSRF protection)
 * 2. Honeypot field (must be empty)
 * 3. Time check (form submitted too fast = bot)
 * 4. Rate limiting (IP-based)
 *
 * All checks return the same generic error to prevent enumeration.
 */
final class SpamGuard {

	private const NONCE_ACTION   = 'resa_lead_submit';
	private const MIN_SECONDS    = 3;
	private const ERROR_CODE     = 'resa_spam_detected';

	/**
	 * Run all spam checks on a REST request.
	 *
	 * @param \WP_REST_Request $request The incoming request.
	 * @return \WP_Error|true True if OK, WP_Error if spam.
	 */
	public static function check( \WP_REST_Request $request ): \WP_Error|bool {
		// 1. Nonce.
		$nonce = $request->get_header( 'X-WP-Nonce' );
		if ( ! $nonce || ! wp_verify_nonce( $nonce, self::NONCE_ACTION ) ) {
			return self::reject();
		}

		// 2. Honeypot.
		$hp = $request->get_param( '_hp' );
		if ( $hp !== null && $hp !== '' ) {
			return self::reject();
		}

		// 3. Time check.
		$ts = $request->get_param( '_ts' );
		if ( $ts !== null ) {
			$ts = (int) $ts;
			if ( $ts > 0 && ( time() - $ts ) < self::MIN_SECONDS ) {
				return self::reject();
			}
		}

		// 4. Rate limiting.
		if ( ! RateLimiter::check() ) {
			return self::reject();
		}

		return true;
	}

	/**
	 * Create a nonce for public lead endpoints.
	 */
	public static function createNonce(): string {
		return wp_create_nonce( self::NONCE_ACTION );
	}

	/**
	 * Current server timestamp for time check.
	 */
	public static function timestamp(): int {
		return time();
	}

	/**
	 * Generic rejection — never reveals which check failed.
	 */
	private static function reject(): \WP_Error {
		return new \WP_Error(
			self::ERROR_CODE,
			__( 'Anfrage konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut.', 'resa' ),
			[ 'status' => 403 ]
		);
	}
}
