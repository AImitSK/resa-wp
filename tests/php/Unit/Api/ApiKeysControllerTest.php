<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Api;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Api\ApiKeysController;

class ApiKeysControllerTest extends TestCase {

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
			->times( 2 )
			->with(
				'resa/v1',
				Mockery::type( 'string' ),
				Mockery::type( 'array' )
			);

		$controller = new ApiKeysController();
		$controller->registerRoutes();
	}

	public function test_registerRoutes_registriert_collection_endpoint(): void {
		$foundCollectionRoute = false;

		Functions\expect( 'register_rest_route' )
			->times( 2 )
			->andReturnUsing( function ( $namespace, $route, $args ) use ( &$foundCollectionRoute ) {
				if ( $route === '/admin/api-keys' ) {
					$foundCollectionRoute = true;
					$this->assertCount( 2, $args );
					$this->assertEquals( 'GET', $args[0]['methods'] );
					$this->assertEquals( 'POST', $args[1]['methods'] );
				}
			} );

		$controller = new ApiKeysController();
		$controller->registerRoutes();

		$this->assertTrue( $foundCollectionRoute, 'Collection endpoint should be registered' );
	}

	public function test_registerRoutes_registriert_single_endpoint(): void {
		$foundSingleRoute = false;

		Functions\expect( 'register_rest_route' )
			->times( 2 )
			->andReturnUsing( function ( $namespace, $route, $args ) use ( &$foundSingleRoute ) {
				if ( $route === '/admin/api-keys/(?P<id>\d+)' ) {
					$foundSingleRoute = true;
					$this->assertCount( 2, $args );
					$this->assertEquals( 'PUT', $args[0]['methods'] );
					$this->assertEquals( 'DELETE', $args[1]['methods'] );
				}
			} );

		$controller = new ApiKeysController();
		$controller->registerRoutes();

		$this->assertTrue( $foundSingleRoute, 'Single API key resource route should be registered' );
	}

	public function test_adminAccess_checks_manage_options(): void {
		Functions\expect( 'current_user_can' )
			->once()
			->with( 'manage_options' )
			->andReturn( true );

		$controller = new ApiKeysController();
		$this->assertTrue( $controller->adminAccess() );
	}

	public function test_adminAccess_denies_non_admin(): void {
		Functions\expect( 'current_user_can' )
			->once()
			->with( 'manage_options' )
			->andReturn( false );

		$controller = new ApiKeysController();
		$this->assertFalse( $controller->adminAccess() );
	}
}
