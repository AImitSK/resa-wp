<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Api;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Api\TrackingSettingsController;

class TrackingSettingsControllerTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_registerRoutes_registriert_tracking_settings_endpoint(): void {
		Functions\expect( 'register_rest_route' )
			->once()
			->with(
				'resa/v1',
				'/admin/tracking-settings',
				Mockery::on( function ( array $args ): bool {
					return count( $args ) === 2
						&& $args[0]['methods'] === 'GET'
						&& $args[1]['methods'] === 'PUT';
				} )
			);

		$controller = new TrackingSettingsController();
		$controller->registerRoutes();
	}

	public function test_show_gibt_defaults_zurueck_wenn_keine_option_gesetzt(): void {
		Functions\expect( 'get_option' )
			->once()
			->with( 'resa_tracking_settings', [] )
			->andReturn( [] );

		$controller = new TrackingSettingsController();
		$result     = $controller->show();

		$this->assertInstanceOf( \WP_REST_Response::class, $result );

		$data = $result->get_data();
		$this->assertFalse( $data['datalayer_enabled'] );
		$this->assertTrue( $data['funnel_tracking_enabled'] );
		$this->assertTrue( $data['gclid_capture_enabled'] );
		$this->assertTrue( $data['utm_capture_enabled'] );
		$this->assertSame( 30, $data['partial_lead_ttl_days'] );
		$this->assertSame( '', $data['google_ads_fv_id'] );
	}

	public function test_show_merged_gespeicherte_werte_mit_defaults(): void {
		Functions\expect( 'get_option' )
			->once()
			->with( 'resa_tracking_settings', [] )
			->andReturn( [
				'datalayer_enabled'  => true,
				'google_ads_fv_id'   => 'AW-123456789',
				'google_ads_fv_label' => 'AbCdEf',
			] );

		$controller = new TrackingSettingsController();
		$result     = $controller->show();
		$data       = $result->get_data();

		$this->assertTrue( $data['datalayer_enabled'] );
		$this->assertSame( 'AW-123456789', $data['google_ads_fv_id'] );
		$this->assertSame( 'AbCdEf', $data['google_ads_fv_label'] );
		// Defaults for unset values.
		$this->assertTrue( $data['funnel_tracking_enabled'] );
		$this->assertSame( '', $data['google_ads_fs_id'] );
	}

	public function test_update_validiert_ungueltige_conversion_id(): void {
		Functions\expect( 'get_option' )->andReturn( [] );
		Functions\expect( '__' )->andReturnFirstArg();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'google_ads_fv_id' => 'INVALID',
		] );

		$controller = new TrackingSettingsController();
		$result     = $controller->update( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'resa_validation_error', $result->get_error_code() );
	}

	public function test_update_validiert_ttl_unter_minimum(): void {
		Functions\expect( 'get_option' )->andReturn( [] );
		Functions\expect( '__' )->andReturnFirstArg();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'partial_lead_ttl_days' => 3,
		] );

		$controller = new TrackingSettingsController();
		$result     = $controller->update( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
	}

	public function test_update_validiert_ttl_ueber_maximum(): void {
		Functions\expect( 'get_option' )->andReturn( [] );
		Functions\expect( '__' )->andReturnFirstArg();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'partial_lead_ttl_days' => 500,
		] );

		$controller = new TrackingSettingsController();
		$result     = $controller->update( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
	}

	public function test_update_speichert_gueltige_daten(): void {
		Functions\expect( 'get_option' )->andReturn( [] );
		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'update_option' )->once();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'datalayer_enabled'  => true,
			'google_ads_fv_id'   => 'AW-123456789',
			'google_ads_fv_label' => 'TestLabel',
			'partial_lead_ttl_days' => 14,
		] );

		$controller = new TrackingSettingsController();
		$result     = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $result );

		$data = $result->get_data();
		$this->assertTrue( $data['datalayer_enabled'] );
		$this->assertSame( 'AW-123456789', $data['google_ads_fv_id'] );
		$this->assertSame( 14, $data['partial_lead_ttl_days'] );
	}

	public function test_update_akzeptiert_leere_conversion_id(): void {
		Functions\expect( 'get_option' )->andReturn( [] );
		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'update_option' )->once();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'google_ads_fv_id' => '',
		] );

		$controller = new TrackingSettingsController();
		$result     = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $result );
	}

	public function test_get_statisch_gibt_merged_defaults_zurueck(): void {
		Functions\expect( 'get_option' )
			->once()
			->with( 'resa_tracking_settings', [] )
			->andReturn( [ 'datalayer_enabled' => true ] );

		$settings = TrackingSettingsController::get();

		$this->assertTrue( $settings['datalayer_enabled'] );
		$this->assertTrue( $settings['funnel_tracking_enabled'] );
		$this->assertSame( 30, $settings['partial_lead_ttl_days'] );
	}
}
