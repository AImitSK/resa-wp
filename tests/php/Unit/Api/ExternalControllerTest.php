<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Api;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Api\ExternalController;

class ExternalControllerTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_registerRoutes_registriert_alle_endpoints(): void {
		Functions\expect( 'register_rest_route' )
			->times( 3 )
			->with(
				'resa/v1',
				Mockery::type( 'string' ),
				Mockery::type( 'array' )
			);

		$controller = new ExternalController();
		$controller->registerRoutes();
	}

	public function test_registerRoutes_registriert_leads_list(): void {
		$foundRoute = false;

		Functions\expect( 'register_rest_route' )
			->times( 3 )
			->andReturnUsing( function ( $namespace, $route, $args ) use ( &$foundRoute ) {
				if ( $route === '/external/leads' ) {
					$foundRoute = true;
					$this->assertEquals( 'GET', $args['methods'] );
					$this->assertTrue( is_callable( $args['permission_callback'] ) );
				}
			} );

		$controller = new ExternalController();
		$controller->registerRoutes();

		$this->assertTrue( $foundRoute, 'External leads list endpoint should be registered' );
	}

	public function test_registerRoutes_registriert_lead_detail(): void {
		$foundRoute = false;

		Functions\expect( 'register_rest_route' )
			->times( 3 )
			->andReturnUsing( function ( $namespace, $route, $args ) use ( &$foundRoute ) {
				if ( $route === '/external/leads/(?P<id>\d+)' ) {
					$foundRoute = true;
					$this->assertEquals( 'GET', $args['methods'] );
				}
			} );

		$controller = new ExternalController();
		$controller->registerRoutes();

		$this->assertTrue( $foundRoute, 'External lead detail endpoint should be registered' );
	}

	public function test_registerRoutes_registriert_locations(): void {
		$foundRoute = false;

		Functions\expect( 'register_rest_route' )
			->times( 3 )
			->andReturnUsing( function ( $namespace, $route, $args ) use ( &$foundRoute ) {
				if ( $route === '/external/locations' ) {
					$foundRoute = true;
					$this->assertEquals( 'GET', $args['methods'] );
				}
			} );

		$controller = new ExternalController();
		$controller->registerRoutes();

		$this->assertTrue( $foundRoute, 'External locations endpoint should be registered' );
	}

	public function test_apiKeyAccess_grants_admin(): void {
		Functions\expect( 'current_user_can' )
			->once()
			->with( 'manage_options' )
			->andReturn( true );

		$controller = new ExternalController();
		$this->assertTrue( $controller->apiKeyAccess() );
	}

	public function test_apiKeyAccess_denies_unauthenticated(): void {
		Functions\expect( 'current_user_can' )
			->once()
			->with( 'manage_options' )
			->andReturn( false );

		// Reset ApiKeyAuth static state.
		$ref = new \ReflectionClass( \Resa\Services\Auth\ApiKeyAuth::class );
		$authenticated = $ref->getProperty( 'authenticated' );
		$authenticated->setAccessible( true );
		$authenticated->setValue( null, false );

		$controller = new ExternalController();
		$this->assertFalse( $controller->apiKeyAccess() );
	}
}
