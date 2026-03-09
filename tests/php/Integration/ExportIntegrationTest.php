<?php

declare( strict_types=1 );

namespace Resa\Tests\Integration;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Privacy\PersonalDataExporter;
use Resa\Privacy\PersonalDataEraser;

/**
 * Integration test: GDPR export and erasure of personal lead data.
 */
class ExportIntegrationTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';

		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\when( 'sanitize_email' )->returnArg();
		Functions\when( 'absint' )->alias( fn( $v ) => abs( (int) $v ) );
		Functions\when( 'wp_json_encode' )->alias( fn( $v, ...$opts ) => json_encode( $v, ...$opts ) );
		Functions\when( 'current_time' )->justReturn( '2025-06-01 12:00:00' );
		Functions\when( '__' )->returnArg();
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	// ── Exporter Registration ────────────────────────────────

	public function test_addExporter_registriert_resa_exporter(): void {
		$exporters = PersonalDataExporter::addExporter( [] );

		$this->assertArrayHasKey( 'resa-leads', $exporters );
		$this->assertSame( 'RESA Lead-Daten', $exporters['resa-leads']['exporter_friendly_name'] );
	}

	// ── Export ────────────────────────────────────────────────

	public function test_export_gibt_lead_daten_zurueck(): void {
		global $wpdb;

		Functions\when( 'is_email' )->justReturn( true );

		$lead = (object) [
			'id'            => 42,
			'first_name'    => 'Max',
			'last_name'     => 'Mustermann',
			'email'         => 'max@example.com',
			'phone'         => '+49 170 1234567',
			'company'       => 'Test GmbH',
			'salutation'    => 'Herr',
			'message'       => 'Bitte kontaktieren Sie mich.',
			'asset_type'    => 'rent-calculator',
			'status'        => 'new',
			'consent_given' => 1,
			'consent_text'  => 'Ich stimme zu.',
			'consent_date'  => '2025-06-01 12:00:00',
			'inputs'        => '{"rooms":3}',
			'result'        => '{"rent":14.5}',
			'created_at'    => '2025-06-01 12:00:00',
		];

		// Lead::findByEmail.
		$wpdb->shouldReceive( 'prepare' )->andReturn( 'sql' );
		$wpdb->shouldReceive( 'get_results' )->once()->andReturn( [ $lead ] );

		// EmailLogger::findByLead.
		$wpdb->shouldReceive( 'get_results' )->once()->andReturn( [
			(object) [ 'sent_at' => '2025-06-01 13:00:00', 'subject' => 'Ihre Analyse', 'status' => 'sent' ],
		] );

		$result = PersonalDataExporter::export( 'max@example.com' );

		$this->assertTrue( $result['done'] );
		$this->assertCount( 1, $result['data'] );

		$item = $result['data'][0];
		$this->assertSame( 'resa-leads', $item['group_id'] );
		$this->assertSame( 'resa-lead-42', $item['item_id'] );

		// Verify data fields are exported.
		$fieldNames = array_column( $item['data'], 'name' );
		$this->assertContains( 'Vorname', $fieldNames );
		$this->assertContains( 'Nachname', $fieldNames );
		$this->assertContains( 'E-Mail', $fieldNames );
		$this->assertContains( 'Telefon', $fieldNames );
		$this->assertContains( 'Einwilligung erteilt', $fieldNames );
		$this->assertContains( 'E-Mail-Protokoll', $fieldNames );
	}

	public function test_export_ungueltige_email_gibt_leer_zurueck(): void {
		Functions\when( 'is_email' )->justReturn( false );

		$result = PersonalDataExporter::export( 'invalid' );

		$this->assertTrue( $result['done'] );
		$this->assertSame( [], $result['data'] );
	}

	public function test_export_keine_leads_gibt_leer_zurueck(): void {
		global $wpdb;

		Functions\when( 'is_email' )->justReturn( true );

		$wpdb->shouldReceive( 'prepare' )->andReturn( 'sql' );
		$wpdb->shouldReceive( 'get_results' )->once()->andReturn( [] );

		$result = PersonalDataExporter::export( 'nobody@example.com' );

		$this->assertTrue( $result['done'] );
		$this->assertSame( [], $result['data'] );
	}

	// ── Eraser Registration ──────────────────────────────────

	public function test_addEraser_registriert_resa_eraser(): void {
		$erasers = PersonalDataEraser::addEraser( [] );

		$this->assertArrayHasKey( 'resa-leads', $erasers );
		$this->assertSame( 'RESA Lead-Daten', $erasers['resa-leads']['eraser_friendly_name'] );
	}

	// ── Erase with Delete ────────────────────────────────────

	public function test_erase_loescht_leads_wenn_einstellung_delete(): void {
		global $wpdb;

		Functions\when( 'is_email' )->justReturn( true );
		Functions\when( 'get_option' )->alias( function ( $key, $default = '' ) {
			if ( $key === 'resa_privacy_settings' ) {
				return [
					'anonymize_instead_of_delete' => false,
					'retention_days'              => 365,
				];
			}
			return $default;
		} );

		$lead = (object) [ 'id' => 42, 'email' => 'max@example.com' ];

		// Lead::findByEmail.
		$wpdb->shouldReceive( 'prepare' )->andReturn( 'sql' );
		$wpdb->shouldReceive( 'get_results' )->once()->andReturn( [ $lead ] );

		// Lead::delete cascade: EmailLogger::deleteByLead + Lead::delete.
		$wpdb->shouldReceive( 'delete' )
			->once()
			->with( 'wp_resa_email_log', [ 'lead_id' => 42 ], [ '%d' ] )
			->andReturn( 1 );
		$wpdb->shouldReceive( 'delete' )
			->once()
			->with( 'wp_resa_leads', [ 'id' => 42 ], [ '%d' ] )
			->andReturn( 1 );

		$result = PersonalDataEraser::erase( 'max@example.com' );

		$this->assertSame( 1, $result['items_removed'] );
		$this->assertSame( 0, $result['items_retained'] );
		$this->assertTrue( $result['done'] );
	}

	// ── Erase with Anonymize ─────────────────────────────────

	public function test_erase_anonymisiert_wenn_einstellung_anonymize(): void {
		global $wpdb;

		Functions\when( 'is_email' )->justReturn( true );
		Functions\when( 'get_option' )->alias( function ( $key, $default = '' ) {
			if ( $key === 'resa_privacy_settings' ) {
				return [
					'anonymize_instead_of_delete' => true,
					'retention_days'              => 365,
				];
			}
			return $default;
		} );

		$lead = (object) [ 'id' => 42, 'email' => 'max@example.com' ];

		// Lead::findByEmail.
		$wpdb->shouldReceive( 'prepare' )->andReturn( 'sql' );
		$wpdb->shouldReceive( 'get_results' )->once()->andReturn( [ $lead ] );

		// Lead::anonymize cascade: EmailLogger::deleteByLead + Lead::update.
		$wpdb->shouldReceive( 'delete' )
			->once()
			->with( 'wp_resa_email_log', [ 'lead_id' => 42 ], [ '%d' ] )
			->andReturn( 1 );
		$wpdb->shouldReceive( 'update' )
			->once()
			->with(
				'wp_resa_leads',
				Mockery::on( fn( $data ) =>
					$data['status'] === 'anonymized' &&
					$data['first_name'] === null &&
					$data['email'] === null
				),
				[ 'id' => 42 ],
				Mockery::type( 'array' ),
				[ '%d' ]
			)
			->andReturn( 1 );

		$result = PersonalDataEraser::erase( 'max@example.com' );

		$this->assertSame( 0, $result['items_removed'] );
		$this->assertSame( 1, $result['items_retained'] );
		$this->assertCount( 1, $result['messages'] );
		$this->assertTrue( $result['done'] );
	}

	// ── Erase Invalid Email ──────────────────────────────────

	public function test_erase_ungueltige_email(): void {
		Functions\when( 'is_email' )->justReturn( false );

		$result = PersonalDataEraser::erase( 'invalid' );

		$this->assertSame( 0, $result['items_removed'] );
		$this->assertSame( 0, $result['items_retained'] );
		$this->assertTrue( $result['done'] );
	}
}
