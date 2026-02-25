<?php

declare( strict_types=1 );

namespace Resa\Tests\Unit\Models;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use Resa\Models\Lead;

class LeadTest extends TestCase {

	use MockeryPHPUnitIntegration;

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		// Mock global $wpdb.
		global $wpdb;
		$wpdb         = Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	public function test_createPartial_gibt_insert_id_zurueck(): void {
		global $wpdb;

		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'wp_json_encode' )->andReturnUsing( 'json_encode' );
		Functions\expect( 'current_time' )->andReturn( '2025-01-01 12:00:00' );
		Functions\expect( 'absint' )->andReturnUsing( 'intval' );

		$wpdb->shouldReceive( 'insert' )
			->once()
			->andReturnUsing( function () use ( $wpdb ) {
				$wpdb->insert_id = 42;
				return 1;
			} );

		$id = Lead::createPartial(
			[
				'session_id' => 'abc-123',
				'asset_type' => 'rent-calculator',
				'inputs'     => [ 'property_type' => 'apartment' ],
			]
		);

		$this->assertSame( 42, $id );
	}

	public function test_createPartial_gibt_false_bei_fehler_zurueck(): void {
		global $wpdb;

		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'wp_json_encode' )->andReturnUsing( 'json_encode' );
		Functions\expect( 'current_time' )->andReturn( '2025-01-01 12:00:00' );
		Functions\expect( 'absint' )->andReturnUsing( 'intval' );

		$wpdb->shouldReceive( 'insert' )->once()->andReturn( false );

		$result = Lead::createPartial(
			[
				'session_id' => 'abc-123',
				'asset_type' => 'rent-calculator',
			]
		);

		$this->assertFalse( $result );
	}

	public function test_complete_aktualisiert_lead_auf_new(): void {
		global $wpdb;

		Functions\expect( 'sanitize_text_field' )->andReturnFirstArg();
		Functions\expect( 'sanitize_email' )->andReturnFirstArg();
		Functions\expect( 'sanitize_textarea_field' )->andReturnFirstArg();
		Functions\expect( 'current_time' )->andReturn( '2025-01-01 13:00:00' );

		$wpdb->shouldReceive( 'update' )
			->once()
			->with(
				'wp_resa_leads',
				Mockery::on( function ( array $data ): bool {
					return $data['status'] === 'new'
						&& $data['first_name'] === 'Max'
						&& $data['email'] === 'max@test.de'
						&& $data['consent_given'] === 1;
				} ),
				Mockery::on( function ( array $where ): bool {
					return $where['session_id'] === 'abc-123'
						&& $where['status'] === 'partial';
				} ),
				Mockery::any(),
				Mockery::any()
			)
			->andReturn( 1 );

		$success = Lead::complete(
			'abc-123',
			[
				'first_name'   => 'Max',
				'email'        => 'max@test.de',
				'consent_text' => 'Ich stimme zu.',
			]
		);

		$this->assertTrue( $success );
	}

	public function test_findBySession_gibt_lead_zurueck(): void {
		global $wpdb;

		$lead = (object) [
			'id'         => 1,
			'session_id' => 'abc-123',
			'status'     => 'partial',
		];

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'PREPARED_SQL' );
		$wpdb->shouldReceive( 'get_row' )->once()->andReturn( $lead );

		$result = Lead::findBySession( 'abc-123' );

		$this->assertSame( 1, $result->id );
		$this->assertSame( 'partial', $result->status );
	}

	public function test_findBySession_gibt_null_wenn_nicht_gefunden(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'PREPARED_SQL' );
		$wpdb->shouldReceive( 'get_row' )->once()->andReturn( null );

		$result = Lead::findBySession( 'nonexistent' );

		$this->assertNull( $result );
	}

	public function test_findById_gibt_lead_zurueck(): void {
		global $wpdb;

		$lead = (object) [ 'id' => 5, 'status' => 'new' ];

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'PREPARED_SQL' );
		$wpdb->shouldReceive( 'get_row' )->once()->andReturn( $lead );

		$result = Lead::findById( 5 );

		$this->assertSame( 5, $result->id );
	}

	public function test_countByStatus_gibt_anzahl_zurueck(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'PREPARED_SQL' );
		$wpdb->shouldReceive( 'get_var' )->once()->andReturn( '15' );

		$count = Lead::countByStatus( 'new' );

		$this->assertSame( 15, $count );
	}
}
