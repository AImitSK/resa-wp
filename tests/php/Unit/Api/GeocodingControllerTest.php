<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Api;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Api\GeocodingController;
use Resa\Services\Geocoding\GeocoderInterface;
use Resa\Services\Geocoding\GeocodingResult;

class GeocodingControllerTest extends TestCase {

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

	public function test_registerRoutes_registriert_public_und_admin_endpoints(): void {
		Functions\when( '__' )->returnArg();

		Functions\expect( 'register_rest_route' )
			->once()
			->with(
				'resa/v1',
				'/geocoding/search',
				Mockery::on( function ( array $args ): bool {
					return $args['methods'] === 'GET'
						&& is_callable( $args['callback'] )
						&& is_callable( $args['permission_callback'] )
						&& isset( $args['args']['query'] )
						&& isset( $args['args']['viewbox'] )
						&& isset( $args['args']['bounded'] )
						&& isset( $args['args']['limit'] );
				} )
			);

		Functions\expect( 'register_rest_route' )
			->once()
			->with(
				'resa/v1',
				'/admin/geocoding/search',
				Mockery::on( function ( array $args ): bool {
					return $args['methods'] === 'GET'
						&& is_callable( $args['callback'] )
						&& is_callable( $args['permission_callback'] );
				} )
			);

		$controller = new GeocodingController();
		$controller->registerRoutes();
	}

	// ──────────────────────────────────────────────────────────────────────────
	// search (GET) — Success
	// ──────────────────────────────────────────────────────────────────────────

	public function test_search_gibt_ergebnisse_zurueck(): void {
		$results = [
			new GeocodingResult(
				latitude: 52.5200,
				longitude: 13.4050,
				displayName: 'Berlin, Deutschland',
				city: 'Berlin',
				state: 'Berlin',
				country: 'Deutschland',
				countryCode: 'de',
				postalCode: '10115'
			),
		];

		$geocoder = Mockery::mock( GeocoderInterface::class );
		$geocoder->shouldReceive( 'isAvailable' )->andReturn( true );
		$geocoder->shouldReceive( 'getName' )->andReturn( 'nominatim' );
		$geocoder->shouldReceive( 'search' )
			->with( 'Berlin', Mockery::type( 'array' ) )
			->andReturn( $results );

		$controller = $this->createControllerWithGeocoder( $geocoder );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'query' )->andReturn( 'Berlin' );
		$request->shouldReceive( 'get_param' )->with( 'viewbox' )->andReturn( null );
		$request->shouldReceive( 'get_param' )->with( 'bounded' )->andReturn( false );
		$request->shouldReceive( 'get_param' )->with( 'limit' )->andReturn( 5 );

		$response = $controller->search( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );

		$data = $response->get_data();
		$this->assertEquals( 'nominatim', $data['provider'] );
		$this->assertCount( 1, $data['results'] );
		$this->assertEquals( 52.5200, $data['results'][0]['lat'] );
		$this->assertEquals( 13.4050, $data['results'][0]['lng'] );
		$this->assertEquals( 'Berlin, Deutschland', $data['results'][0]['display_name'] );
	}

	public function test_search_mit_mehreren_ergebnissen(): void {
		$results = [
			new GeocodingResult( 52.5200, 13.4050, 'Berlin, Deutschland' ),
			new GeocodingResult( 52.3759, 9.7320, 'Berlin (Hannover), Deutschland' ),
		];

		$geocoder = Mockery::mock( GeocoderInterface::class );
		$geocoder->shouldReceive( 'isAvailable' )->andReturn( true );
		$geocoder->shouldReceive( 'getName' )->andReturn( 'nominatim' );
		$geocoder->shouldReceive( 'search' )->andReturn( $results );

		$controller = $this->createControllerWithGeocoder( $geocoder );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'query' )->andReturn( 'Berlin' );
		$request->shouldReceive( 'get_param' )->with( 'viewbox' )->andReturn( null );
		$request->shouldReceive( 'get_param' )->with( 'bounded' )->andReturn( false );
		$request->shouldReceive( 'get_param' )->with( 'limit' )->andReturn( 5 );

		$response = $controller->search( $request );

		$data = $response->get_data();
		$this->assertCount( 2, $data['results'] );
	}

	public function test_search_mit_viewbox_und_bounded(): void {
		$geocoder = Mockery::mock( GeocoderInterface::class );
		$geocoder->shouldReceive( 'isAvailable' )->andReturn( true );
		$geocoder->shouldReceive( 'getName' )->andReturn( 'nominatim' );
		$geocoder->shouldReceive( 'search' )
			->with(
				'Hamburg',
				Mockery::on( fn( $opts ) =>
					$opts['viewbox'] === '9.0,53.0,10.5,54.0'
					&& $opts['bounded'] === true
					&& $opts['limit'] === 3
				)
			)
			->andReturn( [] );

		$controller = $this->createControllerWithGeocoder( $geocoder );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'query' )->andReturn( 'Hamburg' );
		$request->shouldReceive( 'get_param' )->with( 'viewbox' )->andReturn( '9.0,53.0,10.5,54.0' );
		$request->shouldReceive( 'get_param' )->with( 'bounded' )->andReturn( true );
		$request->shouldReceive( 'get_param' )->with( 'limit' )->andReturn( 3 );

		$response = $controller->search( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	public function test_search_begrenzt_limit_auf_10(): void {
		$geocoder = Mockery::mock( GeocoderInterface::class );
		$geocoder->shouldReceive( 'isAvailable' )->andReturn( true );
		$geocoder->shouldReceive( 'getName' )->andReturn( 'nominatim' );
		$geocoder->shouldReceive( 'search' )
			->with(
				'München',
				Mockery::on( fn( $opts ) => $opts['limit'] === 10 ) // max 10
			)
			->andReturn( [] );

		$controller = $this->createControllerWithGeocoder( $geocoder );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'query' )->andReturn( 'München' );
		$request->shouldReceive( 'get_param' )->with( 'viewbox' )->andReturn( null );
		$request->shouldReceive( 'get_param' )->with( 'bounded' )->andReturn( false );
		$request->shouldReceive( 'get_param' )->with( 'limit' )->andReturn( 50 ); // zu hoch

		$response = $controller->search( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	// ──────────────────────────────────────────────────────────────────────────
	// search (GET) — Error cases
	// ──────────────────────────────────────────────────────────────────────────

	public function test_search_gibt_fehler_wenn_geocoder_nicht_verfuegbar(): void {
		Functions\when( '__' )->returnArg();

		$geocoder = Mockery::mock( GeocoderInterface::class );
		$geocoder->shouldReceive( 'isAvailable' )->andReturn( false );

		$controller = $this->createControllerWithGeocoder( $geocoder );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'query' )->andReturn( 'Berlin' );
		$request->shouldReceive( 'get_param' )->with( 'viewbox' )->andReturn( null );
		$request->shouldReceive( 'get_param' )->with( 'bounded' )->andReturn( false );
		$request->shouldReceive( 'get_param' )->with( 'limit' )->andReturn( 5 );

		$response = $controller->search( $request );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertEquals( 'resa_geocoder_unavailable', $response->get_error_code() );
	}

	public function test_search_gibt_fehler_bei_runtime_exception(): void {
		Functions\when( '__' )->returnArg();

		$geocoder = Mockery::mock( GeocoderInterface::class );
		$geocoder->shouldReceive( 'isAvailable' )->andReturn( true );
		$geocoder->shouldReceive( 'search' )
			->andThrow( new \RuntimeException( 'API nicht erreichbar' ) );

		$controller = $this->createControllerWithGeocoder( $geocoder );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'query' )->andReturn( 'Berlin' );
		$request->shouldReceive( 'get_param' )->with( 'viewbox' )->andReturn( null );
		$request->shouldReceive( 'get_param' )->with( 'bounded' )->andReturn( false );
		$request->shouldReceive( 'get_param' )->with( 'limit' )->andReturn( 5 );

		$response = $controller->search( $request );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertEquals( 'resa_geocoding_failed', $response->get_error_code() );
		$this->assertEquals( 'API nicht erreichbar', $response->get_error_message() );
	}

	// ──────────────────────────────────────────────────────────────────────────
	// validateViewbox
	// ──────────────────────────────────────────────────────────────────────────

	public function test_validateViewbox_akzeptiert_gueltige_viewbox(): void {
		$controller = new GeocodingController();

		$this->assertTrue( $controller->validateViewbox( '9.0,53.0,10.5,54.0' ) );
		$this->assertTrue( $controller->validateViewbox( '-180.0,-90.0,180.0,90.0' ) );
		$this->assertTrue( $controller->validateViewbox( '13.0886,52.3382,13.7611,52.6755' ) );
	}

	public function test_validateViewbox_akzeptiert_leere_werte(): void {
		$controller = new GeocodingController();

		$this->assertTrue( $controller->validateViewbox( null ) );
		$this->assertTrue( $controller->validateViewbox( '' ) );
	}

	public function test_validateViewbox_lehnt_ungueltige_formate_ab(): void {
		$controller = new GeocodingController();

		// Zu wenige Teile
		$this->assertFalse( $controller->validateViewbox( '9.0,53.0,10.5' ) );

		// Zu viele Teile
		$this->assertFalse( $controller->validateViewbox( '9.0,53.0,10.5,54.0,55.0' ) );

		// Nicht-numerische Werte
		$this->assertFalse( $controller->validateViewbox( 'abc,53.0,10.5,54.0' ) );
		$this->assertFalse( $controller->validateViewbox( '9.0,xyz,10.5,54.0' ) );

		// Kein String
		$this->assertFalse( $controller->validateViewbox( 123 ) );
		$this->assertFalse( $controller->validateViewbox( [ '9.0', '53.0', '10.5', '54.0' ] ) );
	}

	// ──────────────────────────────────────────────────────────────────────────
	// Permission Callbacks
	// ──────────────────────────────────────────────────────────────────────────

	public function test_publicAccess_gibt_true_zurueck(): void {
		$controller = new GeocodingController();
		$this->assertTrue( $controller->publicAccess() );
	}

	public function test_adminAccess_prueft_capability(): void {
		Functions\expect( 'current_user_can' )
			->once()
			->with( 'manage_options' )
			->andReturn( true );

		$controller = new GeocodingController();
		$this->assertTrue( $controller->adminAccess() );
	}

	public function test_adminAccess_verweigert_ohne_capability(): void {
		Functions\expect( 'current_user_can' )
			->once()
			->with( 'manage_options' )
			->andReturn( false );

		$controller = new GeocodingController();
		$this->assertFalse( $controller->adminAccess() );
	}

	// ──────────────────────────────────────────────────────────────────────────
	// Edge Cases
	// ──────────────────────────────────────────────────────────────────────────

	public function test_search_ohne_viewbox_setzt_keine_viewbox_option(): void {
		$geocoder = Mockery::mock( GeocoderInterface::class );
		$geocoder->shouldReceive( 'isAvailable' )->andReturn( true );
		$geocoder->shouldReceive( 'getName' )->andReturn( 'nominatim' );
		$geocoder->shouldReceive( 'search' )
			->with(
				'Köln',
				Mockery::on( fn( $opts ) =>
					! isset( $opts['viewbox'] )
					&& ! isset( $opts['bounded'] )
				)
			)
			->andReturn( [] );

		$controller = $this->createControllerWithGeocoder( $geocoder );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'query' )->andReturn( 'Köln' );
		$request->shouldReceive( 'get_param' )->with( 'viewbox' )->andReturn( null );
		$request->shouldReceive( 'get_param' )->with( 'bounded' )->andReturn( false );
		$request->shouldReceive( 'get_param' )->with( 'limit' )->andReturn( 5 );

		$response = $controller->search( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	public function test_search_mit_limit_null_setzt_keine_limit_option(): void {
		$geocoder = Mockery::mock( GeocoderInterface::class );
		$geocoder->shouldReceive( 'isAvailable' )->andReturn( true );
		$geocoder->shouldReceive( 'getName' )->andReturn( 'nominatim' );
		$geocoder->shouldReceive( 'search' )
			->with(
				'Wien',
				Mockery::on( fn( $opts ) => ! isset( $opts['limit'] ) )
			)
			->andReturn( [] );

		$controller = $this->createControllerWithGeocoder( $geocoder );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'query' )->andReturn( 'Wien' );
		$request->shouldReceive( 'get_param' )->with( 'viewbox' )->andReturn( null );
		$request->shouldReceive( 'get_param' )->with( 'bounded' )->andReturn( false );
		$request->shouldReceive( 'get_param' )->with( 'limit' )->andReturn( 0 );

		$response = $controller->search( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
	}

	// ──────────────────────────────────────────────────────────────────────────
	// Helper
	// ──────────────────────────────────────────────────────────────────────────

	/**
	 * Create controller with injected geocoder mock via Reflection.
	 */
	private function createControllerWithGeocoder( GeocoderInterface $geocoder ): GeocodingController {
		$controller = new GeocodingController();

		$reflection = new \ReflectionClass( $controller );
		$property   = $reflection->getProperty( 'geocoder' );
		$property->setAccessible( true );
		$property->setValue( $controller, $geocoder );

		return $controller;
	}
}
