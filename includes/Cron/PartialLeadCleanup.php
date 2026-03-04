<?php

declare( strict_types=1 );

namespace Resa\Cron;

/**
 * WP-Cron job to clean up expired partial leads.
 *
 * Partial leads (status = 'partial') are created during Two-Phase
 * Lead Capture and have an `expires_at` timestamp. This cron job
 * deletes rows where expires_at has passed.
 *
 * Scheduled daily via `wp_schedule_event`.
 */
final class PartialLeadCleanup {

	private const HOOK = 'resa_partial_lead_cleanup';

	/**
	 * Register the cron hook and schedule if not yet scheduled.
	 */
	public static function register(): void {
		add_action( self::HOOK, [ self::class, 'cleanup' ] );

		if ( ! wp_next_scheduled( self::HOOK ) ) {
			wp_schedule_event( time(), 'daily', self::HOOK );
		}
	}

	/**
	 * Delete expired partial leads from the database.
	 */
	public static function cleanup(): void {
		global $wpdb;

		$table = $wpdb->prefix . 'resa_leads';

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$wpdb->query(
			$wpdb->prepare(
				"DELETE FROM `{$table}` WHERE status = %s AND expires_at IS NOT NULL AND expires_at < %s",
				'partial',
				current_time( 'mysql', true )
			)
		);
	}

	/**
	 * Unschedule the cron job (used on plugin deactivation).
	 */
	public static function unschedule(): void {
		$timestamp = wp_next_scheduled( self::HOOK );
		if ( $timestamp ) {
			wp_unschedule_event( $timestamp, self::HOOK );
		}
	}
}
