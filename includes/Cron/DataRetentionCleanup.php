<?php

declare( strict_types=1 );

namespace Resa\Cron;

use Resa\Api\PrivacySettingsController;
use Resa\Models\Lead;
use Resa\Services\Email\EmailLogger;

/**
 * WP-Cron job to enforce data retention policies.
 *
 * Deletes or anonymizes completed leads and email logs older than
 * the configured retention period. Runs daily.
 *
 * Respects the `anonymize_instead_of_delete` privacy setting.
 */
final class DataRetentionCleanup {

	private const HOOK       = 'resa_data_retention_cleanup';
	private const BATCH_SIZE = 500;

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
	 * Run retention cleanup for leads and email logs.
	 */
	public static function cleanup(): void {
		$settings = PrivacySettingsController::get();

		// Lead retention.
		$leadDays = (int) $settings['lead_retention_days'];
		if ( $leadDays > 0 ) {
			$anonymize = (bool) $settings['anonymize_instead_of_delete'];
			self::cleanupLeads( $leadDays, $anonymize );
		}

		// Email log retention.
		$emailDays = (int) $settings['email_log_retention_days'];
		if ( $emailDays > 0 ) {
			EmailLogger::deleteOlderThan( $emailDays, self::BATCH_SIZE );
		}
	}

	/**
	 * Delete or anonymize leads older than the retention period.
	 *
	 * @param int  $days      Number of days.
	 * @param bool $anonymize True to anonymize instead of delete.
	 */
	private static function cleanupLeads( int $days, bool $anonymize ): void {
		global $wpdb;

		$table = $wpdb->prefix . 'resa_leads';

		// Find leads with completed_at older than retention period.
		// Exclude partial (handled by PartialLeadCleanup) and already anonymized.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$leads = $wpdb->get_results(
			$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				"SELECT id FROM {$table}
				WHERE completed_at IS NOT NULL
				AND completed_at < DATE_SUB(NOW(), INTERVAL %d DAY)
				AND status NOT IN ('partial', 'anonymized')
				LIMIT %d",
				$days,
				self::BATCH_SIZE
			)
		);

		if ( empty( $leads ) ) {
			return;
		}

		foreach ( $leads as $lead ) {
			$id = (int) $lead->id;

			if ( $anonymize ) {
				Lead::anonymize( $id );
			} else {
				Lead::delete( $id );
			}
		}
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
