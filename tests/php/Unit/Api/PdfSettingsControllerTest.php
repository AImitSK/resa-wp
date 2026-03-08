<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Api;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Api\PdfSettingsController;

class PdfSettingsControllerTest extends TestCase {

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

	public function test_registerRoutes_registriert_admin_pdf_settings_endpoint(): void {
		Functions\expect( 'register_rest_route' )
			->once()
			->with(
				'resa/v1',
				'/admin/pdf/settings',
				Mockery::on( function ( array $args ): bool {
					// Should have GET and PUT handlers
					return count( $args ) === 2
						&& $args[0]['methods'] === 'GET'
						&& $args[1]['methods'] === 'PUT'
						&& is_callable( $args[0]['permission_callback'] )
						&& is_callable( $args[1]['permission_callback'] );
				} )
			);

		$controller = new PdfSettingsController();
		$controller->registerRoutes();
	}

	// ──────────────────────────────────────────────────────────────────────────
	// show (GET)
	// ──────────────────────────────────────────────────────────────────────────

	public function test_show_gibt_default_werte_ohne_gespeicherte_einstellungen(): void {
		Functions\expect( 'get_option' )
			->with( 'resa_pdf_settings', [] )
			->andReturn( [] );

		$controller = new PdfSettingsController();
		$response   = $controller->show();

		$this->assertInstanceOf( \WP_REST_Response::class, $response );

		$data = $response->get_data();
		$this->assertEquals( '', $data['headerText'] );
		$this->assertEquals( '', $data['footerText'] );
		$this->assertTrue( $data['showDate'] );
		$this->assertTrue( $data['showAgents'] );
		$this->assertEquals( 'left', $data['logoPosition'] );
		$this->assertEquals( 36, $data['logoSize'] );
		$this->assertEquals( [ 'top' => 20, 'bottom' => 25, 'left' => 15, 'right' => 15 ], $data['margins'] );
	}

	public function test_show_gibt_gespeicherte_werte_zurueck(): void {
		Functions\expect( 'get_option' )
			->with( 'resa_pdf_settings', [] )
			->andReturn( [
				'header_text'   => 'Meine Firma GmbH',
				'footer_text'   => '© 2024 Alle Rechte vorbehalten',
				'show_date'     => false,
				'show_agents'   => false,
				'logo_position' => 'center',
				'logo_size'     => 50,
				'margins'       => [
					'top'    => 30,
					'bottom' => 35,
					'left'   => 20,
					'right'  => 20,
				],
			] );

		$controller = new PdfSettingsController();
		$response   = $controller->show();

		$data = $response->get_data();
		$this->assertEquals( 'Meine Firma GmbH', $data['headerText'] );
		$this->assertEquals( '© 2024 Alle Rechte vorbehalten', $data['footerText'] );
		$this->assertFalse( $data['showDate'] );
		$this->assertFalse( $data['showAgents'] );
		$this->assertEquals( 'center', $data['logoPosition'] );
		$this->assertEquals( 50, $data['logoSize'] );
		$this->assertEquals( [ 'top' => 30, 'bottom' => 35, 'left' => 20, 'right' => 20 ], $data['margins'] );
	}

	public function test_show_merged_teile_einstellungen_mit_defaults(): void {
		Functions\expect( 'get_option' )
			->with( 'resa_pdf_settings', [] )
			->andReturn( [
				'header_text' => 'Nur Header',
				// Rest bleibt default
			] );

		$controller = new PdfSettingsController();
		$response   = $controller->show();

		$data = $response->get_data();
		$this->assertEquals( 'Nur Header', $data['headerText'] );
		$this->assertEquals( '', $data['footerText'] ); // default
		$this->assertTrue( $data['showDate'] );         // default
		$this->assertEquals( 36, $data['logoSize'] );   // default
	}

	// ──────────────────────────────────────────────────────────────────────────
	// update (PUT) — einzelne Felder
	// ──────────────────────────────────────────────────────────────────────────

	public function test_update_speichert_headerText(): void {
		$this->mock_get_option_defaults();
		Functions\expect( 'sanitize_text_field' )
			->andReturnFirstArg();
		Functions\expect( 'update_option' )
			->once()
			->with(
				'resa_pdf_settings',
				Mockery::on( fn( $arr ) => $arr['header_text'] === 'Neue Überschrift' )
			);

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'headerText' => 'Neue Überschrift',
		] );

		$controller = new PdfSettingsController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$this->assertEquals( 'Neue Überschrift', $response->get_data()['headerText'] );
	}

	public function test_update_speichert_footerText(): void {
		$this->mock_get_option_defaults();
		Functions\expect( 'sanitize_text_field' )
			->andReturnFirstArg();
		Functions\expect( 'update_option' )
			->once()
			->with(
				'resa_pdf_settings',
				Mockery::on( fn( $arr ) => $arr['footer_text'] === '© 2024' )
			);

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'footerText' => '© 2024',
		] );

		$controller = new PdfSettingsController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	public function test_update_speichert_showDate_als_boolean(): void {
		$this->mock_get_option_defaults();
		Functions\expect( 'update_option' )
			->once()
			->with(
				'resa_pdf_settings',
				Mockery::on( fn( $arr ) => $arr['show_date'] === false )
			);

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'showDate' => false,
		] );

		$controller = new PdfSettingsController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$this->assertFalse( $response->get_data()['showDate'] );
	}

	public function test_update_speichert_showAgents_als_boolean(): void {
		$this->mock_get_option_defaults();
		Functions\expect( 'update_option' )
			->once()
			->with(
				'resa_pdf_settings',
				Mockery::on( fn( $arr ) => $arr['show_agents'] === false )
			);

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'showAgents' => false,
		] );

		$controller = new PdfSettingsController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	// ──────────────────────────────────────────────────────────────────────────
	// update (PUT) — logoPosition Validation
	// ──────────────────────────────────────────────────────────────────────────

	public function test_update_akzeptiert_gueltige_logoPosition_left(): void {
		$this->mock_get_option_defaults();
		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'update_option' )
			->once()
			->with(
				'resa_pdf_settings',
				Mockery::on( fn( $arr ) => $arr['logo_position'] === 'left' )
			);

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'logoPosition' => 'left',
		] );

		$controller = new PdfSettingsController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	public function test_update_akzeptiert_gueltige_logoPosition_center(): void {
		$this->mock_get_option_defaults();
		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'update_option' )
			->once()
			->with(
				'resa_pdf_settings',
				Mockery::on( fn( $arr ) => $arr['logo_position'] === 'center' )
			);

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'logoPosition' => 'center',
		] );

		$controller = new PdfSettingsController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	public function test_update_akzeptiert_gueltige_logoPosition_right(): void {
		$this->mock_get_option_defaults();
		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'update_option' )
			->once()
			->with(
				'resa_pdf_settings',
				Mockery::on( fn( $arr ) => $arr['logo_position'] === 'right' )
			);

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'logoPosition' => 'right',
		] );

		$controller = new PdfSettingsController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	public function test_update_setzt_ungueltige_logoPosition_auf_left(): void {
		$this->mock_get_option_defaults();
		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'update_option' )
			->once()
			->with(
				'resa_pdf_settings',
				Mockery::on( fn( $arr ) => $arr['logo_position'] === 'left' )
			);

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'logoPosition' => 'invalid',
		] );

		$controller = new PdfSettingsController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	// ──────────────────────────────────────────────────────────────────────────
	// update (PUT) — logoSize Validation
	// ──────────────────────────────────────────────────────────────────────────

	public function test_update_speichert_logoSize_als_integer(): void {
		$this->mock_get_option_defaults();
		Functions\expect( 'absint' )->andReturnUsing( 'intval' );
		Functions\expect( 'update_option' )
			->once()
			->with(
				'resa_pdf_settings',
				Mockery::on( fn( $arr ) => $arr['logo_size'] === 48 )
			);

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'logoSize' => 48,
		] );

		$controller = new PdfSettingsController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	public function test_update_clampt_logoSize_minimum_auf_16(): void {
		$this->mock_get_option_defaults();
		Functions\expect( 'absint' )->andReturnUsing( 'intval' );
		Functions\expect( 'update_option' )
			->once()
			->with(
				'resa_pdf_settings',
				Mockery::on( fn( $arr ) => $arr['logo_size'] === 16 )
			);

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'logoSize' => 5, // zu klein
		] );

		$controller = new PdfSettingsController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	public function test_update_clampt_logoSize_maximum_auf_80(): void {
		$this->mock_get_option_defaults();
		Functions\expect( 'absint' )->andReturnUsing( 'intval' );
		Functions\expect( 'update_option' )
			->once()
			->with(
				'resa_pdf_settings',
				Mockery::on( fn( $arr ) => $arr['logo_size'] === 80 )
			);

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'logoSize' => 150, // zu groß
		] );

		$controller = new PdfSettingsController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	// ──────────────────────────────────────────────────────────────────────────
	// update (PUT) — Margins
	// ──────────────────────────────────────────────────────────────────────────

	public function test_update_speichert_margins(): void {
		$this->mock_get_option_defaults();
		Functions\expect( 'absint' )->andReturnUsing( 'intval' );
		Functions\expect( 'update_option' )
			->once()
			->with(
				'resa_pdf_settings',
				Mockery::on( fn( $arr ) =>
					$arr['margins']['top'] === 25
					&& $arr['margins']['bottom'] === 30
					&& $arr['margins']['left'] === 10
					&& $arr['margins']['right'] === 10
				)
			);

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'margins' => [
				'top'    => 25,
				'bottom' => 30,
				'left'   => 10,
				'right'  => 10,
			],
		] );

		$controller = new PdfSettingsController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	public function test_update_clampt_margins_maximum_auf_50(): void {
		$this->mock_get_option_defaults();
		Functions\expect( 'absint' )->andReturnUsing( 'intval' );
		Functions\expect( 'update_option' )
			->once()
			->with(
				'resa_pdf_settings',
				Mockery::on( fn( $arr ) =>
					$arr['margins']['top'] === 50    // 100 → 50
					&& $arr['margins']['bottom'] === 50 // 200 → 50
				)
			);

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'margins' => [
				'top'    => 100, // zu groß
				'bottom' => 200, // zu groß
				'left'   => 15,
				'right'  => 15,
			],
		] );

		$controller = new PdfSettingsController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	public function test_update_verwendet_defaults_fuer_fehlende_margin_keys(): void {
		$this->mock_get_option_defaults();
		Functions\expect( 'absint' )->andReturnUsing( 'intval' );
		Functions\expect( 'update_option' )
			->once()
			->with(
				'resa_pdf_settings',
				Mockery::on( fn( $arr ) =>
					$arr['margins']['top'] === 30    // gesetzt
					&& $arr['margins']['bottom'] === 25 // default
					&& $arr['margins']['left'] === 15   // default
					&& $arr['margins']['right'] === 15  // default
				)
			);

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'margins' => [
				'top' => 30, // nur top angegeben
			],
		] );

		$controller = new PdfSettingsController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	// ──────────────────────────────────────────────────────────────────────────
	// update (PUT) — mehrere Felder gleichzeitig
	// ──────────────────────────────────────────────────────────────────────────

	public function test_update_speichert_mehrere_felder(): void {
		$this->mock_get_option_defaults();
		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'absint' )->andReturnUsing( 'intval' );
		Functions\expect( 'update_option' )
			->once()
			->with(
				'resa_pdf_settings',
				Mockery::on( fn( $arr ) =>
					$arr['header_text'] === 'Header'
					&& $arr['footer_text'] === 'Footer'
					&& $arr['show_date'] === false
					&& $arr['logo_position'] === 'right'
				)
			);

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'headerText'   => 'Header',
			'footerText'   => 'Footer',
			'showDate'     => false,
			'logoPosition' => 'right',
		] );

		$controller = new PdfSettingsController();
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

		$controller = new PdfSettingsController();
		$this->assertTrue( $controller->adminAccess() );
	}

	public function test_adminAccess_verweigert_ohne_capability(): void {
		Functions\expect( 'current_user_can' )
			->once()
			->with( 'manage_options' )
			->andReturn( false );

		$controller = new PdfSettingsController();
		$this->assertFalse( $controller->adminAccess() );
	}

	// ──────────────────────────────────────────────────────────────────────────
	// getSettings (static method)
	// ──────────────────────────────────────────────────────────────────────────

	public function test_getSettings_gibt_defaults_bei_nicht_array_zurueck(): void {
		Functions\expect( 'get_option' )
			->with( 'resa_pdf_settings', [] )
			->andReturn( 'invalid_string' );

		$settings = PdfSettingsController::getSettings();

		$this->assertIsArray( $settings );
		$this->assertEquals( '', $settings['header_text'] );
		$this->assertEquals( 20, $settings['margins']['top'] );
	}

	public function test_getSettings_merged_margins_korrekt(): void {
		Functions\expect( 'get_option' )
			->with( 'resa_pdf_settings', [] )
			->andReturn( [
				'margins' => [
					'top' => 40,
					// andere fehlen
				],
			] );

		$settings = PdfSettingsController::getSettings();

		$this->assertEquals( 40, $settings['margins']['top'] );
		$this->assertEquals( 25, $settings['margins']['bottom'] ); // default
		$this->assertEquals( 15, $settings['margins']['left'] );   // default
		$this->assertEquals( 15, $settings['margins']['right'] );  // default
	}

	// ──────────────────────────────────────────────────────────────────────────
	// Edge Cases
	// ──────────────────────────────────────────────────────────────────────────

	public function test_update_ignoriert_unbekannte_parameter(): void {
		$this->mock_get_option_defaults();
		Functions\expect( 'update_option' )
			->once()
			->with(
				'resa_pdf_settings',
				Mockery::on( fn( $arr ) =>
					! isset( $arr['unknown'] )
					&& ! isset( $arr['random'] )
				)
			);

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'unknown'   => 'value',
			'random'    => 123,
			'showDate'  => true, // gültiger Parameter
		] );

		$controller = new PdfSettingsController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	public function test_update_mit_leerem_request_speichert_ohne_aenderungen(): void {
		$this->mock_get_option_defaults();
		Functions\expect( 'update_option' )
			->once()
			->with( 'resa_pdf_settings', Mockery::type( 'array' ) );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [] );

		$controller = new PdfSettingsController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	// ──────────────────────────────────────────────────────────────────────────
	// Helper
	// ──────────────────────────────────────────────────────────────────────────

	private function mock_get_option_defaults(): void {
		Functions\when( 'get_option' )->alias( function ( string $key, $default = false ) {
			if ( $key === 'resa_pdf_settings' ) {
				return [];
			}
			return $default;
		} );
	}
}
