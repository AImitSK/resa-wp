<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Services\Notifications;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Services\Email\EmailService;
use Resa\Services\Notifications\LeadNotificationService;

class LeadNotificationServiceTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		// Stub DB calls.
		global $wpdb;
		$wpdb            = Mockery::mock( 'wpdb' );
		$wpdb->prefix    = 'wp_';
		$wpdb->insert_id = 1;

		// Stub common WordPress functions.
		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\when( 'sanitize_email' )->returnArg();
		Functions\when( 'sanitize_textarea_field' )->returnArg();
		Functions\when( 'current_time' )->justReturn( '2026-02-26 12:00:00' );
		Functions\when( 'get_bloginfo' )->justReturn( 'RESA Test' );
		Functions\when( 'admin_url' )->alias( function ( $path = '' ) {
			return 'https://example.com/wp-admin/' . $path;
		} );
		Functions\when( 'is_email' )->alias( function ( $email ) {
			return filter_var( $email, FILTER_VALIDATE_EMAIL ) !== false;
		} );
		Functions\when( 'esc_html' )->returnArg();
		Functions\when( 'esc_url' )->returnArg();
		Functions\when( 'esc_attr' )->returnArg();
		Functions\when( '__' )->returnArg();
		Functions\when( 'esc_html__' )->returnArg();
		Functions\when( 'wp_json_encode' )->alias( 'json_encode' );
		Functions\when( 'wp_date' )->justReturn( '26.02.2026 12:00' );
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_notifyAgent_returns_false_when_disabled(): void {
		Functions\when( 'get_option' )->alias( function ( $key, $default = '' ) {
			if ( $key === 'resa_notification_enabled' ) {
				return false;
			}
			return $default;
		} );

		$emailService = Mockery::mock( EmailService::class );
		$emailService->shouldNotReceive( 'send' );

		$service = new LeadNotificationService( $emailService );
		$result  = $service->notifyAgent( 1 );

		$this->assertFalse( $result );
	}

	public function test_notifyAgent_returns_false_when_lead_not_found(): void {
		global $wpdb;
		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SELECT * FROM wp_resa_leads WHERE id = 1 LIMIT 1' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( null );

		Functions\when( 'get_option' )->justReturn( true );

		$emailService = Mockery::mock( EmailService::class );
		$emailService->shouldNotReceive( 'send' );

		$service = new LeadNotificationService( $emailService );
		$result  = $service->notifyAgent( 999 );

		$this->assertFalse( $result );
	}

	public function test_notifyAgent_sends_email_to_agent(): void {
		$lead = (object) [
			'id'          => 1,
			'location_id' => 5,
			'first_name'  => 'Max',
			'last_name'   => 'Mustermann',
			'email'       => 'max@test.de',
			'phone'       => '+49123456789',
			'company'     => 'Test GmbH',
			'message'     => 'Ich interessiere mich für eine Bewertung.',
			'asset_type'  => 'rent-calculator',
			'result'      => '{"estimatedRent": 1200}',
			'created_at'  => '2026-02-26 12:00:00',
		];

		$location = (object) [
			'id'       => 5,
			'name'     => 'Berlin',
			'agent_id' => 10,
		];

		$agent = Mockery::mock( \WP_User::class );
		$agent->user_email   = 'agent@immobilien.de';
		$agent->display_name = 'Herr Agent';

		global $wpdb;
		// First call: Lead::findById.
		$wpdb->shouldReceive( 'prepare' )
			->with( Mockery::pattern( '/resa_leads.*id = %d/' ), 1 )
			->andReturn( 'SELECT * FROM wp_resa_leads WHERE id = 1 LIMIT 1' );
		$wpdb->shouldReceive( 'get_row' )
			->with( 'SELECT * FROM wp_resa_leads WHERE id = 1 LIMIT 1' )
			->andReturn( $lead );

		// Second call: Location::findById.
		$wpdb->shouldReceive( 'prepare' )
			->with( Mockery::pattern( '/resa_locations.*id = %d/' ), 5 )
			->andReturn( 'SELECT * FROM wp_resa_locations WHERE id = 5 LIMIT 1' );
		$wpdb->shouldReceive( 'get_row' )
			->with( 'SELECT * FROM wp_resa_locations WHERE id = 5 LIMIT 1' )
			->andReturn( $location );

		Functions\when( 'get_option' )->alias( function ( $key, $default = '' ) {
			$options = [
				'resa_notification_enabled'        => true,
				'resa_notification_fallback_email' => '',
				'admin_email'                      => 'admin@test.de',
				'date_format'                      => 'd.m.Y',
				'time_format'                      => 'H:i',
			];
			return $options[ $key ] ?? $default;
		} );

		Functions\when( 'get_user_by' )->justReturn( $agent );

		$emailService = Mockery::mock( EmailService::class );
		$emailService->shouldReceive( 'send' )
			->once()
			->with(
				1,
				'lead-notification',
				'agent@immobilien.de',
				Mockery::pattern( '/Neuer Lead.*Mietpreis-Kalkulator.*Max Mustermann/' ),
				Mockery::type( 'string' )
			)
			->andReturn( true );

		$service = new LeadNotificationService( $emailService );
		$result  = $service->notifyAgent( 1 );

		$this->assertTrue( $result );
	}

	public function test_notifyAgent_falls_back_to_admin_email(): void {
		$lead = (object) [
			'id'          => 2,
			'location_id' => 0, // No location.
			'first_name'  => 'Test',
			'last_name'   => 'User',
			'email'       => 'user@test.de',
			'phone'       => '',
			'asset_type'  => 'value-calculator',
			'result'      => '{}',
			'created_at'  => '2026-02-26 10:00:00',
		];

		global $wpdb;
		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SELECT ...' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( $lead );

		Functions\when( 'get_option' )->alias( function ( $key, $default = '' ) {
			$options = [
				'resa_notification_enabled'        => true,
				'resa_notification_fallback_email' => '',
				'admin_email'                      => 'admin@fallback.de',
				'date_format'                      => 'd.m.Y',
				'time_format'                      => 'H:i',
			];
			return $options[ $key ] ?? $default;
		} );

		$emailService = Mockery::mock( EmailService::class );
		$emailService->shouldReceive( 'send' )
			->once()
			->with(
				2,
				'lead-notification',
				'admin@fallback.de', // Fallback to admin.
				Mockery::type( 'string' ),
				Mockery::type( 'string' )
			)
			->andReturn( true );

		$service = new LeadNotificationService( $emailService );
		$result  = $service->notifyAgent( 2 );

		$this->assertTrue( $result );
	}

	public function test_notifyAgent_uses_fallback_email_setting(): void {
		$lead = (object) [
			'id'          => 3,
			'location_id' => 5,
			'first_name'  => 'Test',
			'last_name'   => '',
			'email'       => 'test@test.de',
			'asset_type'  => 'budget-calculator',
			'result'      => '{"totalBudget": 250000}',
			'created_at'  => '2026-02-26 11:00:00',
		];

		$location = (object) [
			'id'       => 5,
			'name'     => 'Hamburg',
			'agent_id' => 99, // Invalid user.
		];

		global $wpdb;
		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SELECT ...' );
		$wpdb->shouldReceive( 'get_row' )
			->andReturn( $lead, $location );

		Functions\when( 'get_option' )->alias( function ( $key, $default = '' ) {
			$options = [
				'resa_notification_enabled'        => true,
				'resa_notification_fallback_email' => 'fallback@immobilien.de',
				'admin_email'                      => 'admin@test.de',
				'date_format'                      => 'd.m.Y',
				'time_format'                      => 'H:i',
			];
			return $options[ $key ] ?? $default;
		} );

		// Invalid user ID returns false.
		Functions\when( 'get_user_by' )->justReturn( false );

		$emailService = Mockery::mock( EmailService::class );
		$emailService->shouldReceive( 'send' )
			->once()
			->with(
				3,
				'lead-notification',
				'fallback@immobilien.de', // Configured fallback.
				Mockery::type( 'string' ),
				Mockery::type( 'string' )
			)
			->andReturn( true );

		$service = new LeadNotificationService( $emailService );
		$result  = $service->notifyAgent( 3 );

		$this->assertTrue( $result );
	}

	public function test_notifyAgent_catches_email_exceptions(): void {
		$lead = (object) [
			'id'          => 4,
			'location_id' => 0,
			'first_name'  => 'Error',
			'last_name'   => 'Test',
			'email'       => 'error@test.de',
			'asset_type'  => 'rent-calculator',
			'result'      => '{}',
			'created_at'  => '2026-02-26 12:00:00',
		];

		global $wpdb;
		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SELECT ...' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( $lead );

		Functions\when( 'get_option' )->alias( function ( $key, $default = '' ) {
			$options = [
				'resa_notification_enabled' => true,
				'admin_email'               => 'admin@test.de',
				'date_format'               => 'd.m.Y',
				'time_format'               => 'H:i',
			];
			return $options[ $key ] ?? $default;
		} );

		$emailService = Mockery::mock( EmailService::class );
		$emailService->shouldReceive( 'send' )
			->andThrow( new \RuntimeException( 'SMTP connection failed' ) );

		$service = new LeadNotificationService( $emailService );
		$result  = $service->notifyAgent( 4 );

		// Should return false but not throw.
		$this->assertFalse( $result );
	}

	public function test_subject_includes_asset_type_and_lead_name(): void {
		$lead = (object) [
			'id'          => 5,
			'location_id' => 0,
			'first_name'  => 'Anna',
			'last_name'   => 'Schmidt',
			'email'       => 'anna@test.de',
			'asset_type'  => 'purchase-costs',
			'result'      => '{}',
			'created_at'  => '2026-02-26 12:00:00',
		];

		global $wpdb;
		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SELECT ...' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( $lead );

		Functions\when( 'get_option' )->alias( function ( $key, $default = '' ) {
			$options = [
				'resa_notification_enabled' => true,
				'admin_email'               => 'admin@test.de',
				'date_format'               => 'd.m.Y',
				'time_format'               => 'H:i',
			];
			return $options[ $key ] ?? $default;
		} );

		$capturedSubject = '';

		$emailService = Mockery::mock( EmailService::class );
		$emailService->shouldReceive( 'send' )
			->once()
			->withArgs( function ( $leadId, $template, $to, $subject, $html ) use ( &$capturedSubject ) {
				$capturedSubject = $subject;
				return true;
			} )
			->andReturn( true );

		$service = new LeadNotificationService( $emailService );
		$service->notifyAgent( 5 );

		$this->assertStringContainsString( 'Kaufnebenkosten-Rechner', $capturedSubject );
		$this->assertStringContainsString( 'Anna Schmidt', $capturedSubject );
	}
}
