<?php
/**
 * Propstack API Service
 *
 * @package Resa\Propstack
 */

namespace Resa\Propstack;

use Exception;

/**
 * HTTP client for Propstack API v1
 */
class PropstackService {
	/**
	 * Propstack API base URL
	 */
	private const BASE_URL = 'https://api.propstack.de/v1';

	/**
	 * Request timeout in seconds
	 */
	private const TIMEOUT = 10;

	/**
	 * Rate limit: max requests per minute
	 */
	private const RATE_LIMIT_MAX = 60;

	/**
	 * Rate limit window in seconds
	 */
	private const RATE_LIMIT_WINDOW = 60;

	/**
	 * API key
	 *
	 * @var string
	 */
	private string $apiKey;

	/**
	 * Constructor
	 *
	 * @param string $apiKey Propstack API key.
	 */
	public function __construct(string $apiKey) {
		$this->apiKey = $apiKey;
	}

	/**
	 * Test connection to Propstack API
	 *
	 * @return array Response with success status and broker count.
	 */
	public function testConnection(): array {
		try {
			$result = $this->request('GET', '/brokers', ['limit' => 100]);

			error_log('[RESA Propstack] testConnection raw result: ' . print_r($result, true));

			if ($result['success']) {
				// Brokers returns direct array: [{broker1}, {broker2}, ...]
				$brokers = is_array($result['data']) ? $result['data'] : [];
				error_log('[RESA Propstack] testConnection broker count: ' . count($brokers));
				return [
					'success'      => true,
					'broker_count' => count($brokers),
				];
			}

			error_log('[RESA Propstack] testConnection failed, returning error result');
			return $result;
		} catch (Exception $e) {
			error_log('[RESA Propstack] testConnection exception: ' . $e->getMessage());
			return [
				'success' => false,
				'error'   => $e->getMessage(),
			];
		}
	}

	/**
	 * Get all brokers
	 *
	 * @return array Brokers list.
	 */
	public function getBrokers(): array {
		return $this->request('GET', '/brokers', ['limit' => 100]);
	}

	/**
	 * Get contact sources
	 *
	 * @return array Contact sources list.
	 */
	public function getContactSources(): array {
		return $this->request('GET', '/contact_sources', ['limit' => 100]);
	}

	/**
	 * Get activity types
	 *
	 * @return array Activity types list.
	 */
	public function getActivityTypes(): array {
		return $this->request('GET', '/activity_types', ['limit' => 100]);
	}

	/**
	 * Find contact by email
	 *
	 * @param string $email Email address.
	 * @return array|null Contact data or null if not found.
	 */
	public function findContactByEmail(string $email): ?array {
		$result = $this->request('GET', '/contacts', [
			'filter' => [
				'email' => $email,
			],
			'limit'  => 1,
		]);

		if ($result['success'] && !empty($result['data']['data'])) {
			return $result['data']['data'][0];
		}

		return null;
	}

	/**
	 * Create new contact
	 *
	 * @param array $data Contact data.
	 * @return array API response.
	 */
	public function createContact(array $data): array {
		return $this->request('POST', '/contacts', $data);
	}

	/**
	 * Update existing contact
	 *
	 * @param int   $id   Contact ID.
	 * @param array $data Contact data.
	 * @return array API response.
	 */
	public function updateContact(int $id, array $data): array {
		return $this->request('PUT', "/contacts/{$id}", $data);
	}

	/**
	 * Create task/activity
	 *
	 * @param array $data Task data.
	 * @return array API response.
	 */
	public function createTask(array $data): array {
		return $this->request('POST', '/tasks', $data);
	}

	/**
	 * Send newsletter DOI message
	 *
	 * @param array $data Message data.
	 * @return array API response.
	 */
	public function sendMessage(array $data): array {
		return $this->request('POST', '/messages', $data);
	}

	/**
	 * Check and update rate limit.
	 *
	 * @return bool True if request is allowed, false if rate limited.
	 */
	private function checkRateLimit(): bool {
		$key   = 'resa_propstack_rate_' . gmdate( 'YmdHi' );
		$count = (int) get_transient( $key );

		if ( $count >= self::RATE_LIMIT_MAX ) {
			return false;
		}

		set_transient( $key, $count + 1, self::RATE_LIMIT_WINDOW );
		return true;
	}

	/**
	 * Make HTTP request to Propstack API
	 *
	 * @param string $method   HTTP method (GET, POST, PUT, DELETE).
	 * @param string $endpoint API endpoint (with leading slash).
	 * @param array  $data     Request data (query params for GET, body for POST/PUT).
	 * @return array Response with 'success', 'data', and optional 'error' keys.
	 */
	private function request(string $method, string $endpoint, array $data = []): array {
		// Check rate limit.
		if ( ! $this->checkRateLimit() ) {
			error_log( '[RESA Propstack] Rate limit exceeded' );
			return [
				'success' => false,
				'error'   => __( 'Rate Limit überschritten. Bitte warten Sie einen Moment.', 'resa-propstack' ),
			];
		}

		$url = self::BASE_URL . $endpoint;

		// Prepare request args
		$args = [
			'method'  => strtoupper($method),
			'timeout' => self::TIMEOUT,
			'headers' => [
				'X-API-KEY'    => $this->apiKey,
				'Content-Type' => 'application/json',
				'Accept'       => 'application/json',
			],
		];

		// Add body or query params
		if ($method === 'GET' && !empty($data)) {
			$url = add_query_arg($data, $url);
		} elseif (in_array($method, ['POST', 'PUT'], true) && !empty($data)) {
			$args['body'] = wp_json_encode($data);
		}

		// Log request
		error_log(sprintf('[RESA Propstack] %s %s', $method, $endpoint));

		// Make request
		$response = wp_remote_request($url, $args);

		// Handle errors
		if (is_wp_error($response)) {
			$error = sprintf(
				/* translators: %s: Error message */
				__('HTTP-Fehler: %s', 'resa-propstack'),
				$response->get_error_message()
			);
			error_log('[RESA Propstack] ' . $error);

			return [
				'success' => false,
				'error'   => $error,
			];
		}

		$status_code = wp_remote_retrieve_response_code($response);
		$body        = wp_remote_retrieve_body($response);
		$decoded     = json_decode($body, true);

		// Log response
		error_log(sprintf('[RESA Propstack] Response status: %d, body length: %d bytes', $status_code, strlen($body)));

		// Check status code
		if ($status_code < 200 || $status_code >= 300) {
			$error = sprintf(
				/* translators: 1: HTTP status code, 2: Error message */
				__('API-Fehler (Status %1$d): %2$s', 'resa-propstack'),
				$status_code,
				$decoded['message'] ?? $decoded['error'] ?? __('Unbekannter Fehler', 'resa-propstack')
			);
			error_log('[RESA Propstack] ' . $error);

			return [
				'success' => false,
				'error'   => $error,
			];
		}

		return [
			'success' => true,
			'data'    => $decoded,
		];
	}
}
