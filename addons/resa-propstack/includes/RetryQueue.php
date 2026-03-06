<?php
/**
 * Propstack Retry Queue
 *
 * Handles automatic retry of failed lead syncs via WP-Cron.
 *
 * @package Resa\Propstack
 */

namespace Resa\Propstack;

/**
 * Retry queue for failed Propstack syncs
 */
class RetryQueue {
	/**
	 * Maximum retry attempts per lead
	 */
	private const MAX_RETRIES = 3;

	/**
	 * Number of leads to process per cron run
	 */
	private const BATCH_SIZE = 10;

	/**
	 * Retry intervals in seconds (exponential backoff)
	 * 15 minutes, 1 hour, 4 hours
	 */
	private const RETRY_INTERVALS = [900, 3600, 14400];

	/**
	 * Meta key for retry count
	 */
	private const RETRY_META_KEY = '_propstack_retry_count';

	/**
	 * Meta key for last retry timestamp
	 */
	private const RETRY_TIME_KEY = '_propstack_last_retry';

	/**
	 * Cron hook name
	 */
	public const CRON_HOOK = 'resa_propstack_retry_queue';

	/**
	 * Register WP-Cron hook and schedule
	 *
	 * @return void
	 */
	public static function register(): void {
		// Add custom cron interval (15 minutes)
		add_filter('cron_schedules', [self::class, 'addCronInterval']);

		// Register cron action
		add_action(self::CRON_HOOK, [self::class, 'processQueue']);

		// Schedule cron if not already scheduled
		if (!wp_next_scheduled(self::CRON_HOOK)) {
			wp_schedule_event(time(), 'fifteen_minutes', self::CRON_HOOK);
		}
	}

	/**
	 * Unregister cron on plugin deactivation
	 *
	 * @return void
	 */
	public static function unregister(): void {
		$timestamp = wp_next_scheduled(self::CRON_HOOK);
		if ($timestamp) {
			wp_unschedule_event($timestamp, self::CRON_HOOK);
		}
	}

	/**
	 * Add 15-minute cron interval
	 *
	 * @param array $schedules Existing schedules.
	 * @return array Modified schedules.
	 */
	public static function addCronInterval(array $schedules): array {
		$schedules['fifteen_minutes'] = [
			'interval' => 900,
			'display'  => __('Alle 15 Minuten', 'resa-propstack'),
		];
		return $schedules;
	}

	/**
	 * Process the retry queue (called by WP-Cron)
	 *
	 * @return void
	 */
	public static function processQueue(): void {
		// Check if integration is enabled
		if (!PropstackSettings::isEnabled()) {
			return;
		}

		global $wpdb;
		$table = $wpdb->prefix . 'resa_leads';

		// Build exclusion clause for permanent errors
		$permanentErrors = PropstackSync::getPermanentErrors();
		$excludeClauses = [];
		foreach ($permanentErrors as $error) {
			$excludeClauses[] = $wpdb->prepare('propstack_error != %s', $error);
		}
		$excludeClause = !empty($excludeClauses) ? implode(' AND ', $excludeClauses) : '1=1';

		// Get leads with failed sync, valid consent, excluding permanent errors
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$leads = $wpdb->get_results(
			"SELECT * FROM {$table}
			 WHERE propstack_synced = 0
			   AND propstack_error IS NOT NULL
			   AND consent_given = 1
			   AND {$excludeClause}
			 ORDER BY updated_at ASC
			 LIMIT " . self::BATCH_SIZE
		);

		if (empty($leads)) {
			return;
		}

		$sync = new PropstackSync();
		$processed = 0;

		foreach ($leads as $lead) {
			$retryCount = self::getRetryCount($lead->id);

			// Skip if max retries reached
			if ($retryCount >= self::MAX_RETRIES) {
				continue;
			}

			// Check exponential backoff timing
			$lastRetry = self::getLastRetryTime($lead->id);
			$waitTime = self::RETRY_INTERVALS[$retryCount] ?? self::RETRY_INTERVALS[2];

			if ($lastRetry && (time() - $lastRetry) < $waitTime) {
				continue; // Not time for retry yet
			}

			// Increment retry count and timestamp
			self::incrementRetryCount($lead->id);

			// Attempt sync
			$sync->retrySync($lead->id);
			$processed++;

			error_log(sprintf(
				'[RESA Propstack] Retry queue: Processed lead #%d (attempt %d/%d)',
				$lead->id,
				$retryCount + 1,
				self::MAX_RETRIES
			));
		}

		if ($processed > 0) {
			error_log(sprintf(
				'[RESA Propstack] Retry queue: Processed %d leads',
				$processed
			));
		}
	}

	/**
	 * Get retry count for a lead
	 *
	 * @param int $leadId Lead ID.
	 * @return int Retry count.
	 */
	public static function getRetryCount(int $leadId): int {
		return (int) get_option(self::RETRY_META_KEY . '_' . $leadId, 0);
	}

	/**
	 * Get last retry timestamp for a lead
	 *
	 * @param int $leadId Lead ID.
	 * @return int|null Unix timestamp or null.
	 */
	public static function getLastRetryTime(int $leadId): ?int {
		$time = get_option(self::RETRY_TIME_KEY . '_' . $leadId, null);
		return $time ? (int) $time : null;
	}

	/**
	 * Increment retry count for a lead
	 *
	 * @param int $leadId Lead ID.
	 * @return void
	 */
	private static function incrementRetryCount(int $leadId): void {
		$count = self::getRetryCount($leadId);
		update_option(self::RETRY_META_KEY . '_' . $leadId, $count + 1, false);
		update_option(self::RETRY_TIME_KEY . '_' . $leadId, time(), false);
	}

	/**
	 * Reset retry count for a lead (called on successful sync)
	 *
	 * @param int $leadId Lead ID.
	 * @return void
	 */
	public static function resetRetryCount(int $leadId): void {
		delete_option(self::RETRY_META_KEY . '_' . $leadId);
		delete_option(self::RETRY_TIME_KEY . '_' . $leadId);
	}

	/**
	 * Get retry status for a lead
	 *
	 * @param int $leadId Lead ID.
	 * @return array{attempts: int, max_attempts: int, exhausted: bool, next_retry: int|null}
	 */
	public static function getRetryStatus(int $leadId): array {
		$count = self::getRetryCount($leadId);
		$lastRetry = self::getLastRetryTime($leadId);
		$nextRetry = null;

		if ($count < self::MAX_RETRIES && $lastRetry) {
			$waitTime = self::RETRY_INTERVALS[$count] ?? self::RETRY_INTERVALS[2];
			$nextRetry = $lastRetry + $waitTime;
		}

		return [
			'attempts'     => $count,
			'max_attempts' => self::MAX_RETRIES,
			'exhausted'    => $count >= self::MAX_RETRIES,
			'next_retry'   => $nextRetry,
		];
	}

	/**
	 * Get count of leads pending retry
	 *
	 * @return int Number of leads in retry queue.
	 */
	public static function getPendingCount(): int {
		global $wpdb;
		$table = $wpdb->prefix . 'resa_leads';

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
		$count = $wpdb->get_var(
			"SELECT COUNT(*) FROM {$table}
			 WHERE propstack_synced = 0
			   AND propstack_error IS NOT NULL
			   AND consent_given = 1"
		);

		return (int) $count;
	}

	/**
	 * Retry all failed syncs immediately (admin action)
	 *
	 * @return array{processed: int, failed: int} Results.
	 */
	public static function retryAll(): array {
		if (!PropstackSettings::isEnabled()) {
			return ['processed' => 0, 'failed' => 0];
		}

		global $wpdb;
		$table = $wpdb->prefix . 'resa_leads';

		// Build exclusion clause for permanent errors
		$permanentErrors = PropstackSync::getPermanentErrors();
		$excludeClauses = [];
		foreach ($permanentErrors as $error) {
			$excludeClauses[] = $wpdb->prepare('propstack_error != %s', $error);
		}
		$excludeClause = !empty($excludeClauses) ? implode(' AND ', $excludeClauses) : '1=1';

		// Get all failed leads with consent
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$leads = $wpdb->get_results(
			"SELECT id FROM {$table}
			 WHERE propstack_synced = 0
			   AND propstack_error IS NOT NULL
			   AND consent_given = 1
			   AND {$excludeClause}"
		);

		if (empty($leads)) {
			return ['processed' => 0, 'failed' => 0];
		}

		$sync = new PropstackSync();
		$processed = 0;
		$failed = 0;

		foreach ($leads as $lead) {
			// Reset retry count for fresh attempt
			self::resetRetryCount($lead->id);

			// Attempt sync
			$result = $sync->retrySync($lead->id);

			if ($result) {
				$processed++;
			} else {
				$failed++;
			}
		}

		error_log(sprintf(
			'[RESA Propstack] Retry all: Processed %d, failed %d',
			$processed,
			$failed
		));

		return ['processed' => $processed, 'failed' => $failed];
	}
}
