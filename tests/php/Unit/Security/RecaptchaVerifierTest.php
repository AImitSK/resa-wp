<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Security;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Security\RecaptchaVerifier;

class RecaptchaVerifierTest extends TestCase {

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

	private function mockSettings( array $overrides = [] ): void {
		$defaults = [
			'enabled'    => true,
			'site_key'   => '6Lc_site',
			'secret_key' => '6Lc_secret',
			'threshold'  => 0.5,
		];

		Functions\expect( 'get_option' )
			->with( 'resa_recaptcha_settings', [] )
			->andReturn( array_merge( $defaults, $overrides ) );

		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\when( 'wp_unslash' )->returnArg();
	}

	public function test_verify_gibt_false_bei_leerem_token(): void {
		$this->assertFalse( RecaptchaVerifier::verify( '' ) );
	}

	public function test_verify_gibt_true_bei_gutem_score(): void {
		$this->mockSettings();

		Functions\expect( 'wp_remote_post' )->andReturn( [
			'body' => '{"success":true,"score":0.9}',
		] );
		Functions\expect( 'wp_remote_retrieve_body' )->andReturn( '{"success":true,"score":0.9}' );

		$this->assertTrue( RecaptchaVerifier::verify( 'valid-token' ) );
	}

	public function test_verify_gibt_false_bei_niedrigem_score(): void {
		$this->mockSettings();

		Functions\expect( 'wp_remote_post' )->andReturn( [
			'body' => '{"success":true,"score":0.1}',
		] );
		Functions\expect( 'wp_remote_retrieve_body' )->andReturn( '{"success":true,"score":0.1}' );

		$this->assertFalse( RecaptchaVerifier::verify( 'bot-token' ) );
	}

	public function test_verify_gibt_false_bei_success_false(): void {
		$this->mockSettings();

		Functions\expect( 'wp_remote_post' )->andReturn( [
			'body' => '{"success":false}',
		] );
		Functions\expect( 'wp_remote_retrieve_body' )->andReturn( '{"success":false}' );

		$this->assertFalse( RecaptchaVerifier::verify( 'invalid-token' ) );
	}

	public function test_verify_fail_open_bei_wp_error(): void {
		$this->mockSettings();

		$wpError = new \WP_Error( 'http_request_failed', 'Connection timeout' );
		Functions\expect( 'wp_remote_post' )->andReturn( $wpError );
		Functions\expect( 'is_wp_error' )->andReturn( true );

		$this->assertTrue( RecaptchaVerifier::verify( 'any-token' ) );
	}

	public function test_verify_fail_open_bei_ungueltigem_json(): void {
		$this->mockSettings();

		Functions\expect( 'wp_remote_post' )->andReturn( [
			'body' => 'not-json',
		] );
		Functions\expect( 'wp_remote_retrieve_body' )->andReturn( 'not-json' );

		// json_decode returns null → not an array → fail-open.
		$this->assertTrue( RecaptchaVerifier::verify( 'any-token' ) );
	}

	public function test_verify_gibt_true_wenn_secret_key_leer(): void {
		$this->mockSettings( [ 'secret_key' => '' ] );

		// Should not even call wp_remote_post.
		$this->assertTrue( RecaptchaVerifier::verify( 'any-token' ) );
	}

	public function test_verify_respektiert_custom_threshold(): void {
		$this->mockSettings( [ 'threshold' => 0.7 ] );

		Functions\expect( 'wp_remote_post' )->andReturn( [
			'body' => '{"success":true,"score":0.6}',
		] );
		Functions\expect( 'wp_remote_retrieve_body' )->andReturn( '{"success":true,"score":0.6}' );

		// Score 0.6 < threshold 0.7 → should fail.
		$this->assertFalse( RecaptchaVerifier::verify( 'token' ) );
	}
}
