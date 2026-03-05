<?php
/**
 * Tests for PropstackService
 *
 * @package Resa\Propstack\Tests
 */

namespace Resa\Propstack\Tests;

use PHPUnit\Framework\TestCase;
use Brain\Monkey;
use Brain\Monkey\Functions;
use Resa\Propstack\PropstackService;

/**
 * Test PropstackService class
 */
class PropstackServiceTest extends TestCase {

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Test testConnection() returns success with broker count
	 */
	public function test_testConnection_gibt_success_mit_broker_count(): void {
		Functions\expect('wp_remote_request')
			->once()
			->andReturn([
				'response' => ['code' => 200],
				'body'     => wp_json_encode([
					'data' => [],
					'meta' => ['total' => 5],
				]),
			]);

		Functions\when('wp_remote_retrieve_response_code')->justReturn(200);
		Functions\when('wp_remote_retrieve_body')->justReturn(
			wp_json_encode(['data' => [], 'meta' => ['total' => 5]])
		);
		Functions\when('is_wp_error')->justReturn(false);
		Functions\when('add_query_arg')->returnArg(1);
		Functions\when('__')->returnArg();
		Functions\when('error_log')->justReturn(null);

		$service = new PropstackService('test-api-key');
		$result  = $service->testConnection();

		$this->assertTrue($result['success']);
		$this->assertSame(5, $result['broker_count']);
	}

	/**
	 * Test request() sets API key header
	 */
	public function test_request_setzt_api_key_header(): void {
		Functions\expect('wp_remote_request')
			->once()
			->with(
				Monkey\Functions\Args::type('string'),
				Monkey\Functions\Args::containing([
					'headers' => Monkey\Functions\Args::containing([
						'X-API-KEY' => 'test-key-123',
					]),
				])
			)
			->andReturn([
				'response' => ['code' => 200],
				'body'     => '{"data":[]}',
			]);

		Functions\when('wp_remote_retrieve_response_code')->justReturn(200);
		Functions\when('wp_remote_retrieve_body')->justReturn('{"data":[]}');
		Functions\when('is_wp_error')->justReturn(false);
		Functions\when('add_query_arg')->returnArg(1);
		Functions\when('error_log')->justReturn(null);

		$service = new PropstackService('test-key-123');
		$service->getBrokers();
	}

	/**
	 * Test request() has 10 second timeout
	 */
	public function test_request_timeout_10_sekunden(): void {
		Functions\expect('wp_remote_request')
			->once()
			->with(
				Monkey\Functions\Args::type('string'),
				Monkey\Functions\Args::containing([
					'timeout' => 10,
				])
			)
			->andReturn([
				'response' => ['code' => 200],
				'body'     => '{"data":[]}',
			]);

		Functions\when('wp_remote_retrieve_response_code')->justReturn(200);
		Functions\when('wp_remote_retrieve_body')->justReturn('{"data":[]}');
		Functions\when('is_wp_error')->justReturn(false);
		Functions\when('add_query_arg')->returnArg(1);
		Functions\when('error_log')->justReturn(null);

		$service = new PropstackService('test-key');
		$service->getBrokers();
	}

	/**
	 * Test createContact() sends correct data
	 */
	public function test_createContact_sendet_korrekte_daten(): void {
		$contactData = [
			'broker_id' => 123,
			'firstname' => 'Max',
			'lastname'  => 'Mustermann',
			'email'     => 'max@example.com',
		];

		Functions\expect('wp_remote_request')
			->once()
			->with(
				Monkey\Functions\Args::containing('/contacts'),
				Monkey\Functions\Args::containing([
					'method' => 'POST',
					'body'   => wp_json_encode($contactData),
				])
			)
			->andReturn([
				'response' => ['code' => 201],
				'body'     => wp_json_encode(['data' => ['id' => 456]]),
			]);

		Functions\when('wp_remote_retrieve_response_code')->justReturn(201);
		Functions\when('wp_remote_retrieve_body')->justReturn(
			wp_json_encode(['data' => ['id' => 456]])
		);
		Functions\when('is_wp_error')->justReturn(false);
		Functions\when('error_log')->justReturn(null);

		$service = new PropstackService('test-key');
		$result  = $service->createContact($contactData);

		$this->assertTrue($result['success']);
		$this->assertSame(456, $result['data']['data']['id']);
	}
}
