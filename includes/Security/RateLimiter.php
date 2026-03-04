<?php

declare( strict_types=1 );

namespace Resa\Security;

/**
 * IP-based rate limiting via WordPress Transients.
 *
 * Limits: 5 requests/minute, 20 requests/hour per IP.
 * Uses Transients so it benefits from Object Cache (Redis/Memcached)
 * when available, and falls back to wp_options otherwise.
 */
final class RateLimiter {

	private const MINUTE_LIMIT = 5;
	private const HOUR_LIMIT   = 20;

	/**
	 * Check and increment the counter for the current IP.
	 *
	 * @return bool True if within limits, false if rate-limited.
	 */
	public static function check(): bool {
		$ip  = self::getClientIp();
		$key = 'resa_rl_' . md5( $ip );

		// Minute counter (60s TTL).
		$minuteKey   = $key . '_m';
		$minuteCount = (int) get_transient( $minuteKey );
		if ( $minuteCount >= self::MINUTE_LIMIT ) {
			return false;
		}

		// Hour counter (3600s TTL).
		$hourKey   = $key . '_h';
		$hourCount = (int) get_transient( $hourKey );
		if ( $hourCount >= self::HOUR_LIMIT ) {
			return false;
		}

		// Increment counters.
		set_transient( $minuteKey, $minuteCount + 1, 60 );
		set_transient( $hourKey, $hourCount + 1, 3600 );

		return true;
	}

	/**
	 * Get the client IP address (respects reverse proxy).
	 */
	private static function getClientIp(): string {
		if ( ! empty( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) {
			$ips = explode( ',', sanitize_text_field( wp_unslash( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) );
			return trim( $ips[0] );
		}

		return sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0' ) );
	}
}
