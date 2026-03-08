<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Api;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Api\MapSettingsController;

class MapSettingsControllerTest extends TestCase {

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

	public function test_registerRoutes_registriert_admin_map_settings_endpoint(): void {
		Functions\expect( 'register_rest_route' )
			->once()
			->with(
				'resa/v1',
				'/admin/map-settings',
				Mockery::on( function ( array $args ): bool {
					// Should have GET and PUT handlers
					return count( $args ) === 2
						&& $args[0]['methods'] === 'GET'
						&& $args[1]['methods'] === 'PUT'
						&& is_callable( $args[0]['permission_callback'] )
						&& is_callable( $args[1]['permission_callback'] );
				} )
			);

		$controller = new MapSettingsController();
		$controller->registerRoutes();
	}

	// ──────────────────────────────────────────────────────────────────────────
	// show (GET) — Default values
	// ──────────────────────────────────────────────────────────────────────────

	public function test_show_gibt_default_werte_ohne_gespeicherte_einstellungen(): void {
		$this->mock_get_option_defaults();
		$this->mock_free_plan();

		$controller = new MapSettingsController();
		$response   = $controller->show();

		$this->assertInstanceOf( \WP_REST_Response::class, $response );

		$data = $response->get_data();
		$this->assertEquals( 'osm', $data['provider'] );
		$this->assertEquals( 'minimal', $data['tileStyle'] );
		$this->assertEquals( 13, $data['defaultZoom'] );
		$this->assertEquals( '', $data['googleApiKey'] ); // Free plan: hidden
		$this->assertFalse( $data['scrollZoom'] );
		$this->assertFalse( $data['canUseGoogle'] );
		$this->assertFalse( $data['canSelectStyle'] );
	}

	public function test_show_gibt_gespeicherte_werte_zurueck_premium(): void {
		Functions\when( 'get_option' )->alias( function ( string $key, $default = false ) {
			return match ( $key ) {
				'resa_map_provider'       => 'google',
				'resa_map_tile_style'     => 'dark',
				'resa_map_default_zoom'   => 15,
				'resa_map_google_api_key' => 'AIzaSyAbcdefg123',
				'resa_map_scroll_zoom'    => '1',
				default                   => $default,
			};
		} );
		$this->mock_premium_plan();

		$controller = new MapSettingsController();
		$response   = $controller->show();

		$data = $response->get_data();
		$this->assertEquals( 'google', $data['provider'] );
		$this->assertEquals( 'dark', $data['tileStyle'] );
		$this->assertEquals( 15, $data['defaultZoom'] );
		$this->assertEquals( 'AIzaSyAbcdefg123', $data['googleApiKey'] );
		$this->assertTrue( $data['scrollZoom'] );
		$this->assertTrue( $data['canUseGoogle'] );
		$this->assertTrue( $data['canSelectStyle'] );
	}

	public function test_show_versteckt_google_api_key_bei_free_plan(): void {
		Functions\when( 'get_option' )->alias( function ( string $key, $default = false ) {
			return match ( $key ) {
				'resa_map_provider'       => 'osm',
				'resa_map_tile_style'     => 'minimal',
				'resa_map_default_zoom'   => 13,
				'resa_map_google_api_key' => 'AIzaSySecret123', // Gespeichert
				'resa_map_scroll_zoom'    => '0',
				default                   => $default,
			};
		} );
		$this->mock_free_plan();

		$controller = new MapSettingsController();
		$response   = $controller->show();

		$data = $response->get_data();
		$this->assertEquals( '', $data['googleApiKey'] ); // Hidden
	}

	// ──────────────────────────────────────────────────────────────────────────
	// update (PUT) — Provider Validation
	// ──────────────────────────────────────────────────────────────────────────

	public function test_update_akzeptiert_osm_provider(): void {
		$this->mock_get_option_defaults();
		$this->mock_free_plan();
		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'update_option' )
			->once()
			->with( 'resa_map_provider', 'osm' );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'provider' => 'osm',
		] );

		$controller = new MapSettingsController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	public function test_update_gibt_fehler_bei_ungueltigem_provider(): void {
		Functions\when( '__' )->returnArg();
		$this->mock_free_plan();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'provider' => 'invalid_provider',
		] );

		$controller = new MapSettingsController();
		$result     = $controller->update( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'resa_validation_error', $result->get_error_code() );

		$data = $result->get_error_data();
		$this->assertArrayHasKey( 'errors', $data );
		$this->assertArrayHasKey( 'provider', $data['errors'] );
	}

	public function test_update_lehnt_google_provider_fuer_free_plan_ab(): void {
		Functions\when( '__' )->returnArg();
		$this->mock_free_plan();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'provider' => 'google',
		] );

		$controller = new MapSettingsController();
		$result     = $controller->update( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'resa_validation_error', $result->get_error_code() );

		$data = $result->get_error_data();
		$this->assertStringContainsString( 'Premium', $data['errors']['provider'] );
	}

	public function test_update_akzeptiert_google_provider_fuer_premium_plan(): void {
		$this->mock_get_option_defaults();
		$this->mock_premium_plan();
		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'update_option' )
			->once()
			->with( 'resa_map_provider', 'google' );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'provider' => 'google',
		] );

		$controller = new MapSettingsController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	// ──────────────────────────────────────────────────────────────────────────
	// update (PUT) — Tile Style Validation
	// ──────────────────────────────────────────────────────────────────────────

	public function test_update_akzeptiert_minimal_style_fuer_free_plan(): void {
		$this->mock_get_option_defaults();
		$this->mock_free_plan();
		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'update_option' )
			->once()
			->with( 'resa_map_tile_style', 'minimal' );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'tileStyle' => 'minimal',
		] );

		$controller = new MapSettingsController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	public function test_update_lehnt_standard_style_fuer_free_plan_ab(): void {
		Functions\when( '__' )->returnArg();
		$this->mock_free_plan();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'tileStyle' => 'standard',
		] );

		$controller = new MapSettingsController();
		$result     = $controller->update( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'resa_validation_error', $result->get_error_code() );

		$data = $result->get_error_data();
		$this->assertStringContainsString( 'Premium', $data['errors']['tileStyle'] );
	}

	public function test_update_lehnt_dark_style_fuer_free_plan_ab(): void {
		Functions\when( '__' )->returnArg();
		$this->mock_free_plan();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'tileStyle' => 'dark',
		] );

		$controller = new MapSettingsController();
		$result     = $controller->update( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
	}

	public function test_update_akzeptiert_alle_styles_fuer_premium_plan(): void {
		$this->mock_get_option_defaults();
		$this->mock_premium_plan();
		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'update_option' )
			->once()
			->with( 'resa_map_tile_style', 'dark' );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'tileStyle' => 'dark',
		] );

		$controller = new MapSettingsController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	public function test_update_gibt_fehler_bei_ungueltigem_tile_style(): void {
		Functions\when( '__' )->returnArg();
		$this->mock_premium_plan();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'tileStyle' => 'fancy',
		] );

		$controller = new MapSettingsController();
		$result     = $controller->update( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'resa_validation_error', $result->get_error_code() );
	}

	// ──────────────────────────────────────────────────────────────────────────
	// update (PUT) — Zoom Level Validation
	// ──────────────────────────────────────────────────────────────────────────

	public function test_update_akzeptiert_gueltigen_zoom(): void {
		$this->mock_get_option_defaults();
		$this->mock_free_plan();
		Functions\expect( 'absint' )->andReturnUsing( 'intval' );
		Functions\expect( 'update_option' )
			->once()
			->with( 'resa_map_default_zoom', 15 );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'defaultZoom' => 15,
		] );

		$controller = new MapSettingsController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	public function test_update_gibt_fehler_bei_zoom_unter_1(): void {
		Functions\when( '__' )->returnArg();
		Functions\expect( 'absint' )->andReturnUsing( 'intval' );
		$this->mock_free_plan();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'defaultZoom' => 0,
		] );

		$controller = new MapSettingsController();
		$result     = $controller->update( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'resa_validation_error', $result->get_error_code() );

		$data = $result->get_error_data();
		$this->assertArrayHasKey( 'defaultZoom', $data['errors'] );
	}

	public function test_update_gibt_fehler_bei_zoom_ueber_20(): void {
		Functions\when( '__' )->returnArg();
		Functions\expect( 'absint' )->andReturnUsing( 'intval' );
		$this->mock_free_plan();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'defaultZoom' => 25,
		] );

		$controller = new MapSettingsController();
		$result     = $controller->update( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
	}

	public function test_update_akzeptiert_zoom_am_unteren_rand(): void {
		$this->mock_get_option_defaults();
		$this->mock_free_plan();
		Functions\expect( 'absint' )->andReturnUsing( 'intval' );
		Functions\expect( 'update_option' )
			->once()
			->with( 'resa_map_default_zoom', 1 );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'defaultZoom' => 1,
		] );

		$controller = new MapSettingsController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	public function test_update_akzeptiert_zoom_am_oberen_rand(): void {
		$this->mock_get_option_defaults();
		$this->mock_free_plan();
		Functions\expect( 'absint' )->andReturnUsing( 'intval' );
		Functions\expect( 'update_option' )
			->once()
			->with( 'resa_map_default_zoom', 20 );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'defaultZoom' => 20,
		] );

		$controller = new MapSettingsController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	// ──────────────────────────────────────────────────────────────────────────
	// update (PUT) — Google API Key
	// ──────────────────────────────────────────────────────────────────────────

	public function test_update_speichert_google_api_key_fuer_premium(): void {
		$this->mock_get_option_defaults();
		$this->mock_premium_plan();
		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'update_option' )
			->once()
			->with( 'resa_map_google_api_key', 'AIzaSyNewKey123' );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'googleApiKey' => 'AIzaSyNewKey123',
		] );

		$controller = new MapSettingsController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	public function test_update_ignoriert_google_api_key_fuer_free_plan(): void {
		$this->mock_get_option_defaults();
		$this->mock_free_plan();
		// No update_option for google_api_key should be called

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'googleApiKey' => 'AIzaSyIgnored123',
		] );

		$controller = new MapSettingsController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	public function test_update_erlaubt_leeren_google_api_key(): void {
		$this->mock_get_option_defaults();
		$this->mock_premium_plan();
		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'update_option' )
			->once()
			->with( 'resa_map_google_api_key', '' );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'googleApiKey' => '',
		] );

		$controller = new MapSettingsController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	// ──────────────────────────────────────────────────────────────────────────
	// update (PUT) — Scroll Zoom
	// ──────────────────────────────────────────────────────────────────────────

	public function test_update_speichert_scrollZoom_true(): void {
		$this->mock_get_option_defaults();
		$this->mock_free_plan();
		Functions\expect( 'update_option' )
			->once()
			->with( 'resa_map_scroll_zoom', '1' );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'scrollZoom' => true,
		] );

		$controller = new MapSettingsController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	public function test_update_speichert_scrollZoom_false(): void {
		$this->mock_get_option_defaults();
		$this->mock_free_plan();
		Functions\expect( 'update_option' )
			->once()
			->with( 'resa_map_scroll_zoom', '0' );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'scrollZoom' => false,
		] );

		$controller = new MapSettingsController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	// ──────────────────────────────────────────────────────────────────────────
	// update (PUT) — Multiple fields
	// ──────────────────────────────────────────────────────────────────────────

	public function test_update_speichert_mehrere_felder(): void {
		$this->mock_get_option_defaults();
		$this->mock_premium_plan();
		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'absint' )->andReturnUsing( 'intval' );

		Functions\expect( 'update_option' )
			->once()
			->with( 'resa_map_provider', 'google' );
		Functions\expect( 'update_option' )
			->once()
			->with( 'resa_map_tile_style', 'dark' );
		Functions\expect( 'update_option' )
			->once()
			->with( 'resa_map_default_zoom', 18 );
		Functions\expect( 'update_option' )
			->once()
			->with( 'resa_map_google_api_key', 'AIzaSyTest' );
		Functions\expect( 'update_option' )
			->once()
			->with( 'resa_map_scroll_zoom', '1' );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'provider'     => 'google',
			'tileStyle'    => 'dark',
			'defaultZoom'  => 18,
			'googleApiKey' => 'AIzaSyTest',
			'scrollZoom'   => true,
		] );

		$controller = new MapSettingsController();
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

		$controller = new MapSettingsController();
		$this->assertTrue( $controller->adminAccess() );
	}

	public function test_adminAccess_verweigert_ohne_capability(): void {
		Functions\expect( 'current_user_can' )
			->once()
			->with( 'manage_options' )
			->andReturn( false );

		$controller = new MapSettingsController();
		$this->assertFalse( $controller->adminAccess() );
	}

	// ──────────────────────────────────────────────────────────────────────────
	// Edge Cases
	// ──────────────────────────────────────────────────────────────────────────

	public function test_update_mit_leerem_request_macht_keine_aenderungen(): void {
		$this->mock_get_option_defaults();
		$this->mock_free_plan();
		// No update_option should be called

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [] );

		$controller = new MapSettingsController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	public function test_update_ignoriert_unbekannte_parameter(): void {
		$this->mock_get_option_defaults();
		$this->mock_free_plan();
		// No update_option for unknown fields

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'unknownField' => 'value',
			'randomStuff'  => 123,
		] );

		$controller = new MapSettingsController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	// ──────────────────────────────────────────────────────────────────────────
	// Freemius Feature Flags
	// ──────────────────────────────────────────────────────────────────────────

	public function test_ohne_freemius_funktion_ist_free_plan(): void {
		$this->mock_get_option_defaults();
		Functions\when( 'function_exists' )->justReturn( false );

		$controller = new MapSettingsController();
		$response   = $controller->show();

		$data = $response->get_data();
		$this->assertFalse( $data['canUseGoogle'] );
		$this->assertFalse( $data['canSelectStyle'] );
	}

	// ──────────────────────────────────────────────────────────────────────────
	// Helper
	// ──────────────────────────────────────────────────────────────────────────

	private function mock_get_option_defaults(): void {
		Functions\when( 'get_option' )->alias( function ( string $key, $default = false ) {
			return match ( $key ) {
				'resa_map_provider'       => 'osm',
				'resa_map_tile_style'     => 'minimal',
				'resa_map_default_zoom'   => 13,
				'resa_map_google_api_key' => '',
				'resa_map_scroll_zoom'    => '0',
				default                   => $default,
			};
		} );
	}

	private function mock_free_plan(): void {
		Functions\when( 'function_exists' )->justReturn( true );

		$freemius_mock = Mockery::mock( 'Freemius' );
		$freemius_mock->shouldReceive( 'can_use_premium_code' )->andReturn( false );
		Functions\when( 'resa_fs' )->justReturn( $freemius_mock );
	}

	private function mock_premium_plan(): void {
		Functions\when( 'function_exists' )->justReturn( true );

		$freemius_mock = Mockery::mock( 'Freemius' );
		$freemius_mock->shouldReceive( 'can_use_premium_code' )->andReturn( true );
		Functions\when( 'resa_fs' )->justReturn( $freemius_mock );
	}
}
