<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Services\Integration;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Services\Integration\WebhookDispatcher;

class WebhookDispatcherTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_sendTest_sends_post_with_signature(): void {
		$webhook = (object) [
			'id'        => 1,
			'name'      => 'Test',
			'url'       => 'https://example.com/hook',
			'secret'    => 'whsec_testsecret',
			'events'    => '["lead.created"]',
			'is_active' => 1,
		];

		Functions\expect( 'home_url' )->once()->andReturn( 'https://example.com/' );

		Functions\expect( 'wp_json_encode' )->andReturnUsing( 'json_encode' );

		Functions\expect( 'wp_remote_post' )
			->once()
			->andReturnUsing( function ( $url, $args ) use ( $webhook ) {
				// Verify URL.
				$this->assertEquals( 'https://example.com/hook', $url );

				// Verify headers.
				$this->assertEquals( 'application/json', $args['headers']['Content-Type'] );
				$this->assertEquals( 'lead.created', $args['headers']['X-Resa-Event'] );
				$this->assertEquals( 'RESA-Webhook/1.0', $args['headers']['User-Agent'] );
				$this->assertNotEmpty( $args['headers']['X-Resa-Signature'] );

				// Verify HMAC signature is correct.
				$expectedSig = hash_hmac( 'sha256', $args['body'], $webhook->secret );
				$this->assertEquals( $expectedSig, $args['headers']['X-Resa-Signature'] );

				// Verify timeout.
				$this->assertEquals( 5, $args['timeout'] );

				// Verify body contains test data.
				$body = json_decode( $args['body'], true );
				$this->assertEquals( 'lead.created', $body['event'] );
				$this->assertEquals( 'Max Mustermann', $body['lead']['name'] );
				$this->assertEquals( 'test@example.com', $body['lead']['email'] );

				return [
					'response' => [ 'code' => 200 ],
					'body'     => '{"ok":true}',
				];
			} );

		Functions\expect( 'wp_remote_retrieve_response_code' )->once()->andReturn( 200 );

		$dispatcher = new WebhookDispatcher();
		$result     = $dispatcher->sendTest( $webhook );

		$this->assertTrue( $result['success'] );
		$this->assertEquals( 200, $result['statusCode'] );
	}

	public function test_sendTest_returns_error_on_wp_error(): void {
		$webhook = (object) [
			'id'        => 1,
			'name'      => 'Test',
			'url'       => 'https://unreachable.example.com/hook',
			'secret'    => 'whsec_test',
			'events'    => '["lead.created"]',
			'is_active' => 1,
		];

		Functions\expect( 'home_url' )->once()->andReturn( 'https://example.com/' );
		Functions\expect( 'wp_json_encode' )->andReturnUsing( 'json_encode' );

		$wpError = Mockery::mock( 'WP_Error' );
		$wpError->shouldReceive( 'get_error_message' )
			->once()
			->andReturn( 'Connection timeout' );

		Functions\expect( 'wp_remote_post' )->once()->andReturn( $wpError );
		Functions\expect( 'is_wp_error' )->once()->andReturn( true );

		$dispatcher = new WebhookDispatcher();
		$result     = $dispatcher->sendTest( $webhook );

		$this->assertFalse( $result['success'] );
		$this->assertEquals( 'Connection timeout', $result['error'] );
	}

	public function test_sendTest_returns_failure_for_non_2xx(): void {
		$webhook = (object) [
			'id'        => 1,
			'name'      => 'Test',
			'url'       => 'https://example.com/hook',
			'secret'    => 'whsec_test',
			'events'    => '["lead.created"]',
			'is_active' => 1,
		];

		Functions\expect( 'home_url' )->once()->andReturn( 'https://example.com/' );
		Functions\expect( 'wp_json_encode' )->andReturnUsing( 'json_encode' );
		Functions\expect( 'wp_remote_post' )->once()->andReturn( [ 'response' => [ 'code' => 500 ] ] );
		Functions\expect( 'is_wp_error' )->once()->andReturn( false );
		Functions\expect( 'wp_remote_retrieve_response_code' )->once()->andReturn( 500 );

		$dispatcher = new WebhookDispatcher();
		$result     = $dispatcher->sendTest( $webhook );

		$this->assertFalse( $result['success'] );
		$this->assertEquals( 500, $result['statusCode'] );
	}

	public function test_sendTest_payload_has_required_fields(): void {
		$webhook = (object) [
			'id'        => 1,
			'name'      => 'Test',
			'url'       => 'https://example.com/hook',
			'secret'    => 'whsec_test',
			'events'    => '["lead.created"]',
			'is_active' => 1,
		];

		Functions\expect( 'home_url' )->once()->andReturn( 'https://example.com/' );
		Functions\expect( 'wp_json_encode' )->andReturnUsing( 'json_encode' );

		$capturedBody = null;

		Functions\expect( 'wp_remote_post' )
			->once()
			->andReturnUsing( function ( $url, $args ) use ( &$capturedBody ) {
				$capturedBody = json_decode( $args['body'], true );
				return [ 'response' => [ 'code' => 200 ] ];
			} );

		Functions\expect( 'is_wp_error' )->once()->andReturn( false );
		Functions\expect( 'wp_remote_retrieve_response_code' )->once()->andReturn( 200 );

		$dispatcher = new WebhookDispatcher();
		$dispatcher->sendTest( $webhook );

		$this->assertArrayHasKey( 'event', $capturedBody );
		$this->assertArrayHasKey( 'timestamp', $capturedBody );
		$this->assertArrayHasKey( 'lead', $capturedBody );
		$this->assertArrayHasKey( 'asset', $capturedBody );
		$this->assertArrayHasKey( 'location', $capturedBody );
		$this->assertArrayHasKey( 'inputs', $capturedBody );
		$this->assertArrayHasKey( 'result', $capturedBody );
		$this->assertArrayHasKey( 'meta', $capturedBody );

		// Lead structure.
		$this->assertArrayHasKey( 'id', $capturedBody['lead'] );
		$this->assertArrayHasKey( 'name', $capturedBody['lead'] );
		$this->assertArrayHasKey( 'email', $capturedBody['lead'] );
		$this->assertArrayHasKey( 'phone', $capturedBody['lead'] );
		$this->assertArrayHasKey( 'consent', $capturedBody['lead'] );
	}

	public function test_onLeadCreated_does_nothing_for_missing_lead(): void {
		global $wpdb;

		// Lead::findById returns null.
		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'query' );
		$wpdb->shouldReceive( 'get_row' )->once()->andReturn( null );

		// wp_remote_post should NOT be called.
		Functions\expect( 'wp_remote_post' )->never();

		$dispatcher = new WebhookDispatcher();
		$dispatcher->onLeadCreated( 999 );
	}

	public function test_dispatch_only_fires_matching_events(): void {
		global $wpdb;

		// getActive returns webhooks.
		$webhooks = [
			(object) [
				'id'        => 1,
				'name'      => 'Lead Hook',
				'url'       => 'https://example.com/lead',
				'secret'    => 'whsec_1',
				'events'    => '["lead.created"]',
				'is_active' => 1,
			],
			(object) [
				'id'        => 2,
				'name'      => 'Other Hook',
				'url'       => 'https://example.com/other',
				'secret'    => 'whsec_2',
				'events'    => '["some.other.event"]',
				'is_active' => 1,
			],
		];

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'query' );
		$wpdb->shouldReceive( 'get_results' )->once()->andReturn( $webhooks );

		Functions\expect( 'wp_json_encode' )->andReturnUsing( 'json_encode' );
		Functions\expect( 'is_wp_error' )->andReturn( false );
		Functions\expect( 'wp_remote_retrieve_response_code' )->andReturn( 200 );

		// Only 1 webhook should fire (the lead.created one).
		Functions\expect( 'wp_remote_post' )
			->once()
			->andReturnUsing( function ( $url ) {
				$this->assertEquals( 'https://example.com/lead', $url );
				return [ 'response' => [ 'code' => 200 ] ];
			} );

		$dispatcher = new WebhookDispatcher();
		$dispatcher->dispatch( 'lead.created', [ 'test' => true ] );
	}
}
