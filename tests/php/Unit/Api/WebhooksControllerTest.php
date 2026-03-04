<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Api;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Api\WebhooksController;

class WebhooksControllerTest extends TestCase {

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

		$controller = new WebhooksController();
		$controller->registerRoutes();
	}

	public function test_registerRoutes_registriert_admin_webhooks_collection(): void {
		Functions\expect( 'register_rest_route' )
			->once()
			->with(
				'resa/v1',
				'/admin/webhooks',
				Mockery::on( function ( array $args ): bool {
					// Collection endpoint should have GET and POST.
					return count( $args ) === 2
						&& $args[0]['methods'] === 'GET'
						&& is_callable( $args[0]['permission_callback'] )
						&& $args[1]['methods'] === 'POST'
						&& is_callable( $args[1]['permission_callback'] );
				} )
			);

		// Allow other register_rest_route calls.
		Functions\expect( 'register_rest_route' )
			->twice()
			->with(
				'resa/v1',
				Mockery::on( fn( $route ) => $route !== '/admin/webhooks' ),
				Mockery::type( 'array' )
			);

		$controller = new WebhooksController();
		$controller->registerRoutes();
	}

	public function test_registerRoutes_registriert_admin_webhooks_single(): void {
		// Allow all register_rest_route calls, checking the single resource endpoint.
		$foundSingleRoute = false;

		Functions\expect( 'register_rest_route' )
			->times( 3 )
			->andReturnUsing( function ( $namespace, $route, $args ) use ( &$foundSingleRoute ) {
				if ( $route === '/admin/webhooks/(?P<id>\d+)' ) {
					$foundSingleRoute = true;
					// Should have PUT and DELETE.
					$this->assertCount( 2, $args );
					$this->assertEquals( 'PUT', $args[0]['methods'] );
					$this->assertEquals( 'DELETE', $args[1]['methods'] );
				}
			} );

		$controller = new WebhooksController();
		$controller->registerRoutes();

		$this->assertTrue( $foundSingleRoute, 'Single webhook resource route should be registered' );
	}

	public function test_registerRoutes_registriert_test_endpoint(): void {
		$foundTestRoute = false;

		Functions\expect( 'register_rest_route' )
			->times( 3 )
			->andReturnUsing( function ( $namespace, $route, $args ) use ( &$foundTestRoute ) {
				if ( $route === '/admin/webhooks/(?P<id>\d+)/test' ) {
					$foundTestRoute = true;
					$this->assertEquals( 'POST', $args['methods'] );
					$this->assertTrue( is_callable( $args['permission_callback'] ) );
				}
			} );

		$controller = new WebhooksController();
		$controller->registerRoutes();

		$this->assertTrue( $foundTestRoute, 'Test endpoint should be registered' );
	}

	public function test_adminAccess_checks_manage_options(): void {
		Functions\expect( 'current_user_can' )
			->once()
			->with( 'manage_options' )
			->andReturn( true );

		$controller = new WebhooksController();
		$this->assertTrue( $controller->adminAccess() );
	}

	public function test_adminAccess_denies_non_admin(): void {
		Functions\expect( 'current_user_can' )
			->once()
			->with( 'manage_options' )
			->andReturn( false );

		$controller = new WebhooksController();
		$this->assertFalse( $controller->adminAccess() );
	}
}
