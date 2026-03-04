<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Privacy;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Privacy\PersonalDataEraser;

class PersonalDataEraserTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_register_fuegt_eraser_filter_hinzu(): void {
		Functions\expect( 'add_filter' )
			->once()
			->with( 'wp_privacy_personal_data_erasers', Mockery::type( 'array' ) );

		PersonalDataEraser::register();
	}

	public function test_addEraser_registriert_resa_eraser(): void {
		Functions\expect( '__' )->andReturnFirstArg();

		$erasers = PersonalDataEraser::addEraser( [] );

		$this->assertArrayHasKey( 'resa-leads', $erasers );
		$this->assertSame( 'RESA Lead-Daten', $erasers['resa-leads']['eraser_friendly_name'] );
	}

	public function test_erase_gibt_leeres_ergebnis_fuer_ungueltige_email(): void {
		Functions\expect( 'sanitize_email' )->andReturn( '' );
		Functions\expect( 'is_email' )->andReturn( false );

		$result = PersonalDataEraser::erase( 'invalid' );

		$this->assertSame( 0, $result['items_removed'] );
		$this->assertSame( 0, $result['items_retained'] );
		$this->assertTrue( $result['done'] );
	}

	public function test_erase_loescht_leads_wenn_anonymize_aus(): void {
		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';

		Functions\expect( 'sanitize_email' )->andReturnFirstArg();
		Functions\expect( 'is_email' )->andReturn( true );
		Functions\when( '__' )->returnArg();

		// PrivacySettingsController::get() → anonymize off.
		Functions\expect( 'get_option' )
			->with( 'resa_privacy_settings', [] )
			->andReturn( [ 'anonymize_instead_of_delete' => false ] );

		$lead = (object) [ 'id' => 42, 'email' => 'test@example.com' ];

		// Lead::findByEmail() call.
		$wpdb->shouldReceive( 'prepare' )->andReturn( 'PREPARED_SQL' );
		$wpdb->shouldReceive( 'get_results' )->andReturn( [ $lead ] );

		// EmailLogger::deleteByLead() call (cascade).
		$wpdb->shouldReceive( 'delete' )
			->with( 'wp_resa_email_log', [ 'lead_id' => 42 ], [ '%d' ] )
			->andReturn( 2 );

		// Lead::delete() call.
		$wpdb->shouldReceive( 'delete' )
			->with( 'wp_resa_leads', [ 'id' => 42 ], [ '%d' ] )
			->andReturn( 1 );

		$result = PersonalDataEraser::erase( 'test@example.com' );

		$this->assertSame( 1, $result['items_removed'] );
		$this->assertSame( 0, $result['items_retained'] );
		$this->assertTrue( $result['done'] );
	}

	public function test_erase_anonymisiert_leads_wenn_anonymize_an(): void {
		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';

		Functions\expect( 'sanitize_email' )->andReturnFirstArg();
		Functions\expect( 'is_email' )->andReturn( true );
		Functions\when( '__' )->returnArg();

		// PrivacySettingsController::get() → anonymize on.
		Functions\expect( 'get_option' )
			->with( 'resa_privacy_settings', [] )
			->andReturn( [ 'anonymize_instead_of_delete' => true ] );

		Functions\expect( 'current_time' )->andReturn( '2026-03-04 12:00:00' );

		$lead = (object) [ 'id' => 42, 'email' => 'test@example.com' ];

		// Lead::findByEmail() call.
		$wpdb->shouldReceive( 'prepare' )->andReturn( 'PREPARED_SQL' );
		$wpdb->shouldReceive( 'get_results' )->andReturn( [ $lead ] );

		// EmailLogger::deleteByLead() call (from anonymize).
		$wpdb->shouldReceive( 'delete' )
			->with( 'wp_resa_email_log', [ 'lead_id' => 42 ], [ '%d' ] )
			->andReturn( 0 );

		// Lead::anonymize() call.
		$wpdb->shouldReceive( 'update' )
			->once()
			->andReturn( 1 );

		$result = PersonalDataEraser::erase( 'test@example.com' );

		$this->assertSame( 0, $result['items_removed'] );
		$this->assertSame( 1, $result['items_retained'] );
		$this->assertNotEmpty( $result['messages'] );
		$this->assertTrue( $result['done'] );
	}
}
