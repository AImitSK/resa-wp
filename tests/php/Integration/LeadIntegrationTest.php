<?php

declare( strict_types=1 );

namespace Resa\Tests\Integration;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Models\Lead;

/**
 * Integration test: Lead CRUD lifecycle (Create → Read → Update → Delete).
 *
 * Tests the two-phase lead capture flow and cascading operations.
 */
class LeadIntegrationTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';

		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\when( 'sanitize_email' )->returnArg();
		Functions\when( 'sanitize_textarea_field' )->returnArg();
		Functions\when( 'sanitize_key' )->returnArg();
		Functions\when( 'absint' )->alias( fn( $v ) => abs( (int) $v ) );
		Functions\when( 'wp_json_encode' )->alias( 'json_encode' );
		Functions\when( 'current_time' )->justReturn( '2025-06-01 12:00:00' );
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	// ── Phase 1: Partial Lead ─────────────────────────────────

	public function test_createPartial_erstellt_lead_mit_session_id(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'insert' )
			->once()
			->with(
				'wp_resa_leads',
				Mockery::on( fn( $data ) =>
					$data['session_id'] === 'uuid-123' &&
					$data['status'] === 'partial' &&
					$data['asset_type'] === 'rent-calculator' &&
					$data['location_id'] === 1
				),
				Mockery::type( 'array' )
			)
			->andReturnUsing( function () use ( $wpdb ) {
				$wpdb->insert_id = 42;
				return 1;
			} );

		$id = Lead::createPartial( [
			'session_id'  => 'uuid-123',
			'asset_type'  => 'rent-calculator',
			'location_id' => 1,
			'inputs'      => [ 'rooms' => 3 ],
			'result'      => null,
			'meta'        => [ 'page_url' => 'https://example.com' ],
		] );

		$this->assertSame( 42, $id );
	}

	public function test_createPartial_gibt_false_bei_db_fehler(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'insert' )->once()->andReturn( false );

		$result = Lead::createPartial( [ 'session_id' => 'uuid-fail' ] );

		$this->assertFalse( $result );
	}

	// ── Phase 2: Complete Lead ────────────────────────────────

	public function test_complete_aktualisiert_partial_lead(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'update' )
			->once()
			->with(
				'wp_resa_leads',
				Mockery::on( fn( $data ) =>
					$data['status'] === 'new' &&
					$data['first_name'] === 'Max' &&
					$data['email'] === 'max@example.com' &&
					$data['consent_given'] === 1
				),
				Mockery::on( fn( $where ) =>
					$where['session_id'] === 'uuid-123' &&
					$where['status'] === 'partial'
				),
				Mockery::type( 'array' ),
				Mockery::type( 'array' )
			)
			->andReturn( 1 );

		$result = Lead::complete( 'uuid-123', [
			'first_name'   => 'Max',
			'last_name'    => 'Mustermann',
			'email'        => 'max@example.com',
			'phone'        => '+49 170 1234567',
			'consent_text' => 'Ich stimme zu.',
		] );

		$this->assertTrue( $result );
	}

	public function test_complete_gibt_false_bei_fehlender_session(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'update' )->once()->andReturn( false );

		$result = Lead::complete( 'nonexistent', [ 'first_name' => 'Test' ] );

		$this->assertFalse( $result );
	}

	// ── Read ─────────────────────────────────────────────────

	public function test_findById_gibt_lead_zurueck(): void {
		global $wpdb;

		$lead = (object) [
			'id'         => 42,
			'session_id' => 'uuid-123',
			'first_name' => 'Max',
			'status'     => 'new',
		];

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'prepared-sql' );
		$wpdb->shouldReceive( 'get_row' )->with( 'prepared-sql' )->once()->andReturn( $lead );

		$result = Lead::findById( 42 );

		$this->assertSame( 'Max', $result->first_name );
		$this->assertSame( 'new', $result->status );
	}

	public function test_findBySession_gibt_lead_zurueck(): void {
		global $wpdb;

		$lead = (object) [
			'id'         => 42,
			'session_id' => 'uuid-123',
			'status'     => 'partial',
		];

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'prepared-sql' );
		$wpdb->shouldReceive( 'get_row' )->once()->andReturn( $lead );

		$result = Lead::findBySession( 'uuid-123' );

		$this->assertSame( 42, $result->id );
	}

	public function test_findById_gibt_null_fuer_nicht_existierend(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'prepared-sql' );
		$wpdb->shouldReceive( 'get_row' )->once()->andReturn( null );

		$this->assertNull( Lead::findById( 999 ) );
	}

	// ── Update ───────────────────────────────────────────────

	public function test_update_aendert_status_und_notes(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'update' )
			->once()
			->with(
				'wp_resa_leads',
				Mockery::on( fn( $data ) =>
					$data['status'] === 'contacted' &&
					$data['notes'] === 'Rückruf vereinbart'
				),
				[ 'id' => 42 ],
				Mockery::type( 'array' ),
				[ '%d' ]
			)
			->andReturn( 1 );

		$result = Lead::update( 42, [
			'status' => 'contacted',
			'notes'  => 'Rückruf vereinbart',
		] );

		$this->assertTrue( $result );
	}

	public function test_update_setzt_agent_id(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'update' )
			->once()
			->with(
				'wp_resa_leads',
				Mockery::on( fn( $data ) => $data['agent_id'] === 5 ),
				[ 'id' => 42 ],
				Mockery::type( 'array' ),
				[ '%d' ]
			)
			->andReturn( 1 );

		$this->assertTrue( Lead::update( 42, [ 'agent_id' => 5 ] ) );
	}

	public function test_update_gibt_false_fuer_leere_daten(): void {
		$this->assertFalse( Lead::update( 42, [] ) );
	}

	// ── Delete (Cascade) ─────────────────────────────────────

	public function test_delete_loescht_email_logs_und_lead(): void {
		global $wpdb;

		// EmailLogger::deleteByLead cascades first.
		$wpdb->shouldReceive( 'delete' )
			->once()
			->with( 'wp_resa_email_log', [ 'lead_id' => 42 ], [ '%d' ] )
			->andReturn( 2 );

		// Then lead itself.
		$wpdb->shouldReceive( 'delete' )
			->once()
			->with( 'wp_resa_leads', [ 'id' => 42 ], [ '%d' ] )
			->andReturn( 1 );

		$this->assertTrue( Lead::delete( 42 ) );
	}

	// ── Anonymize ────────────────────────────────────────────

	public function test_anonymize_entfernt_pii_behaelt_statistik(): void {
		global $wpdb;

		// Cascade email logs.
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
					$data['email'] === null &&
					$data['consent_given'] === 0
				),
				[ 'id' => 42 ],
				Mockery::type( 'array' ),
				[ '%d' ]
			)
			->andReturn( 1 );

		$this->assertTrue( Lead::anonymize( 42 ) );
	}

	// ── Stats ────────────────────────────────────────────────

	public function test_getStats_aggregiert_nach_status(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'get_results' )
			->once()
			->andReturn( [
				(object) [ 'status' => 'new', 'count' => '5' ],
				(object) [ 'status' => 'contacted', 'count' => '3' ],
				(object) [ 'status' => 'completed', 'count' => '2' ],
			] );

		// countByStatus('partial') is called inside getStats().
		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'prepared' );
		$wpdb->shouldReceive( 'get_var' )->with( 'prepared' )->once()->andReturn( '1' );

		$stats = Lead::getStats();

		$this->assertSame( 10, $stats['all'] );
		$this->assertSame( 5, $stats['new'] );
		$this->assertSame( 3, $stats['contacted'] );
		$this->assertSame( 2, $stats['completed'] );
		$this->assertSame( 0, $stats['lost'] );
		$this->assertSame( 1, $stats['partial'] );
	}

	// ── countByStatus ────────────────────────────────────────

	public function test_countByStatus_gibt_anzahl_zurueck(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'prepared' );
		$wpdb->shouldReceive( 'get_var' )->with( 'prepared' )->once()->andReturn( '7' );

		$this->assertSame( 7, Lead::countByStatus( 'new' ) );
	}

	// ── findByEmail (Privacy) ────────────────────────────────

	public function test_findByEmail_paginiert_korrekt(): void {
		global $wpdb;

		$leads = [
			(object) [ 'id' => 1, 'email' => 'test@example.com' ],
			(object) [ 'id' => 2, 'email' => 'test@example.com' ],
		];

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'prepared' );
		$wpdb->shouldReceive( 'get_results' )->once()->andReturn( $leads );

		$result = Lead::findByEmail( 'test@example.com' );

		$this->assertCount( 2, $result['items'] );
		$this->assertTrue( $result['done'] );
	}
}
