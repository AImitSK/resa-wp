<?php
/**
 * Propstack REST API Controller
 *
 * @package Resa\Propstack
 */

namespace Resa\Propstack;

use WP_REST_Request;
use WP_REST_Response;

/**
 * REST API endpoints for Propstack integration
 */
class PropstackController {
	/**
	 * REST API namespace
	 */
	private const NAMESPACE = 'resa/v1';

	/**
	 * Transient cache TTL (5 minutes)
	 */
	private const CACHE_TTL = 300;

	/**
	 * Register REST API routes
	 *
	 * @return void
	 */
	public static function registerRoutes(): void {
		// GET/PUT settings
		register_rest_route(self::NAMESPACE, '/admin/propstack/settings', [
			[
				'methods'             => 'GET',
				'callback'            => [self::class, 'getSettings'],
				'permission_callback' => [self::class, 'adminAccess'],
			],
			[
				'methods'             => 'PUT',
				'callback'            => [self::class, 'updateSettings'],
				'permission_callback' => [self::class, 'adminAccess'],
			],
		]);

		// POST test-connection
		register_rest_route(self::NAMESPACE, '/admin/propstack/test-connection', [
			'methods'             => 'POST',
			'callback'            => [self::class, 'testConnection'],
			'permission_callback' => [self::class, 'adminAccess'],
		]);

		// GET brokers
		register_rest_route(self::NAMESPACE, '/admin/propstack/brokers', [
			'methods'             => 'GET',
			'callback'            => [self::class, 'getBrokers'],
			'permission_callback' => [self::class, 'adminAccess'],
		]);

		// GET contact-sources
		register_rest_route(self::NAMESPACE, '/admin/propstack/contact-sources', [
			'methods'             => 'GET',
			'callback'            => [self::class, 'getContactSources'],
			'permission_callback' => [self::class, 'adminAccess'],
		]);

		// GET activity-types
		register_rest_route(self::NAMESPACE, '/admin/propstack/activity-types', [
			'methods'             => 'GET',
			'callback'            => [self::class, 'getActivityTypes'],
			'permission_callback' => [self::class, 'adminAccess'],
		]);

		// POST sync/{id} (manual re-sync)
		register_rest_route(self::NAMESPACE, '/admin/propstack/sync/(?P<id>\d+)', [
			'methods'             => 'POST',
			'callback'            => [self::class, 'manualSync'],
			'permission_callback' => [self::class, 'adminAccess'],
		]);
	}

	/**
	 * Permission callback for admin endpoints
	 *
	 * @return bool True if user has admin access.
	 */
	public static function adminAccess(): bool {
		return current_user_can('manage_options');
	}

	/**
	 * GET settings
	 *
	 * @return WP_REST_Response Settings data.
	 */
	public static function getSettings(): WP_REST_Response {
		$settings = PropstackSettings::get();

		// Mask API key for security
		if (!empty($settings['api_key'])) {
			$settings['api_key_masked'] = PropstackSettings::maskApiKey($settings['api_key']);
			$settings['api_key'] = ''; // Don't send full key to frontend
		}

		return new WP_REST_Response($settings, 200);
	}

	/**
	 * PUT settings
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Updated settings.
	 */
	public static function updateSettings(WP_REST_Request $request): WP_REST_Response {
		$data = $request->get_json_params();

		// Clear caches when API key changes
		if (isset($data['api_key'])) {
			PropstackSettings::clearCaches();
		}

		// Update settings
		$success = PropstackSettings::update($data);

		if (!$success) {
			return new WP_REST_Response(
				['error' => __('Einstellungen konnten nicht gespeichert werden.', 'resa-propstack')],
				500
			);
		}

		// Return updated settings (masked)
		return self::getSettings();
	}

	/**
	 * POST test-connection
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Test result.
	 */
	public static function testConnection(WP_REST_Request $request): WP_REST_Response {
		$data = $request->get_json_params();
		$apiKey = $data['api_key'] ?? PropstackSettings::getApiKey();

		if (empty($apiKey)) {
			return new WP_REST_Response(
				[
					'success' => false,
					'error'   => __('API-Key fehlt.', 'resa-propstack'),
				],
				400
			);
		}

		$service = new PropstackService($apiKey);
		$result = $service->testConnection();

		return new WP_REST_Response($result, $result['success'] ? 200 : 400);
	}

	/**
	 * GET brokers (cached)
	 *
	 * @return WP_REST_Response Brokers list.
	 */
	public static function getBrokers(): WP_REST_Response {
		$cached = get_transient('resa_propstack_brokers');
		if ($cached !== false) {
			return new WP_REST_Response($cached, 200);
		}

		$apiKey = PropstackSettings::getApiKey();
		if (empty($apiKey)) {
			return new WP_REST_Response(
				['error' => __('API-Key nicht konfiguriert.', 'resa-propstack')],
				400
			);
		}

		$service = new PropstackService($apiKey);
		$result = $service->getBrokers();

		if (!$result['success']) {
			return new WP_REST_Response($result, 400);
		}

		$brokers = $result['data']['data'] ?? [];

		// Cache for 5 minutes
		set_transient('resa_propstack_brokers', $brokers, self::CACHE_TTL);

		return new WP_REST_Response($brokers, 200);
	}

	/**
	 * GET contact-sources (cached)
	 *
	 * @return WP_REST_Response Contact sources list.
	 */
	public static function getContactSources(): WP_REST_Response {
		$cached = get_transient('resa_propstack_contact_sources');
		if ($cached !== false) {
			return new WP_REST_Response($cached, 200);
		}

		$apiKey = PropstackSettings::getApiKey();
		if (empty($apiKey)) {
			return new WP_REST_Response(
				['error' => __('API-Key nicht konfiguriert.', 'resa-propstack')],
				400
			);
		}

		$service = new PropstackService($apiKey);
		$result = $service->getContactSources();

		if (!$result['success']) {
			return new WP_REST_Response($result, 400);
		}

		$sources = $result['data']['data'] ?? [];

		// Cache for 5 minutes
		set_transient('resa_propstack_contact_sources', $sources, self::CACHE_TTL);

		return new WP_REST_Response($sources, 200);
	}

	/**
	 * GET activity-types (cached)
	 *
	 * @return WP_REST_Response Activity types list.
	 */
	public static function getActivityTypes(): WP_REST_Response {
		$cached = get_transient('resa_propstack_activity_types');
		if ($cached !== false) {
			return new WP_REST_Response($cached, 200);
		}

		$apiKey = PropstackSettings::getApiKey();
		if (empty($apiKey)) {
			return new WP_REST_Response(
				['error' => __('API-Key nicht konfiguriert.', 'resa-propstack')],
				400
			);
		}

		$service = new PropstackService($apiKey);
		$result = $service->getActivityTypes();

		if (!$result['success']) {
			return new WP_REST_Response($result, 400);
		}

		$types = $result['data']['data'] ?? [];

		// Cache for 5 minutes
		set_transient('resa_propstack_activity_types', $types, self::CACHE_TTL);

		return new WP_REST_Response($types, 200);
	}

	/**
	 * POST sync/{id} - Manual re-sync
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Sync result.
	 */
	public static function manualSync(WP_REST_Request $request): WP_REST_Response {
		$leadId = (int) $request->get_param('id');

		if (!$leadId) {
			return new WP_REST_Response(
				['error' => __('Ungültige Lead-ID.', 'resa-propstack')],
				400
			);
		}

		// Trigger sync
		$sync = new PropstackSync();
		$sync->onLeadCreated($leadId);

		return new WP_REST_Response(
			['success' => true, 'message' => __('Lead wurde erneut synchronisiert.', 'resa-propstack')],
			200
		);
	}
}
