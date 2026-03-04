<?php

declare( strict_types=1 );

namespace Resa\Services\Email;

/**
 * Email logger — writes to resa_email_log table.
 *
 * Tracks sent emails with status, delivery info, and error messages.
 */
final class EmailLogger {

	/**
	 * Get the table name with WP prefix.
	 *
	 * @return string
	 */
	private static function table(): string {
		global $wpdb;
		return $wpdb->prefix . 'resa_email_log';
	}

	/**
	 * Log a sent email.
	 *
	 * @param int    $leadId     Lead ID.
	 * @param string $templateId Template identifier.
	 * @param string $recipient  Recipient email.
	 * @param string $subject    Email subject.
	 * @param string $status     Status: sent, failed.
	 * @param string $error      Error message (for failed status).
	 * @return int|false Inserted log ID or false.
	 */
	public static function log( int $leadId, string $templateId, string $recipient, string $subject, string $status = 'sent', string $error = '' ): int|false {
		global $wpdb;

		$errorMessage = $error !== '' ? $error : null;

		$result = $wpdb->insert(
			self::table(),
			[
				'lead_id'       => $leadId,
				'template_id'   => sanitize_text_field( $templateId ),
				'recipient'     => sanitize_email( $recipient ),
				'subject'       => sanitize_text_field( $subject ),
				'status'        => sanitize_text_field( $status ),
				'error_message' => $errorMessage,
				'sent_at'       => current_time( 'mysql' ),
			],
			[
				'%d',
				'%s',
				'%s',
				'%s',
				'%s',
				'%s',
				'%s',
			]
		);

		if ( $result === false ) {
			return false;
		}

		return (int) $wpdb->insert_id;
	}

	/**
	 * Update log entry status (e.g. after webhook: delivered, opened, clicked, bounced).
	 *
	 * @param int    $logId  Log entry ID.
	 * @param string $status New status.
	 * @param string $field  Optional timestamp field to set (opened_at, clicked_at).
	 * @return bool True on success.
	 */
	public static function updateStatus( int $logId, string $status, string $field = '' ): bool {
		global $wpdb;

		$data    = [ 'status' => sanitize_text_field( $status ) ];
		$formats = [ '%s' ];

		if ( $field === 'opened_at' || $field === 'clicked_at' ) {
			$data[ $field ] = current_time( 'mysql' );
			$formats[]      = '%s';
		}

		$result = $wpdb->update(
			self::table(),
			$data,
			[ 'id' => $logId ],
			$formats,
			[ '%d' ]
		);

		return $result !== false;
	}

	/**
	 * Find log entries for a lead.
	 *
	 * @param int $leadId Lead ID.
	 * @return array<int,object> Log entries.
	 */
	public static function findByLead( int $leadId ): array {
		global $wpdb;

		$table = self::table();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$results = $wpdb->get_results(
			$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				"SELECT * FROM {$table} WHERE lead_id = %d ORDER BY sent_at DESC",
				$leadId
			)
		);

		return is_array( $results ) ? $results : [];
	}

	/**
	 * Delete all log entries for a lead (cascade on lead delete).
	 *
	 * @param int $leadId Lead ID.
	 * @return int Number of deleted rows.
	 */
	public static function deleteByLead( int $leadId ): int {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$result = $wpdb->delete(
			self::table(),
			[ 'lead_id' => $leadId ],
			[ '%d' ]
		);

		return $result !== false ? $result : 0;
	}

	/**
	 * Delete log entries older than a given number of days.
	 *
	 * @param int $days    Number of days.
	 * @param int $limit   Max rows per batch (default 500).
	 * @return int Number of deleted rows.
	 */
	public static function deleteOlderThan( int $days, int $limit = 500 ): int {
		global $wpdb;

		$table = self::table();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$deleted = $wpdb->query(
			$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				"DELETE FROM {$table} WHERE sent_at < DATE_SUB(NOW(), INTERVAL %d DAY) LIMIT %d",
				$days,
				$limit
			)
		);

		return $deleted !== false ? (int) $deleted : 0;
	}

	/**
	 * Count emails by status.
	 *
	 * @param string $status Status filter.
	 * @return int Count.
	 */
	public static function countByStatus( string $status ): int {
		global $wpdb;

		$table = self::table();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		return (int) $wpdb->get_var(
			$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				"SELECT COUNT(*) FROM {$table} WHERE status = %s",
				$status
			)
		);
	}
}
