<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Api;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Api\BrandingController;

class BrandingControllerTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	// ──────────────────────────────────────────────────────────────────────────
	// registerRoutes
	// ──────────────────────────────────────────────────────────────────────────

	public function test_registerRoutes_registriert_admin_branding_endpoint(): void {
		Functions\expect( 'register_rest_route' )
			->once()
			->with(
				'resa/v1',
				'/admin/branding',
				Mockery::on( function ( array $args ): bool {
					// Should have GET and PUT handlers
					return count( $args ) === 2
						&& $args[0]['methods'] === 'GET'
						&& $args[1]['methods'] === 'PUT'
						&& is_callable( $args[0]['permission_callback'] )
						&& is_callable( $args[1]['permission_callback'] );
				} )
			);

		$controller = new BrandingController();
		$controller->registerRoutes();
	}

	// ──────────────────────────────────────────────────────────────────────────
	// show (GET)
	// ──────────────────────────────────────────────────────────────────────────

	public function test_show_gibt_default_werte_ohne_gespeicherte_einstellungen(): void {
		Functions\expect( 'get_option' )
			->with( 'resa_branding_logo_url', '' )
			->andReturn( '' );
		Functions\expect( 'get_option' )
			->with( 'resa_branding_logo_id', 0 )
			->andReturn( 0 );
		Functions\expect( 'get_option' )
			->with( 'resa_branding_primary_color', '#a9e43f' )
			->andReturn( '#a9e43f' );
		Functions\expect( 'get_option' )
			->with( 'resa_branding_secondary_color', '#1e303a' )
			->andReturn( '#1e303a' );
		Functions\expect( 'get_option' )
			->with( 'resa_branding_show_powered_by', '1' )
			->andReturn( '1' );

		$controller = new BrandingController();
		$response   = $controller->show();

		$this->assertInstanceOf( \WP_REST_Response::class, $response );

		$data = $response->get_data();
		$this->assertEquals( '', $data['logoUrl'] );
		$this->assertEquals( 0, $data['logoId'] );
		$this->assertEquals( '#a9e43f', $data['primaryColor'] );
		$this->assertEquals( '#1e303a', $data['secondaryColor'] );
		$this->assertTrue( $data['showPoweredBy'] );
	}

	public function test_show_gibt_gespeicherte_werte_zurueck(): void {
		Functions\expect( 'get_option' )
			->with( 'resa_branding_logo_url', '' )
			->andReturn( 'https://example.com/logo.png' );
		Functions\expect( 'get_option' )
			->with( 'resa_branding_logo_id', 0 )
			->andReturn( 42 );
		Functions\expect( 'get_option' )
			->with( 'resa_branding_primary_color', '#a9e43f' )
			->andReturn( '#ff5500' );
		Functions\expect( 'get_option' )
			->with( 'resa_branding_secondary_color', '#1e303a' )
			->andReturn( '#003366' );
		Functions\expect( 'get_option' )
			->with( 'resa_branding_show_powered_by', '1' )
			->andReturn( '0' );

		$controller = new BrandingController();
		$response   = $controller->show();

		$data = $response->get_data();
		$this->assertEquals( 'https://example.com/logo.png', $data['logoUrl'] );
		$this->assertEquals( 42, $data['logoId'] );
		$this->assertEquals( '#ff5500', $data['primaryColor'] );
		$this->assertEquals( '#003366', $data['secondaryColor'] );
		$this->assertFalse( $data['showPoweredBy'] );
	}

	// ──────────────────────────────────────────────────────────────────────────
	// update (PUT) — Validation
	// ──────────────────────────────────────────────────────────────────────────

	public function test_update_gibt_fehler_bei_ungueltiger_primaryColor(): void {
		Functions\when( '__' )->returnArg();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'primaryColor' => 'not-a-color',
		] );

		$controller = new BrandingController();
		$result     = $controller->update( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'resa_validation_error', $result->get_error_code() );
	}

	public function test_update_gibt_fehler_bei_ungueltiger_secondaryColor(): void {
		Functions\when( '__' )->returnArg();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'secondaryColor' => 'rgb(255,0,0)',
		] );

		$controller = new BrandingController();
		$result     = $controller->update( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'resa_validation_error', $result->get_error_code() );
	}

	public function test_update_akzeptiert_3_stelligen_hex_code(): void {
		Functions\when( '__' )->returnArg();
		Functions\expect( 'sanitize_hex_color' )->andReturnFirstArg();
		Functions\expect( 'update_option' )->twice();
		$this->mock_get_option_defaults();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'primaryColor'   => '#f00',
			'secondaryColor' => '#abc',
		] );

		$controller = new BrandingController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	public function test_update_gibt_fehler_bei_ungueltiger_logoId(): void {
		Functions\when( '__' )->returnArg();
		Functions\expect( 'absint' )->andReturnUsing( 'intval' );
		Functions\expect( 'get_post_type' )->with( 999 )->andReturn( false );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'logoId' => 999,
		] );

		$controller = new BrandingController();
		$result     = $controller->update( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'resa_validation_error', $result->get_error_code() );
	}

	public function test_update_akzeptiert_gueltige_attachment_id(): void {
		Functions\when( '__' )->returnArg();
		Functions\expect( 'absint' )->andReturnUsing( 'intval' );
		Functions\expect( 'get_post_type' )->with( 123 )->andReturn( 'attachment' );
		Functions\expect( 'update_option' )->once();
		$this->mock_get_option_defaults();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'logoId' => 123,
		] );

		$controller = new BrandingController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	// ──────────────────────────────────────────────────────────────────────────
	// update (PUT) — Speichern
	// ──────────────────────────────────────────────────────────────────────────

	public function test_update_speichert_logo_url(): void {
		Functions\when( '__' )->returnArg();
		Functions\expect( 'esc_url_raw' )->andReturnFirstArg();
		Functions\expect( 'update_option' )
			->once()
			->with( 'resa_branding_logo_url', 'https://example.com/neu.png' );
		$this->mock_get_option_defaults();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'logoUrl' => 'https://example.com/neu.png',
		] );

		$controller = new BrandingController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	public function test_update_entfernt_logo_mit_leerem_wert(): void {
		Functions\when( '__' )->returnArg();
		Functions\expect( 'esc_url_raw' )->andReturnFirstArg();
		Functions\expect( 'update_option' )
			->once()
			->with( 'resa_branding_logo_url', '' );
		$this->mock_get_option_defaults();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'logoUrl' => '',
		] );

		$controller = new BrandingController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	public function test_update_speichert_farben(): void {
		Functions\when( '__' )->returnArg();
		Functions\expect( 'sanitize_hex_color' )->andReturnFirstArg();
		Functions\expect( 'update_option' )
			->once()
			->with( 'resa_branding_primary_color', '#ff0000' );
		Functions\expect( 'update_option' )
			->once()
			->with( 'resa_branding_secondary_color', '#00ff00' );
		$this->mock_get_option_defaults();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'primaryColor'   => '#ff0000',
			'secondaryColor' => '#00ff00',
		] );

		$controller = new BrandingController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	// ──────────────────────────────────────────────────────────────────────────
	// update (PUT) — showPoweredBy + Freemius Gating
	// ──────────────────────────────────────────────────────────────────────────

	public function test_update_free_plan_erzwingt_powered_by_true(): void {
		Functions\when( '__' )->returnArg();
		Functions\when( 'function_exists' )->justReturn( true );

		// Mock Freemius: Free Plan
		$freemius_mock = Mockery::mock( 'Freemius' );
		$freemius_mock->shouldReceive( 'can_use_premium_code' )->andReturn( false );
		Functions\expect( 'resa_fs' )->andReturn( $freemius_mock );

		// Expect powered_by to be saved as '1' despite request saying false
		Functions\expect( 'update_option' )
			->once()
			->with( 'resa_branding_show_powered_by', '1' );
		$this->mock_get_option_defaults();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'showPoweredBy' => false,
		] );

		$controller = new BrandingController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	public function test_update_premium_plan_erlaubt_powered_by_false(): void {
		Functions\when( '__' )->returnArg();
		Functions\when( 'function_exists' )->justReturn( true );

		// Mock Freemius: Premium Plan
		$freemius_mock = Mockery::mock( 'Freemius' );
		$freemius_mock->shouldReceive( 'can_use_premium_code' )->andReturn( true );
		Functions\expect( 'resa_fs' )->andReturn( $freemius_mock );

		// Expect powered_by to be saved as '0'
		Functions\expect( 'update_option' )
			->once()
			->with( 'resa_branding_show_powered_by', '0' );
		$this->mock_get_option_defaults();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'showPoweredBy' => false,
		] );

		$controller = new BrandingController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	public function test_update_ohne_freemius_erzwingt_powered_by_true(): void {
		Functions\when( '__' )->returnArg();
		Functions\when( 'function_exists' )->justReturn( false );

		// Expect powered_by to be saved as '1' (no Freemius = Free plan)
		Functions\expect( 'update_option' )
			->once()
			->with( 'resa_branding_show_powered_by', '1' );
		$this->mock_get_option_defaults();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'showPoweredBy' => false,
		] );

		$controller = new BrandingController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	// ──────────────────────────────────────────────────────────────────────────
	// adminAccess
	// ──────────────────────────────────────────────────────────────────────────

	public function test_adminAccess_prueft_capability(): void {
		Functions\expect( 'current_user_can' )
			->once()
			->with( 'manage_options' )
			->andReturn( true );

		$controller = new BrandingController();
		$this->assertTrue( $controller->adminAccess() );
	}

	public function test_adminAccess_verweigert_ohne_capability(): void {
		Functions\expect( 'current_user_can' )
			->once()
			->with( 'manage_options' )
			->andReturn( false );

		$controller = new BrandingController();
		$this->assertFalse( $controller->adminAccess() );
	}

	// ──────────────────────────────────────────────────────────────────────────
	// Edge Cases
	// ──────────────────────────────────────────────────────────────────────────

	public function test_update_ignoriert_unbekannte_parameter(): void {
		Functions\when( '__' )->returnArg();
		// No update_option calls expected for unknown params
		$this->mock_get_option_defaults();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'unknownField'  => 'someValue',
			'anotherField'  => 123,
		] );

		$controller = new BrandingController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	public function test_update_akzeptiert_null_logoId(): void {
		Functions\when( '__' )->returnArg();
		// logoId = null should be accepted without validation
		$this->mock_get_option_defaults();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'logoId' => null,
		] );

		$controller = new BrandingController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	public function test_update_akzeptiert_logoId_zero(): void {
		Functions\when( '__' )->returnArg();
		// logoId = 0 should be accepted (remove logo)
		$this->mock_get_option_defaults();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'logoId' => 0,
		] );

		$controller = new BrandingController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	// ──────────────────────────────────────────────────────────────────────────
	// Hex Color Validation Edge Cases
	// ──────────────────────────────────────────────────────────────────────────

	public function test_update_lehnt_hex_ohne_hash_ab(): void {
		Functions\when( '__' )->returnArg();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'primaryColor' => 'ff0000',
		] );

		$controller = new BrandingController();
		$result     = $controller->update( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
	}

	public function test_update_lehnt_zu_langen_hex_ab(): void {
		Functions\when( '__' )->returnArg();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'primaryColor' => '#ff00ff00',
		] );

		$controller = new BrandingController();
		$result     = $controller->update( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
	}

	public function test_update_lehnt_ungueltige_hex_zeichen_ab(): void {
		Functions\when( '__' )->returnArg();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'primaryColor' => '#gggggg',
		] );

		$controller = new BrandingController();
		$result     = $controller->update( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
	}

	// ──────────────────────────────────────────────────────────────────────────
	// Helper
	// ──────────────────────────────────────────────────────────────────────────

	private function mock_get_option_defaults(): void {
		Functions\when( 'get_option' )->alias( function ( string $key, $default = false ) {
			return match ( $key ) {
				'resa_branding_logo_url'        => '',
				'resa_branding_logo_id'         => 0,
				'resa_branding_primary_color'   => '#a9e43f',
				'resa_branding_secondary_color' => '#1e303a',
				'resa_branding_show_powered_by' => '1',
				default                         => $default,
			};
		} );
	}
}
