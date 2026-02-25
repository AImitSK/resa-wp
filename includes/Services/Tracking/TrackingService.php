<?php

declare( strict_types=1 );

namespace Resa\Services\Tracking;

/**
 * Tracking service — records funnel events and aggregates daily statistics.
 *
 * Event types:
 *  - asset_view     (Impression)
 *  - asset_start    (User initiates calculator)
 *  - step_complete  (Quiz step completed)
 *  - form_view      (Form section visible — secondary conversion)
 *  - form_submit    (Form submitted — primary conversion)
 *  - result_view    (Results displayed)
 *
 * Events are aggregated into resa_tracking_daily for dashboard analytics.
 */
final class TrackingService {

	/**
	 * Valid event types and their corresponding daily counter columns.
	 *
	 * @var array<string,string>
	 */
	private const EVENT_COLUMN_MAP = [
		'asset_view'  => 'views',
		'asset_start' => 'starts',
		'form_view'   => 'form_views',
		'form_submit' => 'form_submits',
		'result_view' => 'result_views',
	];

	/**
	 * All valid event types (including those not aggregated into daily stats).
	 *
	 * @var array<int,string>
	 */
	private const VALID_EVENTS = [
		'asset_view',
		'asset_start',
		'step_complete',
		'step_back',
		'form_view',
		'form_interact',
		'form_submit',
		'result_view',
	];

	/**
	 * Get the daily tracking table name.
	 *
	 * @return string
	 */
	private static function table(): string {
		global $wpdb;
		return $wpdb->prefix . 'resa_tracking_daily';
	}

	/**
	 * Record a funnel event.
	 *
	 * Increments the corresponding counter in resa_tracking_daily
	 * and recalculates rates.
	 *
	 * @param string $event      Event type (e.g. 'asset_view').
	 * @param string $assetType  Asset/module type (e.g. 'mietpreis').
	 * @param int    $locationId Location ID (0 for global).
	 * @return bool True on success.
	 */
	public static function record( string $event, string $assetType, int $locationId = 0 ): bool {
		if ( ! self::isValidEvent( $event ) ) {
			return false;
		}

		// Only aggregate events that map to daily columns.
		$column = self::EVENT_COLUMN_MAP[ $event ] ?? null;
		if ( $column === null ) {
			// Valid event but not aggregated (e.g. step_complete) — fire action only.
			/**
			 * Fires when a tracking event is recorded.
			 *
			 * @param string $event      Event type.
			 * @param string $assetType  Asset type.
			 * @param int    $locationId Location ID.
			 */
			do_action( 'resa_tracking_event', $event, $assetType, $locationId );
			return true;
		}

		$today      = current_time( 'Y-m-d' );
		$locationDb = $locationId > 0 ? $locationId : null;

		// Upsert: insert or increment existing row.
		$existing = self::findDailyRow( $today, $assetType, $locationDb );

		if ( $existing !== null ) {
			$success = self::incrementColumn( (int) $existing->id, $column );
		} else {
			$success = self::createDailyRow( $today, $assetType, $locationDb, $column );
		}

		if ( $success ) {
			/** This action is documented above. */
			do_action( 'resa_tracking_event', $event, $assetType, $locationId );
		}

		return $success;
	}

	/**
	 * Check whether an event type is valid.
	 *
	 * @param string $event Event type.
	 * @return bool
	 */
	public static function isValidEvent( string $event ): bool {
		return in_array( $event, self::VALID_EVENTS, true );
	}

	/**
	 * Get funnel data for a date range.
	 *
	 * @param string   $dateFrom  Start date (Y-m-d).
	 * @param string   $dateTo    End date (Y-m-d).
	 * @param string   $assetType Filter by asset type (empty = all).
	 * @param int|null $locationId Filter by location (null = all).
	 * @return array<string,int|float> Aggregated funnel data.
	 */
	public static function getFunnelData( string $dateFrom, string $dateTo, string $assetType = '', ?int $locationId = null ): array {
		global $wpdb;

		$table = self::table();
		$where = [ '1=1' ];
		$args  = [];

		$where[] = 'date >= %s';
		$args[]  = $dateFrom;

		$where[] = 'date <= %s';
		$args[]  = $dateTo;

		if ( $assetType !== '' ) {
			$where[] = 'asset_type = %s';
			$args[]  = $assetType;
		}

		if ( $locationId !== null ) {
			$where[] = 'location_id = %d';
			$args[]  = $locationId;
		}

		$whereClause = implode( ' AND ', $where );

		// phpcs:disable WordPress.DB.DirectDatabaseQuery,WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare
		$row = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT
					COALESCE(SUM(views), 0) AS views,
					COALESCE(SUM(starts), 0) AS starts,
					COALESCE(SUM(form_views), 0) AS form_views,
					COALESCE(SUM(form_submits), 0) AS form_submits,
					COALESCE(SUM(result_views), 0) AS result_views
				FROM {$table}
				WHERE {$whereClause}",
				...$args
			)
		);
		// phpcs:enable

		if ( $row === null ) {
			return self::emptyFunnel();
		}

		$views       = (int) $row->views;
		$starts      = (int) $row->starts;
		$formViews   = (int) $row->form_views;
		$formSubmits = (int) $row->form_submits;

		return [
			'views'           => $views,
			'starts'          => $starts,
			'form_views'      => $formViews,
			'form_submits'    => $formSubmits,
			'result_views'    => (int) $row->result_views,
			'start_rate'      => $views > 0 ? round( ( $starts / $views ) * 100, 2 ) : 0.0,
			'completion_rate' => $starts > 0 ? round( ( $formViews / $starts ) * 100, 2 ) : 0.0,
			'conversion_rate' => $formViews > 0 ? round( ( $formSubmits / $formViews ) * 100, 2 ) : 0.0,
		];
	}

	/**
	 * Get daily breakdown for a date range.
	 *
	 * @param string $dateFrom  Start date (Y-m-d).
	 * @param string $dateTo    End date (Y-m-d).
	 * @param string $assetType Filter by asset type (empty = all).
	 * @return array<int,object> Daily rows.
	 */
	public static function getDailyBreakdown( string $dateFrom, string $dateTo, string $assetType = '' ): array {
		global $wpdb;

		$table = self::table();

		if ( $assetType !== '' ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
			$results = $wpdb->get_results(
				$wpdb->prepare(
					// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
					"SELECT * FROM {$table} WHERE date >= %s AND date <= %s AND asset_type = %s ORDER BY date ASC",
					$dateFrom,
					$dateTo,
					$assetType
				)
			);
		} else {
			// phpcs:disable WordPress.DB.DirectDatabaseQuery,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$results = $wpdb->get_results(
				$wpdb->prepare(
					"SELECT date,
						SUM(views) AS views,
						SUM(starts) AS starts,
						SUM(form_views) AS form_views,
						SUM(form_submits) AS form_submits,
						SUM(result_views) AS result_views
					FROM {$table}
					WHERE date >= %s AND date <= %s
					GROUP BY date
					ORDER BY date ASC",
					$dateFrom,
					$dateTo
				)
			);
			// phpcs:enable
		}

		return is_array( $results ) ? $results : [];
	}

	/**
	 * Recalculate rates for a daily row.
	 *
	 * @param int $rowId Row ID.
	 * @return bool True on success.
	 */
	public static function recalculateRates( int $rowId ): bool {
		global $wpdb;

		$table = self::table();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$row = $wpdb->get_row(
			$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				"SELECT views, starts, form_views, form_submits FROM {$table} WHERE id = %d",
				$rowId
			)
		);

		if ( $row === null ) {
			return false;
		}

		$views       = (int) $row->views;
		$starts      = (int) $row->starts;
		$formViews   = (int) $row->form_views;
		$formSubmits = (int) $row->form_submits;

		$startRate      = $views > 0 ? round( ( $starts / $views ) * 100, 2 ) : null;
		$completionRate = $starts > 0 ? round( ( $formViews / $starts ) * 100, 2 ) : null;
		$conversionRate = $formViews > 0 ? round( ( $formSubmits / $formViews ) * 100, 2 ) : null;

		$result = $wpdb->update(
			$table,
			[
				'start_rate'      => $startRate,
				'completion_rate' => $completionRate,
				'conversion_rate' => $conversionRate,
			],
			[ 'id' => $rowId ],
			[ '%f', '%f', '%f' ],
			[ '%d' ]
		);

		return $result !== false;
	}

	/**
	 * Find an existing daily row.
	 *
	 * @param string   $date      Date (Y-m-d).
	 * @param string   $assetType Asset type.
	 * @param int|null $locationId Location ID (null = global).
	 * @return object|null Row or null.
	 */
	private static function findDailyRow( string $date, string $assetType, ?int $locationId ): ?object {
		global $wpdb;

		$table = self::table();

		if ( $locationId === null ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
			return $wpdb->get_row(
				$wpdb->prepare(
					// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
					"SELECT * FROM {$table} WHERE date = %s AND asset_type = %s AND location_id IS NULL LIMIT 1",
					$date,
					$assetType
				)
			);
		}

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		return $wpdb->get_row(
			$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				"SELECT * FROM {$table} WHERE date = %s AND asset_type = %s AND location_id = %d LIMIT 1",
				$date,
				$assetType,
				$locationId
			)
		);
	}

	/**
	 * Create a new daily row with an initial counter.
	 *
	 * @param string   $date      Date (Y-m-d).
	 * @param string   $assetType Asset type.
	 * @param int|null $locationId Location ID.
	 * @param string   $column    Column to set to 1.
	 * @return bool True on success.
	 */
	private static function createDailyRow( string $date, string $assetType, ?int $locationId, string $column ): bool {
		global $wpdb;

		$data = [
			'date'       => $date,
			'asset_type' => sanitize_text_field( $assetType ),
			$column      => 1,
		];

		$formats = [ '%s', '%s', '%d' ];

		if ( $locationId !== null ) {
			$data['location_id'] = $locationId;
			$formats[]           = '%d';
		}

		$result = $wpdb->insert( self::table(), $data, $formats );

		return $result !== false;
	}

	/**
	 * Increment a counter column on an existing row.
	 *
	 * @param int    $rowId  Row ID.
	 * @param string $column Column name to increment.
	 * @return bool True on success.
	 */
	private static function incrementColumn( int $rowId, string $column ): bool {
		global $wpdb;

		$table = self::table();

		// Allowlist column names to prevent SQL injection.
		$allowed = array_values( self::EVENT_COLUMN_MAP );
		if ( ! in_array( $column, $allowed, true ) ) {
			return false;
		}

		// phpcs:disable WordPress.DB.DirectDatabaseQuery,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$result = $wpdb->query(
			$wpdb->prepare(
				"UPDATE {$table} SET {$column} = {$column} + 1 WHERE id = %d",
				$rowId
			)
		);
		// phpcs:enable

		if ( $result !== false ) {
			self::recalculateRates( $rowId );
		}

		return $result !== false;
	}

	/**
	 * Return an empty funnel data array.
	 *
	 * @return array<string,int|float>
	 */
	private static function emptyFunnel(): array {
		return [
			'views'           => 0,
			'starts'          => 0,
			'form_views'      => 0,
			'form_submits'    => 0,
			'result_views'    => 0,
			'start_rate'      => 0.0,
			'completion_rate' => 0.0,
			'conversion_rate' => 0.0,
		];
	}
}
