<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Services\Pdf;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Services\Email\EmailService;
use Resa\Services\Pdf\LeadPdfService;
use Resa\Services\Pdf\PdfGenerator;

class LeadPdfServiceTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		// Create temp PDF directory so file_put_contents doesn't warn.
		if ( ! is_dir( '/tmp/wp-uploads/resa-pdfs' ) ) {
			mkdir( '/tmp/wp-uploads/resa-pdfs', 0777, true );
		}

		// Stub DB calls.
		global $wpdb;
		$wpdb            = Mockery::mock( 'wpdb' );
		$wpdb->prefix    = 'wp_';
		$wpdb->insert_id = 1;

		// Stub common WordPress functions.
		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\when( 'sanitize_email' )->returnArg();
		Functions\when( 'sanitize_file_name' )->alias( function ( $name ) {
			return preg_replace( '/[^a-zA-Z0-9_.-]/', '', $name );
		} );
		Functions\when( 'current_time' )->justReturn( '2026-02-26 12:00:00' );
		Functions\when( 'get_bloginfo' )->justReturn( 'RESA Test' );
		Functions\when( 'is_email' )->alias( function ( $email ) {
			return filter_var( $email, FILTER_VALIDATE_EMAIL ) !== false;
		} );
		Functions\when( 'esc_html' )->returnArg();
		Functions\when( 'esc_url' )->returnArg();
		Functions\when( 'esc_attr' )->returnArg();
		Functions\when( '__' )->returnArg();
		Functions\when( 'esc_html__' )->returnArg();
		Functions\when( 'esc_html_e' )->alias( function ( $text ) {
			echo $text;
		} );
		Functions\when( 'wp_json_encode' )->alias( 'json_encode' );
		Functions\when( 'wp_date' )->justReturn( '26.02.2026' );
		Functions\when( 'wp_generate_password' )->justReturn( 'abc12345' );
		Functions\when( 'wp_mkdir_p' )->justReturn( true );
		Functions\when( 'wp_upload_dir' )->justReturn( [
			'basedir' => '/tmp/wp-uploads',
			'baseurl' => 'https://example.com/wp-content/uploads',
		] );
		Functions\when( 'wp_remote_get' )->justReturn( new \WP_Error( 'test', 'mocked' ) );
		Functions\when( 'wp_remote_retrieve_response_code' )->justReturn( 200 );
		Functions\when( 'wp_remote_retrieve_body' )->justReturn( '' );
		Functions\when( 'wp_remote_retrieve_header' )->justReturn( '' );
		Functions\when( 'admin_url' )->justReturn( 'https://example.com/wp-admin/' );
		Functions\when( 'is_wp_error' )->alias( function ( $thing ) {
			return $thing instanceof \WP_Error;
		} );
		Functions\when( 'number_format_i18n' )->alias( function ( $number, $decimals = 0 ) {
			return number_format( (float) $number, $decimals, ',', '.' );
		} );
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_generateAndSend_returns_false_when_disabled(): void {
		Functions\when( 'get_option' )->alias( function ( $key, $default = false ) {
			if ( $key === 'resa_lead_pdf_enabled' ) {
				return false;
			}
			return $default;
		} );

		$pdfGenerator = Mockery::mock( PdfGenerator::class );
		$pdfGenerator->shouldNotReceive( 'generateToFile' );

		$emailService = Mockery::mock( EmailService::class );
		$emailService->shouldNotReceive( 'send' );

		$service = new LeadPdfService( $pdfGenerator, $emailService );
		$result  = $service->generateAndSend( 1 );

		$this->assertFalse( $result );
	}

	public function test_generateAndSend_returns_false_when_lead_not_found(): void {
		global $wpdb;
		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SELECT * FROM wp_resa_leads WHERE id = 1 LIMIT 1' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( null );

		Functions\when( 'get_option' )->justReturn( true );

		$pdfGenerator = Mockery::mock( PdfGenerator::class );
		$pdfGenerator->shouldNotReceive( 'generateToFile' );

		$emailService = Mockery::mock( EmailService::class );
		$emailService->shouldNotReceive( 'send' );

		$service = new LeadPdfService( $pdfGenerator, $emailService );
		$result  = $service->generateAndSend( 999 );

		$this->assertFalse( $result );
	}

	public function test_generateAndSend_returns_false_when_lead_has_no_email(): void {
		$lead = (object) [
			'id'          => 1,
			'location_id' => 5,
			'first_name'  => 'Max',
			'last_name'   => 'Mustermann',
			'email'       => '', // No email.
			'asset_type'  => 'rent-calculator',
			'result'      => '{"estimatedRent": 1200}',
		];

		global $wpdb;
		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SELECT ...' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( $lead );

		Functions\when( 'get_option' )->justReturn( true );

		$pdfGenerator = Mockery::mock( PdfGenerator::class );
		$pdfGenerator->shouldNotReceive( 'generateToFile' );

		$emailService = Mockery::mock( EmailService::class );
		$emailService->shouldNotReceive( 'send' );

		$service = new LeadPdfService( $pdfGenerator, $emailService );
		$result  = $service->generateAndSend( 1 );

		$this->assertFalse( $result );
	}

	public function test_generateAndSend_generates_pdf_and_sends_email(): void {
		$lead = (object) [
			'id'          => 1,
			'location_id' => 5,
			'first_name'  => 'Max',
			'last_name'   => 'Mustermann',
			'email'       => 'max@test.de',
			'salutation'  => 'Herr',
			'asset_type'  => 'rent-calculator',
			'inputs'      => '{"livingArea": 80, "rooms": 3, "constructionYear": 1990}',
			'result'      => '{"estimatedRent": 1200, "pricePerSqm": 15, "cityAverage": 14, "countyAverage": 12}',
		];

		$location = (object) [
			'id'       => 5,
			'name'     => 'Berlin',
			'agent_id' => 10,
		];

		$agent = Mockery::mock( \WP_User::class );
		$agent->ID           = 10;
		$agent->user_email   = 'agent@immobilien.de';
		$agent->display_name = 'Herr Agent';
		$agent->first_name   = '';
		$agent->last_name    = '';

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

		Functions\when( 'get_option' )->alias( function ( $key, $default = false ) {
			$options = [
				'resa_lead_pdf_enabled'              => true,
				'resa_branding_logo_url'             => 'https://example.com/logo.png',
				'resa_branding_primary_color'        => '#3b82f6',
				'resa_branding_secondary_color'      => '#1e303a',
				'resa_branding_email_header_bg'      => '#ffffff',
				'resa_branding_show_powered_by'      => '1',
			];
			return array_key_exists( $key, $options ) ? $options[ $key ] : $default;
		} );

		// Agent::getDefault() is called by EmailService::getBrandingVars() in the email template.
		$wpdb->shouldReceive( 'prepare' )
			->with( Mockery::pattern( '/resa_agents/' ), Mockery::any() )
			->andReturn( 'SELECT * FROM wp_resa_agents WHERE is_active = 1 ORDER BY id ASC LIMIT 1' );
		$wpdb->shouldReceive( 'get_row' )
			->with( 'SELECT * FROM wp_resa_agents WHERE is_active = 1 ORDER BY id ASC LIMIT 1' )
			->andReturn( null );

		Functions\when( 'get_user_by' )->justReturn( $agent );
		Functions\when( 'get_user_meta' )->justReturn( '' );
		$pdfGenerator = Mockery::mock( PdfGenerator::class );
		$pdfGenerator->shouldReceive( 'generateToFile' )
			->once()
			->with(
				'rent-analysis',
				Mockery::type( 'array' ),
				Mockery::pattern( '/resa-pdfs.*\.pdf$/' )
			)
			->andReturn( true );

		$emailService = Mockery::mock( EmailService::class );
		$emailService->shouldReceive( 'send' )
			->once()
			->with(
				1,
				'lead-result',
				'max@test.de',
				Mockery::pattern( '/Mietpreis-Analyse.*fertig/' ),
				Mockery::type( 'string' ),
				Mockery::on( function ( $options ) {
					return isset( $options['attachments'] ) && is_array( $options['attachments'] );
				} )
			)
			->andReturn( true );

		$service = new LeadPdfService( $pdfGenerator, $emailService );
		$result  = $service->generateAndSend( 1 );

		$this->assertTrue( $result );
	}

	public function test_generateAndSend_returns_false_when_pdf_generation_fails(): void {
		$lead = (object) [
			'id'          => 2,
			'location_id' => 0,
			'first_name'  => 'Error',
			'last_name'   => 'Test',
			'email'       => 'error@test.de',
			'asset_type'  => 'rent-calculator',
			'inputs'      => '{}',
			'result'      => '{}',
		];

		global $wpdb;
		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SELECT ...' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( $lead );

		Functions\when( 'get_option' )->justReturn( true );
		$pdfGenerator = Mockery::mock( PdfGenerator::class );
		$pdfGenerator->shouldReceive( 'generateToFile' )
			->andThrow( new \RuntimeException( 'PDF generation failed' ) );

		$emailService = Mockery::mock( EmailService::class );
		$emailService->shouldNotReceive( 'send' );

		$service = new LeadPdfService( $pdfGenerator, $emailService );
		$result  = $service->generateAndSend( 2 );

		$this->assertFalse( $result );
	}

	public function test_generateAndSend_catches_email_exceptions(): void {
		$lead = (object) [
			'id'          => 3,
			'location_id' => 0,
			'first_name'  => 'Test',
			'last_name'   => 'User',
			'email'       => 'test@test.de',
			'asset_type'  => 'rent-calculator',
			'inputs'      => '{}',
			'result'      => '{"estimatedRent": 1000}',
		];

		global $wpdb;
		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SELECT ...' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( $lead );

		Functions\when( 'get_option' )->justReturn( true );
		$pdfGenerator = Mockery::mock( PdfGenerator::class );
		$pdfGenerator->shouldReceive( 'generateToFile' )->andReturn( true );

		$emailService = Mockery::mock( EmailService::class );
		$emailService->shouldReceive( 'send' )
			->andThrow( new \RuntimeException( 'SMTP connection failed' ) );

		$service = new LeadPdfService( $pdfGenerator, $emailService );
		$result  = $service->generateAndSend( 3 );

		// Should return false but not throw.
		$this->assertFalse( $result );
	}

	public function test_uses_correct_template_for_asset_type(): void {
		$lead = (object) [
			'id'          => 4,
			'location_id' => 0,
			'first_name'  => 'Test',
			'last_name'   => '',
			'email'       => 'test@test.de',
			'asset_type'  => 'value-calculator', // Different asset type.
			'inputs'      => '{}',
			'result'      => '{}',
		];

		global $wpdb;
		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SELECT ...' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( $lead );

		Functions\when( 'get_option' )->justReturn( true );


		$capturedTemplate = '';

		$pdfGenerator = Mockery::mock( PdfGenerator::class );
		$pdfGenerator->shouldReceive( 'generateToFile' )
			->once()
			->withArgs( function ( $template, $data, $path ) use ( &$capturedTemplate ) {
				$capturedTemplate = $template;
				return true;
			} )
			->andReturn( true );

		$emailService = Mockery::mock( EmailService::class );
		$emailService->shouldReceive( 'send' )->andReturn( true );

		$service = new LeadPdfService( $pdfGenerator, $emailService );
		$service->generateAndSend( 4 );

		$this->assertEquals( 'value-analysis', $capturedTemplate );
	}

	public function test_pdf_data_includes_chart_svg(): void {
		$lead = (object) [
			'id'          => 5,
			'location_id' => 0,
			'first_name'  => 'Chart',
			'last_name'   => 'Test',
			'email'       => 'chart@test.de',
			'asset_type'  => 'rent-calculator',
			'inputs'      => '{"livingArea": 100}',
			'result'      => '{"pricePerSqm": 15, "cityAverage": 14, "countyAverage": 12}',
		];

		global $wpdb;
		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SELECT ...' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( $lead );

		Functions\when( 'get_option' )->justReturn( true );


		$capturedData = [];

		$pdfGenerator = Mockery::mock( PdfGenerator::class );
		$pdfGenerator->shouldReceive( 'generateToFile' )
			->once()
			->withArgs( function ( $template, $data, $path ) use ( &$capturedData ) {
				$capturedData = $data;
				return true;
			} )
			->andReturn( true );

		$emailService = Mockery::mock( EmailService::class );
		$emailService->shouldReceive( 'send' )->andReturn( true );

		$service = new LeadPdfService( $pdfGenerator, $emailService );
		$service->generateAndSend( 5 );

		$this->assertArrayHasKey( 'bar_chart_svg', $capturedData );
		$this->assertStringContainsString( '<svg', $capturedData['bar_chart_svg'] );
	}

	public function test_result_summary_formats_rent_correctly(): void {
		$lead = (object) [
			'id'          => 6,
			'location_id' => 0,
			'first_name'  => 'Summary',
			'last_name'   => 'Test',
			'email'       => 'summary@test.de',
			'asset_type'  => 'rent-calculator',
			'inputs'      => '{}',
			'result'      => '{"estimatedRent": 1234.56, "pricePerSqm": 15.80}',
		];

		global $wpdb;
		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SELECT ...' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( $lead );

		Functions\when( 'get_option' )->alias( function ( $key, $default = false ) {
			// Return false for email template to use legacy PHP template path.
			if ( str_starts_with( $key, 'resa_email_template_' ) ) {
				return false;
			}
			return true;
		} );

		$capturedHtml = '';

		$pdfGenerator = Mockery::mock( PdfGenerator::class );
		$pdfGenerator->shouldReceive( 'generateToFile' )->andReturn( true );

		$emailService = Mockery::mock( EmailService::class );
		$emailService->shouldReceive( 'send' )
			->once()
			->withArgs( function ( $leadId, $template, $to, $subject, $html, $options ) use ( &$capturedHtml ) {
				$capturedHtml = $html;
				return true;
			} )
			->andReturn( true );

		$service = new LeadPdfService( $pdfGenerator, $emailService );
		$service->generateAndSend( 6 );

		// Check that result summary contains formatted currency.
		$this->assertStringContainsString( '1.234,56', $capturedHtml );
	}

	public function test_uses_fallback_agent_settings(): void {
		$lead = (object) [
			'id'          => 7,
			'location_id' => 0, // No location.
			'first_name'  => 'Fallback',
			'last_name'   => 'Test',
			'email'       => 'fallback@test.de',
			'asset_type'  => 'rent-calculator',
			'inputs'      => '{}',
			'result'      => '{}',
		];

		global $wpdb;
		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SELECT ...' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( $lead );

		Functions\when( 'get_option' )->alias( function ( $key, $default = '' ) {
			$options = [
				'resa_lead_pdf_enabled'       => true,
				'resa_agent_fallback_name'    => 'Fallback Agent',
				'resa_agent_fallback_email'   => 'fallback@agent.de',
				'resa_agent_fallback_phone'   => '+49 123 456',
				'resa_agent_fallback_company' => 'Fallback GmbH',
			];
			return $options[ $key ] ?? $default;
		} );


		$capturedData = [];

		$pdfGenerator = Mockery::mock( PdfGenerator::class );
		$pdfGenerator->shouldReceive( 'generateToFile' )
			->once()
			->withArgs( function ( $template, $data, $path ) use ( &$capturedData ) {
				$capturedData = $data;
				return true;
			} )
			->andReturn( true );

		$emailService = Mockery::mock( EmailService::class );
		$emailService->shouldReceive( 'send' )->andReturn( true );

		$service = new LeadPdfService( $pdfGenerator, $emailService );
		$service->generateAndSend( 7 );

		$this->assertEquals( 'Fallback Agent', $capturedData['agent_name'] );
		$this->assertEquals( 'fallback@agent.de', $capturedData['agent_email'] );
		$this->assertEquals( '+49 123 456', $capturedData['agent_phone'] );
		$this->assertEquals( 'Fallback GmbH', $capturedData['agent_company'] );
	}
}
