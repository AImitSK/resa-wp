<?php
/**
 * Propstack Settings Manager
 *
 * @package Resa\Propstack
 */

namespace Resa\Propstack;

/**
 * Manages Propstack settings stored in WordPress options
 */
class PropstackSettings {
	/**
	 * WordPress option key
	 */
	private const OPTION_KEY = 'resa_propstack_settings';

	/**
	 * Default settings
	 */
	private const DEFAULTS = [
		'enabled'                => false,
		'api_key'                => '',
		'city_broker_mapping'    => [],
		'default_broker_id'      => null,
		'contact_source_id'      => null,
		'activity_enabled'       => false,
		'activity_type_id'       => null,
		'activity_create_task'   => false,
		'activity_task_due_days' => 3,
		'sync_newsletter_only'   => false,
		'newsletter_broker_id'   => null,
	];

	/**
	 * Get settings with defaults
	 *
	 * @return array Settings array.
	 */
	public static function get(): array {
		$saved = get_option(self::OPTION_KEY, []);

		// Remove legacy fields
		if (isset($saved['api_key_masked'])) {
			unset($saved['api_key_masked']);
		}

		// Ensure city_broker_mapping is always an array
		if (isset($saved['city_broker_mapping']) && !is_array($saved['city_broker_mapping'])) {
			$saved['city_broker_mapping'] = [];
		}

		return array_merge(self::DEFAULTS, is_array($saved) ? $saved : []);
	}

	/**
	 * Update settings
	 *
	 * @param array $data New settings data.
	 * @return bool True on success, false on failure.
	 */
	public static function update(array $data): bool {
		error_log('[RESA Propstack Settings] Incoming data: ' . print_r($data, true));

		// Merge with existing settings to preserve unmodified fields
		$current = self::get();
		$updated = array_merge($current, $data);

		// Convert city_broker_mapping from object to array if needed (JSON {} becomes stdClass)
		if (isset($updated['city_broker_mapping']) && is_object($updated['city_broker_mapping'])) {
			error_log('[RESA Propstack Settings] Converting city_broker_mapping from object to array');
			$updated['city_broker_mapping'] = (array) $updated['city_broker_mapping'];
		}

		// Ensure city_broker_mapping is an array
		if (!isset($updated['city_broker_mapping']) || !is_array($updated['city_broker_mapping'])) {
			$updated['city_broker_mapping'] = [];
		}

		// Cast numeric fields
		if (isset($updated['default_broker_id'])) {
			$updated['default_broker_id'] = $updated['default_broker_id'] ? (int) $updated['default_broker_id'] : null;
		}
		if (isset($updated['contact_source_id'])) {
			$updated['contact_source_id'] = $updated['contact_source_id'] ? (int) $updated['contact_source_id'] : null;
		}
		if (isset($updated['activity_type_id'])) {
			$updated['activity_type_id'] = $updated['activity_type_id'] ? (int) $updated['activity_type_id'] : null;
		}
		if (isset($updated['newsletter_broker_id'])) {
			$updated['newsletter_broker_id'] = $updated['newsletter_broker_id'] ? (int) $updated['newsletter_broker_id'] : null;
		}
		if (isset($updated['activity_task_due_days'])) {
			$updated['activity_task_due_days'] = (int) $updated['activity_task_due_days'];
		}

		// Cast boolean fields
		$updated['enabled']              = (bool) ($updated['enabled'] ?? false);
		$updated['activity_enabled']     = (bool) ($updated['activity_enabled'] ?? false);
		$updated['activity_create_task'] = (bool) ($updated['activity_create_task'] ?? false);
		$updated['sync_newsletter_only'] = (bool) ($updated['sync_newsletter_only'] ?? false);

		error_log('[RESA Propstack Settings] Final data to save: ' . print_r($updated, true));

		$result = update_option(self::OPTION_KEY, $updated);
		error_log('[RESA Propstack Settings] update_option result: ' . ($result ? 'true' : 'false'));

		return $result;
	}

	/**
	 * Check if integration is enabled
	 *
	 * @return bool True if enabled, false otherwise.
	 */
	public static function isEnabled(): bool {
		$settings = self::get();
		return !empty($settings['enabled']) && !empty($settings['api_key']);
	}

	/**
	 * Get API key
	 *
	 * @return string API key.
	 */
	public static function getApiKey(): string {
		$settings = self::get();
		return $settings['api_key'] ?? '';
	}

	/**
	 * Mask API key for display (show only last 4 characters)
	 *
	 * @param string $key API key to mask.
	 * @return string Masked key.
	 */
	public static function maskApiKey(string $key): string {
		if (empty($key) || strlen($key) < 4) {
			return '';
		}

		$last4 = substr($key, -4);
		return '****' . $last4;
	}

	/**
	 * Clear all transient caches
	 *
	 * @return void
	 */
	public static function clearCaches(): void {
		delete_transient('resa_propstack_brokers');
		delete_transient('resa_propstack_contact_sources');
		delete_transient('resa_propstack_activity_types');
	}
}
