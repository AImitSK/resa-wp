<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Api;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Api\RecaptchaSettingsController;

class RecaptchaSettingsControllerTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		Functions\when( '__' )->returnArg();
		Functions\when( 'esc_html__' )->returnArg();
		Functions\when( 'esc_html' )->returnArg();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_registerRoutes_registriert_recaptcha_settings_endpoint(): void {
		Functions\expect( 'register_rest_route' )
			->once()
			->with(
				'resa/v1',
				'/admin/recaptcha-settings',
				Mockery::on( function ( array $args ): bool {
					return count( $args ) === 2
						&& $args[0]['methods'] === 'GET'
						&& $args[1]['methods'] === 'PUT';
				} )
			);

		$controller = new RecaptchaSettingsController();
		$controller->registerRoutes();
	}

	public function test_show_gibt_defaults_zurueck_wenn_keine_option_gesetzt(): void {
		Functions\expect( 'get_option' )
			->once()
			->with( 'resa_recaptcha_settings', [] )
			->andReturn( [] );

		$controller = new RecaptchaSettingsController();
		$result     = $controller->show();

		$this->assertInstanceOf( \WP_REST_Response::class, $result );

		$data = $result->get_data();
		$this->assertFalse( $data['enabled'] );
		$this->assertSame( '', $data['site_key'] );
		$this->assertSame( '', $data['secret_key'] );
		$this->assertSame( 0.5, $data['threshold'] );
	}

	public function test_show_merged_gespeicherte_werte_mit_defaults(): void {
		Functions\expect( 'get_option' )
			->once()
			->with( 'resa_recaptcha_settings', [] )
			->andReturn( [
				'enabled'  => true,
				'site_key' => '6Lc_test_site_key',
			] );

		$controller = new RecaptchaSettingsController();
		$result     = $controller->show();
		$data       = $result->get_data();

		$this->assertTrue( $data['enabled'] );
		$this->assertSame( '6Lc_test_site_key', $data['site_key'] );
		// Defaults for unset values.
		$this->assertSame( '', $data['secret_key'] );
		$this->assertSame( 0.5, $data['threshold'] );
	}

	public function test_update_speichert_gueltige_daten(): void {
		Functions\expect( 'get_option' )->andReturn( [] );
		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'update_option' )->once();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'enabled'    => true,
			'site_key'   => '6Lc_site_key',
			'secret_key' => '6Lc_secret_key',
			'threshold'  => 0.7,
		] );

		$controller = new RecaptchaSettingsController();
		$result     = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $result );

		$data = $result->get_data();
		$this->assertTrue( $data['enabled'] );
		$this->assertSame( '6Lc_site_key', $data['site_key'] );
		$this->assertSame( '6Lc_secret_key', $data['secret_key'] );
		$this->assertSame( 0.7, $data['threshold'] );
	}

	public function test_update_deaktiviert_wenn_keys_fehlen(): void {
		Functions\expect( 'get_option' )->andReturn( [] );
		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'update_option' )->once();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'enabled'  => true,
			'site_key' => '6Lc_site_key',
			// secret_key missing → stays empty from defaults.
		] );

		$controller = new RecaptchaSettingsController();
		$result     = $controller->update( $request );
		$data       = $result->get_data();

		// enabled is forced to false because secret_key is empty.
		$this->assertFalse( $data['enabled'] );
	}

	public function test_update_clampt_threshold_auf_0_bis_1(): void {
		Functions\expect( 'get_option' )->andReturn( [] );
		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\expect( 'update_option' )->once();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'threshold' => 2.5,
		] );

		$controller = new RecaptchaSettingsController();
		$result     = $controller->update( $request );
		$data       = $result->get_data();

		$this->assertSame( 1.0, $data['threshold'] );
	}

	public function test_isEnabled_true_wenn_aktiv_und_keys_gesetzt(): void {
		Functions\expect( 'get_option' )
			->with( 'resa_recaptcha_settings', [] )
			->andReturn( [
				'enabled'    => true,
				'site_key'   => '6Lc_site',
				'secret_key' => '6Lc_secret',
			] );

		$this->assertTrue( RecaptchaSettingsController::isEnabled() );
	}

	public function test_isEnabled_false_wenn_deaktiviert(): void {
		Functions\expect( 'get_option' )
			->with( 'resa_recaptcha_settings', [] )
			->andReturn( [
				'enabled'    => false,
				'site_key'   => '6Lc_site',
				'secret_key' => '6Lc_secret',
			] );

		$this->assertFalse( RecaptchaSettingsController::isEnabled() );
	}

	public function test_isEnabled_false_wenn_site_key_fehlt(): void {
		Functions\expect( 'get_option' )
			->with( 'resa_recaptcha_settings', [] )
			->andReturn( [
				'enabled'    => true,
				'site_key'   => '',
				'secret_key' => '6Lc_secret',
			] );

		$this->assertFalse( RecaptchaSettingsController::isEnabled() );
	}
}
