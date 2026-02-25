<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Services\Email;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Brain\Monkey\Actions;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Services\Email\SmtpTransport;

class SmtpTransportTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	private function validConfig(): array {
		return [
			'host'       => 'mail.example.de',
			'port'       => 587,
			'user'       => 'user@example.de',
			'password'   => 'secret',
			'encryption' => 'tls',
		];
	}

	public function test_getName_returns_smtp(): void {
		$transport = new SmtpTransport( $this->validConfig() );
		$this->assertSame( 'smtp', $transport->getName() );
	}

	public function test_isAvailable_returns_true_with_valid_config(): void {
		$transport = new SmtpTransport( $this->validConfig() );
		$this->assertTrue( $transport->isAvailable() );
	}

	public function test_isAvailable_returns_false_without_host(): void {
		$config = $this->validConfig();
		unset( $config['host'] );

		$transport = new SmtpTransport( $config );
		$this->assertFalse( $transport->isAvailable() );
	}

	public function test_isAvailable_returns_false_with_empty_config(): void {
		$transport = new SmtpTransport( [] );
		$this->assertFalse( $transport->isAvailable() );
	}

	public function test_send_throws_when_not_configured(): void {
		$transport = new SmtpTransport( [] );

		$this->expectException( \RuntimeException::class );
		$this->expectExceptionMessage( 'nicht konfiguriert' );
		$transport->send( 'test@example.de', 'Test', '<p>Body</p>' );
	}

	public function test_send_hooks_phpmailer_init_and_calls_wp_mail(): void {
		Actions\expectAdded( 'phpmailer_init' )->once();

		Functions\expect( 'wp_mail' )->once()->andReturn( true );
		Functions\expect( 'remove_action' )->once();

		$transport = new SmtpTransport( $this->validConfig() );
		$result    = $transport->send( 'test@example.de', 'Test', '<p>Body</p>' );

		$this->assertTrue( $result );
	}

	public function test_send_throws_when_wp_mail_fails(): void {
		Functions\when( 'add_action' )->justReturn( true );
		Functions\expect( 'wp_mail' )->once()->andReturn( false );
		Functions\when( 'remove_action' )->justReturn( true );

		$transport = new SmtpTransport( $this->validConfig() );

		$this->expectException( \RuntimeException::class );
		$this->expectExceptionMessage( 'fehlgeschlagen' );
		$transport->send( 'test@example.de', 'Test', '<p>Body</p>' );
	}

	public function test_send_removes_hook_after_success(): void {
		Functions\when( 'add_action' )->justReturn( true );
		Functions\expect( 'wp_mail' )->once()->andReturn( true );
		Functions\expect( 'remove_action' )->once()->with( 'phpmailer_init', \Mockery::type( 'Closure' ) );

		$transport = new SmtpTransport( $this->validConfig() );
		$transport->send( 'test@example.de', 'Test', '<p>Body</p>' );
	}

	public function test_send_removes_hook_after_failure(): void {
		Functions\when( 'add_action' )->justReturn( true );
		Functions\expect( 'wp_mail' )->once()->andReturn( false );
		Functions\expect( 'remove_action' )->once();

		$transport = new SmtpTransport( $this->validConfig() );

		try {
			$transport->send( 'test@example.de', 'Test', '<p>Body</p>' );
		} catch ( \RuntimeException $e ) {
			// Expected.
		}
	}

	public function test_implements_interface(): void {
		$transport = new SmtpTransport( [] );
		$this->assertInstanceOf( \Resa\Services\Email\TransportInterface::class, $transport );
	}
}
