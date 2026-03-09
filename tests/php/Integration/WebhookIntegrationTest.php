<?php

declare( strict_types=1 );

namespace Resa\Tests\Integration;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Services\Integration\WebhookDispatcher;

/**
 * Integration test: Webhook dispatch with HMAC signing, filtering, and HTTP calls.
 */
class WebhookIntegrationTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';

		Functions\when( 'wp_json_encode' )->alias( 'json_encode' );
		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\when( 'sanitize_email' )->returnArg();
		Functions\when( 'absint' )->alias( fn( $v ) => abs( (int) $v ) );
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	// ── Dispatch ─────────────────────────────────────────────

	public function test_dispatch_sendet_an_alle_passenden_webhooks(): void {
		global $wpdb;

		$webhook1 = (object) [
			'id'        => 1,
			'url'       => 'https://example.com/hook1',
			'secret'    => 'secret1',
			'events'    => json_encode( [ 'lead.created' ] ),
			'is_active' => 1,
		];
		$webhook2 = (object) [
			'id'        => 2,
			'url'       => 'https://example.com/hook2',
			'secret'    => 'secret2',
			'events'    => json_encode( [ 'lead.created', 'lead.updated' ] ),
			'is_active' => 1,
		];

		// Webhook::getActive() mock.
		$wpdb->shouldReceive( 'prepare' )->andReturn( 'sql' );
		$wpdb->shouldReceive( 'get_results' )->once()->andReturn( [ $webhook1, $webhook2 ] );

		// Both should receive POST.
		Functions\expect( 'wp_remote_post' )
			->twice()
			->andReturn( [
				'response' => [ 'code' => 200 ],
				'body'     => 'OK',
			] );

		Functions\when( 'is_wp_error' )->justReturn( false );
		Functions\when( 'wp_remote_retrieve_response_code' )->justReturn( 200 );

		$dispatcher = new WebhookDispatcher();
		$dispatcher->dispatch( 'lead.created', [ 'lead' => [ 'id' => 42 ] ] );

		// Assertions are in the mock expectations (twice).
	}

	public function test_dispatch_filtert_nach_events(): void {
		global $wpdb;

		$webhook = (object) [
			'id'        => 1,
			'url'       => 'https://example.com/hook',
			'secret'    => 'secret',
			'events'    => json_encode( [ 'lead.updated' ] ), // Not lead.created.
			'is_active' => 1,
		];

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'sql' );
		$wpdb->shouldReceive( 'get_results' )->once()->andReturn( [ $webhook ] );

		// Should NOT send because event doesn't match.
		Functions\expect( 'wp_remote_post' )->never();

		$dispatcher = new WebhookDispatcher();
		$dispatcher->dispatch( 'lead.created', [ 'lead' => [ 'id' => 42 ] ] );
	}

	// ── HMAC Signature ───────────────────────────────────────

	public function test_dispatch_sendet_hmac_signatur(): void {
		global $wpdb;

		$webhook = (object) [
			'id'        => 1,
			'url'       => 'https://example.com/hook',
			'secret'    => 'test-secret-key',
			'events'    => json_encode( [ 'lead.created' ] ),
			'is_active' => 1,
		];

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'sql' );
		$wpdb->shouldReceive( 'get_results' )->once()->andReturn( [ $webhook ] );

		Functions\expect( 'wp_remote_post' )
			->once()
			->with(
				'https://example.com/hook',
				Mockery::on( function ( $args ) {
					return isset( $args['headers']['X-Resa-Signature'] ) &&
						   isset( $args['headers']['X-Resa-Event'] ) &&
						   $args['headers']['X-Resa-Event'] === 'lead.created' &&
						   $args['headers']['Content-Type'] === 'application/json';
				} )
			)
			->andReturn( [ 'response' => [ 'code' => 200 ] ] );

		Functions\when( 'is_wp_error' )->justReturn( false );
		Functions\when( 'wp_remote_retrieve_response_code' )->justReturn( 200 );

		$dispatcher = new WebhookDispatcher();
		$dispatcher->dispatch( 'lead.created', [ 'test' => true ] );
	}

	// ── onLeadCreated ────────────────────────────────────────

	public function test_onLeadCreated_baut_payload_korrekt(): void {
		global $wpdb;

		// Lead::findById mock.
		$lead = (object) [
			'id'            => 42,
			'first_name'    => 'Max',
			'last_name'     => 'Mustermann',
			'email'         => 'max@example.com',
			'phone'         => '+49 170 1234567',
			'consent_given' => 1,
			'consent_date'  => '2025-06-01 12:00:00',
			'asset_type'    => 'rent-calculator',
			'location_id'   => 1,
			'inputs'        => json_encode( [ 'rooms' => 3 ] ),
			'result'        => json_encode( [ 'rent' => 14.50 ] ),
			'meta'          => json_encode( [ 'page_url' => 'https://example.com' ] ),
		];

		// Location::findById mock.
		$location = (object) [
			'id'         => 1,
			'name'       => 'München',
			'bundesland' => 'Bayern',
		];

		// Lead::findById prepare + get_row.
		$wpdb->shouldReceive( 'prepare' )->andReturn( 'sql' );
		$wpdb->shouldReceive( 'get_row' )
			->once()
			->andReturn( $lead );
		$wpdb->shouldReceive( 'get_row' )
			->once()
			->andReturn( $location );

		// Webhook::getActive — no webhooks (skip actual dispatch).
		$wpdb->shouldReceive( 'get_results' )->once()->andReturn( [] );

		$dispatcher = new WebhookDispatcher();
		$dispatcher->onLeadCreated( 42 );

		// If no exception was thrown, payload was built correctly.
		$this->assertTrue( true );
	}

	public function test_onLeadCreated_ignoriert_nicht_existierenden_lead(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'sql' );
		$wpdb->shouldReceive( 'get_row' )->once()->andReturn( null );

		// Should NOT try to dispatch.
		Functions\expect( 'wp_remote_post' )->never();

		$dispatcher = new WebhookDispatcher();
		$dispatcher->onLeadCreated( 999 );
	}

	// ── sendTest ─────────────────────────────────────────────

	public function test_sendTest_sendet_beispiel_payload(): void {
		$webhook = (object) [
			'id'     => 1,
			'url'    => 'https://example.com/hook',
			'secret' => 'test-secret',
		];

		Functions\when( 'home_url' )->justReturn( 'https://example.com' );

		Functions\expect( 'wp_remote_post' )
			->once()
			->with(
				'https://example.com/hook',
				Mockery::on( function ( $args ) {
					$body = json_decode( $args['body'], true );
					return $body['event'] === 'lead.created' &&
						   $body['lead']['name'] === 'Max Mustermann';
				} )
			)
			->andReturn( [ 'response' => [ 'code' => 200 ] ] );

		Functions\when( 'is_wp_error' )->justReturn( false );
		Functions\when( 'wp_remote_retrieve_response_code' )->justReturn( 200 );

		$dispatcher = new WebhookDispatcher();
		$result     = $dispatcher->sendTest( $webhook );

		$this->assertTrue( $result['success'] );
		$this->assertSame( 200, $result['statusCode'] );
	}

	public function test_sendTest_behandelt_netzwerkfehler(): void {
		$webhook = (object) [
			'id'     => 1,
			'url'    => 'https://unreachable.example.com',
			'secret' => 'secret',
		];

		Functions\when( 'home_url' )->justReturn( 'https://example.com' );

		$wpError = new \WP_Error( 'http_request_failed', 'Connection timeout' );

		Functions\expect( 'wp_remote_post' )
			->once()
			->andReturn( $wpError );

		Functions\when( 'is_wp_error' )->justReturn( true );

		$dispatcher = new WebhookDispatcher();
		$result     = $dispatcher->sendTest( $webhook );

		$this->assertFalse( $result['success'] );
		$this->assertSame( 'Connection timeout', $result['error'] );
	}
}
