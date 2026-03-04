<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Services\Integration;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Services\Integration\MessengerDispatcher;

class MessengerDispatcherTest extends TestCase {

	use MockeryPHPUnitIntegration;

	private MessengerDispatcher $dispatcher;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
		$this->dispatcher = new MessengerDispatcher();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	private function makeTestLead(): array {
		return [
			'name'       => 'Max Mustermann',
			'email'      => 'test@example.com',
			'phone'      => '+49 170 1234567',
			'asset_type' => 'Mietpreis-Kalkulator',
			'location'   => 'München',
			'bundesland' => 'Bayern',
			'result'     => [
				'rent_per_sqm' => 18.50,
				'total_rent'   => 1572.50,
			],
			'timestamp'  => '2026-03-04T14:32:00+00:00',
		];
	}

	public function test_sendTest_sends_slack_payload(): void {
		$messenger = (object) [
			'id'          => 1,
			'platform'    => 'slack',
			'webhook_url' => 'https://hooks.slack.com/services/T123/B456/xxx',
		];

		Functions\expect( 'wp_json_encode' )
			->once()
			->andReturnUsing( fn( $v ) => json_encode( $v ) );
		Functions\expect( 'wp_date' )
			->once()
			->andReturn( '04.03.2026, 14:32' );
		Functions\expect( 'home_url' )
			->andReturn( 'https://example.com' );

		Functions\expect( 'wp_remote_post' )
			->once()
			->andReturnUsing( function ( $url, $args ) {
				$body = json_decode( $args['body'], true );
				// Slack payload should have text + blocks.
				$this->assertArrayHasKey( 'text', $body );
				$this->assertArrayHasKey( 'blocks', $body );
				$this->assertStringContainsString( 'Mietpreis-Kalkulator', $body['text'] );

				return [
					'response' => [ 'code' => 200 ],
					'body'     => 'ok',
				];
			} );

		Functions\expect( 'wp_remote_retrieve_response_code' )
			->once()
			->andReturn( 200 );

		$result = $this->dispatcher->sendTest( $messenger );

		$this->assertTrue( $result['success'] );
		$this->assertSame( 200, $result['statusCode'] );
	}

	public function test_sendTest_sends_teams_adaptive_card(): void {
		$messenger = (object) [
			'id'          => 2,
			'platform'    => 'teams',
			'webhook_url' => 'https://xxx.webhook.office.com/webhookb2/test',
		];

		Functions\expect( 'wp_json_encode' )
			->once()
			->andReturnUsing( fn( $v ) => json_encode( $v ) );
		Functions\expect( 'wp_date' )
			->once()
			->andReturn( '04.03.2026, 14:32' );

		Functions\expect( 'wp_remote_post' )
			->once()
			->andReturnUsing( function ( $url, $args ) {
				$body = json_decode( $args['body'], true );
				// Teams payload should have type=message + attachments with Adaptive Card.
				$this->assertSame( 'message', $body['type'] );
				$this->assertArrayHasKey( 'attachments', $body );
				$this->assertSame(
					'application/vnd.microsoft.card.adaptive',
					$body['attachments'][0]['contentType']
				);
				$this->assertSame( '1.4', $body['attachments'][0]['content']['version'] );

				return [
					'response' => [ 'code' => 200 ],
					'body'     => '',
				];
			} );

		Functions\expect( 'wp_remote_retrieve_response_code' )
			->once()
			->andReturn( 200 );

		$result = $this->dispatcher->sendTest( $messenger );

		$this->assertTrue( $result['success'] );
	}

	public function test_sendTest_sends_discord_embed(): void {
		$messenger = (object) [
			'id'          => 3,
			'platform'    => 'discord',
			'webhook_url' => 'https://discord.com/api/webhooks/123/abc',
		];

		Functions\expect( 'wp_json_encode' )
			->once()
			->andReturnUsing( fn( $v ) => json_encode( $v ) );
		Functions\expect( 'wp_date' )
			->once()
			->andReturn( '04.03.2026, 14:32' );

		Functions\expect( 'wp_remote_post' )
			->once()
			->andReturnUsing( function ( $url, $args ) {
				$body = json_decode( $args['body'], true );
				// Discord payload should have username + embeds.
				$this->assertSame( 'RESA', $body['username'] );
				$this->assertArrayHasKey( 'embeds', $body );
				$this->assertArrayHasKey( 'fields', $body['embeds'][0] );
				$this->assertArrayHasKey( 'color', $body['embeds'][0] );

				return [
					'response' => [ 'code' => 204 ],
					'body'     => '',
				];
			} );

		Functions\expect( 'wp_remote_retrieve_response_code' )
			->once()
			->andReturn( 204 );

		$result = $this->dispatcher->sendTest( $messenger );

		$this->assertTrue( $result['success'] );
		$this->assertSame( 204, $result['statusCode'] );
	}

	public function test_send_returns_error_on_wp_error(): void {
		$messenger = (object) [
			'id'          => 1,
			'platform'    => 'slack',
			'webhook_url' => 'https://hooks.slack.com/services/T123/B456/xxx',
		];

		Functions\expect( 'wp_json_encode' )
			->once()
			->andReturnUsing( fn( $v ) => json_encode( $v ) );
		Functions\expect( 'wp_date' )
			->once()
			->andReturn( '04.03.2026, 14:32' );

		$error = Mockery::mock( 'WP_Error' );
		$error->shouldReceive( 'get_error_message' )
			->andReturn( 'Connection timeout' );

		Functions\expect( 'wp_remote_post' )
			->once()
			->andReturn( $error );

		Functions\expect( 'is_wp_error' )
			->once()
			->andReturn( true );

		$result = $this->dispatcher->sendTest( $messenger );

		$this->assertFalse( $result['success'] );
		$this->assertSame( 'Connection timeout', $result['error'] );
	}

	public function test_send_returns_failure_for_non_2xx_status(): void {
		$messenger = (object) [
			'id'          => 1,
			'platform'    => 'slack',
			'webhook_url' => 'https://hooks.slack.com/services/T123/B456/xxx',
		];

		Functions\expect( 'wp_json_encode' )
			->once()
			->andReturnUsing( fn( $v ) => json_encode( $v ) );
		Functions\expect( 'wp_date' )
			->once()
			->andReturn( '04.03.2026, 14:32' );

		Functions\expect( 'wp_remote_post' )
			->once()
			->andReturn( [ 'response' => [ 'code' => 404 ] ] );

		Functions\expect( 'is_wp_error' )
			->once()
			->andReturn( false );

		Functions\expect( 'wp_remote_retrieve_response_code' )
			->once()
			->andReturn( 404 );

		$result = $this->dispatcher->sendTest( $messenger );

		$this->assertFalse( $result['success'] );
		$this->assertSame( 404, $result['statusCode'] );
	}

	public function test_unknown_platform_returns_error(): void {
		$messenger = (object) [
			'id'          => 1,
			'platform'    => 'whatsapp',
			'webhook_url' => 'https://example.com',
		];

		$result = $this->dispatcher->sendTest( $messenger );

		$this->assertFalse( $result['success'] );
		$this->assertStringContainsString( 'Unknown platform', $result['error'] );
	}
}
