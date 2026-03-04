<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Privacy;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Privacy\PersonalDataExporter;

class PersonalDataExporterTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_register_fuegt_exporter_filter_hinzu(): void {
		Functions\expect( 'add_filter' )
			->once()
			->with( 'wp_privacy_personal_data_exporters', Mockery::type( 'array' ) );

		PersonalDataExporter::register();
	}

	public function test_addExporter_registriert_resa_exporter(): void {
		Functions\expect( '__' )->andReturnFirstArg();

		$exporters = PersonalDataExporter::addExporter( [] );

		$this->assertArrayHasKey( 'resa-leads', $exporters );
		$this->assertSame( 'RESA Lead-Daten', $exporters['resa-leads']['exporter_friendly_name'] );
	}

	public function test_export_gibt_leeres_ergebnis_fuer_ungueltige_email(): void {
		Functions\expect( 'sanitize_email' )->andReturn( '' );
		Functions\expect( 'is_email' )->andReturn( false );

		$result = PersonalDataExporter::export( 'invalid' );

		$this->assertEmpty( $result['data'] );
		$this->assertTrue( $result['done'] );
	}

	public function test_export_gibt_leeres_ergebnis_wenn_keine_leads(): void {
		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';

		Functions\expect( 'sanitize_email' )->andReturnFirstArg();
		Functions\expect( 'is_email' )->andReturn( true );
		Functions\when( '__' )->returnArg();

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'PREPARED_SQL' );
		$wpdb->shouldReceive( 'get_results' )->andReturn( [] );

		$result = PersonalDataExporter::export( 'test@example.com' );

		$this->assertEmpty( $result['data'] );
		$this->assertTrue( $result['done'] );
	}

	public function test_export_exportiert_lead_daten(): void {
		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';

		Functions\expect( 'sanitize_email' )->andReturnFirstArg();
		Functions\expect( 'is_email' )->andReturn( true );
		Functions\expect( '__' )->andReturnFirstArg();
		Functions\expect( 'wp_json_encode' )->andReturn( '{}' );

		$lead = (object) [
			'id'            => 1,
			'first_name'    => 'Max',
			'last_name'     => 'Mustermann',
			'email'         => 'test@example.com',
			'phone'         => '+49123456',
			'company'       => 'Test GmbH',
			'salutation'    => 'Herr',
			'message'       => 'Test',
			'asset_type'    => 'rent-calculator',
			'status'        => 'new',
			'consent_given' => 1,
			'consent_text'  => 'Ich stimme zu.',
			'consent_date'  => '2026-01-01 12:00:00',
			'inputs'        => '{"rooms":3}',
			'result'        => '{"price":1200}',
			'created_at'    => '2026-01-01 12:00:00',
		];

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'PREPARED_SQL' );
		$wpdb->shouldReceive( 'get_results' )
			->once()
			->andReturn( [ $lead ] );

		// Email log lookup.
		$wpdb->shouldReceive( 'get_results' )
			->andReturn( [] );

		$result = PersonalDataExporter::export( 'test@example.com' );

		$this->assertCount( 1, $result['data'] );
		$this->assertSame( 'resa-leads', $result['data'][0]['group_id'] );
		$this->assertSame( 'resa-lead-1', $result['data'][0]['item_id'] );
		$this->assertTrue( $result['done'] );
	}
}
