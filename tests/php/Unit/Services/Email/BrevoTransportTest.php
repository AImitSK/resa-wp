<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Services\Email;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Services\Email\BrevoTransport;

class BrevoTransportTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_getName_returns_brevo(): void {
		$transport = new BrevoTransport( 'xkeysib-test' );
		$this->assertSame( 'brevo', $transport->getName() );
	}

	public function test_isAvailable_returns_true_with_api_key(): void {
		$transport = new BrevoTransport( 'xkeysib-test' );
		$this->assertTrue( $transport->isAvailable() );
	}

	public function test_isAvailable_returns_false_without_api_key(): void {
		$transport = new BrevoTransport( '' );
		$this->assertFalse( $transport->isAvailable() );
	}

	public function test_send_throws_when_no_api_key(): void {
		$transport = new BrevoTransport( '' );

		$this->expectException( \RuntimeException::class );
		$this->expectExceptionMessage( 'API-Key' );
		$transport->send( 'test@example.de', 'Test', '<p>Body</p>' );
	}

	public function test_send_calls_brevo_api(): void {
		Functions\when( 'get_bloginfo' )->alias(
			function ( string $show ): string {
				return $show === 'name' ? 'Test Blog' : 'admin@test.de';
			}
		);
		Functions\when( 'wp_json_encode' )->alias( 'json_encode' );

		Functions\expect( 'wp_remote_post' )
			->once()
			->with(
				'https://api.brevo.com/v3/smtp/email',
				\Mockery::on( function ( array $args ): bool {
					$this->assertSame( 'application/json', $args['headers']['content-type'] );
					$this->assertSame( 'xkeysib-123', $args['headers']['api-key'] );

					$body = json_decode( $args['body'], true );
					$this->assertSame( 'test@example.de', $body['to'][0]['email'] );
					$this->assertSame( 'Betreff', $body['subject'] );
					$this->assertSame( '<h1>Hallo</h1>', $body['htmlContent'] );

					return true;
				} )
			)
			->andReturn( [ 'response' => [ 'code' => 201 ] ] );

		Functions\when( 'wp_remote_retrieve_response_code' )->justReturn( 201 );
		Functions\when( 'is_wp_error' )->justReturn( false );

		$transport = new BrevoTransport( 'xkeysib-123' );
		$result    = $transport->send( 'test@example.de', 'Betreff', '<h1>Hallo</h1>' );

		$this->assertTrue( $result );
	}

	public function test_send_includes_reply_to(): void {
		Functions\when( 'get_bloginfo' )->justReturn( 'Test' );
		Functions\when( 'wp_json_encode' )->alias( 'json_encode' );

		Functions\expect( 'wp_remote_post' )
			->once()
			->with(
				\Mockery::any(),
				\Mockery::on( function ( array $args ): bool {
					$body = json_decode( $args['body'], true );
					$this->assertSame( 'reply@example.de', $body['replyTo']['email'] );
					return true;
				} )
			)
			->andReturn( [ 'response' => [ 'code' => 201 ] ] );

		Functions\when( 'wp_remote_retrieve_response_code' )->justReturn( 201 );
		Functions\when( 'is_wp_error' )->justReturn( false );

		$transport = new BrevoTransport( 'xkeysib-123' );
		$transport->send(
			'test@example.de',
			'Test',
			'<p>Body</p>',
			[ 'reply_to' => 'reply@example.de' ]
		);
	}

	public function test_send_throws_on_wp_error(): void {
		Functions\when( 'get_bloginfo' )->justReturn( 'Test' );
		Functions\when( 'wp_json_encode' )->alias( 'json_encode' );

		$wpError = \Mockery::mock( 'WP_Error' );
		$wpError->shouldReceive( 'get_error_message' )->andReturn( 'Connection timeout' );

		Functions\expect( 'wp_remote_post' )->andReturn( $wpError );
		Functions\when( 'is_wp_error' )->justReturn( true );

		$transport = new BrevoTransport( 'xkeysib-123' );

		$this->expectException( \RuntimeException::class );
		$this->expectExceptionMessage( 'Connection timeout' );
		$transport->send( 'test@example.de', 'Test', '<p>Body</p>' );
	}

	public function test_send_throws_on_api_error_status(): void {
		Functions\when( 'get_bloginfo' )->justReturn( 'Test' );
		Functions\when( 'wp_json_encode' )->alias( 'json_encode' );

		Functions\expect( 'wp_remote_post' )->andReturn( [ 'response' => [ 'code' => 400 ] ] );
		Functions\when( 'is_wp_error' )->justReturn( false );
		Functions\when( 'wp_remote_retrieve_response_code' )->justReturn( 400 );
		Functions\when( 'wp_remote_retrieve_body' )->justReturn( '{"message":"Invalid email"}' );

		$transport = new BrevoTransport( 'xkeysib-123' );

		$this->expectException( \RuntimeException::class );
		$this->expectExceptionMessage( 'HTTP 400' );
		$transport->send( 'test@example.de', 'Test', '<p>Body</p>' );
	}

	public function test_implements_interface(): void {
		$transport = new BrevoTransport( '' );
		$this->assertInstanceOf( \Resa\Services\Email\TransportInterface::class, $transport );
	}
}
