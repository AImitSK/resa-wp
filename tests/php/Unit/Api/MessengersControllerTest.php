<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Api;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Api\MessengersController;

class MessengersControllerTest extends TestCase {

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

		$controller = new MessengersController();
		$controller->registerRoutes();
	}

	public function test_registerRoutes_registriert_list_und_create(): void {
		$foundListCreate = false;

		Functions\expect( 'register_rest_route' )
			->times( 3 )
			->andReturnUsing( function ( $namespace, $route, $args ) use ( &$foundListCreate ) {
				if ( $route === '/admin/messengers' ) {
					$foundListCreate = true;
					// Should have GET and POST.
					$this->assertCount( 2, $args );
					$this->assertEquals( 'GET', $args[0]['methods'] );
					$this->assertEquals( 'POST', $args[1]['methods'] );
				}
			} );

		$controller = new MessengersController();
		$controller->registerRoutes();

		$this->assertTrue( $foundListCreate, 'List + create endpoint should be registered' );
	}

	public function test_registerRoutes_registriert_update_und_delete(): void {
		$foundUpdateDelete = false;

		Functions\expect( 'register_rest_route' )
			->times( 3 )
			->andReturnUsing( function ( $namespace, $route, $args ) use ( &$foundUpdateDelete ) {
				if ( $route === '/admin/messengers/(?P<id>\d+)' ) {
					$foundUpdateDelete = true;
					// Should have PUT and DELETE.
					$this->assertCount( 2, $args );
					$this->assertEquals( 'PUT', $args[0]['methods'] );
					$this->assertEquals( 'DELETE', $args[1]['methods'] );
				}
			} );

		$controller = new MessengersController();
		$controller->registerRoutes();

		$this->assertTrue( $foundUpdateDelete, 'Update + delete endpoint should be registered' );
	}

	public function test_registerRoutes_registriert_test_endpoint(): void {
		$foundTest = false;

		Functions\expect( 'register_rest_route' )
			->times( 3 )
			->andReturnUsing( function ( $namespace, $route, $args ) use ( &$foundTest ) {
				if ( $route === '/admin/messengers/(?P<id>\d+)/test' ) {
					$foundTest = true;
					$this->assertEquals( 'POST', $args['methods'] );
				}
			} );

		$controller = new MessengersController();
		$controller->registerRoutes();

		$this->assertTrue( $foundTest, 'Test endpoint should be registered' );
	}

	public function test_adminAccess_grants_admin(): void {
		Functions\expect( 'current_user_can' )
			->once()
			->with( 'manage_options' )
			->andReturn( true );

		$controller = new MessengersController();
		$this->assertTrue( $controller->adminAccess() );
	}

	public function test_adminAccess_denies_non_admin(): void {
		Functions\expect( 'current_user_can' )
			->once()
			->with( 'manage_options' )
			->andReturn( false );

		$controller = new MessengersController();
		$this->assertFalse( $controller->adminAccess() );
	}
}
