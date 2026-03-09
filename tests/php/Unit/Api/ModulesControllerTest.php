<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Api;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Api\ModulesController;
use Resa\Core\ModuleInterface;
use Resa\Core\ModuleRegistry;

/**
 * Unit tests for ModulesController.
 *
 * Tests the REST API endpoints for module management:
 * - GET /admin/modules (list all modules)
 * - POST /admin/modules/{slug}/toggle (toggle module activation)
 */
/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class ModulesControllerTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		// Common WordPress function mocks.
		Functions\when( 'sanitize_key' )->returnArg();
		Functions\when( '__' )->returnArg();
		Functions\when( 'esc_html__' )->returnArg();
		Functions\when( 'esc_html' )->returnArg();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Create a mock module.
	 */
	private function createMockModule( array $data = [] ): ModuleInterface {
		$defaults = [
			'slug'        => 'rent-calculator',
			'name'        => 'Mietpreis-Kalkulator',
			'description' => 'Berechnet Mietpreise',
			'flag'        => 'free',
			'active'      => true,
		];

		$data = array_merge( $defaults, $data );

		$module = Mockery::mock( ModuleInterface::class );
		$module->shouldReceive( 'getSlug' )->andReturn( $data['slug'] );
		$module->shouldReceive( 'getName' )->andReturn( $data['name'] );
		$module->shouldReceive( 'getDescription' )->andReturn( $data['description'] );
		$module->shouldReceive( 'getFlag' )->andReturn( $data['flag'] );
		$module->shouldReceive( 'isActive' )->andReturn( $data['active'] );
		$module->shouldReceive( 'setActive' )->andReturnUsing( function ( $state ) use ( $module, &$data ) {
			$data['active'] = $state;
		} );
		$module->shouldReceive( 'toArray' )->andReturn( [
			'slug'        => $data['slug'],
			'name'        => $data['name'],
			'description' => $data['description'],
			'flag'        => $data['flag'],
			'active'      => $data['active'],
		] );

		return $module;
	}

	/**
	 * Create a mock Plugin instance with registry.
	 */
	private function createMockPlugin( array $modules = [] ): void {
		$registry = Mockery::mock( ModuleRegistry::class );
		$registry->shouldReceive( 'getAll' )->andReturn( $modules );

		foreach ( $modules as $module ) {
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
			->twice()
			->with(
				'resa/v1',
				Mockery::anyOf(
					'/admin/modules',
					'/admin/modules/(?P<slug>[a-z0-9-]+)/toggle'
				),
				Mockery::type( 'array' )
			);

		$controller = new ModulesController();
		$controller->registerRoutes();
	}

	// -------------------------------------------------------------------------
	// GET /admin/modules (listModules)
	// -------------------------------------------------------------------------

	public function test_listModules_gibt_alle_module_zurueck(): void {
		$module1 = $this->createMockModule( [ 'slug' => 'rent-calculator', 'flag' => 'free' ] );
		$module2 = $this->createMockModule( [ 'slug' => 'value-calculator', 'flag' => 'free' ] );
		$module3 = $this->createMockModule( [ 'slug' => 'roi-calculator', 'flag' => 'pro' ] );

		$this->createMockPlugin( [ $module1, $module2, $module3 ] );

		$request = Mockery::mock( 'WP_REST_Request' );

		$controller = new ModulesController();
		$response   = $controller->listModules( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertCount( 3, $data );
		$this->assertSame( 'rent-calculator', $data[0]['slug'] );
	}

	public function test_listModules_gibt_fehler_wenn_plugin_nicht_initialisiert(): void {
		$plugin = Mockery::mock( 'overload:Resa\Core\Plugin' );
		$plugin->shouldReceive( 'getInstance' )->andReturn( null );

		$request = Mockery::mock( 'WP_REST_Request' );

		$controller = new ModulesController();
		$response   = $controller->listModules( $request );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'resa_plugin_not_initialized', $response->get_error_code() );
	}

	public function test_listModules_gibt_leeres_array_ohne_module(): void {
		$this->createMockPlugin( [] );

		$request = Mockery::mock( 'WP_REST_Request' );

		$controller = new ModulesController();
		$response   = $controller->listModules( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$data = $response->get_data();
		$this->assertIsArray( $data );
		$this->assertEmpty( $data );
	}

	// -------------------------------------------------------------------------
	// POST /admin/modules/{slug}/toggle (toggleModule)
	// -------------------------------------------------------------------------

	public function test_toggleModule_aktiviert_inaktives_modul(): void {
		$module = $this->createMockModule( [ 'slug' => 'rent-calculator', 'active' => false, 'flag' => 'free' ] );

		$registry = Mockery::mock( ModuleRegistry::class );
		$registry->shouldReceive( 'getAll' )->andReturn( [ $module ] );
		$registry->shouldReceive( 'get' )->with( 'rent-calculator' )->andReturn( $module );

		// Mock FeatureGate.
		$featureGate = Mockery::mock( 'overload:Resa\Freemius\FeatureGate' );
		$featureGate->shouldReceive( 'canActivateModule' )->andReturn( true );

		$plugin = Mockery::mock( 'overload:Resa\Core\Plugin' );
		$plugin->shouldReceive( 'getInstance' )->andReturn( $plugin );
		$plugin->shouldReceive( 'getModuleRegistry' )->andReturn( $registry );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'slug' )->andReturn( 'rent-calculator' );

		$controller = new ModulesController();
		$response   = $controller->toggleModule( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$data = $response->get_data();
		$this->assertSame( 'rent-calculator', $data['slug'] );
		$this->assertTrue( $data['active'] );
	}

	public function test_toggleModule_deaktiviert_aktives_modul(): void {
		$module = $this->createMockModule( [ 'slug' => 'rent-calculator', 'active' => true ] );

		$registry = Mockery::mock( ModuleRegistry::class );
		$registry->shouldReceive( 'getAll' )->andReturn( [ $module ] );
		$registry->shouldReceive( 'get' )->with( 'rent-calculator' )->andReturn( $module );

		$plugin = Mockery::mock( 'overload:Resa\Core\Plugin' );
		$plugin->shouldReceive( 'getInstance' )->andReturn( $plugin );
		$plugin->shouldReceive( 'getModuleRegistry' )->andReturn( $registry );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'slug' )->andReturn( 'rent-calculator' );

		$controller = new ModulesController();
		$response   = $controller->toggleModule( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$data = $response->get_data();
		$this->assertFalse( $data['active'] );
	}

	public function test_toggleModule_gibt_404_fuer_unbekanntes_modul(): void {
		$registry = Mockery::mock( ModuleRegistry::class );
		$registry->shouldReceive( 'get' )->with( 'unknown-module' )->andReturn( null );

		$plugin = Mockery::mock( 'overload:Resa\Core\Plugin' );
		$plugin->shouldReceive( 'getInstance' )->andReturn( $plugin );
		$plugin->shouldReceive( 'getModuleRegistry' )->andReturn( $registry );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'slug' )->andReturn( 'unknown-module' );

		$controller = new ModulesController();
		$response   = $controller->toggleModule( $request );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'resa_not_found', $response->get_error_code() );
	}

	public function test_toggleModule_gibt_fehler_bei_pro_modul_ohne_premium(): void {
		$module = $this->createMockModule( [ 'slug' => 'roi-calculator', 'active' => false, 'flag' => 'pro' ] );

		$registry = Mockery::mock( ModuleRegistry::class );
		$registry->shouldReceive( 'getAll' )->andReturn( [ $module ] );
		$registry->shouldReceive( 'get' )->with( 'roi-calculator' )->andReturn( $module );

		// Mock FeatureGate to deny activation.
		$featureGate = Mockery::mock( 'overload:Resa\Freemius\FeatureGate' );
		$featureGate->shouldReceive( 'canActivateModule' )->andReturn( false );

		$plugin = Mockery::mock( 'overload:Resa\Core\Plugin' );
		$plugin->shouldReceive( 'getInstance' )->andReturn( $plugin );
		$plugin->shouldReceive( 'getModuleRegistry' )->andReturn( $registry );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'slug' )->andReturn( 'roi-calculator' );

		$controller = new ModulesController();
		$response   = $controller->toggleModule( $request );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'resa_upgrade_required', $response->get_error_code() );
	}

	public function test_toggleModule_gibt_fehler_bei_modul_limit(): void {
		$module = $this->createMockModule( [ 'slug' => 'value-calculator', 'active' => false, 'flag' => 'free' ] );

		$registry = Mockery::mock( ModuleRegistry::class );
		$registry->shouldReceive( 'getAll' )->andReturn( [ $module ] );
		$registry->shouldReceive( 'get' )->with( 'value-calculator' )->andReturn( $module );

		// Mock FeatureGate to deny activation (limit reached).
		$featureGate = Mockery::mock( 'overload:Resa\Freemius\FeatureGate' );
		$featureGate->shouldReceive( 'canActivateModule' )->andReturn( false );

		$plugin = Mockery::mock( 'overload:Resa\Core\Plugin' );
		$plugin->shouldReceive( 'getInstance' )->andReturn( $plugin );
		$plugin->shouldReceive( 'getModuleRegistry' )->andReturn( $registry );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'slug' )->andReturn( 'value-calculator' );

		$controller = new ModulesController();
		$response   = $controller->toggleModule( $request );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'resa_module_limit_reached', $response->get_error_code() );
	}

	public function test_toggleModule_gibt_fehler_wenn_plugin_nicht_initialisiert(): void {
		$plugin = Mockery::mock( 'overload:Resa\Core\Plugin' );
		$plugin->shouldReceive( 'getInstance' )->andReturn( null );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'slug' )->andReturn( 'rent-calculator' );

		$controller = new ModulesController();
		$response   = $controller->toggleModule( $request );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'resa_plugin_not_initialized', $response->get_error_code() );
	}

	// -------------------------------------------------------------------------
	// Permission Tests
	// -------------------------------------------------------------------------

	public function test_adminAccess_prueft_capability(): void {
		Functions\when( 'current_user_can' )->justReturn( true );

		$controller = new ModulesController();
		$this->assertTrue( $controller->adminAccess() );
	}

	public function test_adminAccess_verweigert_zugriff_ohne_capability(): void {
		Functions\when( 'current_user_can' )->justReturn( false );

		$controller = new ModulesController();
		$this->assertFalse( $controller->adminAccess() );
	}
}
