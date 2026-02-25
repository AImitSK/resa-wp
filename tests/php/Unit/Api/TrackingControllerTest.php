<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Api;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Api\TrackingController;

class TrackingControllerTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_registerRoutes_registriert_zwei_endpoints(): void {
		Functions\expect( 'register_rest_route' )
			->twice()
			->with(
				'resa/v1',
				Mockery::anyOf( '/tracking', '/analytics/funnel' ),
				Mockery::on( function ( array $args ): bool {
					return is_callable( $args['callback'] )
						&& is_callable( $args['permission_callback'] );
				} )
			);

		$controller = new TrackingController();
		$controller->registerRoutes();
	}

	public function test_recordEvent_gibt_fehler_ohne_event(): void {
		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\when( '__' )->returnArg();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )
			->with( 'event' )
			->andReturn( '' );

		$controller = new TrackingController();
		$result     = $controller->recordEvent( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'resa_validation_error', $result->get_error_code() );
	}

	public function test_recordEvent_gibt_fehler_fuer_ungueltig_event(): void {
		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\when( '__' )->returnArg();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )
			->with( 'event' )
			->andReturn( 'invalid_event' );
		$request->shouldReceive( 'get_param' )
			->with( 'assetType' )
			->andReturn( 'mietpreis' );

		$controller = new TrackingController();
		$result     = $controller->recordEvent( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
	}

	public function test_recordEvent_gibt_fehler_ohne_assetType(): void {
		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\when( '__' )->returnArg();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )
			->with( 'event' )
			->andReturn( 'asset_view' );
		$request->shouldReceive( 'get_param' )
			->with( 'assetType' )
			->andReturn( '' );

		$controller = new TrackingController();
		$result     = $controller->recordEvent( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
	}

	public function test_recordEvent_zeichnet_gueltiges_event_auf(): void {
		global $wpdb;

		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\when( '__' )->returnArg();
		Functions\when( 'current_time' )->justReturn( '2026-02-25' );
		Functions\when( 'absint' )->alias( 'intval' );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )
			->with( 'event' )
			->andReturn( 'asset_view' );
		$request->shouldReceive( 'get_param' )
			->with( 'assetType' )
			->andReturn( 'mietpreis' );
		$request->shouldReceive( 'get_param' )
			->with( 'locationId' )
			->andReturn( 0 );

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( null );
		$wpdb->shouldReceive( 'insert' )->once()->andReturn( 1 );

		$controller = new TrackingController();
		$result     = $controller->recordEvent( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $result );
		$this->assertSame( 201, $result->get_status() );
		$this->assertTrue( $result->get_data()['recorded'] );
	}

	public function test_publicAccess_gibt_true_zurueck(): void {
		$controller = new TrackingController();
		$this->assertTrue( $controller->publicAccess() );
	}
}
