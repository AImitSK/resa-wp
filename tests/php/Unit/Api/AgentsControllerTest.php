<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Api;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Api\AgentsController;

class AgentsControllerTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_registerRoutes_registriert_admin_agent_endpoint(): void {
		Functions\expect( 'register_rest_route' )
			->once()
			->with(
				'resa/v1',
				'/admin/agent',
				Mockery::on( function ( array $args ): bool {
					// Should have GET and PUT handlers
					return count( $args ) === 2
						&& $args[0]['methods'] === 'GET'
						&& $args[1]['methods'] === 'PUT'
						&& is_callable( $args[0]['permission_callback'] )
						&& is_callable( $args[1]['permission_callback'] );
				} )
			);

		$controller = new AgentsController();
		$controller->registerRoutes();
	}

	public function test_show_gibt_leere_struktur_ohne_agent(): void {
		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( null );

		$controller = new AgentsController();
		$response   = $controller->show();

		$this->assertInstanceOf( \WP_REST_Response::class, $response );

		$data = $response->get_data();
		$this->assertNull( $data['id'] );
		$this->assertEquals( '', $data['name'] );
		$this->assertEquals( '', $data['email'] );
	}

	public function test_show_gibt_agent_daten_zurueck(): void {
		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';

		$agent = (object) [
			'id'          => 1,
			'name'        => 'Max Mustermann',
			'email'       => 'max@mustermann.de',
			'phone'       => '+49 123 456789',
			'company'     => 'Mustermann Immobilien',
			'address'     => "Musterstr. 1\n12345 Berlin",
			'website'     => 'https://mustermann.de',
			'imprint_url' => 'https://mustermann.de/impressum',
			'photo_url'   => 'https://mustermann.de/foto.jpg',
		];

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_row' )->andReturn( $agent );

		$controller = new AgentsController();
		$response   = $controller->show();

		$data = $response->get_data();
		$this->assertEquals( 1, $data['id'] );
		$this->assertEquals( 'Max Mustermann', $data['name'] );
		$this->assertEquals( 'max@mustermann.de', $data['email'] );
		$this->assertEquals( 'Mustermann Immobilien', $data['company'] );
		$this->assertEquals( 'https://mustermann.de/impressum', $data['imprintUrl'] );
	}

	public function test_update_gibt_fehler_ohne_name(): void {
		Functions\when( '__' )->returnArg();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'name'  => '',
			'email' => 'test@test.de',
		] );

		$controller = new AgentsController();
		$result     = $controller->update( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'resa_validation_error', $result->get_error_code() );
	}

	public function test_update_gibt_fehler_ohne_email(): void {
		Functions\when( '__' )->returnArg();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'name'  => 'Test Name',
			'email' => '',
		] );

		$controller = new AgentsController();
		$result     = $controller->update( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'resa_validation_error', $result->get_error_code() );
	}

	public function test_update_gibt_fehler_bei_ungueltiger_email(): void {
		Functions\when( '__' )->returnArg();
		Functions\expect( 'is_email' )->once()->andReturn( false );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'name'  => 'Test Name',
			'email' => 'keine-gueltige-email',
		] );

		$controller = new AgentsController();
		$result     = $controller->update( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'resa_validation_error', $result->get_error_code() );
	}

	public function test_update_speichert_agent_erfolgreich(): void {
		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';

		Functions\when( '__' )->returnArg();
		Functions\expect( 'is_email' )->andReturn( true );
		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'sanitize_email' )->andReturnFirstArg();
		Functions\expect( 'sanitize_textarea_field' )->andReturnFirstArg();
		Functions\expect( 'esc_url_raw' )->andReturnFirstArg();
		Functions\expect( 'absint' )->andReturnUsing( 'intval' );
		Functions\expect( 'current_time' )->andReturn( '2026-01-15 10:00:00' );

		// saveDefault: getDefault returns null, so create is called
		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_row' )
			->twice()
			->andReturn(
				null, // First call in saveDefault -> getDefault
				(object) [ // Second call in findById
					'id'          => 1,
					'name'        => 'Neuer Makler',
					'email'       => 'neu@makler.de',
					'phone'       => '+49 123',
					'company'     => 'Test GmbH',
					'address'     => '',
					'website'     => '',
					'imprint_url' => '',
					'photo_url'   => null,
				]
			);

		$wpdb->shouldReceive( 'insert' )
			->once()
			->andReturnUsing( function () use ( $wpdb ) {
				$wpdb->insert_id = 1;
				return 1;
			} );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'name'    => 'Neuer Makler',
			'email'   => 'neu@makler.de',
			'phone'   => '+49 123',
			'company' => 'Test GmbH',
		] );

		$controller = new AgentsController();
		$response   = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $response );
		$data = $response->get_data();
		$this->assertEquals( 1, $data['id'] );
		$this->assertEquals( 'Neuer Makler', $data['name'] );
	}

	public function test_update_gibt_fehler_bei_speicherfehler(): void {
		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';

		Functions\when( '__' )->returnArg();
		Functions\expect( 'is_email' )->andReturn( true );
		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'sanitize_email' )->andReturnFirstArg();
		Functions\expect( 'sanitize_textarea_field' )->andReturnFirstArg();
		Functions\expect( 'esc_url_raw' )->andReturnFirstArg();
		Functions\expect( 'absint' )->andReturnUsing( 'intval' );
		Functions\expect( 'current_time' )->andReturn( '2026-01-15 10:00:00' );

		// saveDefault: getDefault returns null, create fails
		$wpdb->shouldReceive( 'prepare' )->andReturn( 'SQL' );
		$wpdb->shouldReceive( 'get_row' )->once()->andReturn( null );
		$wpdb->shouldReceive( 'insert' )->once()->andReturn( false );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'name'  => 'Test',
			'email' => 'test@test.de',
		] );

		$controller = new AgentsController();
		$result     = $controller->update( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'resa_save_failed', $result->get_error_code() );
	}

	public function test_adminAccess_prueft_capability(): void {
		Functions\expect( 'current_user_can' )
			->once()
			->with( 'manage_options' )
			->andReturn( true );

		$controller = new AgentsController();
		$this->assertTrue( $controller->adminAccess() );
	}

	public function test_adminAccess_verweigert_ohne_capability(): void {
		Functions\expect( 'current_user_can' )
			->once()
			->with( 'manage_options' )
			->andReturn( false );

		$controller = new AgentsController();
		$this->assertFalse( $controller->adminAccess() );
	}
}
