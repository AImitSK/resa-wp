<?php

declare( strict_types=1 );

namespace Resa\Tests\Integration;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Services\Email\EmailService;
use Resa\Services\Email\EmailLogger;
use Resa\Services\Email\TransportInterface;

/**
 * Integration test: Email sending with transport detection, logging, and hooks.
 */
class EmailIntegrationTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';

		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\when( 'sanitize_email' )->returnArg();
		Functions\when( 'current_time' )->justReturn( '2025-06-01 12:00:00' );
		Functions\when( 'get_option' )->justReturn( '' );
		Functions\when( 'get_bloginfo' )->justReturn( 'Test Site' );
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	// ── Transport Detection ──────────────────────────────────

	public function test_detectTransport_waehlt_ersten_verfuegbaren(): void {
		$brevo = Mockery::mock( TransportInterface::class );
		$brevo->shouldReceive( 'isAvailable' )->once()->andReturn( true );
		$brevo->shouldReceive( 'getName' )->andReturn( 'brevo' );

		$wpMail = Mockery::mock( TransportInterface::class );
		$wpMail->shouldReceive( 'getName' )->andReturn( 'wp_mail' );

		$service = new EmailService( [ $brevo, $wpMail ] );
		$result  = $service->detectTransport();

		$this->assertSame( 'brevo', $result->getName() );
	}

	public function test_detectTransport_ueberspringt_nicht_verfuegbare(): void {
		$brevo = Mockery::mock( TransportInterface::class );
		$brevo->shouldReceive( 'isAvailable' )->once()->andReturn( false );

		$wpMail = Mockery::mock( TransportInterface::class );
		$wpMail->shouldReceive( 'isAvailable' )->once()->andReturn( true );
		$wpMail->shouldReceive( 'getName' )->andReturn( 'wp_mail' );

		$service = new EmailService( [ $brevo, $wpMail ] );
		$result  = $service->detectTransport();

		$this->assertSame( 'wp_mail', $result->getName() );
	}

	public function test_detectTransport_wirft_exception_ohne_transport(): void {
		$brevo = Mockery::mock( TransportInterface::class );
		$brevo->shouldReceive( 'isAvailable' )->once()->andReturn( false );

		$service = new EmailService( [ $brevo ] );

		$this->expectException( \RuntimeException::class );
		$this->expectExceptionMessage( 'Kein E-Mail-Transport' );

		$service->detectTransport();
	}

	// ── Send ─────────────────────────────────────────────────

	public function test_send_erfolgreich_loggt_und_feuert_action(): void {
		global $wpdb;

		$transport = Mockery::mock( TransportInterface::class );
		$transport->shouldReceive( 'isAvailable' )->andReturn( true );
		$transport->shouldReceive( 'send' )
			->once()
			->with(
				'test@example.com',
				'Ihre Mietpreis-Analyse',
				'<p>HTML</p>',
				Mockery::type( 'array' )
			);

		$service = new EmailService( [ $transport ] );

		// EmailLogger::log should be called.
		$wpdb->shouldReceive( 'insert' )
			->once()
			->with(
				'wp_resa_email_log',
				Mockery::on( fn( $data ) =>
					$data['lead_id'] === 42 &&
					$data['status'] === 'sent'
				),
				Mockery::type( 'array' )
			)
			->andReturnUsing( function () use ( $wpdb ) {
				$wpdb->insert_id = 1;
				return 1;
			} );

		Functions\expect( 'do_action' )
			->once()
			->with( 'resa_email_sent', 42, 'mietpreis', 'test@example.com' );

		$result = $service->send(
			42,
			'mietpreis',
			'test@example.com',
			'Ihre Mietpreis-Analyse',
			'<p>HTML</p>'
		);

		$this->assertTrue( $result );
	}

	public function test_send_fehler_loggt_fehlerstatus(): void {
		global $wpdb;

		$transport = Mockery::mock( TransportInterface::class );
		$transport->shouldReceive( 'isAvailable' )->andReturn( true );
		$transport->shouldReceive( 'send' )
			->once()
			->andThrow( new \RuntimeException( 'SMTP timeout' ) );

		$service = new EmailService( [ $transport ] );

		// Log with 'failed' status.
		$wpdb->shouldReceive( 'insert' )
			->once()
			->with(
				'wp_resa_email_log',
				Mockery::on( fn( $data ) =>
					$data['status'] === 'failed' &&
					$data['error_message'] === 'SMTP timeout'
				),
				Mockery::type( 'array' )
			)
			->andReturnUsing( function () use ( $wpdb ) {
				$wpdb->insert_id = 1;
				return 1;
			} );

		Functions\expect( 'do_action' )
			->once()
			->with( 'resa_email_failed', 42, 'SMTP timeout' );

		$result = $service->send( 42, 'mietpreis', 'test@example.com', 'Subject', '<p>Body</p>' );

		$this->assertFalse( $result );
	}

	// ── Template Variables ───────────────────────────────────

	public function test_renderVariables_ersetzt_platzhalter(): void {
		$template = 'Hallo {{name}}, Ihr Ergebnis: {{result}}€/m².';

		$rendered = EmailService::renderVariables( $template, [
			'name'   => 'Max Mustermann',
			'result' => '14.50',
		] );

		$this->assertSame( 'Hallo Max Mustermann, Ihr Ergebnis: 14.50€/m².', $rendered );
	}

	public function test_renderVariables_laesst_unbekannte_platzhalter(): void {
		$template = 'Hallo {{name}}, {{unknown}} bleibt.';

		$rendered = EmailService::renderVariables( $template, [ 'name' => 'Max' ] );

		$this->assertSame( 'Hallo Max, {{unknown}} bleibt.', $rendered );
	}

	// ── Transport Info ───────────────────────────────────────

	public function test_getTransportInfo_gibt_alle_transports_zurueck(): void {
		$brevo = Mockery::mock( TransportInterface::class );
		$brevo->shouldReceive( 'getName' )->andReturn( 'brevo' );
		$brevo->shouldReceive( 'isAvailable' )->andReturn( true );

		$wpMail = Mockery::mock( TransportInterface::class );
		$wpMail->shouldReceive( 'getName' )->andReturn( 'wp_mail' );
		$wpMail->shouldReceive( 'isAvailable' )->andReturn( true );

		$service = new EmailService( [ $brevo, $wpMail ] );
		$info    = $service->getTransportInfo();

		$this->assertArrayHasKey( 'brevo', $info );
		$this->assertArrayHasKey( 'wp_mail', $info );
		$this->assertTrue( $info['brevo']['available'] );
	}

	// ── Email Logger ─────────────────────────────────────────

	public function test_logger_findet_eintraege_fuer_lead(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'sql' );
		$wpdb->shouldReceive( 'get_results' )
			->once()
			->andReturn( [
				(object) [ 'id' => 1, 'lead_id' => 42, 'status' => 'sent', 'subject' => 'Analyse' ],
				(object) [ 'id' => 2, 'lead_id' => 42, 'status' => 'sent', 'subject' => 'Nachfass' ],
			] );

		$logs = EmailLogger::findByLead( 42 );

		$this->assertCount( 2, $logs );
		$this->assertSame( 'Analyse', $logs[0]->subject );
	}

	public function test_logger_updateStatus_setzt_opened_at(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'update' )
			->once()
			->with(
				'wp_resa_email_log',
				Mockery::on( fn( $data ) =>
					$data['status'] === 'opened' &&
					isset( $data['opened_at'] )
				),
				[ 'id' => 1 ],
				Mockery::type( 'array' ),
				[ '%d' ]
			)
			->andReturn( 1 );

		$this->assertTrue( EmailLogger::updateStatus( 1, 'opened', 'opened_at' ) );
	}

	public function test_logger_deleteOlderThan(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'sql' );
		$wpdb->shouldReceive( 'query' )->with( 'sql' )->once()->andReturn( 50 );

		$this->assertSame( 50, EmailLogger::deleteOlderThan( 90 ) );
	}
}
