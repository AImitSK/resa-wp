<?php

declare( strict_types=1 );

namespace Resa\Privacy;

use Resa\Api\PrivacySettingsController;
use Resa\Models\Lead;

/**
 * WordPress Personal Data Eraser for RESA leads.
 *
 * Registers with the WordPress privacy tools so admins can erase
 * personal data per GDPR Art. 17 (Right to Erasure).
 *
 * Respects the `anonymize_instead_of_delete` setting: when enabled,
 * PII is removed but anonymized statistical data is retained.
 */
final class PersonalDataEraser {

	/**
	 * Register the eraser with WordPress.
	 */
	public static function register(): void {
		add_filter( 'wp_privacy_personal_data_erasers', [ self::class, 'addEraser' ] );
	}

	/**
	 * Add RESA eraser to the list of WordPress erasers.
	 *
	 * @param array<string, array<string, mixed>> $erasers Registered erasers.
	 * @return array<string, array<string, mixed>>
	 */
	public static function addEraser( array $erasers ): array {
		$erasers['resa-leads'] = [
			'eraser_friendly_name' => __( 'RESA Lead-Daten', 'resa' ),
			'callback'             => [ self::class, 'erase' ],
		];

		return $erasers;
	}

	/**
	 * Erase personal data for a given email address.
	 *
	 * @param string $email Email address to erase data for.
	 * @param int    $page  Page number for pagination.
	 * @return array{items_removed: int, items_retained: int, messages: string[], done: bool}
	 */
	public static function erase( string $email, int $page = 1 ): array {
		$email = sanitize_email( $email );

		if ( ! is_email( $email ) ) {
			return [
				'items_removed'  => 0,
				'items_retained' => 0,
				'messages'       => [],
				'done'           => true,
			];
		}

		$settings   = PrivacySettingsController::get();
		$anonymize  = (bool) $settings['anonymize_instead_of_delete'];

		$result = Lead::findByEmail( $email, $page );

		$removed  = 0;
		$retained = 0;
		$messages = [];

		foreach ( $result['items'] as $lead ) {
			$leadId = (int) $lead->id;

			if ( $anonymize ) {
				$success = Lead::anonymize( $leadId );
				if ( $success ) {
					$retained++;
				}
			} else {
				$success = Lead::delete( $leadId );
				if ( $success ) {
					$removed++;
				}
			}
		}

		if ( $anonymize && $retained > 0 ) {
			$messages[] = sprintf(
				/* translators: %d: number of anonymized leads */
				__( '%d RESA-Lead(s) wurden anonymisiert (Statistik-Daten bleiben erhalten).', 'resa' ),
				$retained
			);
		}

		return [
			'items_removed'  => $removed,
			'items_retained' => $retained,
			'messages'       => $messages,
			'done'           => $result['done'],
		];
	}
}
