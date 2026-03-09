<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Security;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Security\SpamGuard;

class SpamGuardTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
		$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		unset( $_SERVER['REMOTE_ADDR'] );
		parent::tearDown();
	}

	private function makeRequest( array $overrides = [] ): \WP_REST_Request {
		$defaults = [
			'nonce'      => 'valid_nonce',
			'_hp'        => '',
			'_ts'        => time() - 10,
			'_recaptcha' => null,
		];

		$params = array_merge( $defaults, $overrides );

		$request = Mockery::mock( 'WP_REST_Request' );
		$request->shouldReceive( 'get_header' )
			->with( 'X-Resa-Nonce' )
			->andReturn( $params['nonce'] );
		$request->shouldReceive( 'get_param' )
			->with( '_hp' )
			->andReturn( $params['_hp'] );
		$request->shouldReceive( 'get_param' )
			->with( '_ts' )
			->andReturn( $params['_ts'] );
		$request->shouldReceive( 'get_param' )
			->with( '_recaptcha' )
			->andReturn( $params['_recaptcha'] );

		return $request;
	}

	private function mockPassingChecks(): void {
		Functions\expect( 'wp_verify_nonce' )->andReturn( 1 );
		Functions\when( '__' )->returnArg();
		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\when( 'wp_unslash' )->returnArg();
		Functions\when( 'get_transient' )->justReturn( false );
		Functions\when( 'set_transient' )->justReturn( true );
		// reCAPTCHA check (#5) calls RecaptchaSettingsController::isEnabled() -> get_option.
		Functions\when( 'get_option' )->justReturn( [] );
	}

	public function test_check_akzeptiert_gueltigen_request(): void {
		$this->mockPassingChecks();

		$request = $this->makeRequest();
		$result  = SpamGuard::check( $request );

		$this->assertTrue( $result );
	}

	public function test_check_lehnt_ungueltige_nonce_ab(): void {
		Functions\expect( 'wp_verify_nonce' )->andReturn( false );
		Functions\when( '__' )->returnArg();

		$request = $this->makeRequest( [ 'nonce' => 'bad_nonce' ] );
		$result  = SpamGuard::check( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'resa_spam_detected', $result->get_error_code() );
	}

	public function test_check_lehnt_fehlende_nonce_ab(): void {
		Functions\when( '__' )->returnArg();

		$request = $this->makeRequest( [ 'nonce' => null ] );
		$result  = SpamGuard::check( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
	}

	public function test_check_lehnt_befuelltes_honeypot_ab(): void {
		Functions\expect( 'wp_verify_nonce' )->andReturn( 1 );
		Functions\when( '__' )->returnArg();

		$request = $this->makeRequest( [ '_hp' => 'http://spam.com' ] );
		$result  = SpamGuard::check( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'resa_spam_detected', $result->get_error_code() );
	}

	public function test_check_lehnt_zu_schnellen_request_ab(): void {
		Functions\expect( 'wp_verify_nonce' )->andReturn( 1 );
		Functions\when( '__' )->returnArg();

		// Timestamp = now (0 seconds ago).
		$request = $this->makeRequest( [ '_ts' => time() ] );
		$result  = SpamGuard::check( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'resa_spam_detected', $result->get_error_code() );
	}

	public function test_check_akzeptiert_request_nach_3_sekunden(): void {
		$this->mockPassingChecks();

		$request = $this->makeRequest( [ '_ts' => time() - 4 ] );
		$result  = SpamGuard::check( $request );

		$this->assertTrue( $result );
	}

	public function test_check_lehnt_ab_wenn_rate_limit_erreicht(): void {
		Functions\expect( 'wp_verify_nonce' )->andReturn( 1 );
		Functions\when( '__' )->returnArg();
		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\when( 'wp_unslash' )->returnArg();

		// Rate limiter: minute counter at limit.
		Functions\expect( 'get_transient' )->andReturn( 5 );

		$request = $this->makeRequest();
		$result  = SpamGuard::check( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'resa_spam_detected', $result->get_error_code() );
	}

	public function test_error_verraet_keinen_check_namen(): void {
		Functions\expect( 'wp_verify_nonce' )->andReturn( false );
		Functions\when( '__' )->returnArg();

		$request = $this->makeRequest( [ 'nonce' => 'bad' ] );
		$result  = SpamGuard::check( $request );

		// Error code is always generic.
		$this->assertSame( 'resa_spam_detected', $result->get_error_code() );
		// Error data has 403 status.
		$data = $result->get_error_data();
		$this->assertSame( 403, $data['status'] );
	}

	public function test_createNonce_gibt_string_zurueck(): void {
		Functions\expect( 'wp_create_nonce' )
			->once()
			->with( 'resa_lead_submit' )
			->andReturn( 'abc123' );

		$this->assertSame( 'abc123', SpamGuard::createNonce() );
	}

	public function test_timestamp_gibt_aktuelle_zeit_zurueck(): void {
		$ts = SpamGuard::timestamp();
		$this->assertEqualsWithDelta( time(), $ts, 1 );
	}

	public function test_check_lehnt_ab_wenn_recaptcha_aktiv_und_token_fehlt(): void {
		Functions\expect( 'wp_verify_nonce' )->andReturn( 1 );
		Functions\when( '__' )->returnArg();
		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\when( 'wp_unslash' )->returnArg();
		Functions\when( 'get_transient' )->justReturn( false );
		Functions\when( 'set_transient' )->justReturn( true );
		// reCAPTCHA is enabled.
		Functions\expect( 'get_option' )
			->with( 'resa_recaptcha_settings', [] )
			->andReturn( [
				'enabled'    => true,
				'site_key'   => '6Lc_site',
				'secret_key' => '6Lc_secret',
				'threshold'  => 0.5,
			] );

		$request = $this->makeRequest( [ '_recaptcha' => null ] );
		$result  = SpamGuard::check( $request );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'resa_spam_detected', $result->get_error_code() );
	}

	public function test_check_akzeptiert_request_wenn_recaptcha_deaktiviert(): void {
		$this->mockPassingChecks();
		// reCAPTCHA is disabled.
		Functions\expect( 'get_option' )
			->with( 'resa_recaptcha_settings', [] )
			->andReturn( [ 'enabled' => false ] );

		$request = $this->makeRequest();
		$result  = SpamGuard::check( $request );

		$this->assertTrue( $result );
	}
}
