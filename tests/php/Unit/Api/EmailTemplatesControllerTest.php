<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Api;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Api\EmailTemplatesController;

/**
 * Unit tests for EmailTemplatesController.
 *
 * Tests the REST API endpoints for managing email templates:
 * - GET /admin/email-templates (list all)
 * - GET /admin/email-templates/{id} (single)
 * - PUT /admin/email-templates/{id} (update)
 * - POST /admin/email-templates/{id}/reset (reset to defaults)
 * - POST /admin/email-templates/{id}/test (send test email)
 * - POST /admin/email-templates/{id}/preview (preview with example data)
 */
class EmailTemplatesControllerTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		// Common WordPress function mocks.
		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\when( 'sanitize_email' )->returnArg();
		Functions\when( '__' )->returnArg();
		Functions\when( 'esc_html__' )->returnArg();
		Functions\when( 'esc_html' )->returnArg();
		Functions\when( 'get_bloginfo' )->justReturn( 'RESA Test' );
		Functions\when( 'esc_url' )->returnArg();
		Functions\when( 'esc_attr' )->returnArg();
		Functions\when( 'esc_html_e' )->alias( function ( $text ) { echo $text; } );
		Functions\when( 'admin_url' )->justReturn( 'https://example.com/wp-admin/' );
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	// -------------------------------------------------------------------------
	// Route Registration Tests
	// -------------------------------------------------------------------------

	public function test_registerRoutes_registriert_alle_endpoints(): void {
		Functions\expect( 'register_rest_route' )
			->times( 5 )
			->with(
				'resa/v1',
				Mockery::anyOf(
					'/admin/email-templates',
					'/admin/email-templates/(?P<id>[a-z0-9-]+)',
					'/admin/email-templates/(?P<id>[a-z0-9-]+)/reset',
					'/admin/email-templates/(?P<id>[a-z0-9-]+)/test',
					'/admin/email-templates/(?P<id>[a-z0-9-]+)/preview'
				),
				Mockery::type( 'array' )
			);

		$controller = new EmailTemplatesController();
		$controller->registerRoutes();
	}

	// -------------------------------------------------------------------------
	// GET /admin/email-templates (index)
	// -------------------------------------------------------------------------

	public function test_index_gibt_alle_templates_zurueck(): void {
		Functions\when( 'get_option' )->justReturn( false );

		$controller = new EmailTemplatesController();
		$response   = $controller->index();

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertIsArray( $data );
		$this->assertCount( 2, $data ); // lead-notification and lead-result
	}

	public function test_index_enthält_alle_template_felder(): void {
		Functions\when( 'get_option' )->justReturn( false );

		$controller = new EmailTemplatesController();
		$response   = $controller->index();
		$data       = $response->get_data();

		$template = $data[0];
		$this->assertArrayHasKey( 'id', $template );
		$this->assertArrayHasKey( 'name', $template );
		$this->assertArrayHasKey( 'description', $template );
		$this->assertArrayHasKey( 'subject', $template );
		$this->assertArrayHasKey( 'body', $template );
		$this->assertArrayHasKey( 'is_active', $template );
		$this->assertArrayHasKey( 'has_attachment', $template );
		$this->assertArrayHasKey( 'available_variables', $template );
		$this->assertArrayHasKey( 'is_modified', $template );
		$this->assertArrayHasKey( 'variable_labels', $template );
		$this->assertArrayHasKey( 'variable_groups', $template );
		$this->assertArrayHasKey( 'example_values', $template );
	}

	// -------------------------------------------------------------------------
	// GET /admin/email-templates/{id} (show)
	// -------------------------------------------------------------------------

	public function test_show_gibt_einzelnes_template_zurueck(): void {
		Functions\when( 'get_option' )->justReturn( false );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )
			->with( 'id' )
			->andReturn( 'lead-notification' );

		$controller = new EmailTemplatesController();
		$response   = $controller->show( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertSame( 'lead-notification', $data['id'] );
		$this->assertSame( 'Lead-Benachrichtigung', $data['name'] );
	}

	public function test_show_gibt_404_fuer_unbekannte_id(): void {
		Functions\when( 'get_option' )->justReturn( false );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )
			->with( 'id' )
			->andReturn( 'nonexistent-template' );

		$controller = new EmailTemplatesController();
		$response   = $controller->show( $request );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'resa_not_found', $response->get_error_code() );
	}

	// -------------------------------------------------------------------------
	// PUT /admin/email-templates/{id} (update)
	// -------------------------------------------------------------------------

	public function test_update_speichert_subject_und_body(): void {
		Functions\when( 'get_option' )->justReturn( false );
		Functions\expect( 'update_option' )
			->once()
			->with(
				'resa_email_template_lead-notification',
				Mockery::on( function ( $data ) {
					return $data['subject'] === 'Neuer Betreff'
						&& $data['body'] === '<p>Neuer Body</p>';
				} )
			)
			->andReturn( true );
		Functions\when( 'wp_kses_post' )->returnArg();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )
			->with( 'id' )
			->andReturn( 'lead-notification' );
		$request->shouldReceive( 'get_param' )
			->with( 'subject' )
			->andReturn( 'Neuer Betreff' );
		$request->shouldReceive( 'get_param' )
			->with( 'body' )
			->andReturn( '<p>Neuer Body</p>' );
		$request->shouldReceive( 'get_param' )
			->with( 'is_active' )
			->andReturn( null );

		$controller = new EmailTemplatesController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$this->assertSame( 200, $response->get_status() );
	}

	public function test_update_speichert_is_active_status(): void {
		Functions\when( 'get_option' )->justReturn( false );
		Functions\expect( 'update_option' )
			->once()
			->with(
				'resa_email_template_lead-result',
				Mockery::on( function ( $data ) {
					return $data['is_active'] === false;
				} )
			)
			->andReturn( true );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )
			->with( 'id' )
			->andReturn( 'lead-result' );
		$request->shouldReceive( 'get_param' )
			->with( 'subject' )
			->andReturn( null );
		$request->shouldReceive( 'get_param' )
			->with( 'body' )
			->andReturn( null );
		$request->shouldReceive( 'get_param' )
			->with( 'is_active' )
			->andReturn( false );

		$controller = new EmailTemplatesController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	public function test_update_gibt_fehler_ohne_daten(): void {
		Functions\when( 'get_option' )->justReturn( false );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )
			->with( 'id' )
			->andReturn( 'lead-notification' );
		$request->shouldReceive( 'get_param' )
			->with( 'subject' )
			->andReturn( null );
		$request->shouldReceive( 'get_param' )
			->with( 'body' )
			->andReturn( null );
		$request->shouldReceive( 'get_param' )
			->with( 'is_active' )
			->andReturn( null );

		$controller = new EmailTemplatesController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'resa_validation_error', $response->get_error_code() );
	}

	public function test_update_gibt_404_fuer_unbekannte_id(): void {
		Functions\when( 'get_option' )->justReturn( false );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )
			->with( 'id' )
			->andReturn( 'nonexistent' );

		$controller = new EmailTemplatesController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'resa_not_found', $response->get_error_code() );
	}

	// -------------------------------------------------------------------------
	// POST /admin/email-templates/{id}/reset
	// -------------------------------------------------------------------------

	public function test_reset_setzt_template_auf_defaults_zurueck(): void {
		Functions\when( 'get_option' )->justReturn( [ 'subject' => 'Custom' ] );
		Functions\expect( 'delete_option' )
			->once()
			->with( 'resa_email_template_lead-notification' )
			->andReturn( true );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )
			->with( 'id' )
			->andReturn( 'lead-notification' );

		$controller = new EmailTemplatesController();
		$response   = $controller->reset( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$this->assertSame( 200, $response->get_status() );
	}

	public function test_reset_gibt_404_fuer_unbekannte_id(): void {
		Functions\when( 'get_option' )->justReturn( false );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )
			->with( 'id' )
			->andReturn( 'unknown-template' );

		$controller = new EmailTemplatesController();
		$response   = $controller->reset( $request );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'resa_not_found', $response->get_error_code() );
	}

	// -------------------------------------------------------------------------
	// POST /admin/email-templates/{id}/test
	// -------------------------------------------------------------------------

	public function test_test_gibt_validation_error_bei_ungueltiger_email(): void {
		Functions\when( 'get_option' )->justReturn( false );
		Functions\when( 'is_email' )->justReturn( false );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )
			->with( 'id' )
			->andReturn( 'lead-notification' );
		$request->shouldReceive( 'get_param' )
			->with( 'recipient' )
			->andReturn( 'invalid-email' );

		$controller = new EmailTemplatesController();
		$response   = $controller->test( $request );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'resa_validation_error', $response->get_error_code() );
	}

	public function test_test_gibt_404_fuer_unbekanntes_template(): void {
		Functions\when( 'get_option' )->justReturn( false );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )
			->with( 'id' )
			->andReturn( 'unknown-template' );

		$controller = new EmailTemplatesController();
		$response   = $controller->test( $request );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'resa_not_found', $response->get_error_code() );
	}

	public function test_test_gibt_fehler_ohne_recipient(): void {
		Functions\when( 'get_option' )->justReturn( false );
		Functions\when( 'is_email' )->justReturn( false );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )
			->with( 'id' )
			->andReturn( 'lead-notification' );
		$request->shouldReceive( 'get_param' )
			->with( 'recipient' )
			->andReturn( '' );

		$controller = new EmailTemplatesController();
		$response   = $controller->test( $request );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'resa_validation_error', $response->get_error_code() );
	}

	// -------------------------------------------------------------------------
	// POST /admin/email-templates/{id}/preview
	// -------------------------------------------------------------------------

	public function test_preview_gibt_html_mit_ersetzten_variablen_zurueck(): void {
		Functions\when( 'get_option' )->justReturn( false );

		// Agent::getDefault() is called by EmailService::getBrandingVars() in wrapInLayout().
		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';
		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SELECT ...' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( null );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )
			->with( 'id' )
			->andReturn( 'lead-notification' );
		$request->shouldReceive( 'get_param' )
			->with( 'subject' )
			->andReturn( null );
		$request->shouldReceive( 'get_param' )
			->with( 'body' )
			->andReturn( null );

		$controller = new EmailTemplatesController();
		$response   = $controller->preview( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertArrayHasKey( 'subject', $data );
		$this->assertArrayHasKey( 'html', $data );
	}

	public function test_preview_verwendet_uebergebene_werte(): void {
		Functions\when( 'get_option' )->justReturn( false );

		// Agent::getDefault() is called by EmailService::getBrandingVars() in wrapInLayout().
		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';
		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SELECT ...' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( null );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )
			->with( 'id' )
			->andReturn( 'lead-notification' );
		$request->shouldReceive( 'get_param' )
			->with( 'subject' )
			->andReturn( 'Test-Betreff: {{lead_name}}' );
		$request->shouldReceive( 'get_param' )
			->with( 'body' )
			->andReturn( '<p>Hallo {{lead_name}}</p>' );

		$controller = new EmailTemplatesController();
		$response   = $controller->preview( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$data = $response->get_data();
		$this->assertStringContainsString( 'Lisa Beispiel', $data['subject'] );
		$this->assertStringContainsString( 'Lisa Beispiel', $data['html'] );
	}

	public function test_preview_gibt_404_fuer_unbekanntes_template(): void {
		Functions\when( 'get_option' )->justReturn( false );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )
			->with( 'id' )
			->andReturn( 'unknown-template' );

		$controller = new EmailTemplatesController();
		$response   = $controller->preview( $request );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'resa_not_found', $response->get_error_code() );
	}

	// -------------------------------------------------------------------------
	// Permission Tests
	// -------------------------------------------------------------------------

	public function test_adminAccess_prueft_manage_options_capability(): void {
		Functions\when( 'current_user_can' )->justReturn( true );

		$controller = new EmailTemplatesController();
		$this->assertTrue( $controller->adminAccess() );
	}

	public function test_adminAccess_verweigert_zugriff_ohne_capability(): void {
		Functions\when( 'current_user_can' )->justReturn( false );

		$controller = new EmailTemplatesController();
		$this->assertFalse( $controller->adminAccess() );
	}
}
