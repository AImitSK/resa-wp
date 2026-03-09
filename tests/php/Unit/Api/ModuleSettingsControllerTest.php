<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Api;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Api\ModuleSettingsController;
use Resa\Core\ModuleInterface;
use Resa\Core\ModuleRegistry;

/**
 * Unit tests for ModuleSettingsController.
 *
 * Tests the REST API endpoints for module settings management:
 * - GET /admin/modules/{slug}/settings (get settings)
 * - PUT /admin/modules/{slug}/settings (save settings)
 * - GET /admin/modules/{slug}/presets (get available presets)
 * - GET /admin/modules/{slug}/pdf-settings (get PDF settings)
 * - PUT /admin/modules/{slug}/pdf-settings (save PDF settings)
 * - PUT /admin/modules/{slug}/settings/locations/{location_id} (save location value)
 * - DELETE /admin/modules/{slug}/settings/locations/{location_id} (delete location value)
 */
class ModuleSettingsControllerTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		// Set up global $wpdb mock.
		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';

		// Common WordPress function mocks.
		Functions\when( 'sanitize_key' )->returnArg();
		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\when( '__' )->returnArg();
		Functions\when( 'esc_html__' )->returnArg();
		Functions\when( 'esc_html' )->returnArg();
		Functions\when( 'absint' )->alias( fn( $n ) => abs( (int) $n ) );
		Functions\when( 'wp_json_encode' )->alias( fn( $d ) => json_encode( $d ) );
		Functions\when( 'current_time' )->justReturn( '2024-01-01 12:00:00' );
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Create a mock module.
	 */
	private function createMockModule( string $slug = 'rent-calculator' ): ModuleInterface {
		$module = Mockery::mock( ModuleInterface::class );
		$module->shouldReceive( 'getSlug' )->andReturn( $slug );
		$module->shouldReceive( 'getName' )->andReturn( 'Mietpreis-Kalkulator' );
		$module->shouldReceive( 'getDescription' )->andReturn( 'Berechnet Mietpreise' );
		$module->shouldReceive( 'getFlag' )->andReturn( 'free' );
		$module->shouldReceive( 'isActive' )->andReturn( true );
		$module->shouldReceive( 'toArray' )->andReturn( [
			'slug'        => $slug,
			'name'        => 'Mietpreis-Kalkulator',
			'description' => 'Berechnet Mietpreise',
			'flag'        => 'free',
			'active'      => true,
		] );

		return $module;
	}

	/**
	 * Create a mock Plugin instance with registry.
	 */
	private function createMockPlugin( ?ModuleInterface $module = null ): void {
		$registry = Mockery::mock( ModuleRegistry::class );

		if ( $module ) {
			$registry->shouldReceive( 'get' )
				->with( $module->getSlug() )
				->andReturn( $module );
		}

		$registry->shouldReceive( 'get' )
			->andReturn( null ); // Default for unknown slugs.

		$plugin = Mockery::mock( 'overload:Resa\Core\Plugin' );
		$plugin->shouldReceive( 'getInstance' )->andReturn( $plugin );
		$plugin->shouldReceive( 'getModuleRegistry' )->andReturn( $registry );
	}

	// -------------------------------------------------------------------------
	// Route Registration Tests
	// -------------------------------------------------------------------------

	public function test_registerRoutes_registriert_alle_endpoints(): void {
		Functions\expect( 'register_rest_route' )
			->times( 4 )
			->with(
				'resa/v1',
				Mockery::anyOf(
					'/admin/modules/(?P<slug>[a-z0-9-]+)/settings',
					'/admin/modules/(?P<slug>[a-z0-9-]+)/presets',
					'/admin/modules/(?P<slug>[a-z0-9-]+)/pdf-settings',
					'/admin/modules/(?P<slug>[a-z0-9-]+)/settings/locations/(?P<location_id>\d+)'
				),
				Mockery::type( 'array' )
			);

		$controller = new ModuleSettingsController();
		$controller->registerRoutes();
	}

	// -------------------------------------------------------------------------
	// GET /admin/modules/{slug}/settings
	// -------------------------------------------------------------------------

	public function test_getSettings_gibt_gespeicherte_settings_zurueck(): void {
		global $wpdb;

		$module = $this->createMockModule();
		$this->createMockPlugin( $module );

		$settingsRow = (object) [
			'id'              => 1,
			'module_slug'     => 'rent-calculator',
			'setup_mode'      => 'pauschal',
			'region_preset'   => 'medium_city',
			'factors'         => '{"base_price":15.5}',
			'location_values' => '{}',
			'created_at'      => '2024-01-01',
			'updated_at'      => '2024-01-01',
		];

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( $settingsRow );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'slug' )->andReturn( 'rent-calculator' );

		$controller = new ModuleSettingsController();
		$response   = $controller->getSettings( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertSame( 'rent-calculator', $data['module_slug'] );
		$this->assertSame( 'pauschal', $data['setup_mode'] );
		$this->assertArrayHasKey( 'module', $data );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	public function test_getSettings_gibt_defaults_wenn_keine_settings_existieren(): void {
		global $wpdb;

		$module = $this->createMockModule();
		$this->createMockPlugin( $module );

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( null );

		// Mock RentCalculatorService for default factors.
		$rentService = Mockery::mock( 'alias:Resa\Modules\RentCalculator\RentCalculatorService' );
		$rentService->shouldReceive( 'getRegionPresets' )->andReturn( [
			'medium_city' => [ 'base_price' => 12.0 ],
		] );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'slug' )->andReturn( 'rent-calculator' );

		$controller = new ModuleSettingsController();
		$response   = $controller->getSettings( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$data = $response->get_data();

		$this->assertSame( 'rent-calculator', $data['module_slug'] );
		$this->assertSame( 'pauschal', $data['setup_mode'] );
		$this->assertSame( 'medium_city', $data['region_preset'] );
	}

	public function test_getSettings_gibt_404_fuer_unbekanntes_modul(): void {
		$this->createMockPlugin( null );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'slug' )->andReturn( 'unknown-module' );

		$controller = new ModuleSettingsController();
		$response   = $controller->getSettings( $request );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'resa_not_found', $response->get_error_code() );
	}

	// -------------------------------------------------------------------------
	// PUT /admin/modules/{slug}/settings
	// -------------------------------------------------------------------------

	public function test_saveSettings_speichert_settings(): void {
		global $wpdb;

		$module = $this->createMockModule();
		$this->createMockPlugin( $module );

		// getBySlug returns null (new settings).
		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( null );
		$wpdb->shouldReceive( 'insert' )->andReturn( 1 );

		// After save, return the new settings.
		$settingsRow = (object) [
			'id'              => 1,
			'module_slug'     => 'rent-calculator',
			'setup_mode'      => 'individuell',
			'region_preset'   => 'large_city',
			'factors'         => '{"base_price":18.0}',
			'location_values' => '{}',
			'created_at'      => '2024-01-01',
			'updated_at'      => '2024-01-01',
		];
		$wpdb->shouldReceive( 'get_row' )->andReturn( $settingsRow );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'slug' )->andReturn( 'rent-calculator' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'setup_mode'    => 'individuell',
			'region_preset' => 'large_city',
			'factors'       => [ 'base_price' => 18.0 ],
		] );

		$controller = new ModuleSettingsController();
		$response   = $controller->saveSettings( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$this->assertSame( 200, $response->get_status() );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	public function test_saveSettings_ladet_preset_factors_bei_pauschal_mode(): void {
		global $wpdb;

		$module = $this->createMockModule();
		$this->createMockPlugin( $module );

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( null );
		$wpdb->shouldReceive( 'insert' )->andReturn( 1 );

		// Mock RentCalculatorService for presets.
		$rentService = Mockery::mock( 'alias:Resa\Modules\RentCalculator\RentCalculatorService' );
		$rentService->shouldReceive( 'getRegionPresets' )->andReturn( [
			'large_city' => [ 'base_price' => 20.0, 'premium' => 1.2 ],
		] );

		$settingsRow = (object) [
			'id'              => 1,
			'module_slug'     => 'rent-calculator',
			'setup_mode'      => 'pauschal',
			'region_preset'   => 'large_city',
			'factors'         => '{"base_price":20.0,"premium":1.2}',
			'location_values' => '{}',
			'created_at'      => '2024-01-01',
			'updated_at'      => '2024-01-01',
		];
		$wpdb->shouldReceive( 'get_row' )->andReturn( $settingsRow );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'slug' )->andReturn( 'rent-calculator' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'setup_mode'    => 'pauschal',
			'region_preset' => 'large_city',
		] );

		$controller = new ModuleSettingsController();
		$response   = $controller->saveSettings( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	public function test_saveSettings_gibt_404_fuer_unbekanntes_modul(): void {
		$this->createMockPlugin( null );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'slug' )->andReturn( 'unknown-module' );

		$controller = new ModuleSettingsController();
		$response   = $controller->saveSettings( $request );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'resa_not_found', $response->get_error_code() );
	}

	// -------------------------------------------------------------------------
	// GET /admin/modules/{slug}/presets
	// -------------------------------------------------------------------------

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	public function test_getPresets_gibt_presets_fuer_rent_calculator(): void {
		$module = $this->createMockModule( 'rent-calculator' );
		$this->createMockPlugin( $module );

		// Mock RentCalculatorService.
		$rentService = Mockery::mock( 'alias:Resa\Modules\RentCalculator\RentCalculatorService' );
		$rentService->shouldReceive( 'getRegionPresets' )->andReturn( [
			'rural'       => [ 'base_price' => 8.0 ],
			'small_town'  => [ 'base_price' => 10.0 ],
			'medium_city' => [ 'base_price' => 12.0 ],
			'large_city'  => [ 'base_price' => 18.0 ],
		] );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'slug' )->andReturn( 'rent-calculator' );

		$controller = new ModuleSettingsController();
		$response   = $controller->getPresets( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$data = $response->get_data();

		$this->assertArrayHasKey( 'rural', $data );
		$this->assertArrayHasKey( 'large_city', $data );
	}

	public function test_getPresets_gibt_default_presets_fuer_andere_module(): void {
		$module = $this->createMockModule( 'value-calculator' );
		$this->createMockPlugin( $module );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'slug' )->andReturn( 'value-calculator' );

		$controller = new ModuleSettingsController();
		$response   = $controller->getPresets( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$data = $response->get_data();

		$this->assertArrayHasKey( 'rural', $data );
		$this->assertArrayHasKey( 'medium_city', $data );
	}

	public function test_getPresets_gibt_404_fuer_unbekanntes_modul(): void {
		$this->createMockPlugin( null );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'slug' )->andReturn( 'unknown' );

		$controller = new ModuleSettingsController();
		$response   = $controller->getPresets( $request );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'resa_not_found', $response->get_error_code() );
	}

	// -------------------------------------------------------------------------
	// GET /admin/modules/{slug}/pdf-settings
	// -------------------------------------------------------------------------

	public function test_getPdfSettings_gibt_defaults_zurueck(): void {
		$module = $this->createMockModule();
		$this->createMockPlugin( $module );

		Functions\when( 'get_option' )->justReturn( [] );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'slug' )->andReturn( 'rent-calculator' );

		$controller = new ModuleSettingsController();
		$response   = $controller->getPdfSettings( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$data = $response->get_data();

		$this->assertTrue( $data['showChart'] );
		$this->assertTrue( $data['showFactors'] );
		$this->assertTrue( $data['showMap'] );
		$this->assertTrue( $data['showCta'] );
		$this->assertTrue( $data['showDisclaimer'] );
	}

	public function test_getPdfSettings_gibt_gespeicherte_werte_zurueck(): void {
		$module = $this->createMockModule();
		$this->createMockPlugin( $module );

		Functions\when( 'get_option' )->justReturn( [
			'showChart'   => false,
			'showFactors' => false,
			'ctaTitle'    => 'Jetzt Kontakt aufnehmen',
		] );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'slug' )->andReturn( 'rent-calculator' );

		$controller = new ModuleSettingsController();
		$response   = $controller->getPdfSettings( $request );

		$data = $response->get_data();
		$this->assertFalse( $data['showChart'] );
		$this->assertFalse( $data['showFactors'] );
		$this->assertSame( 'Jetzt Kontakt aufnehmen', $data['ctaTitle'] );
	}

	public function test_getPdfSettings_gibt_404_fuer_unbekanntes_modul(): void {
		$this->createMockPlugin( null );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'slug' )->andReturn( 'unknown' );

		$controller = new ModuleSettingsController();
		$response   = $controller->getPdfSettings( $request );

		$this->assertInstanceOf( \WP_Error::class, $response );
	}

	// -------------------------------------------------------------------------
	// PUT /admin/modules/{slug}/pdf-settings
	// -------------------------------------------------------------------------

	public function test_savePdfSettings_speichert_settings(): void {
		$module = $this->createMockModule();
		$this->createMockPlugin( $module );

		Functions\when( 'get_option' )->justReturn( [] );
		Functions\expect( 'update_option' )
			->once()
			->with(
				'resa_module_pdf_rent-calculator',
				Mockery::on( function ( $data ) {
					return $data['showChart'] === false
						&& $data['ctaTitle'] === 'Kontakt';
				} )
			);

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'slug' )->andReturn( 'rent-calculator' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'showChart' => false,
			'ctaTitle'  => 'Kontakt',
		] );

		$controller = new ModuleSettingsController();
		$response   = $controller->savePdfSettings( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	public function test_savePdfSettings_gibt_404_fuer_unbekanntes_modul(): void {
		$this->createMockPlugin( null );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'slug' )->andReturn( 'unknown' );

		$controller = new ModuleSettingsController();
		$response   = $controller->savePdfSettings( $request );

		$this->assertInstanceOf( \WP_Error::class, $response );
	}

	// -------------------------------------------------------------------------
	// PUT /admin/modules/{slug}/settings/locations/{location_id}
	// -------------------------------------------------------------------------

	public function test_saveLocationValue_speichert_standort_werte(): void {
		global $wpdb;

		$module = $this->createMockModule();
		$this->createMockPlugin( $module );

		$settingsRow = (object) [
			'id'              => 1,
			'module_slug'     => 'rent-calculator',
			'setup_mode'      => 'individuell',
			'region_preset'   => 'medium_city',
			'factors'         => '{}',
			'location_values' => '{}',
			'created_at'      => '2024-01-01',
			'updated_at'      => '2024-01-01',
		];

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( $settingsRow );
		$wpdb->shouldReceive( 'update' )->andReturn( 1 );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'slug' )->andReturn( 'rent-calculator' );
		$request->shouldReceive( 'get_param' )->with( 'location_id' )->andReturn( 1 );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'base_price' => 16.5,
			'premium'    => 1.1,
		] );

		$controller = new ModuleSettingsController();
		$response   = $controller->saveLocationValue( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$data = $response->get_data();

		$this->assertSame( 1, $data['location_id'] );
		$this->assertArrayHasKey( 'values', $data );
	}

	public function test_saveLocationValue_gibt_404_fuer_unbekanntes_modul(): void {
		$this->createMockPlugin( null );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'slug' )->andReturn( 'unknown' );
		$request->shouldReceive( 'get_param' )->with( 'location_id' )->andReturn( 1 );

		$controller = new ModuleSettingsController();
		$response   = $controller->saveLocationValue( $request );

		$this->assertInstanceOf( \WP_Error::class, $response );
	}

	// -------------------------------------------------------------------------
	// DELETE /admin/modules/{slug}/settings/locations/{location_id}
	// -------------------------------------------------------------------------

	public function test_deleteLocationValue_loescht_standort_werte(): void {
		global $wpdb;

		$settingsRow = (object) [
			'id'              => 1,
			'module_slug'     => 'rent-calculator',
			'setup_mode'      => 'individuell',
			'region_preset'   => 'medium_city',
			'factors'         => '{}',
			'location_values' => '{"1":{"base_price":15}}',
			'created_at'      => '2024-01-01',
			'updated_at'      => '2024-01-01',
		];

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( $settingsRow );
		$wpdb->shouldReceive( 'update' )->andReturn( 1 );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'slug' )->andReturn( 'rent-calculator' );
		$request->shouldReceive( 'get_param' )->with( 'location_id' )->andReturn( 1 );

		$controller = new ModuleSettingsController();
		$response   = $controller->deleteLocationValue( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$data = $response->get_data();
		$this->assertTrue( $data['deleted'] );
	}

	public function test_deleteLocationValue_gibt_erfolg_wenn_keine_settings_existieren(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( null );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'slug' )->andReturn( 'rent-calculator' );
		$request->shouldReceive( 'get_param' )->with( 'location_id' )->andReturn( 1 );

		$controller = new ModuleSettingsController();
		$response   = $controller->deleteLocationValue( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$data = $response->get_data();
		$this->assertTrue( $data['deleted'] );
	}

	// -------------------------------------------------------------------------
	// Permission Tests
	// -------------------------------------------------------------------------

	public function test_adminAccess_prueft_capability(): void {
		Functions\when( 'current_user_can' )->justReturn( true );

		$controller = new ModuleSettingsController();
		$this->assertTrue( $controller->adminAccess() );
	}

	public function test_adminAccess_verweigert_zugriff_ohne_capability(): void {
		Functions\when( 'current_user_can' )->justReturn( false );

		$controller = new ModuleSettingsController();
		$this->assertFalse( $controller->adminAccess() );
	}
}
