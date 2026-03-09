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

	// ── registerRoutes ──────────────────────────────────────

	public function test_registerRoutes_registriert_admin_branding_endpoint(): void {
		Functions\expect( 'register_rest_route' )
			->once()
			->with(
				'resa/v1',
				'/admin/branding',
				Mockery::on( function ( array $args ): bool {
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

	// ── show (GET) ──────────────────────────────────────────

	public function test_show_gibt_default_werte_ohne_gespeicherte_einstellungen(): void {
		$this->mock_get_option_defaults();

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
		Functions\when( 'get_option' )->alias( function ( string $key, $default = false ) {
			return match ( $key ) {
				'resa_branding_logo_url'        => 'https://example.com/logo.png',
				'resa_branding_logo_id'         => 42,
				'resa_branding_primary_color'   => '#ff5500',
				'resa_branding_secondary_color' => '#003366',
				'resa_branding_show_powered_by' => '0',
				default                         => $default,
			};
		} );

		$controller = new BrandingController();
		$response   = $controller->show();

		$data = $response->get_data();
		$this->assertEquals( 'https://example.com/logo.png', $data['logoUrl'] );
		$this->assertEquals( 42, $data['logoId'] );
		$this->assertEquals( '#ff5500', $data['primaryColor'] );
		$this->assertEquals( '#003366', $data['secondaryColor'] );
		$this->assertFalse( $data['showPoweredBy'] );
	}

	// ── update (PUT) — Validation ───────────────────────────

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
		Functions\when( 'sanitize_hex_color' )->returnArg();
		Functions\when( 'update_option' )->justReturn( true );
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
		Functions\when( 'absint' )->alias( 'intval' );
		Functions\when( 'get_post_type' )->justReturn( false );

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
		Functions\when( 'absint' )->alias( 'intval' );
		Functions\when( 'get_post_type' )->justReturn( 'attachment' );
		Functions\when( 'update_option' )->justReturn( true );
		$this->mock_get_option_defaults();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'logoId' => 123,
		] );

		$controller = new BrandingController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	// ── update (PUT) — Speichern ────────────────────────────

	public function test_update_speichert_logo_url(): void {
		Functions\when( '__' )->returnArg();
		Functions\when( 'esc_url_raw' )->returnArg();
		Functions\when( 'update_option' )->justReturn( true );
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
		Functions\when( 'esc_url_raw' )->returnArg();
		Functions\when( 'update_option' )->justReturn( true );
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
		Functions\when( 'sanitize_hex_color' )->returnArg();
		Functions\when( 'update_option' )->justReturn( true );
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

	// ── update (PUT) — showPoweredBy + Freemius Gating ──────

	public function test_update_free_plan_erzwingt_powered_by_true(): void {
		Functions\when( '__' )->returnArg();
		Functions\when( 'update_option' )->justReturn( true );
		$this->mock_get_option_defaults();

		// Define resa_fs() globally to simulate Freemius presence.
		if ( ! function_exists( 'resa_fs' ) ) {
			// Can't define during test — Freemius check uses function_exists,
			// which is a PHP built-in we can't mock. Test canDisablePoweredBy()
			// indirectly: without resa_fs(), powered_by is always forced on.
		}

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'showPoweredBy' => false,
		] );

		$controller = new BrandingController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );

		// Without resa_fs() defined, canDisablePoweredBy() returns false.
		// So showPoweredBy should be forced to true.
		$data = $response->get_data();
		$this->assertTrue( $data['showPoweredBy'] );
	}

	public function test_update_ohne_freemius_erzwingt_powered_by_true(): void {
		Functions\when( '__' )->returnArg();
		Functions\when( 'update_option' )->justReturn( true );
		$this->mock_get_option_defaults();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'showPoweredBy' => false,
		] );

		$controller = new BrandingController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );

		// Without resa_fs(), canDisablePoweredBy() returns false → forced true.
		$data = $response->get_data();
		$this->assertTrue( $data['showPoweredBy'] );
	}

	// ── adminAccess ─────────────────────────────────────────

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

	// ── Edge Cases ──────────────────────────────────────────

	public function test_update_ignoriert_unbekannte_parameter(): void {
		Functions\when( '__' )->returnArg();
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
		Functions\when( 'update_option' )->justReturn( true );
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
		Functions\when( 'absint' )->alias( 'intval' );
		Functions\when( 'update_option' )->justReturn( true );
		$this->mock_get_option_defaults();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'logoId' => 0,
		] );

		$controller = new BrandingController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	// ── Hex Color Validation ────────────────────────────────

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

	// ── Helper ──────────────────────────────────────────────

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
