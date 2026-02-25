<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Services\Email;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Services\Email\WpMailTransport;

class WpMailTransportTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_getName_returns_wp_mail(): void {
		$transport = new WpMailTransport();
		$this->assertSame( 'wp_mail', $transport->getName() );
	}

	public function test_isAvailable_returns_true_when_wp_mail_exists(): void {
		Functions\when( 'wp_mail' )->justReturn( true );

		$transport = new WpMailTransport();
		$this->assertTrue( $transport->isAvailable() );
	}

	public function test_send_calls_wp_mail_with_correct_params(): void {
		Functions\expect( 'wp_mail' )
			->once()
			->with(
				'test@example.de',
				'Betreff',
				'<h1>Hallo</h1>',
				\Mockery::on( function ( array $headers ): bool {
					return in_array( 'Content-Type: text/html; charset=UTF-8', $headers, true );
				} ),
				[]
			)
			->andReturn( true );

		$transport = new WpMailTransport();
		$result    = $transport->send( 'test@example.de', 'Betreff', '<h1>Hallo</h1>' );

		$this->assertTrue( $result );
	}

	public function test_send_includes_from_header(): void {
		Functions\expect( 'wp_mail' )
			->once()
			->with(
				'test@example.de',
				'Test',
				'<p>Body</p>',
				\Mockery::on( function ( array $headers ): bool {
					return in_array( 'From: Makler <makler@domain.de>', $headers, true );
				} ),
				[]
			)
			->andReturn( true );

		$transport = new WpMailTransport();
		$transport->send(
			'test@example.de',
			'Test',
			'<p>Body</p>',
			[
				'from_name'  => 'Makler',
				'from_email' => 'makler@domain.de',
			]
		);
	}

	public function test_send_includes_reply_to_header(): void {
		Functions\expect( 'wp_mail' )
			->once()
			->with(
				'test@example.de',
				'Test',
				'<p>Body</p>',
				\Mockery::on( function ( array $headers ): bool {
					return in_array( 'Reply-To: reply@domain.de', $headers, true );
				} ),
				[]
			)
			->andReturn( true );

		$transport = new WpMailTransport();
		$transport->send(
			'test@example.de',
			'Test',
			'<p>Body</p>',
			[ 'reply_to' => 'reply@domain.de' ]
		);
	}

	public function test_send_throws_when_wp_mail_fails(): void {
		Functions\expect( 'wp_mail' )->andReturn( false );

		$transport = new WpMailTransport();

		$this->expectException( \RuntimeException::class );
		$transport->send( 'test@example.de', 'Test', '<p>Body</p>' );
	}

	public function test_implements_interface(): void {
		$transport = new WpMailTransport();
		$this->assertInstanceOf( \Resa\Services\Email\TransportInterface::class, $transport );
	}
}
