<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Api;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Api\PrivacySettingsController;

class PrivacySettingsControllerTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_registerRoutes_registriert_privacy_settings_endpoint(): void {
		Functions\expect( 'register_rest_route' )
			->once()
			->with(
				'resa/v1',
				'/admin/privacy-settings',
				Mockery::on( function ( array $args ): bool {
					return count( $args ) === 2
						&& $args[0]['methods'] === 'GET'
						&& $args[1]['methods'] === 'PUT';
				} )
			);

		$controller = new PrivacySettingsController();
		$controller->registerRoutes();
	}

	public function test_show_gibt_defaults_zurueck_wenn_keine_option_gesetzt(): void {
		Functions\expect( 'get_option' )
			->once()
			->with( 'resa_privacy_settings', [] )
			->andReturn( [] );

		$controller = new PrivacySettingsController();
		$result     = $controller->show();

		$this->assertInstanceOf( \WP_REST_Response::class, $result );

		$data = $result->get_data();
		$this->assertSame( '', $data['privacy_url'] );
		$this->assertStringContainsString( '[Datenschutzerklärung]', $data['consent_text'] );
		$this->assertSame( 0, $data['lead_retention_days'] );
		$this->assertSame( 365, $data['email_log_retention_days'] );
		$this->assertFalse( $data['anonymize_instead_of_delete'] );
	}

	public function test_show_merged_gespeicherte_werte_mit_defaults(): void {
		Functions\expect( 'get_option' )
			->once()
			->with( 'resa_privacy_settings', [] )
			->andReturn( [
				'privacy_url'         => 'https://example.com/datenschutz',
				'lead_retention_days' => 365,
			] );

		$controller = new PrivacySettingsController();
		$result     = $controller->show();
		$data       = $result->get_data();

		$this->assertSame( 'https://example.com/datenschutz', $data['privacy_url'] );
		$this->assertSame( 365, $data['lead_retention_days'] );
		// Defaults for unset values.
		$this->assertSame( 365, $data['email_log_retention_days'] );
		$this->assertFalse( $data['anonymize_instead_of_delete'] );
	}

	public function test_update_validiert_consent_text_ohne_platzhalter(): void {
		Functions\expect( 'get_option' )->andReturn( [] );
		Functions\expect( '__' )->andReturnFirstArg();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'consent_text' => 'Ich stimme zu.',
		] );

		$controller = new PrivacySettingsController();
		$result     = $controller->update( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'resa_validation_error', $result->get_error_code() );
	}

	public function test_update_validiert_ungueltige_lead_retention_days(): void {
		Functions\expect( 'get_option' )->andReturn( [] );
		Functions\expect( '__' )->andReturnFirstArg();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'lead_retention_days' => 999,
		] );

		$controller = new PrivacySettingsController();
		$result     = $controller->update( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
	}

	public function test_update_validiert_ungueltige_email_log_retention_days(): void {
		Functions\expect( 'get_option' )->andReturn( [] );
		Functions\expect( '__' )->andReturnFirstArg();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'email_log_retention_days' => 500,
		] );

		$controller = new PrivacySettingsController();
		$result     = $controller->update( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
	}

	public function test_update_speichert_gueltige_daten(): void {
		Functions\expect( 'get_option' )->andReturn( [] );
		Functions\expect( 'esc_url_raw' )->andReturnFirstArg();
		Functions\expect( 'wp_kses' )->andReturnFirstArg();
		Functions\expect( 'update_option' )->once();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'privacy_url'                 => 'https://example.com/datenschutz',
			'consent_text'                => 'Ich stimme der [Datenschutzerklärung] zu.',
			'lead_retention_days'         => 365,
			'email_log_retention_days'    => 90,
			'anonymize_instead_of_delete' => true,
		] );

		$controller = new PrivacySettingsController();
		$result     = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $result );

		$data = $result->get_data();
		$this->assertSame( 'https://example.com/datenschutz', $data['privacy_url'] );
		$this->assertSame( 365, $data['lead_retention_days'] );
		$this->assertSame( 90, $data['email_log_retention_days'] );
		$this->assertTrue( $data['anonymize_instead_of_delete'] );
	}

	public function test_update_akzeptiert_consent_text_mit_platzhalter(): void {
		Functions\expect( 'get_option' )->andReturn( [] );
		Functions\when( 'esc_url_raw' )->returnArg();
		Functions\expect( 'wp_kses' )->andReturnFirstArg();
		Functions\expect( 'update_option' )->once();

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_json_params' )->andReturn( [
			'consent_text' => 'Bitte lesen Sie die [Datenschutzerklärung] und stimmen Sie zu.',
		] );

		$controller = new PrivacySettingsController();
		$result     = $controller->update( $request );

		$this->assertInstanceOf( \WP_REST_Response::class, $result );
	}

	public function test_get_statisch_gibt_merged_defaults_zurueck(): void {
		Functions\expect( 'get_option' )
			->once()
			->with( 'resa_privacy_settings', [] )
			->andReturn( [ 'lead_retention_days' => 180 ] );

		$settings = PrivacySettingsController::get();

		$this->assertSame( 180, $settings['lead_retention_days'] );
		$this->assertSame( '', $settings['privacy_url'] );
		$this->assertSame( 365, $settings['email_log_retention_days'] );
	}

	public function test_getPrivacyUrl_gibt_konfigurierte_url_zurueck(): void {
		Functions\expect( 'get_option' )
			->once()
			->with( 'resa_privacy_settings', [] )
			->andReturn( [ 'privacy_url' => 'https://example.com/privacy' ] );

		$url = PrivacySettingsController::getPrivacyUrl();

		$this->assertSame( 'https://example.com/privacy', $url );
	}

	public function test_getPrivacyUrl_faellt_auf_wordpress_zurueck(): void {
		Functions\expect( 'get_option' )
			->once()
			->with( 'resa_privacy_settings', [] )
			->andReturn( [] );

		Functions\expect( 'get_privacy_policy_url' )
			->once()
			->andReturn( 'https://example.com/wp-datenschutz' );

		$url = PrivacySettingsController::getPrivacyUrl();

		$this->assertSame( 'https://example.com/wp-datenschutz', $url );
	}

	public function test_getPrivacyUrl_gibt_leer_zurueck_wenn_nichts_konfiguriert(): void {
		Functions\expect( 'get_option' )
			->once()
			->with( 'resa_privacy_settings', [] )
			->andReturn( [] );

		Functions\expect( 'get_privacy_policy_url' )
			->once()
			->andReturn( '' );

		$url = PrivacySettingsController::getPrivacyUrl();

		$this->assertSame( '', $url );
	}
}
