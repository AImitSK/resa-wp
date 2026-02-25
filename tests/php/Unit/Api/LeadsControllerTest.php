<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Api;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Api\LeadsController;

class LeadsControllerTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
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
				Mockery::anyOf( '/leads/partial', '/leads/complete' ),
				Mockery::on( function ( array $args ): bool {
					return $args['methods'] === 'POST'
						&& is_callable( $args['callback'] )
						&& is_callable( $args['permission_callback'] );
				} )
			);

		$controller = new LeadsController();
		$controller->registerRoutes();
	}

	public function test_createPartial_gibt_fehler_ohne_sessionId(): void {
		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\when( '__' )->returnArg();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )
			->with( 'sessionId' )
			->andReturn( '' );

		$controller = new LeadsController();
		$result     = $controller->createPartial( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'resa_validation_error', $result->get_error_code() );
	}

	public function test_completeLead_gibt_fehler_ohne_consent(): void {
		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';

		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( '__' )->andReturnFirstArg();
		Functions\expect( 'is_email' )->andReturn( true );

		$lead = (object) [ 'id' => 1, 'status' => 'partial' ];

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( $lead );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'sessionId' )->andReturn( 'abc-123' );
		$request->shouldReceive( 'get_param' )->with( 'firstName' )->andReturn( 'Max' );
		$request->shouldReceive( 'get_param' )->with( 'email' )->andReturn( 'max@test.de' );
		$request->shouldReceive( 'get_param' )->with( 'consent' )->andReturn( false );

		$controller = new LeadsController();
		$result     = $controller->completeLead( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'resa_validation_error', $result->get_error_code() );
	}

	public function test_completeLead_gibt_fehler_wenn_lead_nicht_gefunden(): void {
		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';

		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( '__' )->andReturnFirstArg();

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( null );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_param' )->with( 'sessionId' )->andReturn( 'nonexistent' );

		$controller = new LeadsController();
		$result     = $controller->completeLead( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'resa_not_found', $result->get_error_code() );
	}

	public function test_publicAccess_gibt_true_zurueck(): void {
		$controller = new LeadsController();
		$this->assertTrue( $controller->publicAccess() );
	}
}
