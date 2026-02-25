<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Api;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Api\HealthController;

class HealthControllerTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_registerRoutes_registriert_health_endpoint(): void {
		Functions\expect( 'register_rest_route' )
			->once()
			->with(
				'resa/v1',
				'/health',
				\Mockery::on( function ( array $args ): bool {
					return $args['methods'] === 'GET'
						&& is_callable( $args['callback'] )
						&& is_callable( $args['permission_callback'] );
				} )
			);

		$controller = new HealthController();
		$controller->registerRoutes();
	}

	public function test_getHealth_gibt_status_ok_zurueck(): void {
		$controller = new HealthController();
		$response   = $controller->getHealth();

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertSame( 'ok', $data['status'] );
		$this->assertSame( 'resa', $data['plugin'] );
		$this->assertSame( RESA_VERSION, $data['version'] );
	}
}
