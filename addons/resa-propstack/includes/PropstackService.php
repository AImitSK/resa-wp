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
			$result = $this->request('GET', '/brokers', ['limit' => 1]);

			if ($result['success']) {
				return [
					'success'      => true,
					'broker_count' => $result['data']['meta']['total'] ?? 0,
				];
			}

			return $result;
		} catch (Exception $e) {
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
		return $this->request('GET', '/contact-sources', ['limit' => 100]);
	}

	/**
	 * Get activity types
	 *
	 * @return array Activity types list.
	 */
	public function getActivityTypes(): array {
		return $this->request('GET', '/activity-types', ['limit' => 100]);
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
	 * Make HTTP request to Propstack API
	 *
	 * @param string $method   HTTP method (GET, POST, PUT, DELETE).
	 * @param string $endpoint API endpoint (with leading slash).
	 * @param array  $data     Request data (query params for GET, body for POST/PUT).
	 * @return array Response with 'success', 'data', and optional 'error' keys.
	 */
	private function request(string $method, string $endpoint, array $data = []): array {
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
