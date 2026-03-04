<?php

declare( strict_types=1 );

namespace Resa\Services\Auth;

use Resa\Models\ApiKey;

/**
 * API key authentication for external REST endpoints.
 *
 * Validates Bearer tokens on /resa/v1/external/* routes.
 * Keys are verified by SHA-256 hash lookup.
 */
final class ApiKeyAuth {

	/**
	 * Whether the current request is authenticated via API key.
	 */
	private static bool $authenticated = false;

	/**
	 * The authenticated API key ID (for touchLastUsed).
	 */
	private static ?int $keyId = null;

	/**
	 * Register the authentication filter.
	 */
	public static function register(): void {
		add_filter( 'rest_authentication_errors', [ self::class, 'authenticate' ], 90 );
	}

	/**
	 * Authenticate requests to /resa/v1/external/* via Bearer token.
	 *
	 * @param \WP_Error|null|bool $result Existing auth result.
	 * @return \WP_Error|null|bool
	 */
	public static function authenticate( mixed $result ) {
		// Don't override an existing error.
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		// Only process /resa/v1/external/ routes.
		$requestUri = isset( $_SERVER['REQUEST_URI'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
		if ( strpos( $requestUri, '/resa/v1/external/' ) === false ) {
			return $result;
		}

		$token = self::extractBearerToken();

		// No token provided — don't set an error yet.
		// The permission_callback will handle 401.
		if ( $token === null ) {
			return $result;
		}

		// Validate token format: resa_ + 64 hex chars = 69 chars.
		if ( strlen( $token ) !== 69 || strpos( $token, 'resa_' ) !== 0 ) {
			return new \WP_Error(
				'resa_invalid_api_key',
				__( 'Ungültiges API-Key-Format.', 'resa' ),
				[ 'status' => 401 ]
			);
		}

		// Hash lookup.
		$apiKey = ApiKey::findByKey( $token );

		if ( $apiKey === null ) {
			return new \WP_Error(
				'resa_invalid_api_key',
				__( 'Ungültiger oder deaktivierter API-Schlüssel.', 'resa' ),
				[ 'status' => 401 ]
			);
		}

		// Mark as authenticated and track usage.
		self::$authenticated = true;
		self::$keyId         = (int) $apiKey->id;
		ApiKey::touchLastUsed( self::$keyId );

		return true;
	}

	/**
	 * Whether the current request is authenticated via API key.
	 */
	public static function isAuthenticated(): bool {
		return self::$authenticated;
	}

	/**
	 * Extract the Bearer token from the Authorization header.
	 *
	 * Supports Apache, nginx, and CGI/FastCGI setups.
	 *
	 * @return string|null Bearer token or null.
	 */
	private static function extractBearerToken(): ?string {
		$header = self::getAuthorizationHeader();

		if ( $header === null ) {
			return null;
		}

		if ( preg_match( '/^Bearer\s+(.+)$/i', $header, $matches ) ) {
			return trim( $matches[1] );
		}

		return null;
	}

	/**
	 * Get the Authorization header from various server environments.
	 *
	 * @return string|null Header value or null.
	 */
	private static function getAuthorizationHeader(): ?string {
		// Standard: most servers set this.
		if ( ! empty( $_SERVER['HTTP_AUTHORIZATION'] ) ) {
			return sanitize_text_field( wp_unslash( $_SERVER['HTTP_AUTHORIZATION'] ) );
		}

		// Apache with mod_rewrite.
		if ( ! empty( $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ) ) {
			return sanitize_text_field( wp_unslash( $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ) );
		}

		// Apache — fallback via apache_request_headers().
		if ( function_exists( 'apache_request_headers' ) ) {
			$headers = apache_request_headers();
			if ( is_array( $headers ) ) {
				// Header names are case-insensitive.
				foreach ( $headers as $key => $value ) {
					if ( strtolower( $key ) === 'authorization' ) {
						return sanitize_text_field( $value );
					}
				}
			}
		}

		return null;
	}
}
