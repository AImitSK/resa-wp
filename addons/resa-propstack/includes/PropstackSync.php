<?php
/**
 * Propstack Lead Sync
 *
 * @package Resa\Propstack
 */

namespace Resa\Propstack;

use Exception;

/**
 * Handles lead synchronization to Propstack CRM
 */
class PropstackSync {
	/**
	 * Hook callback for lead creation
	 *
	 * @param int $leadId Lead ID.
	 * @return void
	 */
	public function onLeadCreated(int $leadId): void {
		// Check if integration is enabled
		if (!PropstackSettings::isEnabled()) {
			return;
		}

		// Load lead data
		global $wpdb;
		$table = $wpdb->prefix . 'resa_leads';
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
		$lead = $wpdb->get_row(
			$wpdb->prepare("SELECT * FROM {$table} WHERE id = %d", $leadId)
		);

		if (!$lead || empty($lead->email)) {
			return;
		}

		// Skip if already synced
		if (!empty($lead->propstack_synced)) {
			return;
		}

		// Sync asynchronously (non-blocking)
		$this->syncLead($lead);
	}

	/**
	 * Sync lead to Propstack
	 *
	 * @param object $lead Lead data object.
	 * @return void
	 */
	private function syncLead(object $lead): void {
		try {
			$settings = PropstackSettings::get();
			$service  = new PropstackService($settings['api_key']);

			// Determine broker ID (location mapping → default)
			$brokerId = $this->resolveBroker($lead, $settings);

			if (!$brokerId) {
				throw new Exception(__('Kein Makler konfiguriert.', 'resa-propstack'));
			}

			// Prepare contact data
			$contactData = [
				'broker_id' => $brokerId,
				'firstname' => $lead->first_name ?? '',
				'lastname'  => $lead->last_name ?? '',
				'email'     => $lead->email,
				'phone'     => $lead->phone ?? '',
			];

			// Add contact source if configured
			if (!empty($settings['contact_source_id'])) {
				$contactData['contact_source_id'] = $settings['contact_source_id'];
			}

			// Search for existing contact
			$existing = $service->findContactByEmail($lead->email);
			$propstackId = null;

			if ($existing) {
				// Update existing contact
				$result = $service->updateContact($existing['id'], $contactData);
				$propstackId = $existing['id'];

				error_log(sprintf(
					'[RESA Propstack] Updated contact #%d for lead #%d',
					$propstackId,
					$lead->id
				));
			} else {
				// Create new contact
				$result = $service->createContact($contactData);
				$propstackId = $result['data']['data']['id'] ?? null;

				error_log(sprintf(
					'[RESA Propstack] Created contact #%d for lead #%d',
					$propstackId,
					$lead->id
				));
			}

			if (!$propstackId) {
				throw new Exception(__('Kontakt konnte nicht erstellt/aktualisiert werden.', 'resa-propstack'));
			}

			// Create activity/task if enabled
			if (!empty($settings['activity_enabled']) && !empty($settings['activity_type_id'])) {
				$this->createActivity($service, $propstackId, $lead, $settings);
			}

			// Send newsletter DOI if consent given and not newsletter-only mode
			if (!empty($lead->consent_given) && empty($settings['sync_newsletter_only'])) {
				$this->sendNewsletterDoi($service, $propstackId, $lead, $settings);
			}

			// Mark lead as synced
			$this->markSynced($lead->id, $propstackId);

		} catch (Exception $e) {
			// Non-blocking error handling
			$this->markError($lead->id, $e->getMessage());
			error_log(sprintf(
				'[RESA Propstack] Sync failed for lead #%d: %s',
				$lead->id,
				$e->getMessage()
			));
		}
	}

	/**
	 * Resolve broker ID from location mapping or default
	 *
	 * @param object $lead     Lead object.
	 * @param array  $settings Settings array.
	 * @return int|null Broker ID or null.
	 */
	private function resolveBroker(object $lead, array $settings): ?int {
		// Newsletter-only mode uses specific broker
		if (!empty($settings['sync_newsletter_only']) && !empty($settings['newsletter_broker_id'])) {
			return $settings['newsletter_broker_id'];
		}

		// Try location-specific mapping
		if (!empty($lead->location_id) && !empty($settings['city_broker_mapping'][$lead->location_id])) {
			return (int) $settings['city_broker_mapping'][$lead->location_id];
		}

		// Fallback to default broker
		return $settings['default_broker_id'] ?? null;
	}

	/**
	 * Create activity/task in Propstack
	 *
	 * @param PropstackService $service  Service instance.
	 * @param int              $contactId Contact ID.
	 * @param object           $lead      Lead data.
	 * @param array            $settings  Settings.
	 * @return void
	 */
	private function createActivity(PropstackService $service, int $contactId, object $lead, array $settings): void {
		try {
			$taskData = [
				'contact_id'       => $contactId,
				'activity_type_id' => $settings['activity_type_id'],
				'subject'          => sprintf(
					/* translators: %s: Calculator module name */
					__('Neue Anfrage: %s', 'resa-propstack'),
					$lead->module ?? 'RESA'
				),
				'description'      => $this->formatLeadData($lead),
			];

			// Add due date if task creation enabled
			if (!empty($settings['activity_create_task'])) {
				$dueDate = new \DateTime('now', new \DateTimeZone('Europe/Berlin'));
				$dueDays = (int) ($settings['activity_task_due_days'] ?? 3);
				$dueDate->modify("+{$dueDays} days");

				$taskData['due_date'] = $dueDate->format('Y-m-d');
				$taskData['is_task']  = true;
			}

			$service->createTask($taskData);

			error_log(sprintf(
				'[RESA Propstack] Created activity for contact #%d',
				$contactId
			));
		} catch (Exception $e) {
			// Log but don't fail sync
			error_log(sprintf(
				'[RESA Propstack] Failed to create activity: %s',
				$e->getMessage()
			));
		}
	}

	/**
	 * Send newsletter DOI message
	 *
	 * @param PropstackService $service  Service instance.
	 * @param int              $contactId Contact ID.
	 * @param object           $lead      Lead data.
	 * @param array            $settings  Settings.
	 * @return void
	 */
	private function sendNewsletterDoi(PropstackService $service, int $contactId, object $lead, array $settings): void {
		try {
			$messageData = [
				'contact_id' => $contactId,
				'type'       => 'newsletter_doi',
			];

			// Use newsletter-specific broker if configured
			if (!empty($settings['newsletter_broker_id'])) {
				$messageData['broker_id'] = $settings['newsletter_broker_id'];
			}

			$service->sendMessage($messageData);

			error_log(sprintf(
				'[RESA Propstack] Sent newsletter DOI for contact #%d',
				$contactId
			));
		} catch (Exception $e) {
			// Log but don't fail sync
			error_log(sprintf(
				'[RESA Propstack] Failed to send newsletter DOI: %s',
				$e->getMessage()
			));
		}
	}

	/**
	 * Format lead data for activity description
	 *
	 * @param object $lead Lead object.
	 * @return string Formatted description.
	 */
	private function formatLeadData(object $lead): string {
		$lines = [];

		// Module info
		if (!empty($lead->module)) {
			$lines[] = sprintf(__('Modul: %s', 'resa-propstack'), $lead->module);
		}

		// Contact info
		if (!empty($lead->email)) {
			$lines[] = sprintf(__('E-Mail: %s', 'resa-propstack'), $lead->email);
		}
		if (!empty($lead->phone)) {
			$lines[] = sprintf(__('Telefon: %s', 'resa-propstack'), $lead->phone);
		}

		// Calculation result (if available)
		if (!empty($lead->result_data)) {
			$resultData = is_string($lead->result_data) ? json_decode($lead->result_data, true) : $lead->result_data;
			if (is_array($resultData)) {
				$lines[] = "\n" . __('Ergebnis:', 'resa-propstack');
				foreach ($resultData as $key => $value) {
					if (is_scalar($value)) {
						$lines[] = sprintf('- %s: %s', $key, $value);
					}
				}
			}
		}

		return implode("\n", $lines);
	}

	/**
	 * Mark lead as successfully synced
	 *
	 * @param int $leadId      Lead ID.
	 * @param int $propstackId Propstack contact ID.
	 * @return void
	 */
	private function markSynced(int $leadId, int $propstackId): void {
		global $wpdb;
		$table = $wpdb->prefix . 'resa_leads';

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
		$wpdb->update(
			$table,
			[
				'propstack_id'     => $propstackId,
				'propstack_synced' => 1,
				'propstack_error'  => null,
				'propstack_synced_at' => current_time('mysql'),
			],
			['id' => $leadId],
			['%d', '%d', '%s', '%s'],
			['%d']
		);
	}

	/**
	 * Mark lead sync as failed
	 *
	 * @param int    $leadId Lead ID.
	 * @param string $error  Error message.
	 * @return void
	 */
	private function markError(int $leadId, string $error): void {
		global $wpdb;
		$table = $wpdb->prefix . 'resa_leads';

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
		$wpdb->update(
			$table,
			[
				'propstack_synced' => 0,
				'propstack_error'  => $error,
			],
			['id' => $leadId],
			['%d', '%s'],
			['%d']
		);
	}
}
