<?php

declare( strict_types=1 );

namespace Resa\Privacy;

use Resa\Models\Lead;
use Resa\Services\Email\EmailLogger;

/**
 * WordPress Personal Data Exporter for RESA leads.
 *
 * Registers with the WordPress privacy tools so admins can export
 * personal data per GDPR Art. 15 (Right of Access) and Art. 20
 * (Right to Data Portability).
 */
final class PersonalDataExporter {

	/**
	 * Register the exporter with WordPress.
	 */
	public static function register(): void {
		add_filter( 'wp_privacy_personal_data_exporters', [ self::class, 'addExporter' ] );
	}

	/**
	 * Add RESA exporter to the list of WordPress exporters.
	 *
	 * @param array<string, array<string, mixed>> $exporters Registered exporters.
	 * @return array<string, array<string, mixed>>
	 */
	public static function addExporter( array $exporters ): array {
		$exporters['resa-leads'] = [
			'exporter_friendly_name' => __( 'RESA Lead-Daten', 'resa' ),
			'callback'               => [ self::class, 'export' ],
		];

		return $exporters;
	}

	/**
	 * Export personal data for a given email address.
	 *
	 * @param string $email Email address to export data for.
	 * @param int    $page  Page number for pagination.
	 * @return array{data: array<int, array<string, mixed>>, done: bool}
	 */
	public static function export( string $email, int $page = 1 ): array {
		$email = sanitize_email( $email );

		if ( ! is_email( $email ) ) {
			return [
				'data' => [],
				'done' => true,
			];
		}

		$result = Lead::findByEmail( $email, $page );
		$export = [];

		foreach ( $result['items'] as $lead ) {
			$data = [];

			// Core contact data.
			$data[] = [
				'name'  => __( 'Vorname', 'resa' ),
				'value' => $lead->first_name ?? '',
			];
			$data[] = [
				'name'  => __( 'Nachname', 'resa' ),
				'value' => $lead->last_name ?? '',
			];
			$data[] = [
				'name'  => __( 'E-Mail', 'resa' ),
				'value' => $lead->email ?? '',
			];
			$data[] = [
				'name'  => __( 'Telefon', 'resa' ),
				'value' => $lead->phone ?? '',
			];
			$data[] = [
				'name'  => __( 'Unternehmen', 'resa' ),
				'value' => $lead->company ?? '',
			];
			$data[] = [
				'name'  => __( 'Anrede', 'resa' ),
				'value' => $lead->salutation ?? '',
			];
			$data[] = [
				'name'  => __( 'Nachricht', 'resa' ),
				'value' => $lead->message ?? '',
			];

			// Asset type and status.
			$data[] = [
				'name'  => __( 'Tool-Typ', 'resa' ),
				'value' => $lead->asset_type ?? '',
			];
			$data[] = [
				'name'  => __( 'Status', 'resa' ),
				'value' => $lead->status ?? '',
			];

			// Consent info.
			$data[] = [
				'name'  => __( 'Einwilligung erteilt', 'resa' ),
				'value' => ! empty( $lead->consent_given ) ? __( 'Ja', 'resa' ) : __( 'Nein', 'resa' ),
			];
			$data[] = [
				'name'  => __( 'Einwilligungstext', 'resa' ),
				'value' => $lead->consent_text ?? '',
			];
			$data[] = [
				'name'  => __( 'Einwilligungsdatum', 'resa' ),
				'value' => $lead->consent_date ?? '',
			];

			// Calculation inputs/results (JSON).
			$data[] = [
				'name'  => __( 'Berechnungseingaben', 'resa' ),
				'value' => self::formatJson( $lead->inputs ?? '' ),
			];
			$data[] = [
				'name'  => __( 'Berechnungsergebnis', 'resa' ),
				'value' => self::formatJson( $lead->result ?? '' ),
			];

			// Timestamps.
			$data[] = [
				'name'  => __( 'Erstellt am', 'resa' ),
				'value' => $lead->created_at ?? '',
			];

			// Email logs for this lead.
			$leadId   = (int) $lead->id;
			$logs     = EmailLogger::findByLead( $leadId );
			$logTexts = [];
			foreach ( $logs as $log ) {
				$logTexts[] = sprintf(
					'%s — %s (%s)',
					$log->sent_at ?? '',
					$log->subject ?? '',
					$log->status ?? ''
				);
			}
			if ( ! empty( $logTexts ) ) {
				$data[] = [
					'name'  => __( 'E-Mail-Protokoll', 'resa' ),
					'value' => implode( "\n", $logTexts ),
				];
			}

			$export[] = [
				'group_id'    => 'resa-leads',
				'group_label' => __( 'RESA Lead-Daten', 'resa' ),
				'item_id'     => 'resa-lead-' . $leadId,
				'data'        => $data,
			];
		}

		return [
			'data' => $export,
			'done' => $result['done'],
		];
	}

	/**
	 * Format JSON string for human-readable output.
	 *
	 * @param string $json JSON string.
	 * @return string Pretty-printed JSON or original string.
	 */
	private static function formatJson( string $json ): string {
		if ( $json === '' || $json === 'null' ) {
			return '';
		}

		$decoded = json_decode( $json, true );
		if ( json_last_error() !== JSON_ERROR_NONE ) {
			return $json;
		}

		$pretty = wp_json_encode( $decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE );

		return $pretty !== false ? $pretty : $json;
	}
}
