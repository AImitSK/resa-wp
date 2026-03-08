<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Api;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Api\LocationsController;

/**
 * Unit tests for LocationsController.
 *
 * Tests the REST API endpoints for managing locations:
 * - GET /locations (public list)
 * - GET /locations/{id} (public single)
 * - GET /admin/locations (admin list)
 * - POST /admin/locations (create)
 * - PUT /admin/locations/{id} (update)
 * - DELETE /admin/locations/{id} (delete)
 */
class LocationsControllerTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		// Set up global $wpdb mock.
		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';

		// Common WordPress function mocks.
		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\when( 'sanitize_title' )->alias( fn( $s ) => strtolower( str_replace( ' ', '-', $s ) ) );
		Functions\when( '__' )->returnArg();
		Functions\when( 'current_user_can' )->justReturn( true );
		Functions\when( 'absint' )->alias( fn( $n ) => abs( (int) $n ) );
		Functions\when( 'wp_json_encode' )->alias( fn( $d ) => json_encode( $d ) );
		Functions\when( 'current_time' )->justReturn( '2024-01-01 12:00:00' );
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Create a mock location object.
	 */
	private function createMockLocation( array $data = [] ): object {
		$defaults = [
			'id'          => 1,
			'slug'        => 'muenchen',
			'name'        => 'München',
			'country'     => 'DE',
			'bundesland'  => 'Bayern',
			'region_type' => 'city',
			'currency'    => 'EUR',
			'latitude'    => 48.1351,
			'longitude'   => 11.5820,
			'zoom_level'  => 13,
			'data'        => '{}',
			'factors'     => null,
			'agent_id'    => null,
			'is_active'   => 1,
			'created_at'  => '2024-01-01 10:00:00',
			'updated_at'  => '2024-01-01 10:00:00',
		];

		return (object) array_merge( $defaults, $data );
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
					'/locations',
					'/locations/(?P<id>\d+)',
					'/admin/locations',
					'/admin/locations/(?P<id>\d+)'
				),
				Mockery::type( 'array' )
			);

		$controller = new LocationsController();
		$controller->registerRoutes();
	}

	// -------------------------------------------------------------------------
	// GET /locations (public index)
	// -------------------------------------------------------------------------

	public function test_index_gibt_aktive_locations_zurueck(): void {
		global $wpdb;

		$locations = [
			$this->createMockLocation( [ 'id' => 1, 'name' => 'München' ] ),
			$this->createMockLocation( [ 'id' => 2, 'name' => 'Berlin', 'slug' => 'berlin' ] ),
		];

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_results' )->andReturn( $locations );

		$controller = new LocationsController();
		$response   = $controller->index();

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertCount( 2, $data );
		$this->assertSame( 1, $data[0]['id'] );
		$this->assertSame( 'München', $data[0]['name'] );
	}

	public function test_index_enthält_koordinaten(): void {
		global $wpdb;

		$locations = [
			$this->createMockLocation( [
				'latitude'   => 48.1351,
				'longitude'  => 11.5820,
				'zoom_level' => 12,
			] ),
		];

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_results' )->andReturn( $locations );

		$controller = new LocationsController();
		$response   = $controller->index();
		$data       = $response->get_data();

		$this->assertSame( 48.1351, $data[0]['latitude'] );
		$this->assertSame( 11.5820, $data[0]['longitude'] );
		$this->assertSame( 12, $data[0]['zoomLevel'] );
	}

	// -------------------------------------------------------------------------
	// GET /locations/{id} (public show)
	// -------------------------------------------------------------------------

	public function test_show_gibt_einzelne_location_zurueck(): void {
		global $wpdb;

		$location = $this->createMockLocation();

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( $location );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'id' )->andReturn( 1 );

		$controller = new LocationsController();
		$response   = $controller->show( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertSame( 1, $data['id'] );
		$this->assertSame( 'muenchen', $data['slug'] );
		$this->assertSame( 'München', $data['name'] );
	}

	public function test_show_gibt_404_wenn_location_nicht_gefunden(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( null );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'id' )->andReturn( 999 );

		$controller = new LocationsController();
		$response   = $controller->show( $request );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'resa_not_found', $response->get_error_code() );
	}

	// -------------------------------------------------------------------------
	// GET /admin/locations (admin index)
	// -------------------------------------------------------------------------

	public function test_adminIndex_gibt_alle_locations_mit_vollstaendigen_daten(): void {
		global $wpdb;

		$locations = [
			$this->createMockLocation( [ 'id' => 1, 'is_active' => 1 ] ),
			$this->createMockLocation( [ 'id' => 2, 'is_active' => 0, 'name' => 'Inaktiv' ] ),
		];

		$wpdb->shouldReceive( 'get_results' )->andReturn( $locations );

		$controller = new LocationsController();
		$response   = $controller->adminIndex();

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$data = $response->get_data();

		$this->assertCount( 2, $data );
		$this->assertArrayHasKey( 'country', $data[0] );
		$this->assertArrayHasKey( 'bundesland', $data[0] );
		$this->assertArrayHasKey( 'data', $data[0] );
		$this->assertArrayHasKey( 'factors', $data[0] );
		$this->assertArrayHasKey( 'created_at', $data[0] );
	}

	// -------------------------------------------------------------------------
	// POST /admin/locations (create)
	// -------------------------------------------------------------------------

	public function test_create_erstellt_neue_location(): void {
		global $wpdb;

		// Mock Plugin::getInstance for feature gate check.
		$pluginMock = Mockery::mock( 'alias:Resa\Core\Plugin' );
		$pluginMock->shouldReceive( 'getInstance' )->andReturn( null );

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( null ); // No existing slug.
		$wpdb->shouldReceive( 'insert' )->andReturn( 1 );
		$wpdb->insert_id = 1;

		// After insert, findById returns the new location.
		$newLocation = $this->createMockLocation( [ 'id' => 1, 'name' => 'Hamburg' ] );
		$wpdb->shouldReceive( 'get_row' )->andReturn( $newLocation );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'name' )->andReturn( 'Hamburg' );
		$request->shouldReceive( 'get_param' )->with( 'slug' )->andReturn( '' );
		$request->shouldReceive( 'get_param' )->with( 'country' )->andReturn( 'DE' );
		$request->shouldReceive( 'get_param' )->with( 'bundesland' )->andReturn( 'Hamburg' );
		$request->shouldReceive( 'get_param' )->with( 'region_type' )->andReturn( 'city' );
		$request->shouldReceive( 'get_param' )->with( 'data' )->andReturn( [] );
		$request->shouldReceive( 'get_param' )->with( 'factors' )->andReturn( null );
		$request->shouldReceive( 'get_param' )->with( 'is_active' )->andReturn( true );
		$request->shouldReceive( 'get_param' )->with( 'latitude' )->andReturn( 53.5511 );
		$request->shouldReceive( 'get_param' )->with( 'longitude' )->andReturn( 9.9937 );
		$request->shouldReceive( 'get_param' )->with( 'zoom_level' )->andReturn( 12 );

		$controller = new LocationsController();
		$response   = $controller->create( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$this->assertSame( 201, $response->get_status() );
	}

	public function test_create_gibt_fehler_bei_doppeltem_slug(): void {
		global $wpdb;

		$pluginMock = Mockery::mock( 'alias:Resa\Core\Plugin' );
		$pluginMock->shouldReceive( 'getInstance' )->andReturn( null );

		$existingLocation = $this->createMockLocation( [ 'slug' => 'hamburg' ] );

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( $existingLocation );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'name' )->andReturn( 'Hamburg' );
		$request->shouldReceive( 'get_param' )->with( 'slug' )->andReturn( 'hamburg' );

		$controller = new LocationsController();
		$response   = $controller->create( $request );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'resa_validation_error', $response->get_error_code() );
	}

	public function test_create_gibt_fehler_ohne_name(): void {
		$pluginMock = Mockery::mock( 'alias:Resa\Core\Plugin' );
		$pluginMock->shouldReceive( 'getInstance' )->andReturn( null );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'name' )->andReturn( '' );

		$controller = new LocationsController();
		$response   = $controller->create( $request );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'resa_validation_error', $response->get_error_code() );
	}

	// -------------------------------------------------------------------------
	// PUT /admin/locations/{id} (update)
	// -------------------------------------------------------------------------

	public function test_update_aktualisiert_location(): void {
		global $wpdb;

		$location = $this->createMockLocation();

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( $location );
		$wpdb->shouldReceive( 'update' )->andReturn( 1 );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'id' )->andReturn( 1 );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'name'      => 'München Zentrum',
			'is_active' => true,
		] );

		$controller = new LocationsController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$this->assertSame( 200, $response->get_status() );
	}

	public function test_update_aktualisiert_koordinaten(): void {
		global $wpdb;

		$location = $this->createMockLocation();

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( $location );
		$wpdb->shouldReceive( 'update' )->andReturn( 1 );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'id' )->andReturn( 1 );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'latitude'   => 48.2000,
			'longitude'  => 11.6000,
			'zoom_level' => 14,
		] );

		$controller = new LocationsController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	public function test_update_gibt_404_wenn_location_nicht_gefunden(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( null );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'id' )->andReturn( 999 );

		$controller = new LocationsController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'resa_not_found', $response->get_error_code() );
	}

	// -------------------------------------------------------------------------
	// DELETE /admin/locations/{id} (destroy)
	// -------------------------------------------------------------------------

	public function test_destroy_loescht_location(): void {
		global $wpdb;

		$location = $this->createMockLocation();

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( $location );
		$wpdb->shouldReceive( 'delete' )->andReturn( 1 );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'id' )->andReturn( 1 );

		$controller = new LocationsController();
		$response   = $controller->destroy( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$data = $response->get_data();
		$this->assertTrue( $data['deleted'] );
	}

	public function test_destroy_gibt_404_wenn_location_nicht_gefunden(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( null );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'id' )->andReturn( 999 );

		$controller = new LocationsController();
		$response   = $controller->destroy( $request );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'resa_not_found', $response->get_error_code() );
	}

	public function test_destroy_gibt_fehler_bei_db_fehler(): void {
		global $wpdb;

		$location = $this->createMockLocation();

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( $location );
		$wpdb->shouldReceive( 'delete' )->andReturn( false );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'id' )->andReturn( 1 );

		$controller = new LocationsController();
		$response   = $controller->destroy( $request );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'resa_delete_failed', $response->get_error_code() );
	}

	// -------------------------------------------------------------------------
	// Permission Tests
	// -------------------------------------------------------------------------

	public function test_publicAccess_gibt_true_zurueck(): void {
		$controller = new LocationsController();
		$this->assertTrue( $controller->publicAccess() );
	}

	public function test_adminAccess_prueft_capability(): void {
		Functions\expect( 'current_user_can' )
			->once()
			->with( 'manage_options' )
			->andReturn( true );

		$controller = new LocationsController();
		$this->assertTrue( $controller->adminAccess() );
	}
}
