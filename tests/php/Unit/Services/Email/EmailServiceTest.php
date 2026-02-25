<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Services\Email;

use Brain\Monkey;
use Brain\Monkey\Actions;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Services\Email\EmailService;
use Resa\Services\Email\TransportInterface;

class EmailServiceTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		// Stub DB calls from EmailLogger.
		global $wpdb;
		$wpdb            = Mockery::mock( 'wpdb' );
		$wpdb->prefix    = 'wp_';
		$wpdb->insert_id = 1;

		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\when( 'sanitize_email' )->returnArg();
		Functions\when( 'current_time' )->justReturn( '2026-02-25 12:00:00' );
		Functions\when( 'get_option' )->justReturn( '' );
		Functions\when( 'get_bloginfo' )->justReturn( 'RESA Test' );
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_detectTransport_returns_first_available(): void {
		$brevo = Mockery::mock( TransportInterface::class );
		$brevo->shouldReceive( 'isAvailable' )->andReturn( true );

		$smtp = Mockery::mock( TransportInterface::class );

		$service   = new EmailService( [ $brevo, $smtp ] );
		$transport = $service->detectTransport();

		$this->assertSame( $brevo, $transport );
	}

	public function test_detectTransport_skips_unavailable(): void {
		$brevo = Mockery::mock( TransportInterface::class );
		$brevo->shouldReceive( 'isAvailable' )->andReturn( false );

		$smtp = Mockery::mock( TransportInterface::class );
		$smtp->shouldReceive( 'isAvailable' )->andReturn( true );

		$service   = new EmailService( [ $brevo, $smtp ] );
		$transport = $service->detectTransport();

		$this->assertSame( $smtp, $transport );
	}

	public function test_detectTransport_throws_when_none_available(): void {
		$transport = Mockery::mock( TransportInterface::class );
		$transport->shouldReceive( 'isAvailable' )->andReturn( false );

		$service = new EmailService( [ $transport ] );

		$this->expectException( \RuntimeException::class );
		$service->detectTransport();
	}

	public function test_send_delegates_to_transport(): void {
		global $wpdb;
		$wpdb->shouldReceive( 'insert' )->once()->andReturn( 1 );

		$transport = Mockery::mock( TransportInterface::class );
		$transport->shouldReceive( 'isAvailable' )->andReturn( true );
		$transport->shouldReceive( 'send' )
			->once()
			->with(
				'max@test.de',
				'Ihre Analyse',
				'<h1>Ergebnis</h1>',
				Mockery::type( 'array' )
			)
			->andReturn( true );

		$service = new EmailService( [ $transport ] );
		$result  = $service->send( 1, 'mietpreis', 'max@test.de', 'Ihre Analyse', '<h1>Ergebnis</h1>' );

		$this->assertTrue( $result );
	}

	public function test_send_logs_success(): void {
		global $wpdb;
		$wpdb->shouldReceive( 'insert' )
			->once()
			->with(
				'wp_resa_email_log',
				Mockery::on( function ( array $data ): bool {
					return $data['status'] === 'sent'
						&& $data['lead_id'] === 5
						&& $data['template_id'] === 'mietpreis';
				} ),
				Mockery::type( 'array' )
			)
			->andReturn( 1 );

		$transport = Mockery::mock( TransportInterface::class );
		$transport->shouldReceive( 'isAvailable' )->andReturn( true );
		$transport->shouldReceive( 'send' )->andReturn( true );

		$service = new EmailService( [ $transport ] );
		$service->send( 5, 'mietpreis', 'max@test.de', 'Test', '<p>OK</p>' );
	}

	public function test_send_logs_failure_and_returns_false(): void {
		global $wpdb;
		$wpdb->shouldReceive( 'insert' )
			->once()
			->with(
				'wp_resa_email_log',
				Mockery::on( function ( array $data ): bool {
					return $data['status'] === 'failed'
						&& $data['error_message'] === 'SMTP timeout';
				} ),
				Mockery::type( 'array' )
			)
			->andReturn( 1 );

		$transport = Mockery::mock( TransportInterface::class );
		$transport->shouldReceive( 'isAvailable' )->andReturn( true );
		$transport->shouldReceive( 'send' )->andThrow( new \RuntimeException( 'SMTP timeout' ) );

		$service = new EmailService( [ $transport ] );
		$result  = $service->send( 5, 'mietpreis', 'max@test.de', 'Test', '<p>Fail</p>' );

		$this->assertFalse( $result );
	}

	public function test_renderVariables_replaces_placeholders(): void {
		$template = 'Hallo {{vorname}}, Ihre Analyse für {{city}} ist fertig.';
		$result   = EmailService::renderVariables( $template, [
			'vorname' => 'Max',
			'city'    => 'Berlin',
		] );

		$this->assertSame( 'Hallo Max, Ihre Analyse für Berlin ist fertig.', $result );
	}

	public function test_renderVariables_ignores_unknown_placeholders(): void {
		$template = 'Hallo {{vorname}}, {{unknown}} Platzhalter.';
		$result   = EmailService::renderVariables( $template, [
			'vorname' => 'Max',
		] );

		$this->assertSame( 'Hallo Max, {{unknown}} Platzhalter.', $result );
	}

	public function test_getTransportInfo_lists_all_transports(): void {
		$brevo = Mockery::mock( TransportInterface::class );
		$brevo->shouldReceive( 'isAvailable' )->andReturn( true );
		$brevo->shouldReceive( 'getName' )->andReturn( 'brevo' );

		$smtp = Mockery::mock( TransportInterface::class );
		$smtp->shouldReceive( 'isAvailable' )->andReturn( false );
		$smtp->shouldReceive( 'getName' )->andReturn( 'smtp' );

		$service = new EmailService( [ $brevo, $smtp ] );
		$info    = $service->getTransportInfo();

		$this->assertArrayHasKey( 'brevo', $info );
		$this->assertArrayHasKey( 'smtp', $info );
		$this->assertTrue( $info['brevo']['available'] );
		$this->assertFalse( $info['smtp']['available'] );
	}

	public function test_send_fires_resa_email_sent_action(): void {
		global $wpdb;
		$wpdb->shouldReceive( 'insert' )->andReturn( 1 );

		$transport = Mockery::mock( TransportInterface::class );
		$transport->shouldReceive( 'isAvailable' )->andReturn( true );
		$transport->shouldReceive( 'send' )->andReturn( true );

		Actions\expectDone( 'resa_email_sent' )
			->once()
			->with( 1, 'mietpreis', 'max@test.de' );

		$service = new EmailService( [ $transport ] );
		$service->send( 1, 'mietpreis', 'max@test.de', 'Test', '<p>OK</p>' );
	}

	public function test_send_fires_resa_email_failed_action(): void {
		global $wpdb;
		$wpdb->shouldReceive( 'insert' )->andReturn( 1 );

		$transport = Mockery::mock( TransportInterface::class );
		$transport->shouldReceive( 'isAvailable' )->andReturn( true );
		$transport->shouldReceive( 'send' )->andThrow( new \RuntimeException( 'Fehler' ) );

		Actions\expectDone( 'resa_email_failed' )
			->once()
			->with( 1, 'Fehler' );

		$service = new EmailService( [ $transport ] );
		$service->send( 1, 'mietpreis', 'max@test.de', 'Test', '<p>Fail</p>' );
	}
}
